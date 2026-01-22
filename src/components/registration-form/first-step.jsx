import { Input, Button } from "@/ui";

export const FirstStep = ({ register, errors }) => {
  return (
    <>
      <h2 className="text-[32px] font-bold">Привяжите Instagram/Telegram</h2>

      <p className="text-lg text-gray-400">
        Первое впечатление начинается здесь!
      </p>

      <p className="text-lg text-gray-400">
        Этот ник будет использоваться во всей экосистеме LUVO
      </p>

      <Input
        {...register("instagram_username")}
        className="mt-4"
        placeholder="Ваш @username"
        error={errors.instagram_username}
      />

      <Button className="mt-3 w-full" type="submit">
        Далее
      </Button>
    </>
  );
};
