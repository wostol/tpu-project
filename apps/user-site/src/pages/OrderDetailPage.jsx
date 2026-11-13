import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../auth/apiClient";
import { imageUrl } from "../config";
import { ShopSkeleton } from "../component/Skeleton";
import cap from "../image/cap.png";
import styles from "./OrderDetailPage.module.css";

const statusLabels = {
  completed: "Завершен",
  pending: "Ожидает оплаты",
  processing: "В обработке",
  preparing: "Подготовка",
  ready: "Готов к выдаче",
  picked_up: "Получен",
  cancelled: "Отменен",
  refunded: "Возврат",
};

const pluralizePoints = (n) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "баллов";
  if (m10 === 1) return "балл";
  if (m10 >= 2 && m10 <= 4) return "балла";
  return "баллов";
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiRequest(`/profile/orders/${id}`)
      .then((data) => !cancelled && setOrder(data))
      .catch(
        (e) =>
          !cancelled && setError(e.message || "Не удалось загрузить заказ"),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <ShopSkeleton count={3} />;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!order) return null;

  return (
    <div className={styles.detail}>
      <button
        type="button"
        onClick={() => navigate("/profile?tab=orders")}
        className={styles.back}
      >
        ← К списку заказов
      </button>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Заказ №{order.id}</h1>
          <p className={styles.meta}>
            {order.date} {order.time ? `• ${order.time}` : ""}
          </p>
        </div>
        <span className={styles.status}>
          {statusLabels[order.status] || order.status}
        </span>
      </header>

      <section className={styles.items}>
        {order.items.map((it) => (
          <article key={it.id} className={styles.item}>
            <div className={styles.itemImage}>
              <img src={imageUrl(it.image) || cap} alt={it.name} />
            </div>
            <div className={styles.itemInfo}>
              <h3 className={styles.itemName}>{it.name}</h3>
              <p className={styles.itemLine}>
                {it.points} {pluralizePoints(it.points)} × {it.quantity} шт.
              </p>
            </div>
            <div className={styles.itemTotal}>
              {it.linePoints} {pluralizePoints(it.linePoints)}
            </div>
          </article>
        ))}
      </section>

      <footer className={styles.total}>
        <span>Итого списано</span>
        <span className={styles.totalValue}>
          −{order.totalPoints} {pluralizePoints(order.totalPoints)}
        </span>
      </footer>
    </div>
  );
};

export default OrderDetailPage;
