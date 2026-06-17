import { Router, type Request, type Response } from 'express';
import { getDb, toCamelCase, toCamelCaseArray, formatDateTime } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import type { WarehouseItem, BorrowRecord, ApiResponse } from '../../shared/types.js';

const router = Router();

const QUALITY_ORDER: Record<string, number> = {
  legendary: 1,
  epic: 2,
  rare: 3,
  uncommon: 4,
  common: 5,
};

function joinBorrowWithDetails(db: any, borrow: any): BorrowRecord {
  const item = db.findById('warehouse_item', borrow.item_id);
  const member = db.findById('member', borrow.member_id);
  return toCamelCase<BorrowRecord>({
    ...borrow,
    item_name: item?.name,
    item_quality: item?.quality,
    member_name: member?.nickname,
    member_avatar: member?.avatar,
  });
}

router.get('/', (req: Request, res: Response): void => {
  const { category, quality } = req.query;

  const db = getDb();
  let items = db.getTable('warehouse_item') as any[];

  if (category && typeof category === 'string') {
    items = items.filter(i => i.category === category);
  }

  if (quality && typeof quality === 'string') {
    items = items.filter(i => i.quality === quality);
  }

  items.sort((a, b) => {
    const qa = QUALITY_ORDER[a.quality] ?? 99;
    const qb = QUALITY_ORDER[b.quality] ?? 99;
    if (qa !== qb) return qa - qb;
    return b.added_at.localeCompare(a.added_at);
  });

  const result = toCamelCaseArray<WarehouseItem>(items);

  res.json({
    success: true,
    data: result,
  } as ApiResponse<WarehouseItem[]>);
});

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  if (member.roleId !== 'president' && member.roleId !== 'vice_president') {
    res.status(403).json({
      success: false,
      error: '没有权限添加物品',
    } as ApiResponse<any>);
    return;
  }

  const { name, category, quality, quantity, description, icon } = req.body;

  if (!name || !category || !quantity) {
    res.status(400).json({
      success: false,
      error: '名称、分类和数量不能为空',
    } as ApiResponse<any>);
    return;
  }

  const db = getDb();
  const newItem = db.insert('warehouse_item', {
    name,
    category,
    quality: quality || 'common',
    quantity,
    available_quantity: quantity,
    description: description || null,
    icon: icon || null,
    added_at: formatDateTime(),
  });

  const result = toCamelCase<WarehouseItem>(newItem);

  res.status(201).json({
    success: true,
    data: result,
    message: '物品已添加',
  } as ApiResponse<WarehouseItem>);
});

router.put('/:id', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  if (member.roleId !== 'president' && member.roleId !== 'vice_president') {
    res.status(403).json({
      success: false,
      error: '没有权限编辑物品',
    } as ApiResponse<any>);
    return;
  }

  const id = parseInt(req.params.id, 10);
  const { name, category, quality, quantity, description, icon } = req.body;

  const db = getDb();
  const item = db.findById('warehouse_item', id);

  if (!item) {
    res.status(404).json({
      success: false,
      error: '物品不存在',
    } as ApiResponse<any>);
    return;
  }

  const diff = (quantity ?? item.quantity) - item.quantity;
  const newAvailable = Math.max(0, Math.min(item.quantity + diff, item.available_quantity + diff));

  const updateData: any = {};
  if (name !== undefined && name !== null) updateData.name = name;
  if (category !== undefined && category !== null) updateData.category = category;
  if (quality !== undefined && quality !== null) updateData.quality = quality;
  if (quantity !== undefined && quantity !== null) updateData.quantity = quantity;
  updateData.available_quantity = newAvailable;
  if (description !== undefined && description !== null) updateData.description = description;
  if (icon !== undefined && icon !== null) updateData.icon = icon;

  const updated = db.update('warehouse_item', id, updateData)!;
  const result = toCamelCase<WarehouseItem>(updated);

  res.json({
    success: true,
    data: result,
    message: '物品已更新',
  } as ApiResponse<WarehouseItem>);
});

router.get('/borrows', authMiddleware, (req: Request, res: Response): void => {
  const { status, memberId } = req.query;

  const db = getDb();
  let borrows = db.getTable('borrow_record') as any[];

  if (status && typeof status === 'string') {
    borrows = borrows.filter(b => b.status === status);
  }

  if (memberId && typeof memberId === 'string') {
    const mid = parseInt(memberId, 10);
    borrows = borrows.filter(b => b.member_id === mid);
  }

  borrows.sort((a, b) => b.applied_at.localeCompare(a.applied_at));

  const result = borrows.map(b => joinBorrowWithDetails(db, b));

  res.json({
    success: true,
    data: result,
  } as ApiResponse<BorrowRecord[]>);
});

router.post('/borrows', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  const { itemId, quantity, purpose, expectedReturnAt } = req.body;

  if (!itemId || !quantity || !purpose || !expectedReturnAt) {
    res.status(400).json({
      success: false,
      error: '物品ID、数量、用途和预计归还时间不能为空',
    } as ApiResponse<any>);
    return;
  }

  const db = getDb();
  const item = db.findById('warehouse_item', itemId);

  if (!item) {
    res.status(404).json({
      success: false,
      error: '物品不存在',
    } as ApiResponse<any>);
    return;
  }

  if (quantity > item.available_quantity) {
    res.status(400).json({
      success: false,
      error: '可借用数量不足',
    } as ApiResponse<any>);
    return;
  }

  const activeCount = db.count('borrow_record', (b: any) =>
    b.member_id === member.id && (b.status === 'pending' || b.status === 'approved')
  );

  if (activeCount >= 3) {
    res.status(400).json({
      success: false,
      error: '同时借用物品不能超过3件',
    } as ApiResponse<any>);
    return;
  }

  const newBorrow = db.insert('borrow_record', {
    item_id: itemId,
    member_id: member.id,
    quantity,
    purpose,
    expected_return_at: expectedReturnAt,
    status: 'pending',
    applied_at: formatDateTime(),
    approved_at: null,
    returned_at: null,
    approved_by: null,
  });

  const result = joinBorrowWithDetails(db, newBorrow);

  res.status(201).json({
    success: true,
    data: result,
    message: '借用申请已提交',
  } as ApiResponse<BorrowRecord>);
});

router.put('/borrows/:id/approve', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  if (member.roleId !== 'president' && member.roleId !== 'vice_president' && member.roleId !== 'leader') {
    res.status(403).json({
      success: false,
      error: '没有权限审批借用',
    } as ApiResponse<any>);
    return;
  }

  const id = parseInt(req.params.id, 10);
  const { expectedReturnAt } = req.body;
  const db = getDb();

  const borrow = db.findById('borrow_record', id);

  if (!borrow) {
    res.status(404).json({
      success: false,
      error: '借用记录不存在',
    } as ApiResponse<any>);
    return;
  }

  if (borrow.status !== 'pending') {
    res.status(400).json({
      success: false,
      error: '该借用不是待审批状态',
    } as ApiResponse<any>);
    return;
  }

  const item = db.findById('warehouse_item', borrow.item_id)!;
  if (borrow.quantity > item.available_quantity) {
    res.status(400).json({
      success: false,
      error: '可借用数量不足',
    } as ApiResponse<any>);
    return;
  }

  const updateData: any = {
    status: 'approved',
    approved_at: formatDateTime(),
    approved_by: member.id,
  };
  if (expectedReturnAt) {
    updateData.expected_return_at = expectedReturnAt;
  }

  db.update('borrow_record', id, updateData);
  db.update('warehouse_item', borrow.item_id, {
    available_quantity: item.available_quantity - borrow.quantity,
  });

  res.json({
    success: true,
    message: '借用已批准',
  } as ApiResponse<any>);
});

router.put('/borrows/:id/reject', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  if (member.roleId !== 'president' && member.roleId !== 'vice_president' && member.roleId !== 'leader') {
    res.status(403).json({
      success: false,
      error: '没有权限拒绝借用',
    } as ApiResponse<any>);
    return;
  }

  const id = parseInt(req.params.id, 10);
  const db = getDb();

  const borrow = db.findById('borrow_record', id);

  if (!borrow) {
    res.status(404).json({
      success: false,
      error: '借用记录不存在',
    } as ApiResponse<any>);
    return;
  }

  if (borrow.status !== 'pending') {
    res.status(400).json({
      success: false,
      error: '该借用不是待审批状态',
    } as ApiResponse<any>);
    return;
  }

  db.update('borrow_record', id, {
    status: 'rejected',
    approved_at: formatDateTime(),
    approved_by: member.id,
  });

  res.json({
    success: true,
    message: '借用已拒绝',
  } as ApiResponse<any>);
});

router.put('/borrows/:id/return', authMiddleware, (req: Request, res: Response): void => {
  const member = req.member!;
  const id = parseInt(req.params.id, 10);
  const db = getDb();

  const borrow = db.findById('borrow_record', id);

  if (!borrow) {
    res.status(404).json({
      success: false,
      error: '借用记录不存在',
    } as ApiResponse<any>);
    return;
  }

  if (borrow.status !== 'approved' && borrow.status !== 'overdue') {
    res.status(400).json({
      success: false,
      error: '该借用不可归还',
    } as ApiResponse<any>);
    return;
  }

  const canReturn = member.roleId === 'president' || member.roleId === 'vice_president' || borrow.member_id === member.id;
  if (!canReturn) {
    res.status(403).json({
      success: false,
      error: '没有权限确认归还',
    } as ApiResponse<any>);
    return;
  }

  const item = db.findById('warehouse_item', borrow.item_id)!;
  db.update('borrow_record', id, {
    status: 'returned',
    returned_at: formatDateTime(),
  });
  db.update('warehouse_item', borrow.item_id, {
    available_quantity: item.available_quantity + borrow.quantity,
  });

  res.json({
    success: true,
    message: '已确认归还',
  } as ApiResponse<any>);
});

export default router;
