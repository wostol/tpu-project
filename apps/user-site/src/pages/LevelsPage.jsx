import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./LevelsPage.module.css";
import useAuth from "../auth/useAuth";
import { apiRequest } from "../auth/apiClient";
import {
  LEVELS_FALLBACK,
  normalizeLevels,
  POINTS_MATRIX,
  EXTRA_BONUSES,
  PE_RULES,
} from "./levelsData";
import {
  pointsToLevelText,
  pluralizePoints,
} from "../Profile/tabs/pointsUtils.js";

/*
 * Публичная страница «Правила и уровни» (/levels).
 * Не требует авторизации: правила должны быть видны и гостю.
 *
 * Содержание:
 *  1. Таблица уровней (порог, бонус к физ-ре, приз);
 *  2. Матрица начислений: тип события × результат (20/30/40 → 45/65/90 → 90/130/170);
 *  3. Дополнительные бонусы (капитан +30, номинация +70, сборная +100);
 *  4. Правила зачёта по физическому воспитанию (типы событий, проценты,
 *     округление до 0,5);
 *  5. Регламент — обычным текстом на странице (доступно скринридерам),
 *     не картинкой и не только PDF.
 *
 * Для авторизованных студентов сверху показывается личный прогресс
 * («мост» между публичными правилами и вкладкой «Достижения» в профиле).
 *
 * Поля уровней — camelCase (minPoints / bonusPercent), как в модели
 * Prisma; баланс — только user.totalPoints (поля user.points в БД нет).
 */
const LevelsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [levels, setLevels] = useState(LEVELS_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiRequest("/levels")
      .then((data) => {
        if (!alive) return;
        const normalized = normalizeLevels(data);
        if (normalized.length > 0) setLevels(normalized);
      })
      .catch(() => {
        /* остаёмся на фолбэке — публичные правила всегда заполнены */
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const totalPoints = user?.totalPoints || 0;
  const currentLevel =
    [...levels]
      .sort((a, b) => b.minPoints - a.minPoints)
      .find((l) => totalPoints >= l.minPoints) || levels[0];
  const nextLevel = levels.find((l) => l.minPoints > totalPoints);
  const isMaxLevel = !nextLevel;
  const pointsNeeded = isMaxLevel ? 0 : nextLevel.minPoints - totalPoints;

  return (
    <div className={styles.page}>
      {/* ---------- ШАПКА СТРАНИЦЫ ---------- */}
      <header className={styles.hero}>
        <p className={styles.heroKicker}>
          Спортклуб ТПУ · Программа лояльности
        </p>
        <h1 className={styles.heroTitle}>Правила и уровни</h1>
        <p className={styles.heroText}>
          Как начисляются баллы за мероприятия, как растут уровни «Сибирских
          Львов» и что даёт бонус по физическому воспитанию. Страница открыта
          для всех — делиться ссылками можно без авторизации.
        </p>
      </header>

      {/* ---------- ЛИЧНЫЙ ПРОГРЕСС (только для авторизованных) ---------- */}
      {isAuthenticated && !loading && (
        <section className={styles.personalStrip} aria-label="Ваш прогресс">
          <div
            className={styles.personalLevel}
            style={{ background: currentLevel?.color }}
          >
            {currentLevel?.name}
          </div>
          <div className={styles.personalInfo}>
            <strong>
              У вас {totalPoints.toLocaleString("ru-RU")}{" "}
              {pluralizePoints(totalPoints)}
            </strong>
            <span>
              {isMaxLevel
                ? "Максимальный уровень достигнут!"
                : pointsToLevelText(pointsNeeded, nextLevel?.name)}
            </span>
          </div>
          <Link to="/profile?tab=achievements" className={styles.personalLink}>
            Мой прогресс в профиле →
          </Link>
        </section>
      )}

      {/* ---------- 1. ТАБЛИЦА УРОВНЕЙ ---------- */}
      <section className={styles.section} aria-labelledby="levels-table-title">
        <h2 id="levels-table-title" className={styles.sectionTitle}>
          1. Уровни программы
        </h2>
        <p className={styles.sectionText}>
          Уровень присваивается автоматически, как только сумма баллов достигает
          порога. Уровень сохраняется до конца обучения и не понижается при
          обмене баллов на товары.
        </p>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.tableCaption}>
              Шесть уровней программы «Сибирские Львы»: порог в баллах, бонус к
              физическому воспитанию и приз уровня
            </caption>
            <thead>
              <tr>
                <th scope="col">Уровень</th>
                <th scope="col">Порог</th>
                <th scope="col">Бонус к физ-ре</th>
                <th scope="col">Приз</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((level, i) => {
                const isCurrent =
                  isAuthenticated && currentLevel?.id === level.id;
                const isDone =
                  isAuthenticated && totalPoints >= level.minPoints;
                return (
                  <tr
                    key={level.id}
                    className={`${isDone ? styles.rowDone : ""} ${isCurrent ? styles.rowCurrent : ""}`}
                  >
                    <th scope="row" className={styles.levelCell}>
                      <span
                        className={styles.levelDot}
                        style={{ background: level.color }}
                        aria-hidden="true"
                      />
                      {i + 1}. {level.name}
                      {isCurrent && (
                        <span className={styles.youTag}>ваш уровень</span>
                      )}
                    </th>
                    <td className={styles.numCell}>
                      {level.minPoints.toLocaleString("ru-RU")}
                    </td>
                    <td className={styles.numCell}>+{level.bonusPercent}%</td>
                    <td>{level.prize || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- 2. МАТРИЦА НАЧИСЛЕНИЙ ---------- */}
      <section className={styles.section} aria-labelledby="matrix-title">
        <h2 id="matrix-title" className={styles.sectionTitle}>
          2. Начисление баллов за события
        </h2>
        <p className={styles.sectionText}>
          Сумма зависит от масштаба события и вашего результата. Роль
          «болельщик» и волонтёрство оцениваются по карточке каждого события
          (поля «баллы болельщика»).
        </p>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.tableCaption}>
              Матрица начислений: тип события × результат
            </caption>
            <thead>
              <tr>
                <th scope="col">Тип события</th>
                {POINTS_MATRIX.columns.map((col) => (
                  <th scope="col" key={col.key}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {POINTS_MATRIX.rows.map((row) => (
                <tr key={row.key}>
                  <th scope="row" className={styles.rowHeadCell}>
                    {row.label}
                    <small className={styles.rowHeadHint}>{row.hint}</small>
                  </th>
                  {row.values.map((v, i) => (
                    <td className={styles.matrixCell} key={i}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.sectionNote}>
          Пример: победа в университетском турнире — 90 баллов, призовое место
          на городском старте — 130 баллов.
        </p>
      </section>

      {/* ---------- 3. ДОПОЛНИТЕЛЬНЫЕ БОНУСЫ ---------- */}
      <section className={styles.section} aria-labelledby="bonus-title">
        <h2 id="bonus-title" className={styles.sectionTitle}>
          3. Дополнительные бонусы
        </h2>
        <p className={styles.sectionText}>
          Прибавляются к базовым баллам события и суммируются между собой.
        </p>

        <div className={styles.bonusGrid}>
          {EXTRA_BONUSES.map((b) => (
            <article key={b.key} className={styles.bonusCard}>
              <span className={styles.bonusValue}>+{b.points}</span>
              <h3 className={styles.bonusTitle}>{b.title}</h3>
              <p className={styles.bonusHint}>{b.hint}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- 4. ПРАВИЛА ФИЗ-РЫ ---------- */}
      <section className={styles.section} aria-labelledby="pe-title">
        <h2 id="pe-title" className={styles.sectionTitle}>
          4. Зачёт по физическому воспитанию
        </h2>
        <p className={styles.sectionText}>
          Баллы за отдельные типы событий также засчитываются в дисциплину
          «Физическая культура и спорт». Какие события идут в зачёт:
        </p>

        <ul className={styles.peList}>
          {PE_RULES.countable.map((item) => (
            <li key={item.point} className={styles.peItem}>
              <span className={styles.pePoint}>{item.point}</span>
              {item.text}
            </li>
          ))}
        </ul>

        <div className={styles.peFacts}>
          <div className={styles.peFact}>
            <strong>Проценты по уровням</strong>
            <span>
              Бонус к регламентным баллам физ-ры растёт с уровнем: от +2% на
              уровне «Регистрация в клубе» до +20% у «Сибирского льва» (см.
              таблицу уровней).
            </span>
          </div>
          <div className={styles.peFact}>
            <strong>Округление до 0,5</strong>
            <span>{PE_RULES.rounding}.</span>
          </div>
          <div className={styles.peFact}>
            <strong>Фиксация при начислении</strong>
            <span>{PE_RULES.fixation}.</span>
          </div>
        </div>
      </section>

      {/* ---------- 5. РЕГЛАМЕНТ ТЕКСТОМ ---------- */}
      <section className={styles.section} aria-labelledby="reglament-title">
        <h2 id="reglament-title" className={styles.sectionTitle}>
          5. Регламент (краткая версия)
        </h2>
        <p className={styles.sectionText}>
          Регламент опубликован обычным текстом, чтобы он был доступен
          скринридерам и не требовал скачивания PDF.
        </p>

        <div className={styles.reglament}>
          <h3>Начисление баллов</h3>
          <p>
            1.1. Баллы начисляются организатором события после подтверждения
            участия: для участников — по матрице из раздела 2, для болельщиков и
            волонтёров — по значению, указанному в карточке события.
          </p>
          <p>
            1.2. Дополнительные бонусы (раздел 3) начисляются при наличии
            подтверждающей роли: «капитан» в заявке, решение жюри о номинации,
            приказ о зачислении в сборную ТПУ.
          </p>
          <p>
            1.3. Начисления отображаются во вкладке «Баллы» личного кабинета в
            течение суток после события.
          </p>

          <h3>Уровни и награды</h3>
          <p>
            2.1. Уровень пересчитывается автоматически при каждом изменении
            суммы баллов; новый уровень открывает приз и повышенный бонус к
            физ-ре (раздел 1).
          </p>
          <p>
            2.2. Приз уровня выдаётся спортклубом ТПУ; порядок получения
            указывается в уведомлении о достижении уровня.
          </p>

          <h3>Списание баллов</h3>
          <p>
            3.1. Баллы обмениваются на товары магазина спортклуба во вкладке
            «Заказы». Обмен на деньги и перевод между аккаунтами не допускается.
          </p>
          <p>
            3.2. При отмене заказа баллы возвращаются на баланс в полном объёме.
          </p>

          <h3>Спорные ситуации</h3>
          <p>
            4.1. Вопросы по начислениям принимаются через администрацию
            спортклуба ТПУ; решение о начислении принимает спортклуб на
            основании протоколов событий.
          </p>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className={styles.ctaSection}>
        <h2>Готовы набрать первые баллы?</h2>
        <p>
          Выберите событие в календаре спортклуба — участие уже даёт баллы, а
          победа умножает их.
        </p>
        <Link to="/events" className={styles.ctaBtn}>
          Перейти к мероприятиям
        </Link>
      </section>
    </div>
  );
};

export default LevelsPage;
