import { useState, useEffect } from "react";
import { useRating } from "@/api/rating";
import { Pedestal, RatingList, Spinner, EmptyState } from "@/components";
import { STATUS_OPTIONS } from "@/constants/status";

export const RatingPage = () => {
  const [statusFilter, setStatusFilter] = useState(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const { data, isLoading } = useRating(statusFilter);

  const sortByLikesDesc = (users) =>
    [...users].sort((a, b) => b.likes_count - a.likes_count);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showFilterMenu && !e.target.closest('.relative')) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showFilterMenu]);

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

          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Фильтр по статусу"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="1.5"/>
                <circle cx="12" cy="12" r="1.5"/>
                <circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-black rounded-2xl shadow-lg border-2 border-primary-gray/30 py-2 min-w-[200px] z-10">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setStatusFilter(option.value || null);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                      statusFilter === option.value ? 'bg-gray-100 dark:bg-gray-700 font-bold' : ''
                    }`}
                  >
                    {option.emoji && `${option.emoji} `}{option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {data.length >= 4 && <Pedestal data={sortByLikesDesc(data)} />}

        <RatingList data={sortByLikesDesc(data)} />
      </div>
    </div>
  );
};
