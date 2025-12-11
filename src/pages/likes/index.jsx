import { useRef, useState } from "react";
import { useLikes, useMatches } from "@/api/likes";
import {
  Spinner,
  LikesCard,
  EmptyState,
  MetchModal,
  MetchesList,
} from "@/components";

export const LikesPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const touchEndX = useRef(null);
  const touchStartX = useRef(null);

  const { data: likesData, isLoading: likesIsLoading } = useLikes();
  const { data: metchesData, isLoading: metchesIsLoading } = useMatches();

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (diff > threshold) {
      setCurrentCardIndex((prev) =>
        prev < likesData.length - 1 ? prev + 1 : prev
      );
    } else if (diff < -threshold) {
      setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const onCloseModal = () => setIsOpen(false);

  const hasLikes = likesData && likesData.length > 0;
  const hasMatches = metchesData && metchesData.length > 0;
  const isLoading = likesIsLoading || metchesIsLoading;
  const hasNoData = !isLoading && !hasLikes && !hasMatches;

  return (
    <div className="w-full min-h-[calc(100vh-169px)] flex flex-col items-center justify-center">
      {isLoading ? (
        <div className="w-full min-h-[calc(100vh-169px)] flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : hasNoData ? (
        <EmptyState
          title="Пока ничего нет"
          description="Лайки и взаимные симпатии появятся здесь, когда вы начнете получать внимание"
        />
      ) : (
        <div className="container mx-auto max-w-md p-5 overflow-y-auto scrollbar-hidden">
          {hasLikes && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Лайки ({likesData.length})
              </h2>

              <div>
                <div
                  className="relative"
                  onTouchEnd={handleTouchEnd}
                  onTouchStart={handleTouchStart}
                >
                  <LikesCard card={likesData[currentCardIndex]} />
                </div>

                {likesData.length > 1 && (
                  <div className="flex justify-center mt-4 space-x-2">
                    {likesData.map((_, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                          index === currentCardIndex
                            ? "bg-primary-red"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {hasMatches && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Взаимные симпатии ({metchesData.length})
              </h2>

              <MetchesList metches={metchesData} />
            </div>
          )}
        </div>
      )}

      {isOpen && <MetchModal isOpen={isOpen} onClose={onCloseModal} />}
    </div>
  );
};
