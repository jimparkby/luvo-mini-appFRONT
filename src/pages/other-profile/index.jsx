import { useState } from "react";
import { useOtherUser } from "@/api/user";
import { calculateAge } from "@/utils/calculate-age.util";
import { useParams, useSearchParams, useLocation } from "react-router-dom";
import { OtherProfileCard, Spinner, MetchModal } from "@/components";
import { Heart, MessageCircle } from "lucide-react";

const RETURN_PATH_KEY = "luvo_return_path";
const EXTERNAL_FLAG_KEY = "luvo_went_external";

import TelegramIcon from "@/assets/images/telegram.png";
import InstagramIcon from "@/assets/images/instagram.png";

export const OtherProfilePage = () => {
  const params = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [viewed, setViewed] = useState(false);

  const { data, isLoading } = useOtherUser(params.id);
  const isMetch = searchParams.get("isMetch") === "true";

  // Функция открытия чата в Telegram
  const openTelegramChat = (username, isAi) => {
    // Сохраняем текущий путь для возврата после закрытия чата
    const currentPath = location.pathname + location.search;
    sessionStorage.setItem(RETURN_PATH_KEY, currentPath);
    sessionStorage.setItem(EXTERNAL_FLAG_KEY, 'true');

    // Если это AI-пользователь или нет username — открываем бота
    const telegramUrl = (isAi || !username)
      ? 'https://t.me/luvoapp_bot'
      : `https://t.me/${username.replace('@', '')}`;

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
    sessionStorage.setItem(RETURN_PATH_KEY, currentPath);
    sessionStorage.setItem(EXTERNAL_FLAG_KEY, 'true');

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

            <div className="ml-2 font-bold text-2xl select-text cursor-text">
              @{data.instagram_username}
            </div>
          </div>
        )}

        {isMetch && data.telegram_username && (
          <div className="mt-2 flex items-center">
            <img src={TelegramIcon} alt="telegram-icon" className="size-8" />

            <div className="ml-2 font-bold text-2xl select-text cursor-text">
              @{data.telegram_username}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col items-center gap-3 pb-10">
        <button
          onClick={() => openExternalApp('https://mystic-tarot-miniapp.vercel.app/')}
          className="py-2 px-4 rounded-full bg-primary-red hover:bg-primary-red/80 text-white text-sm font-medium flex items-center gap-2 transition-all"
        >
          <Heart className="w-4 h-4" />
          <span>Проверить совместимость</span>
        </button>

        <button
          onClick={() => openTelegramChat(data.telegram_username, data.is_ai)}
          className="py-2 px-4 rounded-full bg-primary-red hover:bg-primary-red/80 text-white text-sm font-medium flex items-center gap-2 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Начать общение</span>
        </button>
      </div>

      {isOpen && <MetchModal isOpen={isOpen} onClose={onCloseModal} />}
    </div>
  );
};
