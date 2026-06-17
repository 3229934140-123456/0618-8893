import { useState, useEffect } from "react";
import { Search, Package, Plus, Filter, ArrowLeftRight, Check, X, PackageOpen, User, Clock, Calendar, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getQualityVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import {
  ITEM_QUALITY_LABELS,
  ITEM_CATEGORY_LABELS,
  BORROW_STATUS_LABELS,
} from "../../shared/types";
import type {
  ItemCategory,
  ItemQuality,
  WarehouseItem,
  BorrowRecord,
} from "../../shared/types";

const qualityBorderClass: Record<ItemQuality, string> = {
  common: "border-slate-400",
  uncommon: "border-green-500",
  rare: "border-blue-500",
  epic: "border-purple-500",
  legendary: "border-orange-500",
};

const qualityIconBgClass: Record<ItemQuality, string> = {
  common: "border-slate-400/50 bg-slate-500/10",
  uncommon: "border-green-500/50 bg-green-500/10",
  rare: "border-blue-500/50 bg-blue-500/10",
  epic: "border-purple-500/50 bg-purple-500/10",
  legendary: "border-orange-500/50 bg-orange-500/10",
};

const qualityIconTextClass: Record<ItemQuality, string> = {
  common: "text-slate-400",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-orange-400",
};

const qualityTextClass: Record<ItemQuality, string> = {
  common: "text-night-100",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-orange-400",
};

const borrowStatusVariant: Record<BorrowRecord["status"], string> = {
  pending: "badge-gold",
  approved: "badge-green",
  returned: "badge-slate",
  rejected: "badge-red",
  overdue: "badge-orange",
};

type TabType = "items" | "borrows";

export default function Warehouse() {
  const { user } = useAuthStore();
  const isAdmin =
    user?.roleId === "president" ||
    user?.roleId === "vice_president" ||
    user?.roleId === "leader";

  const [activeTab, setActiveTab] = useState<TabType>("items");
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterQuality, setFilterQuality] = useState<ItemQuality | "">("");
  const [filterCategory, setFilterCategory] = useState<ItemCategory | "">("");

  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WarehouseItem | null>(null);
  const [borrowQuantity, setBorrowQuantity] = useState(1);
  const [borrowPurpose, setBorrowPurpose] = useState("");
  const [borrowReturnDate, setBorrowReturnDate] = useState("");
  const [borrowLoading, setBorrowLoading] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<ItemCategory>("weapon");
  const [newItemQuality, setNewItemQuality] = useState<ItemQuality>("common");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemDescription, setNewItemDescription] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState<BorrowRecord | null>(null);
  const [approveReturnDate, setApproveReturnDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params: { category?: string; quality?: string; search?: string } = {};
      if (filterCategory) params.category = filterCategory;
      if (filterQuality) params.quality = filterQuality;
      if (searchQuery) params.search = searchQuery;
      const data = await api.warehouse.list(params);
      setItems(data);
    } catch (error) {
      console.error("获取物品列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBorrows = async () => {
    setLoading(true);
    try {
      const data = await api.warehouse.borrows();
      setBorrows(data);
    } catch (error) {
      console.error("获取借用记录失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "items") {
      fetchItems();
    } else {
      fetchBorrows();
    }
  }, [activeTab, filterQuality, filterCategory, searchQuery]);

  const categoryCount: Record<string, number> = {};
  items.forEach((item) => {
    categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
  });

  const openBorrowModal = (item: WarehouseItem) => {
    setSelectedItem(item);
    setBorrowQuantity(1);
    setBorrowPurpose("");
    const date = new Date();
    date.setDate(date.getDate() + 7);
    setBorrowReturnDate(date.toISOString().split("T")[0]);
    setBorrowModalOpen(true);
  };

  const handleApplyBorrow = async () => {
    if (!selectedItem || !borrowPurpose.trim()) return;
    setBorrowLoading(true);
    try {
      await api.warehouse.applyBorrow({
        itemId: selectedItem.id,
        quantity: borrowQuantity,
        purpose: borrowPurpose,
        expectedReturnAt: borrowReturnDate,
      });
      setBorrowModalOpen(false);
      fetchItems();
    } catch (error) {
      console.error("申请借用失败:", error);
    } finally {
      setBorrowLoading(false);
    }
  };

  const openAddModal = () => {
    setNewItemName("");
    setNewItemCategory("weapon");
    setNewItemQuality("common");
    setNewItemQuantity(1);
    setNewItemDescription("");
    setAddModalOpen(true);
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    setAddLoading(true);
    try {
      await api.warehouse.create({
        name: newItemName,
        category: newItemCategory,
        quality: newItemQuality,
        quantity: newItemQuantity,
        availableQuantity: newItemQuantity,
        description: newItemDescription,
      });
      setAddModalOpen(false);
      fetchItems();
    } catch (error) {
      console.error("新增物品失败:", error);
    } finally {
      setAddLoading(false);
    }
  };

  const openApproveModal = (record: BorrowRecord) => {
    setSelectedBorrow(record);
    setApproveReturnDate(record.expectedReturnAt.split("T")[0]);
    setApproveModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedBorrow) return;
    setActionLoading(true);
    try {
      await api.warehouse.approveBorrow(selectedBorrow.id, approveReturnDate);
      setApproveModalOpen(false);
      fetchBorrows();
    } catch (error) {
      console.error("审批失败:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async (id: number) => {
    setActionLoading(true);
    try {
      await api.warehouse.returnBorrow(id);
      fetchBorrows();
    } catch (error) {
      console.error("归还确认失败:", error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gold-gradient mb-1">
            公会仓库
          </h1>
          <p className="text-night-300 text-sm">
            管理公会共享的装备、材料和消耗品
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && activeTab === "items" && (
            <Button size="sm" onClick={openAddModal}>
              <Plus className="h-4 w-4" />
              存入物品
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-lg bg-night-800/50 w-fit border border-night-700/50">
        <button
          onClick={() => setActiveTab("items")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "items"
              ? "bg-gold-500/20 text-gold-400"
              : "text-night-300 hover:text-night-100"
          }`}
        >
          <Package className="h-4 w-4 inline-block mr-2" />
          物品列表
        </button>
        <button
          onClick={() => setActiveTab("borrows")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "borrows"
              ? "bg-gold-500/20 text-gold-400"
              : "text-night-300 hover:text-night-100"
          }`}
        >
          <ArrowLeftRight className="h-4 w-4 inline-block mr-2" />
          借用管理
        </button>
      </div>

      {activeTab === "items" ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {(Object.entries(ITEM_CATEGORY_LABELS) as [ItemCategory, string][]).map(([key, label]) => (
              <Card key={key} hoverable>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-night-400 mb-1">{label}</p>
                      <p className="text-xl font-bold text-night-50">
                        {categoryCount[key] || 0}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-night-700/50">
                      <Package className="h-4 w-4 text-night-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg bg-night-800/50 border border-night-700/50">
                  <Search className="h-5 w-5 text-night-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="搜索物品名称..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-night-100 placeholder:text-night-400 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterQuality}
                    onChange={(e) => setFilterQuality(e.target.value as ItemQuality | "")}
                    className="select-field text-sm"
                  >
                    <option value="">全部品质</option>
                    {(Object.entries(ITEM_QUALITY_LABELS) as [ItemQuality, string][]).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as ItemCategory | "")}
                    className="select-field text-sm"
                  >
                    <option value="">全部类型</option>
                    {(Object.entries(ITEM_CATEGORY_LABELS) as [ItemCategory, string][]).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    物品列表
                  </CardTitle>
                  <CardDescription>共 {items.length} 件物品</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-2 border-gold-500 border-t-transparent rounded-full" />
                </div>
              ) : items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      hoverable
                      className={`overflow-hidden border-l-4 ${qualityBorderClass[item.quality]}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border-2 ${qualityIconBgClass[item.quality]}`}
                          >
                            <Package className={`h-6 w-6 ${qualityIconTextClass[item.quality]}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold truncate ${qualityTextClass[item.quality]}`}>
                              {item.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getQualityVariant(item.quality)}>
                                {ITEM_QUALITY_LABELS[item.quality]}
                              </Badge>
                              <span className="text-xs text-night-400">
                                {ITEM_CATEGORY_LABELS[item.category]}
                              </span>
                            </div>
                          </div>
                        </div>

                        {item.description && (
                          <p className="text-xs text-night-300 mb-3 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-night-700/30">
                          <div>
                            <p className="text-xs text-night-400">库存</p>
                            <p className="font-semibold text-night-100">
                              <span
                                className={
                                  item.availableQuantity > 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                {item.availableQuantity}
                              </span>
                              <span className="text-night-500">
                                {" "}
                                / {item.quantity}
                              </span>
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={item.availableQuantity === 0}
                            onClick={() => openBorrowModal(item)}
                          >
                            申请借用
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="仓库空空如也"
                  description="存入第一件物品开始管理公会资源吧"
                />
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                借用管理
              </CardTitle>
              <CardDescription>管理所有物品借用申请和归还</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-gold-500 border-t-transparent rounded-full" />
              </div>
            ) : borrows.length > 0 ? (
              <div className="divide-y divide-night-700/30">
                {borrows.map((record) => (
                  <div key={record.id} className="p-4 hover:bg-night-800/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border-2 ${
                            record.itemQuality ? qualityIconBgClass[record.itemQuality] : "border-night-600/50 bg-night-700/30"
                          }`}
                        >
                          <PackageOpen
                            className={`h-5 w-5 ${
                              record.itemQuality ? qualityIconTextClass[record.itemQuality] : "text-night-300"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-semibold truncate ${
                              record.itemQuality ? qualityTextClass[record.itemQuality] : "text-night-100"
                            }`}>
                              {record.itemName}
                            </h4>
                            <span className={`badge ${borrowStatusVariant[record.status]}`}>
                              {BORROW_STATUS_LABELS[record.status]}
                            </span>
                          </div>
                          <p className="text-sm text-night-300 mb-2">
                            借用数量: <span className="text-night-100">{record.quantity}</span>
                            {" · "}
                            用途: {record.purpose}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-night-400">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {record.memberName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              申请: {new Date(record.appliedAt).toLocaleDateString("zh-CN")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              预计归还: {new Date(record.expectedReturnAt).toLocaleDateString("zh-CN")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isAdmin && record.status === "pending" && (
                          <>
                            <Button size="sm" variant="gold" onClick={() => openApproveModal(record)}>
                              <Check className="h-4 w-4" />
                              审批
                            </Button>
                          </>
                        )}
                        {record.status === "approved" && (
                          <Button size="sm" variant="outline" onClick={() => handleReturn(record.id)}>
                            <Check className="h-4 w-4" />
                            确认归还
                          </Button>
                        )}
                        {record.status === "overdue" && (
                          <Badge variant="orange">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            已逾期
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="暂无借用记录"
                description="有成员申请借用后将显示在这里"
              />
            )}
          </CardContent>
        </Card>
      )}

      <Modal
        open={borrowModalOpen}
        onClose={() => setBorrowModalOpen(false)}
        title="申请借用"
        description={selectedItem?.name}
        footer={
          <>
            <Button variant="ghost" onClick={() => setBorrowModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleApplyBorrow} loading={borrowLoading}>
              提交申请
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedItem && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-night-800/50">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 ${qualityIconBgClass[selectedItem.quality]}`}>
                <Package className={`h-5 w-5 ${qualityIconTextClass[selectedItem.quality]}`} />
              </div>
              <div>
                <p className={`font-semibold ${qualityTextClass[selectedItem.quality]}`}>
                  {selectedItem.name}
                </p>
                <p className="text-xs text-night-400">
                  可借数量: <span className="text-green-400">{selectedItem.availableQuantity}</span>
                </p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm text-night-200 mb-2">借用数量</label>
            <input
              type="number"
              min={1}
              max={selectedItem?.availableQuantity || 1}
              value={borrowQuantity}
              onChange={(e) => setBorrowQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-night-200 mb-2">预计归还日期</label>
            <input
              type="date"
              value={borrowReturnDate}
              onChange={(e) => setBorrowReturnDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-night-200 mb-2">借用用途</label>
            <textarea
              rows={3}
              value={borrowPurpose}
              onChange={(e) => setBorrowPurpose(e.target.value)}
              placeholder="请说明借用用途..."
              className="input-field resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="存入物品"
        description="向公会仓库添加新物品"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddItem} loading={addLoading}>
              存入
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-night-200 mb-2">物品名称</label>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="请输入物品名称"
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-night-200 mb-2">物品类型</label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as ItemCategory)}
                className="select-field w-full"
              >
                {(Object.entries(ITEM_CATEGORY_LABELS) as [ItemCategory, string][]).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-night-200 mb-2">物品品质</label>
              <select
                value={newItemQuality}
                onChange={(e) => setNewItemQuality(e.target.value as ItemQuality)}
                className="select-field w-full"
              >
                {(Object.entries(ITEM_QUALITY_LABELS) as [ItemQuality, string][]).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-night-200 mb-2">数量</label>
            <input
              type="number"
              min={1}
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-night-200 mb-2">物品描述</label>
            <textarea
              rows={3}
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              placeholder="请输入物品描述（可选）"
              className="input-field resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="审批借用申请"
        description={selectedBorrow?.itemName}
        footer={
          <>
            <Button variant="ghost" onClick={() => setApproveModalOpen(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={() => setApproveModalOpen(false)} loading={actionLoading}>
              <X className="h-4 w-4" />
              拒绝
            </Button>
            <Button onClick={handleApprove} loading={actionLoading}>
              <Check className="h-4 w-4" />
              通过
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedBorrow && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-night-400" />
                <span className="text-night-300">申请人:</span>
                <span className="text-night-100 font-medium">{selectedBorrow.memberName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-night-400" />
                <span className="text-night-300">物品:</span>
                <span className="text-night-100 font-medium">{selectedBorrow.itemName}</span>
              </div>
              <div className="flex items-center gap-2">
                <PackageOpen className="h-4 w-4 text-night-400" />
                <span className="text-night-300">数量:</span>
                <span className="text-night-100 font-medium">{selectedBorrow.quantity}</span>
              </div>
              <div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-night-400 mt-0.5" />
                  <span className="text-night-300">用途:</span>
                </div>
                <p className="text-night-100 mt-1 pl-6">{selectedBorrow.purpose}</p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm text-night-200 mb-2">确认归还日期</label>
            <input
              type="date"
              value={approveReturnDate}
              onChange={(e) => setApproveReturnDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
