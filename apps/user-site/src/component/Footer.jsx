import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../auth/apiClient";
import "./Footer.css";
import logo from "./lion.png";

/* ================= контент подвала (единая точка правки) ================= */
const BRAND_TITLE = "Спортклуб ТПУ";
const BRAND_SUBTITLE = "Программа лояльности";
const IDENTITY_LINE = "";
const SLOGAN = "Спортклуб — это не просто спортклуб";

const SOCIALS = [
  {
    key: "vk",
    label: "Сообщество «Сибирские львы» во ВКонтакте",
    href: "https://vk.com/sib_lions",
    icon: "vk",
  },
  {
    key: "tg",
    label: "Телеграм-канал «Сибирские львы»",
    href: "https://t.me/sib_lions",
    icon: "telegram",
  },
  {
    key: "ok",
    label: "«Сибирские львы» в Одноклассниках",
    href: "https://ok.ru/siblions",
    icon: "ok",
  },
  {
    key: "yt",
    label: "Видеоканал «Сибирские львы»",
    href: "https://www.youtube.com/@sib_lions",
    icon: "youtube",
  },
];
const VK_HASHTAG_URL =
  "https://vk.com/search?c%5Bsection%5D=statuses&c%5Bq%5D=%23siblions";

const CONTACTS = {
  place: "Спорткомплекс «Здоровье», ТПУ",
  street: "634050, г. Томск, пр. Ленина, 30",
  email: "sportclub@tpu.ru",
  phones: [
    {
      label: "Руководитель",
      display: "+7 (3822) 60-99-05",
      tel: "+73822609905",
    },
    {
      label: "Пресс-служба",
      display: "+7 (3822) 70-56-85",
      tel: "+73822705685",
    },
  ],
  university: {
    label: "Университет",
    display: "tpu.ru",
    href: "https://tpu.ru",
  },
};

const NAV_SECTIONS = [
  {
    key: "sections",
    title: "Разделы",
    links: [
      { label: "Главная", to: "/" },
      { label: "Мероприятия", to: "/events" },
      { label: "Магазин", to: "/shop" },
      { label: "Избранное", to: "/favorites" },
    ],
  },
  {
    key: "program",
    title: "Программа",
    links: [
      { label: "Правила и уровни", to: "/levels" },
      { label: "Регламент", to: "/levels#reglament-title" },
    ],
  },
  {
    key: "profile",
    title: "Личный кабинет",
    links: [
      { label: "Обзор", to: "/profile?tab=overview" },
      { label: "Достижения", to: "/profile?tab=achievements" },
      { label: "Баллы", to: "/profile?tab=points" },
      { label: "Заказы", to: "/profile?tab=orders" },
      { label: "Настройки", to: "/profile?tab=settings" },
    ],
  },
];

/* ================= логика мероприятий: кэш + single-flight ================= */
const TTL = 5 * 60 * 1000;
const LIMIT = 3;
const cache = { at: 0, data: null, promise: null };

const toDate = (v) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

const normalize = (raw) =>
  Array.isArray(raw)
    ? raw
        .map((e) => ({
          id: e.uuid ?? e.id,
          title: (e.title ?? "").trim() || "Мероприятие без названия",
          date: toDate(e.startDate),
        }))
        .filter((e) => e.id && e.date)
    : [];

const pick = (events) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date - b.date)
    .slice(0, LIMIT)
    .map((e) => ({ ...e, status: "upcoming" }));
  if (upcoming.length) return upcoming;
  return events
    .filter((e) => e.date < today)
    .sort((a, b) => b.date - a.date)
    .slice(0, LIMIT)
    .map((e) => ({ ...e, status: "finished" }));
};

const loadFooterEvents = (fetcher) => {
  if (cache.data && Date.now() - cache.at < TTL)
    return Promise.resolve(cache.data);
  if (cache.promise) return cache.promise;
  cache.promise = fetcher()
    .then((raw) => {
      const data = pick(normalize(raw));
      cache.data = data;
      cache.at = Date.now();
      cache.promise = null;
      return data;
    })
    .catch((err) => {
      cache.promise = null;
      throw err;
    });
  return cache.promise;
};

const formatEventDate = (date) => {
  const base = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(date);
  return date.getFullYear() === new Date().getFullYear()
    ? base
    : `${base} ${date.getFullYear()}`;
};

/* ================= хуки ================= */
const useMediaQuery = (query) => {
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
};

const useReveal = (ref) => {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.classList.add("js");
    if (!("IntersectionObserver" in window)) {
      node.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            node.classList.add("is-visible");
            io.disconnect();
          }
        });
      },
      { threshold: 0.08 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [ref]);
};

/* ================= иконки соцсетей ================= */
const SocialIcon = ({ name }) => {
  if (name === "vk")
    return (
      /* современная монограмма VK (буквенный знак, не устаревшая «волна») */
      <svg className="social-svg" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M2.2 6.4h2.5l2.1 6.9 2.1-6.9h2.4L7.9 17.6H5.6L2.2 6.4zm10.2 0h2.4v4.5l3.6-4.5h2.9l-4 4.9 4.3 6.3h-2.9l-3-4.6-.9 1.1v3.5h-2.4V6.4z"
        />
      </svg>
    );
  if (name === "telegram")
    return (
      <svg className="social-svg" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"
        />
      </svg>
    );
  if (name === "ok")
    return (
      <svg className="social-svg" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M11.99 0C8.7 0 6.03 2.68 6.03 5.97c0 3.3 2.67 5.97 5.96 5.97 3.3 0 5.97-2.67 5.97-5.97C17.96 2.68 15.29 0 11.99 0zm0 8.4a2.43 2.43 0 1 1 0-4.86 2.43 2.43 0 0 1 0 4.86zm5.4 6.13c.66-.66.66-1.73 0-2.4-.66-.66-1.73-.66-2.4 0-1.66 1.66-4.35 1.66-6.01 0-.66-.66-1.73-.66-2.4 0-.66.67-.66 1.74 0 2.4 1.1 1.1 2.45 1.76 3.85 1.98l-3.4 3.4c-.66.66-.66 1.73 0 2.4.34.33.77.5 1.2.5.44 0 .87-.17 1.2-.5l3.56-3.56 3.56 3.56c.33.33.76.5 1.2.5.43 0 .86-.17 1.2-.5.66-.67.66-1.74 0-2.4l-3.4-3.4c1.4-.22 2.75-.88 3.84-1.98z"
        />
      </svg>
    );
  return (
    <svg className="social-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.5 15.5v-7l6.3 3.5-6.3 3.5z"
      />
    </svg>
  );
};

/* ================= подкомпоненты ================= */
const Chevron = () => (
  <svg className="acc-chevron" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M3 6l5 5 5-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ColumnShell = ({
  id,
  title,
  isMobile,
  open,
  onToggle,
  children,
  className = "",
}) => (
  <section className={`footer-col ${className}`.trim()}>
    {isMobile ? (
      <button
        type="button"
        id={`${id}-head`}
        className="footer-col-head acc-head"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
      >
        <span className="footer-col-title">{title}</span>
        <Chevron />
      </button>
    ) : (
      <h3 className="footer-col-head">
        <span className="footer-col-title">{title}</span>
      </h3>
    )}
    <div
      id={`${id}-panel`}
      className={`acc-panel${open || !isMobile ? " open" : ""}`}
      role={isMobile ? "region" : undefined}
      aria-labelledby={isMobile ? `${id}-head` : undefined}
    >
      <div className="acc-inner">{children}</div>
    </div>
  </section>
);

const NavList = ({ links }) => (
  <ul className="footer-col-list">
    {links.map((link) => (
      <li key={link.to}>
        <Link to={link.to} className="footer-link">
          {link.label}
        </Link>
      </li>
    ))}
  </ul>
);

const EventItem = ({ event }) => {
  const finished = event.status === "finished";
  return (
    <li className={`footer-event${finished ? " footer-event--past" : ""}`}>
      <Link
        to={`/event/${event.id}`}
        className="footer-link footer-event-link"
        aria-label={
          finished
            ? `${event.title}, ${formatEventDate(event.date)}, завершено`
            : `${event.title}, ${formatEventDate(event.date)}`
        }
      >
        <span className="footer-event-title">{event.title}</span>
        <span className="footer-event-meta" aria-hidden="true">
          <span className="footer-event-date">
            {formatEventDate(event.date)}
          </span>
          {finished ? (
            <span className="footer-event-badge">Завершено</span>
          ) : (
            <span className="footer-event-dot" />
          )}
        </span>
      </Link>
    </li>
  );
};

const BackToTop = ({ enabled }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }
    let tick = false;
    const onScroll = () => {
      if (tick) return;
      tick = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > 600);
        tick = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled]);

  const scrollTop = () => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      className={`footer-totop${visible ? " is-visible" : ""}`}
      onClick={scrollTop}
      aria-label="Наверх"
      tabIndex={visible ? 0 : -1}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 13V3M3.5 7.5L8 3l4.5 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

/* ================= Footer ================= */
const Footer = () => {
  const rootRef = useRef(null);
  const currentYear = new Date().getFullYear();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState({
    events: true,
    sections: false,
    program: false,
    profile: false,
  });

  useReveal(rootRef);

  useEffect(() => {
    let cancelled = false;
    loadFooterEvents(() => apiRequest("/events", { method: "GET" }))
      .then((data) => {
        if (!cancelled) {
          setEvents(data);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Footer: не удалось загрузить мероприятия:", error);
        setEvents([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (key) => setOpen((s) => ({ ...s, [key]: !s[key] }));

  return (
    <footer className="footer" ref={rootRef}>
      {/* единая 12-колоночная сетка: бренд, навигация, контакты и низ
          привязаны к одним и тем же трекам — левые границы совпадают */}
      <div className="footer-container footer-grid12">
        {/* ---- бренд: колонки 1–4 ---- */}
        <div className="footer-brand reveal">
          <Link
            to="/"
            className="footer-brand-link"
            aria-label="Сибирские львы — на главную"
          >
            <img src={logo} alt="" className="footer-logo" />
            <span className="footer-brand-text">
              <span className="footer-brand-title">{BRAND_TITLE}</span>
              <span className="footer-brand-sub">{BRAND_SUBTITLE}</span>
            </span>
          </Link>
          <p className="footer-identity">{IDENTITY_LINE}</p>
          <p className="footer-slogan">«{SLOGAN}»</p>
          <div className="footer-social">
            {SOCIALS.map((social) => (
              <a
                key={social.key}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label={social.label}
                title={social.label}
              >
                <SocialIcon name={social.icon} />
              </a>
            ))}
            <a
              href={VK_HASHTAG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link footer-hashtag"
              aria-label="Сообщения с хештегом #siblions во ВКонтакте"
            >
              #siblions
            </a>
          </div>
        </div>

        {/* ---- навигационное ядро: колонки 5–6, 7–8, 9–10, 11–12 ---- */}
        <ColumnShell
          id="fc-events"
          title="Мероприятия"
          isMobile={isMobile}
          open={open.events}
          onToggle={() => toggle("events")}
          className="reveal fc-events"
        >
          <ul className="footer-col-list">
            {loading ? (
              <>
                <li className="footer-skeleton-item" aria-hidden="true" />
                <li className="footer-skeleton-item" aria-hidden="true" />
                <li className="footer-skeleton-item" aria-hidden="true" />
              </>
            ) : events.length > 0 ? (
              <>
                {events.map((event) => (
                  <EventItem key={event.id} event={event} />
                ))}
                <li>
                  <Link to="/events" className="footer-link footer-more">
                    Все мероприятия <span className="footer-more-arrow">→</span>
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li className="footer-empty-note">
                  Расписание обновляется — загляните позже
                </li>
                <li>
                  <Link to="/events" className="footer-link footer-more">
                    Календарь событий{" "}
                    <span className="footer-more-arrow">→</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </ColumnShell>

        {NAV_SECTIONS.map((section, i) => (
          <ColumnShell
            key={section.key}
            id={`fc-${section.key}`}
            title={section.title}
            isMobile={isMobile}
            open={open[section.key]}
            onToggle={() => toggle(section.key)}
            className={`reveal reveal-d${i + 1} fc-${section.key}`}
          >
            <nav aria-label={section.title}>
              <NavList links={section.links} />
            </nav>
          </ColumnShell>
        ))}

        <div className="footer-divider" aria-hidden="true" />

        {/* ---- контакты: те же треки, что и верх (адрес под брендом) ---- */}
        <address className="footer-contacts reveal" aria-label="Контакты">
          <div className="footer-contact">
            <span className="footer-contact-label">Адрес</span>
            <span className="footer-contact-value">
              <span className="footer-contact-place">{CONTACTS.place}</span>
              <span className="footer-contact-street">{CONTACTS.street}</span>
            </span>
          </div>
          {CONTACTS.phones.map((phone) => (
            <div className="footer-contact" key={phone.label}>
              <span className="footer-contact-label">{phone.label}</span>
              <a
                href={`tel:${phone.tel}`}
                className="footer-link footer-contact-value"
              >
                {phone.display}
              </a>
            </div>
          ))}
          <div className="footer-contact">
            <span className="footer-contact-label">Почта</span>
            <a
              href={`mailto:${CONTACTS.email}`}
              className="footer-link footer-contact-value"
            >
              {CONTACTS.email}
            </a>
          </div>
          <div className="footer-contact">
            <span className="footer-contact-label">
              {CONTACTS.university.label}
            </span>
            <a
              href={CONTACTS.university.href}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link footer-contact-value"
            >
              {CONTACTS.university.display}
            </a>
          </div>
        </address>

        <div className="footer-divider" aria-hidden="true" />

        {/* ---- право: на всю ширину сетки ---- */}
        <div className="footer-bottom">
          <p className="copyright">
            © {currentYear} Национальный исследовательский Томский
            политехнический университет
            <span className="copyright-sep" aria-hidden="true">
              ·
            </span>
            <span className="copyright-club">Спортклуб «Сибирские Львы»</span>
          </p>
          <nav className="footer-legal" aria-label="Правовая информация">
            <Link to="/privacy" className="footer-link footer-legal-link">
              Политика конфиденциальности
            </Link>
            <Link to="/consent" className="footer-link footer-legal-link">
              Согласие на обработку персональных данных
            </Link>
          </nav>
        </div>
      </div>

      <BackToTop enabled={isMobile} />
    </footer>
  );
};

export default Footer;
