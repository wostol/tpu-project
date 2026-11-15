import { createContext, useContext } from "react";

/*
 * Единый источник данных профиля для ВСЕХ вкладок личного кабинета.
 *
 * Раньше ProfilePage собирал данные (useProfile + auth + уровни + заказы),
 * а потом раскладывал их по вкладкам разными наборами пропсов: Обзор — 7,
 * Достижения — 4, Баллы — 3, Заказы — 1, Настройки — 5. Отсюда путаница:
 * в одной вкладке появлялся bonus_percent, в другой minPoints, где-то id
 * вместо названия уровня. Теперь ProfilePage один раз собирает объект и
 * кладёт его в этот контекст, а каждая вкладка берёт данные хуком
 * useProfileData() — пропсы для данных больше не нужны, и при добавлении
 * нового поля достаточно дописать его в значение контекста в ProfilePage.
 *
 * Состав объекта:
 *   user          — объединённый пользователь (auth + свежие поля /profile/me);
 *   userFullName  — ФИО одной строкой;
 *   userGroup     — учебная группа («8К32»);
 *   userInstitute — институт («ИШИТР»);
 *   totalPoints   — баланс (User.totalPoints; поля user.points в БД нет);
 *   currentLevel  — текущий уровень (camelCase: minPoints / bonusPercent);
 *   nextLevel     — следующий уровень или null, если достигнут максимум;
 *   allLevels     — все уровни по возрастанию minPoints;
 *   orders        — заказы пользователя;
 *   achievements  — личные достижения;
 *   logout        — выход из аккаунта;
 *   refreshProfile — перезагрузка GET /profile/me (после покупок/начислений).
 */
export const ProfileDataContext = createContext(null);

export function ProfileDataProvider({ value, children }) {
  return (
    <ProfileDataContext.Provider value={value}>
      {children}
    </ProfileDataContext.Provider>
  );
}

export function useProfileData() {
  const ctx = useContext(ProfileDataContext);
  if (!ctx) {
    throw new Error(
      "useProfileData должен вызываться внутри <ProfileDataProvider> " +
        "(провайдер подключён в ProfilePage.jsx). Скорее всего, вкладка " +
        "рендерится вне личного кабинета.",
    );
  }
  return ctx;
}
