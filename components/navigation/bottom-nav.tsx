"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, UtensilsCrossed, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Train", href: "/workout", icon: Dumbbell },
  { label: "Diet", href: "/diet", icon: UtensilsCrossed },
  { label: "Progress", href: "/progress", icon: TrendingUp },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[398px] z-50">
      <div className="glass-nav rounded-full py-2.5 px-4 flex justify-around items-center shadow-2xl">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/home" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-200 cursor-pointer py-1 px-3 rounded-full",
                isActive
                  ? "text-lime scale-105 font-medium"
                  : "text-text-dimmer hover:text-text-dim"
              )}
            >
              <Icon className="w-5 h-5 transition-transform" />
              <span className="text-[10px] tracking-wide font-inter">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

