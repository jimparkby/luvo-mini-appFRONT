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
  const [step, setStep] = useState(null);
  const [winnerId, setWinnerId] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showRequiredLocationModal, setShowRequiredLocationModal] =
    useState(false);

  const { data, isLoading, error } = useDuelPair(winnerId, step);
  const { data: userData, isLoading: isLoadingUser } = useUser();

  // Проверяем наличие локации у пользователя
  const hasLocation =
    userData &&
    (userData.country || userData.location?.country) &&
    (userData.city || userData.location?.city);

  const duelsCount = data?.stage || 0;
  const isBlocked = !!data?.final_winner; // Блокируем когда есть победитель

  // Проверяем ошибку "Недостаточно пользователей"
  const isNotEnoughUsers =
    error?.response?.data?.detail === "Недостаточно пользователей";

  useEffect(() => {
    const hasSeen = localStorage.getItem("duelsHelpStatus");
    if (!hasSeen) setShowHelpModal(true);
  }, []);

  // Показываем обязательную модалку локации если локация не указана
  useEffect(() => {
    if (!isLoadingUser && !hasLocation) {
      setShowRequiredLocationModal(true);
    } else if (hasLocation && showRequiredLocationModal) {
      // Закрываем модалку, если локация появилась
      setShowRequiredLocationModal(false);
    }
  }, [isLoadingUser, hasLocation, showRequiredLocationModal]);

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

  // Показываем пустой стейт при ошибке "Недостаточно пользователей" или когда нет данных
  if (isNotEnoughUsers || (!data?.profiles && !data?.final_winner)) {
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
        : data?.profiles && (
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
