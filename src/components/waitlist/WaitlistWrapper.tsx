import { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "./ThemeSwitcher";

type WaitlistWrapperProps = PropsWithChildren<{
  logo?: {
    src: string;
    alt?: string;
  };
  copyright?: string;
  copyrightLink?: {
    text: string;
    href: string;
  };
  showThemeSwitcher?: boolean;
  hideCopyright?: boolean;
}>;

export function WaitlistWrapper({
  children,
  logo,
  copyright = "При поддержке",
  copyrightLink = { text: "Ваша компания", href: "#" },
  showThemeSwitcher = true,
  hideCopyright = false,
}: WaitlistWrapperProps) {
  return (
    <div
      className={cn(
        "w-full mx-auto max-w-[500px] flex flex-col justify-center items-center bg-gray-1/85 pb-0 overflow-hidden rounded-2xl",
        "shadow-[0px_170px_48px_0px_rgba(18,_18,_19,_0.00),_0px_109px_44px_0px_rgba(18,_18,_19,_0.01),_0px_61px_37px_0px_rgba(18,_18,_19,_0.05),_0px_27px_27px_0px_rgba(18,_18,_19,_0.09),_0px_7px_15px_0px_rgba(18,_18,_19,_0.10)]"
      )}
    >
      <div className="flex flex-col items-center gap-4 flex-1 text-center w-full p-8 pb-4">
        {logo && (
          <div className="flex justify-center w-16 h-16 items-center mx-auto">
            <img
              src={logo.src}
              alt={logo.alt || "Logo"}
              className="w-full h-full object-contain logo-spin"
            />
          </div>
        )}
        <div className="flex flex-col gap-10">{children}</div>
      </div>
      <footer className={cn(
        "flex items-center w-full self-stretch px-8 py-3 text-sm bg-gray-12/[.07] overflow-hidden",
        hideCopyright ? "justify-center" : "justify-between"
      )}>
        {!hideCopyright && (
          <p className="text-xs text-slate-10">
            {copyright}{" "}
            <a
              href={copyrightLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium text-slate-12"
            >
              {copyrightLink.text}
            </a>
          </p>
        )}
        {showThemeSwitcher && <ThemeSwitcher />}
      </footer>
    </div>
  );
}
