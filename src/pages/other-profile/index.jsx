import { useState } from "react";
import { useOtherUser } from "@/api/user";
import { calculateAge } from "@/utils/calculate-age.util";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useParams, useSearchParams, useLocation } from "react-router-dom";
import { OtherProfileCard, Spinner, MetchModal } from "@/components";
import { Heart, MessageCircle } from "lucide-react";

const RETURN_PATH_KEY = "luvo_return_path";

import TelegramIcon from "@/assets/images/telegram.png";
import InstagramIcon from "@/assets/images/instagram.png";

export const OtherProfilePage = () => {
  const params = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [viewed, setViewed] = useState(false);

  const { handleCopy: handleCopyInstagram, isCopied: isInstagramCopied } =
    useCopyToClipboard(2000);

  const { data, isLoading } = useOtherUser(params.id);
  const isMetch = searchParams.get("isMetch") === "true";

  // Функция открытия чата в Telegram
  const openTelegramChat = (username) => {
    if (!username) return;

    // Очищаем символ @ если он есть
    const cleanUsername = username.replace('@', '');
    const telegramUrl = `https://t.me/${cleanUsername}`;

    // Открываем чат через Telegram WebApp API - это сворачивает мини-апп и открывает чат
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(telegramUrl);
    } else if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openLink(telegramUrl);
    } else {
      window.open(telegramUrl, '_blank');
    }
  };

  // Функция для открытия стороннего сервиса поверх текущего
  const openExternalApp = (url) => {
    // Сохраняем текущий путь для возврата после закрытия внешней ссылки
    const currentPath = location.pathname + location.search;
    localStorage.setItem(RETURN_PATH_KEY, currentPath);

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-169px)] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const onCloseModal = () => {
    setIsOpen(false);
  };

  return (
    <div className="w-full p-5 min-h-[calc(100vh-169px)] overflow-y-auto scrollbar-hidden">
      <OtherProfileCard card={data} viewed={viewed} setViewed={setViewed} />

      <div className="mt-4">
        <h2 className="font-bold text-2xl">
          {data.first_name}, {calculateAge(data.birthdate)}
        </h2>

        {data.about && <div className="mt-2 text-base">{data.about}</div>}
      </div>

      <div className="mt-3">
        {data.instagram_username && (
          <div className="flex items-center">
            <img src={InstagramIcon} alt="instagram-icon" className="size-8" />

            <div
              className="ml-2 font-bold text-2xl cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleCopyInstagram(`@${data.instagram_username}`)}
            >
              @{data.instagram_username}
            </div>

            {isInstagramCopied && (
              <span className="ml-2 text-sm text-green-600 dark:text-green-400 transition-opacity">
                ✓ Скопировано
              </span>
            )}
          </div>
        )}

        {data.telegram_username && (
          <div className="mt-2 flex items-center">
            <img src={TelegramIcon} alt="telegram-icon" className="size-8" />

            <div className="ml-2 font-bold text-2xl">
              @{data.telegram_username}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col items-center gap-3 pb-10">
        <button
          onClick={() => openExternalApp('https://mystic-tarot-miniapp.vercel.app/')}
          className="py-2 px-3 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
        >
          <Heart className="w-3.5 h-3.5" />
          <span>проверить совместимость</span>
        </button>

        {data.telegram_username && (
          <button
            onClick={() => openTelegramChat(data.telegram_username)}
            className="py-2 px-3 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Начать чат</span>
          </button>
        )}
      </div>

      {isOpen && <MetchModal isOpen={isOpen} onClose={onCloseModal} />}
    </div>
  );
};
