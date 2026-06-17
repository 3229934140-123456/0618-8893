import * as React from "react";
import { cn } from "@/lib/utils";
import type { ItemQuality, RoleType } from "../../../shared/types";

type BadgeVariant =
  | "gold"
  | "magic"
  | "green"
  | "red"
  | "orange"
  | "slate"
  | "quality-common"
  | "quality-uncommon"
  | "quality-rare"
  | "quality-epic"
  | "quality-legendary"
  | "role-president"
  | "role-vice_president"
  | "role-leader"
  | "role-member";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  gold: "badge-gold",
  magic: "badge-magic",
  green: "badge-green",
  red: "badge-red",
  orange: "badge-orange",
  slate: "badge-slate",
  "quality-common": "badge-slate",
  "quality-uncommon": "badge-green",
  "quality-rare":
    "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  "quality-epic":
    "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  "quality-legendary":
    "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  "role-president": "badge-gold",
  "role-vice_president": "badge-magic",
  "role-leader":
    "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  "role-member": "badge-slate",
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "slate", ...props }, ref) => (
    <span
      ref={ref}
      className={cn("badge", variantClasses[variant], className)}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

function getQualityVariant(quality: ItemQuality): BadgeVariant {
  return `quality-${quality}` as BadgeVariant;
}

function getRoleVariant(roleId: RoleType): BadgeVariant {
  return `role-${roleId}` as BadgeVariant;
}

export { Badge, getQualityVariant, getRoleVariant };
export type { BadgeVariant };
