/*
 * Логика блока «Мероприятия» в подвале — отдельно от JSX.
 *
 * Почему отдельный модуль:
 *   - чистые функции можно тестировать без React и мокать fetch;
 *   - подвал и страница мероприятий используют разные выборки
 *     (подвалу нужны ближайшие 3, странице — полный список).
 *
 * Закрытые замечания ревью:
 *   1. Нормализация ДО сортировки: записи без идентификатора, без даты
 *      или с битой датой (NaN) отфильтровываются — иначе NaN при вычитании
 *      даёт нестабильный порядок сортировки и «Invalid Date» в интерфейсе.
 *   2. Фолбэк названия: пустой/не-строковый title заменяется на
 *      «Без названия», обрезаются пробелы.
 *   3. ФИКСАЦИЯ РЕШЕНИЯ ПО ПУСТОМУ UPCOMING — вариант (б):
 *      сначала ближайшие предстоящие (по возрастанию даты — что раньше,
 *      то выше); если их меньше трёх, колонка добирается последними
 *      прошедшими, но каждая прошедшая запись несёт status: "finished"
 *      и в разметке помечается текстовым статусом «Завершено» (раунд 2:
 *      рамка-пилюля читалась кнопкой — ложная аффорданса), т. е. прошедшее
 *      никогда не подсовывается молча как активное. Молчаливая
 *      подмена (старое поведение) и скрытие колонки (вариант «г»)
 *      отклонены: колонка остаётся заполненной и честной по статусам.
 *   4. Кэш уровня модуля с TTL: подвал рендерится в Layout на каждой
 *      странице — без кэша каждый переход по меню был бы новым запросом
 *      списка событий к бэкенду. Плюс single-flight: параллельные
 *      монтирования (React StrictMode в dev монтирует эффект дважды)
 *      делят один запрос вместо двух.
 *   5. Формат дат единый: локаль ru-RU, месяц словами («12 июня»);
 *      год добавляется только если событие не в текущем году.
 */

export const EVENTS_LIMIT = 3;

/** Как долго подвал не дёргает бэкенд повторным запросом (5 минут). */
export const EVENTS_CACHE_TTL = 5 * 60 * 1000;

const FALLBACK_TITLE = "Без названия";

const toDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Нормализация ответа бэкенда: массив или { data: [...] } / { items: [...] }.
 * Возвращает отсортированный по возрастанию даты список валидных записей.
 */
export const parseEventsPayload = (payload) => {
  const raw = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : [];

  if (raw.length === 0) return [];

  return (
    raw
      .map((event) => ({
        // Бэкенд отдаёт uuid — допускаем id как совместимый вариант
        id: event?.uuid ?? event?.id ?? null,
        title:
          typeof event?.title === "string" && event.title.trim()
            ? event.title.trim()
            : FALLBACK_TITLE,
        startDate: toDateOrNull(event?.startDate ?? event?.start_date),
      }))
      // Валидация ДО сортировки: битые записи исключаются целиком,
      // а не ломают порядок и разметку
      .filter((event) => event.id != null && event.startDate !== null)
      .sort((a, b) => a.startDate - b.startDate)
  );
};

/**
 * Выборка для подвала: предстоящие по возрастанию, добор прошедшими
 * (новые — выше) с пометкой status: "finished". См. фиксацию (б) выше.
 *
 * Функция самодостаточна: сама отфильтровывает невалидные записи
 * и сортирует по возрастанию даты — контракт не зависит от того,
 * отсортирован ли вход.
 */
export const selectFooterEvents = (events, now = new Date()) => {
  const sorted = (Array.isArray(events) ? events : [])
    .filter(
      (event) =>
        event?.startDate instanceof Date &&
        !Number.isNaN(event.startDate.getTime()),
    )
    .sort((a, b) => a.startDate - b.startDate);

  const upcoming = sorted
    .filter((event) => event.startDate.getTime() >= now.getTime())
    .slice(0, EVENTS_LIMIT)
    .map((event) => ({ ...event, status: "upcoming" }));

  const missing = EVENTS_LIMIT - upcoming.length;
  const past =
    missing > 0
      ? sorted
          .filter((event) => event.startDate.getTime() < now.getTime())
          .slice(-missing) // отсортировано по возрастанию → берём последние
          .reverse() // свежие прошедшие — выше
          .map((event) => ({ ...event, status: "finished" }))
      : [];

  return [...upcoming, ...past];
};

/**
 * «12 июня» или «12 июня 2027», если событие не в текущем году.
 * Единое форматирование дат для подвала (локаль ru, месяц словами).
 */
export const formatEventDate = (date, today = new Date()) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const options = { day: "numeric", month: "long" };
  if (date.getFullYear() !== today.getFullYear()) options.year = "numeric";
  return date.toLocaleDateString("ru-RU", options);
};

/*
 * Кэш уровня модуля + дедупликация одновременных запросов.
 * Живут столько, сколько живёт страница (SPA) — переживают
 * переходы по меню и повторные монтирования подвала.
 */
let cache = { events: null, fetchedAt: 0 };
let inFlight = null;

/** Тестам: сброс состояния кэша между сценариями. */
export const resetEventsCacheForTests = () => {
  cache = { events: null, fetchedAt: 0 };
  inFlight = null;
};

/**
 * Единая точка загрузки мероприятий для подвала.
 * @param {() => Promise<unknown>} fetchEvents — запрос к API
 *        (в Footer передаётся () => apiRequest("/events", { method: "GET" })).
 * @returns {Promise<Array>} выбранная тройка событий с полями status.
 */
export const loadFooterEvents = async (fetchEvents) => {
  const now = Date.now();
  if (cache.events && now - cache.fetchedAt < EVENTS_CACHE_TTL) {
    return cache.events; // свежий кэш — запрос не нужен
  }

  if (!inFlight) {
    inFlight = (async () => {
      try {
        const payload = await fetchEvents();
        cache = {
          events: selectFooterEvents(parseEventsPayload(payload)),
          fetchedAt: Date.now(),
        };
        return cache.events;
      } finally {
        // Успех или ошибка — слот «полёта» освобождается,
        // следующее монтирование сможет повторить попытку
        inFlight = null;
      }
    })();
  }

  return inFlight;
};
