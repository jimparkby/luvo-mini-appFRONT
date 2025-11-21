import { useEffect, useState } from "react";
import { useDuelPair } from "@/api/duels";
import {
  Spinner,
  DuelProgressBar,
  DuelsBattleCards,
  DuelsInformationModal,
} from "@/components";

export const DuelsPage = () => {
  const [step, setStep] = useState(null);
  const [winnerId, setWinnerId] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const { data, error, isLoading } = useDuelPair(winnerId, step);

  const duelsCount = data?.stage || 0;
  const isBlocked = duelsCount >= 15; // Блокируем когда stage достиг 15

  useEffect(() => {
    const hasSeen = localStorage.getItem("duelsHelpStatus");
    if (!hasSeen) setShowHelpModal(true);
  }, []);

  const handleSelectAndVote = async (winnerId) => {
    if (isLoading) return;

    setStep((prev) => prev + 1);
    setWinnerId(winnerId);
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
        </div>
      </div>
    );
  }

  if (!data?.profiles) {
    return (
      <div className="w-full min-h-[calc(100vh-169px)] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>

          <h2 className="text-xl font-bold mb-3">Недостаточно данных</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-169px)] flex flex-col overflow-hidden relative">
      <DuelProgressBar duelsCount={duelsCount} />

      {data?.final_winner && <DuelsWinnerCard winner={data.final_winner} />}
      {data?.profiles && (
        <DuelsBattleCards
          profiles={data.profiles}
          isLoading={isLoading}
          isBlocked={isBlocked}
          handleSelectAndVote={handleSelectAndVote}
        />
      )}

      <div className="pb-6 text-center">
        <button
          onClick={() => setShowHelpModal(true)}
          className="text-gray-400 text-sm underline hover:text-gray-600 transition"
        >
          Как это работает?
        </button>
      </div>

      {showHelpModal && <DuelsInformationModal onClose={handleOkHelp} />}
    </div>
  );
};
