import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Spinner, EmptyState } from "@/components";
import { useProfileViews } from "@/api/views";
import { calculateAge } from "@/utils/calculate-age.util";
import { timeAgo } from "@/utils/time-ago.util";

export const ProfileViewsPage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useProfileViews();

  const viewers = data?.viewers || [];

  const handleCopy = async (viewer) => {
    const username = viewer.telegram_username;
    if (!username) return;

    try {
      await navigator.clipboard.writeText(`@${username}`);
    } catch {
      // fallback
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-169px)] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-169px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigate(-1)}
          className="p-1 mr-3"
        >
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Просмотры профиля
        </h1>
      </div>

      {viewers.length === 0 ? (
        <EmptyState
          title="Пока никто не смотрел"
          description="Здесь появятся люди, которые заинтересовались вашим профилем"
        />
      ) : (
        <div className="flex flex-col">
          {viewers.map((viewer) => {
            const username = viewer.telegram_username;
            const age = viewer.birthdate ? calculateAge(viewer.birthdate) : null;

            return (
              <button
                key={viewer.user_id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800 transition-colors text-left"
                onClick={() => handleCopy(viewer)}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                  {viewer.photos?.[0] ? (
                    <img
                      src={viewer.photos[0]}
                      alt={username || viewer.first_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                      {(username || viewer.first_name)?.[0]}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {username ? `@${username}` : viewer.first_name}
                    </span>
                    {viewer.is_verified && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 48 48" className="flex-shrink-0">
                        <polygon fill="#42a5f5" points="29.62,3 33.053,8.308 39.367,8.624 39.686,14.937 44.997,18.367 42.116,23.995 45,29.62 39.692,33.053 39.376,39.367 33.063,39.686 29.633,44.997 24.005,42.116 18.38,45 14.947,39.692 8.633,39.376 8.314,33.063 3.003,29.633 5.884,24.005 3,18.38 8.308,14.947 8.624,8.633 14.937,8.314 18.367,3.003 23.995,5.884" />
                        <polygon fill="#fff" points="21.396,31.255 14.899,24.76 17.021,22.639 21.428,27.046 30.996,17.772 33.084,19.926" />
                      </svg>
                    )}
                    {age && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {age}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {viewer.viewed_at && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {timeAgo(viewer.viewed_at)}
                      </span>
                    )}
                  </div>
                </div>

              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
