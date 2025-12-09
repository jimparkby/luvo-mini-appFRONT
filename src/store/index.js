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

    getPhoneNumber: async () => {
      const tg = get().webApp || window.Telegram?.WebApp;
      if (!tg) return null;

      // Сначала проверяем, есть ли номер в initDataUnsafe
      const existingPhone = tg.initDataUnsafe?.user?.phone_number;
      if (existingPhone) {
        return existingPhone;
      }

      // Если нет, запрашиваем у пользователя
      return new Promise((resolve) => {
        if (tg.requestContact) {
          tg.requestContact((contact) => {
            if (contact?.phone_number) {
              // Обновляем пользователя в store
              const currentUser = get().user;
              const updatedUser = {
                ...currentUser,
                phone_number: contact.phone_number,
              };
              get().setUser(updatedUser);
              resolve(contact.phone_number);
            } else {
              resolve(null);
            }
          });
        } else {
          resolve(null);
        }
      });
    },

    getShareUrl: () => {
      const tg = get().webApp || window.Telegram?.WebApp;
      const user = get().user;

      // Прямой способ - если доступен shareUrl из Telegram
      if (tg?.shareUrl) {
        return tg.shareUrl;
      }

      // Получаем username из разных источников
      const username = user?.username || tg?.initDataUnsafe?.user?.username;

      // Если есть username, создаем ссылку на профиль пользователя в Telegram
      if (username) {
        // Создаем прямую ссылку на профиль пользователя в Telegram
        return `https://t.me/${username}`;
      }

      // Fallback: если нет username, используем user_id для реферальной ссылки
      const userId = user?.id || user?.user_id || tg?.initDataUnsafe?.user?.id;
      if (userId) {
        const baseUrl = window.location.origin;
        const referralUrl = `${baseUrl}?ref=${userId}`;
        return `https://t.me/share/url?url=${encodeURIComponent(
          referralUrl
        )}&text=${encodeURIComponent("Присоединяйся!")}`;
      }

      return null;
    },

    getLocation: async () => {
      const tg = get().webApp || window.Telegram?.WebApp;
      if (!tg) {
        throw new Error("Telegram WebApp не доступен");
      }

      try {
        // Пробуем locationManager
        const locationManager = tg.locationManager || tg.LocationManager;

        if (locationManager) {
          // Проверяем структуру объекта для диагностики
          const locationManagerKeys = Object.keys(locationManager);

          // Пробуем разные варианты доступа к requestLocation
          let requestLocationMethod = null;

          // Вариант 1: locationManager.requestLocation как функция
          if (typeof locationManager.requestLocation === "function") {
            requestLocationMethod = locationManager.requestLocation;
          }
          // Вариант 2: locationManager.requestLocation как объект с методом
          else if (
            locationManager.requestLocation &&
            typeof locationManager.requestLocation.requestLocation ===
              "function"
          ) {
            requestLocationMethod =
              locationManager.requestLocation.requestLocation.bind(
                locationManager.requestLocation
              );
          }
          // Вариант 3: прямой метод locationManager
          else if (typeof locationManager.request === "function") {
            requestLocationMethod = locationManager.request;
          }

          if (requestLocationMethod) {
            // Проверяем доступность, если есть метод isAvailable
            const isAvailableCheck =
              locationManager.requestLocation?.isAvailable ||
              locationManager.isAvailable;

            if (isAvailableCheck && typeof isAvailableCheck === "function") {
              if (!isAvailableCheck()) {
                throw new Error("Геолокация недоступна на этом устройстве");
              }
            }

            // Запрашиваем локацию
            const location = await requestLocationMethod();

            if (location) {
              const locationData = {
                latitude: location.latitude,
                longitude: location.longitude,
              };

              // Обновляем пользователя в store
              const currentUser = get().user;
              const updatedUser = {
                ...currentUser,
                location: locationData,
              };
              get().setUser(updatedUser);
              return locationData;
            }
          } else {
            throw new Error(
              `Не удалось найти метод requestLocation. locationManager свойства: ${locationManagerKeys.join(
                ", "
              )}. Тип requestLocation: ${typeof locationManager.requestLocation}`
            );
          }
        }

        // Пробуем locationData
        const locationDataObj = tg.locationData;
        if (locationDataObj) {
          const locationDataKeys = Object.keys(locationDataObj);

          let requestLocationMethod = null;

          if (typeof locationDataObj.requestLocation === "function") {
            requestLocationMethod = locationDataObj.requestLocation;
          } else if (
            locationDataObj.request &&
            typeof locationDataObj.request === "function"
          ) {
            requestLocationMethod = locationDataObj.request;
          }

          if (requestLocationMethod) {
            const location = await requestLocationMethod();

            if (location) {
              const locationResult = {
                latitude: location.latitude,
                longitude: location.longitude,
              };

              // Обновляем пользователя в store
              const currentUser = get().user;
              const updatedUser = {
                ...currentUser,
                location: locationResult,
              };
              get().setUser(updatedUser);
              return locationResult;
            }
          } else {
            throw new Error(
              `Не удалось найти метод requestLocation в locationData. Свойства: ${locationDataKeys.join(
                ", "
              )}`
            );
          }
        }

        throw new Error(
          `Методы locationManager и locationData недоступны. tg свойства: ${Object.keys(
            tg
          ).join(", ")}`
        );
      } catch (error) {
        console.error("Ошибка при получении геолокации:", error);
        // Пробрасываем ошибку дальше для отображения в UI
        throw error;
      }
    },
  };
});
