export const STATUS_OPTIONS = [
  { value: '', label: 'Без статуса', emoji: '' },
  { value: 'walking', label: 'Гуляю', emoji: '🚶' },
  { value: 'evening', label: 'На вечер', emoji: '🌙' },
  { value: 'fashion', label: 'Fashion', emoji: '👗' },
  { value: 'sport', label: 'Спорт', emoji: '⚽' },
  { value: 'chill', label: 'Отдыхаю', emoji: '😎' },
  { value: 'party', label: 'Тусовка', emoji: '🎉' },
];

export const getStatusLabel = (statusValue) => {
  const status = STATUS_OPTIONS.find(opt => opt.value === statusValue);
  return status ? `${status.emoji} ${status.label}` : '';
};
