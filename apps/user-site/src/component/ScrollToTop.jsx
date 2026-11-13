// src/component/ScrollToTop.jsx
//
// Глобальный скролл наверх при смене pathname.
// Без этого при переходе между маршрутами пользователь остаётся на той же
// scroll-позиции — например, после клика на карточку события в /events
// (там он проскроллил вниз) детальная страница /event/:id открывается
// «внизу» и виден footer.
//
// Применение: вставь <ScrollToTop /> внутри <Router> в App.jsx:
//
//   <Router>
//     <ScrollToTop />
//     <Routes>...</Routes>
//   </Router>
//
// Не рендерит ничего в DOM — только副作用 на window.scrollTo при смене пути.
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // behavior: "auto" — мгновенный скролл, без анимации.
    // Если хочешь плавный — поменяй на "smooth", но это может ощущаться
    // медленным при быстрой навигации.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
