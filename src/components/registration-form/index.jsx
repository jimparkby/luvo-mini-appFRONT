import { useState, useEffect } from "react";
import * as yup from "yup";
import DatePicker from "react-datepicker";
import { Spinner } from "@/components";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { calculateAge } from "@/utils/calculate-age.util";
import { useCreateUser } from "@/api/user";
import { useWebAppStore } from "@/store";
import { ABOUT_PLACEHOLDER } from "@/constants";
import { Controller, useForm } from "react-hook-form";
import { useTelegramInitData } from "@/hooks/useTelegramInitData";
import { Input, Button, Textarea, DateInput } from "@/ui";

import CameraIcon from "@/assets/icons/camera.svg";

const getRandomAboutPlaceholder = () => {
  return ABOUT_PLACEHOLDER[
    Math.floor(Math.random() * ABOUT_PLACEHOLDER.length)
  ];
};

const stepSchemas = [
  yup.object({
    instagram_username: yup.string().required("Введите имя пользователя"),
  }),
  yup.object({
    first_name: yup.string().required("Имя обязательно"),
    birthdate: yup
      .date()
      .required("Дата рождения обязательна")
      .test("min-age", "Вам должно быть не менее 14 лет", function (value) {
        if (!value) return true;
        const age = calculateAge(value);
        return age >= 14;
      }),
    gender: yup
      .string()
      .oneOf(["male", "female"], "Укажите пол")
      .required("Пол обязателен"),
    about: yup.string().optional(),
  }),
  yup.object({
    file: yup.mixed().required("Фото обязательно"),
  }),
];

export const RegistrationForm = () => {
  const [step, setStep] = useState(0);
  const [aboutPlaceholder] = useState(getRandomAboutPlaceholder());
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [genericError, setGenericError] = useState("");

  const navigate = useNavigate();

  const { setUser } = useWebAppStore();
  const { initData } = useTelegramInitData();
  const { mutateAsync } = useCreateUser();

  const methods = useForm({
    mode: "onChange",
    resolver: yupResolver(stepSchemas[step]),
    defaultValues: {
      file: null,
      about: "",
      gender: "",
      birthdate: null,
      first_name: "",
      instagram_username: "",
    },
  });

  const {
    watch,
    control,
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = methods;

  const onSubmit = async (data) => {
    if (step < stepSchemas.length - 1) {
      setStep(step + 1);
    } else {
      setIsLoading(true);
      setGenericError("");

      try {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
          if (key === "birthdate" && value instanceof Date) {
            formData.append("birthdate", value.toISOString().split("T")[0]);
          } else {
            formData.append(key, value);
          }
        });
        formData.append("init_data", initData);

        const response = await mutateAsync(formData);
        const { user_id, exp, has_profile, access_token } = response.data;

        if (access_token) {
          setUser({
            id: user_id,
            exp,
            isRegister: has_profile,
            accessToken: access_token,
          });
        }

        navigate("/feed");
      } catch (err) {
        console.error("Ошибка регистрации", err);
        setGenericError(err?.response?.data?.detail || "Что-то пошло не так");
      }
      setIsLoading(false);
    }
  };

  const photoFile = watch("file");

  useEffect(() => {
    if (photoFile && photoFile instanceof File) {
      const objectUrl = URL.createObjectURL(photoFile);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [photoFile]);

  return (
    <form
      className="container mx-auto max-w-md p-5"
      onSubmit={handleSubmit(onSubmit)}
    >
      {step === 0 && (
        <>
          <h2 className="text-[32px] font-bold">Привяжите Instagram</h2>

          <p className="text-lg text-gray-400">
            Первое впечатление начинается здесь!
          </p>

          <Input
            {...register("instagram_username")}
            className="mt-10"
            placeholder="Ваш username в Instagram"
            error={errors.instagram_username}
          />

          <Button className="mt-3 w-full" type="submit">
            Далее
          </Button>
        </>
      )}

      {step === 1 && (
        <>
          <h2 className="text-[32px] font-bold">Данные о Вас</h2>

          <div className="mt-10">
            <Input
              {...register("first_name")}
              placeholder="Имя"
              error={errors.first_name}
            />

            <Controller
              name="birthdate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  selected={field.value ? new Date(field.value) : null}
                  onChange={(date) => {
                    field.onChange(date);
                    // Триггерим валидацию сразу после выбора даты
                    if (date) {
                      setValue("birthdate", date, {
                        shouldValidate: true,
                      });
                    }
                  }}
                  customInput={<DateInput error={errors.birthdate} />}
                  dateFormat="dd.MM.yyyy"
                  wrapperClassName="mt-3 w-full"
                  maxDate={new Date()}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              )}
            />

            <div className="mt-4">
              <div className="flex gap-6">
                {["male", "female"].map((value) => {
                  const label = value === "male" ? "Мужской" : "Женский";
                  return (
                    <label
                      key={value}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        value={value}
                        {...register("gender")}
                        className="hidden peer"
                      />

                      <div className="w-4 h-4 flex items-center justify-center rounded-full border-2 border-gray-400 peer-checked:border-primary-red">
                        <div className="w-2 h-2 rounded-full bg-transparent peer-checked:bg-primary-red transition-all" />
                      </div>

                      <span className="transition font-semibold">{label}</span>
                    </label>
                  );
                })}
              </div>

              {errors.gender && (
                <p className="mt-2 text-light-red font-semibold">
                  {errors.gender.message}
                </p>
              )}
            </div>

            <Textarea
              {...register("about")}
              className="mt-4"
              placeholder={aboutPlaceholder}
              error={errors.about}
            />
          </div>

          <Button className="mt-4 w-full" type="submit">
            Далее
          </Button>
        </>
      )}

      {step === 2 && (
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
              <img
                src={CameraIcon}
                alt="camera-icon"
                className="size-[130px]"
              />
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

          <Button className="mt-3 w-full" type="submit">
            {!isLoading ? "Завершить" : <Spinner size="sm" />}
          </Button>
        </>
      )}
    </form>
  );
};
