import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function getTimeGreeting(): { greeting: string; sub: string } {
  const now = new Date();
  const hours = now.getHours();
  const day = now.toLocaleDateString("en-US", { weekday: "long" });

  let timeOfDay = "evening";
  if (hours < 12) timeOfDay = "morning";
  else if (hours < 17) timeOfDay = "afternoon";

  return {
    greeting: `${day}, ${timeOfDay}`,
    sub: "Ready to train?",
  };
}

