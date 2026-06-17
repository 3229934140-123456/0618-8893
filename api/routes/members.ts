import { Router, type Request, type Response } from 'express';
import { getDb, toCamelCase, toCamelCaseArray, formatDateTime } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import type { Member, MemberWithRole, Role, ApiResponse } from '../../shared/types.js';

const router = Router();

const ROLE_ORDER: Record<string, number> = {
  president: 1,
  vice_president: 2,
  leader: 3,
  member: 4,
};

function joinMemberWithRole(member: any, role: any): MemberWithRole {
  return toCamelCase<MemberWithRole>({
    ...member,
    role_name: role?.name,
    role_color: role?.color,
    is_active: member.is_active === 1 || member.is_active === true,
  });
}

router.get('/roles', (req: Request, res: Response): void => {
  const db = getDb();
  const rows = db.query('role', {
    orderBy: (a: any, b: any) => (ROLE_ORDER[a.id] ?? 99) - (ROLE_ORDER[b.id] ?? 99),
  }) as Record<string, any>[];

  const roles = toCamelCaseArray<Role>(rows).map(r => ({
    ...r,
    permissions: JSON.parse(String((r as any).permissions || '[]')),
  }));

  res.json({
    success: true,
    data: roles,
  } as ApiResponse<Role[]>);
});

router.get('/', (req: Request, res: Response): void => {
  const { status, roleId } = req.query;

  const db = getDb();
  const roles = db.getTable('role');
  const roleMap = new Map(roles.map((r: any) => [r.id, r]));

  let members = db.getTable('member') as any[];

  const filterStatus = status && typeof status === 'string' ? status : 'approved';
  members = members.filter(m => m.status === filterStatus);

  if (roleId && typeof roleId === 'string') {
    members = members.filter(m => m.role_id === roleId);
  }

  members.sort((a, b) => {
    const roleDiff = (ROLE_ORDER[a.role_id] ?? 99) - (ROLE_ORDER[b.role_id] ?? 99);
    if (roleDiff !== 0) return roleDiff;
    return b.contribution - a.contribution;
  });

  const result = members.map(m => joinMemberWithRole(m, roleMap.get(m.role_id)));

  res.json({
    success: true,
    data: result,
  } as ApiResponse<MemberWithRole[]>);
});

router.get('/pending', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  if (member.roleId !== 'president' && member.roleId !== 'vice_president' && member.roleId !== 'leader') {
    res.status(403).json({
      success: false,
      error: '没有权限查看待审批申请',
    } as ApiResponse<any>);
    return;
  }

  const db = getDb();
  const rows = db.query('member', {
    where: (m: any) => m.status === 'pending',
    orderBy: (a: any, b: any) => b.last_login_at.localeCompare(a.last_login_at),
  }) as Record<string, any>[];

  const members = toCamelCaseArray<Member>(rows).map(m => ({
    ...m,
    isActive: (m as any).isActive === 1 || (m as any).isActive === true,
  }));

  res.json({
    success: true,
    data: members,
  } as ApiResponse<Member[]>);
});

router.post('/applications', (req: Request, res: Response): void => {
  const { nickname, gameClass, avatar } = req.body;

  if (!nickname || !gameClass) {
    res.status(400).json({
      success: false,
      error: '昵称和职业不能为空',
    } as ApiResponse<any>);
    return;
  }

  const db = getDb();
  const existing = db.find('member', (m: any) => m.nickname === nickname);

  if (existing) {
    res.status(400).json({
      success: false,
      error: '昵称已存在',
    } as ApiResponse<any>);
    return;
  }

  const defaultAvatars = ['🦸', '🧙', '🧝', '🧛', '🥷', '👸', '🤴', '🦹'];
  const useAvatar = avatar || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

  const result = db.insert('member', {
    nickname,
    avatar: useAvatar,
    game_class: gameClass,
    game_level: 1,
    role_id: 'member',
    contribution: 0,
    last_login_at: formatDateTime(),
    is_active: 1,
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    data: { id: result.id },
    message: '申请已提交',
  } as ApiResponse<any>);
});

router.put('/:id/approve', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  if (member.roleId !== 'president' && member.roleId !== 'vice_president') {
    res.status(403).json({
      success: false,
      error: '没有权限审批',
    } as ApiResponse<any>);
    return;
  }

  const id = parseInt(req.params.id, 10);
  const db = getDb();

  const target = db.findById('member', id);
  if (!target) {
    res.status(404).json({
      success: false,
      error: '成员不存在',
    } as ApiResponse<any>);
    return;
  }

  if (target.status !== 'pending') {
    res.status(400).json({
      success: false,
      error: '该成员不是待审批状态',
    } as ApiResponse<any>);
    return;
  }

  db.update('member', id, { status: 'approved', joined_at: formatDateTime() });

  res.json({
    success: true,
    message: '已通过审批',
  } as ApiResponse<any>);
});

router.put('/:id/reject', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  if (member.roleId !== 'president' && member.roleId !== 'vice_president') {
    res.status(403).json({
      success: false,
      error: '没有权限审批',
    } as ApiResponse<any>);
    return;
  }

  const id = parseInt(req.params.id, 10);
  const db = getDb();

  const target = db.findById('member', id);
  if (!target) {
    res.status(404).json({
      success: false,
      error: '成员不存在',
    } as ApiResponse<any>);
    return;
  }

  if (target.status !== 'pending') {
    res.status(400).json({
      success: false,
      error: '该成员不是待审批状态',
    } as ApiResponse<any>);
    return;
  }

  db.update('member', id, { status: 'rejected' });

  res.json({
    success: true,
    message: '已拒绝申请',
  } as ApiResponse<any>);
});

router.put('/:id/role', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  if (member.roleId !== 'president' && member.roleId !== 'vice_president') {
    res.status(403).json({
      success: false,
      error: '没有权限修改职位',
    } as ApiResponse<any>);
    return;
  }

  const id = parseInt(req.params.id, 10);
  const { roleId } = req.body;

  const validRoles = ['president', 'vice_president', 'leader', 'member'];
  if (!roleId || !validRoles.includes(roleId)) {
    res.status(400).json({
      success: false,
      error: '职位无效',
    } as ApiResponse<any>);
    return;
  }

  if (roleId === 'president' && member.roleId !== 'president') {
    res.status(403).json({
      success: false,
      error: '只有会长可以转让会长职位',
    } as ApiResponse<any>);
    return;
  }

  const db = getDb();
  const target = db.findById('member', id);
  if (!target) {
    res.status(404).json({
      success: false,
      error: '成员不存在',
    } as ApiResponse<any>);
    return;
  }

  db.update('member', id, { role_id: roleId });

  if (roleId === 'president') {
    const guild = db.getTable('guild')[0];
    if (guild) {
      db.update('guild', guild.id, { president_id: id });
    }
  }

  res.json({
    success: true,
    message: '职位已更新',
  } as ApiResponse<any>);
});

router.put('/:id/active', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  if (member.roleId !== 'president' && member.roleId !== 'vice_president') {
    res.status(403).json({
      success: false,
      error: '没有权限修改活跃状态',
    } as ApiResponse<any>);
    return;
  }

  const id = parseInt(req.params.id, 10);
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    res.status(400).json({
      success: false,
      error: '活跃状态无效',
    } as ApiResponse<any>);
    return;
  }

  const db = getDb();
  const target = db.findById('member', id);
  if (!target) {
    res.status(404).json({
      success: false,
      error: '成员不存在',
    } as ApiResponse<any>);
    return;
  }

  db.update('member', id, { is_active: isActive ? 1 : 0 });

  res.json({
    success: true,
    message: '活跃状态已更新',
  } as ApiResponse<any>);
});

export default router;
