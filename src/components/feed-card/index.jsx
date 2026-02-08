import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useDrag } from "@use-gesture/react";
import { useSpring, animated } from "@react-spring/web";
import classnames from "classnames";
import { Heart } from "lucide-react";
import { calculateAge } from "@/utils/calculate-age.util";
import { useLiked, useFeedView } from "@/api/feed";
import { useSuperLike } from "@/api/feed";

import BigHeart from "@/assets/icons/big-heart.svg";
import HeartIcon from "@/assets/icons/heart.svg";
import EmptyHeartIcon from "@/assets/icons/empty-heart.svg";

const DOUBLE_TAP_DELAY = 250;
const COLLAPSE_THRESHOLD = 80;

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

const createLowQualityImage = (src) => {
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
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
};

export const FeedCard = ({
  card,
  viewed,
  setViewed,
  className,
  setIsOpen,
  setMatchedUser,
  updateCardLikeStatus,
  onExpandChange,
}) => {
  const [liked, setLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [lowQualitySrc, setLowQualitySrc] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const lastTap = useRef(0);
  const clickTimeout = useRef(null);
  const infoRef = useRef(null);

  const { mutate: sendViewMutation } = useFeedView();
  const { mutateAsync: likeUserMutation } = useLiked();
  const { mutateAsync: superLikeMutation } = useSuperLike();

  // Анимация раскрытия
  const [{ expand }, springApi] = useSpring(() => ({
    expand: 0,
    config: { tension: 260, friction: 28 },
  }));

  const doExpand = useCallback(() => {
    setIsExpanded(true);
    springApi.start({ expand: 1 });
    onExpandChange?.(true);
  }, [springApi, onExpandChange]);

  const doCollapse = useCallback(() => {
    setIsExpanded(false);
    springApi.start({ expand: 0 });
    onExpandChange?.(false);
  }, [springApi, onExpandChange]);

  // Свайп вниз для сворачивания в раскрытом состоянии
  const bindDrag = useDrag(
    ({ down, movement: [, my], velocity: [, vy], direction: [, dy] }) => {
      if (!isExpanded) return;
      // Если контент проскроллен -- не сворачиваем
      if (infoRef.current && infoRef.current.scrollTop > 0) return;
      if (my < 0) return; // только свайп вниз

      if (down) {
        const progress = Math.max(0, 1 - my / 300);
        springApi.start({ expand: progress, immediate: true });
      } else {
        if (my > COLLAPSE_THRESHOLD || (vy > 0.5 && dy > 0)) {
          doCollapse();
        } else {
          springApi.start({ expand: 1 });
        }
      }
    },
    { axis: "y", filterTaps: true, from: () => [0, 0] }
  );

  const markAsViewed = useCallback(() => {
    if (!viewed) {
      sendViewMutation(card.user_id);
      setViewed(true);
    }
  }, [viewed, sendViewMutation, card.user_id, setViewed]);

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
    if (isLiking) return;
    markAsViewed();
    setIsLiking(true);
    try {
      const { data } = await likeUserMutation(card.user_id);
      const newLikedState = data.liked;
      setLiked(newLikedState);
      if (updateCardLikeStatus) {
        updateCardLikeStatus(card.user_id, newLikedState);
      }
      if (newLikedState) {
        if (data.matched) {
          setMatchedUser(card);
          setIsOpen(true);
        }
        triggerHeartAnimation();
      }
    } catch (error) {
      console.error("Ошибка лайка:", error);
    } finally {
      setTimeout(() => setIsLiking(false), 500);
    }
  };

  const handleSuperLike = async () => {
    if (isLiking) return;
    markAsViewed();
    setIsLiking(true);
    try {
      const { data } = await superLikeMutation(card.user_id);
      const newLikedState = data.liked;
      setLiked(newLikedState);
      if (updateCardLikeStatus) {
        updateCardLikeStatus(card.user_id, newLikedState);
      }
      if (newLikedState) {
        if (data.matched) {
          setMatchedUser(card);
          setIsOpen(true);
        }
        triggerHeartAnimation();
      }
    } catch (error) {
      console.error("Ошибка суперлайка:", error);
    } finally {
      setTimeout(() => setIsLiking(false), 500);
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

  const handlePhotoClick = (e) => {
    markAsViewed();
    if (isExpanded) {
      doCollapse();
      return;
    }
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

  const handlePhotoTouchStart = () => {
    if (isExpanded) return;
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      handleLike();
    }
    lastTap.current = now;
  };

  const handleInfoClick = () => {
    markAsViewed();
    if (isExpanded) return;
    doExpand();
  };

  // Сброс при смене карточки
  useEffect(() => {
    if (!card.photos || card.photos.length === 0) return;
    card.photos.forEach((url, index) => {
      if (index === currentPhotoIndex) return;
      const img = new Image();
      img.src = url;
    });
    setLiked(card.is_liked || false);
    setIsLiking(false);
    setCurrentPhotoIndex(0);
    setImageLoaded(false);
    setLowQualitySrc(null);
    setIsExpanded(false);
    springApi.start({ expand: 0, immediate: true });
    onExpandChange?.(false);
    clickTimeout.current && clearTimeout(clickTimeout.current);
  }, [card.user_id]);

  useEffect(() => {
    setLiked(card.is_liked || false);
  }, [card.is_liked]);

  useEffect(() => {
    if (card.photos?.[currentPhotoIndex]) {
      createLowQualityImage(card.photos[currentPhotoIndex]).then(
        setLowQualitySrc
      );
      setImageLoaded(false);
    }
  }, [currentPhotoIndex, card.photos]);

  const age = calculateAge(card.birthdate);
  const cityText = [card.city, card.district].filter(Boolean).join(", ");

  // --- РЕНДЕР ---

  const photoSection = (
    <div
      className="relative w-full flex-shrink-0"
      onClick={handlePhotoClick}
      onTouchStart={handlePhotoTouchStart}
    >
      {/* Aspect ratio wrapper */}
      <div className={classnames(
        "relative w-full overflow-hidden",
        isExpanded ? "max-h-[45vh]" : "aspect-[4/5]"
      )}>
        {lowQualitySrc && !imageLoaded && (
          <img
            src={lowQualitySrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover filter blur-sm scale-110"
            style={{ imageRendering: "pixelated" }}
          />
        )}
        <img
          src={card.photos[currentPhotoIndex]}
          alt="profile"
          className={classnames(
            "h-full w-full object-cover select-none transition-opacity duration-500",
            imageLoaded ? "opacity-100" : "opacity-0",
            isExpanded ? "max-h-[45vh]" : "aspect-[4/5]"
          )}
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

      {/* Индикаторы фото */}
      <div className="absolute top-2 left-3 right-3 flex gap-1 z-10">
        {card.photos.map((_, index) => (
          <div
            key={index}
            className={classnames(
              "flex-1 h-1 rounded",
              index === currentPhotoIndex ? "bg-primary-red" : "bg-white/70"
            )}
          />
        ))}
      </div>
    </div>
  );

  const infoSection = (
    <div
      ref={infoRef}
      {...(isExpanded ? bindDrag() : {})}
      className={classnames(
        "px-4 pt-3 pb-3 bg-white dark:bg-[#1A1A1A]",
        isExpanded
          ? "flex-1 overflow-y-auto scrollbar-hidden"
          : "cursor-pointer"
      )}
      style={isExpanded ? { touchAction: "pan-y" } : undefined}
      onClick={handleInfoClick}
    >
      {/* Имя и возраст */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-xl text-gray-900 dark:text-white">
          {card.first_name}, {age}
        </h2>
        <img
          src={liked ? HeartIcon : EmptyHeartIcon}
          alt="heart-icon"
          className="size-7 cursor-pointer flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
        />
      </div>

      {/* Описание (только в свёрнутом, если заполнено) */}
      {card.about && !isExpanded && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {card.about}
        </p>
      )}

      {/* Город (если заполнен) */}
      {cityText && !isExpanded && (
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          {cityText}
        </p>
      )}

      {/* Расширенный контент (видно только при раскрытии) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          {card.instagram_username && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Instagram:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                @{card.instagram_username}
              </span>
            </div>
          )}

          {/* Свайпни вниз для закрытия */}
          <p className="mt-6 text-xs text-gray-300 dark:text-gray-600 text-center">
            Нажми на фото или свайпни вниз, чтобы свернуть
          </p>
        </div>
      )}
    </div>
  );

  const buttonsSection = (
    <animated.div
      className="flex justify-center items-center gap-8 py-4 bg-white dark:bg-[#1A1A1A]"
      style={{
        opacity: expand.to((e) => 1 - e),
        pointerEvents: expand.to((e) => (e > 0.5 ? "none" : "auto")),
      }}
    >
      {/* Лайк */}
      <button
        onClick={handleLike}
        className="w-14 h-14 rounded-full bg-gray-900 dark:bg-gray-700 shadow-md flex items-center justify-center active:scale-95 transition-transform"
      >
        <Heart className="w-6 h-6 text-white" fill="white" />
      </button>

      {/* Суперлайк */}
      <button
        onClick={handleSuperLike}
        className="w-14 h-14 rounded-full bg-primary-red shadow-md flex items-center justify-center active:scale-95 transition-transform"
      >
        <Heart className="w-7 h-7 text-white" fill="white" />
      </button>
    </animated.div>
  );

  // Раскрытый оверлей (фиксированный на экране)
  if (isExpanded) {
    return (
      <>
        {/* Карточка-заглушка на месте (чтобы свайп навигации не ломался) */}
        <div className={classnames(className, "w-full opacity-0 pointer-events-none")} style={{ height: 100 }} />

        {/* Бэкдроп */}
        {createPortal(
          <animated.div
            className="fixed inset-0 z-40 bg-black/40"
            style={{ opacity: expand }}
            onClick={doCollapse}
          />,
          document.body
        )}

        {/* Раскрытая карточка */}
        {createPortal(
          <animated.div
            className="fixed z-50 flex flex-col bg-white dark:bg-[#1A1A1A] overflow-hidden"
            style={{
              top: "70px",
              left: "16px",
              right: "16px",
              bottom: "16px",
              borderRadius: expand.to((e) => `${20 - e * 4}px`),
              opacity: expand,
              transform: expand.to((e) => `scale(${0.95 + e * 0.05})`),
            }}
          >
            {photoSection}
            {infoSection}
          </animated.div>,
          document.body
        )}
      </>
    );
  }

  // Свёрнутая карточка
  return (
    <div
      className={classnames(
        className,
        "w-full rounded-[20px] bg-white dark:bg-[#1A1A1A] shadow-xl overflow-hidden"
      )}
    >
      {photoSection}
      {infoSection}
      {buttonsSection}
    </div>
  );
};
