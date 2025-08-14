

import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getAllUsers, updateUserByAdmin, getUserById } from '../services/dbService';
import AdminUserEditModal from './AdminUserEditModal';
import LoadingSpinner from './LoadingSpinner';
import { SparklesIcon } from '../constants';

interface AdminDashboardProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, setCurrentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (e) {
      setError('Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveChanges = async (userId: string, updates: Partial<User>) => {
    try {
      await updateUserByAdmin(userId, updates);
      
      // If the admin is editing their own profile, update the app state in real-time
      if (userId === currentUser.uid) {
        const updatedCurrentUser = await getUserById(userId);
        if (updatedCurrentUser) {
            setCurrentUser(updatedCurrentUser);
        }
      }

      // Refresh the user list to show updated data for the dashboard itself
      await loadUsers();
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (e) {
      setError('Failed to update user subscription.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading users..." />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-text-primary)]">
          Admin Dashboard
          <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-accent)' }} />
        </h2>
        <p className="text-[var(--color-text-secondary)] mt-2">Manage user subscriptions and access.</p>
      </div>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      <div className="aurora-card p-4 sm:p-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[var(--color-inset-bg)]">
              <th className="p-3 text-sm font-semibold">Name</th>
              <th className="p-3 text-sm font-semibold">Email</th>
              <th className="p-3 text-sm font-semibold">Plan</th>
              <th className="p-3 text-sm font-semibold">Role</th>
              <th className="p-3 text-sm font-semibold">Lessons Used</th>
              <th className="p-3 text-sm font-semibold">Flashcards Used</th>
              <th className="p-3 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {users.map((user) => (
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
                <td className="p-3 text-sm text-[var(--color-text-secondary)]">{user.lessonGenerations} / 3</td>
                <td className="p-3 text-sm text-[var(--color-text-secondary)]">{user.flashcardGenerations} / 3</td>
                <td className="p-3 text-sm">
                  <button onClick={() => handleEditUser(user)} className="font-medium text-[var(--color-accent)] hover:underline">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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