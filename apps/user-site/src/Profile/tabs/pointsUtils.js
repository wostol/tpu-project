// Общие утилиты для вкладок профиля (Обзор, Баллы, Заказы).
// Раньше похожие функции дублировались в PointsHistory.jsx и OrdersTab.jsx —
// теперь здесь единый источник правды.

// В таблице PointsHistory нет поля type — категорию определяем
// по тексту reason, а приход/расход — по знаку points
export const getTypeMeta = (reason, points) => {
  const isPositive = points > 0;
  const r = (reason || "").toLowerCase();

  if (r.startsWith("покупка")) {
    return { label: "Покупка в магазине", role: "expense" };
  }
  if (r.includes("возврат")) {
    return { label: "Возврат средств", role: "income" };
  }
  if (
    r.includes("побед") ||
    r.includes("1 место") ||
    r.includes("первое место")
  ) {
    return { label: "Победа", role: "income" };
  }
  if (r.includes("приз") || r.includes("2 место") || r.includes("3 место")) {
    return { label: "Награда", role: "income" };
  }
  if (r.includes("бонус")) {
    return { label: "Бонус", role: "income" };
  }
  if (r.includes("капитан")) {
    return { label: "Капитанство", role: "income" };
  }
  if (r.includes("сборн")) {
    return { label: "Сборная ТПУ", role: "income" };
  }
  if (r.includes("номинац")) {
    return { label: "Номинация", role: "income" };
  }
  if (
    r.includes("регистрац") ||
    r.includes("посещен") ||
    r.includes("участ") ||
    r.includes("турнир") ||
    r.includes("мероприят")
  ) {
    return { label: "Мероприятие", role: "income" };
  }
  return {
    label: isPositive ? "Начисление" : "Списание",
    role: isPositive ? "income" : "expense",
  };
};

// «1 балл / 2 балла / 5 баллов / 11 баллов»
export const pluralizePoints = (n) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "баллов";
  if (m10 === 1) return "балл";
  if (m10 >= 2 && m10 <= 4) return "балла";
  return "баллов";
};

// Дата операции: «05» + «мая 2026» + «14:30»
export const formatDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: "--", month: "", time: "" };
  return {
    day: d.getDate().toString().padStart(2, "0"),
    month: d.toLocaleString("ru-RU", { month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

// Дата мероприятия: «15 мая, 15:00» (+ год, если не текущий)
export const formatEventDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
  });
  const time = d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const year = d.getFullYear();
  const nowYear = new Date().getFullYear();
  return year !== nowYear ? `${date} ${year}, ${time}` : `${date}, ${time}`;
};

/*
 * Родительный падеж названия уровня — для строки
 * «700 баллов до Золотого льва»:
 *   «Золотой лев»    → «Золотого льва»
 *   «Медный лев»     → «Медного льва»
 *   «Сибирский лев»  → «Сибирского льва»
 *   «Львёнок»        → «Львёнка»
 *   «Платина»        → «Платины»
 */
export const levelNameGenitive = (name) => {
  if (!name) return "следующего уровня";
  const n = String(name).trim();
  if (/львёнок$/i.test(n)) {
    const idx = n.search(/львёнок$/i);
    const head = n.slice(0, idx);
    const cap = head.length === 0;
    return head + (cap ? "Львёнка" : "львёнка");
  }
  // Твёрдые прилагательные: «Медный/Золотой лев» → «…ого льва»
  if (/ый лев$|ой лев$/i.test(n)) {
    return n.replace(/ый лев$|ой лев$/i, "ого льва");
  }
  // Мягкие прилагательные: «Сибирский лев» → «Сибирского льва»
  // (к/г/х/ж/ш/ч перед -ий дают «-ого», как сибирский → сибирского)
  if (/ий лев$/i.test(n)) {
    return n.replace(/ий лев$/i, "ого льва");
  }
  if (/ый$|ой$/i.test(n)) return n.replace(/ый$|ой$/i, "ого");
  if (/ний$/i.test(n)) return n.replace(/ний$/i, "него");
  if (/ая$/i.test(n)) return n.replace(/ая$/i, "ой");
  return `${n} (следующий уровень)`;
};

// Склонение для числительных: «осталось N баллов»
export const pointsToLevelText = (n, levelName) =>
  `${n} ${pluralizePoints(n)} до ${levelNameGenitive(levelName)}`;
