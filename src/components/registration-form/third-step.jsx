import { useState, useEffect } from "react";
import { Button } from "@/ui";
import { Spinner } from "@/components";
import { useNavigate } from "react-router-dom";
import { useBiometric } from "@/hooks/useBiometric";

import CameraIcon from "@/assets/icons/camera.svg";

export const ThirdStep = ({
  errors,
  preview,
  setValue,
  register,
  isLoading,
  genericError,
  setGenericError,
}) => {
  const navigate = useNavigate();
  const { isAvailable, biometricType, requestAccess, authenticate, reinitialize } = useBiometric();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'error', null
  const [isReinitializing, setIsReinitializing] = useState(false);

  // Если биометрия недоступна, автоматически пропускаем верификацию
  useEffect(() => {
    console.log("ThirdStep: isAvailable =", isAvailable, "biometricType =", biometricType);
    if (!isAvailable) {
      console.log("Биометрия недоступна, автоматически пропускаем верификацию");
      setValue("biometricVerified", true, { shouldValidate: true });
    }
  }, [isAvailable, setValue, biometricType]);

  const handleFaceIDVerification = async () => {
    setIsVerifying(true);
    setVerificationStatus(null);

    try {
      // Запрашиваем доступ к биометрии
      await requestAccess("Подтвердите, что вы реальный человек");

      // Выполняем аутентификацию
      const result = await authenticate("Верификация для регистрации");

      if (result.success) {
        setVerificationStatus("success");
        setValue("biometricVerified", true, { shouldValidate: true });
      } else {
        setVerificationStatus("error");
        setGenericError?.("Верификация не прошла. Попробуйте снова.");
      }
    } catch (error) {
      console.error("Ошибка верификации Face ID:", error);
      setVerificationStatus("error");
      setGenericError?.(error.message || "Не удалось выполнить верификацию");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReinitialize = async () => {
    setIsReinitializing(true);
    console.log("Попытка реинициализации биометрии...");
    const success = await reinitialize();
    setIsReinitializing(false);

    if (success) {
      console.log("Реинициализация успешна!");
    } else {
      console.log("Реинициализация не помогла");
    }
  };

  return (
    <>
      <h2 className="text-[32px] font-bold">Выберите фото</h2>

      <div className="mt-10 w-full aspect-square mx-auto flex items-center justify-center border-4 border-primary-gray/30 bg-gray-light rounded-[20px] relative">
        <input
          type="file"
          accept="image/*"
          multiple={false}
          className="absolute inset-0 opacity-0 cursor-pointer rounded-[20px]"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (!file.type.startsWith("image/")) {
                setGenericError("Пожалуйста, выберите изображение");
                return;
              }
              setValue("file", file, { shouldValidate: true });
            }
          }}
        />

        {preview ? (
          <img
            src={preview}
            alt="preview"
            className="object-cover w-full h-full rounded-[20px]"
          />
        ) : (
          <img src={CameraIcon} alt="camera-icon" className="size-[130px]" />
        )}
      </div>

      {errors.file && (
        <p className="mt-2 text-light-red text-sm">{errors.file.message}</p>
      )}

      {genericError && (
        <div className="mt-4 w-full p-4 border-2 border-primary-gray/30 dark:border-white/70 bg-gray-light dark:bg-transparent rounded-2xl font-semibold text-light-red">
          {genericError}
        </div>
      )}

      {/* Face ID / Touch ID верификация */}
      {isAvailable && (
        <div className="mt-4">
          <input
            type="hidden"
            {...register("biometricVerified")}
          />

          <div className="mb-2">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              Подтвердите, что вы реальный человек
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Это помогает нам защитить сообщество от ботов и ИИ
            </div>
          </div>

          <Button
            type="button"
            onClick={handleFaceIDVerification}
            disabled={isVerifying || verificationStatus === "success"}
            className={`w-full ${
              verificationStatus === "success"
                ? "bg-green-600 hover:bg-green-600"
                : verificationStatus === "error"
                ? "bg-red-600 hover:bg-red-600"
                : ""
            }`}
          >
            {isVerifying ? (
              <Spinner size="sm" />
            ) : verificationStatus === "success" ? (
              <>
                <svg
                  className="w-5 h-5 mr-2 inline"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Верификация успешна
              </>
            ) : (
              <>
                Верифицировать через{" "}
                {biometricType === "face"
                  ? "Face ID"
                  : biometricType === "finger"
                  ? "Touch ID"
                  : "биометрию"}
              </>
            )}
          </Button>

          {errors.biometricVerified && (
            <p className="mt-2 text-light-red text-sm">
              {errors.biometricVerified.message}
            </p>
          )}
        </div>
      )}

      {!isAvailable && (
        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
          <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-1">
            Биометрическая верификация недоступна на вашем устройстве. Регистрация будет продолжена без неё.
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
            Возможные причины: устройство не поддерживает Face ID/Touch ID, или требуется обновление Telegram до версии 7.2+
          </p>
          <button
            type="button"
            onClick={handleReinitialize}
            disabled={isReinitializing}
            className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 underline hover:no-underline disabled:opacity-50"
          >
            {isReinitializing ? "Проверка..." : "Попробовать снова"}
          </button>
        </div>
      )}

      <div className="mt-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            {...register("privacyAccepted")}
            className="hidden peer"
          />

          <div className="mt-1 w-5 h-5 flex items-center justify-center rounded border-2 border-gray-400 peer-checked:border-primary-red peer-checked:bg-primary-red transition-all flex-shrink-0">
            <svg
              className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <span className="text-sm text-gray-700 dark:text-gray-300">
            Я согласен с{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                navigate("/privacy-policy");
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              политикой конфиденциальности
            </button>
          </span>
        </label>

        {errors.privacyAccepted && (
          <p className="mt-2 text-light-red text-sm">
            {errors.privacyAccepted.message}
          </p>
        )}
      </div>

      <Button className="mt-3 w-full" type="submit">
        {!isLoading ? "Завершить" : <Spinner size="sm" />}
      </Button>
    </>
  );
};
