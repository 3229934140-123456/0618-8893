import { useState, useEffect } from "react";
import { Trophy, TrendingUp, TrendingDown, Gift, Calendar, Plus, Medal, Crown, Award, User } from "lucide-react";
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
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import type {
  RankingMember,
  ContributionRecord,
} from "../../shared/types";
import { ROLE_LABELS } from "../../shared/types";

const typeConfig = {
  activity: { label: "活动", variant: "gold" as const, icon: Calendar },
  donate: { label: "捐献", variant: "green" as const, icon: Gift },
  reward: { label: "奖励", variant: "magic" as const, icon: Trophy },
  penalty: { label: "处罚", variant: "red" as const, icon: TrendingDown },
};

export default function Contribution() {
  const [ranking, setRanking] = useState<RankingMember[]>([]);
  const [records, setRecords] = useState<ContributionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [donateResource, setDonateResource] = useState("");
  const [donateQuantity, setDonateQuantity] = useState(1);
  const [donateLoading, setDonateLoading] = useState(false);

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const data = await api.contributions.ranking({ month: selectedMonth });
      setRanking(data);
    } catch (error) {
      console.error("获取贡献排行榜失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const data = await api.contributions.list();
      setRecords(data);
    } catch (error) {
      console.error("获取贡献记录失败:", error);
    }
  };

  useEffect(() => {
    fetchRanking();
    fetchRecords();
  }, [selectedMonth]);

  const totalContribution = ranking.reduce((sum, m) => sum + m.contribution, 0);
  const activeMembers = ranking.length;
  const avgContribution = activeMembers > 0 ? Math.round(totalContribution / activeMembers) : 0;

  const topThree = ranking.slice(0, 3);
  const restRanking = ranking.slice(3);

  const handleDonate = async () => {
    if (!donateResource.trim() || donateQuantity <= 0) return;
    setDonateLoading(true);
    try {
      await api.contributions.donate({
        resource: donateResource,
        quantity: donateQuantity,
      });
      setDonateModalOpen(false);
      setDonateResource("");
      setDonateQuantity(1);
      fetchRanking();
      fetchRecords();
    } catch (error) {
      console.error("捐献失败:", error);
    } finally {
      setDonateLoading(false);
    }
  };

  const getAvatarInitial = (name: string) => name.charAt(0);

  const podiumClasses = [
    "order-2 lg:order-2",
    "order-1 lg:order-1",
    "order-3 lg:order-3",
  ];

  const podiumHeights = [
    "h-32",
    "h-40",
    "h-24",
  ];

  const podiumGradients = [
    "from-slate-400 to-slate-600",
    "from-yellow-400 to-amber-600",
    "from-orange-500 to-orange-700",
  ];

  const podiumIconColors = [
    "text-slate-200",
    "text-yellow-100",
    "text-orange-200",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gold-gradient mb-1">
            贡献度系统
          </h1>
          <p className="text-night-300 text-sm">
            查看公会成员的贡献度排行和变动记录
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input-field text-sm w-auto"
          />
          <Button onClick={() => setDonateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            资源捐献
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-night-300 text-sm mb-1">公会总贡献</p>
                <p className="text-2xl font-bold text-gold-400">
                  {totalContribution.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-gold-500/15 text-gold-400">
                <Trophy className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-night-300 text-sm mb-1">活跃成员</p>
                <p className="text-2xl font-bold text-night-50">
                  {activeMembers}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-magic-500/15 text-magic-400">
                <User className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-night-300 text-sm mb-1">人均贡献</p>
                <p className="text-2xl font-bold text-night-50">
                  {avgContribution.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-500/15 text-blue-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-night-300 text-sm mb-1">本月记录</p>
                <p className="text-2xl font-bold text-green-400">
                  {records.length}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-green-500/15 text-green-400">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              月度贡献排行榜
            </CardTitle>
            <CardDescription>{selectedMonth} 贡献度排名</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-gold-500 border-t-transparent rounded-full" />
            </div>
          ) : ranking.length > 0 ? (
            <div className="space-y-8">
              {topThree.length > 0 && (
                <div className="flex items-end justify-center gap-4 py-8">
                  {topThree.map((member, index) => {
                    const PodiumIcon = [Medal, Crown, Award][index];
                    return (
                      <div
                        key={member.id}
                        className={`flex flex-col items-center ${podiumClasses[index]}`}
                      >
                        <div className="relative mb-4">
                          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-night-600 to-night-800 border-2 ${index === 1 ? "border-gold-400 shadow-gold" : "border-gold-500/30"} flex items-center justify-center font-display font-bold text-2xl ${index === 1 ? "text-gold-400" : "text-night-200"}`}>
                            {getAvatarInitial(member.nickname)}
                          </div>
                          <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br ${podiumGradients[index]} flex items-center justify-center shadow-lg`}>
                            <PodiumIcon className={`h-4 w-4 ${podiumIconColors[index]}`} />
                          </div>
                        </div>
                        <p className="font-semibold text-night-50 text-center mb-1 truncate max-w-24">
                          {member.nickname}
                        </p>
                        <Badge variant={getRoleVariant(member.roleId)} className="mb-3">
                          {ROLE_LABELS[member.roleId]}
                        </Badge>
                        <p className="font-display text-xl font-bold text-gold-400 mb-3">
                          {member.contribution.toLocaleString()}
                        </p>
                        <div
                          className={`w-24 rounded-t-lg bg-gradient-to-t ${podiumGradients[index]} ${podiumHeights[index]} flex items-start justify-center pt-3 shadow-lg`}
                        >
                          <span className="font-display text-2xl font-bold text-night-900">
                            {member.rank}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {restRanking.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-gold-500/10">
                  {restRanking.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-night-800/30 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 bg-night-700 text-night-300">
                        {member.rank}
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-night-600 to-night-800 border border-gold-500/30 flex items-center justify-center font-display font-bold text-gold-400 shrink-0">
                        {getAvatarInitial(member.nickname)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-night-50 truncate">
                          {member.nickname}
                        </p>
                        <Badge variant={getRoleVariant(member.roleId)}>
                          {ROLE_LABELS[member.roleId]}
                        </Badge>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-gold-400">
                          {member.contribution.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="暂无排行数据"
              description="成员参与活动后将显示排行"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              贡献度变动记录
            </CardTitle>
            <CardDescription>最近的贡献度变动</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {records.length > 0 ? (
            <div className="divide-y divide-night-700/30">
              {records.map((record) => {
                const config = typeConfig[record.type];
                return (
                  <div
                    key={record.id}
                    className="flex items-center gap-3 p-4 hover:bg-night-800/30 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        record.type === "activity"
                          ? "bg-gold-500/15 text-gold-400"
                          : record.type === "donate"
                          ? "bg-green-500/15 text-green-400"
                          : record.type === "reward"
                          ? "bg-magic-500/15 text-magic-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      <config.icon className="h-4 w-4" />
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-night-600 to-night-800 border border-gold-500/30 flex items-center justify-center font-display font-bold text-gold-400 shrink-0">
                      {record.memberName ? getAvatarInitial(record.memberName) : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-night-50 truncate">
                          {record.memberName || "未知用户"}
                        </p>
                        <Badge variant={config.variant}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-night-400 truncate">
                        {record.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-semibold ${
                          record.amount >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {record.amount >= 0 ? "+" : ""}
                        {record.amount}
                      </p>
                      <p className="text-xs text-night-400">
                        {new Date(record.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="暂无变动记录"
              description="贡献度变动将在此显示"
            />
          )}
        </CardContent>
      </Card>

      <Modal
        open={donateModalOpen}
        onClose={() => setDonateModalOpen(false)}
        title="资源捐献"
        description="向公会捐献资源以获得贡献度"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDonateModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleDonate} loading={donateLoading}>
              <Gift className="h-4 w-4" />
              确认捐献
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gold-500/10 border border-gold-500/20">
            <div className="flex items-center gap-2 text-gold-400 text-sm">
              <Trophy className="h-4 w-4" />
              <span>捐献资源将根据稀有度获得相应贡献度奖励</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-night-200 mb-2">资源名称</label>
            <input
              type="text"
              value={donateResource}
              onChange={(e) => setDonateResource(e.target.value)}
              placeholder="例如：奥术水晶、强效治疗药水"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-night-200 mb-2">捐献数量</label>
            <input
              type="number"
              min={1}
              value={donateQuantity}
              onChange={(e) => setDonateQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
