import { useState, useEffect } from "react";
import { Button } from "@/ui";
import { Spinner } from "@/components";
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
  onBack,
  onNext,
}) => {
  const { isAvailable, biometricType, requestAccess, authenticate, reinitialize } = useBiometric();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'error', null
  const [isReinitializing, setIsReinitializing] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isPrivacyAccepted, setIsPrivacyAccepted] = useState(false);

  // Если биометрия недоступна, автоматически пропускаем верификацию
  useEffect(() => {
    console.log("ThirdStep: isAvailable =", isAvailable, "biometricType =", biometricType);
    if (!isAvailable) {
      console.log("Биометрия недоступна, автоматически пропускаем верификацию");
      setValue("biometricVerified", true, { shouldValidate: true });
    }
  }, [isAvailable, setValue, biometricType]);

  // Автоматически переходим на следующий шаг после успешной верификации
  useEffect(() => {
    if (verificationStatus === "success" && onNext) {
      const timer = setTimeout(() => {
        onNext();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [verificationStatus, onNext]);

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
      <h2 className="text-[32px] font-bold mt-6">Выберите фото</h2>

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

      <input
        type="hidden"
        {...register("biometricVerified")}
      />

      <div className="mt-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            {...register("privacyAccepted")}
            className="hidden"
            onChange={(e) => {
              setIsPrivacyAccepted(e.target.checked);
              setValue("privacyAccepted", e.target.checked, { shouldValidate: true });
            }}
          />

          <div className={`mt-1 w-5 h-5 flex items-center justify-center rounded border-2 transition-all flex-shrink-0 ${isPrivacyAccepted ? 'border-primary-red bg-primary-red' : 'border-gray-400'}`}>
            <svg
              className={`w-3 h-3 text-white transition-opacity ${isPrivacyAccepted ? 'opacity-100' : 'opacity-0'}`}
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
                setShowPrivacyModal(true);
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

      <div className="mt-6">
        <div className="mb-3 text-center">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
            Подтвердите, что вы реальный человек
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Это помогает нам защитить сообщество от ботов и ИИ
          </div>
        </div>

        {isAvailable ? (
          <Button
            type="button"
            onClick={async () => {
              if (verificationStatus !== "success") {
                await handleFaceIDVerification();
              }
            }}
            disabled={isVerifying || isLoading}
            className={`w-full ${
              verificationStatus === "success"
                ? "bg-green-600 hover:bg-green-600"
                : verificationStatus === "error"
                ? "bg-red-600 hover:bg-red-600"
                : ""
            }`}
          >
            {isVerifying || isLoading ? (
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
              biometricType === "face" ? "Face ID" : biometricType === "finger" ? "Touch ID" : "Биометрия"
            )}
          </Button>
        ) : (
          <>
            <div className="mb-3 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-1">
                Биометрическая верификация недоступна на вашем устройстве. Регистрация будет продолжена без неё.
              </p>
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {!isLoading ? "Завершить" : <Spinner size="sm" />}
            </Button>
          </>
        )}

        {isAvailable && errors.biometricVerified && (
          <p className="mt-2 text-light-red text-sm">
            {errors.biometricVerified.message}
          </p>
        )}
      </div>

      {/* Модальное окно политики конфиденциальности */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative w-full h-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg overflow-hidden flex flex-col">
            {/* Заголовок модального окна с кнопкой назад */}
            <div className="flex items-center p-4 pt-20 border-b border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Назад
              </button>
            </div>

            {/* Контент политики */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-8">
                <p>Дата вступления в силу: 13 августа 2025 г.</p>
                <p>Последнее обновление: 13 августа 2025 г.</p>
              </div>

              <div className="space-y-6 text-gray-700 dark:text-gray-300 text-sm">
                <p>
                  Настоящая Политика конфиденциальности (далее — «Политика») регулирует порядок обработки и защиты персональных данных пользователей, осуществляемую LUVO (далее — «Сервис»), при использовании Telegram-миниприложения LUVO.
                </p>

                <p className="font-medium">
                  Используя Сервис, вы выражаете согласие с условиями настоящей Политики.
                </p>

                <section className="mt-8">
                  <h3 className="font-bold text-base mb-4">1. Термины и определения</h3>
                  <ul className="list-none space-y-2">
                    <li>
                      <strong>Сервис</strong> — Telegram-миниприложение LUVO, доступное пользователям Telegram.
                    </li>
                    <li>
                      <strong>Пользователь</strong> — физическое лицо, использующее Сервис.
                    </li>
                    <li>
                      <strong>Персональные данные</strong> — информация, относящаяся к прямо или косвенно определённому Пользователю.
                    </li>
                  </ul>
                </section>

                <section className="mt-8">
                  <h3 className="font-bold text-base mb-4">2. Обрабатываемые данные</h3>
                  <p className="mb-3">
                    Сервис может обрабатывать следующие категории данных:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Telegram-идентификаторы: user_id, имя, username;</li>
                    <li>Анкетные данные, предоставленные добровольно: возраст, город, интересы, биография и др.;</li>
                    <li>Ссылки на внешние ресурсы, включая Instagram-профиль (по желанию Пользователя);</li>
                    <li>Технические данные: дата регистрации, активность в Сервисе.</li>
                  </ul>
                </section>

                <section className="mt-8">
                  <h3 className="font-bold text-base mb-4">3. Цели обработки</h3>
                  <p className="mb-3">
                    Обработка персональных данных осуществляется исключительно в целях:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>предоставления функционала Сервиса;</li>
                    <li>отображения анкет другим Пользователям;</li>
                    <li>формирования рекомендаций и улучшения UX;</li>
                    <li>демонстрации возможностей Сервиса (в случае демо-анкет).</li>
                  </ul>
                </section>

                <section className="mt-8">
                  <h3 className="font-bold text-base mb-4">4. Демо-анкеты</h3>
                  <p className="mb-3">
                    Сервис может использовать демо-анкеты, созданные на основе публично доступных данных (например, Instagram). Такие анкеты:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>не связаны с реальными Telegram-аккаунтами;</li>
                    <li>используются исключительно в демонстрационных целях;</li>
                    <li>помечаются как is_demo и не участвуют в реальных взаимодействиях.</li>
                  </ul>
                  <p className="mt-3">
                    Пользователь вправе запросить удаление демо-анкеты, содержащей его изображение или данные.
                  </p>
                </section>

                <section className="mt-8">
                  <h3 className="font-bold text-base mb-4">5. Передача данных третьим лицам</h3>
                  <p className="mb-3">
                    Сервис не передаёт персональные данные третьим лицам, за исключением случаев:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>получения явного согласия Пользователя;</li>
                    <li>требований законодательства;</li>
                    <li>защиты прав и интересов Сервиса в рамках правовых процедур.</li>
                  </ul>
                </section>

                <section className="mt-8">
                  <h3 className="font-bold text-base mb-4">6. Хранение и защита данных</h3>
                  <p>
                    Сервис принимает необходимые организационные и технические меры для защиты персональных данных от неправомерного доступа, изменения, раскрытия или уничтожения.
                  </p>
                  <p className="mt-3">
                    Срок хранения данных определяется целями обработки и может быть ограничен по запросу Пользователя.
                  </p>
                </section>

                <section className="mt-8">
                  <h3 className="font-bold text-base mb-4">7. Права пользователя</h3>
                  <p className="mb-3">
                    Пользователь имеет право:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>на доступ к своим персональным данным;</li>
                    <li>на их исправление, обновление или удаление;</li>
                    <li>на отзыв согласия на обработку;</li>
                  </ul>
                </section>

                <section className="mt-8">
                  <h3 className="font-bold text-base mb-4">8. Контакты</h3>
                  <p className="mb-3">
                    По вопросам, связанным с обработкой персональных данных, вы можете обратиться:
                  </p>
                  <p>
                    по электронной почте:{" "}
                    <a
                      href="mailto:luvo.dateby@gmail.com"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      luvo.dateby@gmail.com
                    </a>
                  </p>
                </section>

                <section className="mt-8">
                  <h3 className="font-bold text-base mb-4">9. Изменения политики</h3>
                  <p>
                    Сервис вправе вносить изменения в настоящую Политику. Обновлённая редакция вступает в силу с момента её публикации, если иное не предусмотрено.
                  </p>
                </section>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
