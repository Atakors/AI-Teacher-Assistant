import React, { useState, useEffect, useMemo } from 'react';
import { User, AdminUserView } from '../types';
import { getAllUsers, updateUserByAdmin, getUserById, deleteUserByAdmin } from '../services/dbService';
import AdminUserEditModal from './AdminUserEditModal';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { SparklesIcon, UsersIcon, CheckBadgeIcon, TrashIcon } from './constants';

interface AdminDashboardProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
}

const StatCard: React.FC<{ title: string; value: number | string; Icon: React.ElementType }> = ({ title, value, Icon }) => (
  <div className="aurora-card p-4 flex items-center">
    <div className="p-3 rounded-full mr-4 bg-[var(--color-accent)]/10">
      <Icon className="w-6 h-6 text-[var(--color-accent)]" />
    </div>
    <div>
      <p className="text-sm text-[var(--color-text-secondary)]">{title}</p>
      <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
    </div>
  </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, setCurrentUser }) => {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [stats, setStats] = useState({ total: 0, premium: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      setStats({
        total: allUsers.length,
        premium: allUsers.filter(u => u.plan === 'premium').length
      });
    } catch (e) {
      console.error("Failed to load users for admin dashboard:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to load users: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, users]);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteUser = async (userToDelete: AdminUserView) => {
    if (window.confirm(`Are you sure you want to permanently delete ${userToDelete.name} (${userToDelete.email})? This action cannot be undone.`)) {
        if (userToDelete.uid === currentUser.uid) {
            setError("You cannot delete your own account from the admin dashboard.");
            return;
        }
        try {
            await deleteUserByAdmin(userToDelete.uid);
            await loadUsers(); // Refresh the user list
        } catch(e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to delete user: ${errorMessage}`);
        }
    }
  };

  const handleSaveChanges = async (userId: string, updates: Partial<User>) => {
    try {
      await updateUserByAdmin(userId, updates);
      if (userId === currentUser.uid) {
        const updatedCurrentUser = await getUserById(userId);
        if (updatedCurrentUser) setCurrentUser(updatedCurrentUser);
      }
      await loadUsers();
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to update user: ${errorMessage}`);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading users..." />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-text-primary)]">
          Admin Dashboard
          <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-accent)' }} />
        </h2>
        <p className="text-[var(--color-text-secondary)] mt-2">Manage users and application data.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard title="Total Users" value={stats.total} Icon={UsersIcon} />
        <StatCard title="Premium Users" value={stats.premium} Icon={CheckBadgeIcon} />
      </div>

      {error && <ErrorMessage message={error} />}

      {/* User Management Table */}
      <div className="aurora-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">User Management</h3>
            <input 
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead>
                <tr className="bg-[var(--color-inset-bg)]">
                <th className="p-3 text-sm font-semibold">Name</th>
                <th className="p-3 text-sm font-semibold">Email</th>
                <th className="p-3 text-sm font-semibold">Plan</th>
                <th className="p-3 text-sm font-semibold">Role</th>
                <th className="p-3 text-sm font-semibold">Lesson Credits</th>
                <th className="p-3 text-sm font-semibold">Image Credits</th>
                <th className="p-3 text-sm font-semibold">Joined At</th>
                <th className="p-3 text-sm font-semibold">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
                {filteredUsers.map((user) => (
                <tr key={user.uid}>
                    <td className="p-3 text-sm text-[var(--color-text-primary)]">{user.name}</td>
                    <td className="p-3 text-sm text-[var(--color-text-secondary)]">{user.email}</td>
                    <td className="p-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.plan === 'premium' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'}`}>
                        {user.plan}
                    </span>
                    </td>
                    <td className="p-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'}`}>
                        {user.role}
                    </span>
                    </td>
                    <td className="p-3 text-sm text-center text-[var(--color-text-secondary)]">{user.lessonCreditsRemaining}</td>
                    <td className="p-3 text-sm text-center text-[var(--color-text-secondary)]">{user.imageCreditsRemaining}</td>
                    <td className="p-3 text-sm text-[var(--color-text-secondary)]">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-sm">
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleEditUser(user)} className="font-medium text-[var(--color-accent)] hover:underline">
                                Edit
                            </button>
                            <button onClick={() => handleDeleteUser(user)} className="p-1 text-slate-500 hover:text-rose-500 rounded-full" aria-label={`Delete ${user.name}`}>
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        {filteredUsers.length === 0 && (
            <p className="text-center py-8 text-[var(--color-text-secondary)]">No users found.</p>
        )}
      </div>

      {isEditModalOpen && selectedUser && (
        <AdminUserEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={selectedUser}
          onSave={handleSaveChanges}
        />
      )}
    </div>
  );
};

export default AdminDashboard;