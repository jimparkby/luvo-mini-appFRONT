// Таблица обратной совместимости: старые текстовые статусы → emoji
const LEGACY_STATUS_MAP = {
  walking: '🚶',
  evening: '🌙',
  fashion: '👗',
  sport: '⚽',
  chill: '😎',
  party: '🎉',
};

// Если статус — старое текстовое значение, вернуть emoji; иначе вернуть как есть
export const getStatusLabel = (statusValue) => {
  if (!statusValue) return '';
  return LEGACY_STATUS_MAP[statusValue] ?? statusValue;
};
