import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  ChevronDown,
  Shield,
  User as UserIcon,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Badge, getRoleVariant } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ROLE_LABELS } from "../../../shared/types";
import type { RoleType } from "../../../shared/types";
import { cn } from "@/lib/utils";

interface QuickLoginMember {
  id: number;
  nickname: string;
  avatar: string;
  gameClass: string;
  gameLevel: number;
  roleId: RoleType;
  password: string;
}

export function Header() {
  const navigate = useNavigate();
  const { user, logout, getAvailableMembers } = useAuthStore();
  const { guild } = useAppStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [members, setMembers] = useState<QuickLoginMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setMembersLoading(true);
        const list = await getAvailableMembers();
        if (!cancelled) {
          setMembers(list);
        }
      } catch (e) {
        console.error("Failed to load members:", e);
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAvailableMembers]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/login");
  };

  return (
    <header className="h-16 border-b border-gold-500/10 bg-night-900/60 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-xl font-bold text-gold-gradient flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold-400" />
          {guild.name} - 公会管理系统
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRoleModalOpen(true)}
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          切换角色
        </Button>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-lg hover:bg-night-700/50 transition-colors"
          >
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.nickname}
                className="w-9 h-9 rounded-lg border-2 border-gold-500/40 bg-night-800"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-night-900" />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-medium text-night-50 truncate max-w-[120px]">
                {user.nickname}
              </span>
              <Badge variant={getRoleVariant(user.roleId)} className="text-[10px] py-0 px-1.5">
                {ROLE_LABELS[user.roleId]}
              </Badge>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-night-300 transition-transform",
                userMenuOpen && "rotate-180"
              )}
            />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 glass-card shadow-card z-20 overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-gold-500/10">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.nickname}
                      className="w-12 h-12 rounded-xl border-2 border-gold-500/40 bg-night-800"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-night-50 truncate">
                        {user.nickname}
                      </p>
                      <p className="text-xs text-night-300">
                        {user.gameClass} · Lv.{user.gameLevel}
                      </p>
                      <div className="mt-1">
                        <Badge variant={getRoleVariant(user.roleId)}>
                          {ROLE_LABELS[user.roleId]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 pt-3 space-y-1">
                  <div className="flex justify-between text-sm text-night-200 py-1">
                    <span>贡献度</span>
                    <span className="text-gold-400 font-semibold">
                      {user.contribution.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="p-3 pt-0 border-t border-gold-500/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="切换登录角色"
        description="选择不同的成员账号登录体验不同权限"
      >
        <div className="space-y-2">
          {membersLoading ? (
            <div className="py-8 text-center text-night-400">加载中...</div>
          ) : (
            members.map((member) => (
              <button
                key={member.id}
                onClick={() => {
                  useAuthStore.getState().loginAs(member.id);
                  setRoleModalOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  user.id === member.id
                    ? "bg-gold-500/10 border-gold-500/40"
                    : "border-night-600/30 hover:border-gold-500/30 hover:bg-night-700/30"
                )}
              >
                <img
                  src={member.avatar}
                  alt={member.nickname}
                  className="w-10 h-10 rounded-lg border border-gold-500/30 bg-night-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-night-50 truncate">
                      {member.nickname}
                    </span>
                    <Badge variant={getRoleVariant(member.roleId)}>
                      {ROLE_LABELS[member.roleId]}
                    </Badge>
                  </div>
                  <p className="text-xs text-night-300">
                    {member.gameClass} · Lv.{member.gameLevel}
                  </p>
                </div>
                {user.id === member.id && (
                  <UserIcon className="h-4 w-4 text-gold-400 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </Modal>
    </header>
  );
}
