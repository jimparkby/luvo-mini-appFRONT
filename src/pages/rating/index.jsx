import { useState } from "react";
import { useRating } from "@/api/rating";
import { Pedestal, RatingList, Spinner, EmptyState } from "@/components";
import { EmojiPickerSheet } from "@/components/emoji-picker-sheet";

export const RatingPage = () => {
  const [statusFilter, setStatusFilter] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { data, isLoading } = useRating(statusFilter);

  const sortByLikesDesc = (users) =>
    [...users].sort((a, b) => b.likes_count - a.likes_count);

  const handleEmojiSelect = (emoji) => {
    setStatusFilter(emoji || null);
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-169px)] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <EmptyState
        title="Пока нет рейтинга"
        description="Рейтинг появится, когда пользователи начнут получать лайки"
      />
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-169px)] flex flex-col items-center">
      <div className="container mx-auto max-w-md p-5 overflow-y-auto scrollbar-hidden">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-bold text-[32px]">Рейтинг</h1>

          <button
            onClick={() => setShowEmojiPicker(true)}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Фильтр по статусу"
          >
            {statusFilter ? (
              <span className="text-2xl leading-none">{statusFilter}</span>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="1.5"/>
                <circle cx="12" cy="12" r="1.5"/>
                <circle cx="12" cy="19" r="1.5"/>
              </svg>
            )}
            {statusFilter && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary-red rounded-full" />
            )}
          </button>
        </div>

        {data.length >= 4 && <Pedestal data={sortByLikesDesc(data)} />}

        <RatingList data={sortByLikesDesc(data)} />
      </div>

      <EmojiPickerSheet
        isOpen={showEmojiPicker}
        selected={statusFilter}
        onSelect={handleEmojiSelect}
        onClose={() => setShowEmojiPicker(false)}
      />
    </div>
  );
};
