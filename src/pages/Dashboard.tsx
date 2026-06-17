import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Package,
  Trophy,
  TrendingUp,
  Clock,
  Shield,
  Gem,
  Swords,
  Loader2,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/store/auth";
import { useAppStore } from "@/store";
import { api } from "@/lib/api";
import {
  ROLE_LABELS,
  ACTIVITY_STATUS_LABELS,
  type Guild,
  type Activity as ActivityType,
  type RankingMember,
  type ActivityStats,
} from "../../shared/types";

function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = date.getHours().toString().padStart(2, "0");
      const mins = date.getMinutes().toString().padStart(2, "0");
      return `今天 ${hours}:${mins}`;
    } else if (diffDays === 1) {
      const hours = date.getHours().toString().padStart(2, "0");
      const mins = date.getMinutes().toString().padStart(2, "0");
      return `昨天 ${hours}:${mins}`;
    } else {
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${month}-${day}`;
    }
  } catch {
    return dateStr;
  }
}

function getActivityBadgeVariant(status: ActivityType["status"]): "gold" | "green" | "slate" | "red" {
  switch (status) {
    case "upcoming":
      return "gold";
    case "ongoing":
      return "green";
    case "finished":
      return "slate";
    case "cancelled":
      return "red";
    default:
      return "slate";
  }
}

function SkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2 w-full">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-6 w-24" />
            <div className="skeleton h-3 w-16" />
          </div>
          <div className="skeleton h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonActivity() {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-night-800/50 border border-night-700/50">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-lg" />
        <div className="space-y-1.5">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-3 w-20" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="space-y-1 text-right">
          <div className="skeleton h-3 w-12" />
          <div className="skeleton h-3 w-8" />
        </div>
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

function SkeletonRanking() {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg">
      <div className="skeleton w-7 h-7 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-3 w-16" />
      </div>
      <div className="skeleton h-4 w-16" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { guild, setGuild } = useAppStore();

  const [loadingGuild, setLoadingGuild] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [ranking, setRanking] = useState<RankingMember[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadingGuild(true);
        const guildData = await api.guild.get();
        if (!cancelled) {
          setGuild(guildData);
        }
      } catch (e) {
        console.error("Failed to load guild:", e);
        if (!cancelled) setError("加载公会信息失败");
      } finally {
        if (!cancelled) setLoadingGuild(false);
      }
    })();

    (async () => {
      try {
        setLoadingActivities(true);
        const data = await api.activities.list();
        if (!cancelled) {
          const sorted = [...data]
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
            .slice(0, 3);
          setActivities(sorted);
        }
      } catch (e) {
        console.error("Failed to load activities:", e);
      } finally {
        if (!cancelled) setLoadingActivities(false);
      }
    })();

    (async () => {
      try {
        setLoadingRanking(true);
        const data = await api.contributions.ranking();
        if (!cancelled) {
          setRanking(data.slice(0, 5));
        }
      } catch (e) {
        console.error("Failed to load ranking:", e);
      } finally {
        if (!cancelled) setLoadingRanking(false);
      }
    })();

    (async () => {
      try {
        setLoadingStats(true);
        const data = await api.stats.activity();
        if (!cancelled) {
          setStats(data);
        }
      } catch (e) {
        console.error("Failed to load stats:", e);
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setGuild]);

  const statCards = [
    {
      label: "公会成员",
      value: stats ? `${stats.activeMembers + stats.inactiveMembers}` : "--",
      icon: Users,
      variant: "gold" as const,
      loading: loadingStats,
      change: stats ? `活跃 ${stats.activeMembers}` : undefined,
    },
    {
      label: "本周活动",
      value: activities.length > 0 ? `${activities.length}` : "--",
      icon: Calendar,
      variant: "magic" as const,
      loading: loadingActivities,
    },
    {
      label: "待审批申请",
      value: stats ? `${stats.pendingApplications}` : "--",
      icon: Package,
      variant: "green" as const,
      loading: loadingStats,
    },
    {
      label: "总贡献度",
      value: ranking.length > 0 ? ranking.reduce((sum, m) => sum + m.contribution, 0).toLocaleString() : "--",
      icon: Trophy,
      variant: "orange" as const,
      loading: loadingRanking,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gold-gradient mb-1">
            公会总览
          </h1>
          <p className="text-night-300 text-sm">
            欢迎回来，{user?.nickname}！{user && ROLE_LABELS[user.roleId]}大人
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Clock className="h-4 w-4" />
            活动日历
          </Button>
          <Button size="sm">
            <Shield className="h-4 w-4" />
            创建活动
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm py-2 px-3 bg-red-500/10 rounded-lg border border-red-500/20">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) =>
          stat.loading ? (
            <SkeletonCard key={stat.label} />
          ) : (
            <Card key={stat.label} hoverable className={`delay-${index + 1}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-night-300 text-sm mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-night-50">{stat.value}</p>
                    {stat.change && (
                      <div className="flex items-center gap-1 mt-1">
                        <Activity className="h-3 w-3 text-gold-400" />
                        <span className="text-xs text-night-400">{stat.change}</span>
                      </div>
                    )}
                    {!stat.change && (
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="h-3 w-3 text-green-400" />
                        <span className="text-xs text-green-400">正常运行</span>
                      </div>
                    )}
                  </div>
                  <div
                    className={`p-2.5 rounded-lg ${
                      stat.variant === "gold"
                        ? "bg-gold-500/15 text-gold-400"
                        : stat.variant === "magic"
                        ? "bg-magic-500/15 text-magic-400"
                        : stat.variant === "green"
                        ? "bg-green-500/15 text-green-400"
                        : "bg-orange-500/15 text-orange-400"
                    }`}
                  >
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  近期活动
                </CardTitle>
                <CardDescription>查看并参与公会活动</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                查看全部
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingActivities ? (
              <div className="space-y-3">
                <SkeletonActivity />
                <SkeletonActivity />
                <SkeletonActivity />
              </div>
            ) : activities.length === 0 ? (
              <EmptyState
                title="暂无活动"
                description="点击右上角创建第一个公会活动"
              />
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-night-800/50 border border-night-700/50 hover:border-gold-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-magic-500/20 to-magic-600/20 border border-magic-500/30 flex items-center justify-center">
                        <Swords className="h-5 w-5 text-magic-400" />
                      </div>
                      <div>
                        <p className="font-medium text-night-50">{activity.title}</p>
                        <p className="text-xs text-night-300">
                          {activity.dungeonName} · {formatDateTime(activity.startTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-night-50">
                          {activity.signups?.length || 0}/{activity.maxMembers}
                        </p>
                        <p className="text-xs text-night-400">成员</p>
                      </div>
                      <Badge variant={getActivityBadgeVariant(activity.status)}>
                        {ACTIVITY_STATUS_LABELS[activity.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gem className="h-5 w-5" />
                贡献排行榜
              </CardTitle>
              <CardDescription>贡献度最高的成员</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loadingRanking ? (
              <div className="space-y-2">
                <SkeletonRanking />
                <SkeletonRanking />
                <SkeletonRanking />
                <SkeletonRanking />
                <SkeletonRanking />
              </div>
            ) : ranking.length === 0 ? (
              <EmptyState
                title="暂无排行数据"
                description="等待成员贡献记录"
              />
            ) : (
              <div className="space-y-2">
                {ranking.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-night-800/50 transition-colors"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        member.rank === 1
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-night-900"
                          : member.rank === 2
                          ? "bg-gradient-to-br from-slate-300 to-slate-500 text-night-900"
                          : member.rank === 3
                          ? "bg-gradient-to-br from-orange-500 to-orange-700 text-white"
                          : "bg-night-700 text-night-300"
                      }`}
                    >
                      {member.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-night-50 truncate">
                        {member.nickname}
                      </p>
                      <p className="text-xs text-night-400">
                        {ROLE_LABELS[member.roleId]}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gold-400">
                      {member.contribution.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>公会介绍</CardTitle>
              <CardDescription>公会基本信息</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingGuild ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="skeleton h-3 w-20" />
                  <div className="skeleton h-5 w-32" />
                </div>
                <div className="space-y-2">
                  <div className="skeleton h-3 w-20" />
                  <div className="skeleton h-5 w-20" />
                </div>
                <div className="space-y-2">
                  <div className="skeleton h-3 w-20" />
                  <div className="skeleton h-5 w-20" />
                </div>
              </div>
              <div className="gold-divider my-6" />
              <div className="space-y-2">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-5/6" />
                <div className="skeleton h-4 w-4/6" />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-night-300">公会名称</p>
                  <p className="font-semibold text-night-50">{guild.name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-night-300">公会等级</p>
                  <p className="font-semibold text-night-50">Lv.{guild.level}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-night-300">成员数量</p>
                  <p className="font-semibold text-night-50">
                    {guild.memberCount || (stats ? stats.activeMembers + stats.inactiveMembers : 0)} 人
                  </p>
                </div>
              </div>
              <div className="gold-divider my-6" />
              <div className="space-y-2">
                <p className="text-sm text-night-300">公会简介</p>
                <p className="text-night-100 leading-relaxed">{guild.description}</p>
              </div>
              {!guild.description && (
                <EmptyState
                  title="暂无公会介绍"
                  description="会长可以设置公会介绍信息"
                />
              )}
              {stats && stats.weeklyTrend && stats.weeklyTrend.length > 0 && (
                <>
                  <div className="gold-divider my-6" />
                  <div className="space-y-3">
                    <p className="text-sm text-night-300">近7日活跃度趋势</p>
                    <div className="flex items-end justify-between gap-2 h-24">
                      {stats.weeklyTrend.map((item, idx) => {
                        const maxActive = Math.max(...stats.weeklyTrend.map((d) => d.active), 1);
                        const height = Math.max((item.active / maxActive) * 100, 8);
                        const date = new Date(item.date);
                        const dayLabels = ["日", "一", "二", "三", "四", "五", "六"];
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs text-night-400">{item.active}</span>
                            <div
                              className="w-full rounded-t-md bg-gradient-to-t from-gold-600/50 to-gold-400/80 transition-all"
                              style={{ height: `${height}%` }}
                            />
                            <span className="text-xs text-night-400">
                              {dayLabels[date.getDay()]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
