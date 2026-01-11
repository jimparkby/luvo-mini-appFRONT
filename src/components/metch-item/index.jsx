import { useState, useCallback } from "react";
import { Link } from "react-router-dom";

export const MetchItem = ({ metch }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const openTelegramChat = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!metch.telegram_username) return;

    // Очищаем символ @ если он есть
    const cleanUsername = metch.telegram_username.replace('@', '');
    const telegramUrl = `https://t.me/${cleanUsername}`;

    // Открываем ссылку через Telegram WebApp API если доступно
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openLink(telegramUrl);
    } else {
      window.open(telegramUrl, '_blank');
    }
  }, [metch.telegram_username]);

  const imageUrl = metch.photos?.[0] || null;
  const hasTelegram = metch.telegram_username && metch.telegram_username.trim() !== '';

  return (
    <div>
      <Link to={`/other-profile/${metch.user_id}?isMetch=true`}>
        <div className="relative aspect-square rounded-[20px] mb-[5px] overflow-hidden bg-gray-300">
          {/* Полноценное изображение */}
          {imageUrl && !imageError && (
            <img
              src={imageUrl}
              alt={`${metch.first_name} profile`}
              loading="lazy"
              fetchpriority="low"
              decoding="async"
              className={`absolute inset-0 w-full h-full object-cover rounded-[20px] transition-opacity duration-500 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          )}

          {/* Ошибка загрузки изображения */}
          {imageError && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <div className="text-gray-500 text-sm text-center">
                <div className="w-12 h-12 bg-gray-400 rounded-full mx-auto mb-2"></div>
                <span>Фото недоступно</span>
              </div>
            </div>
          )}

          {/* Fallback для случаев когда нет изображения */}
          {!imageUrl && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <div className="text-gray-500 text-sm text-center">
                <div className="w-12 h-12 bg-gray-400 rounded-full mx-auto mb-2"></div>
                <span>Нет фото</span>
              </div>
            </div>
          )}

          {/* Индикатор загрузки */}
          {!imageLoaded && !imageError && imageUrl && (
            <div className="absolute inset-0 bg-gray-300 animate-pulse flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </Link>

      {/* Имя - кликабелен только если есть telegram_username */}
      {hasTelegram ? (
        <div
          onClick={openTelegramChat}
          className="mt-[5px] font-bold text-xl truncate cursor-pointer hover:text-blue-500 transition-colors"
          title={`Написать ${metch.first_name} в Telegram`}
        >
          {metch.first_name}
        </div>
      ) : (
        <div
          className="mt-[5px] font-bold text-xl truncate"
          title={metch.first_name}
        >
          {metch.first_name}
        </div>
      )}
    </div>
  );
};
