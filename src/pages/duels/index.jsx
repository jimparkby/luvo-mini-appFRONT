import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useDuelPair } from "@/api/duels";
import { useUserLocation } from "@/hooks/useUserLocation";
import {
  Spinner,
  EmptyState,
  LocationModal,
  DuelsWinnerCard,
  DuelProgressBar,
  DuelsBattleCards,
  DuelsInformationModal,
} from "@/components";

export const DuelsPage = () => {
  const [step, setStep] = useState(null);
  const [winnerId, setWinnerId] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showRequiredLocationModal, setShowRequiredLocationModal] =
    useState(false);

  const { data, isLoading } = useDuelPair(winnerId, step);
  const { hasLocation, formattedLocation } = useUserLocation();

  const duelsCount = data?.stage || 0;
  const isBlocked = !!data?.final_winner; // Блокируем когда есть победитель

  useEffect(() => {
    const hasSeen = localStorage.getItem("duelsHelpStatus");
    if (!hasSeen) setShowHelpModal(true);
  }, []);

  // Показываем обязательную модалку локации при первом заходе на пустую страницу
  useEffect(() => {
    if (!isLoading && !data?.profiles && !data?.final_winner && !hasLocation) {
      setShowRequiredLocationModal(true);
    }
  }, [isLoading, data, hasLocation]);

  const handleSelectAndVote = async (winnerId) => {
    if (isLoading) return;

    setStep((prev) => prev + 1);
    setWinnerId(winnerId);
  };

  useEffect(() => {
    if (isBlocked) {
      confetti({
        particleCount: 300,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isBlocked]);

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

  if (!data?.profiles && !data?.final_winner) {
    return (
      <>
        <EmptyState
          title="Дуэли еще не сформированы"
          description="Новые дуэли появятся здесь, когда пользователи начнут получать лайки"
        />
        {showRequiredLocationModal && (
          <LocationModal
            isRequired={true}
            onClose={() => setShowRequiredLocationModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-169px)] flex flex-col overflow-hidden relative">
      <DuelProgressBar duelsCount={duelsCount} />

      {isBlocked
        ? data?.final_winner && <DuelsWinnerCard winner={data.final_winner} />
        : data?.profiles && (
            <DuelsBattleCards
              profiles={data.profiles}
              isLoading={isLoading}
              isBlocked={isBlocked}
              handleSelectAndVote={handleSelectAndVote}
            />
          )}

      <div className="pb-6 text-center space-y-2">
        <button
          onClick={() => setShowHelpModal(true)}
          className="text-gray-400 text-sm underline hover:text-gray-600 transition block mx-auto"
        >
          Как это работает?
        </button>

        <button
          onClick={() => setShowLocationModal(true)}
          className="text-gray-400 text-sm underline hover:text-gray-600 transition flex items-center gap-1 mx-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="inline-block"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {hasLocation ? formattedLocation : "Укажите локацию"}
        </button>
      </div>

      {showHelpModal && <DuelsInformationModal onClose={handleOkHelp} />}

      {showLocationModal && (
        <LocationModal onClose={() => setShowLocationModal(false)} />
      )}
    </div>
  );
};
