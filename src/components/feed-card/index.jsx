import { useState, useRef, useEffect, useCallback } from "react";
import classnames from "classnames";
import { Heart, ChevronDown } from "lucide-react";
import { calculateAge } from "@/utils/calculate-age.util";
import { useLiked, useSuperLike, useFeedView } from "@/api/feed";

import BigHeart from "@/assets/icons/big-heart.svg";
import HeartIcon from "@/assets/icons/heart.svg";
import EmptyHeartIcon from "@/assets/icons/empty-heart.svg";

const DOUBLE_TAP_DELAY = 250;

// Проверка, является ли URL внешним
const isExternalUrl = (src) => {
  try {
    if (src.startsWith("http://") || src.startsWith("https://")) {
      const url = new URL(src);
      return url.origin !== window.location.origin;
    }
  } catch {
    return false;
  }
  return false;
};

// Создаем низкокачественную версию изображения БЕЗ CORS проблем
const createLowQualityImage = (src) => {
  // Для внешних URL не создаем placeholder через canvas (CORS проблемы)
  if (isExternalUrl(src)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      try {
        canvas.width = 40;
        canvas.height = 40;
        ctx.drawImage(img, 0, 0, 40, 40);
        const lowQualitySrc = canvas.toDataURL("image/webp", 0.1);
        resolve(lowQualitySrc);
      } catch (error) {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    // НЕ устанавливаем crossOrigin для локальных изображений
    img.src = src;
  });
};

export const FeedCard = ({ card, viewed, setViewed, className, setIsOpen, setMatchedUser, updateCardLikeStatus, onInfoPanelChange }) => {
  const [liked, setLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [lowQualitySrc, setLowQualitySrc] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSuperLiking, setIsSuperLiking] = useState(false);

  const lastTap = useRef(0);
  const clickTimeout = useRef(null);

  const { mutate: sendViewMutation } = useFeedView();
  const { mutateAsync: likeUserMutation } = useLiked();
  const { mutateAsync: superLikeMutation } = useSuperLike();

  const openInfoPanel = useCallback(() => {
    setIsInfoOpen(true);
    onInfoPanelChange?.(true);
  }, [onInfoPanelChange]);

  const closeInfoPanel = useCallback(() => {
    setIsInfoOpen(false);
    onInfoPanelChange?.(false);
  }, [onInfoPanelChange]);

  const markAsViewed = useCallback(() => {
    if (!viewed) {
      sendViewMutation(card.user_id);
      setViewed(true);
    }
  }, [viewed, sendViewMutation, card.user_id, setViewed]);

  // Обработчик загрузки изображения
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const triggerHeartAnimation = () => {
    setShowHeart(true);
    setHeartAnim(true);
    setTimeout(() => {
      setHeartAnim(false);
      setShowHeart(false);
    }, 1200);
  };

  const handleLike = async () => {
    // Защита от повторных вызовов
    if (isLiking) {
      console.log("Лайк уже обрабатывается, пропускаем");
      return;
    }

    markAsViewed();
    setIsLiking(true);

    try {
      const { data } = await likeUserMutation(card.user_id);

      const newLikedState = data.liked;

      // Обновляем локальное состояние
      setLiked(newLikedState);

      // Обновляем состояние в буфере карточек
      if (updateCardLikeStatus) {
        updateCardLikeStatus(card.user_id, newLikedState);
      }

      if (newLikedState) {
        // Поставили лайк
        if (data.matched) {
          setMatchedUser(card);
          setIsOpen(true);
        }
        triggerHeartAnimation();
      }
    } catch (error) {
      console.error("Ошибка лайка:", error);
    } finally {
      // Освобождаем через 500ms для защиты от быстрых повторных кликов
      setTimeout(() => setIsLiking(false), 500);
    }
  };

  const handleSuperLike = async () => {
    if (isSuperLiking) return;
    setIsSuperLiking(true);

    try {
      const { data } = await superLikeMutation(card.user_id);

      setLiked(true);
      if (updateCardLikeStatus) {
        updateCardLikeStatus(card.user_id, true);
      }

      if (data.matched) {
        setMatchedUser(card);
        setIsOpen(true);
      }

      triggerHeartAnimation();
      closeInfoPanel();
    } catch (error) {
      console.error("Ошибка суперлайка:", error);
    } finally {
      setTimeout(() => setIsSuperLiking(false), 500);
    }
  };

  const handleSingleTap = (clickX, containerWidth) => {
    setCurrentPhotoIndex((prev) => {
      const isLeft = clickX < containerWidth / 2;
      return isLeft
        ? prev === 0
          ? card.photos.length - 1
          : prev - 1
        : prev === card.photos.length - 1
        ? 0
        : prev + 1;
    });
  };

  const handleImageClick = (e) => {
    markAsViewed();

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;

    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      handleLike();
    } else {
      clickTimeout.current = setTimeout(() => {
        handleSingleTap(clickX, rect.width);
        clickTimeout.current = null;
      }, DOUBLE_TAP_DELAY);
    }
  };

  const handleTouchStart = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      handleLike();
    }
    lastTap.current = now;
  };

  // Сброс состояния при смене карточки (по user_id)
  useEffect(() => {
    if (!card.photos || card.photos.length === 0) return;

    // Предзагружаем все изображения в фоне
    card.photos.forEach((url, index) => {
      if (index === currentPhotoIndex) return;
      const img = new Image();
      img.src = url;
    });

    // Инициализируем состояние лайка из данных карточки
    setLiked(card.is_liked || false);
    setIsLiking(false);
    setCurrentPhotoIndex(0);
    setImageLoaded(false);
    setLowQualitySrc(null);
    setIsInfoOpen(false);
    onInfoPanelChange?.(false);
    clickTimeout.current && clearTimeout(clickTimeout.current);
  }, [card.user_id]);

  // Отдельный эффект для обновления liked статуса (БЕЗ сброса изображения)
  useEffect(() => {
    setLiked(card.is_liked || false);
  }, [card.is_liked]);

  // Создаем низкокачественную версию при смене фото
  useEffect(() => {
    if (card.photos?.[currentPhotoIndex]) {
      createLowQualityImage(card.photos[currentPhotoIndex]).then(
        setLowQualitySrc
      );
      setImageLoaded(false);
    }
  }, [currentPhotoIndex, card.photos]);

  const age = calculateAge(card.birthdate);

  return (
    <div
      className={classnames(
        className,
        "relative w-full h-full rounded-[20px] text-white overflow-hidden"
      )}
    >
      <div className="relative w-full h-full">
        {/* Низкокачественное изображение как placeholder */}
        {lowQualitySrc && !imageLoaded && (
          <img
            src={lowQualitySrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover rounded-[20px] filter blur-sm scale-110"
            style={{ imageRendering: "pixelated" }}
          />
        )}

        {/* Полноценное изображение */}
        <img
          src={card.photos[currentPhotoIndex]}
          alt="profile"
          className={`h-full w-full object-cover rounded-[20px] select-none transition-opacity duration-500 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          draggable={false}
          onLoad={handleImageLoad}
        />

        {showHeart && (
          <img
            src={BigHeart}
            alt="big-heart"
            className={classnames(
              "absolute top-1/2 left-1/2 z-20 size-32 -translate-x-1/2 -translate-y-1/2",
              { "animate-like-heart": heartAnim }
            )}
          />
        )}
      </div>

      <div
        className={classnames(
          "absolute top-0 left-0 w-full h-full pt-2 px-3 pb-8 flex flex-col justify-between rounded-[20px]",
          "bg-gradient-to-t from-[#56484E] to-[#56484E]/0"
        )}
        onClick={handleImageClick}
        onTouchStart={handleTouchStart}
      >
        <div className="flex justify-between gap-1">
          {card.photos.map((_, index) => (
            <div
              key={index}
              className={classnames(
                "w-full h-1 rounded",
                index === currentPhotoIndex ? "bg-primary-red" : "bg-white/70"
              )}
            />
          ))}
        </div>

        <div>
          <div className="pr-3 flex items-center justify-between">
            <button
              className="font-bold text-2xl text-white text-left active:scale-[0.98] transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                openInfoPanel();
              }}
            >
              {card.first_name}, {age}
            </button>

            <img
              src={liked ? HeartIcon : EmptyHeartIcon}
              alt="heart-icon"
              className="size-8 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
            />
          </div>
        </div>
      </div>

      {/* Info Panel (bottom sheet) */}
      <div
        className={classnames(
          "absolute inset-0 rounded-[20px] transition-opacity duration-300 z-30",
          isInfoOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 rounded-[20px]"
          onClick={closeInfoPanel}
        />

        {/* Panel */}
        <div
          className={classnames(
            "absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-8 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isInfoOpen ? "translate-y-0" : "translate-y-full"
          )}
        >
          {/* Handle */}
          <button
            className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full"
            onClick={closeInfoPanel}
          />

          {/* Close chevron */}
          <button
            className="absolute top-4 right-4"
            onClick={closeInfoPanel}
          >
            <ChevronDown className="w-6 h-6 text-gray-400" />
          </button>

          {/* Name */}
          <h2 className="text-2xl font-bold text-gray-900 mt-2">
            {card.first_name}
          </h2>

          {/* Age */}
          <p className="text-gray-500 text-base mb-4">{age}</p>

          {/* About */}
          {card.about && (
            <p className="text-gray-800 text-sm leading-relaxed mb-6">
              {card.about}
            </p>
          )}

          {/* Super Like Button */}
          <button
            className="superlike-btn w-full relative overflow-hidden rounded-2xl py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 active:scale-[0.98] transition-transform"
            onClick={handleSuperLike}
            disabled={isSuperLiking}
          >
            {/* Shimmer effect */}
            <div className="superlike-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* Sparkles */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="superlike-sparkle-1 absolute top-2 left-8 w-1.5 h-1.5 bg-white rounded-full" />
              <div className="superlike-sparkle-2 absolute top-3 right-12 w-1 h-1 bg-white rounded-full" />
              <div className="superlike-sparkle-3 absolute bottom-3 left-16 w-1 h-1 bg-white rounded-full" />
            </div>

            <div className="relative flex items-center justify-center gap-3">
              <Heart className="superlike-heart-pulse w-6 h-6 text-white fill-white" />
              <span className="text-white font-semibold text-lg tracking-wide">
                {isSuperLiking ? "..." : "Супер лайк"}
              </span>
              <svg className="superlike-star w-5 h-5 text-yellow-300 absolute -right-1 -top-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
