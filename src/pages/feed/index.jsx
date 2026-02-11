import { useEffect, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { useFeedView, useSuperlikeStatus } from "@/api/feed";
import { useFeedBuffer } from "@/hooks/useFeedBuffer";
import { FeedEmptyIcon } from "@/assets/icons/feed-empty";
import { useSpring, animated } from "@react-spring/web";
import { FeedCard, Spinner, MetchModal } from "@/components";

export const FeedPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [viewed, setViewed] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [showRecommendationEnd, setShowRecommendationEnd] = useState(false);
  const [isCardInfoOpen, setIsCardInfoOpen] = useState(false);

  const { mutate: sendViewMutation } = useFeedView();
  const { data: superlikeStatus } = useSuperlikeStatus();
  const { cards, currentIndex, setCurrentIndex, isLoading, hasMore, updateCardLikeStatus, recommendedCount } = useFeedBuffer();
  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex === cards.length - 1;

  useEffect(() => {
    const nextCard = cards[currentIndex + 1];
    if (nextCard?.photos?.length) {
      nextCard.photos.forEach((url) => {
        const img = new Image();
        img.src = url;
      });
    }
  }, [currentIndex, cards]);

  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  const bind = useDrag(
    ({ down, movement: [, my] }) => {
      if (!cards.length || isCardInfoOpen) return;

      if (!down) {
        if (Math.abs(my) > window.innerHeight * 0.2) {
          // Свайп вниз - возврат
          if (my > 0) {
            if (showEndScreen) {
              setShowEndScreen(false);
            } else if (showRecommendationEnd) {
              setShowRecommendationEnd(false);
            } else if (currentIndex > 0) {
              setCurrentIndex((prev) => {
                const nextIndex = prev - 1;
                sendViewMutation(cards[nextIndex].user_id);
                return nextIndex;
              });
            }
          }
          // Свайп вверх - следующая карточка, transition screen или конец ленты
          else if (my < 0) {
            if (showEndScreen) {
              return;
            } else if (showRecommendationEnd) {
              // С transition screen продолжаем к нерекомендованным
              setShowRecommendationEnd(false);
              if (currentIndex < cards.length - 1) {
                setCurrentIndex((prev) => {
                  const nextIndex = prev + 1;
                  sendViewMutation(cards[nextIndex].user_id);
                  return nextIndex;
                });
              }
            } else if (
              recommendedCount > 0 &&
              currentIndex === recommendedCount - 1 &&
              currentIndex < cards.length - 1
            ) {
              // Последняя рекомендованная карточка, но есть ещё нерекомендованные
              setShowRecommendationEnd(true);
            } else if (currentIndex < cards.length - 1) {
              setCurrentIndex((prev) => {
                const nextIndex = prev + 1;
                sendViewMutation(cards[nextIndex].user_id);
                return nextIndex;
              });
            } else if (isLastCard && !hasMore) {
              setShowEndScreen(true);
            }
          }
        }
        api.start({ y: 0, config: { tension: 300, friction: 30 } });
      } else {
        api.start({ y: my, config: { tension: 300, friction: 30 } });
      }
    },
    { axis: "y" }
  );

  const onCloseModal = () => {
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-169px)] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentCard || !cards.length) {
    return (
      <div className="w-full min-h-[calc(100vh-169px)] flex items-center justify-center">
        <div className="py-16 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <FeedEmptyIcon />
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Пока нет анкет
          </h3>

          <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
            Новые анкеты появятся здесь, когда пользователи начнут
            регистрироваться
          </p>
        </div>
      </div>
    );
  }

  const renderTransitionScreen = () => (
    <animated.div
      {...bind()}
      className="w-full h-full p-5 flex items-center justify-center"
      style={{
        touchAction: "none",
        transform: y.to((y) => `translateY(${y}px)`),
      }}
    >
      <div className="py-16 flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <FeedEmptyIcon />
        </div>

        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 text-center">
          Вы просмотрели пользователей, которых мы вам рекомендуем, хотите продолжить?
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-4">
          *следующие анкеты не будут обработаны алгоритмом рекомендаций
        </p>

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          Свайпни вверх, чтобы продолжить
        </p>
      </div>
    </animated.div>
  );

  return (
    <div className="w-full min-h-[calc(100vh-169px)] flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full max-w-md">
        {showEndScreen ? (
          <animated.div
            {...bind()}
            className="w-full h-full p-5 flex items-center justify-center"
            style={{
              touchAction: "none",
              transform: y.to((y) => `translateY(${y}px)`),
            }}
          >
            <div className="py-16 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <FeedEmptyIcon />
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                Твои рекомендации еще формируются 🤗
              </h3>

              <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                Свайпни вниз, чтобы вернуться к анкетам
              </p>
            </div>
          </animated.div>
        ) : showRecommendationEnd ? (
          renderTransitionScreen()
        ) : (
          <animated.div
            {...bind()}
            className="w-full h-full p-5"
            style={{
              touchAction: "none",
              transform: y.to((y) => `translateY(${y}px)`),
            }}
          >
            <FeedCard
              card={currentCard}
              viewed={viewed}
              setViewed={setViewed}
              setIsOpen={setIsOpen}
              setMatchedUser={setMatchedUser}
              updateCardLikeStatus={updateCardLikeStatus}
              onInfoPanelChange={setIsCardInfoOpen}
              superlikeRemaining={superlikeStatus?.remaining}
              superlikeLimit={superlikeStatus?.limit}
            />
          </animated.div>
        )}
      </div>

      {isOpen && (
        <MetchModal
          isOpen={isOpen}
          onClose={onCloseModal}
          matchedUser={matchedUser}
        />
      )}
    </div>
  );
};
