import { useState, useRef, useEffect, useCallback } from "react";
import classnames from "classnames";
import { Heart, ChevronDown } from "lucide-react";
import { calculateAge } from "@/utils/calculate-age.util";
import { useLiked, useSuperLike, useFeedView } from "@/api/feed";
import { useDetailedView } from "@/api/views";

import BigHeart from "@/assets/icons/big-heart.svg";
import HeartIcon from "@/assets/icons/heart.svg";
import EmptyHeartIcon from "@/assets/icons/empty-heart.svg";

const DOUBLE_TAP_DELAY = 250;

export const FeedCard = ({ card, viewed, setViewed, className, setIsOpen, setMatchedUser, updateCardLikeStatus, onInfoPanelChange }) => {
  const [liked, setLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSuperLiking, setIsSuperLiking] = useState(false);

  const lastTap = useRef(0);
  const clickTimeout = useRef(null);
  const detailedViewSent = useRef(false);

  const { mutate: sendViewMutation } = useFeedView();
  const { mutate: sendDetailedView } = useDetailedView();
  const { mutateAsync: likeUserMutation } = useLiked();
  const { mutateAsync: superLikeMutation } = useSuperLike();

  const openInfoPanel = useCallback(() => {
    setIsInfoOpen(true);
    onInfoPanelChange?.(true);
    if (!detailedViewSent.current) {
      sendDetailedView(card.user_id);
      detailedViewSent.current = true;
    }
  }, [onInfoPanelChange, sendDetailedView, card.user_id]);

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
    setIsInfoOpen(false);
    detailedViewSent.current = false;
    onInfoPanelChange?.(false);
    clickTimeout.current && clearTimeout(clickTimeout.current);
  }, [card.user_id]);

  // Отдельный эффект для обновления liked статуса (БЕЗ сброса изображения)
  useEffect(() => {
    setLiked(card.is_liked || false);
  }, [card.is_liked]);

  // Сброс загрузки при смене фото
  useEffect(() => {
    setImageLoaded(false);
  }, [currentPhotoIndex]);

  const age = calculateAge(card.birthdate);

  return (
    <div
      className={classnames(
        className,
        "relative w-full h-full rounded-[20px] text-white overflow-hidden"
      )}
    >
      <div className="relative w-full h-full">
        {/* Спиннер пока фото загружается */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[20px] bg-gray-900">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Полноценное изображение */}
        <img
          src={card.photos[currentPhotoIndex]}
          alt="profile"
          className={`h-full w-full object-cover rounded-[20px] select-none transition-opacity duration-300 ${
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
            "absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1e1e1e] rounded-t-3xl p-6 pb-8 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isInfoOpen ? "translate-y-0" : "translate-y-full"
          )}
        >
          {/* Handle */}
          <button
            className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"
            onClick={closeInfoPanel}
          />

          {/* Close chevron */}
          <button
            className="absolute top-4 right-4"
            onClick={closeInfoPanel}
          >
            <ChevronDown className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </button>

          {/* Name */}
          <div className="flex items-center gap-1.5 mt-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {card.first_name}
            </h2>
            {card.is_verified && (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48" className="flex-shrink-0">
                <polygon fill="#42a5f5" points="29.62,3 33.053,8.308 39.367,8.624 39.686,14.937 44.997,18.367 42.116,23.995 45,29.62 39.692,33.053 39.376,39.367 33.063,39.686 29.633,44.997 24.005,42.116 18.38,45 14.947,39.692 8.633,39.376 8.314,33.063 3.003,29.633 5.884,24.005 3,18.38 8.308,14.947 8.624,8.633 14.937,8.314 18.367,3.003 23.995,5.884" />
                <polygon fill="#fff" points="21.396,31.255 14.899,24.76 17.021,22.639 21.428,27.046 30.996,17.772 33.084,19.926" />
              </svg>
            )}
          </div>

          {/* Age */}
          <p className="text-gray-500 dark:text-gray-400 text-base mb-4">{age}</p>

          {/* About */}
          {card.about && (
            <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed mb-6">
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
