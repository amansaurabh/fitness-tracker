import React from "react";
import { BottomNav } from "@/components/navigation/bottom-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col flex-1 pb-16">
      {children}
      <BottomNav />
    </div>
  );
}

