import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Group, UserProfile } from '../types';
import {
  Users,
  PlusCircle,
  Edit2,
  Trash2,
  UserPlus,
  X,
  Search,
  BookOpen,
  CheckCircle2
} from 'lucide-react';

export const TeacherGroupsPage: React.FC = () => {
  const { user, showToast } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupStudents, setGroupStudents] = useState<UserProfile[]>([]);
  const [allStudents, setAllStudents] = useState<UserProfile[]>([]);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          teacherId: user?.id
        })
      });
      if (res.ok) {
        showToast("Guruh muvaffaqiyatli yaratildi!", 'success');
        setIsCreateModalOpen(false);
        setFormName('');
        setFormDescription('');
        loadGroups();
      }
    } catch (err) {
      showToast("Xatolik yuz berdi.", 'error');
    }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !formName.trim()) return;

    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription
        })
      });
      if (res.ok) {
        showToast("Guruh yangilandi!", 'success');
        setIsEditModalOpen(false);
        loadGroups();
      }
    } catch (err) {
      showToast("Xatolik yuz berdi.", 'error');
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!window.confirm(`Haqiqatan ham "${groupName}" guruhini o'chirmoqchimisiz?`)) return;

    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Guruh o'chirildi.", 'info');
        loadGroups();
      }
    } catch (err) {
      showToast("Xatolik yuz berdi.", 'error');
    }
  };

  const openMembersModal = async (group: Group) => {
    setSelectedGroup(group);
    setIsMembersModalOpen(true);

    try {
      const [groupRes, allRes] = await Promise.all([
        fetch(`/api/groups/${group.id}`),
        fetch('/api/admin/users?role=STUDENT')
      ]);

      if (groupRes.ok) {
        const gData = await groupRes.json();
        setGroupStudents(gData.group.students || []);
      }
      if (allRes.ok) {
        const uData = await allRes.json();
        setAllStudents(uData.users || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStudent = async (studentId: string) => {
    if (!selectedGroup) return;

    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
      if (res.ok) {
        showToast("O'quvchi guruhga biriktirildi!", 'success');
        openMembersModal(selectedGroup);
        loadGroups();
      }
    } catch (err) {
      showToast("Xatolik yuz berdi.", 'error');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedGroup) return;

    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/students/${studentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast("O'quvchi guruhdan chiqarildi.", 'info');
        openMembersModal(selectedGroup);
        loadGroups();
      }
    } catch (err) {
      showToast("Xatolik yuz berdi.", 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Guruhlar Boshqaruvi 👥
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sinflar, o‘quv kurslari va ularga biriktirilgan talabalar ro‘yxati
          </p>
        </div>

        <button
          onClick={() => {
            setFormName('');
            setFormDescription('');
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Yangi Guruh Yaratish
        </button>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Users className="w-12 h-12 mx-auto text-slate-400" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">
            Hozircha guruhlar mavjud emas
          </h3>
          <p className="text-xs text-slate-500">
            Testlarni ochish uchun birinchi guruhni yarating (masalan: 7-B yoki English A2).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(group => (
            <div
              key={group.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-lg text-slate-900 dark:text-white">
                    {group.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Faol
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {group.description || "Guruh haqida ma'lumot kiritilmagan."}
                </p>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    {group.memberCount || 0} ta o‘quvchi
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                    {group.testsCount || 0} ta test
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => openMembersModal(group)}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-1 hover:bg-indigo-100 transition-all"
                >
                  <Users className="w-3.5 h-3.5" /> O‘quvchilar ({group.memberCount || 0})
                </button>

                <button
                  onClick={() => {
                    setSelectedGroup(group);
                    setFormName(group.name);
                    setFormDescription(group.description);
                    setIsEditModalOpen(true);
                  }}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Tahrirlash"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDeleteGroup(group.id, group.name)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title="O'chirish"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Yangi Guruh Yaratish
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Guruh nomi
                </label>
                <input
                  type="text"
                  placeholder="masalan: 7-B yoki IELTS Beginner"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Tavsif (ixtiyoriy)
                </label>
                <textarea
                  placeholder="Guruh haqida qisqacha ma'lumot..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25"
                >
                  Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Guruhni Tahrirlash
              </h3>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleEditGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Guruh nomi
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Tavsif
                </label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {isMembersModalOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {selectedGroup.name} — O‘quvchilar ro‘yxati
                </h3>
                <p className="text-xs text-slate-500">
                  Jami: {groupStudents.length} ta o‘quvchi biriktirilgan
                </p>
              </div>
              <button onClick={() => setIsMembersModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Current Group Members */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Guruh a'zolari:
              </div>
              {groupStudents.length === 0 ? (
                <div className="text-xs text-slate-400 p-4 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  Guruhda hali o‘quvchi yo‘q. Quyidan qo‘shing.
                </div>
              ) : (
                groupStudents.map(student => (
                  <div
                    key={student.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {student.phone}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(student.id)}
                      className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 text-[11px] font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      Chiqarish
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add More Students Section */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                O‘quvchi qo‘shish:
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ism yoki telefon bo'yicha qidirish..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1">
                {allStudents
                  .filter(s => !groupStudents.some(gs => gs.id === s.id))
                  .filter(s =>
                    `${s.first_name} ${s.last_name} ${s.phone}`.toLowerCase().includes(studentSearch.toLowerCase())
                  )
                  .map(candidate => (
                    <div
                      key={candidate.id}
                      className="p-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {candidate.first_name} {candidate.last_name}
                        </span>{' '}
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({candidate.phone})
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddStudent(candidate.id)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] hover:bg-indigo-700"
                      >
                        + Qo‘shish
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
