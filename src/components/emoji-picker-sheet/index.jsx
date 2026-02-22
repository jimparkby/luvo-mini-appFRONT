import { useEffect, useRef } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useWebAppStore } from "@/store";

export const EmojiPickerSheet = ({ isOpen, onSelect, onClose, selected }) => {
  const sheetRef = useRef(null);
  const { theme } = useWebAppStore();

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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

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

        {/* Emoji Picker */}
        <div className="flex justify-center [&>em-emoji-picker]:w-full [&>em-emoji-picker]:border-none [&>em-emoji-picker]:shadow-none [&>em-emoji-picker]:rounded-none">
          <Picker
            data={data}
            onEmojiSelect={(emoji) => {
              onSelect(emoji.native);
              onClose();
            }}
            theme={theme === "dark" ? "dark" : "light"}
            locale="ru"
            previewPosition="none"
            skinTonePosition="none"
            navPosition="bottom"
            perLine={9}
            emojiSize={28}
            emojiButtonSize={38}
            maxFrequentRows={1}
            set="native"
          />
        </div>
      </div>
    </div>
  );
};
