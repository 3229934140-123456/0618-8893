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
  const { month } = req.query;

  const db = getDb();
  const members = db.query('member', {
    where: (m: any) => m.status === 'approved',
  }) as any[];

  const memberMap = new Map<number, any>(members.map((m: any) => [m.id, m]));
  let records = db.getTable('contribution_record') as any[];

  if (month && typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
    records = records.filter(r => String(r.created_at || '').slice(0, 7) === month);
  }

  const contributionByMember = new Map<number, number>();
  records.forEach(r => {
    const mid = r.member_id;
    const current = contributionByMember.get(mid) || 0;
    contributionByMember.set(mid, current + (Number(r.amount) || 0));
  });

  const rankedMembers = members
    .map(m => ({
      id: m.id,
      nickname: m.nickname,
      avatar: m.avatar,
      contribution: contributionByMember.get(m.id) || 0,
      roleId: m.role_id,
    }))
    .filter(m => m.contribution > 0 || (!month))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 20);

  const ranking: RankingMember[] = rankedMembers.map((row, index) => ({
    ...row,
    rank: index + 1,
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
  const { resource, quantity, amount, description } = req.body;

  const finalResource = resource as string | undefined;
  const finalQuantity = typeof quantity === 'number' ? quantity : (typeof quantity === 'string' ? parseInt(quantity, 10) : undefined);
  const finalAmount = typeof amount === 'number' ? amount : (typeof amount === 'string' ? parseInt(amount, 10) : undefined);
  const finalDescription = description as string | undefined;

  const donateAmount = finalAmount ?? (finalQuantity && finalQuantity > 0 ? finalQuantity * 10 : 0);
  const donateDescription = finalDescription ?? (finalResource && finalQuantity ? `捐献 ${finalResource} × ${finalQuantity}` : '资源捐献');

  if (!donateAmount || donateAmount <= 0) {
    res.status(400).json({
      success: false,
      error: '贡献数量和描述不能为空，且数量必须大于0',
    } as ApiResponse<any>);
    return;
  }

  const db = getDb();

  db.insert('contribution_record', {
    member_id: member.id,
    amount: donateAmount,
    type: 'donate',
    description: donateDescription,
    created_at: formatDateTime(),
    related_id: null,
  });

  db.update('member', member.id, {
    contribution: (member.contribution || 0) + donateAmount,
  });

  res.status(201).json({
    success: true,
    message: '捐献成功',
    data: { amount: donateAmount, description: donateDescription },
  } as ApiResponse<any>);
});

export default router;
