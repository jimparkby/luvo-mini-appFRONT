import { useState } from "react";
import { LocationModal } from "../location-modal";
import { useUserLocation } from "@/hooks/useUserLocation";

export const LocationDisplay = ({
  className = "",
  showIcon = true,
  variant = "button", // "button" | "text"
}) => {
  const [showModal, setShowModal] = useState(false);
  const { hasLocation, formattedLocation, isLoading } = useUserLocation();

  if (isLoading) {
    return (
      <span className={`text-gray-400 text-sm ${className}`}>Загрузка...</span>
    );
  }

  if (variant === "text") {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={`text-sm text-gray-600 hover:text-primary-red transition-colors flex items-center gap-1.5 ${className}`}
          aria-label={
            hasLocation
              ? `Изменить локацию: ${formattedLocation}`
              : "Установить локацию"
          }
        >
          {showIcon && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          )}
          {hasLocation && formattedLocation ? (
            <span>{formattedLocation}</span>
          ) : (
            <span className="text-gray-400">Установить локацию</span>
          )}
        </button>
        {showModal && <LocationModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  // Вариант button (по умолчанию)
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors ${className}`}
        aria-label={
          hasLocation
            ? `Изменить локацию: ${formattedLocation}`
            : "Установить локацию"
        }
      >
        {showIcon && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-shrink-0 text-primary-red"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        )}
        {hasLocation && formattedLocation ? (
          <span className="text-sm font-medium">{formattedLocation}</span>
        ) : (
          <span className="text-sm font-medium text-gray-500">
            Установить локацию
          </span>
        )}
      </button>
      {showModal && <LocationModal onClose={() => setShowModal(false)} />}
    </>
  );
};
