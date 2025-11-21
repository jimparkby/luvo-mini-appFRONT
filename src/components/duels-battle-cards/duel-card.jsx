import { useMemo, useState, useEffect, useRef } from "react";
import classnames from "classnames";

export const DuelCard = ({
  user,
  style,
  onSelect,
  disabled = false,
  sizeClass = "aspect-square",
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const imgRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  const photoUrl = useMemo(() => {
    const src = Array.isArray(user.photos) ? user.photos[0] : user.photos;
    return typeof src === "string" ? src : "";
  }, [user.photos]);

  // Сброс состояния при смене пользователя
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setLoadingProgress(0);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, [user.id]);

  // Очистка таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const initials = useMemo(() => {
    const name = (user?.instagram_username || "?").trim();
    const parts = name.split(" ");
    const first = parts[0]?.[0] || "?";
    const second = parts[1]?.[0] || "";
    return (first + second).toUpperCase();
  }, [user?.instagram_username]);

  const age = useMemo(() => {
    const bd = user?.birthdate;
    if (!bd) return null;
    const d = new Date(bd);
    if (isNaN(d.getTime())) return null;
    const today = new Date();
    let years = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
      years -= 1;
    }
    return years >= 0 ? years : null;
  }, [user?.birthdate]);

  const handleCardClick = () => {
    if (!disabled && onSelect) {
      onSelect(user.id);
    }
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    setLoadingProgress(100);
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoaded(true);
    setLoadingProgress(0);
  };

  const getCardClasses = () => {
    return classnames(
      "relative w-full rounded-[20px] text-white overflow-hidden cursor-pointer transition-all duration-200",
      sizeClass,
      disabled
        ? "opacity-50 cursor-not-allowed"
        : "hover:scale-[1.02] active:scale-[0.98]"
    );
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[340px] lg:max-w-[360px]">
        <div
          className={getCardClasses()}
          style={style}
          onClick={handleCardClick}
        >
          {/* Квадратная область */}
          <div className="pt-[100%]" />
          {/* Содержимое, растянутое по квадрату */}
          <div className="absolute inset-0">
            {/* Скелетон загрузки */}
            {!isLoaded && !hasError && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            )}

            {/* Прогресс-бар загрузки */}
            {!isLoaded && !hasError && loadingProgress > 0 && (
              <div className="absolute top-2 left-2 right-2 h-1 bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            )}

            {/* Фото */}
            {!!photoUrl && (
              <img
                ref={imgRef}
                src={photoUrl}
                alt={`${user.instagram_username || "Пользователь"}`}
                className={classnames(
                  "h-full w-full object-cover rounded-[20px] select-none transition-all duration-500",
                  isLoaded && !hasError
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-105"
                )}
                draggable={false}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onLoad={handleImageLoad}
                onError={handleImageError}
                onLoadStart={() => setLoadingProgress(10)}
              />
            )}

            {/* Если нет фото вообще */}
            {!photoUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-500 dark:text-gray-300">
                      {initials}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Нет фото
                  </p>
                </div>
              </div>
            )}

            {/* Наложение имени/возраста внизу */}
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold drop-shadow">
                  {user.instagram_username || "Аноним"}
                </h3>

                {age != null && (
                  <span className="text-xs sm:text-sm text-white/90">
                    {age} лет
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
