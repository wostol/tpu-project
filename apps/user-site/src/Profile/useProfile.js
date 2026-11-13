import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../auth/apiClient";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await apiRequest("/profile/me");
      setProfile(data);
      return data;
    } catch (err) {
      setError(err.message || "Не удалось загрузить профиль");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, loading, error, refresh };
}
