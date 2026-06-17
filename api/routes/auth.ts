import { Router, type Request, type Response } from 'express';
import { getDb, toCamelCase, formatDateTime } from '../db/index.js';
import type { Member, ApiResponse } from '../../shared/types.js';

const router = Router();

router.post('/login', (req: Request, res: Response): void => {
  const { memberId, nickname } = req.body;

  const db = getDb();
  let memberRow: Record<string, any> | undefined;

  if (memberId) {
    const id = parseInt(memberId, 10);
    if (!isNaN(id)) {
      memberRow = db.findById('member', id);
    }
  }

  if (!memberRow && nickname) {
    memberRow = db.find('member', (m: any) => m.nickname === nickname);
  }

  if (!memberRow) {
    const allMembers = db.query('member', {
      where: (m: any) => m.status === 'approved',
      orderBy: 'id',
      limit: 5,
    }) as Record<string, any>[];
    res.status(400).json({
      success: false,
      error: '成员不存在，可使用以下 ID 或昵称登录',
      data: allMembers.map(m => ({ id: m.id, nickname: m.nickname, avatar: m.avatar })),
    } as ApiResponse<any>);
    return;
  }

  if (memberRow.status === 'pending') {
    res.status(403).json({
      success: false,
      error: '账户正在等待审批',
    } as ApiResponse<any>);
    return;
  }

  if (memberRow.status === 'rejected') {
    res.status(403).json({
      success: false,
      error: '账户已被拒绝',
    } as ApiResponse<any>);
    return;
  }

  db.update('member', memberRow.id, { last_login_at: formatDateTime() });

  const member = toCamelCase<Member>({
    ...memberRow,
    is_active: memberRow.is_active === 1 || memberRow.is_active === true,
  });

  res.json({
    success: true,
    data: {
      token: String(member.id),
      member,
    },
    message: '登录成功',
  } as ApiResponse<any>);
});

router.post('/register', (req: Request, res: Response): void => {
  const { nickname, gameClass } = req.body;

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

  const avatars = ['🦸', '🧙', '🧝', '🧛', '🥷', '👸', '🤴', '🦹', '🧞', '🧜'];
  const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

  const result = db.insert('member', {
    nickname,
    avatar: randomAvatar,
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
    data: {
      id: result.id,
    },
    message: '申请已提交，等待审批',
  } as ApiResponse<any>);
});

router.post('/logout', (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: '退出成功',
  } as ApiResponse<any>);
});

export default router;
