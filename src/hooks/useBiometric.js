import { useEffect, useState, useCallback } from "react";

/**
 * Хук для работы с Telegram Biometric Manager (Face ID / Touch ID)
 * @returns {Object} Методы и состояние биометрии
 */
export const useBiometric = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [isAccessRequested, setIsAccessRequested] = useState(false);
  const [biometricType, setBiometricType] = useState("unknown"); // "face", "finger", "unknown"
  const [biometricToken, setBiometricToken] = useState(null);

  useEffect(() => {
    const biometric = window.Telegram?.WebApp?.BiometricManager;

    if (!biometric) {
      console.warn("Telegram BiometricManager не найден");
      return;
    }

    // Функция для обновления состояния
    const updateBiometricState = () => {
      const available = biometric.isInited && biometric.isBiometricAvailable;
      console.log("BiometricManager состояние:", {
        isInited: biometric.isInited,
        isBiometricAvailable: biometric.isBiometricAvailable,
        isAccessGranted: biometric.isAccessGranted,
        biometricType: biometric.biometricType,
      });

      setIsAvailable(available);
      setIsAccessGranted(biometric.isAccessGranted);
      setIsAccessRequested(biometric.isAccessRequested);
      setBiometricType(biometric.biometricType || "unknown");
    };

    // Если уже инициализирован, обновляем состояние
    if (biometric.isInited) {
      updateBiometricState();
    } else {
      // Инициализируем и ждем результата
      console.log("Инициализация BiometricManager...");
      biometric.init(() => {
        console.log("BiometricManager инициализирован");
        updateBiometricState();
      });
    }

    // Слушаем изменения состояния биометрии (если поддерживается)
    const tg = window.Telegram?.WebApp;
    if (tg?.onEvent) {
      const handler = () => {
        console.log("Событие biometricManagerUpdated");
        updateBiometricState();
      };
      tg.onEvent("biometricManagerUpdated", handler);

      return () => {
        tg.offEvent?.("biometricManagerUpdated", handler);
      };
    }
  }, []);

  /**
   * Запросить доступ к биометрии (Face ID / Touch ID)
   */
  const requestAccess = useCallback((reason = "Для быстрого входа") => {
    return new Promise((resolve, reject) => {
      const biometric = window.Telegram?.WebApp?.BiometricManager;

      if (!biometric || !biometric.isBiometricAvailable) {
        reject(new Error("Биометрия недоступна на этом устройстве"));
        return;
      }

      biometric.requestAccess(
        { reason },
        (isGranted) => {
          setIsAccessGranted(isGranted);
          setIsAccessRequested(true);
          if (isGranted) {
            resolve(true);
          } else {
            reject(new Error("Доступ к биометрии отклонен"));
          }
        }
      );
    });
  }, []);

  /**
   * Аутентифицировать пользователя через биометрию
   */
  const authenticate = useCallback((reason = "Подтвердите свою личность") => {
    return new Promise((resolve, reject) => {
      const biometric = window.Telegram?.WebApp?.BiometricManager;

      if (!biometric || !biometric.isAccessGranted) {
        reject(new Error("Доступ к биометрии не предоставлен"));
        return;
      }

      biometric.authenticate(
        { reason },
        (isAuthenticated, biometricToken) => {
          if (isAuthenticated) {
            setBiometricToken(biometricToken);
            resolve({ success: true, token: biometricToken });
          } else {
            reject(new Error("Аутентификация не удалась"));
          }
        }
      );
    });
  }, []);

  /**
   * Обновить биометрический токен (при регистрации)
   */
  const updateToken = useCallback((token, reason = "Сохранение данных для быстрого входа") => {
    return new Promise((resolve, reject) => {
      const biometric = window.Telegram?.WebApp?.BiometricManager;

      if (!biometric || !biometric.isAccessGranted) {
        reject(new Error("Доступ к биометрии не предоставлен"));
        return;
      }

      biometric.updateBiometricToken(token, (updated) => {
        if (updated) {
          setBiometricToken(token);
          resolve(true);
        } else {
          reject(new Error("Не удалось обновить токен"));
        }
      });
    });
  }, []);

  /**
   * Открыть настройки биометрии
   */
  const openSettings = useCallback(() => {
    const biometric = window.Telegram?.WebApp?.BiometricManager;
    if (biometric) {
      biometric.openSettings();
    }
  }, []);

  /**
   * Повторная инициализация биометрии
   */
  const reinitialize = useCallback(() => {
    return new Promise((resolve) => {
      const biometric = window.Telegram?.WebApp?.BiometricManager;
      if (!biometric) {
        console.warn("BiometricManager не найден");
        resolve(false);
        return;
      }

      console.log("Повторная инициализация BiometricManager...");
      biometric.init(() => {
        const available = biometric.isInited && biometric.isBiometricAvailable;
        console.log("BiometricManager реинициализирован:", {
          isInited: biometric.isInited,
          isBiometricAvailable: biometric.isBiometricAvailable,
        });

        setIsAvailable(available);
        setIsAccessGranted(biometric.isAccessGranted);
        setIsAccessRequested(biometric.isAccessRequested);
        setBiometricType(biometric.biometricType || "unknown");

        resolve(available);
      });
    });
  }, []);

  return {
    // Состояние
    isAvailable,
    isAccessGranted,
    isAccessRequested,
    biometricType,
    biometricToken,

    // Методы
    requestAccess,
    authenticate,
    updateToken,
    openSettings,
    reinitialize,
  };
};
