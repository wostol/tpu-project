import React from "react";
import { Link } from "react-router-dom";
import styles from "./ProfileTabs.module.css";
import { useProfileData } from "../ProfileDataContext";
import { pluralizePoints, getLevelTier } from "./pointsUtils";

const RulesIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <path d="M9 7h7M9 11h7" />
  </svg>
);

/*
 * Вкладка «Достижения» — личная витрина (паттерн Steam):
 *  - лестница уровней с личным статусом (пройден / текущий / заблокирован);
 *  - приз и бонус к физ-ре для каждого уровня;
 *  - сетка достижений;
 *  - мост к публичной странице «Правила и уровни» (/levels), где лежат
 *    таблицы начислений и регламент — правила одинаковы для всех,
 *    здесь показан только личный прогресс по ним.
 *
 * Данные берутся из ProfileDataContext (useProfileData) — пропсы не нужны.
 *
 * ИСПРАВЛЕННЫЙ КРАШ (AchievementsTab.jsx:107 «Cannot read properties of
 * undefined (reading 'toLocaleString')»): вкладка читала level.minPoints,
 * хотя нормализованные уровни отдавали snake_case min_points, поэтому
 * minPoints был undefined. Теперь поля уровней везде camelCase (minPoints,
 * bonusPercent — как в модели Prisma и в GET /levels), плюс числовые поля
 * подстрахованы значениями по умолчанию — вкладка не упадёт, даже если
 * бэкенд вернёт неполный объект уровня.
 */
const AchievementsTab = () => {
  const { totalPoints, currentLevel, allLevels, achievements } =
    useProfileData();

  const levels = Array.isArray(allLevels) ? allLevels : [];
  const achievementsList = Array.isArray(achievements) ? achievements : [];

  // Определяем статус для каждого уровня
  const getLevelStatus = (levelMinPoints) => {
    if (totalPoints >= levelMinPoints) return "completed";
    return "locked";
  };

  return (
    <div className={styles.achievementsTab}>
      {/* БЛОК УРОВНЕЙ */}
      <div className={styles.levelsSection}>
        <h3 className={styles.levelsTitle}>Все уровни</h3>
        <div className={styles.levelsList}>
          {levels.map((level, index) => {
            // Подстраховка: числовые поля могут отсутствовать в ответе API
            const minPoints = Number(level?.minPoints ?? 0);
            const bonusPercent = Number(level?.bonusPercent ?? 0);
            const status = getLevelStatus(minPoints);
            const isCurrent = currentLevel?.id === level?.id;
            const pointsNeeded =
              minPoints > totalPoints ? minPoints - totalPoints : 0;

            // Ступень уровня на лестнице: римская цифра V…I из Таблицы
            // уровней (считается по позиции среди уровней, НЕ по id из БД);
            // для стартового «Регистрация в клубе» цифры нет — рисуем звезду
            const tier = getLevelTier(level, levels);

            // Определяем цвет для кружка уровня
            let circleBackground;
            if (status === "completed") {
              circleBackground = `linear-gradient(135deg, ${level?.color || "#003466"}, ${level?.color || "#0056b3"})`;
            } else if (isCurrent) {
              circleBackground = `linear-gradient(135deg, #28a745, #20c997)`;
            } else {
              circleBackground = `linear-gradient(135deg, #e9ecef, #dee2e6)`;
            }

            return (
              <div
                key={level?.id ?? index}
                className={`${styles.levelItem} ${styles[status]} ${isCurrent ? styles.current : ""}`}
              >
                <div
                  className={styles.levelCircle}
                  style={{ background: circleBackground }}
                  aria-hidden="true"
                >
                  {tier || "★"}
                </div>
                <div className={styles.levelInfoBlock}>
                  <div className={styles.levelHeader}>
                    <h4 className={styles.levelName}>
                      {level?.name || `Уровень ${index + 1}`}
                    </h4>
                    {status === "completed" && (
                      <span
                        className={`${styles.levelBadge} ${styles.completed}`}
                      >
                        ПРОЙДЕН
                      </span>
                    )}
                    {isCurrent && (
                      <span
                        className={`${styles.levelBadge} ${styles.current}`}
                      >
                        ТЕКУЩИЙ
                      </span>
                    )}
                    {status === "locked" && pointsNeeded > 0 && (
                      <span className={`${styles.levelBadge} ${styles.locked}`}>
                        ЕЩЁ {pointsNeeded} {pluralizePoints(pointsNeeded)}
                      </span>
                    )}
                  </div>
                  <p className={styles.levelPoints}>
                    от {minPoints.toLocaleString("ru-RU")}{" "}
                    {pluralizePoints(minPoints)} · бонус к физ-ре +
                    {bonusPercent}%
                  </p>
                  {level?.prize && (
                    <p className={styles.levelDescription}>
                      Награда: {level.prize}
                    </p>
                  )}
                  {level?.description && (
                    <p className={styles.levelDescription}>
                      {level.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* МОСТ К ПУБЛИЧНЫМ ПРАВИЛАМ */}
      <Link to="/levels" className={styles.rulesBridgeCard}>
        <span className={styles.rulesBridgeIcon}>
          <RulesIcon />
        </span>
        <span className={styles.rulesBridgeInfo}>
          <strong>Как начисляются баллы?</strong>
          <small>
            Таблицы начислений, бонусы капитана и сборной, правила зачёта по
            физкультуре — на странице «Правила и уровни»
          </small>
        </span>
        <span className={styles.rulesBridgeArrow} aria-hidden="true">
          →
        </span>
      </Link>

      {/* Сетка достижений */}
      <div className={styles.achievementsGrid}>
        {achievementsList.map((achievement) => (
          <div
            key={achievement.id}
            className={`${styles.achievementCard} ${!achievement.achieved ? styles.locked : ""}`}
          >
            <div className={styles.achievementIcon} aria-hidden="true">
              {achievement.achieved ? achievement.icon : "🔒"}
            </div>
            <h4>{achievement.title}</h4>
            <p>{achievement.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsTab;
