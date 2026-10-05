import express from 'express';
import { dbEngine, Group, GroupMember } from '../db.js';

export const groupsRouter = express.Router();

// GET all groups (with optional student/teacher filtering)
groupsRouter.get('/', (req, res) => {
  const db = dbEngine.db;
  const { studentId, teacherId } = req.query;

  let groups = [...db.groups];

  if (teacherId) {
    groups = groups.filter(g => g.teacher_id === teacherId);
  } else if (studentId) {
    const memberGroupIds = db.group_members
      .filter(gm => gm.student_id === studentId)
      .map(gm => gm.group_id);
    groups = groups.filter(g => memberGroupIds.includes(g.id));
  }

  // Enrich with member count and teacher info
  const enriched = groups.map(g => {
    const members = db.group_members.filter(gm => gm.group_id === g.id);
    const teacher = db.profiles.find(p => p.id === g.teacher_id);
    const testsCount = db.tests.filter(t => t.group_id === g.id).length;
    return {
      ...g,
      memberCount: members.length,
      teacherName: teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Tayinlanmagan',
      testsCount
    };
  });

  return res.json({ groups: enriched });
});

// GET group by ID with members list
groupsRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const db = dbEngine.db;
  const group = db.groups.find(g => g.id === id);

  if (!group) {
    return res.status(404).json({ error: "Guruh topilmadi." });
  }

  const memberLinks = db.group_members.filter(gm => gm.group_id === id);
  const students = memberLinks.map(gm => {
    const profile = db.profiles.find(p => p.id === gm.student_id);
    return {
      ...profile,
      joinedAt: gm.joined_at
    };
  }).filter(Boolean);

  const teacher = db.profiles.find(p => p.id === group.teacher_id);

  return res.json({
    group: {
      ...group,
      teacherName: teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Tayinlanmagan',
      students
    }
  });
});

// CREATE group
groupsRouter.post('/', (req, res) => {
  const { name, description, teacherId } = req.body;
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: "Guruh nomi kiritilishi shart." });
  }

  const db = dbEngine.db;
  const newGroup: Group = {
    id: `grp-${Date.now()}`,
    name: name.trim(),
    description: (description || '').trim(),
    teacher_id: teacherId || db.profiles.find(p => p.role === 'TEACHER')?.id || '',
    is_active: true,
    created_at: new Date().toISOString()
  };

  db.groups.push(newGroup);
  db.audit_logs.push({
    id: `log-${Date.now()}`,
    user_id: teacherId || null,
    user_name: 'Ustoz/Admin',
    action: 'GROUP_CREATED',
    target_type: 'GROUP',
    target_id: newGroup.id,
    metadata_json: { name: newGroup.name },
    created_at: new Date().toISOString()
  });

  dbEngine.persist();
  return res.json({ success: true, group: newGroup });
});

// UPDATE group
groupsRouter.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, teacherId, isActive } = req.body;

  const db = dbEngine.db;
  const group = db.groups.find(g => g.id === id);
  if (!group) return res.status(404).json({ error: "Guruh topilmadi." });

  if (name !== undefined) group.name = name.trim();
  if (description !== undefined) group.description = description.trim();
  if (teacherId !== undefined) group.teacher_id = teacherId;
  if (isActive !== undefined) group.is_active = !!isActive;

  dbEngine.persist();
  return res.json({ success: true, group });
});

// DELETE group
groupsRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = dbEngine.db;
  const index = db.groups.findIndex(g => g.id === id);
  if (index === -1) return res.status(404).json({ error: "Guruh topilmadi." });

  const deleted = db.groups.splice(index, 1)[0];
  // Remove memberships
  db.group_members = db.group_members.filter(gm => gm.group_id !== id);

  db.audit_logs.push({
    id: `log-${Date.now()}`,
    user_id: null,
    user_name: 'Ustoz/Admin',
    action: 'GROUP_DELETED',
    target_type: 'GROUP',
    target_id: id,
    metadata_json: { name: deleted.name },
    created_at: new Date().toISOString()
  });

  dbEngine.persist();
  return res.json({ success: true, message: "Guruh o'chirildi." });
});

// ADD student to group
groupsRouter.post('/:id/students', (req, res) => {
  const { id } = req.params;
  const { studentId } = req.body;

  const db = dbEngine.db;
  const group = db.groups.find(g => g.id === id);
  if (!group) return res.status(404).json({ error: "Guruh topilmadi." });

  const student = db.profiles.find(p => p.id === studentId);
  if (!student) return res.status(404).json({ error: "O'quvchi topilmadi." });

  const exists = db.group_members.some(gm => gm.group_id === id && gm.student_id === studentId);
  if (exists) {
    return res.status(400).json({ error: "O'quvchi ushbu guruhga allaqachon biriktirilgan." });
  }

  const membership: GroupMember = {
    id: `gm-${Date.now()}`,
    group_id: id,
    student_id: studentId,
    joined_at: new Date().toISOString()
  };

  db.group_members.push(membership);
  dbEngine.persist();

  return res.json({ success: true, membership });
});

// REMOVE student from group
groupsRouter.delete('/:id/students/:studentId', (req, res) => {
  const { id, studentId } = req.params;
  const db = dbEngine.db;
  db.group_members = db.group_members.filter(gm => !(gm.group_id === id && gm.student_id === studentId));
  dbEngine.persist();
  return res.json({ success: true, message: "O'quvchi guruhdan chiqarildi." });
});
