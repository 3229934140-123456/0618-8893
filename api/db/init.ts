import { jsonDb } from './jsonDb.js';

function seedData() {
  const roleCount = jsonDb.count('role');
  if (roleCount > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  jsonDb.insert('role', {
    id: 'president',
    name: '会长',
    permissions: JSON.stringify([
      'guild:edit',
      'member:manage',
      'member:approve',
      'activity:create',
      'activity:manage',
      'warehouse:manage',
      'borrow:approve',
      'contribution:manage',
      'announcement:create',
      'announcement:manage',
      'stats:view',
    ]),
    color: '#EF4444',
  });
  jsonDb.insert('role', {
    id: 'vice_president',
    name: '副会长',
    permissions: JSON.stringify([
      'member:manage',
      'member:approve',
      'activity:create',
      'activity:manage',
      'warehouse:manage',
      'borrow:approve',
      'contribution:manage',
      'announcement:create',
      'stats:view',
    ]),
    color: '#F59E0B',
  });
  jsonDb.insert('role', {
    id: 'leader',
    name: '组长',
    permissions: JSON.stringify([
      'activity:create',
      'activity:manage',
      'warehouse:view',
      'borrow:apply',
      'announcement:view',
      'stats:view',
    ]),
    color: '#3B82F6',
  });
  jsonDb.insert('role', {
    id: 'member',
    name: '成员',
    permissions: JSON.stringify(['activity:signup', 'warehouse:view', 'borrow:apply', 'announcement:view']),
    color: '#64748B',
  });

  const members = [
    { nickname: '龙腾九天', avatar: '🐉', game_class: '战士', game_level: 85, role_id: 'president', contribution: 15800, joined_at: '2024-01-15 10:00:00', last_login_at: '2026-06-18 09:30:00', is_active: 1, status: 'approved' },
    { nickname: '月影剑客', avatar: '🌙', game_class: '盗贼', game_level: 83, role_id: 'vice_president', contribution: 12400, joined_at: '2024-02-20 14:20:00', last_login_at: '2026-06-17 22:15:00', is_active: 1, status: 'approved' },
    { nickname: '圣光使者', avatar: '✨', game_class: '圣骑士', game_level: 82, role_id: 'vice_president', contribution: 11200, joined_at: '2024-03-05 09:00:00', last_login_at: '2026-06-18 08:45:00', is_active: 1, status: 'approved' },
    { nickname: '烈焰法师', avatar: '🔥', game_class: '法师', game_level: 80, role_id: 'leader', contribution: 9800, joined_at: '2024-04-10 16:30:00', last_login_at: '2026-06-16 20:00:00', is_active: 1, status: 'approved' },
    { nickname: '自然守护', avatar: '🌿', game_class: '德鲁伊', game_level: 78, role_id: 'leader', contribution: 8500, joined_at: '2024-05-12 11:00:00', last_login_at: '2026-06-15 19:30:00', is_active: 1, status: 'approved' },
    { nickname: '暗影猎手', avatar: '🏹', game_class: '猎人', game_level: 76, role_id: 'leader', contribution: 7200, joined_at: '2024-06-18 13:45:00', last_login_at: '2026-06-14 21:00:00', is_active: 0, status: 'approved' },
    { nickname: '神谕祭司', avatar: '⛪', game_class: '牧师', game_level: 75, role_id: 'member', contribution: 6800, joined_at: '2024-07-22 10:15:00', last_login_at: '2026-06-18 07:30:00', is_active: 1, status: 'approved' },
    { nickname: '风行者', avatar: '💨', game_class: '武僧', game_level: 72, role_id: 'member', contribution: 5400, joined_at: '2024-08-30 15:20:00', last_login_at: '2026-06-17 18:00:00', is_active: 1, status: 'approved' },
    { nickname: '死亡骑士', avatar: '💀', game_class: '死亡骑士', game_level: 70, role_id: 'member', contribution: 4200, joined_at: '2024-09-15 17:00:00', last_login_at: '2026-06-10 16:30:00', is_active: 0, status: 'approved' },
    { nickname: '元素萨满', avatar: '⚡', game_class: '萨满', game_level: 68, role_id: 'member', contribution: 3600, joined_at: '2024-10-01 12:00:00', last_login_at: '2026-06-18 10:00:00', is_active: 1, status: 'approved' },
    { nickname: '邪能术士', avatar: '👿', game_class: '术士', game_level: 65, role_id: 'member', contribution: 2800, joined_at: '2024-11-20 09:30:00', last_login_at: '2026-06-16 14:00:00', is_active: 1, status: 'approved' },
    { nickname: '恶魔猎手', avatar: '😈', game_class: '恶魔猎手', game_level: 0, role_id: 'member', contribution: 0, joined_at: null, last_login_at: '2026-06-18 11:00:00', is_active: 1, status: 'pending' },
  ];

  const memberIds: number[] = [];
  members.forEach((m) => {
    const result = jsonDb.insert('member', m);
    memberIds.push(result.id);
  });

  jsonDb.insert('guild', {
    name: '星辰之翼',
    logo: '⭐',
    description: '一个充满活力和友爱的游戏公会，我们追求卓越，团结互助，共同征服每一个副本！',
    created_at: '2024-01-15 10:00:00',
    level: 8,
    president_id: memberIds[0],
  });

  const activities = [
    {
      title: '巨龙之魂团队副本',
      dungeon_name: '巨龙之魂',
      max_members: 10,
      class_requirements: JSON.stringify({ 战士: 2, 牧师: 2, 法师: 2, 盗贼: 1, 圣骑士: 1, 德鲁伊: 2 }),
      start_time: '2026-06-20 20:00:00',
      end_time: '2026-06-20 23:00:00',
      note: '请提前15分钟到场，准备好大药水和符文。',
      created_by: memberIds[0],
      status: 'upcoming',
    },
    {
      title: '火焰之地日常',
      dungeon_name: '火焰之地',
      max_members: 5,
      class_requirements: JSON.stringify({ 战士: 1, 牧师: 1, 法师: 1, 猎人: 1, 盗贼: 1 }),
      start_time: '2026-06-19 19:30:00',
      end_time: '2026-06-19 21:30:00',
      note: '新人优先带刷。',
      created_by: memberIds[3],
      status: 'upcoming',
    },
    {
      title: '冰冠堡垒怀旧团',
      dungeon_name: '冰冠堡垒',
      max_members: 25,
      class_requirements: JSON.stringify({ 战士: 3, 圣骑士: 3, 牧师: 4, 法师: 4, 盗贼: 3, 猎人: 3, 萨满: 2, 术士: 3 }),
      start_time: '2026-06-22 19:00:00',
      end_time: '2026-06-22 23:00:00',
      note: '怀旧团，轻松娱乐为主。',
      created_by: memberIds[1],
      status: 'upcoming',
    },
    {
      title: '奥杜尔成就团',
      dungeon_name: '奥杜尔',
      max_members: 10,
      class_requirements: JSON.stringify({ 战士: 2, 牧师: 2, 法师: 2, 德鲁伊: 2, 圣骑士: 2 }),
      start_time: '2026-06-15 20:00:00',
      end_time: '2026-06-15 22:30:00',
      note: '全通完成，掉落已分配。',
      created_by: memberIds[2],
      status: 'finished',
    },
  ];

  const activityIds: number[] = [];
  activities.forEach((a) => {
    const result = jsonDb.insert('activity', a);
    activityIds.push(result.id);
  });

  const signups = [
    { activity_id: activityIds[0], member_id: memberIds[0], game_class: '战士', confirmed: 1, remark: '主坦', signed_up_at: '2026-06-16 10:00:00' },
    { activity_id: activityIds[0], member_id: memberIds[1], game_class: '盗贼', confirmed: 1, remark: '', signed_up_at: '2026-06-16 11:20:00' },
    { activity_id: activityIds[0], member_id: memberIds[2], game_class: '圣骑士', confirmed: 1, remark: '副坦', signed_up_at: '2026-06-16 12:30:00' },
    { activity_id: activityIds[0], member_id: memberIds[3], game_class: '法师', confirmed: 1, remark: '', signed_up_at: '2026-06-16 14:00:00' },
    { activity_id: activityIds[0], member_id: memberIds[6], game_class: '牧师', confirmed: 0, remark: '可能迟到', signed_up_at: '2026-06-17 09:15:00' },
    { activity_id: activityIds[1], member_id: memberIds[4], game_class: '德鲁伊', confirmed: 1, remark: '带新人', signed_up_at: '2026-06-17 15:00:00' },
    { activity_id: activityIds[1], member_id: memberIds[7], game_class: '武僧', confirmed: 1, remark: '', signed_up_at: '2026-06-17 16:30:00' },
    { activity_id: activityIds[3], member_id: memberIds[0], game_class: '战士', confirmed: 1, remark: '', signed_up_at: '2026-06-14 09:00:00' },
    { activity_id: activityIds[3], member_id: memberIds[3], game_class: '法师', confirmed: 1, remark: '', signed_up_at: '2026-06-14 09:30:00' },
  ];

  signups.forEach((s) => {
    jsonDb.insert('activity_signup', s);
  });

  const items = [
    { name: '巨龙之牙', category: 'weapon', quality: 'legendary', quantity: 2, available_quantity: 1, description: '上古巨龙遗留的神器，蕴含无穷力量。', icon: '⚔️', added_at: '2026-03-10 14:00:00' },
    { name: '圣光胸甲', category: 'armor', quality: 'epic', quantity: 3, available_quantity: 2, description: '注入圣光之力的板甲。', icon: '🛡️', added_at: '2026-04-05 10:00:00' },
    { name: '暗影护符', category: 'accessory', quality: 'rare', quantity: 5, available_quantity: 3, description: '增强暗影法术能量。', icon: '📿', added_at: '2026-04-20 16:30:00' },
    { name: '源质矿石', category: 'material', quality: 'rare', quantity: 50, available_quantity: 45, description: '制作史诗装备的核心材料。', icon: '💎', added_at: '2026-05-01 09:00:00' },
    { name: '治疗药水', category: 'consumable', quality: 'uncommon', quantity: 200, available_quantity: 180, description: '恢复大量生命值。', icon: '🧪', added_at: '2026-05-10 11:00:00' },
    { name: '法力药水', category: 'consumable', quality: 'uncommon', quantity: 150, available_quantity: 135, description: '恢复大量法力值。', icon: '🔮', added_at: '2026-05-10 11:05:00' },
    { name: '火焰精华', category: 'resource', quality: 'epic', quantity: 20, available_quantity: 18, description: '蕴含火焰元素精华。', icon: '🔥', added_at: '2026-05-15 13:00:00' },
    { name: '生命精华', category: 'resource', quality: 'rare', quantity: 30, available_quantity: 28, description: '蕴含生命能量。', icon: '💚', added_at: '2026-05-15 13:10:00' },
    { name: '霜之哀伤碎片', category: 'material', quality: 'legendary', quantity: 1, available_quantity: 1, description: '传说神器的碎片。', icon: '❄️', added_at: '2026-06-01 20:00:00' },
    { name: '幸运硬币', category: 'accessory', quality: 'common', quantity: 100, available_quantity: 99, description: '据说能带来好运。', icon: '🪙', added_at: '2026-06-10 10:00:00' },
  ];

  const itemIds: number[] = [];
  items.forEach((i) => {
    const result = jsonDb.insert('warehouse_item', i);
    itemIds.push(result.id);
  });

  const borrows = [
    { item_id: itemIds[0], member_id: memberIds[3], quantity: 1, purpose: '团队副本使用', expected_return_at: '2026-06-21 12:00:00', status: 'approved', applied_at: '2026-06-17 10:00:00', approved_at: '2026-06-17 11:00:00', returned_at: null, approved_by: memberIds[0] },
    { item_id: itemIds[4], member_id: memberIds[7], quantity: 20, purpose: '练级消耗', expected_return_at: '2026-06-25 00:00:00', status: 'pending', applied_at: '2026-06-18 09:00:00', approved_at: null, returned_at: null, approved_by: null },
    { item_id: itemIds[9], member_id: memberIds[6], quantity: 1, purpose: '收藏', expected_return_at: '2026-06-30 00:00:00', status: 'returned', applied_at: '2026-06-10 14:00:00', approved_at: '2026-06-10 15:00:00', returned_at: '2026-06-15 10:00:00', approved_by: memberIds[1] },
    { item_id: itemIds[2], member_id: memberIds[9], quantity: 2, purpose: 'PVP增强', expected_return_at: '2026-06-16 00:00:00', status: 'overdue', applied_at: '2026-06-05 10:00:00', approved_at: '2026-06-05 11:00:00', returned_at: null, approved_by: memberIds[2] },
  ];

  borrows.forEach((b) => {
    jsonDb.insert('borrow_record', b);
  });

  const contributions = [
    { member_id: memberIds[0], amount: 500, type: 'activity', description: '参加巨龙之魂团队副本', created_at: '2026-06-15 22:30:00', related_id: activityIds[3] },
    { member_id: memberIds[0], amount: 1000, type: 'donate', description: '捐献源质矿石 x10', created_at: '2026-06-14 10:00:00', related_id: null },
    { member_id: memberIds[1], amount: 400, type: 'activity', description: '参加奥杜尔成就团', created_at: '2026-06-15 22:30:00', related_id: activityIds[3] },
    { member_id: memberIds[1], amount: 300, type: 'reward', description: '月度优秀管理奖励', created_at: '2026-06-01 09:00:00', related_id: null },
    { member_id: memberIds[2], amount: 450, type: 'activity', description: '参加奥杜尔成就团', created_at: '2026-06-15 22:30:00', related_id: activityIds[3] },
    { member_id: memberIds[3], amount: 500, type: 'activity', description: '参加奥杜尔成就团', created_at: '2026-06-15 22:30:00', related_id: activityIds[3] },
    { member_id: memberIds[3], amount: 800, type: 'donate', description: '捐献治疗药水 x50', created_at: '2026-06-12 15:00:00', related_id: null },
    { member_id: memberIds[4], amount: 350, type: 'activity', description: '带新人刷火焰之地', created_at: '2026-06-13 21:00:00', related_id: null },
    { member_id: memberIds[5], amount: 50, type: 'penalty', description: '活动缺席未请假', created_at: '2026-06-14 10:00:00', related_id: null },
    { member_id: memberIds[6], amount: 300, type: 'activity', description: '参加日常副本', created_at: '2026-06-17 20:00:00', related_id: null },
    { member_id: memberIds[7], amount: 250, type: 'activity', description: '参加日常副本', created_at: '2026-06-17 20:00:00', related_id: null },
    { member_id: memberIds[9], amount: 200, type: 'donate', description: '捐献生命精华 x5', created_at: '2026-06-16 18:00:00', related_id: null },
  ];

  contributions.forEach((c) => {
    jsonDb.insert('contribution_record', c);
  });

  const announcements = [
    {
      title: '【重要】6月20日巨龙之魂团队副本安排',
      content: '各位成员大家好！本周六晚8点将进行巨龙之魂团队副本，请已报名的成员提前15分钟上线集合。请准备好大药水、符文和食物补给。未报名但想参加的成员请联系副会长月影剑客。\n\n注意事项：\n1. 请保持语音畅通\n2. 听从团长指挥\n3. 掉落按DKP分配',
      is_pinned: 1,
      target_roles: JSON.stringify(['president', 'vice_president', 'leader', 'member']),
      created_by: memberIds[0],
      created_at: '2026-06-18 09:00:00',
      read_by: JSON.stringify([memberIds[0], memberIds[1], memberIds[3]]),
    },
    {
      title: '公会仓库借用规则更新',
      content: '为了更公平地使用公会资源，即日起借用规则如下：\n1. 史诗及以上品质物品需会长审批\n2. 普通物品借用期限最长7天\n3. 逾期未还将扣除贡献度\n4. 每位成员同时借用物品不超过3件',
      is_pinned: 1,
      target_roles: JSON.stringify(['president', 'vice_president', 'leader', 'member']),
      created_by: memberIds[1],
      created_at: '2026-06-15 14:00:00',
      read_by: JSON.stringify([memberIds[0], memberIds[1], memberIds[2], memberIds[4], memberIds[6]]),
    },
    {
      title: '欢迎新成员加入！',
      content: '最近公会加入了几位新成员，让我们热烈欢迎！希望大家在公会里玩得开心，有问题随时找管理团队。',
      is_pinned: 0,
      target_roles: JSON.stringify(['president', 'vice_president', 'leader', 'member']),
      created_by: memberIds[2],
      created_at: '2026-06-14 10:30:00',
      read_by: JSON.stringify([memberIds[0], memberIds[1], memberIds[2], memberIds[3], memberIds[4], memberIds[6], memberIds[7]]),
    },
    {
      title: '6月份贡献度排行',
      content: '截至6月15日贡献度前三名：\n🥇 龙腾九天 - 15800\n🥈 月影剑客 - 12400\n🥉 圣光使者 - 11200\n\n月底贡献度第一的成员将获得额外奖励！',
      is_pinned: 0,
      target_roles: JSON.stringify(['president', 'vice_president', 'leader', 'member']),
      created_by: memberIds[0],
      created_at: '2026-06-16 18:00:00',
      read_by: JSON.stringify([memberIds[0], memberIds[1], memberIds[2], memberIds[3], memberIds[5], memberIds[7], memberIds[9]]),
    },
  ];

  announcements.forEach((a) => {
    jsonDb.insert('announcement', a);
  });

  jsonDb.markInitialized();

  console.log('Database seeded successfully!');
  console.log(`  - Members: ${members.length}`);
  console.log(`  - Roles: 4`);
  console.log(`  - Activities: ${activities.length}`);
  console.log(`  - Warehouse items: ${items.length}`);
  console.log(`  - Borrow records: ${borrows.length}`);
  console.log(`  - Contribution records: ${contributions.length}`);
  console.log(`  - Announcements: ${announcements.length}`);
}

export function initDatabase() {
  console.log('Initializing database...');
  seedData();
  console.log('Database initialized.');
}

export function resetDatabase() {
  jsonDb.reset();
  initDatabase();
}

if (process.argv[1]?.includes('init.ts')) {
  initDatabase();
}
