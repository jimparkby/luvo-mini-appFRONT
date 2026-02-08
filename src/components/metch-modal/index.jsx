import { useEffect, useCallback } from "react";
import classnames from "classnames";
import { Button } from "@/ui";
import { calculateAge } from "@/utils/calculate-age.util";

export const MetchModal = ({ isOpen, onClose, className, matchedUser }) => {
  const handleEscape = useCallback(
    (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    },
    [onClose]
  );

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-end z-20 bg-[#232323]/50"
      onClick={handleBackdropClick}
    >
      <div
        className={classnames(
          "fixed left-1/2 bottom-0 -translate-x-1/2 overflow-y-auto scrollbar-hidden w-full py-6 px-5 rounded-t-[28px] bg-[#F9FBFA] dark:bg-black text-center",
          className
        )}
      >
        <h3 className="font-bold text-xl">💌 У вас взаимная симпатия!</h3>

        <h1 className="mt-5 font-bold text-[32px]">
          {matchedUser?.first_name || "Пользователь"}
          {matchedUser?.birthdate && `, ${calculateAge(matchedUser.birthdate)}`}
        </h1>

        <Button className="mt-5 w-full" onClick={onClose}>
          Супер!
        </Button>
      </div>
    </div>
  );
};
