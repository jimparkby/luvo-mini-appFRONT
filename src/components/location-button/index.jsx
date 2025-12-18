import { useState } from "react";
import { LocationModal } from "../location-modal";

export const LocationButton = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-5 z-50 w-14 h-14 bg-primary-red hover:bg-red-600 active:bg-red-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        aria-label="Изменить локацию"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="group-hover:scale-110 transition-transform duration-200"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </button>

      {showModal && <LocationModal onClose={() => setShowModal(false)} />}
    </>
  );
};
