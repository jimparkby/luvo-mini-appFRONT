import { useState, useEffect, useRef } from "react";
import { Button } from "@/ui";
import { Spinner } from "@/components";
import { useBiometric } from "@/hooks/useBiometric";
import { useVerifyFace } from "@/api/user";

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
  const [isBotsConsentChecked, setIsBotsConsentChecked] = useState(false);

  const [isCheckingFace, setIsCheckingFace] = useState(false);
  const [faceCheckResult, setFaceCheckResult] = useState(null); // 'ok', 'no_face', null
  const fileInputRef = useRef(null);
  const verifyFace = useVerifyFace();

  const handleFaceCheck = (file) => {
    setGenericError(null);
    setFaceCheckResult(null);
    setIsCheckingFace(true);

    verifyFace.mutateAsync(file)
      .then((result) => {
        if (result.has_face) {
          setFaceCheckResult("ok");
        } else {
          setFaceCheckResult("no_face");
          setGenericError("На фото не обнаружено лицо. Попробуйте другое фото.");
          setValue("file", null, { shouldValidate: true });
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      })
      .catch(() => {
        setFaceCheckResult("no_face");
        setGenericError("Не удалось проверить фото. Попробуйте ещё раз.");
        setValue("file", null, { shouldValidate: true });
        if (fileInputRef.current) fileInputRef.current.value = "";
      })
      .finally(() => {
        setIsCheckingFace(false);
      });
  };

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
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={false}
          disabled={isCheckingFace}
          className={`absolute inset-0 opacity-0 rounded-[20px] ${isCheckingFace ? "pointer-events-none" : "cursor-pointer"}`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!file.type.startsWith("image/")) {
              setGenericError("Пожалуйста, выберите изображение");
              return;
            }
            setValue("file", file, { shouldValidate: true });
            handleFaceCheck(file);
          }}
        />

        {preview ? (
          <>
            <img
              src={preview}
              alt="preview"
              className="object-cover w-full h-full rounded-[20px]"
            />
            {isCheckingFace && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-[20px] z-10">
                <Spinner size="lg" />
                <p className="mt-3 text-white text-sm font-medium">Проверяем фото...</p>
              </div>
            )}
            {faceCheckResult === "ok" && !isCheckingFace && (
              <div className="absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center bg-green-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </>
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
            disabled={isVerifying || isLoading || isCheckingFace || faceCheckResult !== "ok"}
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
            <Button className="w-full" type="submit" disabled={isLoading || isCheckingFace || faceCheckResult !== "ok"}>
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
            <div className="flex items-center p-4 pt-28 border-b border-gray-200 dark:border-gray-700">
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
                <p>Дата вступления в силу: 21 января 2026 г.</p>
                <p>Последнее обновление: 22 января 2026 г.</p>
              </div>

              <div className="space-y-6 text-gray-700 dark:text-gray-300 text-sm">
                <p>
                  Настоящая Политика конфиденциальности (далее — «Политика») регулирует порядок обработки и защиты персональных данных пользователей, осуществляемую LUVO (далее — «Сервис»), при использовании Telegram-миниприложения LUVO.
                </p>

                <p className="font-medium">
                  Используя Сервис, Пользователь выражает согласие с условиями настоящей Политики.
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
                    <li>анкетные данные, предоставленные Пользователем добровольно: возраст, город, интересы, биография и иная информация;</li>
                    <li>ссылки на внешние ресурсы, включая профили в социальных сетях (например, Instagram), по желанию Пользователя;</li>
                    <li>технические данные: дата регистрации, активность в Сервисе, действия внутри миниприложения.</li>
                  </ul>
                </section>

                <section className="mt-8">
                  <h3 className="font-bold text-base mb-4">3. Цели обработки персональных данных</h3>
                  <p className="mb-3">
                    Обработка персональных данных осуществляется исключительно в целях:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>предоставления функционала Сервиса;</li>
                    <li>отображения анкет другим Пользователям;</li>
                    <li>формирования рекомендаций и персонализации контента;</li>
                    <li>улучшения пользовательского опыта (UX);</li>
                    <li>демонстрации возможностей Сервиса, включая использование ИИ-моделей.</li>
                  </ul>
                </section>

                <section className="mt-8">
                  <h3 className="font-bold text-base mb-4">4. Использование ИИ-моделей</h3>
                  <p className="mb-3">
                    Сервис может использовать автоматизированные ИИ-модели (виртуальные профили) в ленте анкет и в рамках функционала общения.
                  </p>
                  <p className="mb-3">
                    ИИ-модели:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>не являются реальными Пользователями;</li>
                    <li>функционируют на основе алгоритмов искусственного интеллекта;</li>
                    <li>могут имитировать общение и взаимодействие с Пользователями в текстовом формате;</li>
                    <li>используются в целях демонстрации возможностей Сервиса, повышения вовлечённости и улучшения пользовательского опыта.</li>
                  </ul>
                  <p className="mt-3">
                    ИИ-модели не обрабатывают персональные данные Пользователей вне рамок, предусмотренных настоящей Политикой, и не используются для принятия юридически значимых решений.
                  </p>
                  <p className="mt-3">
                    Используя Сервис, Пользователь уведомляется и соглашается с тем, что часть взаимодействий в Сервисе может осуществляться с ИИ-моделями.
                  </p>
                </section>

                <section className="mt-8">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div
                      className={`mt-1 w-5 h-5 flex items-center justify-center rounded border-2 transition-all flex-shrink-0 ${isBotsConsentChecked ? 'border-primary-red bg-primary-red' : 'border-gray-400'}`}
                      onClick={() => setIsBotsConsentChecked(!isBotsConsentChecked)}
                    >
                      <svg
                        className={`w-3 h-3 text-white transition-opacity ${isBotsConsentChecked ? 'opacity-100' : 'opacity-0'}`}
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
                    <h3 className="font-bold text-base mb-4">5. Создание ботов по запросу Пользователя</h3>
                  </label>
                  <div className="ml-8">
                    <p className="mb-3">
                      Сервис может предоставлять Пользователям возможность заказа и создания автоматизированных ботов для целей безопасного и контролируемого общения в Telegram и иных цифровых средах.
                    </p>
                    <p className="mb-3">
                      Такие боты могут использоваться, в том числе, для:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>обеспечения безопасного чатинга между Пользователями;</li>
                      <li>защиты личных контактных данных и анонимности;</li>
                      <li>фильтрации нежелательного или небезопасного контента;</li>
                      <li>посредничества в общении между Пользователями;</li>
                      <li>ограничения возможности сохранения, копирования или повторного использования изображений и иных медиафайлов, передаваемых в рамках общения, в целях защиты конфиденциальности Пользователей.</li>
                    </ul>
                    <p className="mt-3">
                      Боты создаются и настраиваются Сервисом на основании запроса Пользователя и функционируют в рамках технических возможностей платформы Telegram и Сервиса.
                    </p>
                    <p className="mt-3">
                      В процессе создания и использования ботов Сервис может обрабатывать минимально необходимый объём данных исключительно в целях обеспечения функционирования бота.
                    </p>
                    <p className="mt-3">
                      Сервис не использует созданных по запросу ботов для сбора или передачи персональных данных третьим лицам, за исключением случаев, предусмотренных настоящей Политикой и требованиями законодательства.
                    </p>
                  </div>
                </section>

                <section className="mt-8">
                  <h3 className="font-bold text-base mb-4">6. Передача данных третьим лицам</h3>
                  <p className="mb-3">
                    Сервис не передаёт персональные данные третьим лицам, за исключением случаев:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>получения явного согласия Пользователя;</li>
                    <li>требований законодательства;</li>
                    <li>необходимости защиты прав и законных интересов Сервиса в рамках правовых процедур.</li>
                  </ul>
                </section>

                <section className="mt-8">
                  <h3 className="font-bold text-base mb-4">7. Хранение и защита данных</h3>
                  <p>
                    Сервис принимает необходимые организационные и технические меры для защиты персональных данных от неправомерного доступа, изменения, раскрытия или уничтожения.
                  </p>
                  <p className="mt-3">
                    Срок хранения персональных данных определяется целями их обработки и может быть сокращён либо прекращён по запросу Пользователя, если иное не предусмотрено законодательством.
                  </p>
                </section>

                <section className="mt-8">
                  <h3 className="font-bold text-base mb-4">8. Права пользователя</h3>
                  <p className="mb-3">
                    Пользователь имеет право:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>на получение информации о своих персональных данных;</li>
                    <li>на их исправление, обновление или удаление;</li>
                    <li>на отзыв согласия на обработку персональных данных;</li>
                    <li>на ограничение обработки в случаях, предусмотренных законодательством.</li>
                  </ul>
                </section>

                <section className="mt-8">
                  <h3 className="font-bold text-base mb-4">9. Контактная информация</h3>
                  <p className="mb-3">
                    По вопросам, связанным с обработкой персональных данных, Пользователь может обратиться:
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
                  <h3 className="font-bold text-base mb-4">10. Изменения Политики</h3>
                  <p>
                    Сервис вправе вносить изменения в настоящую Политику. Обновлённая редакция вступает в силу с момента её публикации, если иное не предусмотрено условиями Сервиса или требованиями законодательства.
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
