import { forwardRef } from "react";
import { CalendarDays } from "lucide-react";

export const DateInput = forwardRef(({ value, onClick, error }, ref) => (
  <div className="w-full">
    <div className="relative flex items-center rounded-[30px] bg-white/10">
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={`w-full py-[18px] px-4 flex justify-between rounded-[30px] leading-5 text-xl border-2 ${
          error ? "border-light-red" : "border-primary-gray/30"
        } bg-gray-light text-black dark:bg-transparent dark:text-white`}
      >
        <div
          className={`w-full text-left ${
            value ? "text-black dark:text-white" : "text-gray-400"
          }`}
        >
          {value || "Дата рождения"}
        </div>

        <CalendarDays className="w-4 h-4 ml-2 opacity-60" />
      </button>
    </div>

    {error && (
      <p className="mt-2 font-semibold text-light-red">{error.message}</p>
    )}
  </div>
));
