import { getPremiumEmojiImage } from "@/constants/premium-emojis";

// Определяет является ли строка ID кастомного tg-эмодзи (числовая строка ~15+ цифр)
export const isTgEmojiId = (s) => s && /^\d{15,}$/.test(s);

// Рендерит premium emoji как <img> из локального WebP файла
export const TgEmoji = ({ id, size = "1em" }) => {
  const image = getPremiumEmojiImage(id);
  if (!image) return null;
  return (
    <img
      src={image}
      alt=""
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "inline-block",
        verticalAlign: "middle",
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
