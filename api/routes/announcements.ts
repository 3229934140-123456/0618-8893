import { Router, type Request, type Response } from 'express';
import { getDb, toCamelCase, toCamelCaseArray, formatDateTime } from '../db/index.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import type { Announcement, ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/', optionalAuthMiddleware, (req: Request, res: Response): void => {
  const currentMember = req.member;

  const db = getDb();
  const members = db.getTable('member');
  const memberMap = new Map(members.map((m: any) => [m.id, m]));

  let announcements = db.getTable('announcement') as any[];

  announcements.sort((a, b) => {
    const pa = a.is_pinned === 1 || a.is_pinned === true ? 1 : 0;
    const pb = b.is_pinned === 1 || b.is_pinned === true ? 1 : 0;
    if (pa !== pb) return pb - pa;
    return b.created_at.localeCompare(a.created_at);
  });

  announcements = announcements.slice(0, 50);

  const result = announcements.map(a => {
    const readBy = JSON.parse(String(a.read_by || '[]'));
    const targetRoles = JSON.parse(String(a.target_roles || '[]'));
    const creator = memberMap.get(a.created_by);
    return toCamelCase<Announcement>({
      ...a,
      creator_name: creator?.nickname,
      is_pinned: a.is_pinned === 1 || a.is_pinned === true,
      readBy,
      targetRoles,
      isRead: currentMember ? readBy.includes(currentMember.id) : false,
    });
  });

  res.json({
    success: true,
    data: result,
  } as ApiResponse<Announcement[]>);
});

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  const { title, content, isPinned, targetRoles } = req.body;

  const canCreate = member.roleId === 'president' || member.roleId === 'vice_president' || member.roleId === 'leader';
  if (!canCreate) {
    res.status(403).json({
      success: false,
      error: '没有权限发布公告',
    } as ApiResponse<any>);
    return;
  }

  if (!title || !content) {
    res.status(400).json({
      success: false,
      error: '标题和内容不能为空',
    } as ApiResponse<any>);
    return;
  }

  const db = getDb();
  const newAnn = db.insert('announcement', {
    title,
    content,
    is_pinned: isPinned ? 1 : 0,
    target_roles: JSON.stringify(targetRoles || ['president', 'vice_president', 'leader', 'member']),
    created_by: member.id,
    created_at: formatDateTime(),
    read_by: JSON.stringify([]),
  });

  const creator = db.findById('member', member.id);
  const announcement = toCamelCase<Announcement>({
    ...newAnn,
    creator_name: creator?.nickname,
    is_pinned: newAnn.is_pinned === 1 || newAnn.is_pinned === true,
    readBy: JSON.parse(String(newAnn.read_by || '[]')),
    targetRoles: JSON.parse(String(newAnn.target_roles || '[]')),
  });

  res.status(201).json({
    success: true,
    data: announcement,
    message: '公告已发布',
  } as ApiResponse<Announcement>);
});

router.put('/:id/read', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  const id = parseInt(req.params.id, 10);

  const db = getDb();
  const announcement = db.findById('announcement', id);

  if (!announcement) {
    res.status(404).json({
      success: false,
      error: '公告不存在',
    } as ApiResponse<any>);
    return;
  }

  const readBy = JSON.parse(String(announcement.read_by || '[]')) as number[];
  if (!readBy.includes(member.id)) {
    readBy.push(member.id);
    db.update('announcement', id, { read_by: JSON.stringify(readBy) });
  }

  res.json({
    success: true,
    message: '已标记为已读',
  } as ApiResponse<any>);
});

export default router;
