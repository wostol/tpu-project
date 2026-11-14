import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import styles from "./CartPage.module.css";
import useAuth from "../auth/useAuth";
import { useProfile } from "../Profile/useProfile";
import { CartSkeleton } from "../component/Skeleton";
import SafeImage from "../component/SafeImage";
import { apiRequest } from "../auth/apiClient";
import { imageUrl } from "../config";
import ConfirmDialog from "../component/ConfirmDialog";
import {
  useCartStore,
  migrateLegacyCart,
  cartTotalCount,
} from "../Shop/cartStore";

// Компонент уведомления
const Notification = ({ notification, onClose }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onClose(notification.id), 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onClose(notification.id), 300);
  };

  return (
    <div
      className={`${styles.notification} ${exiting ? styles.notificationExiting : ""}`}
    >
      <div className={styles.notificationIcon}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div className={styles.notificationContent}>
        <div className={styles.notificationTitle}>{notification.title}</div>
        <div className={styles.notificationMessage}>{notification.message}</div>
      </div>
      <button className={styles.notificationClose} onClick={handleClose}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div className={styles.notificationProgress}></div>
    </div>
  );
};

function CartPage() {
  // Корзина — единый zustand-стор (localStorage: "sportclub-cart").
  // Хранятся только { productId, quantity }; названия/цены — из каталога.
  const cartItems = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.remove);
  const clearCart = useCartStore((s) => s.clear);

  const [products, setProducts] = useState([]);
  const [productsStatus, setProductsStatus] = useState("loading");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [itemsListRef] = useAutoAnimate();
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    itemId: null,
  });
  const [checkoutDialog, setCheckoutDialog] = useState({
    isOpen: false,
    totalPointsCost: 0,
    remainingPoints: 0,
  });
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { profile, refresh: refreshProfile } = useProfile();

  const userPoints = isAuthenticated ? (profile?.totalPoints ?? 0) : 0;

  // Загружаем каталог: корзина хранит только id, данные товара берём отсюда
  useEffect(() => {
    migrateLegacyCart(); // перенос старой корзины (ключ "cart"), после — удаление старого ключа

    const loadProducts = async () => {
      setProductsStatus("loading");
      try {
        const data = await apiRequest("/shop");
        setProducts(Array.isArray(data) ? data : []);
        setProductsStatus("ready");
      } catch (error) {
        console.error("Ошибка загрузки каталога:", error);
        setProductsStatus("error");
      }
    };

    loadProducts();
  }, []);

  // Бейдж корзины в шапке — из стора
  useEffect(() => {
    const count = cartTotalCount(cartItems);
    document.querySelectorAll(".cart-badge").forEach((badge) => {
      if (count > 0) {
        badge.textContent = count > 99 ? "99+" : count;
        badge.style.display = "flex";
      } else {
        badge.style.display = "none";
      }
    });
  }, [cartItems]);

  const addNotification = (title, message) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, title, message }]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Строки корзины = позиции стора + данные товара из каталога
  const rows = useMemo(
    () =>
      cartItems.map((ci) => ({
        ...ci,
        product: products.find((p) => p.id === ci.productId) ?? null,
      })),
    [cartItems, products],
  );

  // Сумма считается по АКТУАЛЬНЫМ ценам каталога, а не по данным из localStorage
  const totalPointsCost = rows.reduce(
    (sum, r) => sum + (r.product ? r.product.points * r.quantity : 0),
    0,
  );
  const unavailableCount = rows.filter((r) => !r.product).length;
  const canAfford =
    isAuthenticated &&
    rows.length > 0 &&
    unavailableCount === 0 &&
    userPoints >= totalPointsCost;

  const handleDecreaseQuantity = (productId) => {
    const row = cartItems.find((i) => i.productId === productId);
    if (!row) return;
    if (row.quantity <= 1) {
      setDeleteDialog({ isOpen: true, itemId: productId });
      return;
    }
    setQuantity(productId, row.quantity - 1);
  };

  const handleIncreaseQuantity = (productId) => {
    const row = cartItems.find((i) => i.productId === productId);
    if (!row) return;
    setQuantity(productId, row.quantity + 1);
  };

  const confirmDeleteItem = () => {
    if (deleteDialog.itemId !== null) {
      removeItem(deleteDialog.itemId);
    }
    setDeleteDialog({ isOpen: false, itemId: null });
  };

  const cancelDeleteItem = () => {
    setDeleteDialog({ isOpen: false, itemId: null });
  };

  const handleCheckout = () => {
    if (rows.length === 0) {
      alert("Корзина пуста");
      return;
    }

    if (!isAuthenticated) {
      alert("Пожалуйста, авторизуйтесь для оформления заказа");
      return;
    }

    if (unavailableCount > 0) {
      alert(
        "Часть товаров больше недоступна в каталоге. Удалите их из корзины.",
      );
      return;
    }

    if (userPoints < totalPointsCost) {
      const missingPoints = totalPointsCost - userPoints;
      alert(
        `Недостаточно баллов!\nНужно: ${totalPointsCost} баллов\nУ вас: ${userPoints} баллов\nНе хватает: ${missingPoints} баллов`,
      );
      return;
    }

    setCheckoutDialog({
      isOpen: true,
      totalPointsCost,
      remainingPoints: userPoints - totalPointsCost,
    });
  };

  const confirmCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutDialog({
      isOpen: false,
      totalPointsCost: 0,
      remainingPoints: 0,
    });

    try {
      // Контракт бэкенда: только id и количество. Сумму и списание делает сервер.
      const items = cartItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));
      if (items.length === 0) {
        throw new Error("Корзина пуста");
      }

      const order = await apiRequest("/shop/checkout", {
        method: "POST",
        body: JSON.stringify({ items }),
      });

      // Успех: чистим корзину и перечитываем баланс из БД
      clearCart();
      await refreshProfile();

      // Переходим на страницу оформленного заказа
      navigate(`/profile/orders/${order.id}`);
    } catch (error) {
      console.error("Ошибка при оформлении заказа:", error);
      addNotification(
        "Ошибка оформления",
        error.message || "Попробуйте ещё раз",
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const cancelCheckout = () => {
    setCheckoutDialog({
      isOpen: false,
      totalPointsCost: 0,
      remainingPoints: 0,
    });
  };

  if (productsStatus === "loading") {
    return <CartSkeleton />;
  }

  return (
    <div className={styles.cartPage}>
      <div className={styles.cartHeader}>
        <div>
          <h1 className={styles.cartTitle}>Корзина</h1>
          <p className={styles.cartSubtitle}>
            Управляйте выбранными товарами и оформляйте заказ за баллы
          </p>
        </div>
        <div className={styles.userPointsDisplay}>
          <div className={styles.pointsInfo}>
            <span className={styles.pointsLabel}>Ваш баланс</span>
            <span className={styles.pointsValue}>{userPoints} баллов</span>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className={styles.cartEmpty}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
          <h3>Корзина пуста</h3>
          <p>Добавьте товары из магазина, чтобы они появились здесь</p>
          {productsStatus === "error" && (
            <p style={{ color: "#dc3545", marginTop: 8 }}>
              Каталог не загрузился — проверьте, что работает бэкенд
            </p>
          )}
          <Link to="/shop" className={styles.continueShopping}>
            Перейти в магазин
          </Link>
        </div>
      ) : (
        <div className={styles.cartContainer}>
          <div className={styles.cartItems} ref={itemsListRef}>
            <h2>Товары ({cartTotalCount(cartItems)} шт.)</h2>
            {rows.map((row) =>
              row.product ? (
                <div key={row.productId} className={styles.cartItem}>
                  <div className={styles.cartItemImage}>
                    <SafeImage
                      src={imageUrl(row.product.image)}
                      alt={row.product.name}
                    />
                  </div>
                  <div className={styles.cartItemDetails}>
                    <h3 className={styles.cartItemTitle}>{row.product.name}</h3>
                    <p className={styles.cartItemDescription}>
                      {row.product.description}
                    </p>
                    <div className={styles.cartItemInfo}>
                      <div className={styles.cartItemPrice}>
                        <span className={styles.pointsPrice}>
                          {row.product.points || 0} баллов
                        </span>
                        {row.product.price && (
                          <span className={styles.originalPrice}>
                            {row.product.price}₽
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.cartItemActions}>
                    <div className={styles.cartQuantity}>
                      <button
                        className={styles.quantityBtn}
                        onClick={() => handleDecreaseQuantity(row.productId)}
                      >
                        -
                      </button>
                      <span className={styles.quantityValue}>
                        {row.quantity}
                      </span>
                      <button
                        className={styles.quantityBtn}
                        onClick={() => handleIncreaseQuantity(row.productId)}
                      >
                        +
                      </button>
                    </div>
                    <div className={styles.cartItemTotal}>
                      {(row.product.points || 0) * row.quantity} баллов
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(row.productId)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ) : (
                // Товар удалили из каталога, пока лежал в корзине
                <div key={row.productId} className={styles.cartItem}>
                  <div className={styles.cartItemImage}>
                    <div className={styles.imagePlaceholder}></div>
                  </div>
                  <div className={styles.cartItemDetails}>
                    <h3 className={styles.cartItemTitle}>
                      Товар недоступен (№{row.productId})
                    </h3>
                    <p className={styles.cartItemDescription}>
                      Этого товара больше нет в каталоге
                    </p>
                  </div>
                  <div className={styles.cartItemActions}>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(row.productId)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>

          <div className={styles.cartSummary}>
            <h2>Итого</h2>

            <div className={styles.cartSummaryItem}>
              <span className={styles.summaryLabel}>
                Товары ({cartTotalCount(cartItems)} шт.)
              </span>
              <span className={styles.summaryValue}>
                {totalPointsCost} баллов
              </span>
            </div>

            <div className={styles.cartSummaryItem}>
              <span className={styles.summaryLabel}>Доставка</span>
              <span className={styles.summaryValue}>Бесплатно</span>
            </div>

            <div className={styles.cartSummaryItem}>
              <span className={styles.summaryLabel}>Ваш баланс</span>
              <span
                className={styles.summaryValue}
                style={{
                  color:
                    userPoints >= totalPointsCost
                      ? "var(--color-success)"
                      : "var(--color-danger)",
                  fontWeight: "var(--font-weight-semibold)",
                }}
              >
                {userPoints} баллов
              </span>
            </div>

            {!canAfford && (
              <div className={`${styles.cartSummaryItem} ${styles.error}`}>
                <span className={styles.summaryLabel}>
                  {!isAuthenticated
                    ? "Требуется авторизация"
                    : unavailableCount > 0
                      ? "Есть недоступные товары"
                      : "Недостаточно баллов"}
                </span>
                <span className={styles.summaryValue}>
                  {isAuthenticated && unavailableCount === 0
                    ? `Не хватает: ${totalPointsCost - userPoints} баллов`
                    : "—"}
                </span>
              </div>
            )}

            <div className={styles.cartSummaryItem}>
              <span className={`${styles.summaryLabel} ${styles.summaryTotal}`}>
                К оплате
              </span>
              <span className={`${styles.summaryValue} ${styles.summaryTotal}`}>
                {totalPointsCost} баллов
              </span>
            </div>

            {canAfford && (
              <div className={styles.cartSummaryItem}>
                <span className={styles.summaryLabel}>
                  Останется после оплаты
                </span>
                <span
                  className={styles.summaryValue}
                  style={{
                    color: "var(--color-success)",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  {userPoints - totalPointsCost} баллов
                </span>
              </div>
            )}

            <button
              className={`${styles.checkoutBtn} ${!canAfford || checkoutLoading ? styles.disabled : ""}`}
              onClick={handleCheckout}
              disabled={!canAfford || checkoutLoading}
            >
              {checkoutLoading
                ? "Оформление..."
                : canAfford
                  ? `Оплатить ${totalPointsCost} баллов`
                  : "Недостаточно баллов"}
            </button>

            <div className={styles.pointsNote}>
              <p>
                Все товары приобретаются за баллы. Баллы можно заработать,
                выполняя задания и участвуя в активностях.
              </p>
            </div>

            <div className={styles.cartActions}>
              <Link to="/shop" className={styles.continueShopping}>
                ← Продолжить покупки
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Диалог подтверждения удаления товара */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Удаление товара"
        message="Удалить выбранный товар? Отменить действие будет невозможно."
        onConfirm={confirmDeleteItem}
        onCancel={cancelDeleteItem}
        confirmText="Удалить"
        cancelText="Отмена"
      />
      <ConfirmDialog
        isOpen={checkoutDialog.isOpen}
        title="Подтверждение оплаты"
        message={`Оплатить заказ на сумму ${checkoutDialog.totalPointsCost} баллов?\nПосле оплаты у вас останется: ${checkoutDialog.remainingPoints} баллов`}
        onConfirm={confirmCheckout}
        onCancel={cancelCheckout}
        confirmText="Оплатить"
        cancelText="Отмена"
      />

      {/* Контейнер уведомлений */}
      <div className={styles.notificationContainer}>
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
    </div>
  );
}

export default CartPage;
