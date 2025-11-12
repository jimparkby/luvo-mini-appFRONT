import { useState } from "react";
import { useOtherUser } from "@/api/user";
import { useParams, useSearchParams } from "react-router-dom";
import { OtherProfileCard, Spinner, MetchModal } from "@/components";

import TelegramIcon from "@/assets/images/telegram.png";
import InstagramIcon from "@/assets/images/instagram.png";

export const OtherProfilePage = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [viewed, setViewed] = useState(false);

  const { data, isLoading } = useOtherUser(params.id);
  const isMetch = searchParams.get("isMetch") === "true";

  const calculateAge = (birthDateStr) => {
    const today = new Date();
    const birthDate = new Date(birthDateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const isBirthdayPassed =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());
    return isBirthdayPassed ? age : age - 1;
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-169px)] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const onCloseModal = () => {
    setIsOpen(false);
  };

  return (
    <div className="w-full p-5 min-h-[calc(100vh-169px)] overflow-y-auto scrollbar-hidden">
      <OtherProfileCard card={data} viewed={viewed} setViewed={setViewed} />

      <div className="mt-10">
        <h2 className="font-bold text-2xl">
          {data.first_name}, {calculateAge(data.birthdate)}
        </h2>

        {data.about && <div className="mt-3 text-base">{data.about}</div>}
      </div>

      <div className="mt-10">
        {data.instagram_username && (
          <div className="flex">
            <img src={InstagramIcon} alt="instagram-icon" className="size-8" />

            <div className="ml-2 font-bold text-2xl">
              @{data.instagram_username}
            </div>
          </div>
        )}

        {isMetch && data.telegram_username && (
          <div className="mt-3 flex">
            <img src={TelegramIcon} alt="telegram-icon" className="size-8" />

            <div className="ml-2 font-bold text-2xl">
              @{data.telegram_username}
            </div>
          </div>
        )}
      </div>

      {isOpen && <MetchModal isOpen={isOpen} onClose={onCloseModal} />}
    </div>
  );
};
