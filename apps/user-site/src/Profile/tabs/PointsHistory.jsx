import React, { useState, useEffect, useCallback } from "react";
import styles from "./ProfileTabs.module.css";
import { apiRequest } from "../../auth/apiClient";
import { getTypeMeta, formatDate } from "./pointsUtils";

/*
 * История операций с пагинацией «Загрузить ещё».
 * filter: 'all' | 'income' | 'expense' — фильтр из вкладки «Баллы».
 * Бэкенд пока не умеет фильтровать по типу, поэтому фильтр применяется
 * на клиенте к уже загруженным страницам.
 */
const PointsHistory = ({ pageSize = 10, filter = "all" }) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(
    async (currentPage) => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest(
          `/profile/points?page=${currentPage}&limit=${pageSize}`,
        );

        // Ответ может быть массивом (текущий бэкенд)
        // или объектом { data: [...], total: n } (после правки бэкенда)
        const newItems = Array.isArray(data)
          ? data
          : (data?.data ?? data?.items ?? []);
        const total = Array.isArray(data) ? null : (data?.total ?? null);

        setItems(
          currentPage === 1 ? newItems : (prev) => [...prev, ...newItems],
        );
        setHasMore(
          total !== null
            ? currentPage * pageSize < total
            : newItems.length === pageSize,
        );
      } catch (err) {
        setError(err.message || "Ошибка загрузки истории");
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHistory(nextPage);
    }
  };

  if (initialLoad && loading) {
    return (
      <div className={styles.statsEventsHistory}>
        <div className={styles.noContent}>
          <div className={styles.spinner} />
          <p>Загрузка истории…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.statsEventsHistory}>
        <div className={styles.noContent}>
          <p style={{ color: "#dc3545", marginBottom: 12 }}>Ошибка: {error}</p>
          <button
            onClick={() => fetchHistory(1)}
            className={styles.loadMoreBtn}
            style={{ maxWidth: 200, margin: "0 auto" }}
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  // Клиентский фильтр по знаку операции
  const visible =
    filter === "all"
      ? items
      : items.filter((item) =>
          filter === "income" ? item.points > 0 : item.points < 0,
        );

  return (
    <div className={styles.statsEventsHistory}>
      {visible.length === 0 ? (
        <div className={styles.noContent}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="#6c757d"
            style={{ marginBottom: 16 }}
            aria-hidden="true"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V11h-2.8v3.2c0 .83-.67 1.5-1.5 1.5S7.6 15.03 7.6 14.2V9.8c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h2.8V7.8c0-.83-.67-1.5-1.5-1.5S10.4 6.97 10.4 7.8V14c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5z" />
          </svg>
          <h3>
            {filter === "all"
              ? "История пуста"
              : filter === "income"
                ? "Нет начислений"
                : "Нет списаний"}
          </h3>
          <p>
            {filter === "expense"
              ? "Здесь появятся ваши покупки в магазине за баллы"
              : "Здесь появятся ваши начисления за мероприятия"}
          </p>
        </div>
      ) : (
        <ul className={styles.eventsHistoryList}>
          {visible.map((item) => {
            const date = formatDate(item.createdAt);
            const meta = getTypeMeta(item.reason, item.points);
            const isPositive = item.points > 0;
            const color = isPositive ? "#28a745" : "#dc3545";

            return (
              <li
                key={item.id}
                className={`${styles.eventHistoryItem} ${styles[meta.role]}`}
                style={{ borderLeftColor: color }}
              >
                <div className={styles.eventHistoryDate}>
                  <div className={styles.eventDay}>{date.day}</div>
                  <div className={styles.eventMonth}>{date.month}</div>
                </div>

                <div className={styles.eventHistoryInfo}>
                  <h4 className={styles.eventHistoryName}>
                    {item.reason || "Операция"}
                  </h4>
                  <p className={styles.eventHistoryRole}>
                    {meta.label} • {date.time}
                  </p>
                </div>

                <div className={styles.eventHistoryRight}>
                  <p className={styles.eventHistoryPoints} style={{ color }}>
                    {isPositive ? "+" : ""}
                    {item.points}
                  </p>
                  <div
                    className={`${styles.eventHistoryBadge} ${isPositive ? styles.income : styles.expense}`}
                  >
                    {isPositive ? "ПРИХОД" : "РАСХОД"}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <button
          className={styles.loadMoreBtn}
          onClick={loadMore}
          disabled={loading}
        >
          {loading ? "Загрузка…" : "Загрузить ещё"}
        </button>
      )}

      {!hasMore && visible.length > 0 && (
        <p className={styles.historyEndNote}>Вы просмотрели всю историю</p>
      )}
    </div>
  );
};

export default PointsHistory;
