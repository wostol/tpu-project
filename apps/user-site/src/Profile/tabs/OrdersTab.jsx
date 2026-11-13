import { Link } from "react-router-dom";
import { imageUrl } from "../../config";
import cap from "../../image/cap.png";
import styles from "./ProfileTabs.module.css";

const statusLabels = {
  cart: "В корзине",
  pending: "Ожидает оплаты",
  processing: "В обработке",
  preparing: "Подготовка",
  ready: "Готов к выдаче",
  picked_up: "Получен",
  completed: "Завершен",
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

const OrdersTab = ({ orders }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className={styles.noContent}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="#6c757d">
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
        </svg>
        <h3>Заказов нет</h3>
        <p>Вы еще не оформили ни одного заказа</p>
      </div>
    );
  }

  return (
    <div className={styles.ordersTab}>
      {orders.map((order) => {
        const cover = imageUrl(order.coverImage) || cap;
        const extra = Math.max(order.itemsCount - 1, 0);
        return (
          <Link
            key={order.id}
            to={`/profile/orders/${order.id}`}
            className={styles.orderCardLink}
          >
            <div className={styles.orderCard}>
              <div className={styles.orderImageContainer}>
                <img src={cover} alt={order.coverName || "Товар заказа"} />
                {extra > 0 && (
                  <span className={styles.orderBadge}>+{extra}</span>
                )}
              </div>
              <div className={styles.orderInfoContainer}>
                <h3 className={styles.productName}>Заказ №{order.id}</h3>
                <p className={styles.orderSubtitle}>
                  {order.coverName}
                  {extra > 0 ? ` и ещё ${extra}` : ""}
                </p>
                <div className={styles.orderDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Статус: </span>
                    <span className={styles.detailValue}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Позиций: </span>
                    <span className={styles.detailValue}>
                      {order.itemsCount}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Дата: </span>
                    <span className={styles.detailValue}>
                      {order.date} {order.time ? `• ${order.time}` : ""}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.orderPriceContainer}>
                <span className={styles.orderPrice}>
                  −{order.totalPoints} {pluralizePoints(order.totalPoints)}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default OrdersTab;
