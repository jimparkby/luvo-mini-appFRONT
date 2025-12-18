import { useState, useEffect } from "react";
import { useUserLocation } from "@/hooks/useUserLocation";

// Данные стран и городов
const COUNTRIES = [
  { id: "by", name: "Беларусь" },
  { id: "ru", name: "Россия" },
];

const CITIES_BY_COUNTRY = {
  ru: [
    "Москва",
    "Санкт-Петербург",
    "Новосибирск",
    "Екатеринбург",
    "Казань",
    "Нижний Новгород",
    "Челябинск",
    "Самара",
    "Омск",
    "Ростов-на-Дону",
    "Уфа",
    "Красноярск",
    "Воронеж",
    "Пермь",
    "Волгоград",
  ],
  by: ["Минск", "Гомель", "Могилёв", "Витебск", "Гродно", "Брест"],
};

// Районы Минска
const MINSK_DISTRICTS = [
  "Центральный",
  "Советский",
  "Первомайский",
  "Партизанский",
  "Заводской",
  "Ленинский",
  "Октябрьский",
  "Московский",
  "Фрунзенский",
];

// Районы Москвы
const MOSCOW_DISTRICTS = [
  "Центральный",
  "Северный",
  "Северо-Восточный",
  "Восточный",
  "Юго-Восточный",
  "Южный",
  "Юго-Западный",
  "Западный",
  "Северо-Западный",
  "Зеленоградский",
  "Новомосковский",
  "Троицкий",
];

export const LocationModal = ({ onClose, isRequired = false }) => {
  const { location, hasLocation, formattedLocation } = useUserLocation();
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [availableCities, setAvailableCities] = useState([]);

  // Загружаем сохраненные данные при открытии
  useEffect(() => {
    if (location) {
      setCountry(location.country || "");
      setCity(location.city || "");
      setDistrict(location.district || "");
      if (location.country) {
        setAvailableCities(CITIES_BY_COUNTRY[location.country] || []);
      }
    }
  }, [location]);

  // Обновляем список городов при смене страны
  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    setCountry(selectedCountry);
    setCity(""); // Сбрасываем город при смене страны
    setDistrict(""); // Сбрасываем район при смене страны
    setAvailableCities(CITIES_BY_COUNTRY[selectedCountry] || []);
  };

  // Обработчик смены города
  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    setCity(selectedCity);
    setDistrict(""); // Сбрасываем район при смене города
  };

  const handleSave = () => {
    // Валидация
    if (!country || !city) {
      alert("Пожалуйста, выберите страну и город");
      return;
    }

    // Для Минска обязательно выбрать район
    if (country === "by" && city === "Минск" && !district) {
      alert("Пожалуйста, выберите район Минска");
      return;
    }

    // Для Москвы обязательно выбрать округ
    if (country === "ru" && city === "Москва" && !district) {
      alert("Пожалуйста, выберите округ Москвы");
      return;
    }

    const countryName = COUNTRIES.find((c) => c.id === country)?.name || "";
    const locationData = {
      country,
      countryName,
      city,
      district: district || null,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("userLocation", JSON.stringify(locationData));
    onClose();
  };

  const handleClear = () => {
    localStorage.removeItem("userLocation");
    setCountry("");
    setCity("");
    setDistrict("");
    setAvailableCities([]);
  };

  // Показывать ли кнопку закрытия
  const showCloseButton = !isRequired;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[5] p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {isRequired ? "Настройка локации" : "Выберите локацию"}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition text-2xl leading-none"
            >
              ×
            </button>
          )}
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">
            {isRequired
              ? "Для продолжения укажите свою страну и город"
              : "Укажите свою страну и город, чтобы находить людей поблизости"}
          </p>
          {hasLocation && !isRequired && (
            <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
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
                className="text-primary-red flex-shrink-0"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-gray-700 font-medium">
                Текущая: {formattedLocation}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-6">
          {/* Выбор страны */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Страна
            </label>
            <select
              value={country}
              onChange={handleCountryChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-red focus:outline-none transition"
            >
              <option value="">Выберите страну</option>
              {COUNTRIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Выбор города */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Город
            </label>
            <select
              value={city}
              onChange={handleCityChange}
              disabled={!country}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-red focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {country ? "Выберите город" : "Сначала выберите страну"}
              </option>
              {availableCities.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
            </select>
          </div>

          {/* Выбор района для Минска */}
          {country === "by" && city === "Минск" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Район
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-red focus:outline-none transition"
              >
                <option value="">Выберите район</option>
                {MINSK_DISTRICTS.map((districtName) => (
                  <option key={districtName} value={districtName}>
                    {districtName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Выбор округа для Москвы */}
          {country === "ru" && city === "Москва" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Округ
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-red focus:outline-none transition"
              >
                <option value="">Выберите округ</option>
                {MOSCOW_DISTRICTS.map((districtName) => (
                  <option key={districtName} value={districtName}>
                    {districtName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex gap-3">
          {!isRequired && (
            <button
              onClick={handleClear}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Очистить
            </button>
          )}
          <button
            onClick={handleSave}
            className={`${
              isRequired ? "w-full" : "flex-1"
            } bg-primary-red text-white py-3 rounded-lg hover:bg-red-600 transition font-medium`}
          >
            {isRequired ? "Продолжить" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
};
