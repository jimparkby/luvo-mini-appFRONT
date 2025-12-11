import { Button } from "@/ui";
import { Spinner } from "@/components";
import { useNavigate } from "react-router-dom";

import CameraIcon from "@/assets/icons/camera.svg";

export const ThirdStep = ({
  errors,
  preview,
  setValue,
  isLoading,
  genericError,
  setGenericError,
  register,
}) => {
  const navigate = useNavigate();

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
