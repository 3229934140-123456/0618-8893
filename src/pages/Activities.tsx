import { useState, useEffect } from "react";
import { Calendar, Plus, Users, Clock, MapPin, X, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import {
  ACTIVITY_STATUS_LABELS,
  GAME_CLASSES,
  type Activity,
  type ActivitySignup,
} from "../../shared/types";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type TabKey = "upcoming" | "ongoing" | "finished" | "all";

const statusConfig = {
  upcoming: { label: "即将开始", variant: "gold" as const },
  ongoing: { label: "进行中", variant: "green" as const },
  finished: { label: "已结束", variant: "slate" as const },
  cancelled: { label: "已取消", variant: "red" as const },
};

export default function Activities() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [signupLoading, setSignupLoading] = useState<number | null>(null);
  const [confirmLoading, setConfirmLoading] = useState<number | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [signupClass, setSignupClass] = useState(user?.gameClass || "");
  const [signupRemark, setSignupRemark] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    dungeonName: "",
    maxMembers: 10,
    classRequirements: {} as Record<string, number>,
    startTime: "",
    note: "",
  });

  const isAdmin = user?.roleId === "president" || user?.roleId === "vice_president" || user?.roleId === "leader";

  const tabs: { key: TabKey; label: string }[] = [
    { key: "upcoming", label: "即将开始" },
    { key: "ongoing", label: "进行中" },
    { key: "finished", label: "已结束" },
    { key: "all", label: "全部" },
  ];

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = activeTab !== "all" ? { status: activeTab } : undefined;
      const data = await api.activities.list(params);
      setActivities(data);
    } catch (e) {
      console.error("Failed to fetch activities:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [activeTab]);

  const handleCreateActivity = async () => {
    if (!formData.title || !formData.dungeonName || !formData.startTime) {
      alert("请填写完整信息");
      return;
    }
    setActionLoading(-1);
    try {
      await api.activities.create({
        title: formData.title,
        dungeonName: formData.dungeonName,
        maxMembers: formData.maxMembers,
        classRequirements: formData.classRequirements,
        startTime: new Date(formData.startTime).toISOString(),
        note: formData.note,
      });
      setCreateModalOpen(false);
      setFormData({
        title: "",
        dungeonName: "",
        maxMembers: 10,
        classRequirements: {},
        startTime: "",
        note: "",
      });
      fetchActivities();
    } catch (e) {
      console.error("Failed to create activity:", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenDetail = async (activity: Activity) => {
    setSelectedActivity(activity);
    setDetailModalOpen(true);
  };

  const handleSignup = async (activityId: number) => {
    if (!signupClass) {
      alert("请选择职业");
      return;
    }
    setSignupLoading(activityId);
    try {
      await api.activities.signup(activityId, {
        gameClass: signupClass,
        remark: signupRemark || undefined,
      });
      setSignupModalOpen(false);
      setSignupRemark("");
      fetchActivities();
      if (selectedActivity?.id === activityId) {
        const updated = await api.activities.list();
        const found = updated.find((a) => a.id === activityId);
        if (found) setSelectedActivity(found);
      }
    } catch (e) {
      console.error("Failed to signup:", e);
    } finally {
      setSignupLoading(null);
    }
  };

  const handleCancelSignup = async (activityId: number) => {
    if (!confirm("确定要取消报名吗？")) return;
    setSignupLoading(activityId);
    try {
      await api.activities.cancelSignup(activityId);
      fetchActivities();
      if (selectedActivity?.id === activityId) {
        const updated = await api.activities.list();
        const found = updated.find((a) => a.id === activityId);
        if (found) setSelectedActivity(found);
      }
    } catch (e) {
      console.error("Failed to cancel signup:", e);
    } finally {
      setSignupLoading(null);
    }
  };

  const handleConfirmSignup = async (activityId: number, signupIds: number[]) => {
    setConfirmLoading(activityId);
    try {
      await api.activities.confirm(activityId, signupIds);
      fetchActivities();
      if (selectedActivity?.id === activityId) {
        const updated = await api.activities.list();
        const found = updated.find((a) => a.id === activityId);
        if (found) setSelectedActivity(found);
      }
    } catch (e) {
      console.error("Failed to confirm signup:", e);
    } finally {
      setConfirmLoading(null);
    }
  };

  const hasUserSignedUp = (activity: Activity) => {
    if (!user || !activity.signups) return false;
    return activity.signups.some((s) => s.memberId === user.id);
  };

  const getUserSignup = (activity: Activity) => {
    if (!user || !activity.signups) return null;
    return activity.signups.find((s) => s.memberId === user.id) || null;
  };

  const addClassRequirement = () => {
    setFormData((prev) => ({
      ...prev,
      classRequirements: { ...prev.classRequirements, "战士": 1 },
    }));
  };

  const updateClassRequirement = (oldClass: string, newClass: string, count: number) => {
    setFormData((prev) => {
      const newReq = { ...prev.classRequirements };
      delete newReq[oldClass];
      if (count > 0) {
        newReq[newClass] = count;
      }
      return { ...prev, classRequirements: newReq };
    });
  };

  const removeClassRequirement = (cls: string) => {
    setFormData((prev) => {
      const newReq = { ...prev.classRequirements };
      delete newReq[cls];
      return { ...prev, classRequirements: newReq };
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statsCount = {
    upcoming: activities.filter((a) => a.status === "upcoming").length,
    ongoing: activities.filter((a) => a.status === "ongoing").length,
    finished: activities.filter((a) => a.status === "finished").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gold-gradient mb-1">
            活动中心
          </h1>
          <p className="text-night-300 text-sm">
            组织并参与公会的各类活动
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            创建活动
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gold-500/15 text-gold-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-night-300 text-sm">即将开始</p>
                <p className="text-2xl font-bold text-night-50">
                  {statsCount.upcoming}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-green-500/15 text-green-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-night-300 text-sm">进行中</p>
                <p className="text-2xl font-bold text-night-50">
                  {statsCount.ongoing}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-magic-500/15 text-magic-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-night-300 text-sm">已结束</p>
                <p className="text-2xl font-bold text-night-50">
                  {statsCount.finished}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeTab === tab.key
                    ? "bg-gold-500/15 text-gold-400 border border-gold-500/30"
                    : "text-night-300 hover:text-night-100 hover:bg-night-800/50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              活动列表
            </CardTitle>
            <CardDescription>查看和参与公会活动</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-16 text-center text-night-400">加载中...</div>
          ) : activities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map((activity) => {
                const signupCount = activity.signups?.length || 0;
                const userSignedUp = hasUserSignedUp(activity);
                const userSignup = getUserSignup(activity);

                return (
                  <Card
                    key={activity.id}
                    hoverable
                    className="overflow-hidden"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-night-50 mb-1">
                            {activity.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-night-400">
                            <MapPin className="h-3 w-3" />
                            {activity.dungeonName}
                          </div>
                        </div>
                        <Badge variant={statusConfig[activity.status].variant}>
                          {statusConfig[activity.status].label}
                        </Badge>
                      </div>

                      {activity.note && (
                        <p className="text-sm text-night-300 mb-3 p-2 rounded bg-night-800/50">
                          📝 {activity.note}
                        </p>
                      )}

                      {Object.keys(activity.classRequirements || {}).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {(Object.entries(activity.classRequirements) as [string, number][]).map(([cls, count]) => (
                            <Badge key={cls} variant="magic">
                              {cls as string} ×{count as number}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-night-700/30">
                        <div className="flex items-center gap-4 text-sm text-night-300">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(activity.startTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {signupCount}/{activity.maxMembers}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDetail(activity)}
                          >
                            详情
                          </Button>
                          {activity.status === "upcoming" && (
                            userSignedUp ? (
                              <Button
                                size="sm"
                                variant="danger"
                                loading={signupLoading === activity.id}
                                onClick={() => handleCancelSignup(activity.id)}
                              >
                                取消报名
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="gold"
                                loading={signupLoading === activity.id}
                                onClick={() => {
                                  setSelectedActivity(activity);
                                  setSignupClass(user?.gameClass || "");
                                  setSignupRemark("");
                                  setSignupModalOpen(true);
                                }}
                                disabled={signupCount >= activity.maxMembers}
                              >
                                {userSignup?.confirmed ? "已确认" : "报名参加"}
                              </Button>
                            )
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="h-1.5 bg-night-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold-gradient rounded-full transition-all"
                            style={{
                              width: `${Math.min((signupCount / activity.maxMembers) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="暂无活动"
              description="创建第一个公会活动吧"
            />
          )}
        </CardContent>
      </Card>

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="创建活动"
        description="组织一次新的公会冒险"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
              取消
            </Button>
            <Button
              variant="gold"
              loading={actionLoading === -1}
              onClick={handleCreateActivity}
            >
              创建活动
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-night-200 mb-1.5">
              活动标题
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="如：冰冠堡垒 - 英雄难度"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-night-200 mb-1.5">
                副本名称
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="如：冰冠堡垒"
                value={formData.dungeonName}
                onChange={(e) => setFormData({ ...formData, dungeonName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-night-200 mb-1.5">
                人数上限
              </label>
              <input
                type="number"
                className="input-field"
                min={1}
                max={100}
                value={formData.maxMembers}
                onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 10 })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-night-200 mb-1.5">
              开始时间
            </label>
            <input
              type="datetime-local"
              className="input-field"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-night-200">
                职业要求
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addClassRequirement}
              >
                <Plus className="h-3.5 w-3.5" />
                添加
              </Button>
            </div>
            <div className="space-y-2">
              {(Object.entries(formData.classRequirements) as [string, number][]).map(([cls, count]) => (
                <div key={cls} className="flex items-center gap-2">
                  <select
                    className="select-field flex-1"
                    value={cls}
                    onChange={(e) => updateClassRequirement(cls, e.target.value, count)}
                  >
                    {GAME_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="input-field w-20"
                    min={0}
                    value={count}
                    onChange={(e) => updateClassRequirement(cls, cls, parseInt(e.target.value) || 0)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeClassRequirement(cls)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {Object.keys(formData.classRequirements).length === 0 && (
                <p className="text-sm text-night-400 py-2">暂无职业要求</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-night-200 mb-1.5">
              备注
            </label>
            <textarea
              className="input-field min-h-[80px] resize-y"
              placeholder="活动注意事项、集合地点等"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={signupModalOpen}
        onClose={() => setSignupModalOpen(false)}
        title="活动报名"
        description={`报名参加：${selectedActivity?.title}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSignupModalOpen(false)}>
              取消
            </Button>
            <Button
              variant="gold"
              loading={signupLoading === selectedActivity?.id}
              onClick={() => selectedActivity && handleSignup(selectedActivity.id)}
            >
              确认报名
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-night-200 mb-1.5">
              参加职业
            </label>
            <select
              className="select-field"
              value={signupClass}
              onChange={(e) => setSignupClass(e.target.value)}
            >
              <option value="">请选择职业</option>
              {GAME_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-night-200 mb-1.5">
              备注（可选）
            </label>
            <textarea
              className="input-field min-h-[80px] resize-y"
              placeholder="特殊说明等"
              value={signupRemark}
              onChange={(e) => setSignupRemark(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedActivity?.title}
        description={selectedActivity ? `${selectedActivity.dungeonName} · ${formatTime(selectedActivity.startTime)}` : ""}
        size="lg"
      >
        {selectedActivity && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Badge variant={statusConfig[selectedActivity.status].variant}>
                {ACTIVITY_STATUS_LABELS[selectedActivity.status]}
              </Badge>
              <span className="text-sm text-night-300">
                人数：{selectedActivity.signups?.length || 0}/{selectedActivity.maxMembers}
              </span>
            </div>

            {selectedActivity.note && (
              <div className="p-3 rounded-lg bg-night-800/50 border border-night-700/50">
                <p className="text-sm text-night-200">📝 {selectedActivity.note}</p>
              </div>
            )}

            {Object.keys(selectedActivity.classRequirements || {}).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-night-200 mb-2">职业要求</h4>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(selectedActivity.classRequirements).map(([cls, count]) => (
                    <Badge key={cls} variant="magic">
                      {cls} ×{count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-night-200">
                  报名名单 ({selectedActivity.signups?.length || 0})
                </h4>
                {isAdmin && selectedActivity.status === "upcoming" && (
                  <Button
                    size="sm"
                    variant="gold"
                    loading={confirmLoading === selectedActivity.id}
                    onClick={() => {
                      const unconfirmedIds = selectedActivity.signups
                        ?.filter((s) => !s.confirmed)
                        .map((s) => s.id) || [];
                      if (unconfirmedIds.length > 0) {
                        handleConfirmSignup(selectedActivity.id, unconfirmedIds);
                      }
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                    全部确认
                  </Button>
                )}
              </div>
              {selectedActivity.signups && selectedActivity.signups.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {selectedActivity.signups.map((signup: ActivitySignup) => (
                    <div
                      key={signup.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-night-800/50 border border-night-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-night-600 to-night-800 border border-gold-500/30 flex items-center justify-center font-display font-bold text-gold-400 text-sm">
                          {(signup.nickname || "?").charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-night-50 text-sm">
                            {signup.nickname}
                          </p>
                          <p className="text-xs text-night-400">
                            {signup.gameClass}
                            {signup.remark && ` · ${signup.remark}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={signup.confirmed ? "green" : "orange"}>
                          {signup.confirmed ? "已确认" : "待确认"}
                        </Badge>
                        {isAdmin && !signup.confirmed && selectedActivity.status === "upcoming" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConfirmSignup(selectedActivity.id, [signup.id])}
                          >
                            <Check className="h-3.5 w-3.5" />
                            确认
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-night-400 text-sm">
                  暂无报名人员
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
