import { useState, useEffect } from "react";
import { ScrollText, Pin, Plus, Clock, User, Eye, ChevronDown, ChevronUp, Send } from "lucide-react";
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
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { ROLE_LABELS } from "../../shared/types";
import type { Announcement, RoleType } from "../../shared/types";

export default function Announcements() {
  const { user } = useAuthStore();
  const canCreate =
    user?.roleId === "president" ||
    user?.roleId === "vice_president" ||
    user?.roleId === "leader";

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [newTargetRoles, setNewTargetRoles] = useState<RoleType[]>([
    "president",
    "vice_president",
    "leader",
    "member",
  ]);
  const [createLoading, setCreateLoading] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await api.announcements.list();
      setAnnouncements(data);
    } catch (error) {
      console.error("获取公告列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const pinned = announcements.filter((a) => a.isPinned);
  const normal = announcements.filter((a) => !a.isPinned);
  const unreadCount = announcements.filter((a) => !a.isRead).length;

  const handleMarkRead = async (id: number) => {
    try {
      await api.announcements.markRead(id);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
      );
    } catch (error) {
      console.error("标记已读失败:", error);
    }
  };

  const handleToggleExpand = (announcement: Announcement) => {
    if (!announcement.isRead) {
      handleMarkRead(announcement.id);
    }
    setExpandedId(expandedId === announcement.id ? null : announcement.id);
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setCreateLoading(true);
    try {
      await api.announcements.create({
        title: newTitle,
        content: newContent,
        isPinned: newIsPinned,
        targetRoles: newTargetRoles,
      });
      setCreateModalOpen(false);
      setNewTitle("");
      setNewContent("");
      setNewIsPinned(false);
      setNewTargetRoles(["president", "vice_president", "leader", "member"]);
      fetchAnnouncements();
    } catch (error) {
      console.error("发布公告失败:", error);
    } finally {
      setCreateLoading(false);
    }
  };

  const toggleTargetRole = (role: RoleType) => {
    setNewTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const renderUnreadDot = () => (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gold-gradient mb-1 flex items-center gap-2">
            公告板
            {unreadCount > 0 && (
              <Badge variant="red">{unreadCount} 条未读</Badge>
            )}
          </h1>
          <p className="text-night-300 text-sm">
            查看公会最新通知和公告
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            发布公告
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-gold-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-night-100 flex items-center gap-2">
                <Pin className="h-5 w-5 text-gold-400" />
                置顶公告
              </h2>
              {pinned.map((announcement) => (
                <Card
                  key={announcement.id}
                  className={`border-gold-500/30 shadow-gold cursor-pointer transition-all ${
                    !announcement.isRead ? "ring-1 ring-gold-500/20" : ""
                  }`}
                  onClick={() => handleToggleExpand(announcement)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-gold-500/15 text-gold-400 shrink-0 mt-0.5">
                          <Pin className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-lg text-gold-gradient">
                              {announcement.title}
                            </h3>
                            {!announcement.isRead && renderUnreadDot()}
                            <Badge variant="gold">置顶</Badge>
                          </div>
                          <p
                            className={`text-night-200 leading-relaxed whitespace-pre-wrap ${
                              expandedId !== announcement.id ? "line-clamp-2" : ""
                            }`}
                          >
                            {announcement.content}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        {expandedId === announcement.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {(expandedId === announcement.id || !announcement.isRead) && (
                      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-night-700/30">
                        <div className="flex items-center gap-2 text-sm text-night-300">
                          <User className="h-4 w-4" />
                          <span>{announcement.creatorName}</span>
                          {announcement.targetRoles && announcement.targetRoles.length > 0 && announcement.targetRoles[0] && (
                            <Badge variant={getRoleVariant(announcement.targetRoles[0])}>
                              {ROLE_LABELS[announcement.targetRoles[0]]}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-night-400">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(announcement.createdAt).toLocaleString("zh-CN")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-night-400">
                          <Eye className="h-4 w-4" />
                          <span>{announcement.readBy?.length || 0} 人已读</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ScrollText className="h-5 w-5" />
                  全部公告
                </CardTitle>
                <CardDescription>共 {normal.length} 条公告</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {normal.length > 0 ? (
                <div className="divide-y divide-night-700/30">
                  {normal.map((announcement) => (
                    <div
                      key={announcement.id}
                      className={`p-5 hover:bg-night-800/30 transition-colors cursor-pointer ${
                        !announcement.isRead ? "bg-night-800/20" : ""
                      }`}
                      onClick={() => handleToggleExpand(announcement)}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {!announcement.isRead && renderUnreadDot()}
                          <h3
                            className={`font-medium truncate ${
                              !announcement.isRead
                                ? "text-night-50"
                                : "text-night-200"
                            }`}
                          >
                            {announcement.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-night-400">
                            {new Date(announcement.createdAt).toLocaleDateString("zh-CN")}
                          </span>
                          {expandedId === announcement.id ? (
                            <ChevronUp className="h-4 w-4 text-night-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-night-400" />
                          )}
                        </div>
                      </div>
                      <p
                        className={`text-sm text-night-300 mb-3 ${
                          expandedId !== announcement.id ? "line-clamp-2" : ""
                        }`}
                      >
                        {announcement.content}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-night-400">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {announcement.creatorName}
                        </span>
                        {announcement.targetRoles && announcement.targetRoles.length > 0 && announcement.targetRoles[0] && (
                          <Badge variant={getRoleVariant(announcement.targetRoles[0])}>
                            {ROLE_LABELS[announcement.targetRoles[0]]}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {announcement.readBy?.length || 0} 人已读
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="暂无公告"
                  description="公会的重要通知将在这里展示"
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="发布公告"
        description="向公会成员发布新公告"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} loading={createLoading}>
              <Send className="h-4 w-4" />
              发布
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-night-200 mb-2">公告标题</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="请输入公告标题"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-night-200 mb-2">公告内容</label>
            <textarea
              rows={5}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="请输入公告内容..."
              className="input-field resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newIsPinned}
                onChange={(e) => setNewIsPinned(e.target.checked)}
                className="w-4 h-4 rounded border-night-600 bg-night-800 text-gold-500 focus:ring-gold-500 focus:ring-offset-0"
              />
              <span className="text-sm text-night-200">置顶公告</span>
            </label>
          </div>
          <div>
            <label className="block text-sm text-night-200 mb-2">可见范围</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ROLE_LABELS) as RoleType[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleTargetRole(role)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    newTargetRoles.includes(role)
                      ? "bg-gold-500/20 text-gold-400 border border-gold-500/30"
                      : "bg-night-800/50 text-night-400 border border-night-700/50 hover:border-night-600"
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
