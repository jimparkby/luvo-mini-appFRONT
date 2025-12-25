import { useState } from "react";
import { useLocation } from "react-router-dom";
import { LocationModal } from "../location-modal";
import { useUserLocation } from "@/hooks/useUserLocation";

export const LocationButton = () => {
  const [showModal, setShowModal] = useState(false);

  const location = useLocation();
  const { hasLocation, formattedLocation } = useUserLocation();

  if (location.pathname !== "/duels") {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-5 z-[100] bg-primary-red hover:bg-red-600 active:bg-red-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group px-4 py-3 max-w-[calc(100vw-2.5rem)]"
        aria-label={
          hasLocation
            ? `Изменить локацию: ${formattedLocation}`
            : "Установить локацию"
        }
        style={{ pointerEvents: "auto" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>

        {hasLocation && formattedLocation && (
          <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
            {formattedLocation}
          </span>
        )}

        {!hasLocation && (
          <span className="text-sm font-medium whitespace-nowrap">
            Установить локацию
          </span>
        )}
      </button>

      {showModal && <LocationModal onClose={() => setShowModal(false)} />}
    </>
  );
};
