import { useState, useEffect } from "react";
import { Search, Filter, UserPlus, Users, Clock, Check, X, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getRoleVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROLE_LABELS, type Member, type Role, type RoleType } from "../../shared/types";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type TabKey = "all" | "pending" | "roles";

export default function Members() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const isAdmin = user?.roleId === "president" || user?.roleId === "vice_president";

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params: { status?: string; roleId?: string; search?: string } = {};
      if (filterStatus && filterStatus !== "all") params.status = filterStatus;
      if (filterRole) params.roleId = filterRole;
      if (searchQuery) params.search = searchQuery;
      const data = await api.members.list(params);
      setMembers(data);
    } catch (e) {
      console.error("Failed to fetch members:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPending = async () => {
    try {
      const data = await api.members.pending();
      setPendingMembers(data);
    } catch (e) {
      console.error("Failed to fetch pending members:", e);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await api.roles.list();
      setRoles(data);
    } catch (e) {
      console.error("Failed to fetch roles:", e);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (activeTab === "all") {
      fetchMembers();
    } else if (activeTab === "pending") {
      fetchPending();
    }
  }, [activeTab, searchQuery, filterRole, filterStatus]);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await api.members.approve(id);
      setPendingMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error("Failed to approve member:", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await api.members.reject(id);
      setPendingMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error("Failed to reject member:", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (id: number, roleId: string) => {
    setActionLoading(id);
    try {
      await api.members.updateRole(id, roleId);
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, roleId: roleId as RoleType } : m))
      );
    } catch (e) {
      console.error("Failed to update role:", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    setActionLoading(id);
    try {
      await api.members.updateActive(id, isActive);
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isActive } : m))
      );
    } catch (e) {
      console.error("Failed to update active status:", e);
    } finally {
      setActionLoading(null);
    }
  };

  const formatLastLogin = (dateStr: string) => {
    if (!dateStr) return "未知";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return "刚刚";
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString("zh-CN");
  };

  const tabs: { key: TabKey; label: string; icon: typeof Users }[] = [
    { key: "all", label: "全部成员", icon: Users },
    { key: "pending", label: "待审批", icon: Shield },
    { key: "roles", label: "职位管理", icon: Filter },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gold-gradient mb-1">
            成员管理
          </h1>
          <p className="text-night-300 text-sm">
            共 {members.length} 名成员 · {pendingMembers.length} 待审批
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4" />
              邀请成员
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.key
                      ? "bg-gold-500/15 text-gold-400 border border-gold-500/30"
                      : "text-night-300 hover:text-night-100 hover:bg-night-800/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.key === "pending" && pendingMembers.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                      {pendingMembers.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {activeTab === "all" && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg bg-night-900/50 border border-night-700/50">
                  <Search className="h-5 w-5 text-night-400" />
                  <input
                    type="text"
                    placeholder="搜索成员名称、职业..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-night-100 placeholder:text-night-400 text-sm"
                  />
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="select-field md:w-40"
                >
                  <option value="">全部职位</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {ROLE_LABELS[r.id]}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="select-field md:w-40"
                >
                  <option value="all">全部状态</option>
                  <option value="active">活跃</option>
                  <option value="inactive">不活跃</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    成员列表
                  </CardTitle>
                  <CardDescription>管理公会所有成员</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-16 text-center text-night-400">加载中...</div>
              ) : members.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gold-500/10">
                        <th className="text-left text-xs font-medium text-night-300 uppercase tracking-wider px-6 py-3">
                          成员
                        </th>
                        <th className="text-left text-xs font-medium text-night-300 uppercase tracking-wider px-6 py-3">
                          职位
                        </th>
                        <th className="text-left text-xs font-medium text-night-300 uppercase tracking-wider px-6 py-3">
                          等级
                        </th>
                        <th className="text-left text-xs font-medium text-night-300 uppercase tracking-wider px-6 py-3">
                          贡献度
                        </th>
                        <th className="text-left text-xs font-medium text-night-300 uppercase tracking-wider px-6 py-3">
                          状态
                        </th>
                        <th className="text-left text-xs font-medium text-night-300 uppercase tracking-wider px-6 py-3">
                          最后登录
                        </th>
                        <th className="text-right text-xs font-medium text-night-300 uppercase tracking-wider px-6 py-3">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-night-700/30">
                      {members.map((member) => (
                        <tr
                          key={member.id}
                          className="hover:bg-night-800/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-night-600 to-night-800 border border-gold-500/30 flex items-center justify-center font-display font-bold text-gold-400">
                                  {member.nickname.charAt(0)}
                                </div>
                                <div
                                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-night-900 ${
                                    member.isActive ? "bg-green-500" : "bg-night-500"
                                  }`}
                                />
                              </div>
                              <div>
                                <p className="font-medium text-night-50">
                                  {member.nickname}
                                </p>
                                <p className="text-xs text-night-400">
                                  {member.gameClass}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {isAdmin && actionLoading !== member.id ? (
                              <select
                                value={member.roleId}
                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                className="select-field text-xs py-1.5 px-2 w-auto"
                              >
                                {roles.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {ROLE_LABELS[r.id]}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Badge variant={getRoleVariant(member.roleId)}>
                                {ROLE_LABELS[member.roleId]}
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-night-100">Lv.{member.gameLevel}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gold-400 font-semibold">
                              {member.contribution.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={member.isActive ? "green" : "slate"}>
                              {member.isActive ? "活跃" : "不活跃"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1 text-night-300 text-sm">
                              <Clock className="h-3.5 w-3.5" />
                              {formatLastLogin(member.lastLoginAt)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  loading={actionLoading === member.id}
                                  onClick={() => handleToggleActive(member.id, !member.isActive)}
                                >
                                  {member.isActive ? "标记不活跃" : "标记活跃"}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="暂无成员"
                  description="邀请更多勇士加入你的公会吧"
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "pending" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                待审批申请
              </CardTitle>
              <CardDescription>审核新成员的入会申请</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {pendingMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gold-500/10">
                      <th className="text-left text-xs font-medium text-night-300 uppercase tracking-wider px-6 py-3">
                        申请人
                      </th>
                      <th className="text-left text-xs font-medium text-night-300 uppercase tracking-wider px-6 py-3">
                        职业
                      </th>
                      <th className="text-left text-xs font-medium text-night-300 uppercase tracking-wider px-6 py-3">
                        等级
                      </th>
                      <th className="text-left text-xs font-medium text-night-300 uppercase tracking-wider px-6 py-3">
                        申请时间
                      </th>
                      <th className="text-right text-xs font-medium text-night-300 uppercase tracking-wider px-6 py-3">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-night-700/30">
                    {pendingMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="hover:bg-night-800/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-night-600 to-night-800 border border-gold-500/30 flex items-center justify-center font-display font-bold text-gold-400">
                              {member.nickname.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-night-50">
                                {member.nickname}
                              </p>
                              <Badge variant="orange" className="mt-1">
                                待审核
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-night-100">{member.gameClass}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-night-100">Lv.{member.gameLevel}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-night-300 text-sm">
                            {new Date(member.joinedAt).toLocaleDateString("zh-CN")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="gold"
                              size="sm"
                              loading={actionLoading === member.id}
                              onClick={() => handleApprove(member.id)}
                              disabled={!isAdmin}
                            >
                              <Check className="h-4 w-4" />
                              通过
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              loading={actionLoading === member.id}
                              onClick={() => handleReject(member.id)}
                              disabled={!isAdmin}
                            >
                              <X className="h-4 w-4" />
                              拒绝
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="暂无待审批申请"
                description="所有申请都已处理完毕"
              />
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "roles" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                职位列表
              </CardTitle>
              <CardDescription>公会各职位的权限与说明</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role) => (
                <Card key={role.id} hoverable className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant={getRoleVariant(role.id)}>
                          {ROLE_LABELS[role.id]}
                        </Badge>
                      </div>
                      <span className="text-xs text-night-400">
                        {members.filter((m) => m.roleId === role.id).length} 人
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="text-xs px-2 py-1 rounded bg-night-800/80 text-night-300 border border-night-700/50"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
