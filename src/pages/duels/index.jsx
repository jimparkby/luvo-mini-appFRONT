import { useEffect, useState } from "react";
import { useDuelProgressStore } from "@/store/duelProgressStore";
import { useDuelPair, useDuelNextPair } from "@/api/duels";
import {
  Spinner,
  DuelCard,
  CountdownTimer,
  DuelProgressBar,
} from "@/components";

export const DuelsPage = () => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const { mutate: nextPair, isPending: isVoting } = useDuelNextPair();
  const { data: pairData, isLoading, error, refetch } = useDuelPair();
  const { increment, isBlocked, limitUntil, refreshFromStorage } =
    useDuelProgressStore();

  useEffect(() => {
    const hasSeen = localStorage.getItem("duelsHelpStatus");
    if (!hasSeen) setShowHelpModal(true);
  }, []);

  useEffect(() => {
    refreshFromStorage();
  }, []);

  const handleSelectAndVote = (winnerId) => {
    if (isVoting || !pairData || isBlocked) return;

    setSelectedUserId(winnerId);
    nextPair(winnerId, {
      onSettled: () => {
        setSelectedUserId(null);
        increment();
      },
    });
  };

  const handleOkHelp = () => {
    setShowHelpModal(false);
    localStorage.setItem("duelsHelpStatus", "seen");
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-169px)] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-[calc(100vh-169px)] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold mb-3">Ошибка загрузки</h2>
          <button
            onClick={() => refetch()}
            className="bg-primary-red text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!pairData?.user || !pairData?.opponent) {
    return (
      <div className="w-full min-h-[calc(100vh-169px)] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
          <h2 className="text-xl font-bold mb-3">Недостаточно данных</h2>
          <button
            onClick={() => refetch()}
            className="bg-primary-red text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-169px)] flex flex-col overflow-hidden relative">
      {/* Прогрессбар (над карточками) */}
      <DuelProgressBar />

      {/* Контейнер карточек */}
      <div
        className={`flex flex-col items-center justify-center gap-3 p-4 overflow-hidden flex-1 ${
          isBlocked ? "opacity-40 pointer-events-none" : ""
        }`}
      >
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[340px] lg:max-w-[360px]">
            <DuelCard
              user={pairData.user}
              onSelect={handleSelectAndVote}
              disabled={isVoting || selectedUserId !== null || isBlocked}
            />
          </div>
        </div>

        <div className="w-full flex justify-center">
          <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[340px] lg:max-w-[360px]">
            <DuelCard
              user={pairData.opponent}
              onSelect={handleSelectAndVote}
              disabled={isVoting || selectedUserId !== null || isBlocked}
            />
          </div>
        </div>
      </div>

      {/* "Как это работает" */}
      <div className="pb-6 text-center">
        <button
          onClick={() => setShowHelpModal(true)}
          className="text-gray-400 text-sm underline hover:text-gray-600 transition"
        >
          Как это работает?
        </button>
      </div>

      {/* Индикатор голосования */}
      {isVoting && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-2 bg-black/70 text-white rounded-full px-4 py-2">
            <Spinner size="sm" />
            <span className="text-sm">Отправляем...</span>
          </div>
        </div>
      )}

      {/* Помощь */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-4">Как работает дуэль?</h2>

            <div className="shrink-0 mb-6 text-center">
              <h1 className="text-sm text-gray-500 leading-tight">
                Нас пускают по внешности? Нет.
                <br />
                Будут ли нас судить по внешности? Да 💫
              </h1>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleOkHelp}
                className="flex-1 bg-primary-red text-white py-2 rounded-lg hover:bg-red-600 transition"
              >
                Ок
              </button>
            </div>
          </div>
        </div>
      )}

      {isBlocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 p-6">
          <div className="bg-white/90 dark:bg-black/80 rounded-2xl shadow-lg px-6 py-8 max-w-sm w-full text-center border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Ты достиг лимита сравнений 😌
            </h2>

            {limitUntil && <CountdownTimer targetDate={new Date(limitUntil)} />}

            <p className="text-gray-600 dark:text-gray-400 mt-6 text-sm leading-snug">
              Сегодня вы встретились,
              <br />а завтра всё может измениться 💫
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
