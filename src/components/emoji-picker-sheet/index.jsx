import { useEffect, useRef } from "react";
import { EMOJI_CATEGORIES } from "@/constants/status";

export const EmojiPickerSheet = ({ isOpen, onSelect, onClose, selected }) => {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
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
        className="relative w-full bg-white dark:bg-[#1e1e1e] rounded-t-3xl max-h-[70vh] flex flex-col shadow-xl"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
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

        {/* Emoji grid by categories */}
        <div className="overflow-y-auto px-4 pb-8">
          {EMOJI_CATEGORIES.map((cat) => (
            <div key={cat.label} className="mb-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">
                {cat.label}
              </p>
              <div className="grid grid-cols-9 gap-1">
                {cat.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { onSelect(emoji); onClose(); }}
                    className={`text-2xl h-10 w-10 flex items-center justify-center rounded-xl transition-all active:scale-90 ${
                      selected === emoji
                        ? "bg-primary-red/15 ring-2 ring-primary-red scale-110"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
