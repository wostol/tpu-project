import React from "react";
import { Link } from "react-router-dom";
import styles from "./ProfileTabs.module.css";
import { pluralizePoints } from "./pointsUtils";

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
 */
const AchievementsTab = ({
  achievementsData,
  allLevels,
  totalPoints,
  currentLevel,
}) => {
  // Определяем статус для каждого уровня
  const getLevelStatus = (levelMinPoints) => {
    if (totalPoints >= levelMinPoints) return "completed";
    return "locked";
  };

  // Находим следующий уровень
  const getNextLevelMinPoints = () => {
    const nextLevel = allLevels.find((level) => level.minPoints > totalPoints);
    return nextLevel ? nextLevel.minPoints : totalPoints + 100;
  };

  return (
    <div className={styles.achievementsTab}>
      {/* БЛОК УРОВНЕЙ */}
      <div className={styles.levelsSection}>
        <h3 className={styles.levelsTitle}>Все уровни</h3>
        <div className={styles.levelsList}>
          {allLevels.map((level) => {
            const status = getLevelStatus(level.minPoints);
            const isCurrent = currentLevel?.id === level.id;
            const pointsNeeded =
              level.minPoints > totalPoints ? level.minPoints - totalPoints : 0;

            // Определяем цвет для кружка уровня
            let circleBackground;
            if (status === "completed") {
              circleBackground = `linear-gradient(135deg, ${level.color || "#003466"}, ${level.color || "#0056b3"})`;
            } else if (isCurrent) {
              circleBackground = `linear-gradient(135deg, #28a745, #20c997)`;
            } else {
              circleBackground = `linear-gradient(135deg, #e9ecef, #dee2e6)`;
            }

            return (
              <div
                key={level.id}
                className={`${styles.levelItem} ${styles[status]} ${isCurrent ? styles.current : ""}`}
              >
                <div
                  className={styles.levelCircle}
                  style={{ background: circleBackground }}
                  aria-hidden="true"
                >
                  {level.id}
                </div>
                <div className={styles.levelInfoBlock}>
                  <div className={styles.levelHeader}>
                    <h4 className={styles.levelName}>{level.name}</h4>
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
                    от {level.minPoints.toLocaleString("ru-RU")}{" "}
                    {pluralizePoints(level.minPoints)} · бонус к физ-ре +
                    {level.bonus_percent}%
                  </p>
                  {level.prize && (
                    <p className={styles.levelDescription}>
                      Награда: {level.prize}
                    </p>
                  )}
                  {!level.prize && level.description && (
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
        {achievementsData.map((achievement) => (
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
