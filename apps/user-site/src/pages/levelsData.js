// Единый источник данных о правилах программы: уровни, матрица начислений,
// дополнительные бонусы и правила зачёта по физическому воспитанию.
//
// /levels (страница «Правила и уровни») и вкладка «Достижения» в профиле
// сначала пытаются получить уровни из API (GET /levels), а при ошибке
// используют LEVELS_FALLBACK отсюда. Так публичная страница правил
// всегда заполнена, даже когда бэкенд недоступен.

/*
 * Шесть уровней программы «Сибирские Львы». Пороги и проценты совпадают
 * с данными главной страницы (HomePage) и уведомлений:
 *   - лестница «от Бронзового до Сибирского льва» — копия с главной;
 *   - «Золотой лев» — 5-й уровень (levelId: 5 в уведомлении о level_up);
 *   - скидка 10% в ФОЦ на верхнем уровне (блок «Награды» на главной).
 */
export const LEVELS_FALLBACK = [
  {
    id: 1,
    name: "Львёнок",
    min_points: 0,
    bonus_percent: 2,
    color: "#5aa05a",
    prize: "Стартовый значок в профиле",
    privileges: ["Стартовый значок в профиле"],
  },
  {
    id: 2,
    name: "Медный лев",
    min_points: 500,
    bonus_percent: 7,
    color: "#b87333",
    prize: "Приоритетная запись на мероприятия",
    privileges: ["Приоритетная запись на мероприятия"],
  },
  {
    id: 3,
    name: "Бронзовый лев",
    min_points: 1200,
    bonus_percent: 10,
    color: "#cd7f32",
    prize: "Доступ к закрытым мероприятиям клуба",
    privileges: ["Доступ к закрытым мероприятиям клуба"],
  },
  {
    id: 4,
    name: "Серебряный лев",
    min_points: 2500,
    bonus_percent: 15,
    color: "#9ea7b3",
    prize: "Фирменный мерч спортклуба",
    privileges: ["Фирменный мерч спортклуба"],
  },
  {
    id: 5,
    name: "Золотой лев",
    min_points: 3500,
    bonus_percent: 17,
    color: "#d4a017",
    prize: "Скидка 10% в магазине мерча",
    privileges: ["Скидка 10% в магазине мерча"],
  },
  {
    id: 6,
    name: "Сибирский лев",
    min_points: 5000,
    bonus_percent: 20,
    color: "#003466",
    prize: "Скидка 10% в ФОЦ ТПУ",
    privileges: ["Скидка 10% в ФОЦ ТПУ"],
  },
];

/*
 * Приводим ответ API к единому виду. Бэкенд отдаёт поля
 * id / name / min_points / color / description / bonus_percent / privileges.
 * Столбец «приз» берём из privileges[0], при пустом — из фолбэка по id.
 */
export const normalizeLevel = (raw, index = 0) => {
  const fallback = LEVELS_FALLBACK[index] || {};
  return {
    id: raw.id ?? index + 1,
    name: raw.name || fallback.name || `Уровень ${index + 1}`,
    min_points: Number(
      raw.min_points ?? raw.minPoints ?? fallback.min_points ?? 0,
    ),
    bonus_percent: Number(
      raw.bonus_percent ?? raw.bonusPercent ?? fallback.bonus_percent ?? 0,
    ),
    color: raw.color || fallback.color || "#003466",
    description: raw.description || "",
    prize:
      raw.prize ||
      (Array.isArray(raw.privileges) && raw.privileges.length > 0
        ? raw.privileges[0]
        : fallback.prize || ""),
  };
};

export const normalizeLevels = (data) =>
  (Array.isArray(data) ? data : [])
    .map(normalizeLevel)
    .sort((a, b) => a.min_points - b.min_points);

/*
 * Матрица начислений: тип события × результат.
 * Участие / призёр / победитель: 20/30/40 → 45/65/90 → 90/130/170.
 */
export const POINTS_MATRIX = {
  columns: [
    {
      key: "participant",
      label: "Участие",
      hint: "Выступал за команду или в личном зачёте",
    },
    { key: "runnerUp", label: "Призёр", hint: "2–3 место или финалист" },
    { key: "winner", label: "Победитель", hint: "1 место в турнире" },
  ],
  rows: [
    {
      key: "internal",
      label: "События спортклуба",
      hint: "Открытые тренировки, внутренние лиги и кубки спортклуба",
      values: [20, 30, 40],
    },
    {
      key: "university",
      label: "Университетские события",
      hint: "Турниры между факультетами и институтами ТПУ",
      values: [45, 65, 90],
    },
    {
      key: "city",
      label: "Городские и региональные старты",
      hint: "Соревнования города, области и межвузовские старты",
      values: [90, 130, 170],
    },
  ],
};

// Дополнительные бонусы — суммируются с базовыми баллами за событие
export const EXTRA_BONUSES = [
  {
    key: "captain",
    title: "Капитан команды",
    points: 30,
    hint: "За каждое событие, где вы заявлены капитаном",
  },
  {
    key: "nomination",
    title: "Номинация",
    points: 70,
    hint: "MVP, лучший бомбардир, «открытие турнира» и другие индивидуальные номинации",
  },
  {
    key: "team",
    title: "Сборная ТПУ",
    points: 100,
    hint: "Разовый бонус за вхождение в состав сборной университета",
  },
];

/*
 * Правила зачёта по физическому воспитанию: какие типы событий дают
 * бонус и как он считается. Пункты п.1–п.7 соответствуют регламенту
 * спортклуба; ранее они упоминались в блоке бонусов физ-ры профиля.
 */
export const PE_RULES = {
  countable: [
    { point: "п. 1", text: "Посещение события в качестве зрителя" },
    { point: "п. 4", text: "Отдельные мероприятия уровня «Университет»" },
    { point: "п. 5", text: "Топ-мероприятия университета сезона" },
    { point: "п. 6", text: "Участие капитаном команды" },
    { point: "п. 7", text: "Обладание индивидуальной номинацией" },
  ],
  rounding: "Итоговый бонус за семестр округляется до 0,5 балла",
  fixation:
    "Процент бонуса фиксируется в момент начисления; при повышении уровня прошлые начисления не пересчитываются",
};
