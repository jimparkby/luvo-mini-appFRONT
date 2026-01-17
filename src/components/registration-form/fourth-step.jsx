import { Button } from "@/ui";
import { Spinner } from "@/components";

export const FourthStep = ({ onContinue, isLoading }) => {
  return (
    <>
      <h2 className="text-[32px] font-bold mt-6 leading-tight">
        Добро пожаловать в экосистему Luvo- знакомься, общайся, влюбляйся.
      </h2>

      <Button className="mt-[400px] w-full" type="button" onClick={onContinue} disabled={isLoading}>
        {!isLoading ? "Добро пожаловать" : <Spinner size="sm" />}
      </Button>
    </>
  );
};
