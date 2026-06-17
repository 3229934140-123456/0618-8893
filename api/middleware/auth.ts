import type { Request, Response, NextFunction } from 'express';
import { getDb, toCamelCase } from '../db/index.js';
import type { Member } from '../../shared/types.js';

declare global {
  namespace Express {
    interface Request {
      member?: Member;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: '未提供认证令牌',
    });
    return;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!token) {
    res.status(401).json({
      success: false,
      error: '认证令牌格式无效',
    });
    return;
  }

  const memberId = parseInt(token, 10);

  if (isNaN(memberId)) {
    res.status(401).json({
      success: false,
      error: '认证令牌无效',
    });
    return;
  }

  const db = getDb();
  const row = db.findById('member', memberId);

  if (!row) {
    res.status(401).json({
      success: false,
      error: '成员不存在',
    });
    return;
  }

  const member = toCamelCase<Member>({
    ...row,
    is_active: row.is_active === 1 || row.is_active === true,
  });

  if (member.status !== 'approved') {
    res.status(403).json({
      success: false,
      error: '账户未通过审批',
    });
    return;
  }

  req.member = member;
  next();
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!token) {
    next();
    return;
  }

  const memberId = parseInt(token, 10);

  if (isNaN(memberId)) {
    next();
    return;
  }

  const db = getDb();
  const row = db.findById('member', memberId);

  if (!row) {
    next();
    return;
  }

  const member = toCamelCase<Member>({
    ...row,
    is_active: row.is_active === 1 || row.is_active === true,
  });

  req.member = member;
  next();
}
