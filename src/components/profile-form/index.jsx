import { useState, useEffect } from "react";
import * as yup from "yup";
import { Button } from "@/ui";
import { useForm } from "react-hook-form";
import { Spinner } from "@/components";
import { AboutField } from "./about-field";
import { yupResolver } from "@hookform/resolvers/yup";
import { PhotosField } from "./photos-field";
import { calculateAge } from "@/utils/calculate-age.util";
import { useUpdateUser } from "@/api/user";
import { InstagramField } from "./instagram-field";
import { useTelegramInitData } from "@/hooks/useTelegramInitData";
import { containsBannedWord, isValidUsernameFormat } from "@/constants/banned-words";

const MAX_EMOJIS = 5;

// Фильтрует строку: оставляет только emoji-кластеры (до MAX_EMOJIS штук)
const filterToEmojisOnly = (input) => {
  if (!input) return '';
  // Intl.Segmenter поддерживается во всех современных браузерах
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    const clusters = [...segmenter.segment(input)]
      .map((s) => s.segment)
      .filter((s) => /\p{Extended_Pictographic}/u.test(s));
    return clusters.slice(0, MAX_EMOJIS).join('');
  }
  // Fallback regex
  const matches = input.match(/\p{Extended_Pictographic}[\p{Emoji_Modifier}\uFE0F\u20E3]?(\u200D\p{Extended_Pictographic}[\p{Emoji_Modifier}\uFE0F\u20E3]?)*/gu) || [];
  return matches.slice(0, MAX_EMOJIS).join('');
};

// Считает количество emoji-кластеров в строке
const countEmojis = (str) => {
  if (!str) return 0;
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    return [...segmenter.segment(str)].filter((s) =>
      /\p{Extended_Pictographic}/u.test(s.segment)
    ).length;
  }
  return (str.match(/\p{Extended_Pictographic}/gu) || []).length;
};

const schema = yup.object({
  about: yup.string().optional(),
  birthdate: yup
    .date()
    .optional()
    .test("min-age", "Вам должно быть не менее 14 лет", function (value) {
      if (!value) return true;
      const age = calculateAge(value);
      return age >= 14;
    }),
  first_name: yup.string().required("Имя обязательно"),
  instagram_username: yup
    .string()
    .transform((value) => value?.trim() || "")
    .required("Введите имя пользователя")
    .test("not-empty", "Введите имя пользователя", function (value) {
      return value && value.length > 0;
    })
    .test("valid-format", "Введите ваши настоящие данные", function (value) {
      if (!value) return true;
      return isValidUsernameFormat(value);
    })
    .test("no-banned-words", "Username содержит запрещённые слова", function (value) {
      if (!value) return true;
      return !containsBannedWord(value);
    }),
  status: yup.string().optional(),
});

export const ProfileForm = ({ userData, userPhotosData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [genericError, setGenericError] = useState("");

  const { setUser } = useTelegramInitData();
  const { mutateAsync } = useUpdateUser();

  const {
    reset,
    watch,
    control,
    setValue,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      about: "",
      birthdate: "",
      first_name: "",
      instagram_username: "",
      status: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "birthdate" && value instanceof Date) {
          formData.append(key, value.toISOString().split("T")[0]);
        } else {
          formData.append(key, value);
        }
      });

      const { exp, user_id, has_profile, access_token } = await mutateAsync(
        formData
      );

      if (access_token) {
        setUser({
          id: user_id,
          exp,
          isRegister: has_profile,
          accessToken: access_token,
        });
      }

      setGenericError("");
      setIsLoading(false);
    } catch (err) {
      console.error("Ошибка создания профиля", err);
      setGenericError(err?.response?.data?.detail || "Что-то пошло не так");
    }
  };

  useEffect(() => {
    if (userData) {
      reset({
        about: userData.about || "",
        birthdate: userData.birthdate ? new Date(userData.birthdate) : null,
        first_name: userData.first_name || "",
        instagram_username: userData.instagram_username || "",
        status: userData.status || "",
      });
    }
  }, [userData, reset]);

  useEffect(() => {
    if (userPhotosData?.length) {
      userPhotosData.forEach((photo) => {
        const img = new Image();
        img.src = photo.url;
      });
    }
  }, [userPhotosData]);

  return (
    <form
      className="container mx-auto max-w-md p-5 overflow-y-auto scrollbar-hidden"
      onSubmit={handleSubmit(onSubmit)}
    >
      <PhotosField photos={userPhotosData} />

      <InstagramField register={register} errors={errors} />

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Статус смайлик</h2>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {countEmojis(watch('status') || '')}/{MAX_EMOJIS}
          </span>
        </div>

        <input
          type="text"
          inputMode="text"
          value={watch('status') || ''}
          onChange={(e) => setValue('status', filterToEmojisOnly(e.target.value))}
          placeholder="😊✨🔥"
          maxLength={50}
          className="mt-5 w-full py-[18px] px-4 rounded-[30px] text-3xl border-2 border-primary-gray/30 bg-gray-light text-black dark:bg-transparent dark:text-white focus:border-primary-red focus:outline-none transition text-center tracking-widest"
        />
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-center">
          Введи до {MAX_EMOJIS} смайликов — они будут видны всем
        </p>
      </div>

      <AboutField
        errors={errors}
        control={control}
        setValue={setValue}
        register={register}
        genericError={genericError}
      />

      <Button type="submit" className="mt-3 w-full">
        {!isLoading ? "Сохранить" : <Spinner size="sm" />}
      </Button>
    </form>
  );
};
