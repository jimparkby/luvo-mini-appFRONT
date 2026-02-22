import { useEffect, useRef, useState } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useWebAppStore } from "@/store";
import { PREMIUM_EMOJIS } from "@/constants/premium-emojis";

export const EmojiPickerSheet = ({ isOpen, onSelect, onClose, selected, isPremium }) => {
  const sheetRef = useRef(null);
  const { theme } = useWebAppStore();
  const [activeTab, setActiveTab] = useState("regular");

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) {
        onClose();
      }
    };
    setTimeout(() => {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("touchstart", handleOutside);
    }, 50);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClose(); }}
        onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onClose(); }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full bg-white dark:bg-[#1e1e1e] rounded-t-3xl shadow-xl overflow-hidden"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2">
          <span className="font-semibold text-base text-gray-900 dark:text-white">
            Выбери статус
          </span>
          {selected && (
            <button
              className="text-sm text-primary-red font-medium"
              onClick={() => { onSelect(null); onClose(); }}
            >
              Убрать
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex mx-4 mb-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === "regular"
                ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }`}
            onClick={() => setActiveTab("regular")}
          >
            Обычные
          </button>
          <button
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === "premium"
                ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }`}
            onClick={() => setActiveTab("premium")}
          >
            Премиум 💎
          </button>
        </div>

        {/* Regular tab — emoji-mart */}
        {activeTab === "regular" && (
          <div className="flex justify-center [&>em-emoji-picker]:w-full [&>em-emoji-picker]:border-none [&>em-emoji-picker]:shadow-none [&>em-emoji-picker]:rounded-none">
            <Picker
              data={data}
              onEmojiSelect={(emoji) => { onSelect(emoji.native); onClose(); }}
              theme={theme === "dark" ? "dark" : "light"}
              locale="ru"
              previewPosition="none"
              searchPosition="none"
              skinTonePosition="none"
              navPosition="bottom"
              perLine={9}
              emojiSize={28}
              emojiButtonSize={38}
              maxFrequentRows={1}
              set="native"
            />
          </div>
        )}

        {/* Premium tab — tg-emoji */}
        {activeTab === "premium" && (
          <div className="px-4 pb-8 pt-2">
            {isPremium ? (
              <div className="grid grid-cols-6 gap-2">
                {PREMIUM_EMOJIS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onSelect(item.id); onClose(); }}
                    className={`h-14 w-full flex items-center justify-center rounded-2xl transition-all active:scale-90 ${
                      selected === item.id
                        ? "bg-primary-red/15 ring-2 ring-primary-red scale-105"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <img src={item.image} alt="" className="w-8 h-8 object-contain" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-10 flex flex-col items-center gap-3 text-center">
                <span className="text-4xl">💎</span>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Только для Premium
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px]">
                  Анимированные статусы доступны пользователям с Premium подпиской
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
