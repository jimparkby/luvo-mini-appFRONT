// Определяет является ли строка ID кастомного tg-эмодзи (числовая строка ~19 цифр)
export const isTgEmojiId = (s) => s && /^\d{15,}$/.test(s);

// Рендерит <tg-emoji> как реальный HTML через dangerouslySetInnerHTML
// (React экранирует кастомные теги как текст, поэтому нужен этот обходной путь)
export const TgEmoji = ({ id, size = "1em", fallback = "⭐" }) => (
  <span
    style={{ fontSize: size, lineHeight: 1, display: "inline-flex", alignItems: "center" }}
    dangerouslySetInnerHTML={{
      __html: `<tg-emoji emoji-id="${id}">${fallback}</tg-emoji>`,
    }}
  />
);

// Универсальный компонент для отображения статуса — обычный эмодзи или tg-emoji
export const StatusEmoji = ({ status, size = "1em" }) => {
  if (!status) return null;
  if (isTgEmojiId(status)) {
    return <TgEmoji id={status} size={size} />;
  }
  return <span style={{ fontSize: size }}>{status}</span>;
};
