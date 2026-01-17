import { Button } from "@/ui";
import { Spinner, FloatingHearts } from "@/components";

export const FourthStep = ({ onContinue, isLoading }) => {
  return (
    <div className="relative min-h-[calc(100vh-40px)] flex flex-col -mx-5 -mt-6 px-5">
      <FloatingHearts />

      <div className="relative z-10 flex flex-col flex-1">
        <h2 className="text-[32px] font-bold mt-6 leading-tight">
          Добро пожаловать в экосистему Luvo- знакомься, общайся, влюбляйся.
        </h2>

        <div className="mt-auto pb-6">
          <Button className="w-full" type="button" onClick={onContinue} disabled={isLoading}>
            {!isLoading ? "Добро пожаловать" : <Spinner size="sm" />}
          </Button>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-1/2 w-96 h-96 rounded-full pointer-events-none animate-pulse-glow"
        style={{
          background: "radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)",
        }}
      />
    </div>
  );
};
