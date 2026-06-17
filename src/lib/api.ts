import type {
  Guild,
  Member,
  Role,
  Activity,
  ActivitySignup,
  WarehouseItem,
  BorrowRecord,
  ContributionRecord,
  Announcement,
  ApiResponse,
  ActivityStats,
  RankingMember,
} from "../../shared/types";

const API_BASE = "/api";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("guild-auth-token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = (await res.json()) as ApiResponse<T>;

  if (!data.success) {
    throw new Error(data.error || data.message || "请求失败");
  }

  return data.data as T;
}

export const api = {
  auth: {
    login: (identifier: string | number, password?: string) =>
      request<{ token: string; member: Member }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(
          typeof identifier === "number"
            ? { memberId: identifier }
            : { nickname: identifier, password }
        ),
      }),
    register: (data: {
      nickname: string;
      gameClass: string;
      gameLevel: number;
      message?: string;
    }) =>
      request<Member>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  guild: {
    get: () => request<Guild>("/guild"),
    update: (data: Partial<Guild>) =>
      request<Guild>("/guild", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  members: {
    list: (params?: { status?: string; roleId?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.status) query.set("status", params.status);
      if (params?.roleId) query.set("roleId", params.roleId);
      if (params?.search) query.set("search", params.search);
      return request<Member[]>(
        `/members${query.toString() ? `?${query.toString()}` : ""}`
      );
    },
    pending: () => request<Member[]>("/members/pending"),
    approve: (id: number) =>
      request<Member>(`/members/${id}/approve`, { method: "PUT" }),
    reject: (id: number) =>
      request<Member>(`/members/${id}/reject`, { method: "PUT" }),
    updateRole: (id: number, roleId: string) =>
      request<Member>(`/members/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ roleId }),
      }),
    updateActive: (id: number, isActive: boolean) =>
      request<Member>(`/members/${id}/active`, {
        method: "PUT",
        body: JSON.stringify({ isActive }),
      }),
    apply: (data: {
      nickname: string;
      gameClass: string;
      gameLevel: number;
      message?: string;
    }) =>
      request<Member>("/members/applications", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  roles: {
    list: () => request<Role[]>("/members/roles"),
  },

  activities: {
    list: (params?: { status?: string }) => {
      const query = new URLSearchParams();
      if (params?.status) query.set("status", params.status);
      return request<Activity[]>(
        `/activities${query.toString() ? `?${query.toString()}` : ""}`
      );
    },
    create: (data: Partial<Activity>) =>
      request<Activity>("/activities", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<Activity>) =>
      request<Activity>(`/activities/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    signup: (id: number, data: { gameClass: string; remark?: string }) =>
      request<ActivitySignup>(`/activities/${id}/signup`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    cancelSignup: (id: number) =>
      request<void>(`/activities/${id}/signup`, { method: "DELETE" }),
    confirm: (id: number, signupIds: number[]) =>
      request<Activity>(`/activities/${id}/confirm`, {
        method: "PUT",
        body: JSON.stringify({ signupIds }),
      }),
  },

  warehouse: {
    list: (params?: { category?: string; quality?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.category) query.set("category", params.category);
      if (params?.quality) query.set("quality", params.quality);
      if (params?.search) query.set("search", params.search);
      return request<WarehouseItem[]>(
        `/warehouse${query.toString() ? `?${query.toString()}` : ""}`
      );
    },
    create: (data: Partial<WarehouseItem>) =>
      request<WarehouseItem>("/warehouse", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<WarehouseItem>) =>
      request<WarehouseItem>(`/warehouse/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    borrows: (params?: { status?: string }) => {
      const query = new URLSearchParams();
      if (params?.status) query.set("status", params.status);
      return request<BorrowRecord[]>(
        `/warehouse/borrows${query.toString() ? `?${query.toString()}` : ""}`
      );
    },
    applyBorrow: (data: {
      itemId: number;
      quantity: number;
      purpose: string;
      expectedReturnAt: string;
    }) =>
      request<BorrowRecord>("/warehouse/borrows", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    approveBorrow: (id: number, expectedReturnAt?: string) =>
      request<BorrowRecord>(`/warehouse/borrows/${id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ expectedReturnAt }),
      }),
    returnBorrow: (id: number) =>
      request<BorrowRecord>(`/warehouse/borrows/${id}/return`, {
        method: "PUT",
      }),
  },

  contributions: {
    list: (params?: { memberId?: number; type?: string }) => {
      const query = new URLSearchParams();
      if (params?.memberId) query.set("memberId", String(params.memberId));
      if (params?.type) query.set("type", params.type);
      return request<ContributionRecord[]>(
        `/contributions${query.toString() ? `?${query.toString()}` : ""}`
      );
    },
    ranking: (params?: { month?: string }) => {
      const query = new URLSearchParams();
      if (params?.month) query.set("month", params.month);
      return request<RankingMember[]>(
        `/contributions/ranking${query.toString() ? `?${query.toString()}` : ""}`
      );
    },
    create: (data: {
      memberId: number;
      amount: number;
      type: string;
      description: string;
    }) =>
      request<ContributionRecord>("/contributions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    donate: (data: { resource: string; quantity: number }) =>
      request<ContributionRecord>("/contributions/donate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  announcements: {
    list: () => request<Announcement[]>("/announcements"),
    create: (data: {
      title: string;
      content: string;
      isPinned?: boolean;
      targetRoles?: string[];
    }) =>
      request<Announcement>("/announcements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    markRead: (id: number) =>
      request<Announcement>(`/announcements/${id}/read`, { method: "PUT" }),
  },

  stats: {
    activity: () => request<ActivityStats>("/stats/activity"),
  },
};
