import { useState, useEffect, useMemo } from "react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { Spinner } from "@/components";
import { yupResolver } from "@hookform/resolvers/yup";
import { useUser } from "@/api/user";
import {
  useCities,
  useCountries,
  useDistricts,
  useUpdateUserLocation,
} from "@/api/locations";

export const LocationModal = ({ onClose, isRequired = false }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: userData, isLoading: isLoadingUser } = useUser();

  // Получаем данные о локации из данных пользователя
  const userLocation = useMemo(() => {
    if (!userData) return null;
    return {
      country: userData.country || userData.location?.country,
      city: userData.city || userData.location?.city,
      district: userData.district || userData.location?.district,
    };
  }, [userData]);

  // Базовая схема валидации
  const baseSchema = yup.object({
    country: yup.string().required("Выберите страну"),
    city: yup.string().required("Выберите город"),
    district: yup.string(),
  });

  const {
    watch,
    reset,
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(baseSchema),
    mode: "onChange",
    defaultValues: {
      country: "",
      city: "",
      district: "",
    },
  });

  const country = watch("country");
  const city = watch("city");

  const { data: cities = [], isLoading: isLoadingCities } = useCities(country);
  const { data: countries = [], isLoading: isLoadingCountries } =
    useCountries();
  const { data: districts = [], isLoading: isLoadingDistricts } = useDistricts(
    country,
    city
  );

  const { mutateAsync: updateUserLocation } = useUpdateUserLocation();

  // Инициализация формы данными пользователя при загрузке
  useEffect(() => {
    if (isInitialized || isLoadingUser || isLoadingCountries) return;

    if (userLocation?.country && userLocation?.city && countries.length > 0) {
      // Находим страну в списке
      const matchedCountry = countries.find((countryName) => {
        const countryValue =
          typeof countryName === "string" ? countryName : countryName.name;
        return countryValue === userLocation.country;
      });

      if (matchedCountry) {
        const countryToSet =
          typeof matchedCountry === "string"
            ? matchedCountry
            : matchedCountry.name;

        reset({
          country: countryToSet,
          city: userLocation.city || "",
          district: userLocation.district || "",
        });
      }
    }
    setIsInitialized(true);
  }, [
    userLocation,
    countries,
    isLoadingUser,
    isLoadingCountries,
    reset,
    isInitialized,
  ]);

  // Сбрасываем город и район при смене страны пользователем
  useEffect(() => {
    if (!isInitialized || !country) return;

    const currentCity = watch("city");
    const currentDistrict = watch("district");

    // Если это сохраненная локация, не сбрасываем
    if (userLocation?.country === country) return;

    // Если страна изменилась пользователем, сбрасываем город и район
    if (currentCity) setValue("city", "", { shouldValidate: false });
    if (currentDistrict) setValue("district", "", { shouldValidate: false });
  }, [country, userLocation, watch, setValue, isInitialized]);

  // Сбрасываем район при смене города пользователем
  useEffect(() => {
    if (!isInitialized || !city) return;

    // Если это сохраненная локация, не сбрасываем
    if (userLocation?.city === city) return;

    const currentDistrict = watch("district");
    if (currentDistrict) {
      setValue("district", "", { shouldValidate: false });
    }
  }, [city, userLocation, watch, setValue, isInitialized]);

  const onSubmit = async (data) => {
    try {
      setIsSaving(true);
      setSaveError(null);

      const locationData = {
        country: data.country,
        city: data.city,
        district: districts.length > 0 ? data.district : null,
      };

      await updateUserLocation(locationData);
      onClose();
    } catch (error) {
      console.error("Ошибка при сохранении локации:", error);
      setSaveError(
        error?.response?.data?.detail ||
          "Не удалось сохранить локацию. Попробуйте еще раз."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[5] p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {isRequired ? "Настройка локации" : "Выберите локацию"}
            </h2>

            {!isRequired && (
              <button
                type="button"
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
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Страна
              </label>

              <div className="relative">
                <select
                  {...register("country")}
                  disabled={isLoadingCountries}
                  className={`w-full py-[18px] px-4 pr-12 rounded-[30px] leading-5 text-xl border-2 ${
                    errors.country
                      ? "border-light-red"
                      : "border-primary-gray/30"
                  } bg-gray-light text-black dark:bg-transparent dark:text-white focus:border-primary-red focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer`}
                >
                  <option value="">
                    {isLoadingCountries ? "Загрузка..." : "Выберите страну"}
                  </option>

                  {countries.map((countryName) => {
                    const countryValue =
                      typeof countryName === "string"
                        ? countryName
                        : countryName.name;
                    const countryId =
                      typeof countryName === "string"
                        ? countryName
                        : countryName.id || countryName.name;
                    return (
                      <option key={countryId} value={countryValue}>
                        {countryValue}
                      </option>
                    );
                  })}
                </select>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
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
                    className="text-gray-500"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>

              {errors.country && (
                <p className="mt-2 font-semibold text-light-red text-sm">
                  {errors.country.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Город
              </label>

              <div className="relative">
                <select
                  {...register("city")}
                  disabled={!country || isLoadingCities}
                  className={`w-full py-[18px] px-4 pr-12 rounded-[30px] leading-5 text-xl border-2 ${
                    errors.city ? "border-light-red" : "border-primary-gray/30"
                  } bg-gray-light text-black dark:bg-transparent dark:text-white focus:border-primary-red focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer`}
                >
                  <option value="">
                    {isLoadingCities
                      ? "Загрузка..."
                      : country
                      ? "Выберите город"
                      : "Сначала выберите страну"}
                  </option>

                  {cities.map((cityName) => {
                    const cityValue =
                      typeof cityName === "string" ? cityName : cityName.name;
                    return (
                      <option key={cityValue} value={cityValue}>
                        {cityValue}
                      </option>
                    );
                  })}
                </select>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
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
                    className="text-gray-500"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>

              {errors.city && (
                <p className="mt-2 font-semibold text-light-red text-sm">
                  {errors.city.message}
                </p>
              )}
            </div>

            {/* Выбор района (если доступны районы для выбранного города) */}
            {districts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Район
                </label>

                <div className="relative">
                  <select
                    {...register("district", {
                      validate: (value) => {
                        if (districts.length > 0 && !value) {
                          return "Выберите район";
                        }
                        return true;
                      },
                    })}
                    disabled={isLoadingDistricts}
                    className={`w-full py-[18px] px-4 pr-12 rounded-[30px] leading-5 text-xl border-2 ${
                      errors.district
                        ? "border-light-red"
                        : "border-primary-gray/30"
                    } bg-gray-light text-black dark:bg-transparent dark:text-white focus:border-primary-red focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer`}
                  >
                    <option value="">
                      {isLoadingDistricts ? "Загрузка..." : "Выберите район"}
                    </option>

                    {districts.map((districtName) => {
                      const districtValue =
                        typeof districtName === "string"
                          ? districtName
                          : districtName.name;
                      return (
                        <option key={districtValue} value={districtValue}>
                          {districtValue}
                        </option>
                      );
                    })}
                  </select>

                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
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
                      className="text-gray-500"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                {errors.district && districts.length > 0 && (
                  <p className="mt-2 font-semibold text-light-red text-sm">
                    {typeof errors.district.message === "string"
                      ? errors.district.message
                      : typeof errors.district === "string"
                      ? errors.district
                      : "Выберите район"}
                  </p>
                )}
              </div>
            )}
          </div>

          {saveError && (
            <div className="mb-4 p-3 bg-red-50 border border-light-red rounded-lg">
              <p className="text-sm font-semibold text-light-red">
                {saveError}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className={`${
                isRequired ? "w-full" : "flex-1"
              } bg-primary-red text-white py-3 rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isSaving ? (
                <>
                  <Spinner size="sm" />
                  <span>Сохранение...</span>
                </>
              ) : isRequired ? (
                "Продолжить"
              ) : (
                "Сохранить"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
