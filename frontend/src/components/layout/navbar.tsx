import { JSX, SVGProps } from "react";
import BoltIcon from "../icons/bolt.icon";
import CrownIcon from "../icons/crown.icon";
import HomeIcon from "../icons/home.icon";
import LeaguesIcon from "../icons/leagues.icon";
import ProfileIcon from "../icons/profile.icon";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NavItems = [
  {
    title: "Home",
    href: "/",
    Icon: HomeIcon,
  },
  {
    title: "Leagues",
    href: "/leagues",
    Icon: LeaguesIcon,
  },
  {
    title: "Live",
    href: "/live",
    Icon: BoltIcon,
  },
  {
    title: "Ranking",
    href: "/ranking",
    Icon: CrownIcon,
  },
  {
    title: "Profile",
    href: "/profile",
    Icon: ProfileIcon,
  },
];

interface NavItemProps {
  title: string;
  href: string;
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
  isActive: boolean;
}

const NavItem = (props: NavItemProps) => {
  return (
    <Link
      href={props.href}
      style={{
        boxShadow: props.isActive
          ? "0px -4px 0px 0px #0000003D inset, 0px 4px 0px 0px #FFFFFF29 inset"
          : "none",
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-[0.5rem] w-full h-full cursor-pointer",
        {
          "text-white bg-gray-800": props.isActive,
          "text-gray-400 background": !props.isActive,
        }
      )}
    >
      <props.Icon />
      <p
        className={cn(
          "text-white text-sm font-[700] tracking-[0.04em] leading-[100%] uppercase",
          {
            "text-white": props.isActive,
            "text-gray-400": !props.isActive,
          }
        )}
      >
        {props.title}
      </p>
    </Link>
  );
};

const NavBar = () => {
  const pathname = usePathname();

  return (
    <div className="flex items-center  h-[4rem] w-full max-w-[26.875rem] fixed bottom-0 bg-background">
      {NavItems.map((item) => (
        <NavItem
          isActive={pathname.includes(item.href)}
          key={item.title}
          {...item}
        />
      ))}
    </div>
  );
};

export default NavBar;
