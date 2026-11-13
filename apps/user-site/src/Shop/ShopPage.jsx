import { useState, useEffect, useCallback } from "react";
import styles from "./ShopPage.module.css";
import { ShopSkeleton } from "../component/Skeleton";
import SafeImage from "../component/SafeImage";
import { apiRequest } from "../auth/apiClient";
import { imageUrl } from "../config";
import { useCartStore, migrateLegacyCart, cartTotalCount } from "./cartStore";

// ─── Уведомление (без изменений) ───
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

// ─── Страница магазина ───
const ShopPage = () => {
  const [products, setProducts] = useState([]);
  // Явные состояния: loading | ready | error. Скелетон = только loading.
  const [status, setStatus] = useState("loading");
  const [notifications, setNotifications] = useState([]);

  // Корзина — единый zustand-стор (localStorage: "sportclub-cart")
  const cartItems = useCartStore((s) => s.items);
  const addToCart = useCartStore((s) => s.add);

  // Бейдж корзины в шапке — из стора
  useEffect(() => {
    updateHeaderBadge(cartTotalCount(cartItems));
  }, [cartItems]);

  const loadProducts = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await apiRequest("/shop");
      setProducts(Array.isArray(data) ? data : []);
      setStatus("ready");
    } catch (error) {
      console.error("Ошибка загрузки товаров:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    migrateLegacyCart(); // перенос старой корзины (ключ "cart"), после — удаление старого ключа
    loadProducts();
  }, [loadProducts]);

  const updateHeaderBadge = (count) => {
    document.querySelectorAll(".cart-badge").forEach((badge) => {
      if (count > 0) {
        badge.textContent = count > 99 ? "99+" : count;
        badge.style.display = "flex";
      } else {
        badge.style.display = "none";
      }
    });
  };

  const addNotification = (title, message) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, title, message }]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleAddToCart = (product) => {
    addToCart(product.id);
    addNotification("Товар добавлен!", `${product.name} добавлен в корзину`);
  };

  // СКЕЛЕТОН ТОЛЬКО ПО ДАННЫМ — никаких картинок в условии
  if (status === "loading") {
    return <ShopSkeleton count={3} />;
  }

  return (
    <div className={styles.shopPage}>
      <div className={styles.notificationContainer}>
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>

      <div className={styles.shopHeader}>
        <h1 className={styles.shopTitle}>Магазин</h1>
        <p className={styles.shopSubtitle}>
          Официальная мерчендайзинг продукция
        </p>
      </div>

      <div className={styles.shopContainer}>
        {status === "error" ? (
          <div className={styles.shopError}>
            <p>Не удалось загрузить товары</p>
            <button onClick={loadProducts}>Повторить</button>
          </div>
        ) : products.length === 0 ? (
          <div className={styles.shopEmpty}>Товары скоро появятся</div>
        ) : (
          <div className={styles.productsGrid}>
            {products.map((product) => (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.productImage}>
                  <div className={styles.imagePlaceholder}>
                    <SafeImage
                      src={imageUrl(product.image)}
                      alt={product.name}
                    />
                  </div>
                </div>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{product.name}</h3>
                  <p className={styles.productDescription}>
                    {product.description}
                  </p>
                  <div className={styles.productFooter}>
                    <div className={styles.productPriceWrapper}>
                      <div className={styles.productPoints}>
                        {product.points || 0} баллов
                      </div>
                      {product.price && (
                        <div className={styles.productRubles}>
                          {product.price} ₽
                        </div>
                      )}
                    </div>
                    <button
                      className={styles.addToCartBtn}
                      onClick={() => handleAddToCart(product)}
                    >
                      <span>+</span> В корзину
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
