import { USER_STORAGE_KEY } from "../constants";

export const buildAuthorizationHeader = (token) => `Bearer ${token}`;

export const getAccessToken = () => {
  const user = JSON.parse(localStorage.getItem(USER_STORAGE_KEY));
  return user?.user?.accessToken
    ? buildAuthorizationHeader(user.user.accessToken)
    : null;
};

export const isTokenExpired = (user) => {
  if (!user?.accessToken || !user?.exp) {
    return true; // Токен отсутствует - считаем истекшим
  }

  // JWT exp обычно в секундах, Date.now() в миллисекундах
  // Приводим exp к миллисекундам для сравнения
  // Если exp уже в миллисекундах (больше 10^10), используем как есть
  const expInMs = user.exp > 10000000000 ? user.exp : user.exp * 1000;

  // Проверяем, не истек ли токен
  return Date.now() >= expInMs;
};

export const isTokenValid = (user) => {
  return !isTokenExpired(user);
};
