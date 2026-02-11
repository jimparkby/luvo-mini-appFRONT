/**
 * Возвращает относительное время на русском языке.
 * Например: "только что", "5 мин назад", "2 ч назад", "вчера", "3 дн назад"
 */
export function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "только что";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин назад`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн назад`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} нед назад`;

  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
