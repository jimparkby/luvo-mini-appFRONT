import { useState, useEffect, useRef } from "react";
import { Spinner } from "@/components";
import { YANDEX_MAPS_API_KEY } from "@/constants";
import { useUpdateUserLocation } from "@/api/locations";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";

export const LocationMapSelector = ({
  onSelect,
  onClose,
  initialCoords = null, // [lat, lng] или null
}) => {
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(
    initialCoords || [53.9045, 27.5615] // Минск по умолчанию
  );
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(
    !!initialCoords
  );

  const mapRef = useRef(null);

  const { mutateAsync: updateUserLocation } = useUpdateUserLocation();

  // Обратный геокодинг через встроенный API Яндекс Карт
  const geocode = async (coords) => {
    setIsLoadingAddress(true);

    try {
      // Используем встроенный геокодер Яндекс Карт (избегаем CORS)
      if (window.ymaps) {
        window.ymaps
          .geocode(coords)
          .then((res) => {
            const firstGeoObject = res.geoObjects.get(0);
            if (firstGeoObject) {
              const address = firstGeoObject.getAddressLine();
              setAddress(address);
            } else {
              setAddress("Адрес не найден, но координаты можно сохранить");
            }
            setIsLoadingAddress(false);
          })
          .catch((error) => {
            console.error("Ошибка геокодинга:", error);
            setAddress("Адрес не определен, но координаты можно сохранить");
            setIsLoadingAddress(false);
          });
      } else {
        // Fallback: если ymaps еще не загружен, используем HTTP API
        if (!YANDEX_MAPS_API_KEY) {
          setAddress("Адрес не доступен (API ключ не настроен)");
          setIsLoadingAddress(false);
          return;
        }

        const response = await fetch(
          `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_MAPS_API_KEY}&geocode=${coords[1]},${coords[0]}&format=json&lang=ru_RU`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data?.response?.GeoObjectCollection?.featureMember?.[0]) {
          const featureMember =
            data.response.GeoObjectCollection.featureMember[0];
          const address =
            featureMember.GeoObject.metaDataProperty.GeocoderMetaData.text;
          setAddress(address);
        } else {
          setAddress("Адрес не найден, но координаты можно сохранить");
        }
        setIsLoadingAddress(false);
      }
    } catch (error) {
      console.error("Ошибка геокодинга:", error);
      setAddress("Адрес не определен, но координаты можно сохранить");
      setIsLoadingAddress(false);
    }
  };

  // Обработка клика по карте
  const handleMapClick = (e) => {
    try {
      const coords = e.get("coords");
      console.log("Клик по карте, координаты:", coords);
      setSelectedCoords(coords);
      setHasSelectedLocation(true);
      // Запускаем геокодинг асинхронно, чтобы не блокировать UI
      geocode(coords);
    } catch (error) {
      console.error("Ошибка при обработке клика по карте:", error);
      setHasSelectedLocation(true); // Все равно помечаем, что локация выбрана
    }
  };

  // Обработка сохранения
  const handleSave = async () => {
    if (!selectedCoords || !hasSelectedLocation) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // Отправляем координаты на бэкенд
      // Бэкенд должен определить страну/город/район по координатам
      await updateUserLocation({
        latitude: selectedCoords[0],
        longitude: selectedCoords[1],
      });

      // Вызываем callback если передан
      if (onSelect) {
        onSelect({
          latitude: selectedCoords[0],
          longitude: selectedCoords[1],
          address: address,
        });
      }

      onClose();
    } catch (error) {
      console.error("Ошибка сохранения:", error);
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Не удалось сохранить локацию. Попробуйте еще раз.";

      // Показываем ошибку, но не блокируем интерфейс
      setSaveError(errorMessage);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Проверка API ключа при загрузке
  useEffect(() => {
    if (!YANDEX_MAPS_API_KEY) {
      console.warn("⚠️ YANDEX_MAPS_API_KEY не настроен в .env файле");
    } else {
      console.log(
        "✅ API ключ загружен:",
        YANDEX_MAPS_API_KEY.substring(0, 8) + "..."
      );
    }
  }, []);

  // Загружаем адрес при первой загрузке, если есть начальные координаты
  useEffect(() => {
    if (initialCoords) {
      // Ждем загрузки ymaps перед геокодингом
      if (window.ymaps) {
        window.ymaps.ready(() => {
          geocode(selectedCoords);
        });
      } else {
        geocode(selectedCoords);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-30 flex flex-col">
      {/* Заголовок */}
      <div className="bg-white dark:bg-black px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 z-10">
        <h2 className="text-lg font-bold">Выберите локацию на карте</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Карта */}
      <div className="flex-1 relative">
        {!hasSelectedLocation && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              👆 Нажмите на карту, чтобы выбрать локацию
            </p>
          </div>
        )}
        <YMaps query={{ apikey: YANDEX_MAPS_API_KEY, lang: "ru_RU" }}>
          <Map
            defaultState={{
              center: selectedCoords,
              zoom: 12,
            }}
            width="100%"
            height="100%"
            onClick={handleMapClick}
            instanceRef={mapRef}
          >
            {selectedCoords && hasSelectedLocation && (
              <Placemark
                geometry={selectedCoords}
                options={{
                  draggable: true,
                  iconLayout: "default#imageWithContent",
                  iconImageHref:
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiNGRjM0MzQiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSI0Ii8+Cjwvc3ZnPgo=",
                  iconImageSize: [40, 40],
                  iconImageOffset: [-20, -40],
                }}
                onDragStart={() => {
                  setHasSelectedLocation(true);
                }}
                onDragEnd={(e) => {
                  const coords = e.get("target").geometry.getCoordinates();
                  setSelectedCoords(coords);
                  geocode(coords);
                }}
              />
            )}
          </Map>
        </YMaps>
      </div>

      {/* Информация о выбранной локации */}
      <div className="bg-white dark:bg-black px-4 py-4 border-t border-gray-200 dark:border-gray-800 z-10">
        {isLoadingAddress ? (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
            <Spinner size="sm" />
            <span className="text-sm">Определение адреса...</span>
          </div>
        ) : hasSelectedLocation ? (
          <div className="mb-4 space-y-2">
            {selectedCoords && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Координаты:
                </p>
                <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {selectedCoords[0].toFixed(6)}, {selectedCoords[1].toFixed(6)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Адрес:
              </p>
              <p className="text-base font-medium dark:text-white">
                {address || "Определение адреса..."}
              </p>
            </div>
            {address && (address.includes("не") || address.includes("⚠️")) && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Адрес не определен, но вы можете сохранить координаты
              </p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              💡 Вы можете перетащить метку для более точного выбора
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Нажмите на карту, чтобы выбрать локацию
            </p>
          </div>
        )}

        {/* Сообщение об ошибке */}
        {saveError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {saveError}
            </p>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition font-medium"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!hasSelectedLocation || !selectedCoords || isSaving}
            className="flex-1 py-3 rounded-lg bg-primary-red hover:bg-primary-red/80 active:bg-primary-red/60 text-white transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Spinner size="sm" />
                <span>Сохранение...</span>
              </>
            ) : (
              "Сохранить"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
