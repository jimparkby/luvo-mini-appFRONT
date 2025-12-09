import { useState, useEffect } from "react";
import { useWebAppStore } from "@/store";
import { Button } from "@/ui";

export const TelegramInfo = () => {
  const { user, webApp, getPhoneNumber, getShareUrl } = useWebAppStore();
  const [phoneNumber, setPhoneNumber] = useState(
    user?.phone_number || webApp?.initDataUnsafe?.user?.phone_number || null
  );
  const [shareUrl, setShareUrl] = useState(null);
  const [isRequestingPhone, setIsRequestingPhone] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    // Получаем share-ссылку при монтировании и при изменении user
    const url = getShareUrl();
    setShareUrl(url);
  }, [getShareUrl, user]);

  useEffect(() => {
    // Обновляем номер телефона, если он появился в user
    if (user?.phone_number) {
      setPhoneNumber(user.phone_number);
    } else if (webApp?.initDataUnsafe?.user?.phone_number) {
      setPhoneNumber(webApp.initDataUnsafe.user.phone_number);
    }
  }, [user, webApp]);

  const handleRequestPhone = async () => {
    setIsRequestingPhone(true);
    try {
      const phone = await getPhoneNumber();
      if (phone) {
        setPhoneNumber(phone);
      }
    } catch (error) {
      console.error("Ошибка при запросе номера телефона:", error);
    } finally {
      setIsRequestingPhone(false);
    }
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        if (webApp?.showAlert) {
          webApp.showAlert("Ссылка скопирована!");
        }
      } else {
        // Fallback для старых браузеров
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        if (webApp?.showAlert) {
          webApp.showAlert("Ссылка скопирована!");
        } else {
          alert("Ссылка скопирована!");
        }
      }
    } catch (error) {
      console.error("Ошибка при копировании ссылки:", error);
      if (webApp?.showAlert) {
        webApp.showAlert("Не удалось скопировать ссылку");
      } else {
        alert("Не удалось скопировать ссылку");
      }
    }
  };

  return (
    <div className="mt-5">
      <h2 className="text-2xl font-bold mb-5">Telegram</h2>

      <div className="space-y-4">
        {/* Номер телефона */}
        <div className="w-full p-4 border-2 border-primary-gray/30 dark:border-white/70 bg-gray-light dark:bg-transparent rounded-2xl">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Номер телефона
            </label>

            {phoneNumber ? (
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-900 dark:text-white">
                  {phoneNumber}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Номер телефона не предоставлен
                </p>
                <Button
                  onClick={handleRequestPhone}
                  disabled={isRequestingPhone}
                  styleType="secondary"
                  className="w-full"
                >
                  {isRequestingPhone ? "Запрос..." : "Запросить номер телефона"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Share-ссылка */}
        <div className="w-full p-4 border-2 border-primary-gray/30 dark:border-white/70 bg-gray-light dark:bg-transparent rounded-2xl">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Share-ссылка
            </label>

            {shareUrl ? (
              <div className="flex flex-col gap-2">
                <div className="w-full p-3 bg-white dark:bg-gray-800 rounded-xl border border-primary-gray/20 dark:border-white/20">
                  <span className="text-sm text-gray-900 dark:text-white break-all">
                    {shareUrl}
                  </span>
                </div>

                <Button
                  onClick={handleCopyShareUrl}
                  styleType={isCopied ? "primary" : "secondary"}
                  className="w-full mt-2"
                  disabled={isCopied}
                >
                  {isCopied ? "✓ Скопировано!" : "Копировать ссылку"}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Share-ссылка недоступна
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
