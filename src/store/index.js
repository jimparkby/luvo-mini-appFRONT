import { create } from "zustand";
import { THEME, USER_STORAGE_KEY } from "../constants";

const isMockMode = () => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("mock") === "1";
};

export const useWebAppStore = create((set, get) => {
  const storedUser = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
  const {
    user = null,
    theme = THEME.LIGHT,
    error = null,
    webApp = null,
    loading = false,
    initData = null,
    isInitialized = false,
  } = storedUser;

  const updateStorage = (updates) => {
    const current = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
    const updated = { ...current, ...updates };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  };

  return {
    user,
    theme,
    error,
    webApp,
    loading,
    initData,
    isInitialized,

    setUser: (userData) =>
      set((state) => {
        // Объединяем существующие данные пользователя с новыми
        const mergedUser = state.user
          ? { ...state.user, ...userData }
          : userData;
        const updated = updateStorage({ user: mergedUser });
        return { user: updated.user };
      }),
    setTheme: (theme) =>
      set(() => {
        const updated = updateStorage({ theme });
        return { theme: updated.theme };
      }),
    setWebApp: (webApp) =>
      set(() => {
        const updated = updateStorage({ webApp });
        return { webApp: updated.webApp };
      }),
    setInitData: (initData) =>
      set(() => {
        const updated = updateStorage({ initData });
        return { initData: updated.initData };
      }),
    setInitialized: (isInitialized) => set(() => ({ isInitialized })),
    init: async () => {
      set({ loading: true, error: null });

      try {
        const tg = window.Telegram?.WebApp;
        const isTelegram = tg && tg.initData;
        const isDev = import.meta.env.DEV;
        const mockEnabled = isMockMode();

        if (isTelegram && !mockEnabled) {
          tg.ready();

          const theme =
            tg.colorScheme === THEME.DARK ? THEME.DARK : THEME.LIGHT;
          set({ theme });

          tg.onEvent("themeChanged", () => {
            const newTheme =
              tg.colorScheme === THEME.DARK ? THEME.DARK : THEME.LIGHT;
            set({ theme: newTheme });
          });

          // Получаем текущего пользователя из state, чтобы сохранить accessToken и exp
          const currentUser = get().user;
          const telegramUser = tg.initDataUnsafe.user;

          // Объединяем данные: сначала Telegram user, затем существующие данные (accessToken, exp, isRegister)
          const mergedUser = currentUser
            ? { ...telegramUser, ...currentUser }
            : telegramUser;

          set({
            user: mergedUser,
            webApp: tg,
            initData: tg.initData,
          });

          return tg.initData;
        }

        if (isDev || mockEnabled) {
          const decoded = decodeURIComponent(
            import.meta.env.VITE_FAKE_INIT_DATA
          );
          const initData = import.meta.env.VITE_FAKE_INIT_DATA;
          const params = new URLSearchParams(decoded);
          const userJson = params.get("user");
          if (!userJson) throw new Error("Нет user в VITE_FAKE_INIT_DATA");
          const fakeUser = JSON.parse(userJson);

          // Получаем текущего пользователя из state, чтобы сохранить accessToken и exp
          const currentUser = get().user;

          // Объединяем данные: сначала fake user, затем существующие данные
          const mergedUser = currentUser
            ? { ...fakeUser, ...currentUser }
            : fakeUser;

          set({
            user: mergedUser,
            webApp: null,
            initData,
          });

          return initData;
        }

        throw new Error("Telegram WebApp не доступен");
      } catch (e) {
        set({ error: e.message || "Ошибка инициализации" });
        return null;
      } finally {
        set({ loading: false });
      }
    },

    logout: () => {
      localStorage.removeItem(USER_STORAGE_KEY);
      set({
        user: null,
        webApp: null,
        initData: null,
        isInitialized: false,
      });
    },
  };
});
