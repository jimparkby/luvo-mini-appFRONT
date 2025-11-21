import { DuelCard } from "./duel-card";

export const DuelsBattleCards = ({
  profiles,
  isLoading,
  isBlocked = false,
  handleSelectAndVote,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-4 overflow-hidden flex-1 ${
        isBlocked ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      <DuelCard
        user={profiles[0]}
        onSelect={handleSelectAndVote}
        disabled={isLoading || isBlocked}
      />

      <DuelCard
        user={profiles[1]}
        onSelect={handleSelectAndVote}
        disabled={isLoading || isBlocked}
      />
    </div>
  );
};
