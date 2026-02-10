import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { Spinner, ProfileForm } from "@/components";
import { useUser, useUserPhotos } from "@/api/user";
import { useProfileViews } from "@/api/views";

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { data: userData, isLoading: userIsLoading } = useUser();
  const { data: userPhotosData, isLoading: userPhotosIsLoading } =
    useUserPhotos();
  const { data: viewsData } = useProfileViews();

  const viewsCount = viewsData?.total_count || 0;

  if (userIsLoading || userPhotosIsLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-169px)] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-169px)] flex flex-col items-center relative">
      {/* Profile Views Button */}
      <button
        onClick={() => navigate("/profile-views")}
        className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-2 rounded-full bg-gray-100 dark:bg-gray-800 active:scale-95 transition-transform"
      >
        <Eye className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {viewsCount > 0 && (
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {viewsCount}
          </span>
        )}
      </button>

      <ProfileForm userData={userData} userPhotosData={userPhotosData} />
    </div>
  );
};
