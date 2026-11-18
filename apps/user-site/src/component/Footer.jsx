import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../auth/apiClient";
import useAuth from "../auth/useAuth";
import { loadFooterEvents, formatEventDate } from "./footerEvents";
import "./Footer.css";
import logo from "./lion.png";
import VK from "./VK.png";

/*
 * Подвал «Сибирских Львов» — раунд 2 по результатам ревью.
 *
 * ЧТО ИЗМЕНИЛОСЬ ОТНОСИТЕЛЬНО ПРЕДЫДУЩЕЙ ВЕРСИИ
 *
 * КОМПОЗИЦИЯ
 *   - Порядок колонок: Мероприятия | Разделы | Контакты | Программа |
 *     Личный кабинет. Центр сетки (самое видное место под логотипом)
 *     отдан «Контактам» — универсально полезному блоку; «Личный
 *     кабинет» уехал на правую периферию (ревью: в центре стоял блок,
 *     мёртвый для гостя).
 *   - «Личный кабинет» рендерится по авторизации (useAuth): гость видит
 *     один рабочий пункт «Войти» (как в хедере — с сохранением returnUrl),
 *     авторизованный — пять ссылок на вкладки. Раньше все пять вели гостя
 *     на экран авторизации через ProtectedRoute.
 *   - ВКонтакте переехал из отдельной строки между сеткой и нижней
 *     панелью («одинокая» строка) в колонку «Контакты»: строка
 *     «Сообщество» — иконка + vk.com/sib_lions + хештег #siblions.
 *
 * АФФОРДАНСЫ
 *   - Статус прошедшего события — простой текст ПОСЛЕ даты
 *     («12 июня · Завершено»). Пилюля с рамкой выглядела кнопкой
 *     (ложная аффорданса) и на узкой колонке переносилась НАД датой,
 *     ломая порядок «дата первична, статус вторичен».
 *   - В контактах кликабельное отличимо от некликабельного: у ссылок
 *     (телефон, почта, tpu.ru, ВК) подчёркивание видно в покое; адрес —
 *     белый текст без линии. Раньше всё набиралось одинаково.
 *   - #siblions получил постоянное подчёркивание — «мост» в комьюнити
 *     читается как ссылка, а не как подпись.
 *   - У прошедших событий нет hover-подсветки: архивная запись не
 *     «вспыхивает» как активная (сами ссылки рабочие, фокус с
 *     клавиатуры сохранён).
 *
 * ЛОГОТИП
 *   - Убран отрицательный margin-top: логотип больше не выходит за
 *     верхнюю границу подвала и не перекрывает контент страниц.
 *
 * ЛОГИКА «МЕРОПРИЯТИЙ» (без изменений с раунда 1)
 *   - ОДИН запрос на монтирование (пустые зависимости эффекта), защита
 *     от повтора — кэш/single-flight в footerEvents.js, а не длина
 *     массива; флаг cancelled — без записи состояния после размонтирования.
 *   - Нормализация до сортировки, статус у прошедших, формат дат —
 *     см. footerEvents.js (фиксация решения (б)).
 *
 * БРЕНДБУК
 *   - Заголовки колонок — курсивное полужирное начертание Kontora.
 *   - Единственный акцент — зелёный #28be46. Официальная площадка —
 *     только ВКонтакте.
 *
 * ДОСТУПНОСТЬ
 *   - Колонки-навигация — <nav aria-label>, контакты — <address>;
 *     видимый фокус :focus-visible и для ссылок, и для кнопки «Войти».
 *
 * ЮРИДИЧЕСКОЕ (152-ФЗ)
 *   - В нижней панели — ссылки на /privacy и /consent (LegalPages.jsx);
 *     правовой блок набран ярче копирайта (muted против dim).
 */

/* ---------- Контент подвала: правится в одном месте ---------- */

// Строка-идентификатор из брендбука (под логотипом)
const IDENTITY_LINE =
  "Официальная страница студенческого спортивного клуба «Сибирские львы» ТПУ";

// Слоган брендбука. ВНИМАНИЕ: сверить дословно с оригинальным PDF —
// распознанный текст читал формулировку фрагментарно.
const SLOGAN = "Спортклуб — это не просто спортклуб";

const VK_COMMUNITY_URL = "https://vk.com/sib_lions";
// Поиск сообщений по хештегу внутри ВК — «мост» в комьюнити бренда
const VK_HASHTAG_URL =
  "https://vk.com/search?c%5Bsection%5D=statuses&c%5Bq%5D=%23siblions";

const CONTACTS = {
  address: "Спорткомплекс «Здоровье», ТПУ",
  // Адрес почты подтверждён макетом сайта (sportclub@tpu.ru)
  email: "sportclub@tpu.ru",
  // TODO(ВКР): подставить реальные номера — в исходниках они замаскированы.
  // display — как показывать на сайте, tel — что подставлять в href.
  phones: [
    {
      label: "Руководитель",
      display: "+7 (xxxx) xx-xx-xx",
      tel: "+7XXXXXXXXXX",
    },
    {
      label: "Пресс-служба",
      display: "+7 (xxxx) xx-xx-xx",
      tel: "+7XXXXXXXXXX",
    },
  ],
};

// Колонка «Разделы» — основная навигация по сайту
const SECTION_LINKS = [
  { label: "Главная", to: "/" },
  { label: "Мероприятия", to: "/events" },
  { label: "Магазин", to: "/shop" },
  { label: "Избранное", to: "/favorites" },
];

// Колонка «Программа» — правила и уровни
const PROGRAM_LINKS = [
  { label: "Правила и уровни", to: "/levels" },
  { label: "Регламент", to: "/levels#reglament-title" },
];

// Вкладки личного кабинета: видны ТОЛЬКО авторизованному.
// Для гостя эти пять адресов — экран авторизации (ProtectedRoute),
// поэтому в гостевом подвале вместо них один рабочий пункт «Войти».
const PROFILE_TAB_LINKS = [
  { label: "Обзор", to: "/profile?tab=overview" },
  { label: "Достижения", to: "/profile?tab=achievements" },
  { label: "Баллы", to: "/profile?tab=points" },
  { label: "Заказы", to: "/profile?tab=orders" },
  { label: "Настройки", to: "/profile?tab=settings" },
];

/* ---------- Подкомпоненты ---------- */

// Ссылка-пункт списка: подчёркивание растёт из центра, текст не сдвигается
const FooterLink = ({ to, children, className = "" }) => (
  <Link to={to} className={`footer-link ${className}`.trim()}>
    {children}
  </Link>
);

// Колонка навигации: <nav> + доступная метка, чтобы читатель экрана
// различал колонки
const NavColumn = ({ title, links }) => (
  <nav className="footer-col" aria-label={title}>
    <h3 className="footer-col-title">{title}</h3>
    <ul className="footer-col-list">
      {links.map((link) => (
        <li key={link.to}>
          <FooterLink to={link.to}>{link.label}</FooterLink>
        </li>
      ))}
    </ul>
  </nav>
);

// Пункт списка мероприятий: название, затем дата; у прошедших после даты —
// текстовый статус «Завершено» (без рамки-пилюли: она читалась кнопкой
// и на узкой колонке переносилась над датой, ломая порядок «дата → статус»)
const EventItem = ({ event }) => {
  const isFinished = event.status === "finished";
  return (
    <li className={`footer-event${isFinished ? " footer-event--past" : ""}`}>
      <Link
        to={`/event/${event.id}`}
        className={`footer-link footer-event-link${isFinished ? " footer-event-link--past" : ""}`}
        // Для прошедших — честная метка прямо в имени ссылки
        aria-label={
          isFinished
            ? `${event.title}, ${formatEventDate(event.startDate)}, завершено`
            : `${event.title}, ${formatEventDate(event.startDate)}`
        }
      >
        <span className="footer-event-title">{event.title}</span>
        <span className="footer-event-date" aria-hidden="true">
          {formatEventDate(event.startDate)}
          {isFinished && (
            <>
              <span className="footer-event-sep" aria-hidden="true">
                ·
              </span>
              <span className="footer-event-status">Завершено</span>
            </>
          )}
        </span>
      </Link>
    </li>
  );
};

/* ---------- Footer ---------- */

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Тот же источник авторизации, что и в Header: колонка «Личный
  // кабинет» показывает контент по состоянию сессии
  const { isAuthenticated, login } = useAuth();

  // Локальное состояние ближайших мероприятий (не зависит от store)
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Флаг отмены: запрос может завершиться после размонтирования
    // (например, при быстром переходе) — тогда состояние не трогаем
    let cancelled = false;

    const run = async () => {
      try {
        const selected = await loadFooterEvents(() =>
          apiRequest("/events", { method: "GET" }),
        );
        if (!cancelled) {
          setEvents(selected);
          setLoading(false);
        }
      } catch (error) {
        // Не пишем состояние в размонтированный компонент
        if (cancelled) return;
        console.error("Footer: не удалось загрузить мероприятия:", error);
        // Колонка показывает нейтральную заглушку (см. разметку ниже)
        setEvents([]);
        setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Вход из подвала — тем же сценарием, что и из хедера: запоминаем
  // текущую страницу, чтобы вернуться на неё после авторизации
  const handleLogin = () => {
    sessionStorage.setItem(
      "returnUrl",
      window.location.pathname + window.location.search,
    );
    login();
  };

  return (
    <footer className="footer">
      {/* Логотип — ссылка на главную; целиком внутри подвала,
          контент страниц больше не перекрывается */}
      <div className="footer-logo-row">
        <Link
          to="/"
          className="footer-logo-link"
          aria-label="Сибирские львы — на главную"
        >
          {/* Декоративная картинка: смысловая метка живёт на ссылке */}
          <img src={logo} alt="" className="footer-logo" />
        </Link>
      </div>

      <div className="footer-container">
        {/* Идентификация и слоган — строка бренда под логотипом */}
        <p className="footer-identity">{IDENTITY_LINE}</p>
        <p className="footer-slogan">«{SLOGAN}»</p>

        {/* Пять колонок. Центр — «Контакты» (универсально полезный блок),
            «Личный кабинет» — на периферии. На планшете Контакты становятся
            последним рядом во всю ширину (см. Footer.css) */}
        <div className="footer-grid">
          {/* 1. Мероприятия — единственная колонка с данными из API */}
          <nav
            className="footer-col footer-col--events"
            aria-label="Мероприятия"
          >
            <h3 className="footer-col-title">Мероприятия</h3>
            <ul className="footer-col-list">
              {loading ? (
                // Скелетон той же высоты, что и будущие пункты:
                // строка «Загрузка...» дёргала высоту и была неинформативной
                <>
                  <li className="footer-skeleton-item" aria-hidden="true" />
                  <li className="footer-skeleton-item" aria-hidden="true" />
                  <li className="footer-skeleton-item" aria-hidden="true" />
                  <li className="footer-skeleton-note" aria-hidden="true" />
                </>
              ) : events.length > 0 ? (
                <>
                  {events.map((event) => (
                    <EventItem key={event.id} event={event} />
                  ))}
                  <li>
                    <FooterLink to="/events" className="footer-more">
                      Все мероприятия →
                    </FooterLink>
                  </li>
                </>
              ) : (
                // Ни предстоящих, ни прошедших (или запрос упал):
                // нейтральная заглушка вместо устаревших записей
                <>
                  <li className="footer-empty-note">
                    Расписание обновляется — загляните позже
                  </li>
                  <li>
                    <FooterLink to="/events" className="footer-more">
                      Календарь событий →
                    </FooterLink>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {/* 2. Разделы — основная навигация */}
          <NavColumn title="Разделы" links={SECTION_LINKS} />

          {/* 3. Контакты — центр сетки; <address> сообщает читателям экрана
              назначение блока. Кликабельные значения отличаются от
              некликабельного адреса подчёркиванием в покое */}
          <address className="footer-col footer-contacts" aria-label="Контакты">
            <h3 className="footer-col-title">Контакты</h3>

            <div className="footer-contact">
              <span className="footer-contact-label">Адрес</span>
              {/* Адрес — НЕ ссылка: без подчёркивания, в отличие от
                  кликабельных значений ниже */}
              <span className="footer-contact-value">{CONTACTS.address}</span>
            </div>

            {CONTACTS.phones.map((phone) => (
              <div className="footer-contact" key={phone.label}>
                <span className="footer-contact-label">{phone.label}</span>
                {/* Номер — телефонная ссылка, а не простой текст */}
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
              <span className="footer-contact-label">Университет</span>
              <a
                href="https://tpu.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link footer-contact-value"
              >
                tpu.ru
              </a>
            </div>

            {/* Сообщество: ВК переехал сюда из «одинокой» строки —
                рядом с остальными способами связи */}
            <div className="footer-contact">
              <span className="footer-contact-label">Сообщество</span>
              <a
                href={VK_COMMUNITY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link footer-contact-value footer-vk-link"
                title="Мы ВКонтакте"
              >
                <img src={VK} alt="" className="footer-vk-icon" />
                vk.com/sib_lions
              </a>
              {/* Хештег-мост: прямой канал в комьюнити по тегу бренда;
                  постоянное подчёркивание выдаёт ссылку */}
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
          </address>

          {/* 4. Программа — правила и уровни */}
          <NavColumn title="Программа" links={PROGRAM_LINKS} />

          {/* 5. Личный кабинет — периферия сетки; контент по авторизации:
              гость видит один рабочий пункт «Войти», авторизованный —
              вкладки профиля */}
          <nav className="footer-col" aria-label="Личный кабинет">
            <h3 className="footer-col-title">Личный кабинет</h3>
            <ul className="footer-col-list">
              {isAuthenticated ? (
                PROFILE_TAB_LINKS.map((link) => (
                  <li key={link.to}>
                    <FooterLink to={link.to}>{link.label}</FooterLink>
                  </li>
                ))
              ) : (
                <li>
                  {/* Кнопка в облике ссылки: не ведёт в ProtectedRoute,
                      а выполняет вход с возвратом на текущую страницу */}
                  <button
                    type="button"
                    className="footer-link footer-login"
                    onClick={handleLogin}
                  >
                    Войти
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>

        {/* Нижняя панель: копирайт слева, правовые ссылки справа,
            на мобильных строки переносятся */}
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
            {/* 152-ФЗ: страницы существуют — см. LegalPages.jsx и
                подключение маршрутов в App.jsx */}
            <Link to="/privacy" className="footer-link footer-legal-link">
              Политика конфиденциальности
            </Link>
            <Link to="/consent" className="footer-link footer-legal-link">
              Согласие на обработку персональных данных
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
