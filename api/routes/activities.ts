import { Router, type Request, type Response } from 'express';
import { getDb, toCamelCase, toCamelCaseArray, formatDateTime } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import type { Activity, ActivitySignup, ApiResponse } from '../../shared/types.js';

const router = Router();

function getSignupsForActivity(db: any, activityId: number): ActivitySignup[] {
  const members = db.getTable('member') as any[];
  const memberMap = new Map<number, any>(members.map((m: any) => [m.id, m]));

  const rows = db.query('activity_signup', {
    where: (s: any) => s.activity_id === activityId,
    orderBy: 'signed_up_at',
  }) as Record<string, any>[];

  return rows.map(s => {
    const member = memberMap.get(s.member_id);
    return toCamelCase<ActivitySignup>({
      ...s,
      nickname: member?.nickname,
      avatar: member?.avatar,
      confirmed: s.confirmed === 1 || s.confirmed === true,
    });
  });
}

router.get('/', (req: Request, res: Response): void => {
  const { status } = req.query;

  const db = getDb();
  let activities = db.getTable('activity') as any[];

  if (status && typeof status === 'string') {
    activities = activities.filter(a => a.status === status);
  }

  activities.sort((a, b) => b.start_time.localeCompare(a.start_time));

  const result = activities.map(a => {
    const activity = toCamelCase<Activity>({
      ...a,
      class_requirements: JSON.parse(String(a.class_requirements || '{}')),
    });
    activity.signups = getSignupsForActivity(db, a.id);
    return activity;
  });

  res.json({
    success: true,
    data: result,
  } as ApiResponse<Activity[]>);
});

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  const { title, dungeonName, maxMembers, classRequirements, startTime, endTime, note } = req.body;

  if (!title || !dungeonName || !maxMembers || !startTime) {
    res.status(400).json({
      success: false,
      error: '请填写必填字段：标题、副本名称、最大人数、开始时间',
    } as ApiResponse<any>);
    return;
  }

  const db = getDb();
  const newActivity = db.insert('activity', {
    title,
    dungeon_name: dungeonName,
    max_members: maxMembers,
    class_requirements: JSON.stringify(classRequirements || {}),
    start_time: startTime,
    end_time: endTime || null,
    note: note || null,
    created_by: member.id,
    status: 'upcoming',
  });

  const result = toCamelCase<Activity>({
    ...newActivity,
    class_requirements: JSON.parse(String(newActivity.class_requirements || '{}')),
  });
  result.signups = [];

  res.status(201).json({
    success: true,
    data: result,
    message: '活动已创建',
  } as ApiResponse<Activity>);
});

router.put('/:id', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  const id = parseInt(req.params.id, 10);
  const { title, dungeonName, maxMembers, classRequirements, startTime, endTime, note, status } = req.body;

  const db = getDb();
  const activity = db.findById('activity', id);

  if (!activity) {
    res.status(404).json({
      success: false,
      error: '活动不存在',
    } as ApiResponse<any>);
    return;
  }

  const canManage = member.roleId === 'president' || member.roleId === 'vice_president' || activity.created_by === member.id;
  if (!canManage) {
    res.status(403).json({
      success: false,
      error: '没有权限修改活动',
    } as ApiResponse<any>);
    return;
  }

  const validStatuses = ['upcoming', 'ongoing', 'finished', 'cancelled'];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      error: '活动状态无效',
    } as ApiResponse<any>);
    return;
  }

  const updateData: any = {};
  if (title !== undefined && title !== null) updateData.title = title;
  if (dungeonName !== undefined && dungeonName !== null) updateData.dungeon_name = dungeonName;
  if (maxMembers !== undefined && maxMembers !== null) updateData.max_members = maxMembers;
  if (classRequirements !== undefined && classRequirements !== null) {
    updateData.class_requirements = JSON.stringify(classRequirements);
  }
  if (startTime !== undefined && startTime !== null) updateData.start_time = startTime;
  if (endTime !== undefined && endTime !== null) updateData.end_time = endTime;
  if (note !== undefined && note !== null) updateData.note = note;
  if (status !== undefined && status !== null) updateData.status = status;

  const updated = db.update('activity', id, updateData)!;

  const result = toCamelCase<Activity>({
    ...updated,
    class_requirements: JSON.parse(String(updated.class_requirements || '{}')),
  });
  result.signups = getSignupsForActivity(db, id);

  res.json({
    success: true,
    data: result,
    message: '活动已更新',
  } as ApiResponse<Activity>);
});

router.post('/:id/signup', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  const id = parseInt(req.params.id, 10);
  const { gameClass, remark } = req.body;

  const db = getDb();
  const activity = db.findById('activity', id);

  if (!activity) {
    res.status(404).json({
      success: false,
      error: '活动不存在',
    } as ApiResponse<any>);
    return;
  }

  if (activity.status !== 'upcoming') {
    res.status(400).json({
      success: false,
      error: '活动不可报名',
    } as ApiResponse<any>);
    return;
  }

  const existingSignup = db.find('activity_signup', (s: any) => s.activity_id === id && s.member_id === member.id);

  if (existingSignup) {
    res.status(400).json({
      success: false,
      error: '您已报名该活动',
    } as ApiResponse<any>);
    return;
  }

  const signupCount = db.count('activity_signup', (s: any) => s.activity_id === id);

  if (signupCount >= activity.max_members) {
    res.status(400).json({
      success: false,
      error: '活动已满员',
    } as ApiResponse<any>);
    return;
  }

  const newSignup = db.insert('activity_signup', {
    activity_id: id,
    member_id: member.id,
    game_class: gameClass || member.gameClass,
    confirmed: 0,
    remark: remark || null,
    signed_up_at: formatDateTime(),
  });

  const memberRow = db.findById('member', member.id);
  const signup = toCamelCase<ActivitySignup>({
    ...newSignup,
    nickname: memberRow?.nickname,
    avatar: memberRow?.avatar,
    confirmed: newSignup.confirmed === 1,
  });

  res.status(201).json({
    success: true,
    data: signup,
    message: '报名成功',
  } as ApiResponse<ActivitySignup>);
});

router.delete('/:id/signup', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  const id = parseInt(req.params.id, 10);

  const db = getDb();
  const signup = db.find('activity_signup', (s: any) => s.activity_id === id && s.member_id === member.id);

  if (!signup) {
    res.status(404).json({
      success: false,
      error: '未找到报名记录',
    } as ApiResponse<any>);
    return;
  }

  db.delete('activity_signup', signup.id);

  res.json({
    success: true,
    message: '已取消报名',
  } as ApiResponse<any>);
});

router.put('/:id/confirm', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  const id = parseInt(req.params.id, 10);

  const db = getDb();
  const activity = db.findById('activity', id);

  if (!activity) {
    res.status(404).json({
      success: false,
      error: '活动不存在',
    } as ApiResponse<any>);
    return;
  }

  const canManage = member.roleId === 'president' || member.roleId === 'vice_president' || activity.created_by === member.id;
  if (!canManage) {
    res.status(403).json({
      success: false,
      error: '没有权限确认报名名单',
    } as ApiResponse<any>);
    return;
  }

  const signups = db.query('activity_signup', {
    where: (s: any) => s.activity_id === id,
  }) as any[];

  signups.forEach(s => {
    db.update('activity_signup', s.id, { confirmed: 1 });
  });

  res.json({
    success: true,
    message: '已确认所有报名',
  } as ApiResponse<any>);
});

export default router;
