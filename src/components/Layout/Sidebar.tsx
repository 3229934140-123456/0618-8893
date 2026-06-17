import { NavLink } from "react-router-dom";
import {
  Home,
  Users,
  Calendar,
  Package,
  Trophy,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Swords,
} from "lucide-react";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { to: "/", label: "公会总览", icon: Home },
  { to: "/members", label: "成员管理", icon: Users },
  { to: "/activities", label: "活动中心", icon: Calendar },
  { to: "/warehouse", label: "公会仓库", icon: Package },
  { to: "/contribution", label: "贡献度", icon: Trophy },
  { to: "/announcements", label: "公告板", icon: ScrollText },
];

export function Sidebar() {
  const { guild, sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "h-screen flex flex-col border-r border-gold-500/10 bg-night-900/80 backdrop-blur-xl transition-all duration-300",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gold-500/10 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 text-night-900 text-xl font-bold">
            <Swords className="h-5 w-5" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-display text-lg font-bold text-gold-gradient truncate">
                {guild.name}
              </span>
              <span className="text-xs text-night-300">Lv.{guild.level}</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gold-500/15 text-gold-300 border border-gold-500/30 shadow-gold"
                  : "text-night-200 hover:bg-night-700/50 hover:text-night-50 border border-transparent"
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gold-500/10 shrink-0">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-night-300 hover:bg-night-700/50 hover:text-night-50 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">收起菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
