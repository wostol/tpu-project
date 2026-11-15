import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./ProfileTabs.module.css";
import { apiRequest } from "../../auth/apiClient";
import { useProfileData } from "../ProfileDataContext";
import {
  getTypeMeta,
  formatDate,
  formatEventDate,
  pluralizePoints,
  pointsToLevelText,
  getLevelTier,
} from "./pointsUtils";

/* ---------- иконки ---------- */
const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2L15 9H22L16 14L19 21L12 16.5L5 21L8 14L2 9H9L12 2Z" />
  </svg>
);

const PEIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
  </svg>
);

const GiftIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M8 2v4M16 2v4M3 10h18" />
    <rect x="3" y="4" width="18" height="18" rx="2" />
  </svg>
);

const ArrowIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* Приветствие по времени суток */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Доброе утро";
  if (h >= 12 && h < 18) return "Добрый день";
  return "Добрый вечер";
};

/*
 * Вкладка «Обзор» — хаб прогресса в духе Duolingo:
 * всё важное видно сразу, без переходов по вкладкам.
 *
 * Все данные берутся из ProfileDataContext (useProfileData) —
 * пропсы не нужны: user, totalPoints, currentLevel, nextLevel и
 * allLevels кладёт в контекст ProfilePage.
 */
const OverviewTab = () => {
  const {
    user,
    userFullName,
    userGroup,
    userInstitute,
    totalPoints,
    currentLevel,
    nextLevel,
    allLevels,
  } = useProfileData();

  const levelColor = currentLevel?.color || "#003466";
  // Бонус текущего уровня — camelCase, как в модели Prisma (bonusPercent)
  const bonusPercent = currentLevel?.bonusPercent || 0;

  /* --- следующий уровень и прогресс --- */
  const isMaxLevel = !nextLevel;
  const pointsNeeded = isMaxLevel
    ? 0
    : Math.max(0, nextLevel.minPoints - totalPoints);
  const prevMin = currentLevel?.minPoints || 0;
  const range = isMaxLevel ? 0 : nextLevel.minPoints - prevMin;
  const progress =
    isMaxLevel || range <= 0
      ? 100
      : Math.min(100, Math.max(0, ((totalPoints - prevMin) / range) * 100));

  /* --- ступень уровня на лестнице (римская цифра V…I из Таблицы уровней).
         Важно: это НЕ id из БД — id не совпадает со ступенью,
         из-за чего на Обзоре показывался «уровень 5» */
  const levelTier = getLevelTier(currentLevel, allLevels);

  /* --- ближайшая награда: приз следующего уровня --- */
  const nearestReward = nextLevel?.prize || "";

  /* --- последние транзакции --- */
  const [recent, setRecent] = useState(null); // null = loading
  useEffect(() => {
    let alive = true;
    apiRequest("/profile/points?page=1&limit=4")
      .then((data) => {
        if (!alive) return;
        const items = Array.isArray(data)
          ? data
          : (data?.data ?? data?.items ?? []);
        setRecent(items);
      })
      .catch(() => alive && setRecent([]));
    return () => {
      alive = false;
    };
  }, []);

  /* --- ближайшая запись --- */
  const [nearestEvent, setNearestEvent] = useState(null);
  const [eventsState, setEventsState] = useState("loading"); // loading | ready | error
  useEffect(() => {
    let alive = true;
    apiRequest("/events/my")
      .then((data) => {
        if (!alive) return;
        const events = Array.isArray(data) ? data : (data?.data ?? []);
        const upcoming = events
          .filter((e) => e.isRegistered && new Date(e.startDate) > new Date())
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        setNearestEvent(upcoming[0] || null);
        setEventsState("ready");
      })
      .catch(() => alive && setEventsState("error"));
    return () => {
      alive = false;
    };
  }, []);

  const firstName =
    user?.firstName || (userFullName || "").split(" ")[0] || "друг";

  return (
    <div className={styles.overviewTab}>
      {/* 1. ПРИВЕТСТВИЕ */}
      <section className={styles.greetingBlock} aria-label="Приветствие">
        <h2 className={styles.greetingTitle}>
          {getGreeting()}, {firstName}!
        </h2>
        <p className={styles.greetingSub}>
          {userGroup} · {userInstitute} — всё о вашем прогрессе на одной
          странице
        </p>
      </section>

      {/* 2. КАРТОЧКА УРОВНЯ (Duolingo) */}
      <section
        className={styles.levelHeroCard}
        style={{
          background: `linear-gradient(135deg, ${levelColor} 0%, ${levelColor}cc 100%)`,
        }}
        aria-label="Карточка уровня"
      >
        <div className={styles.levelHeroTop}>
          <div className={styles.levelHeroBadge} aria-hidden="true">
            {/* Ступень уровня (V…I) или звезда для стартового «Регистрация в клубе».
                Никаких id из БД — раньше здесь выводился level.id («уровень 5») */}
            {levelTier || "★"}
          </div>
          <div className={styles.levelHeroInfo}>
            <p className={styles.levelHeroKicker}>Ваш уровень</p>
            <h3 className={styles.levelHeroName}>
              {currentLevel?.name || "Регистрация в клубе"}
            </h3>
          </div>
          <div className={styles.levelHeroBalance}>
            <span className={styles.levelHeroBalanceValue}>{totalPoints}</span>
            <span className={styles.levelHeroBalanceLabel}>
              {pluralizePoints(totalPoints)} на балансе
            </span>
          </div>
        </div>

        {/* Прогресс до следующего уровня */}
        <div className={styles.levelHeroProgress}>
          {isMaxLevel ? (
            <p className={styles.levelHeroProgressText} role="status">
              Максимальный уровень достигнут — все награды открыты!
            </p>
          ) : (
            <>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                aria-label={`${pointsToLevelText(pointsNeeded, nextLevel?.name)}. Прогресс ${Math.round(progress)}%`}
                className={styles.levelHeroBar}
              >
                <div
                  className={styles.levelHeroBarFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className={styles.levelHeroProgressText}>
                <strong>
                  {pointsToLevelText(pointsNeeded, nextLevel?.name)}
                </strong>
                <span className={styles.levelHeroProgressRange}>
                  {" "}
                  · {totalPoints} / {nextLevel.minPoints}
                </span>
              </p>
            </>
          )}
        </div>

        {/* Метрики: баланс, бонус к физ-ре, ближайшая награда */}
        <div className={styles.levelHeroMetrics}>
          <div className={styles.levelHeroMetric}>
            <span className={styles.levelHeroMetricIcon}>
              <StarIcon />
            </span>
            <span className={styles.levelHeroMetricLabel}>Бонус к физ-ре</span>
            <span className={styles.levelHeroMetricValue}>
              +{bonusPercent}%
            </span>
          </div>
          <div className={styles.levelHeroMetric}>
            <span className={styles.levelHeroMetricIcon}>
              <PEIcon />
            </span>
            <span className={styles.levelHeroMetricLabel}>Статус</span>
            <span className={styles.levelHeroMetricValue}>Учащийся ТПУ</span>
          </div>
          <div className={styles.levelHeroMetric}>
            <span className={styles.levelHeroMetricIcon}>
              <GiftIcon />
            </span>
            <span className={styles.levelHeroMetricLabel}>
              Ближайшая награда
            </span>
            <span className={styles.levelHeroMetricValue}>
              {isMaxLevel ? "Все открыты" : nearestReward || "—"}
            </span>
          </div>
        </div>
      </section>

      {/* 3. ПОСЛЕДНИЕ ТРАНЗАКЦИИ + БЛИЖАЙШАЯ ЗАПИСЬ */}
      <div className={styles.overviewGrid}>
        <section
          className={styles.overviewPanel}
          aria-label="Последние транзакции"
        >
          <div className={styles.overviewPanelHead}>
            <h3>Последние транзакции</h3>
            <Link to="/profile?tab=points" className={styles.overviewPanelLink}>
              Вся история <ArrowIcon />
            </Link>
          </div>

          {recent === null ? (
            <p className={styles.overviewEmptyText}>Загрузка…</p>
          ) : recent.length === 0 ? (
            <p className={styles.overviewEmptyText}>
              Пока нет операций — запишитесь на мероприятие и получите первые
              баллы.
            </p>
          ) : (
            <ul className={styles.recentList}>
              {recent.map((item) => {
                const isPositive = item.points > 0;
                const meta = getTypeMeta(item.reason, item.points);
                const date = formatDate(item.createdAt);
                return (
                  <li key={item.id} className={styles.recentItem}>
                    <div className={styles.recentItemInfo}>
                      <p className={styles.recentItemTitle}>
                        {item.reason || "Операция"}
                      </p>
                      <p className={styles.recentItemMeta}>
                        {meta.label} · {date.day} {date.month}
                      </p>
                    </div>
                    <span
                      className={`${styles.recentItemPoints} ${isPositive ? styles.income : styles.expense}`}
                    >
                      {isPositive ? "+" : ""}
                      {item.points}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={styles.overviewPanel} aria-label="Ближайшая запись">
          <div className={styles.overviewPanelHead}>
            <h3>Ближайшая запись</h3>
            <Link to="/favorites" className={styles.overviewPanelLink}>
              Мои мероприятия <ArrowIcon />
            </Link>
          </div>

          {eventsState === "loading" ? (
            <p className={styles.overviewEmptyText}>Загрузка…</p>
          ) : eventsState === "error" ? (
            <p className={styles.overviewEmptyText}>
              Не удалось загрузить записи. Проверьте соединение с сервером.
            </p>
          ) : nearestEvent ? (
            <div className={styles.nearestEventCard}>
              <span className={styles.nearestEventIcon}>
                <CalendarIcon />
              </span>
              <div className={styles.nearestEventInfo}>
                <p className={styles.nearestEventTitle}>{nearestEvent.title}</p>
                <p className={styles.nearestEventMeta}>
                  {formatEventDate(nearestEvent.startDate)} ·{" "}
                  {nearestEvent.location}
                </p>
                <span className={styles.nearestEventBadge}>
                  Вы записаны как{" "}
                  {nearestEvent.role === "fan" ? "зритель" : "участник"}
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.nearestEventEmpty}>
              <span className={styles.nearestEventIcon} aria-hidden="true">
                <CalendarIcon />
              </span>
              <p className={styles.overviewEmptyText}>
                Активных записей нет — выберите событие и получите баллы.
              </p>
              <Link to="/events" className={styles.nearestEventCta}>
                Мероприятия <ArrowIcon />
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* 4. БЫСТРЫЕ ССЫЛКИ */}
      <nav className={styles.quickLinks} aria-label="Быстрые ссылки">
        <Link to="/events" className={styles.quickLink}>
          <span className={styles.quickLinkIcon}>
            <CalendarIcon />
          </span>
          <span>
            <strong>Мероприятия</strong>
            <small>Записаться и получить баллы</small>
          </span>
        </Link>
        <Link to="/shop" className={styles.quickLink}>
          <span className={styles.quickLinkIcon}>
            <GiftIcon />
          </span>
          <span>
            <strong>Магазин</strong>
            <small>Обменять баллы на мерч</small>
          </span>
        </Link>
        <Link to="/levels" className={styles.quickLink}>
          <span className={styles.quickLinkIcon}>
            <StarIcon />
          </span>
          <span>
            <strong>Правила и уровни</strong>
            <small>Как начисляются баллы</small>
          </span>
        </Link>
      </nav>
    </div>
  );
};

export default OverviewTab;
