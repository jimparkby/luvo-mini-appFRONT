import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { THEME } from "./constants";
import { Router } from "./router";
import { Layout } from "./components";
import { useLogin } from "./api/auth";
import { decodeJWT } from "./utils/decode-jwt.util";
import { isTokenExpired } from "./utils/get-auth-tokens.util";
import { useWebAppStore } from "./store";
import { useTelegramFullscreen } from "./hooks/useTelegramFullscreen";

const RETURN_PATH_KEY = "luvo_return_path";

export const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutateAsync } = useLogin();
  const {
    user,
    init,
    error,
    theme,
    loading,
    setUser,
    setTheme,
    isInitialized,
    setInitialized,
  } = useWebAppStore();

  useTelegramFullscreen();

  // Восстановление пути после возврата из внешнего приложения
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Проверяем, стало ли приложение видимым
      if (document.visibilityState === 'visible') {
        const returnPath = localStorage.getItem(RETURN_PATH_KEY);
        if (returnPath && location.pathname !== returnPath) {
          localStorage.removeItem(RETURN_PATH_KEY);
          navigate(returnPath, { replace: true });
        }
      }
    };

    // Проверяем при монтировании компонента
    const returnPath = localStorage.getItem(RETURN_PATH_KEY);
    if (returnPath && location.pathname !== returnPath) {
      localStorage.removeItem(RETURN_PATH_KEY);
      navigate(returnPath, { replace: true });
    }

    // Слушаем событие изменения видимости документа
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Также слушаем событие Telegram WebApp (если доступно)
    const tg = window.Telegram?.WebApp;
    if (tg?.onEvent) {
      tg.onEvent('viewportChanged', handleVisibilityChange);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (tg?.offEvent) {
        tg.offEvent('viewportChanged', handleVisibilityChange);
      }
    };
  }, [navigate, location.pathname]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle(THEME.DARK, theme === THEME.DARK);
  }, [theme]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.onEvent) {
      const handler = () => {
        const newTheme =
          tg.colorScheme === THEME.DARK ? THEME.DARK : THEME.LIGHT;
        setTheme(newTheme);
      };
      handler();
      tg.onEvent("themeChanged", handler);
      return () => tg.offEvent?.("themeChanged", handler);
    }
  }, [setTheme]);

  useEffect(() => {
    // Проверяем, нужно ли инициализировать приложение
    const needsInitialization = !isInitialized || !user?.accessToken;

    // Проверяем, истек ли токен (если он есть)
    const tokenExpired = isTokenExpired(user);

    if (needsInitialization || tokenExpired) {
      initializeApp();
    }
  }, []);

  const initializeApp = async () => {
    try {
      // Очищаем истекший токен, если он есть
      if (isTokenExpired(user)) {
        setUser(null);
        setInitialized(false);
      }

      const initData = await init();
      if (!initData) return;
      const { data } = await mutateAsync({ init_data: initData });
      const { access_token: token, has_profile: isRegister } = data || {};
      if (!token) {
        console.warn("Token not found in login response.");
        return;
      }
      loginSuccess(token, isRegister);
    } catch (e) {
      console.error("Ошибка инициализации:", e);
    }
  };

  const loginSuccess = (token, isRegister) => {
    try {
      const { user_id, exp } = decodeJWT(token);
      setUser({
        id: user_id,
        exp,
        isRegister,
        accessToken: token,
      });
      setInitialized(true);
    } catch (error) {
      console.error("Error during login process:", error);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-black text-center px-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 dark:border-white mb-4" />

        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
          Загружаем приложение...
        </h2>

        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
          Пожалуйста, подождите пару секунд — мы готовим данные и настраиваем
          интерфейс.
        </p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen text-light-red">
        <p>Ошибка: {error}</p>
      </div>
    );

  return (
    <Layout className="flex flex-col items-center justify-start bg-white text-black dark:bg-black dark:text-white scrollbar-hidden">
      <Router />
    </Layout>
  );
};
