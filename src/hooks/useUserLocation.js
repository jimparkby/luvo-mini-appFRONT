import { useState, useEffect } from "react";
import { useUser } from "@/api/user";

export const useUserLocation = () => {
  const [location, setLocation] = useState(null);
  const { data: userData, isLoading: isLoadingUser } = useUser();

  // Загружаем локацию из данных пользователя с бекенда (из /users/me)
  useEffect(() => {
    if (userData) {
      // Проверяем различные возможные форматы данных о локации
      const city = userData.city || userData.location?.city;
      const country = userData.country || userData.location?.country;
      const district = userData.district || userData.location?.district || null;
      const countryName =
        userData.countryName || userData.location?.countryName || country;

      // Если у пользователя есть локация в данных с бекенда
      if (country && city) {
        const locationData = {
          country,
          countryName: countryName || country,
          city,
          district,
          timestamp: new Date().toISOString(),
        };
        setLocation(locationData);
        // Сохраняем в localStorage для обратной совместимости
        try {
          localStorage.setItem("userLocation", JSON.stringify(locationData));
        } catch (error) {
          console.error("Ошибка при сохранении локации в localStorage:", error);
        }
      } else {
        // Если локации нет на бекенде, проверяем localStorage (для обратной совместимости)
        try {
          const savedLocation = localStorage.getItem("userLocation");
          if (savedLocation) {
            const parsedLocation = JSON.parse(savedLocation);
            setLocation(parsedLocation);
          } else {
            setLocation(null);
          }
        } catch (error) {
          console.error("Ошибка при загрузке локации из localStorage:", error);
          setLocation(null);
        }
      }
    } else if (!isLoadingUser) {
      // Если данные пользователя загружены, но их нет, проверяем localStorage
      try {
        const savedLocation = localStorage.getItem("userLocation");
        if (savedLocation) {
          const parsedLocation = JSON.parse(savedLocation);
          setLocation(parsedLocation);
        } else {
          setLocation(null);
        }
      } catch (error) {
        console.error("Ошибка при загрузке локации из localStorage:", error);
        setLocation(null);
      }
    }
  }, [userData, isLoadingUser]);

  // Метод для обновления локации
  const updateLocation = (newLocation) => {
    try {
      if (newLocation) {
        localStorage.setItem("userLocation", JSON.stringify(newLocation));
      } else {
        localStorage.removeItem("userLocation");
      }
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

  const isLoading = isLoadingUser;

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
    clearLocation,
    updateLocation,
    formattedLocation,
  };
};
