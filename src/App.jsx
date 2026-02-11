import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { THEME } from "./constants";
import { Router } from "./router";
import { Layout, Loader } from "./components";
import { useLogin } from "./api/auth";
import { decodeJWT } from "./utils/decode-jwt.util";
import { isTokenExpired } from "./utils/get-auth-tokens.util";
import { useWebAppStore } from "./store";
import { useTelegramFullscreen } from "./hooks/useTelegramFullscreen";

const RETURN_PATH_KEY = "luvo_return_path";
const EXTERNAL_FLAG_KEY = "luvo_went_external";

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
        const wentExternal = sessionStorage.getItem(EXTERNAL_FLAG_KEY);
        const returnPath = sessionStorage.getItem(RETURN_PATH_KEY);

        // Восстанавливаем путь только если пользователь действительно уходил во внешнее приложение
        if (wentExternal && returnPath && location.pathname !== returnPath) {
          sessionStorage.removeItem(RETURN_PATH_KEY);
          sessionStorage.removeItem(EXTERNAL_FLAG_KEY);
          navigate(returnPath, { replace: true });
        }
      }
    };

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

  if (loading) return <Loader />;

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
