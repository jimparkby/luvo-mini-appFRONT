import { useState, useEffect } from "react";

export const useUserLocation = () => {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем локацию из localStorage
  useEffect(() => {
    try {
      const savedLocation = localStorage.getItem("userLocation");
      if (savedLocation) {
        setLocation(JSON.parse(savedLocation));
      }
    } catch (error) {
      console.error("Ошибка при загрузке локации:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Метод для обновления локации
  const updateLocation = (newLocation) => {
    try {
      localStorage.setItem("userLocation", JSON.stringify(newLocation));
      setLocation(newLocation);
    } catch (error) {
      console.error("Ошибка при сохранении локации:", error);
    }
  };

  // Метод для удаления локации
  const clearLocation = () => {
    try {
      localStorage.removeItem("userLocation");
      setLocation(null);
    } catch (error) {
      console.error("Ошибка при удалении локации:", error);
    }
  };

  // Проверка, установлена ли локация
  const hasLocation = !!location && !!location.country && !!location.city;

  // Форматированная строка локации
  const formattedLocation = hasLocation
    ? location.district
      ? `${location.city} (${location.district}), ${location.countryName}`
      : `${location.city}, ${location.countryName}`
    : null;

  return {
    location,
    isLoading,
    hasLocation,
    formattedLocation,
    updateLocation,
    clearLocation,
  };
};
