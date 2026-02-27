import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type WaitlistFormProps = {
  onSubmit?: (email: string) => Promise<{ success: boolean; error?: string }>;
  buttonCopy?: {
    idle: string;
    loading: string;
    success: string;
  };
  placeholder?: string;
  inputName?: string;
};

type FormState = "idle" | "loading" | "success" | "error";

export function WaitlistForm({
  onSubmit,
  buttonCopy = {
    idle: "Записаться",
    loading: "Отправка...",
    success: "Готово!",
  },
  placeholder = "Введите email",
  inputName = "email",
}: WaitlistFormProps) {
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string>();
  const [value, setValue] = useState("");
  const errorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state === "success") {
      const resetTimeout = setTimeout(() => {
        setState("idle");
      }, 2000);
      return () => clearTimeout(resetTimeout);
    }
  }, [state]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state === "success" || state === "loading") return;

    if (errorTimeout.current) {
      clearTimeout(errorTimeout.current);
      setError(undefined);
      setState("idle");
    }

    if (!value.trim()) {
      setState("error");
      setError("Введите email");
      errorTimeout.current = setTimeout(() => {
        setError(undefined);
        setState("idle");
      }, 3000);
      return;
    }

    setState("loading");

    if (onSubmit) {
      const result = await onSubmit(value);
      if (result.success) {
        setState("success");
        setValue("");
      } else {
        setState("error");
        setError(result.error || "Что-то пошло не так");
        errorTimeout.current = setTimeout(() => {
          setError(undefined);
          setState("idle");
        }, 3000);
      }
    } else {
      // Demo mode - just simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setState("success");
      setValue("");
    }
  };

  const isSubmitted = state === "success";
  const inputDisabled = state === "loading";

  return (
    <form
      className="flex flex-col gap-2 w-full relative"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center justify-between gap-3 relative">
        <input
          type="email"
          name={inputName}
          value={value}
          placeholder={placeholder}
          className={cn(
            "flex-1 text-sm pl-4 pr-28 py-2 h-11 bg-gray-11/5 cursor-text rounded-full text-gray-12 placeholder:text-gray-9 border border-gray-11/10",
            "focus:outline-none focus:ring-2 focus:ring-gray-12/20"
          )}
          disabled={inputDisabled}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          autoFocus
        />
        <button
          type="submit"
          disabled={inputDisabled}
          className={cn(
            "absolute h-8 px-3.5 bg-gray-12 text-gray-1 text-sm top-1/2 transform -translate-y-1/2 right-1.5 rounded-full font-medium flex gap-1 items-center",
            "disabled:cursor-not-allowed transition-colors",
            state === "loading" && "bg-gray-12 text-gray-2",
            inputDisabled && "cursor-not-allowed"
          )}
        >
          {state === "loading" ? (
            <>
              {buttonCopy.loading}
              <LoadingSpinner />
            </>
          ) : isSubmitted ? (
            buttonCopy.success
          ) : (
            buttonCopy.idle
          )}
        </button>
      </div>
      <div className="w-full h-2" />
      {error && (
        <p className="absolute text-xs text-red-500 top-full -translate-y-1/2 px-2">
          {error}
        </p>
      )}
    </form>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full border border-current !border-t-transparent animate-spin" />
    </div>
  );
}
