import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

type HeaderProps = {
  navItems?: NavItem[];
};

export function Header({
  navItems = [
    { href: "/", label: "Главная" },
    { href: "/manifesto", label: "Манифест" },
  ],
}: HeaderProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <nav className="bg-slate-1 rounded-full">
        <div
          className={cn(
            "bg-slate-1 rounded-full p-1 flex relative items-center",
            "shadow-[0px_-1px_3px_0px_rgba(0,_0,_0,_0.05),_0px_7px_2px_0px_rgba(0,_0,_0,_0.02),_0px_4px_2px_0px_rgba(0,_0,_0,_0.05),_0px_2px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(0,_0,_0,_0.03),_0px_0px_1px_0px_rgba(0,_0,_0,_0.04)]",
            "dark:shadow-[0px_-1px_3px_0px_rgba(0,_0,_0,_0.03),_0px_7px_2px_0px_rgba(0,_0,_0,_0.03),_0px_4px_2px_0px_rgba(0,_0,_0,_0.05),_0px_2px_1px_0px_rgba(0,_0,_0,_0.1),_0px_1px_1px_0px_rgba(0,_0,_0,_0.1),_0px_0px_1px_0px_rgba(0,_0,_0,_0.1)]"
          )}
        >
          <NavbarLinkBackground links={navItems.map((item) => item.href)} />
          {navItems.map(({ href, label }) => (
            <NavbarLink key={href} href={href}>
              {label}
            </NavbarLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavbarLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(location.pathname === href);
  }, [location.pathname, href]);

  return (
    <Link
      to={href}
      className={cn(
        "relative text-sm font-medium py-1 px-3 transition-colors duration-200 text-slate-12 w-[90px] flex items-center justify-center",
        active ? "opacity-100" : "opacity-30 hover:opacity-60"
      )}
    >
      {children}
    </Link>
  );
}

function NavbarLinkBackground({ links }: { links: string[] }) {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const index = links.indexOf(location.pathname);
    setActiveIndex(index >= 0 ? index : 0);
  }, [location.pathname, links]);

  return (
    <div
      className={cn(
        "absolute transition-all duration-200 ease-in-out h-7 rounded-full bg-slate-3"
      )}
      style={{
        width: "90px",
        left: `calc((${activeIndex} * 90px) + 4px)`,
      }}
    />
  );
}
