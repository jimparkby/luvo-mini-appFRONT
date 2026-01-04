import { Sparkles } from "lucide-react";
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

  // Функция для открытия стороннего сервиса поверх текущего
  const openExternalApp = (url) => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const hasLikes = likesData && likesData.length > 0;
  const hasMatches = metchesData && metchesData.length > 0;
  const isLoading = likesIsLoading || metchesIsLoading;
  const hasNoData = !isLoading && !hasLikes && !hasMatches;

  return (
    <div className="w-full min-h-[calc(100vh-169px)] flex flex-col items-center justify-center relative pb-40">
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
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Взаимные симпатии ({metchesData.length})
              </h2>

              <MetchesList metches={metchesData} />
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-24 left-0 right-0 flex flex-col items-center gap-3 px-6 z-40">
        <button 
          onClick={() => openExternalApp('https://mystic-tarot-miniapp.vercel.app/')}
          className="w-full max-w-xs py-2.5 px-3 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity active:scale-95 shadow-lg shadow-violet-500/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>проверить совместимость</span>
        </button>

        <button className="w-full max-w-xs py-2.5 px-3 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity active:scale-95 shadow-lg shadow-violet-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>just chatting</span>
        </button>
      </div>

      {isOpen && <MetchModal isOpen={isOpen} onClose={onCloseModal} />}
    </div>
  );
};