import React, { useEffect, useMemo, useState } from "react";
import "./ProfilePage.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../auth/useAuth";
import { apiRequest } from "../auth/apiClient";
import { ProfileSkeleton } from "../component/Skeleton";
import {
  OverviewTab,
  AchievementsTab,
  PointsTab,
  OrdersTab,
  SettingsTab,
} from "./tabs";
import { LEVELS_FALLBACK, normalizeLevels } from "../pages/levelsData";
import { useProfile } from "./useProfile";
import { ProfileDataProvider } from "./ProfileDataContext";
import ExitButton from "../component/ExitButton";

/*
 * Структура «хаба прогресса» (паттерн Duolingo + Steam):
 *   Обзор      — карточка уровня, прогресс до следующего, последние транзакции, ближайшая запись
 *   Достижения — личная лестница уровней и ачивки (правила — на публичной /levels)
 *   Баллы      — полная история транзакций с фильтрами
 *   Заказы     — текущие заказы со статусом + история
 *   Настройки  — уведомления email/push, данные ТПУ (только чтение), выход
 *
 * Активная вкладка живёт в URL (?tab=...) — ссылками можно делиться,
 * ссылки «Вся история» из Обзора ведут прямо на нужную вкладку.
 *
 * Данные профиля: useProfile (файл ./useProfile.js, GET /profile/me)
 * даёт свежий баланс и ФИО — authStore может отставать после покупок
 * и начислений. Плоские поля из /profile/me накладываются поверх
 * auth-пользователя; вложенные ТПУ-данные (userInfo) есть только в user.
 *
 * Раздача данных во вкладки: ProfileDataContext (файл ./ProfileDataContext.jsx).
 * Вкладки больше не получают пропсов — каждая берёт ровно то, что ей нужно,
 * хуком useProfileData(). Это устраняет рассинхрон: раньше одна вкладка
 * читала bonus_percent, другая minPoints, а Обзор показывал id уровня.
 */
const TABS = [
  { key: "overview", label: "Обзор", icon: "icon-home" },
  { key: "achievements", label: "Достижения", icon: "tab-ach" },
  { key: "points", label: "Баллы", icon: "tab-points" },
  { key: "orders", label: "Заказы", icon: "tab-orders" },
  { key: "settings", label: "Настройки", icon: "tab-settings" },
];

// Маппинг старых значений ?tab= на новые вкладки
const LEGACY_TAB_MAP = {
  statictick: "points", // «Статистика» была историей операций → «Баллы»
  notifications: "settings", // фид уведомлений больше не отдельная вкладка
  mypoints: "points",
};

const normalizeTab = (raw) => {
  const t = (raw || "overview").toLowerCase();
  if (TABS.some((x) => x.key === t)) return t;
  return LEGACY_TAB_MAP[t] || "overview";
};

const TAB_ICONS = {
  overview: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor" />
    </svg>
  ),
  achievements: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"
        fill="currentColor"
      />
    </svg>
  ),
  points: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2L15 9H22L16 14L19 21L12 16.5L5 21L8 14L2 9H9L12 2Z"
        fill="currentColor"
      />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"
        fill="currentColor"
      />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.61 3.61 0 0 1 8.4 12c0-1.98 1.62-3.6 3.6-3.6s3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  ),
};

function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = normalizeTab(searchParams.get("tab"));

  const switchTab = (key) => {
    setSearchParams(key === "overview" ? {} : { tab: key }, { replace: true });
  };

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [allLevels, setAllLevels] = useState([]);
  const [levelsLoading, setLevelsLoading] = useState(true);
  const { user, loading, logout } = useAuth();
  // Свежий профиль из GET /profile/me: баланс меняется после покупок
  // и начислений, а user из authStore обновляется реже
  const {
    profile,
    loading: profileLoading,
    refresh: refreshProfile,
  } = useProfile();
  const navigate = useNavigate();

  // Свежие плоские поля профиля поверх auth-пользователя.
  // Фильтруем null/undefined, чтобы пустые поля ТПУ-профиля не затирали
  // данные из auth-пользователя (userInfo и т.п. берутся только там)
  const mergedUser = useMemo(() => {
    if (!profile) return user;
    const fresh = Object.fromEntries(
      Object.entries(profile).filter(
        ([, value]) => value !== null && value !== undefined,
      ),
    );
    return { ...user, ...fresh };
  }, [user, profile]);

  // Баланс — только User.totalPoints (в модели БД поля user.points нет)
  const totalPoints = mergedUser?.totalPoints || 0;

  // Загрузка заказов
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await apiRequest("/profile/orders");
        setOrders(data);
      } catch (error) {
        console.error("Ошибка загрузки заказов:", error);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Загрузка уровней; при ошибке или пустом ответе бэкенда — локальный
  // фолбэк (Таблица уровней программы), чтобы лестница и карточка уровня
  // никогда не были пустыми
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const data = await apiRequest("/levels");
        const normalized = normalizeLevels(data);
        setAllLevels(
          normalized.length > 0 ? normalized : normalizeLevels(LEVELS_FALLBACK),
        );
      } catch (error) {
        console.error(
          "Ошибка загрузки уровней (использую локальный фолбэк):",
          error,
        );
        setAllLevels(normalizeLevels(LEVELS_FALLBACK));
      } finally {
        setLevelsLoading(false);
      }
    };
    fetchLevels();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Ошибка при выходе:", error);
      navigate("/", { replace: true });
    }
  };

  // ФИО из имеющихся полей: без отчества — из двух, пусто — из ТПУ или email
  const userFullName = useMemo(() => {
    const parts = [
      mergedUser?.lastName,
      mergedUser?.firstName,
      mergedUser?.middleName,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
    return mergedUser?.name || mergedUser?.email || "Пользователь";
  }, [mergedUser]);

  // Группа/институт приходят из ТПУ-данных auth-пользователя (userInfo),
  // в /profile/me их нет — поэтому читаем из user, а не из mergedUser
  const userGroup =
    user?.userInfo?.studyInfo?.data?.studies?.[0]?.gruppa || "8К32";
  const userInstitute =
    user?.userInfo?.studyInfo?.data?.studies?.[0]?.department || "ИШИТР";
  const shortInstitute = userInstitute.includes(
    "Инженерная школа информационных технологий",
  )
    ? "ИШИТР"
    : userInstitute;

  // Текущий уровень: последний уровень, чей порог (minPoints — camelCase,
  // как в модели Prisma и в ответе GET /levels) не выше баланса.
  const currentLevel = useMemo(() => {
    const sortedLevels = [...allLevels].sort(
      (a, b) => b.minPoints - a.minPoints,
    );
    return (
      sortedLevels.find((level) => totalPoints >= level.minPoints) ||
      allLevels[0] ||
      null
    );
  }, [allLevels, totalPoints]);

  // Следующий уровень (null — достигнут максимальный): считается один раз
  // здесь, чтобы вкладки не дублировали эту логику
  const nextLevel = useMemo(
    () => allLevels.find((level) => level.minPoints > totalPoints) || null,
    [allLevels, totalPoints],
  );

  // Личные достижения (пока захардкожены — бэкенд ещё не отдаёт их)
  const achievementsData = useMemo(
    () => [
      {
        id: 1,
        icon: "🏅",
        title: "Активный участник",
        description: "Посетил 10+ мероприятий",
        achieved: totalPoints >= 200,
      },
      {
        id: 2,
        icon: "🎓",
        title: "Отличник",
        description: "Высокая успеваемость",
        achieved: false,
      },
      {
        id: 3,
        icon: "🌟",
        title: "Звезда месяца",
        description: "Лучший студент ноября",
        achieved: false,
      },
      {
        id: 4,
        icon: "🔒",
        title: "Лидер курса",
        description: "Стань лучшим на потоке",
        achieved: false,
      },
    ],
    [totalPoints],
  );

  // Единый объект профиля для всех вкладок: собирается один раз здесь
  // и раздаётся через ProfileDataContext (см. ./ProfileDataContext.jsx).
  // Новое поле для вкладок добавляется только сюда.
  const profileData = {
    user: mergedUser,
    userFullName,
    userGroup,
    userInstitute: shortInstitute,
    totalPoints,
    currentLevel,
    nextLevel,
    allLevels,
    orders,
    achievements: achievementsData,
    logout: handleLogout,
    refreshProfile,
  };

  if (loading || profileLoading || levelsLoading || ordersLoading) {
    return (
      <div className="profile-page">
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <h1 className="profile-title">Личный кабинет</h1>
        <ExitButton onLogout={handleLogout} />
      </header>

      {/* Панель вкладок */}
      <div
        className="profile-tabs"
        role="tablist"
        aria-label="Разделы личного кабинета"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls="profile-tab-content"
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => switchTab(tab.key)}
          >
            <span className="tab-icon" aria-hidden="true">
              {TAB_ICONS[tab.key]}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      <div
        className="tab-content"
        id="profile-tab-content"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {/* Все вкладки берут данные из контекста — пропсы не нужны */}
        <ProfileDataProvider value={profileData}>
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "achievements" && <AchievementsTab />}
          {activeTab === "points" && <PointsTab />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "settings" && <SettingsTab />}
        </ProfileDataProvider>
      </div>
    </div>
  );
}

export default ProfilePage;
