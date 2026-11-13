import React, { useState, useEffect, useCallback } from "react";
import styles from "./ProfileTabs.module.css";
import { apiRequest } from "../../auth/apiClient";

// В таблице PointsHistory нет поля type — категорию определяем
// по тексту reason, а приход/расход — по знаку points
const getTypeMeta = (reason, points) => {
  const isPositive = points > 0;
  const r = (reason || "").toLowerCase();

  if (r.startsWith("покупка")) {
    return { label: "Покупка в магазине", role: "expense" };
  }
  if (r.includes("возврат")) {
    return { label: "Возврат средств", role: "income" };
  }
  if (r.includes("приз")) {
    return { label: "Награда", role: "income" };
  }
  if (r.includes("бонус")) {
    return { label: "Бонус", role: "income" };
  }
  if (r.includes("регистрац") || r.includes("посещен") || r.includes("участ")) {
    return { label: "Мероприятие", role: "income" };
  }
  return {
    label: isPositive ? "Начисление" : "Списание",
    role: isPositive ? "income" : "expense",
  };
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return {
    day: d.getDate().toString().padStart(2, "0"),
    month: d.toLocaleString("ru-RU", { month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
  };
};

const PointsHistory = ({ pageSize = 10 }) => {
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
        <h3 className={styles.historyTitle}>История операций</h3>
        <div className={styles.noContent}>
          <div className={styles.spinner} />
          <p>Загрузка истории...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.statsEventsHistory}>
        <h3 className={styles.historyTitle}>История операций</h3>
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

  return (
    <div className={styles.statsEventsHistory}>
      <h3 className={styles.historyTitle}>История операций</h3>

      {items.length === 0 ? (
        <div className={styles.noContent}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="#6c757d"
            style={{ marginBottom: 16 }}
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V11h-2.8v3.2c0 .83-.67 1.5-1.5 1.5S7.6 15.03 7.6 14.2V9.8c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h2.8V7.8c0-.83-.67-1.5-1.5-1.5S10.4 6.97 10.4 7.8V14c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5z" />
          </svg>
          <h3>История пуста</h3>
          <p>Здесь появятся ваши начисления и покупки</p>
        </div>
      ) : (
        <div className={styles.eventsHistoryList}>
          {items.map((item) => {
            const date = formatDate(item.createdAt);
            const meta = getTypeMeta(item.reason, item.points);
            const isPositive = item.points > 0;
            const color = isPositive ? "#28a745" : "#dc3545";

            return (
              <div
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
                  <p
                    className={styles.eventHistoryPoints}
                    style={{ color, fontWeight: 700, fontSize: 16 }}
                  >
                    {isPositive ? "+" : ""}
                    {item.points} баллов
                  </p>
                </div>

                <div
                  className={`${styles.eventHistoryBadge} ${isPositive ? styles.income : styles.expense}`}
                >
                  {isPositive ? "ПРИХОД" : "РАСХОД"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <button
          className={styles.loadMoreBtn}
          onClick={loadMore}
          disabled={loading}
        >
          {loading ? "Загрузка..." : "Загрузить ещё"}
        </button>
      )}

      {!hasMore && items.length > 0 && (
        <p
          style={{
            textAlign: "center",
            color: "#6c757d",
            marginTop: 20,
            fontSize: 14,
          }}
        >
          Вы просмотрели всю историю
        </p>
      )}
    </div>
  );
};

export default PointsHistory;
