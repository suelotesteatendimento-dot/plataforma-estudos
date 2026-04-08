import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  suffix?: string;
  trend?: { value: number; label: string };
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  suffix,
  trend,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold leading-none">{value}</p>
              {suffix && (
                <span className="text-xs text-muted-foreground">{suffix}</span>
              )}
            </div>
            {trend && (
              <p
                className={cn(
                  "text-xs",
                  trend.value > 0 ? "text-green-600" : "text-muted-foreground"
                )}
              >
                {trend.value > 0 ? `+${trend.value}` : trend.value} {trend.label}
              </p>
            )}
          </div>
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              iconBg
            )}
          >
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
