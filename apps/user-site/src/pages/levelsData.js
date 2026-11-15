// Единый источник данных о правилах программы: уровни, матрица начислений,
// дополнительные бонусы и правила зачёта по физическому воспитанию.
//
// /levels (страница «Правила и уровни») и вкладка «Достижения» в профиле
// сначала пытаются получить уровни из API (GET /levels), а при ошибке
// используют LEVELS_FALLBACK отсюда. Так публичная страница правил
// всегда заполнена, даже когда бэкенд недоступен.
//
// КОНТРАКТ ПОЛЕЙ — camelCase, ровно как в модели Prisma:
//   Level { id, name, minPoints, description, bonusPercent, prize, color }
// Никаких min_points / bonus_percent во фронте: всё, что читает уровни,
// обязано использовать minPoints / bonusPercent. Баланс пользователя —
// только User.totalPoints (поля user.points в БД нет).

/*
 * Шесть уровней программы «Сибирские Львы» — Таблица уровней (эталон):
 *
 *   Уровень              | Баллы для перехода | Приз за переход              | Бонусы
 *   Регистрация в клубе  | 0                  | —                            | 2% баллов с мероприятий дублируются в баллы по физической культуре (касается только п. 1, некоторых мероприятий п. 4, мероприятий п. 5–7)
 *   V «Бронзовый лев»    | 500                | Ручка                        | 7% (тот же текст)
 *   IV «Серебряный лев»  | 1200               | Блокнот                      | 10% (тот же текст)
 *   III «Золотой лев»    | 2500               | Сумка для обуви / Бутылка / Кепка | 15% (тот же текст)
 *   II «Платиновый лев»  | 3500               | Футболка                     | 17% (тот же текст) + скидка 10% на услуги ФОЦ (бассейн, тренажёрный зал)
 *   I «Сибирский лев»    | 5000               | Толстовка                    | 20% (тот же текст)
 *
 * Римская ступень (V…I) в name не хранится — она вычисляется по позиции
 * уровня в лестнице (см. getLevelTier в Profile/tabs/pointsUtils.js).
 * Текст бонуса лежит в description (колонка Level.description в БД).
 */

// Единый текст бонуса к физ-ре — одинаков для всех уровней, меняется только %
const peBonusText = (percent) =>
  `${percent}% баллов с мероприятий дублируются в баллы по физической культуре (касается только п. 1, некоторых мероприятий п. 4, мероприятий п. 5–7)`;

// Скидка ФОЦ — только у уровня «Платиновый лев»
const FOZ_DISCOUNT_TEXT =
  "Скидка 10% на услуги физкультурно-оздоровительного центра (бассейн, тренажёрный зал)";

export const LEVELS_FALLBACK = [
  {
    id: 1,
    name: "Регистрация в клубе",
    minPoints: 0,
    bonusPercent: 2,
    color: "#5aa05a",
    prize: null,
    description: peBonusText(2),
  },
  {
    id: 2,
    name: "Бронзовый лев",
    minPoints: 500,
    bonusPercent: 7,
    color: "#b87333",
    prize: "Ручка",
    description: peBonusText(7),
  },
  {
    id: 3,
    name: "Серебряный лев",
    minPoints: 1200,
    bonusPercent: 10,
    color: "#9ea7b3",
    prize: "Блокнот",
    description: peBonusText(10),
  },
  {
    id: 4,
    name: "Золотой лев",
    minPoints: 2500,
    bonusPercent: 15,
    color: "#d4a017",
    prize: "Сумка для обуви / Бутылка / Кепка",
    description: peBonusText(15),
  },
  {
    id: 5,
    name: "Платиновый лев",
    minPoints: 3500,
    bonusPercent: 17,
    color: "#7f8c9b",
    prize: "Футболка",
    description: `${peBonusText(17)} ${FOZ_DISCOUNT_TEXT}`,
  },
  {
    id: 6,
    name: "Сибирский лев",
    minPoints: 5000,
    bonusPercent: 20,
    color: "#003466",
    prize: "Толстовка",
    description: peBonusText(20),
  },
];

/*
 * Приводим ответ API к единому виду. Контракт бэкенда — camelCase
 * (id / name / minPoints / bonusPercent / color / description / prize),
 * как в модели Prisma. Для подстраховки принимаем и старые snake_case
 * поля (min_points, bonus_percent) — если где-то остался старый формат,
 * интерфейс не сломается, а не покажет undefined.
 * Колонку «приз» при пустом prize берём из privileges[0] (старый формат).
 */
export const normalizeLevel = (raw, index = 0) => {
  const fallback = LEVELS_FALLBACK[index] || {};
  return {
    id: raw?.id ?? fallback.id ?? index + 1,
    name: raw?.name || fallback.name || `Уровень ${index + 1}`,
    minPoints: Number(
      raw?.minPoints ?? raw?.min_points ?? fallback.minPoints ?? 0,
    ),
    bonusPercent: Number(
      raw?.bonusPercent ?? raw?.bonus_percent ?? fallback.bonusPercent ?? 0,
    ),
    color: raw?.color || fallback.color || "#003466",
    description: raw?.description || fallback.description || "",
    prize:
      raw?.prize ||
      (Array.isArray(raw?.privileges) && raw.privileges.length > 0
        ? raw.privileges[0]
        : fallback.prize || ""),
  };
};

export const normalizeLevels = (data) =>
  (Array.isArray(data) ? data : [])
    .map(normalizeLevel)
    .sort((a, b) => a.minPoints - b.minPoints);

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
