import { useState, useEffect } from "react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { FirstStep } from "./first-step";
import { ThirdStep } from "./third-step";
import { SecondStep } from "./second-step";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { calculateAge } from "@/utils/calculate-age.util";
import { useCreateUser } from "@/api/user";
import { useWebAppStore } from "@/store";
import { ABOUT_PLACEHOLDER } from "@/constants";
import { useTelegramInitData } from "@/hooks/useTelegramInitData";

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
    privacyAccepted: yup
      .boolean()
      .oneOf([true], "Необходимо согласиться с политикой конфиденциальности")
      .required("Необходимо согласиться с политикой конфиденциальности"),
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
      privacyAccepted: false,
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
      {step === 0 && <FirstStep register={register} errors={errors} />}

      {step === 1 && (
        <SecondStep
          errors={errors}
          control={control}
          setValue={setValue}
          register={register}
          aboutPlaceholder={aboutPlaceholder}
        />
      )}

      {step === 2 && (
        <ThirdStep
          errors={errors}
          preview={preview}
          register={register}
          setValue={setValue}
          isLoading={isLoading}
          setPreview={setPreview}
          genericError={genericError}
        />
      )}
    </form>
  );
};
