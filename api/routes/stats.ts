import { Router, type Request, type Response } from 'express';
import { getDb } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import type { ActivityStats, ApiResponse } from '../../shared/types.js';

const router = Router();

function extractDate(dateTimeStr: string): string {
  if (!dateTimeStr) return '';
  return dateTimeStr.split(' ')[0] || dateTimeStr.split('T')[0] || '';
}

router.get('/activity', authMiddleware, (req: Request, res: Response): void => {
  const db = getDb();

  const activeCount = db.count('member', (m: any) => m.status === 'approved' && (m.is_active === 1 || m.is_active === true));
  const inactiveCount = db.count('member', (m: any) => m.status === 'approved' && (m.is_active === 0 || m.is_active === false));
  const pendingCount = db.count('member', (m: any) => m.status === 'pending');

  const weeklyTrend: { date: string; active: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    const activeIds = new Set<number>();

    db.query('activity_signup', {
      where: (s: any) => extractDate(s.signed_up_at) === dateStr,
    }).forEach((s: any) => activeIds.add(s.member_id));

    db.query('borrow_record', {
      where: (b: any) => extractDate(b.applied_at) === dateStr,
    }).forEach((b: any) => activeIds.add(b.member_id));

    db.query('contribution_record', {
      where: (c: any) => extractDate(c.created_at) === dateStr,
    }).forEach((c: any) => activeIds.add(c.member_id));

    db.query('member', {
      where: (m: any) => extractDate(m.last_login_at) === dateStr,
    }).forEach((m: any) => activeIds.add(m.id));

    weeklyTrend.push({
      date: dateStr,
      active: activeIds.size,
    });
  }

  const stats: ActivityStats = {
    activeMembers: activeCount,
    inactiveMembers: inactiveCount,
    pendingApplications: pendingCount,
    weeklyTrend,
  };

  res.json({
    success: true,
    data: stats,
  } as ApiResponse<ActivityStats>);
});

export default router;
