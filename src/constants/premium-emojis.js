export const PREMIUM_EMOJIS = [
  { id: "5244919186047650044", image: "/emoji/5244919186047650044.webp" },
  { id: "5244823180643683690", image: "/emoji/5244823180643683690.webp" },
  { id: "5244757222830919644", image: "/emoji/5244757222830919644.webp" },
  { id: "5330264202013582146", image: "/emoji/5330264202013582146.webp" },
  { id: "5244484380738473446", image: "/emoji/5244484380738473446.webp" },
  { id: "5244637681006169558", image: "/emoji/5244637681006169558.webp" },
  { id: "5244957372601879581", image: "/emoji/5244957372601879581.webp" },
  { id: "5244469296813330766", image: "/emoji/5244469296813330766.webp" },
  { id: "5242430471542953654", image: "/emoji/5242430471542953654.webp" },
];

// Получить image path по ID
export const getPremiumEmojiImage = (id) => {
  const found = PREMIUM_EMOJIS.find((e) => e.id === id);
  return found ? found.image : null;
};
