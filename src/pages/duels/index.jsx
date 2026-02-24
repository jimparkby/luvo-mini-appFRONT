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
  DuelsBlockModal,
  DuelsBattleCards,
  DuelsInformationModal,
} from "@/components";

const DUELS_LIMIT = 15;
const DUELS_KEY = "luvo_duels_daily";

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function loadDailyCount() {
  try {
    const raw = localStorage.getItem(DUELS_KEY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    if (date === new Date().toDateString()) return count;
  } catch {}
  return 0;
}

function saveDailyCount(count) {
  localStorage.setItem(
    DUELS_KEY,
    JSON.stringify({ date: new Date().toDateString(), count })
  );
}

export const DuelsPage = () => {
  const [step, setStep] = useState(0);
  const [winnerId, setWinnerId] = useState(null);
  const [count, setCount] = useState(() => loadDailyCount());
  const [finalWinner, setFinalWinner] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showRequiredLocationModal, setShowRequiredLocationModal] =
    useState(false);

  const isBlocked = count >= DUELS_LIMIT;
  const limitUntil = getTomorrow();

  const { data, isLoading, error } = useDuelPair(winnerId, step, !isBlocked);
  const { data: userData, isLoading: isLoadingUser } = useUser();

  // Бэкенд требует country + city + district; проверяем country + city,
  // отсутствие district покрывается ошибкой 400 → открываем LocationModal
  const hasLocation =
    userData &&
    (userData.country || userData.location?.country) &&
    (userData.city || userData.location?.city);

  const isLocationError =
    error?.response?.status === 400 ||
    error?.response?.data?.detail ===
      "Для участия в батлах нужно выбрать локацию";

  const isNotEnoughUsers =
    error?.response?.data?.detail === "Недостаточно пользователей";

  // profiles: бэкенд возвращает { user, opponent }, приводим к массиву
  const profiles = data ? [data.user, data.opponent] : null;

  useEffect(() => {
    const hasSeen = localStorage.getItem("duelsHelpStatus");
    if (!hasSeen) setShowHelpModal(true);
  }, []);

  // Показываем LocationModal если нет базовой локации
  useEffect(() => {
    if (!isLoadingUser && !hasLocation) {
      setShowRequiredLocationModal(true);
    } else if (hasLocation && showRequiredLocationModal) {
      setShowRequiredLocationModal(false);
    }
  }, [isLoadingUser, hasLocation, showRequiredLocationModal]);

  // Показываем LocationModal при ошибке 400 от бэкенда (нет района)
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

  const handleSelectAndVote = (selectedId) => {
    if (isLoading || isBlocked) return;

    const nextCount = count + 1;
    saveDailyCount(nextCount);
    setCount(nextCount);

    // Сохраняем финального победителя при достижении лимита
    if (nextCount >= DUELS_LIMIT && data) {
      const winner =
        data.user?.user_id === selectedId ? data.user : data.opponent;
      setFinalWinner(winner);
    }

    setStep((s) => s + 1);
    setWinnerId(selectedId);
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

  if (isNotEnoughUsers || (!profiles && !isBlocked && !isLocationError)) {
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
      <DuelProgressBar duelsCount={count} />

      {isBlocked ? (
        finalWinner && <DuelsWinnerCard winner={finalWinner} />
      ) : (
        profiles && (
          <DuelsBattleCards
            profiles={profiles}
            isLoading={isLoading}
            isBlocked={false}
            handleSelectAndVote={handleSelectAndVote}
          />
        )
      )}

      <div className="pb-6 text-center">
        <button
          onClick={() => setShowHelpModal(true)}
          className="text-gray-400 text-sm underline hover:text-gray-600 transition block mx-auto"
        >
          Как это работает?
        </button>
      </div>

      {isBlocked && <DuelsBlockModal limitUntil={limitUntil} />}

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
