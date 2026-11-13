import React, { useState, useEffect } from "react";
import "./ProfilePage.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "../component/lionsib.svg";
import useAuth from "../auth/useAuth";
import { apiRequest } from "../auth/apiClient";
import { ProfileSkeleton } from "../component/Skeleton";
import {
  PointsTab,
  AchievementsTab,
  OrdersTab,
  StatisticsTab,
  NotificationsTab,
} from "./tabs";
import { useProfile } from "./useProfile"; // ← новый импорт

function ProfilePage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "achievements",
  );
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Auth — только для «залогинен ли» и базового user (email, ФИО, группа)
  const { user, loading: authLoading, logout } = useAuth();

  // ⭐ Баланс и уровни — из БД через GET /api/profile/me
  const { profile, loading: profileLoading } = useProfile();

  const navigate = useNavigate();

  // Загрузка заказов (осталась отдельным запросом — это список, не профиль)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await apiRequest("/profile/orders");
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Ошибка загрузки заказов:", error);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
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

  // ФИО и учебные данные — из auth.user (они статичны в сессии, баланс тут не нужен)
  const userFullName =
    user?.lastName && user?.firstName && user?.middleName
      ? `${user.lastName} ${user.firstName} ${user.middleName}`
      : user?.email || "Пользователь";

  const userGroup =
    user?.userInfo?.studyInfo?.data?.studies?.[0]?.gruppa || "8К32";
  const userInstitute =
    user?.userInfo?.studyInfo?.data?.studies?.[0]?.department || "ИШИТР";
  const shortInstitute = userInstitute.includes(
    "Инженерная школа информационных технологий",
  )
    ? "ИШИТР"
    : userInstitute;

  // Данные достижений (пока заглушка — потом отдельный эндпоинт)
  const achievementsList = {
    ach1: false,
    ach2: false,
    ach3: false,
    ach4: false,
  };
  const achievementsData = [
    {
      id: 1,
      icon: "🏅",
      title: "Активный участник",
      description: "Посетил 10+ мероприятий",
      achieved: achievementsList.ach1,
    },
    {
      id: 2,
      icon: "🎓",
      title: "Отличник",
      description: "Высокая успеваемость",
      achieved: achievementsList.ach2,
    },
    {
      id: 3,
      icon: "🌟",
      title: "Звезда месяца",
      description: "Лучший студент ноября",
      achieved: achievementsList.ach3,
    },
    {
      id: 4,
      icon: "🔒",
      title: "Лидер курса",
      description: "Стань лучшим на потоке",
      achieved: achievementsList.ach4,
    },
  ];

  // ⭐ Баланс и текущий уровень — ТОЛЬКО из profile (БД), никогда из user.totalPoints
  const totalPoints = profile?.totalPoints ?? 0;
  const currentLevel = profile?.level ?? null;
  const allLevels = profile?.levels ?? [];

  // Скелетон показываем, пока ждём auth + профиль + заказы.
  // Картинки больше не gate'ят рендер — SafeImage фолбэком подставит плейсхолдер.
  if (authLoading || profileLoading || ordersLoading) {
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
        <button className="profile-exit" onClick={handleLogout}>
          <span className="log-img">
            <img src={logo} alt="Выход" className="log" />
          </span>
          <span className="log-text">Выход</span>
        </button>
      </header>

      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === "points" ? "active" : ""}`}
          onClick={() => setActiveTab("points")}
        >
          Мои баллы
        </button>
        <button
          className={`tab-btn ${activeTab === "achievements" ? "active" : ""}`}
          onClick={() => setActiveTab("achievements")}
        >
          Достижения
        </button>
        <button
          className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Мои заказы
        </button>
        <button
          className={`tab-btn ${activeTab === "statictick" ? "active" : ""}`}
          onClick={() => setActiveTab("statictick")}
        >
          Статистика
        </button>
      </div>

      <div className="student-card">
        <div className="student-info">
          <h2 className="student-name">{userFullName}</h2>
          <p className="student-details">
            Учащийся | {userGroup} | {shortInstitute}
          </p>
        </div>
      </div>

      <div className="tab-content">
        {activeTab === "notifications" && <NotificationsTab />}

        {activeTab === "points" && (
          <PointsTab
            totalPoints={totalPoints}
            currentLevel={currentLevel}
            allLevels={allLevels}
          />
        )}

        {activeTab === "achievements" && (
          <AchievementsTab
            achievementsData={achievementsData}
            allLevels={allLevels}
            totalPoints={totalPoints}
            currentLevel={currentLevel}
          />
        )}

        {activeTab === "orders" && <OrdersTab orders={orders} />}

        {activeTab === "statictick" && <StatisticsTab />}
      </div>
    </div>
  );
}

export default ProfilePage;
