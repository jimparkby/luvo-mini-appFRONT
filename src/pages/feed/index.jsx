import { useEffect, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { useFeedView } from "@/api/feed";
import { useFeedBuffer } from "@/hooks/useFeedBuffer";
import { useSpring, animated } from "@react-spring/web";
import { FeedCard, Spinner, MetchModal, EmptyState } from "@/components";

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
    ({ down, movement: [, my] }) => {
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
      <EmptyState
        title="Пока нет анкет"
        description="Новые анкеты появятся здесь, когда пользователи начнут регистрироваться"
      />
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
