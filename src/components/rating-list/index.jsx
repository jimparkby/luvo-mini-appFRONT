import { useEffect, useState } from "react";
import { useWebAppStore } from "@/store";

import HeartIcon from "@/assets/icons/rating-heart.svg";
import { getStatusLabel } from "@/constants/status";

export const RatingList = ({ data }) => {
  const [currentUser, setCurrentUser] = useState();

  const { user } = useWebAppStore();

  const findCurrentUser = (users, currentUserId) => {
    return users.find((item) => item.id === currentUserId);
  };

  useEffect(() => {
    setCurrentUser(findCurrentUser(data, user.id));
  }, [data, user.id]);

  return (
    <div className="mt-10 w-full">
      {currentUser && (
        <div className="mt-3 first:mt-0 flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 flex items-center justify-center bg-[#F7FAFF] border-2 border-primary-gray/30 font-bold text-black rounded-xl">
              {data.findIndex((item) => item.user_id === currentUser.user_id) +
                1}
            </div>

            <img
              src={currentUser.photos && currentUser.photos[0]}
              alt="rating-image"
              className="ml-2 size-[60px] object-cover rounded-full"
            />

            <div className="ml-2 flex flex-col min-w-0 flex-1">
              <h4 className="font-bold text-base truncate">
                {currentUser.instagram_username}
              </h4>
              {currentUser.status && (
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {getStatusLabel(currentUser.status)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <h2 className="font-bold text-lg">{currentUser.likes_count}</h2>

            <img src={HeartIcon} alt="heart-icon" className="ml-2 size-5" />
          </div>
        </div>
      )}

      {data.map((item, index) => (
        <div
          key={item.user_id}
          className="mt-3 first:mt-0 flex items-center justify-between"
        >
          <div className="flex items-center">
            <div className="h-10 w-10 flex items-center justify-center bg-[#F7FAFF] border-2 border-primary-gray/30 font-bold text-black rounded-xl">
              {index + 1}
            </div>

            <img
              src={item.photos && item.photos[0]}
              alt="rating-image"
              className="ml-2 size-[60px] object-cover rounded-full"
            />

            <div className="ml-2 flex flex-col min-w-0 flex-1">
              <h4 className="font-bold text-base truncate">
                {item.instagram_username}
              </h4>
              {item.status && (
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {getStatusLabel(item.status)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <h2 className="font-bold text-lg">{item.likes_count}</h2>

            <img src={HeartIcon} alt="heart-icon" className="ml-2 size-5" />
          </div>
        </div>
      ))}
    </div>
  );
};
