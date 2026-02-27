import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const options = [
  { value: "dark", label: "Тёмная" },
  { value: "system", label: "Авто" },
  { value: "light", label: "Светлая" },
] as const;

type ThemeSwitcherProps = {
  className?: string;
};

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn(className, "flex items-center gap-1 opacity-0")}>
        {options.map((option, i) => (
          <span key={option.value} className="flex items-center">
            <button className="text-xs">{option.label}</button>
            {i < options.length - 1 && <span className="text-xs mx-1">/</span>}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(className, "flex items-center")}>
      {options.map((option, i) => (
        <span key={option.value} className="flex items-center">
          <button
            className={cn(
              "text-xs text-slate-10",
              theme === option.value && "text-slate-12 font-medium"
            )}
            onClick={() => setTheme(option.value)}
          >
            {option.label}
          </button>
          {i < options.length - 1 && (
            <span className="text-xs text-slate-8 mx-1">/</span>
          )}
        </span>
      ))}
    </div>
  );
}
