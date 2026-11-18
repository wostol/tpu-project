import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/*
 * Прокрутка при клиентской навигации: к якорю или наверх страницы.
 *
 * Проблемы (ревью):
 *   1. <Link to="/levels#reglament-title"> из подвала меняет маршрут,
 *      но браузер сам не прокручивает страницу к секции — хэш-фрагмент
 *      обрабатывается только при полной загрузке документа, а SPA-переходы
 *      остаются без него.
 *   2. Переходы между вкладками личного кабинета меняют ТОЛЬКО
 *      ?параметры (/profile?tab=overview → /profile?tab=orders):
 *      pathname и hash не меняются, эффект с зависимостями
 *      [pathname, hash] не перезапускался — и страница не
 *      прокручивалась наверх при смене вкладки. Теперь search входит
 *      в зависимости эффекта.
 *
 * Подключение в App.jsx (внутрь <Router>, рядом с <Routes>) — не менялось:
 *
 *   import ScrollToHash from "./component/ScrollToHash";
 *   ...
 *   <Router basename={BASE_URL}>
 *     <ScrollToHash offset={88} />   {/* высота фиксированного хедера *\/}
 *     <LoadingProvider>
 *       <AppContent />
 *     </LoadingProvider>
 *   </Router>
 *
 * Поведение:
 *   - есть хэш  → плавная прокрутка к элементу с учётом высоты хедера;
 *   - нет хэша  → переход (смена страницы ИЛИ смена ?параметров,
 *                 например вкладки профиля) начинается сверху страницы;
 *   - элемент может появиться позже (данные грузятся асинхронно) —
 *     попытки прокрутки повторяются несколько кадров;
 *   - prefers-reduced-motion прокрутка мгновенная, без анимации.
 */

const ScrollToHash = ({ offset = 88 }) => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      // Обычный переход без якоря — начинаем сверху страницы.
      // search в зависимостях: покрывает смену вкладок /profile?tab=...
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const targetId = decodeURIComponent(hash.slice(1));
    if (!targetId) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Секция могла ещё не отрендериться (LevelsPage грузит данные) —
    // повторяем попытку в течение ~1 секунды кадровыми шагами
    let attempts = 0;
    let rafId = 0;

    const tryScroll = () => {
      const element = document.getElementById(targetId);
      if (element) {
        const top =
          element.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({
          top,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
        return;
      }
      if (attempts++ < 60) {
        rafId = requestAnimationFrame(tryScroll);
      }
    };

    tryScroll();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [pathname, search, hash, offset]);

  return null;
};

export default ScrollToHash;
