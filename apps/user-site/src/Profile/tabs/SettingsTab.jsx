import React, { useEffect, useState } from "react";
import styles from "./ProfileTabs.module.css";
import ExitButton from "../../component/ExitButton";
import ConfirmDialog from "../../component/ConfirmDialog";

const STORAGE_KEY = "sportclub-notifications";

// Значения по умолчанию: email включён, push выключен
const DEFAULTS = { email: true, push: false };

const loadPrefs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
};

/*
 * Переключатель в стиле iOS: роль switch + aria-checked,
 * полностью управляется с клавиатуры (обычная <button>).
 */
const ToggleRow = ({
  id,
  title,
  description,
  checked,
  disabled,
  onChange,
}) => (
  <div className={styles.settingsToggleRow}>
    <div className={styles.settingsToggleInfo}>
      <h4 id={id}>{title}</h4>
      <p>{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={id}
      disabled={disabled}
      className={`${styles.settingsSwitch} ${checked ? styles.settingsSwitchOn : ""}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className={styles.settingsSwitchKnob} aria-hidden="true" />
      <span className={styles.settingsSwitchState} aria-hidden="true">
        {checked ? "Вкл" : "Выкл"}
      </span>
    </button>
  </div>
);

/*
 * Вкладка «Настройки»: каналы уведомлений, данные профиля из ТПУ
 * (только чтение) и выход из аккаунта.
 */
const SettingsTab = ({ user, userFullName, userGroup, userInstitute, onLogout }) => {
  const [prefs, setPrefs] = useState(loadPrefs);
  const [pushState, setPushState] = useState("default"); // default | granted | denied | unsupported
  const [logoutDialog, setLogoutDialog] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushState(Notification.permission);
    } else {
      setPushState("unsupported");
    }
  }, []);

  // Сохраняем выбор мгновенно — настройки не требуют «кнопки сохранить»
  const updatePrefs = (next) => {
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* приватный режим — просто не сохраняем */
    }
  };

  const handleEmail = (on) => updatePrefs({ ...prefs, email: on });

  const handlePush = (on) => {
    if (!on) {
      updatePrefs({ ...prefs, push: false });
      return;
    }
    // Разрешение на push запрашиваем в момент включения
    if (!("Notification" in window)) {
      setPushState("unsupported");
      updatePrefs({ ...prefs, push: false });
      return;
    }
    if (Notification.permission === "granted") {
      setPushState("granted");
      updatePrefs({ ...prefs, push: true });
      return;
    }
    Notification.requestPermission()
      .then((permission) => {
        setPushState(permission);
        updatePrefs({
          ...prefs,
          push: permission === "granted",
        });
      })
      .catch(() => {
        setPushState("denied");
        updatePrefs({ ...prefs, push: false });
      });
  };

  // Данные ТПУ — только чтение
  const profileRows = [
    { label: "ФИО", value: userFullName },
    { label: "Email", value: user?.email || "—" },
    { label: "Учебная группа", value: userGroup },
    { label: "Институт", value: userInstitute },
    { label: "Роль", value: "Учащийся" },
  ];

  return (
    <div className={styles.settingsTab}>
      {/* Уведомления */}
      <section
        className={styles.settingsSection}
        aria-label="Настройки уведомлений"
      >
        <h3 className={styles.settingsSectionTitle}>Уведомления</h3>
        <p className={styles.settingsSectionHint}>
          Выберите, как сообщать о начислении баллов, новых событиях и
          изменении статуса заказов.
        </p>

        <ToggleRow
          id="notif-email"
          title="Email-уведомления"
          description="Письма на адрес студенческой почты ТПУ: подтверждение записи, начисление баллов, статусы заказов"
          checked={prefs.email}
          onChange={handleEmail}
        />

        <ToggleRow
          id="notif-push"
          title="Push-уведомления"
          description={
            pushState === "denied"
              ? "Браузер запретил уведомления. Разрешите их в настройках сайта, чтобы включить push"
              : pushState === "unsupported"
                ? "Ваш браузер не поддерживает push-уведомления"
                : "Всплывающие напоминания о событии за день до начала"
          }
          checked={prefs.push}
          disabled={pushState === "denied" || pushState === "unsupported"}
          onChange={handlePush}
        />
      </section>

      {/* Данные профиля из ТПУ — только чтение */}
      <section
        className={styles.settingsSection}
        aria-label="Данные профиля"
      >
        <h3 className={styles.settingsSectionTitle}>Данные профиля</h3>
        <p className={styles.settingsSectionHint}>
          Данные синхронизированы с аккаунтом ТПУ и редактируются только в
          личном кабинете университета.
        </p>

        <dl className={styles.settingsProfileList}>
          {profileRows.map((row) => (
            <div key={row.label} className={styles.settingsProfileRow}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Выход */}
      <section className={styles.settingsSection} aria-label="Выход">
        <h3 className={styles.settingsSectionTitle}>Аккаунт</h3>
        <div className={styles.settingsLogoutRow}>
          <div className={styles.settingsToggleInfo}>
            <h4>Выйти из аккаунта</h4>
            <p>
              Сессия завершится на этом устройстве. Корзина и избранные
              события сохранятся.
            </p>
          </div>
          <ExitButton onLogout={() => setLogoutDialog(true)} />
        </div>
      </section>

      <ConfirmDialog
        isOpen={logoutDialog}
        title="Выход из аккаунта"
        message="Вы уверены, что хотите выйти? Начисленные баллы останутся на месте."
        onConfirm={() => {
          setLogoutDialog(false);
          onLogout?.();
        }}
        onCancel={() => setLogoutDialog(false)}
        confirmText="Выйти"
        cancelText="Отмена"
      />
    </div>
  );
};

export default SettingsTab;
