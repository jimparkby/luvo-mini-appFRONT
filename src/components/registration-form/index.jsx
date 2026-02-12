import { useState, useEffect } from "react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { FirstStep } from "./first-step";
import { ThirdStep } from "./third-step";
import { SecondStep } from "./second-step";
import { FourthStep } from "./fourth-step";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { calculateAge } from "@/utils/calculate-age.util";
import { useCreateUser } from "@/api/user";
import { useWebAppStore } from "@/store";
import { isValidName } from "@/constants/russian-names";
import { useTelegramInitData } from "@/hooks/useTelegramInitData";
import { FloatingHearts } from "@/components";
import { containsBannedWord, isValidUsernameFormat } from "@/constants/banned-words";

const stepSchemas = [
  yup.object({
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
  }),
  yup.object({
    first_name: yup
      .string()
      .required("Имя обязательно")
      .test("valid-name", "Введите ваше настоящее имя.", function (value) {
        if (!value) return true;
        return isValidName(value);
      }),
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
  }),
  yup.object({
    file: yup.mixed().required("Фото обязательно"),
    privacyAccepted: yup
      .boolean()
      .oneOf([true], "Необходимо согласиться с политикой конфиденциальности")
      .required("Необходимо согласиться с политикой конфиденциальности"),
    biometricVerified: yup
      .boolean()
      .test("is-verified", "Необходима верификация Face ID или пропустите её", function (value) {
        // Валидация всегда проходит, так как верификация теперь опциональная
        // Кнопка "Пропустить" устанавливает значение в true
        return true;
      }),
  }),
  yup.object({}), // Четвертый шаг - страница приветствия без полей
];

export const RegistrationForm = () => {
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [genericError, setGenericError] = useState("");

  const navigate = useNavigate();

  const { setUser, setInitialized } = useWebAppStore();
  const { initData } = useTelegramInitData();
  const { mutateAsync } = useCreateUser();

  const methods = useForm({
    mode: "onChange",
    resolver: yupResolver(stepSchemas[step]),
    defaultValues: {
      file: null,
      gender: "",
      birthdate: null,
      first_name: "",
      instagram_username: "",
      privacyAccepted: false,
      biometricVerified: false,
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

  const goBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const completeRegistration = async () => {
    setIsLoading(true);
    setGenericError("");

    try {
      const data = methods.getValues();
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (key === "birthdate" && value instanceof Date) {
          formData.append("birthdate", value.toISOString().split("T")[0]);
        } else {
          formData.append(key, value);
        }
      });
      formData.append("about", "");
      formData.append("init_data", initData);

      const response = await mutateAsync(formData);
      const { user_id, expires_in_ms, has_profile, access_token } = response.data;

      if (access_token) {
        setUser({
          id: user_id,
          exp: expires_in_ms,
          isRegister: has_profile,
          accessToken: access_token,
        });
        setInitialized(true);
      }

      navigate("/feed");
    } catch (err) {
      console.error("Ошибка регистрации", err);
      setGenericError(err?.response?.data?.detail || "Что-то пошло не так");
    }
    setIsLoading(false);
  };

  const onSubmit = async (data) => {
    if (step < stepSchemas.length - 1) {
      setStep(step + 1);
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
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <FloatingHearts />
        <div
          className="absolute bottom-0 left-1/2 w-96 h-96 rounded-full animate-pulse-glow"
          style={{
            background: "radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)",
          }}
        />
      </div>

      <form
        className="container mx-auto max-w-md p-5 relative z-10"
        onSubmit={handleSubmit(onSubmit)}
      >
        {step === 0 && <FirstStep register={register} errors={errors} />}

        {step === 1 && (
          <SecondStep
            errors={errors}
            control={control}
            setValue={setValue}
            register={register}
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
            setGenericError={setGenericError}
            onBack={goBack}
            onNext={handleSubmit(onSubmit)}
          />
        )}

        {step === 3 && (
          <FourthStep onContinue={completeRegistration} isLoading={isLoading} />
        )}
      </form>
    </>
  );
};
