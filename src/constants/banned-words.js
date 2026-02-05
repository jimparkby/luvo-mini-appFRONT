// Список запрещённых слов для username (Instagram/Telegram)
export const BANNED_WORDS = [
  "sex",
  "porn",
  "sels",
  "gay",
  "gaysex",
  "penis",
  "xyi",
  "pizda",
  "blyat",
  "suka",
  "mudak",
];

// Проверяет, содержит ли строка запрещённые слова
export const containsBannedWord = (value) => {
  if (!value) return false;
  const lowerValue = value.toLowerCase();
  return BANNED_WORDS.some((word) => lowerValue.includes(word));
};

// Regex для валидации формата Instagram username
// Только латиница, цифры, точки и подчёркивания
export const USERNAME_REGEX = /^[a-zA-Z0-9._]+$/;

// Проверяет валидность формата username
export const isValidUsernameFormat = (value) => {
  if (!value) return false;
  return USERNAME_REGEX.test(value);
};
