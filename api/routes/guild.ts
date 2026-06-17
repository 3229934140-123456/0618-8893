import { Router, type Request, type Response } from 'express';
import { getDb, toCamelCase } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import type { Guild, ApiResponse } from '../../shared/types.js';

const router = Router();

function getGuildWithMemberCount(db: any): any | undefined {
  const guild = db.getTable('guild')[0];
  if (!guild) return undefined;
  const memberCount = db.count('member', (m: any) => m.status === 'approved');
  return { ...guild, member_count: memberCount };
}

router.get('/', (req: Request, res: Response): void => {
  const db = getDb();
  const row = getGuildWithMemberCount(db);

  if (!row) {
    res.status(404).json({
      success: false,
      error: '公会不存在',
    } as ApiResponse<any>);
    return;
  }

  const guild = toCamelCase<Guild & { memberCount: number }>(row);

  res.json({
    success: true,
    data: guild,
  } as ApiResponse<Guild>);
});

router.put('/', authMiddleware, (req: Request, res: Response): void => {
  const { name, logo, description, level } = req.body;
  const member = req.member!;

  if (member.roleId !== 'president' && member.roleId !== 'vice_president') {
    res.status(403).json({
      success: false,
      error: '没有权限修改公会信息',
    } as ApiResponse<any>);
    return;
  }

  const db = getDb();
  const guild = db.getTable('guild')[0];

  if (!guild) {
    res.status(404).json({
      success: false,
      error: '公会不存在',
    } as ApiResponse<any>);
    return;
  }

  const updateData: any = {};
  if (name !== undefined && name !== null) updateData.name = name;
  if (logo !== undefined && logo !== null) updateData.logo = logo;
  if (description !== undefined && description !== null) updateData.description = description;
  if (level !== undefined && level !== null) updateData.level = level;

  db.update('guild', guild.id, updateData);

  const updatedRow = getGuildWithMemberCount(db);
  const updatedGuild = toCamelCase<Guild>(updatedRow);

  res.json({
    success: true,
    data: updatedGuild,
    message: '公会信息已更新',
  } as ApiResponse<Guild>);
});

export default router;
