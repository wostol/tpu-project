import React, { useState } from "react";
import styles from "./ProfileTabs.module.css";
import PointsHistory from "./PointsHistory";
import { pluralizePoints } from "./pointsUtils";

const FILTERS = [
  { key: "all", label: "Все операции" },
  { key: "income", label: "Начисления" },
  { key: "expense", label: "Списания" },
];

/*
 * Вкладка «Баллы» — полная история транзакций с фильтрами.
 * Карточка уровня и прогресс переехали во вкладку «Обзор»,
 * привилегии — во вкладку «Достижения».
 */
const PointsTab = ({ totalPoints, currentLevel }) => {
  const [filter, setFilter] = useState("all");
  const bonusPercent = currentLevel?.bonus_percent || 0;
  const levelColor = currentLevel?.color || "#003466";

  return (
    <div className={styles.pointsTab}>
      {/* Сводка по балансу */}
      <div className={styles.pointsSummaryStrip}>
        <div className={styles.pointsSummaryCell}>
          <span className={styles.pointsSummaryLabel}>Баланс</span>
          <span className={styles.pointsSummaryValue}>
            {totalPoints} <small>{pluralizePoints(totalPoints)}</small>
          </span>
        </div>
        <div className={styles.pointsSummaryDivider} aria-hidden="true" />
        <div className={styles.pointsSummaryCell}>
          <span className={styles.pointsSummaryLabel}>Уровень</span>
          <span
            className={styles.pointsSummaryValue}
            style={{ color: levelColor }}
          >
            {currentLevel?.name || "Львёнок"}
          </span>
        </div>
        <div className={styles.pointsSummaryDivider} aria-hidden="true" />
        <div className={styles.pointsSummaryCell}>
          <span className={styles.pointsSummaryLabel}>Бонус к физ-ре</span>
          <span className={styles.pointsSummaryValue}>+{bonusPercent}%</span>
        </div>
      </div>

      {/* Фильтр операций */}
      <div
        className={styles.pointsFilters}
        role="group"
        aria-label="Фильтр операций"
      >
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`${styles.pointsFilterBtn} ${filter === f.key ? styles.pointsFilterBtnActive : ""}`}
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* История операций */}
      <PointsHistory pageSize={10} filter={filter} />
    </div>
  );
};

export default PointsTab;
