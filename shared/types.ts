export interface Guild {
  id: number;
  name: string;
  logo: string;
  description: string;
  createdAt: string;
  level: number;
  memberCount: number;
  presidentId: number;
}

export type RoleType = "president" | "vice_president" | "leader" | "member";

export interface Role {
  id: RoleType;
  name: string;
  permissions: string[];
  color: string;
}

export interface Member {
  id: number;
  nickname: string;
  avatar: string;
  gameClass: string;
  gameLevel: number;
  roleId: RoleType;
  contribution: number;
  joinedAt: string;
  lastLoginAt: string;
  isActive: boolean;
  status: "approved" | "pending" | "rejected";
}

export interface MemberWithRole extends Member {
  roleName?: string;
  roleColor?: string;
}

export interface Activity {
  id: number;
  title: string;
  dungeonName: string;
  maxMembers: number;
  classRequirements: Record<string, number>;
  startTime: string;
  endTime?: string;
  note?: string;
  createdBy: number;
  status: "upcoming" | "ongoing" | "finished" | "cancelled";
  signups?: ActivitySignup[];
}

export interface ActivitySignup {
  id: number;
  activityId: number;
  memberId: number;
  nickname?: string;
  avatar?: string;
  gameClass: string;
  confirmed: boolean;
  remark?: string;
  signedUpAt: string;
}

export type ItemQuality =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export type ItemCategory =
  | "weapon"
  | "armor"
  | "accessory"
  | "material"
  | "consumable"
  | "resource";

export interface WarehouseItem {
  id: number;
  name: string;
  category: ItemCategory;
  quality: ItemQuality;
  quantity: number;
  availableQuantity: number;
  description?: string;
  icon?: string;
  addedAt: string;
}

export interface BorrowRecord {
  id: number;
  itemId: number;
  itemName?: string;
  itemQuality?: ItemQuality;
  memberId: number;
  memberName?: string;
  memberAvatar?: string;
  quantity: number;
  purpose: string;
  expectedReturnAt: string;
  status: "pending" | "approved" | "returned" | "rejected" | "overdue";
  appliedAt: string;
  approvedAt?: string;
  returnedAt?: string;
  approvedBy?: number;
}

export interface ContributionRecord {
  id: number;
  memberId: number;
  memberName?: string;
  memberAvatar?: string;
  amount: number;
  type: "activity" | "donate" | "reward" | "penalty";
  description: string;
  createdAt: string;
  relatedId?: number;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  targetRoles: RoleType[];
  createdBy: number;
  creatorName?: string;
  createdAt: string;
  readBy: number[];
  isRead?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ActivityStats {
  activeMembers: number;
  inactiveMembers: number;
  pendingApplications: number;
  weeklyTrend: { date: string; active: number }[];
}

export interface RankingMember {
  id: number;
  nickname: string;
  avatar: string;
  contribution: number;
  rank: number;
  roleId: RoleType;
}

export const GAME_CLASSES = [
  "战士",
  "圣骑士",
  "猎人",
  "盗贼",
  "牧师",
  "死亡骑士",
  "萨满",
  "法师",
  "术士",
  "武僧",
  "德鲁伊",
  "恶魔猎手",
];

export const ITEM_QUALITY_LABELS: Record<ItemQuality, string> = {
  common: "普通",
  uncommon: "优秀",
  rare: "稀有",
  epic: "史诗",
  legendary: "传说",
};

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  weapon: "武器",
  armor: "护甲",
  accessory: "饰品",
  material: "材料",
  consumable: "消耗品",
  resource: "资源",
};

export const ROLE_LABELS: Record<RoleType, string> = {
  president: "会长",
  vice_president: "副会长",
  leader: "组长",
  member: "成员",
};

export const ACTIVITY_STATUS_LABELS: Record<Activity["status"], string> = {
  upcoming: "即将开始",
  ongoing: "进行中",
  finished: "已结束",
  cancelled: "已取消",
};

export const BORROW_STATUS_LABELS: Record<BorrowRecord["status"], string> = {
  pending: "待审批",
  approved: "借用中",
  returned: "已归还",
  rejected: "已拒绝",
  overdue: "已逾期",
};
