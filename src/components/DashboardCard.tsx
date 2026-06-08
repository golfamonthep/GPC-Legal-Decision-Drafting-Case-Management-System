import { cn } from "../lib/utils";
import { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
  className?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function DashboardCard({
  title,
  value,
  icon,
  description,
  className,
  trend,
  trendValue,
}: DashboardCardProps) {
  return (
    <div className={cn("bg-white rounded-lg shadow-sm border border-slate-200 p-5", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {trendValue && (
          <span
            className={cn(
              "text-xs font-medium",
              trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-slate-500"
            )}
          >
            {trend === "up" ? "↑" : trend === "down" ? "↓" : ""} {trendValue}
          </span>
        )}
      </div>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
    </div>
  );
}
