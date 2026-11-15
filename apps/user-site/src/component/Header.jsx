import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import gsap from "gsap";
import useAuth from "../auth/useAuth";
import logo from "./lionsib.svg";
import "./Header.css";
// Прямая подписка на zustand store корзины: Header ре-рендерится при
// изменении items сам — без window-событий и чтения localStorage.
import { useCartStore, cartTotalCount } from "../Shop/cartStore.js";

/* ---------- Навигация ---------- */

/* Только текст. Иконка, дублирующая подпись («Главная» + домик), не несёт
   информации: она съедает ширину строки и создавала 14 визуальных акцентов
   в одной полосе. Роль «иконок» остаются за двумя честными сигналами —
   счётчиком корзины и CTA «Войти».
   Иконки у личных действий живут в DOM (Pill.icon), но показываются только
   на 769–1024px — там, где подписи физически не помещаются. */
const NAV_ITEMS = [
  { to: "/", label: "Главная", isActive: (p) => p === "/" },
  {
    to: "/events",
    label: "Мероприятия",
    isActive: (p) => p.startsWith("/events"),
  },
  { to: "/shop", label: "Магазин", isActive: (p) => p.startsWith("/shop") },
  { to: "/levels", label: "Правила", isActive: (p) => p.startsWith("/levels") },
];

const MOBILE_QUERY = "(max-width: 768px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

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

/* ---------- Pill ---------- */

/* aria-label — полное имя пункта: обязательно для режима «только иконки»
   (769–1024px), где .pill__label скрыт через display:none.
   data-tip — подпись для CSS-tooltip в этом же режиме (content: attr(data-tip)).
   title убран: нативный тултип дублировал кастомный и навязывал задержку.
   badge вынесен ИЗ иконки в отдельный элемент: в текстовом режиме это
   читаемая цифра-чип рядом с подписью, в режиме иконок — счётчик на углу цели. */
const Pill = ({ to, icon, label, active, badge = 0, onClick }) => (
  <Link
    to={to}
    data-pill=""
    className={`pill${active ? " is-active" : ""}`}
    aria-current={active ? "page" : undefined}
    aria-label={badge > 0 ? `${label}: ${badge}` : label}
    data-tip={label}
    onClick={onClick}
  >
    {icon && (
      <span className="pill__icon" aria-hidden="true">
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
      </span>
    )}
    <span className="pill__label">{label}</span>
    {badge > 0 && (
      <span className="pill__badge" aria-hidden="true">
        {badge > 99 ? "99+" : badge}
      </span>
    )}
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
  // Если пользователь не авторизован — бейдж не показываем (0).
  const rawCartCount = useCartStore((s) => cartTotalCount(s.items));
  const cartCount = isAuthenticated ? rawCartCount : 0;

  const headerRef = useRef(null);
  const brandRef = useRef(null);
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

  /* ---------- блокировка скролла при открытом drawer ----------
     Ключевой нюанс: в App.css у html стоит overflow-x: clip, поэтому
     overflow:hidden на body НЕ распространяется на viewport — body
     становится собственным scroll-контейнером, и iOS прокручивает его
     пальцем. Блокируем сам корневой скроллер (html): страница замирает
     на текущей позиции (проверено: scrollY сохраняется, ничего не
     прыгает), drawer отрендерен через portal и скроллится внутри себя.
     Нюанс №2: overflow:hidden на html пересчитывает sticky у шапки —
     панель «уезжает» за верх экрана. Поэтому на время блокировки шапка
     фиксируется position:fixed, а её место в потоке компенсируется
     padding-top у body — контент не дёргается. */
  useEffect(() => {
    if (!(isMobile && isMenuOpen)) return;
    const root = document.documentElement;
    const body = document.body;
    const header = headerRef.current;
    const scrollY = window.scrollY;
    const prevHtmlOverflow = root.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHeaderCss = header?.style.cssText ?? "";
    const prevBodyPaddingTop = body.style.paddingTop;

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (header) {
      header.style.position = "fixed";
      header.style.top = "0";
      header.style.left = "0";
      // компенсация выхода шапки из потока (высоту берём фактическую)
      body.style.paddingTop = `${header.offsetHeight}px`;
    }

    return () => {
      root.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      if (header) header.style.cssText = prevHeaderCss;
      body.style.paddingTop = prevBodyPaddingTop;
      if (window.scrollY !== scrollY) window.scrollTo(0, scrollY);
    };
  }, [isMobile, isMenuOpen]);

  /* ---------- Esc + ловушка фокуса в открытом drawer ----------
     Tab циклится внутри панели; Esc возвращает фокус на burger. */
  useEffect(() => {
    if (!(isMobile && isMenuOpen)) return;
    const burger = burgerRef.current;
    const nav = navRef.current;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsMenuOpen(false);
        burger?.focus({ preventScroll: true });
        return;
      }
      if (e.key !== "Tab" || !nav) return;

      // Бургер не включаем: при открытом drawer он уходит ПОД панель
      // (панель перекрывает правый верх) — мёртвая tab-стопа не нужна.
      // Закрытие: Esc, кнопка в шапке drawer, клик по overlay.
      const focusables = Array.from(
        nav.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;

      if (e.shiftKey) {
        if (current === first || !focusables.includes(current)) {
          e.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else if (current === last || !focusables.includes(current)) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobile, isMenuOpen]);

  /* ---------- inert: drawer вне a11y-дерева, когда закрыт; ----------
     когда открыт — бренд в панели «за диалогом» не фокусируется. */
  useEffect(() => {
    const nav = navRef.current;
    const brand = brandRef.current;
    if (nav) nav.inert = isMobile && !isMenuOpen;
    if (brand) brand.inert = isMobile && isMenuOpen;
    return () => {
      if (nav) nav.inert = false;
      if (brand) brand.inert = false;
    };
  }, [isMobile, isMenuOpen]);

  /* ---------- GSAP: появление шапки + индикатор-плашка ---------- */
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
        // offsetLeft корректен только при позиционированном <ul>;
        // подстраховка через getBoundingClientRect на случай конфликта CSS.
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
          ease: "power3.out",
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
      sync(false);
      if (reducedMotion) return;

      // Появление: панель мягко «опускается», пункты догоняют каскадом,
      // индикатор проявляется последним. transform — только на .header__inner,
      // чтобы не мешать position:sticky у самой шапки.
      const inner = headerRef.current?.querySelector(".header__inner");
      const pills = Array.from(nav.querySelectorAll("[data-pill]"));
      const indicators = groups.map((g) => g.indicator);

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        inner,
        { y: -12, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.55,
          clearProps: "transform,opacity,visibility",
        },
        0,
      )
        .fromTo(
          pills,
          { y: -8, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.4,
            stagger: 0.04,
            clearProps: "transform,opacity,visibility",
          },
          0.12,
        )
        .fromTo(
          indicators,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.35 },
          0.35,
        );
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
        clearProps: "transform,opacity,visibility",
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

    if (isMenuOpen) {
      drawerTouched.current = true;
      // visibility выставляем сразу (не в timeline): фокус должен быть
      // переносим в уже видимый drawer
      gsap.set([nav, overlay], { visibility: "visible" });

      const tl = gsap.timeline();
      tl.fromTo(
        overlay,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.25 * k, ease: "none" },
        0,
      )
        .fromTo(
          nav,
          { xPercent: 100 },
          { xPercent: 0, duration: 0.45 * k, ease: "power4.out" },
          0,
        )
        .fromTo(
          items,
          { y: 18, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.3 * k,
            stagger: 0.045 * k,
            ease: "power2.out",
            clearProps: "transform,opacity,visibility",
          },
          0.1 * k,
        );

      // Перенос фокуса в drawer: SR объявляет диалог, Tab начинает с 1-го пункта
      requestAnimationFrame(() => {
        const first = nav.querySelector("a[href], button:not([disabled])");
        first?.focus({ preventScroll: true });
      });

      return () => tl.kill();
    }

    const tl = gsap.timeline();
    tl.to(nav, { xPercent: 100, duration: 0.3 * k, ease: "power3.in" })
      .to(overlay, { autoAlpha: 0, duration: 0.22 * k, ease: "none" }, 0)
      .set([nav, overlay], { visibility: "hidden" });
    return () => tl.kill();
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

  /* Бренд в панели — одна строка. «ПРОГРАММА ЛОЯЛЬНОСТИ» переехала в drawer:
     в 10px капслоком на полупрозрачном фоне она была микротипографикой,
     которую почти невозможно прочитать. */
  const brand = (
    <Link
      to="/"
      ref={brandRef}
      className="brand"
      onClick={closeMenu}
      aria-label="Спортклуб ТПУ — на главную"
    >
      <img src={logo} alt="" className="brand__logo" width={44} height={44} />
      <span className="brand__title">СПОРТКЛУБ ТПУ</span>
    </Link>
  );

  /* Drawer + overlay. На мобиле они рендерятся в document.body через portal.
     Причина: backdrop-filter шапки создаёт containing block для
     position:fixed-потомков — «фиксированный» drawer внутри шапки
     позиционируется относительно ШАПКИ, а не viewport. Раньше при открытии
     меню на глубоком скролле панель уезжала за верх экрана. Портал выносит
     drawer из контекста шапки: он всегда честно фиксирован к viewport и
     открывается у текущего экрана на любой глубине прокрутки.
     На десктопе навигация остаётся обычным inline-элементом шапки. */
  const navNode = (
    <nav
      className="main-nav"
      id="primary-navigation"
      ref={navRef}
      aria-label="Основная навигация"
      role={isMobile ? "dialog" : undefined}
      aria-modal={isMobile && isMenuOpen ? "true" : undefined}
    >
      {/* Шапка drawer: брендблок + кнопка закрытия. Панель перекрывает
          бургер в правом верхнем углу, поэтому «крестик» живёт внутри
          самой панели — на том же месте, где был бургер. */}
      <div className="drawer-head">
        <div className="drawer-brand">
          <img
            src={logo}
            alt=""
            className="drawer-brand__logo"
            width={40}
            height={40}
          />
          <span className="drawer-brand__text">
            <span className="drawer-brand__title">СПОРТКЛУБ ТПУ</span>
            <span className="drawer-brand__subtitle">Программа лояльности</span>
          </span>
        </div>
        <button
          type="button"
          className="drawer-close"
          onClick={closeMenu}
          aria-label="Закрыть меню"
        >
          <svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M6 6l12 12M18 6 6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

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
              className="pill pill--cta"
              onClick={handleLoginClick}
              aria-label="Войти"
              data-tip="Войти"
            >
              <span className="pill__icon" aria-hidden="true">
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
  );

  const overlayNode = (
    <div
      className="menu-overlay"
      ref={overlayRef}
      onClick={closeMenu}
      aria-hidden="true"
    />
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

          {/* На мобиле drawer + overlay живут в document.body (portal) —
              см. комментарий у navNode. На десктопе — inline в шапке. */}
          {isMobile ? (
            createPortal(
              <>
                {overlayNode}
                {navNode}
              </>,
              document.body,
            )
          ) : (
            <>
              {navNode}
              {overlayNode}
            </>
          )}
        </div>
      </div>

      {/* Спрайт оставлен полностью: symbol-и могут использоваться
          другими компонентами через <use href="#icon-..."> */}
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
      <symbol id="icon-rules" viewBox="0 0 24 24">
        <path
          d="M7.21 15 5 22l7-3 7 3-2.21-7M12 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 3.2.9 1.83 2.02.3-1.46 1.42.34 2.01L12 9.8l-1.8.95.34-2.01-1.46-1.43 2.02-.29L12 5.2z"
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
