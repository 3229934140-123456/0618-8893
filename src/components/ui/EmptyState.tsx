import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Scroll } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Scroll,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="mb-6 p-4 rounded-full bg-gold-500/10 border border-gold-500/20">
        <Icon className="h-12 w-12 text-gold-400" />
      </div>
      <h3 className="font-display text-lg font-semibold text-gold-gradient mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-night-200 max-w-sm mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
