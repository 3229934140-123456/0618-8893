import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Swords, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, getRoleVariant } from "@/components/ui/Badge";
import { useAuthStore, QUICK_LOGIN_MEMBERS } from "@/store/auth";
import { ROLE_LABELS } from "../../shared/types";

interface QuickLoginMember {
  id: number;
  nickname: string;
  avatar: string;
  gameClass: string;
  gameLevel: number;
  roleId: "president" | "vice_president" | "leader" | "member";
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAs, getAvailableMembers } = useAuthStore();
  const [nickname, setNickname] = useState("龙腾九天");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(true);
  const [error, setError] = useState("");
  const [members, setMembers] = useState<QuickLoginMember[]>(
    QUICK_LOGIN_MEMBERS.map(({ password: _password, ...rest }) => rest)
  );

  const from = (location.state as { from?: Location })?.from?.pathname || "/";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setMembersLoading(true);
        const list = await getAvailableMembers();
        if (!cancelled) {
          setMembers(
            list.map(({ password: _password, ...rest }) => rest)
          );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const success = await login(nickname, password);
    setLoading(false);

    if (success) {
      navigate(from, { replace: true });
    } else {
      setError("账号或密码错误，请重试");
    }
  };

  const handleQuickLogin = async (memberId: number) => {
    setLoading(true);
    setError("");
    const success = await loginAs(memberId);
    setLoading(false);
    if (success) {
      navigate(from, { replace: true });
    } else {
      setError("快速登录失败，请重试");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-night-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-magic-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-night-900 mb-4 shadow-gold animate-float">
            <Swords className="h-10 w-10" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gold-gradient mb-2">
            暗影黎明
          </h1>
          <p className="text-night-300 text-sm">公会管理系统</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-night-100 mb-1.5">
                角色名称
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="input-field"
                placeholder="请输入角色名称"
                autoFocus
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-night-100 mb-1.5">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="请输入密码"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-night-300 hover:text-night-100"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm py-2 px-3 bg-red-500/10 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              <ShieldCheck className="h-4 w-4" />
              进入公会
            </Button>
          </form>

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gold-500/20" />
              <span className="text-xs text-night-400">快速登录（演示用）</span>
              <div className="flex-1 h-px bg-gold-500/20" />
            </div>

            {membersLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 text-gold-400 animate-spin" />
                <span className="ml-2 text-sm text-night-400">加载成员列表...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleQuickLogin(member.id)}
                    disabled={loading}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-night-600/30 hover:border-gold-500/30 hover:bg-night-700/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-9 h-9 rounded-lg border border-gold-500/30 bg-night-800 flex items-center justify-center text-xl">
                      {member.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-night-50 truncate text-sm">
                          {member.nickname}
                        </span>
                        <Badge variant={getRoleVariant(member.roleId)}>
                          {ROLE_LABELS[member.roleId]}
                        </Badge>
                      </div>
                      <p className="text-xs text-night-400">
                        {member.gameClass} · Lv.{member.gameLevel}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-night-400 text-center mt-3">
              默认密码：123456
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
