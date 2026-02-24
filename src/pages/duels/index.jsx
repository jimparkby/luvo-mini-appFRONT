import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useDuelPair } from "@/api/duels";
import { useUser } from "@/api/user";
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
  const [step, setStep] = useState(0);
  const [winnerId, setWinnerId] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showRequiredLocationModal, setShowRequiredLocationModal] =
    useState(false);

  const { data, isLoading, error } = useDuelPair(winnerId, step);
  const { data: userData, isLoading: isLoadingUser } = useUser();

  const hasLocation =
    userData &&
    (userData.country || userData.location?.country) &&
    (userData.city || userData.location?.city);

  const duelsCount = data?.stage || 0;
  const isBlocked = !!data?.final_winner;

  const isLocationError =
    error?.response?.status === 400 ||
    error?.response?.data?.detail ===
      "Для участия в батлах нужно выбрать локацию";

  const isNotEnoughUsers =
    error?.response?.data?.detail === "Недостаточно пользователей";

  // Бэкенд возвращает { user, opponent } — приводим к массиву для DuelsBattleCards
  const profiles = data ? [data.user, data.opponent] : null;

  useEffect(() => {
    const hasSeen = localStorage.getItem("duelsHelpStatus");
    if (!hasSeen) setShowHelpModal(true);
  }, []);

  useEffect(() => {
    if (!isLoadingUser && !hasLocation) {
      setShowRequiredLocationModal(true);
    } else if (hasLocation && showRequiredLocationModal) {
      setShowRequiredLocationModal(false);
    }
  }, [isLoadingUser, hasLocation, showRequiredLocationModal]);

  // Если бэкенд вернул 400 (нет района) — показываем модалку локации
  useEffect(() => {
    if (isLocationError) {
      setShowRequiredLocationModal(true);
    }
  }, [isLocationError]);

  useEffect(() => {
    if (isBlocked) {
      confetti({
        particleCount: 300,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isBlocked]);

  const handleSelectAndVote = (selectedWinnerId) => {
    if (isLoading) return;
    setStep((prev) => prev + 1);
    setWinnerId(selectedWinnerId);
  };

  const handleOkHelp = () => {
    setShowHelpModal(false);
    localStorage.setItem("duelsHelpStatus", "seen");
  };

  if (isLoading || isLoadingUser) {
    return (
      <>
        <div className="w-full min-h-[calc(100vh-169px)] flex items-center justify-center">
          <Spinner size="lg" />
        </div>

        {showRequiredLocationModal && (
          <LocationModal
            isRequired={true}
            onClose={() => setShowRequiredLocationModal(false)}
          />
        )}
      </>
    );
  }

  if (isNotEnoughUsers || (!profiles && !data?.final_winner)) {
    return (
      <>
        <EmptyState
          title="Дуэли еще не сформированы"
          description="Luvo — любовь ближе, чем ты думаешь"
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
        : profiles && (
            <DuelsBattleCards
              profiles={profiles}
              isLoading={isLoading}
              isBlocked={isBlocked}
              handleSelectAndVote={handleSelectAndVote}
            />
          )}

      <div className="pb-6 text-center">
        <button
          onClick={() => setShowHelpModal(true)}
          className="text-gray-400 text-sm underline hover:text-gray-600 transition block mx-auto"
        >
          Как это работает?
        </button>
      </div>

      {showHelpModal && <DuelsInformationModal onClose={handleOkHelp} />}

      {showRequiredLocationModal && (
        <LocationModal
          isRequired={true}
          onClose={() => setShowRequiredLocationModal(false)}
        />
      )}
    </div>
  );
};
