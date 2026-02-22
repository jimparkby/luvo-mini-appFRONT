export const PREMIUM_EMOJIS = [
  { id: "5244757222830919644", fallback: "😍" },
  { id: "5244772594518870170", fallback: "😍" },
  { id: "5242564809530038437", fallback: "😄" },
  { id: "5244814191277134121", fallback: "😍" },
  { id: "5244815196299481895", fallback: "😍" },
  { id: "5244823180643683690", fallback: "😍" },
];

// Получить фоллбек по ID
export const getPremiumEmojiFallback = (id) => {
  const found = PREMIUM_EMOJIS.find((e) => e.id === id);
  return found ? found.fallback : "😍";
};
