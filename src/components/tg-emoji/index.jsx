import { getPremiumEmojiFallback } from "@/constants/premium-emojis";

// Определяет является ли строка ID кастомного tg-эмодзи (числовая строка ~15+ цифр)
export const isTgEmojiId = (s) => s && /^\d{15,}$/.test(s);

// Рендерит <tg-emoji> как реальный HTML через dangerouslySetInnerHTML
export const TgEmoji = ({ id, size = "1em", fallback }) => {
  const fb = fallback ?? getPremiumEmojiFallback(id);
  return (
    <span
      style={{ fontSize: size, lineHeight: 1, display: "inline-flex", alignItems: "center" }}
      dangerouslySetInnerHTML={{
        __html: `<tg-emoji emoji-id="${id}">${fb}</tg-emoji>`,
      }}
    />
  );
};

// Универсальный компонент — обычный эмодзи или tg-emoji
export const StatusEmoji = ({ status, size = "1em" }) => {
  if (!status) return null;
  if (isTgEmojiId(status)) {
    return <TgEmoji id={status} size={size} />;
  }
  return <span style={{ fontSize: size }}>{status}</span>;
};
