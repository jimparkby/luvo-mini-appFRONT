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
    .required("Введите имя пользователя")
    .test("valid-format", "Только латинские буквы, цифры, точки и _", function (value) {
      if (!value) return true;
      return isValidUsernameFormat(value);
    })
    .test("no-banned-words", "Username содержит запрещённые слова", function (value) {
      if (!value) return true;
      return !containsBannedWord(value);
    }),
});

export const ProfileForm = ({ userData, userPhotosData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [genericError, setGenericError] = useState("");

  const { setUser } = useTelegramInitData();
  const { mutateAsync } = useUpdateUser();

  const {
    reset,
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
      formData.append("gender", "male");

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
