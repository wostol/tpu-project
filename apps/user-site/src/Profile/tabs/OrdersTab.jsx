import { Link } from "react-router-dom";
import { imageUrl } from "../../config";
import cap from "../../image/cap.png";
import styles from "./ProfileTabs.module.css";
import { useProfileData } from "../ProfileDataContext";
import { pluralizePoints } from "./pointsUtils";

const statusLabels = {
  cart: "В корзине",
  pending: "Ожидает оплаты",
  processing: "В обработке",
  preparing: "Подготовка",
  ready: "Готов к выдаче",
  picked_up: "Получен",
  completed: "Завершён",
  cancelled: "Отменён",
  refunded: "Возврат",
};

// Статусы «завершённой жизни» заказа → попадают в историю
const FINISHED_STATUSES = ["picked_up", "completed", "cancelled", "refunded"];

// Цвет статуса: ожидание → синий, готов к выдаче → зелёный, закрыт → серый, отмена → красный
const statusTone = (status) => {
  if (status === "ready") return "green";
  if (status === "cancelled" || status === "refunded") return "red";
  if (FINISHED_STATUSES.includes(status)) return "gray";
  return "blue";
};

/*
 * Вкладка «Заказы»: текущие заказы (статусное продвижение) сверху,
 * история — ниже. Обе группы с пустыми состояниями.
 *
 * Заказы берутся из ProfileDataContext (useProfileData) — ProfilePage
 * загружает их один раз и кладёт в контекст, пропсы не нужны.
 */
const OrdersTab = () => {
  const { orders } = useProfileData();

  if (!orders || orders.length === 0) {
    return (
      <div className={styles.noContent}>
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="#6c757d"
          aria-hidden="true"
        >
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
        </svg>
        <h3>Заказов нет</h3>
        <p>Вы ещё не оформили ни одного заказа</p>
        <Link to="/shop" className={styles.ordersEmptyCta}>
          Перейти в магазин
        </Link>
      </div>
    );
  }

  const current = orders.filter((o) => !FINISHED_STATUSES.includes(o.status));
  const history = orders.filter((o) => FINISHED_STATUSES.includes(o.status));

  const renderOrder = (order, isHistoryItem = false) => {
    const cover = imageUrl(order.coverImage) || cap;
    const extra = Math.max(order.itemsCount - 1, 0);
    const tone = statusTone(order.status);

    return (
      <Link
        key={order.id}
        to={`/profile/orders/${order.id}`}
        className={styles.orderCardLink}
      >
        <div
          className={`${styles.orderCard} ${isHistoryItem ? styles.orderCardHistory : ""}`}
        >
          <div className={styles.orderImageContainer}>
            <img src={cover} alt={order.coverName || "Товар заказа"} />
            {extra > 0 && <span className={styles.orderBadge}>+{extra}</span>}
          </div>
          <div className={styles.orderInfoContainer}>
            <h3 className={styles.productName}>
              Заказ №{order.id}
              {isHistoryItem && (
                <span className={styles.orderArchivedTag}>архив</span>
              )}
            </h3>
            <p className={styles.orderSubtitle}>
              {order.coverName}
              {extra > 0 ? ` и ещё ${extra}` : ""}
            </p>
            <div className={styles.orderDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Статус: </span>
                <span className={styles.detailValue}>
                  <span
                    className={`${styles.orderStatusChip} ${styles[`status-${tone}`]}`}
                  >
                    {statusLabels[order.status] || order.status}
                  </span>
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Позиций: </span>
                <span className={styles.detailValue}>{order.itemsCount}</span>
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
  };

  return (
    <div className={styles.ordersTab}>
      {/* Текущие заказы */}
      <section aria-label="Текущие заказы">
        <h3 className={styles.ordersSectionTitle}>
          Текущие
          <span className={styles.ordersSectionCount}>{current.length}</span>
        </h3>
        {current.length === 0 ? (
          <p className={styles.ordersEmptyHint}>
            Активных заказов нет. Оформите заказ в магазине — он появится здесь
            со своим статусом.
          </p>
        ) : (
          current.map((o) => renderOrder(o, false))
        )}
      </section>

      {/* История заказов */}
      <section aria-label="История заказов">
        <h3 className={styles.ordersSectionTitle}>
          История
          <span className={styles.ordersSectionCount}>{history.length}</span>
        </h3>
        {history.length === 0 ? (
          <p className={styles.ordersEmptyHint}>
            Завершённые, полученные и отменённые заказы появятся здесь.
          </p>
        ) : (
          history.map((o) => renderOrder(o, true))
        )}
      </section>
    </div>
  );
};

export default OrdersTab;
