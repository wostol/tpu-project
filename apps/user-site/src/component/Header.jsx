import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import gsap from "gsap";
import useAuth from "../auth/useAuth";
import logo from "./lionsib.svg";
import "./Header.css";

const NAV_ITEMS = [
  { to: "/", label: "Главная", icon: "icon-home", isActive: (p) => p === "/" },
  {
    to: "/events",
    label: "Мероприятия",
    icon: "icon-calendar",
    isActive: (p) => p.startsWith("/events"),
  },
  {
    to: "/shop",
    label: "Магазин",
    icon: "icon-bag",
    isActive: (p) => p.startsWith("/shop"),
  },
];

const MOBILE_QUERY = "(max-width: 768px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export const CART_EVENT = "cart:change";
export const notifyCartChange = () => {
  window.dispatchEvent(new Event(CART_EVENT));
};

/* ---------- утилиты ---------- */

function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

function readCartCount() {
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return 0;
    return parsed.reduce((sum, item) => {
      const q = Number(item?.quantity ?? 1);
      return sum + (Number.isFinite(q) && q > 0 ? Math.floor(q) : 0);
    }, 0);
  } catch {
    return 0;
  }
}

function useCartCount(enabled) {
  const [count, setCount] = useState(readCartCount);
  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }
    const update = () => setCount(readCartCount());
    const onStorage = (e) => {
      if (e.key === "cart" || e.key === null) update();
    };
    update();
    window.addEventListener(CART_EVENT, update);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", update);
    return () => {
      window.removeEventListener(CART_EVENT, update);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", update);
    };
  }, [enabled]);
  return count;
}

/* ---------- Pill ---------- */

const Pill = ({ to, icon, label, active, badge = 0, onClick }) => (
  <Link
    to={to}
    data-pill=""
    className={`pill${active ? " is-active" : ""}`}
    aria-current={active ? "page" : undefined}
    onClick={onClick}
  >
    <span className="pill__icon">
      <svg
        className="pill__svg"
        width={22}
        height={22}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <use href={`#${icon}`} />
      </svg>
      {badge > 0 && (
        <span className="pill__badge">{badge > 99 ? "99+" : badge}</span>
      )}
    </span>
    <span className="pill__label">{label}</span>
  </Link>
);

/* ---------- Header ---------- */

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, login, logout, loading } = useAuth();

  const isMobile = useMediaQuery(MOBILE_QUERY);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const cartCount = useCartCount(isAuthenticated);

  const headerRef = useRef(null);
  const navRef = useRef(null);
  const mainGroupRef = useRef(null);
  const actionsGroupRef = useRef(null);
  const mainIndicatorRef = useRef(null);
  const actionsIndicatorRef = useRef(null);
  const overlayRef = useRef(null);
  const burgerRef = useRef(null);

  const syncRef = useRef(null);
  const isFirstRun = useRef(true);
  const drawerTouched = useRef(false);

  const closeMenu = () => setIsMenuOpen(false);

  /* ---------- тень при скролле ---------- */
  /* ---------- тень при скролле (с гистерезисом) ---------- */
  useEffect(() => {
    let raf = 0;
    let currentScrolled = false;

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const scrollY = window.scrollY;
        // Гистерезис: включается при 30px, выключается при 10px
        const shouldBeScrolled = currentScrolled ? scrollY > 10 : scrollY > 30;

        if (shouldBeScrolled !== currentScrolled) {
          currentScrolled = shouldBeScrolled;
          setIsScrolled(shouldBeScrolled);
        }
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* ---------- закрываем drawer при смене маршрута ---------- */
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  /* ---------- блокировка скролла + Esc ---------- */
  useEffect(() => {
    if (!(isMobile && isMenuOpen)) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        burgerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobile, isMenuOpen]);

  /* ---------- GSAP: ТОЛЬКО индикатор-плашка ---------- */
  useLayoutEffect(() => {
    if (loading) return;
    const nav = navRef.current;
    if (!nav) return;

    const groups = [
      { list: mainGroupRef.current, indicator: mainIndicatorRef.current },
      { list: actionsGroupRef.current, indicator: actionsIndicatorRef.current },
    ].filter((g) => Boolean(g.list && g.indicator));

    // Синхронизация индикатора с активным Pill в каждой группе
    const sync = (animate = true) => {
      groups.forEach(({ list, indicator }) => {
        const active = list.querySelector(".pill.is-active");
        // Индикатор лежит внутри <ul>, поэтому offsetLeft/offsetWidth —
        // координаты pill относительно этого же <ul>. Это корректно только
        // когда у <ul> есть собственный слой позиционирования (position:relative).
        // Если по какой-то причине relative потерян (конфликт CSS), offsetLeft
        // считается от другого предка и плашка «улетает» в середину экрана —
        // подстраховываемся через getBoundingClientRect.
        const positioned = window.getComputedStyle(list).position !== "static";
        let x = 0;
        let w = 0;
        if (active) {
          if (positioned) {
            x = active.offsetLeft;
            w = active.offsetWidth;
          } else {
            const rA = active.getBoundingClientRect();
            const rL = list.getBoundingClientRect();
            x = rA.left - rL.left + list.scrollLeft;
            w = rA.width;
          }
        }
        const dur = animate && !reducedMotion ? 0.45 : 0;
        if (!active) {
          // Явно скрываем индикатор, если в группе нет активного пункта
          gsap.to(indicator, {
            opacity: 0,
            duration: animate && !reducedMotion ? 0.2 : 0,
            ease: "power2.out",
          });
          return;
        }
        gsap.to(indicator, {
          x,
          width: w,
          opacity: 1,
          duration: dur,
          ease: "power3.inOut",
        });
      });
    };
    syncRef.current = sync;

    if (isMobile) {
      groups.forEach(({ indicator }) =>
        gsap.set(indicator, { clearProps: "all" }),
      );
      return;
    }

    if (isFirstRun.current) {
      isFirstRun.current = false;
      sync();
      const pills = Array.from(nav.querySelectorAll("[data-pill]"));
      gsap.from(pills, {
        y: -6,
        opacity: 0,
        duration: reducedMotion ? 0 : 0.4,
        stagger: 0.03,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });
      return;
    }

    sync();
  }, [location.pathname, isMobile, loading, isAuthenticated, reducedMotion]);

  /* ---------- ресайз: мгновенная переброска индикатора без анимации ---------- */
  useEffect(() => {
    if (isMobile || loading) return;
    const nav = navRef.current;
    if (!nav) return;

    let raf = 0;
    let lastW = window.innerWidth;

    // При смене размера окна анимируем position/width сразу, иначе
    // ResizeObserver + GSAP tween дают «прыжок» плашки в центр экрана.
    const onResize = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const instant = Math.abs(window.innerWidth - lastW) > 2;
        lastW = window.innerWidth;
        syncRef.current?.(!instant);
      });
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(nav);
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(onResize).catch(() => undefined);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isMobile, loading]);

  /* ---------- мобильный drawer ---------- */
  useLayoutEffect(() => {
    const nav = navRef.current;
    const overlay = overlayRef.current;
    if (!nav || !overlay) return;

    if (!isMobile) {
      gsap.set([nav, overlay], { clearProps: "all" });
      gsap.set(nav.querySelectorAll("[data-pill]"), {
        clearProps: "transform,opacity",
      });
      drawerTouched.current = false;
      return;
    }

    const k = reducedMotion ? 0 : 1;

    if (!isMenuOpen && !drawerTouched.current) {
      gsap.set(nav, { xPercent: 100, visibility: "hidden" });
      gsap.set(overlay, { opacity: 0, visibility: "hidden" });
      return;
    }

    const items = nav.querySelectorAll("[data-pill]");
    const tl = gsap.timeline();

    if (isMenuOpen) {
      drawerTouched.current = true;
      tl.set([nav, overlay], { visibility: "visible" })
        .fromTo(
          overlay,
          { opacity: 0 },
          { opacity: 1, duration: 0.3 * k, ease: "none" },
          0,
        )
        .fromTo(
          nav,
          { xPercent: 100 },
          { xPercent: 0, duration: 0.45 * k, ease: "power3.out" },
          0,
        )
        .fromTo(
          items,
          { x: 24, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.3 * k,
            stagger: 0.05 * k,
            ease: "power2.out",
          },
          0.12 * k,
        );
    } else {
      tl.to(nav, {
        xPercent: 100,
        duration: 0.32 * k,
        ease: "power3.in",
      })
        .to(overlay, { opacity: 0, duration: 0.25 * k, ease: "none" }, 0)
        .set([nav, overlay], { visibility: "hidden" });
    }

    return () => {
      tl.kill();
    };
  }, [isMenuOpen, isMobile, reducedMotion]);

  /* ---------- handlers ---------- */
  const handleLoginClick = () => {
    sessionStorage.setItem("returnUrl", location.pathname + location.search);
    closeMenu();
    login();
  };

  const handleLogoutClick = () => {
    closeMenu();
    logout();
    navigate("/");
  };

  const brand = (
    <Link
      to="/"
      className="brand"
      onClick={closeMenu}
      aria-label="Спортклуб ТПУ — на главную"
    >
      <img src={logo} alt="" className="brand__logo" width={44} height={44} />
      <span className="brand__text">
        <span className="brand__title">СПОРТКЛУБ ТПУ</span>
        <span className="brand__subtitle">ПРОГРАММА ЛОЯЛЬНОСТИ</span>
      </span>
    </Link>
  );

  if (loading) {
    return (
      <header className="header" ref={headerRef}>
        <div className="header__container">
          <div className="header__inner">
            <div className="brand brand--skeleton">{brand}</div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`header${isScrolled ? " is-scrolled" : ""}`}
      ref={headerRef}
    >
      <div className="header__container">
        <div className="header__inner">
          {brand}

          <button
            type="button"
            ref={burgerRef}
            className={`burger${isMenuOpen ? " is-open" : ""}`}
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
          >
            <span className="burger__line" />
            <span className="burger__line" />
            <span className="burger__line" />
          </button>

          <nav
            className="main-nav"
            id="primary-navigation"
            ref={navRef}
            aria-label="Основная навигация"
          >
            {/* Разделы сайта */}
            <ul className="nav-group nav-group--main" ref={mainGroupRef}>
              <li
                className="nav-indicator"
                ref={mainIndicatorRef}
                aria-hidden="true"
              />
              {NAV_ITEMS.map((item) => (
                <li className="nav-group__item" key={item.to}>
                  <Pill
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    active={item.isActive(location.pathname)}
                    onClick={closeMenu}
                  />
                </li>
              ))}
            </ul>

            {/* Личные действия */}
            <ul className="nav-group nav-group--actions" ref={actionsGroupRef}>
              <li
                className="nav-indicator"
                ref={actionsIndicatorRef}
                aria-hidden="true"
              />
              <li className="nav-group__item">
                <Pill
                  to="/favorites"
                  icon="icon-heart"
                  label="Мои мероприятия"
                  active={location.pathname === "/favorites"}
                  onClick={closeMenu}
                />
              </li>
              <li className="nav-group__item">
                <Pill
                  to="/cart"
                  icon="icon-cart"
                  label="Корзина"
                  active={location.pathname === "/cart"}
                  badge={cartCount}
                  onClick={closeMenu}
                />
              </li>
              <li className="nav-group__item">
                {isAuthenticated ? (
                  <Pill
                    to="/profile"
                    icon="icon-profile"
                    label="Профиль"
                    active={location.pathname === "/profile"}
                    onClick={closeMenu}
                  />
                ) : (
                  <button
                    type="button"
                    data-pill=""
                    className="pill"
                    onClick={handleLoginClick}
                  >
                    <span className="pill__icon">
                      <svg
                        className="pill__svg"
                        width={22}
                        height={22}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <use href="#icon-login" />
                      </svg>
                    </span>
                    <span className="pill__label">Войти</span>
                  </button>
                )}
              </li>
            </ul>
          </nav>

          <div
            className="menu-overlay"
            ref={overlayRef}
            onClick={closeMenu}
            aria-hidden="true"
          />
        </div>
      </div>

      <IconSprite />
    </header>
  );
};

const IconSprite = () => (
  <svg
    className="icon-sprite"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <symbol id="icon-home" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor" />
      </symbol>
      <symbol id="icon-calendar" viewBox="0 0 24 24">
        <path
          d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z"
          fill="currentColor"
        />
      </symbol>
      <symbol id="icon-bag" viewBox="0 0 24 24">
        <path
          d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h12v12zm-6-9c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z"
          fill="currentColor"
        />
      </symbol>
      <symbol id="icon-heart" viewBox="0 0 32 30">
        <path
          d="M28.69 3.21a8.4 8.4 0 0 0-11.17 0L16 4.66l-1.52-1.45a8.4 8.4 0 0 0-11.17 0 7.6 7.6 0 0 0 0 10.67l1.52 1.45L16 26l11.17-10.67 1.52-1.45a7.6 7.6 0 0 0 0-10.67Z"
          fill="currentColor"
        />
      </symbol>
      <symbol id="icon-cart" viewBox="0 0 24 24">
        <path
          d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"
          fill="currentColor"
        />
      </symbol>
      <symbol id="icon-profile" viewBox="0 0 24 24">
        <path
          d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          fill="currentColor"
        />
      </symbol>
      <symbol id="icon-login" viewBox="0 0 24 24">
        <path
          d="M10.09 15.59 11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
          fill="currentColor"
        />
      </symbol>
      <symbol id="icon-logout" viewBox="0 0 24 24">
        <path
          d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
          fill="currentColor"
        />
      </symbol>
    </defs>
  </svg>
);

export default Header;
