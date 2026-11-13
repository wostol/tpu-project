import { useState, useEffect, useCallback } from "react";

/** Кэш проверенных URL: картинка запрашивается один раз за сессию. */
const resolvedCache = new Set();

/**
 * Отслеживает загрузку изображений БЕЗ блокирующих побочных эффектов:
 * - deps — строка-key, а не новый массив каждый рендер (фикс request-storm);
 * - 404/ошибка сети считаются завершением, а не вечным ожиданием;
 * - повторный вызов с теми же URL возвращается мгновенно из кэша.
 * ВАЖНО: не используй `loaded` для_gate_ирования скелетона страницы —
 * скелетон зависит только от состояния запроса данных.
 */
export const useImageLoading = (imageSources = []) => {
  const key = Array.isArray(imageSources)
    ? imageSources.filter((s) => s && typeof s === "string").join("|")
    : "";

  const [state, setState] = useState(() => {
    const urls = key ? key.split("|") : [];
    return {
      total: urls.length,
      loaded: urls.filter((u) => resolvedCache.has(u)).length,
    };
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const urls = key ? key.split("|") : [];
    const total = urls.length;
    const pending = urls.filter((u) => !resolvedCache.has(u));

    if (pending.length === 0) {
      setState({ loaded: total, total });
      return;
    }

    let cancelled = false;
    let done = total - pending.length;
    let failed = 0;
    setState({ loaded: done, total });

    const finish = (url, ok) => {
      resolvedCache.add(url);
      if (cancelled) return;
      done += 1;
      if (!ok) failed += 1;
      setState({ loaded: done, total });
      if (done === total && failed === total) {
        setError("Не удалось загрузить изображения");
      }
    };

    pending.forEach((url) => {
      const img = new Image();
      img.onload = () => finish(url, true);
      img.onerror = () => finish(url, false); // 404 тоже завершает загрузку
      img.src = url;
    });

    return () => {
      cancelled = true;
    };
  }, [key]); // ← строка, стабильна между рендерами

  const { loaded, total } = state;
  return {
    loaded: loaded === total,
    total,
    loadedCount: loaded,
    progress: total > 0 ? (loaded / total) * 100 : 100,
    error,
  };
};

/** Загрузка данных: pending → success/error, без картинок. */
export const useDataLoading = (fetchData, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchData();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || "Ошибка загрузки данных");
      throw err;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...dependencies]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
};

/**
 * Комбинированная загрузка. Оставлен для совместимости,
 * но `loading` здесь больше НЕ ждёт картинки: ready по данным,
 * imagesLoaded — справочно (для прогресс-бара, если захочешь).
 */
export const useCombinedLoading = ({ fetchData, imageSources = [] }) => {
  const {
    data,
    loading: dataLoading,
    error: dataError,
    refetch,
  } = useDataLoading(fetchData);
  const imageLoading = useImageLoading(imageSources);

  return {
    ready: !dataLoading,
    loading: dataLoading,
    progress: dataLoading ? 0 : 100,
    data,
    dataError,
    imagesLoaded: imageLoading.loaded,
    imageProgress: imageLoading.progress,
    refetchData: refetch,
  };
};

export default { useImageLoading, useDataLoading, useCombinedLoading };
