import { useState, useRef, useEffect, useCallback } from "react";
import classnames from "classnames";
import { calculateAge } from "@/utils/calculate-age.util";
import { useLiked, useFeedView } from "@/api/feed";

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

export const FeedCard = ({ card, viewed, setViewed, className, setIsOpen }) => {
  const [liked, setLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [lowQualitySrc, setLowQualitySrc] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const lastTap = useRef(0);
  const clickTimeout = useRef(null);

  const { mutate: sendViewMutation } = useFeedView();
  const { mutateAsync: likeUserMutation } = useLiked();

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
    markAsViewed();

    try {
      const { data } = await likeUserMutation(card.user_id);

      if (liked) {
        // Отменяем лайк
        setLiked(false);
      } else {
        // Ставим лайк
        if (data.matched) {
          setIsOpen(true);
        }
        setLiked(true);
        triggerHeartAnimation();
      }
    } catch (error) {
      console.error("Ошибка лайка:", error);
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

  useEffect(() => {
    if (!card.photos || card.photos.length === 0) return;

    // Предзагружаем все изображения в фоне
    card.photos.forEach((url, index) => {
      if (index === currentPhotoIndex) return;
      const img = new Image();
      img.src = url;
    });

    setLiked(false);
    setCurrentPhotoIndex(0);
    setImageLoaded(false);
    setLowQualitySrc(null);
    clickTimeout.current && clearTimeout(clickTimeout.current);
  }, [card.user_id]);

  // Создаем низкокачественную версию при смене фото
  useEffect(() => {
    if (card.photos?.[currentPhotoIndex]) {
      createLowQualityImage(card.photos[currentPhotoIndex]).then(
        setLowQualitySrc
      );
      setImageLoaded(false);
    }
  }, [currentPhotoIndex, card.photos]);

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
            <h2 className="font-bold text-2xl">
              {card.first_name}, {calculateAge(card.birthdate)}
            </h2>

            <img
              src={liked ? HeartIcon : EmptyHeartIcon}
              alt="heart-icon"
              className="size-8 cursor-pointer"
              onClick={handleLike}
            />
          </div>
          {card.about && <p className="mt-3 text-base">{card.about}</p>}
        </div>
      </div>
    </div>
  );
};
