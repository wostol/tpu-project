// Экспорт всех компонентов вкладок профиля
// Вкладки: Обзор / Достижения / Баллы / Заказы / Настройки
export { default as OverviewTab } from "./OverviewTab";
export { default as AchievementsTab } from "./AchievementsTab";
export { default as PointsTab } from "./PointsTab";
export { default as OrdersTab } from "./OrdersTab";
export { default as SettingsTab } from "./SettingsTab";
// Фид уведомлений (используется шапкой/будущим колокольчиком)
export { default as NotificationsTab } from "./NotificationsTab";
// История операций отдельно — переиспользуется в других вкладках
export { default as PointsHistory } from "./PointsHistory";
