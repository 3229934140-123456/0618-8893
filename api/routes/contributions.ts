import { Router, type Request, type Response } from 'express';
import { getDb, toCamelCase, toCamelCaseArray, formatDateTime } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import type { ContributionRecord, RankingMember, ApiResponse } from '../../shared/types.js';

const router = Router();

function joinContributionWithMember(db: any, record: any): ContributionRecord {
  const member = db.findById('member', record.member_id);
  return toCamelCase<ContributionRecord>({
    ...record,
    member_name: member?.nickname,
    member_avatar: member?.avatar,
  });
}

router.get('/', (req: Request, res: Response): void => {
  const { memberId, type, limit } = req.query;

  const db = getDb();
  let records = db.getTable('contribution_record') as any[];

  if (memberId && typeof memberId === 'string') {
    const mid = parseInt(memberId, 10);
    records = records.filter(c => c.member_id === mid);
  }

  if (type && typeof type === 'string') {
    records = records.filter(c => c.type === type);
  }

  records.sort((a, b) => b.created_at.localeCompare(a.created_at));

  if (limit && typeof limit === 'string') {
    const l = parseInt(limit, 10);
    if (!isNaN(l)) {
      records = records.slice(0, l);
    }
  }

  const result = records.map(r => joinContributionWithMember(db, r));

  res.json({
    success: true,
    data: result,
  } as ApiResponse<ContributionRecord[]>);
});

router.get('/ranking', (req: Request, res: Response): void => {
  const db = getDb();
  const members = db.query('member', {
    where: (m: any) => m.status === 'approved',
    orderBy: (a: any, b: any) => b.contribution - a.contribution,
    limit: 20,
  }) as any[];

  const ranking: RankingMember[] = members.map((row, index) => ({
    id: row.id,
    nickname: row.nickname,
    avatar: row.avatar,
    contribution: row.contribution,
    rank: index + 1,
    roleId: row.role_id,
  }));

  res.json({
    success: true,
    data: ranking,
  } as ApiResponse<RankingMember[]>);
});

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  if (member.roleId !== 'president' && member.roleId !== 'vice_president') {
    res.status(403).json({
      success: false,
      error: '没有权限添加贡献记录',
    } as ApiResponse<any>);
    return;
  }

  const { memberId, amount, type, description, relatedId } = req.body;

  if (!memberId || !amount || !type || !description) {
    res.status(400).json({
      success: false,
      error: '成员ID、数量、类型和描述不能为空',
    } as ApiResponse<any>);
    return;
  }

  const validTypes = ['activity', 'donate', 'reward', 'penalty'];
  if (!validTypes.includes(type)) {
    res.status(400).json({
      success: false,
      error: '贡献类型无效',
    } as ApiResponse<any>);
    return;
  }

  const db = getDb();
  const target = db.findById('member', memberId);

  if (!target) {
    res.status(404).json({
      success: false,
      error: '成员不存在',
    } as ApiResponse<any>);
    return;
  }

  db.insert('contribution_record', {
    member_id: memberId,
    amount,
    type,
    description,
    created_at: formatDateTime(),
    related_id: relatedId ?? null,
  });

  db.update('member', memberId, {
    contribution: (target.contribution || 0) + amount,
  });

  res.status(201).json({
    success: true,
    message: '贡献记录已添加',
  } as ApiResponse<any>);
});

router.post('/donate', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  const { amount, description } = req.body;

  if (!amount || amount <= 0 || !description) {
    res.status(400).json({
      success: false,
      error: '贡献数量和描述不能为空，且数量必须大于0',
    } as ApiResponse<any>);
    return;
  }

  const db = getDb();

  db.insert('contribution_record', {
    member_id: member.id,
    amount,
    type: 'donate',
    description,
    created_at: formatDateTime(),
    related_id: null,
  });

  db.update('member', member.id, {
    contribution: (member.contribution || 0) + amount,
  });

  res.status(201).json({
    success: true,
    message: '捐献成功',
  } as ApiResponse<any>);
});

export default router;
