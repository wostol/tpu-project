import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./HomePage.module.css";
import useAuth from "../auth/useAuth";
import heroImage from "../image/people.jpg";

/* ---------- inline-SVG иконки (замена lucide-react) ---------- */
const PATHS = {
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  award: (
    <>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11" />
    </>
  ),
  medal: (
    <>
      <path d="M7.21 15 5 22l7-3 7 3-2.21-7" />
      <circle cx="12" cy="10" r="6" />
    </>
  ),
  footprints: (
    <>
      <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 0 1-2 2 2 2 0 0 1-2-2Z" />
      <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 0 0 2 2 2 2 0 0 0 2-2Z" />
    </>
  ),
  shoppingBag: (
    <>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </>
  ),
  usersRound: (
    <>
      <path d="M18 21a8 8 0 0 0-16 0" />
      <circle cx="10" cy="8" r="5" />
      <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
    </>
  ),
  handHeart: (
    <>
      <path d="M11 14h2a2 2 0 0 0 2-2 2 2 0 0 0-2-2h-3c-.6 0-1.1.2-1.4.6L3 16" />
      <path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
      <path d="m2 15 6 6" />
      <path d="M19.5 8.5c.7-.7 1.5-1.6 1.5-2.5A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 2c0 1 .8 1.7 1.5 2.5L16 13Z" />
    </>
  ),
  waves: (
    <>
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </>
  ),
  bookOpen: (
    <>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </>
  ),
  glassWater: (
    <>
      <path d="M5.3 4h13.4l-.9 14.5a2 2 0 0 1-2 1.5H8.2a2 2 0 0 1-2-1.5z" />
      <path d="M6 9h12" />
    </>
  ),
  shirt: (
    <path d="M20.42 11.42 16.96 7.96A2 2 0 0 0 15.55 7h-1.55V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v2H7.45a2 2 0 0 0-1.41.54l-3.46 3.46a1 1 0 0 0 0 1.42l1.42 1.42a1 1 0 0 0 1.41 0L7 14v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-7l1.59 1.59a1 1 0 0 0 1.41 0l1.42-1.42a1 1 0 0 0 0-1.42z" />
  ),
  ticket: (
    <>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </>
  ),
  userRound: (
    <>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="5" />
    </>
  ),
};

const Icon = ({ name, size = 18, strokeWidth = 2, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {PATHS[name]}
  </svg>
);

/* ---------- данные (из официального homepage.tsx) ---------- */
const benefits = [
  {
    number: "01",
    icon: "award",
    title: "Баллы за участие и вклад",
    copy: "Баллы начисляются за участие, поддержку команды, волонтёрство и капитанство. За событие можно получить 20–170 баллов — сумма зависит от его масштаба.",
  },
  {
    number: "02",
    icon: "medal",
    title: "Уровни и награды",
    copy: "Накопленные баллы открывают уровни программы, бонусы к физическому воспитанию и доступ к наградам.",
  },
  {
    number: "03",
    icon: "footprints",
    title: "Зачёт по физическому воспитанию",
    copy: "Баллы за отдельные типы мероприятий также засчитываются по физическому воспитанию. Условия указаны в карточке события.",
  },
  {
    number: "04",
    icon: "shoppingBag",
    title: "Мерч и скидка в ФОЦ",
    copy: "Обменивайте баллы на товары спортклуба. На уровне «Платиновый» действует скидка 10% в ФОЦ.",
  },
];

const events = [
  {
    type: "Командный спорт",
    title: "Турнир факультетов",
    icon: "usersRound",
    summary: "Командный формат: участие в турнире или поддержка игроков.",
  },
  {
    type: "Волонтёрство",
    title: "День спорта ТПУ",
    icon: "handHeart",
    summary: "Волонтёрская помощь при проведении мероприятия.",
  },
  {
    type: "Тренировка",
    title: "Открытая тренировка",
    icon: "waves",
    summary: "Спортивное занятие, открытое для участников программы.",
  },
];

const levels = [
  { threshold: "0", bonus: "2%" },
  { threshold: "500", bonus: "7%" },
  { threshold: "1 200", bonus: "10%" },
  { threshold: "2 500", bonus: "15%" },
  { threshold: "3 500", bonus: "17%" },
  { threshold: "5 000", bonus: "20%" },
];

const merch = [
  { icon: "bookOpen", name: "Блокнот" },
  { icon: "glassWater", name: "Бутылка" },
  { icon: "shirt", name: "Футболка" },
  { icon: "shoppingBag", name: "Сумка" },
];

// Статистика сезона — пока пустой массив: реальные данные должны приходить из системы.
const seasonStats = [];

const steps = [
  {
    n: "01",
    title: "Войдите через ТПУ",
    text: "Используйте аккаунт Томского политехнического университета.",
    icon: "userRound",
  },
  {
    n: "02",
    title: "Выберите событие и роль",
    text: "Запишитесь как участник, болельщик, волонтёр или капитан.",
    icon: "ticket",
  },
  {
    n: "03",
    title: "Участвуйте и получайте баллы",
    text: "Баллы начисляются за участие; их можно обменять на товары спортклуба.",
    icon: "medal",
  },
];

const questions = [
  {
    q: "Как начисляются баллы?",
    a: "За участие, поддержку команды, волонтёрство и капитанство начисляют 20–170 баллов — в зависимости от масштаба события.",
  },
  {
    q: "Какие события дают зачёт по физическому воспитанию?",
    a: "Баллы за отдельные типы мероприятий также засчитываются по физическому воспитанию. Условия указаны в карточке события.",
  },
  {
    q: "Как и когда можно получить награду?",
    a: "Баллы можно обменять на награды спортклуба. Порядок и сроки выдачи проверьте в правилах программы.",
  },
  {
    q: "Можно ли отменить запись или заказ?",
    a: "Условия отмены нужно проверить в правилах мероприятия или заказа.",
  },
  {
    q: "Что будет, если не прийти на мероприятие?",
    a: "Условия неявки нужно проверить в правилах конкретного события.",
  },
];

/* ---------- компонент ---------- */
export default function HomePage() {
  const { login } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);

  const handleLogin = () => {
    sessionStorage.setItem("returnUrl", "/events");
    login();
  };

  return (
    <div className={styles.loyalty}>
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes rise-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .tpu-enter { animation: rise-in .7s cubic-bezier(.2,.75,.25,1) both; }
        .tpu-enter-delay { animation-delay: .12s; }
        .tpu-enter-delay-2 { animation-delay: .22s; }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .tpu-enter { animation: none; }
        }
      `}</style>

      <a href="#main-content" className={styles.skipLink}>
        К основному содержанию
      </a>

      <main id="main-content">
        {/* HERO */}
        <section id="top" className={styles.hero}>
          <div className={styles.heroBg}>
            <img src={heroImage} alt="" className={styles.heroBgImg} />
            <div className={styles.heroOverlay} />
            <div className={styles.heroOverlayTop} />
          </div>
          <div className={styles.heroInner}>
            <div className={styles.heroContent}>
              <h1 className={`${styles.heroTitle} tpu-enter tpu-enter-delay`}>
                Баллы за участие
                <br />в спорте <span className={styles.accent}>ТПУ</span>
              </h1>
              <p className={`${styles.heroText} tpu-enter tpu-enter-delay-2`}>
                За участие, поддержку команды, волонтёрство и капитанство
                начисляются 20–170 баллов — в зависимости от масштаба события.
                Баллы за отдельные мероприятия также идут в зачёт по физическому
                воспитанию и обмениваются на мерч.
              </p>
              <div className={styles.heroActions}>
                <Link to="/events" className={styles.btnPrimary}>
                  Выбрать мероприятие <Icon name="arrowRight" size={17} />
                </Link>
                <a href="#how-it-works" className={styles.btnGhost}>
                  Как это работает <Icon name="arrowUpRight" size={16} />
                </a>
              </div>
              <button
                type="button"
                className={styles.heroLogin}
                onClick={handleLogin}
              >
                <Icon
                  name="userRound"
                  size={16}
                  className={styles.heroLoginIcon}
                />
                Вход через аккаунт ТПУ
              </button>
              {seasonStats.length > 0 && (
                <div className={styles.seasonStats}>
                  {seasonStats.map(({ value, label }) => (
                    <div key={label} className={styles.seasonStat}>
                      <div className={styles.seasonValue}>{value}</div>
                      <div className={styles.seasonLabel}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section id="benefits" className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.benefitsGrid}>
              <div className={styles.benefitsLeft}>
                <h2 className={styles.titleSerif}>Что даёт программа</h2>
                <a href="#levels" className={styles.eyebrowLink}>
                  Пороги и бонусы <Icon name="arrowUpRight" size={15} />
                </a>
              </div>
              <div className={styles.benefitsRight}>
                {benefits.map(({ number, icon, title, copy }) => (
                  <article key={number} className={styles.benefitCard}>
                    <div className={styles.benefitHead}>
                      <span className={styles.benefitIconWrap}>
                        <Icon name={icon} size={18} />
                      </span>
                      <span className={styles.benefitNum}>{number}</span>
                    </div>
                    <h3 className={styles.cardTitleSerif}>{title}</h3>
                    <p className={styles.benefitCopy}>{copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className={styles.howSection}>
          <div className={styles.sectionInner}>
            <h2 className={styles.titleSerif}>Как это работает</h2>
            <ol className={styles.howList}>
              {steps.map(({ n, title, text, icon }) => (
                <li key={n} className={styles.stepItem}>
                  <div className={styles.stepHead}>
                    <span className={styles.stepNum}>{n}</span>
                    <Icon name={icon} size={19} className={styles.stepIcon} />
                  </div>
                  <h3 className={styles.stepTitle}>{title}</h3>
                  <p className={styles.stepCopy}>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* EVENTS */}
        <section id="events" className={styles.section}>
          <div className={styles.sectionInner}>
            <h2 className={styles.titleSerif}>Ближайшие мероприятия</h2>
            <div className={styles.eventsGrid}>
              {events.map((event, index) => (
                <article key={event.title} className={styles.eventCard}>
                  <div
                    className={`${styles.eventBanner} ${index === 1 ? styles.eventBannerAlt : ""}`}
                  >
                    <span
                      className={`${styles.eventTag} ${index === 1 ? styles.eventTagAlt : ""}`}
                    >
                      <Icon name={event.icon} size={15} /> {event.type}
                    </span>
                  </div>
                  <div className={styles.eventBody}>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                    <p className={styles.eventSummary}>{event.summary}</p>
                    <Link to="/events" className={styles.eventBtn}>
                      Как записаться <Icon name="arrowUpRight" size={14} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <div className={styles.eventsNote}>
              Примеры форматов. Дата и время, место, баллы, статус и свободные
              места, срок записи появятся из расписания.
            </div>
          </div>
        </section>

        {/* LEVELS */}
        <section id="levels" className={styles.levelsSection}>
          <div id="rules" className={styles.sectionInner}>
            <div className={styles.levelsGrid}>
              <div className={styles.levelsLeft}>
                <h2 className={styles.titleWhite}>Уровни и бонусы</h2>
                <p className={styles.levelsIntro}>
                  Уровни — от «Бронзового» до «Сибирского льва». Порог и бонус
                  для каждого уровня указаны в списке.
                </p>
                <a href="#faq" className={styles.levelsCtaLink}>
                  Вопросы об участии <Icon name="arrowUpRight" size={15} />
                </a>
              </div>
              <div className={styles.levelsRight}>
                <p className={styles.levelsHint}>
                  Бонус к физическому воспитанию
                </p>
                <ol className={styles.levelsList}>
                  {levels.map(({ threshold, bonus }, i) => (
                    <li key={threshold} className={styles.levelItem}>
                      <span
                        className={`${styles.levelNum} ${i === levels.length - 1 ? styles.levelNumLast : ""}`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className={styles.levelThreshold}>
                        {threshold} баллов
                      </h3>
                      <span className={styles.levelBonus}>{bonus}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <div className={styles.levelsFoot}>
              <p>
                <span className={styles.strong}>Награды:</span> ручка, блокнот,
                сумка, бутылка или кепка, футболка, худи.
              </p>
              <p>На уровне «Платиновый» — скидка 10% в ФОЦ.</p>
            </div>
          </div>
        </section>

        {/* MERCH */}
        <section id="merch" className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.merchHeadRow}>
              <h2 className={styles.titleSerif}>Мерч за баллы</h2>
              <p className={styles.merchIntro}>
                Мерч спортклуба можно получить в обмен на баллы.
              </p>
            </div>
            <div className={styles.merchGrid}>
              {merch.map(({ icon, name }, index) => (
                <article key={name} className={styles.merchCard}>
                  <div
                    className={`${styles.merchTile} ${index % 2 === 0 ? "" : styles.merchTileAlt}`}
                  >
                    <div className={styles.merchTileBar} />
                    <Icon
                      name={icon}
                      size={48}
                      strokeWidth={1.2}
                      className={styles.merchIcon}
                    />
                  </div>
                  <div className={styles.merchName}>
                    <h3>{name}</h3>
                  </div>
                </article>
              ))}
            </div>
            <div className={styles.merchNote}>
              <p>
                При нехватке баллов покажем, сколько осталось до стоимости
                товара.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className={styles.faqSection}>
          <div className={styles.sectionInner}>
            <div className={styles.faqGrid}>
              <div>
                <h2 className={styles.titleSerif}>
                  Вопросы
                  <br />и ответы
                </h2>
              </div>
              <div className={styles.faqList}>
                {questions.map(({ q, a }, i) => (
                  <div key={q} className={styles.faqItem}>
                    <h3>
                      <button
                        type="button"
                        aria-expanded={openFaq === i}
                        aria-controls={`faq-panel-${i}`}
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className={styles.faqQuestion}
                      >
                        {q}
                        <Icon
                          name="chevronDown"
                          size={18}
                          className={`${styles.faqChevron} ${openFaq === i ? styles.faqChevronOpen : ""}`}
                        />
                      </button>
                    </h3>
                    <div
                      id={`faq-panel-${i}`}
                      role="region"
                      hidden={openFaq !== i}
                      className={styles.faqAnswer}
                    >
                      {a}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="sign-in" className={styles.ctaSection}>
          <div className={styles.ctaInner}>
            <div>
              <h2 className={styles.ctaTitle}>Запись на мероприятие</h2>
              <p className={styles.ctaText}>
                Выберите событие и проверьте условия участия в его карточке.
              </p>
            </div>
            <Link to="/events" className={styles.ctaBtn}>
              Смотреть мероприятия <Icon name="arrowRight" size={17} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
