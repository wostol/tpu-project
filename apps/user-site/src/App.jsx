import "./App.css";
import Header from "./component/Header";
import Footer from "./component/Footer";
import Layout from "./component/Layout";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EventsPage from "./Events/EventsPage";
import EventDetail from "./Events/EventDetail";
import ProfilePage from "./Profile/ProfilePage";
import FavoritesPage from "./Favorite/MyEvents";
import CartPage from "./Bag/CartPage";
import ShopPage from "./Shop/ShopPage";
import DevLoginPage from "./pages/DevLoginPage";
import React from "react";
import AuthInitializer from "./AuthInitializer";
import ProtectedRoute from "./ProtectedRoute";
import { LoadingProvider } from "./context/PageLoadingContext";
import { BASE_URL } from "./config";
import HomePage from "./pages/HomePage";
import LevelsPage from "./pages/LevelsPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ScrollToTop from "./component/ScrollToTop";

function AppContent() {
  return (
    <Layout>
      <AuthInitializer>
        <Header />

        <main className="main-content">
          <div className="container-page">
            <Routes>
              <Route path="/" element={<HomePage />} />

              {/* Мероприятия — переехали с / на /events */}
              <Route path="/events" element={<EventsPage />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/dev-login" element={<DevLoginPage />} />
              {/* Правила и уровни — публичная страница (без авторизации) */}
              <Route path="/levels" element={<LevelsPage />} />
              {/* Защищенные маршруты - только для авторизованных */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute message="Для просмотра избранных мероприятий необходимо авторизоваться">
                    <FavoritesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cart"
                element={
                  <ProtectedRoute message="Для доступа к корзине необходимо авторизоваться">
                    <CartPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetailPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </main>

        <Footer />
      </AuthInitializer>
    </Layout>
  );
}

function App() {
  return (
    <Router basename={BASE_URL}>
      <ScrollToTop />
      <LoadingProvider>
        <AppContent />
      </LoadingProvider>
    </Router>
  );
}

export default App;
