import { useEffect, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { useFeedView } from "@/api/feed";
import { useFeedBuffer } from "@/hooks/useFeedBuffer";
import { FeedEmptyIcon } from "@/assets/icons/feed-empty";
import { FeedCard, Spinner } from "@/components";
import { useSpring, animated } from "@react-spring/web";

export const FeedPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewed, setViewed] = useState(false);

  const { mutate: sendViewMutation } = useFeedView();
  const { cards, currentIndex, setCurrentIndex, isLoading } = useFeedBuffer();
  const currentCard = cards[currentIndex];

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
    ({ down, movement: [_, my] }) => {
      if (!cards.length) return;

      if (!down) {
        if (Math.abs(my) > window.innerHeight * 0.2) {
          if (my > 0 && currentIndex > 0) {
            setCurrentIndex((prev) => {
              const nextIndex = prev - 1;
              sendViewMutation(cards[nextIndex].id);
              return nextIndex;
            });
          } else if (my < 0 && currentIndex < cards.length - 1) {
            setCurrentIndex((prev) => {
              const nextIndex = prev + 1;
              sendViewMutation(cards[nextIndex].id);
              return nextIndex;
            });
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

  return (
    <div className="w-full min-h-[calc(100vh-169px)] flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full max-w-md">
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
          />
        </animated.div>
      </div>

      {isOpen && <MetchModal isOpen={isOpen} onClose={onCloseModal} />}
    </div>
  );
};
