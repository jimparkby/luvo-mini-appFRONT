import { useRef } from "react";
import { useCreateUserPhoto } from "@/api/user";

import CameraIcon from "@/assets/icons/camera.svg";

export const PhotoItem = ({ onError }) => {
  const inputRef = useRef(null);

  const { mutateAsync } = useCreateUserPhoto();

  const triggerUpload = () => {
    inputRef.current?.click();
  };

  const onUploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("photo", file);

      await mutateAsync(formData);
    } catch (e) {
      console.error("Ошибка при загрузке фото:", e);
      const message = e?.response?.data?.detail || "Ошибка при загрузке фото";
      onError?.(message);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <>
      <div
        onClick={triggerUpload}
        className="w-full aspect-square mx-auto flex items-center justify-center border border-primary-gray/70 dark:border-white/70 bg-gray-light dark:bg-transparent rounded-[20px] cursor-pointer"
      >
        <img src={CameraIcon} alt="camera-icon" className="size-10" />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onUploadPhoto}
      />
    </>
  );
};
