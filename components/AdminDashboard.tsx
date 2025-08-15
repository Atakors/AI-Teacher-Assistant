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
    setError(null); // Reset error state on new load attempt

    // Promise that rejects after a timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('The request timed out after 15 seconds.')), 15000)
    );

    try {
      // Race the getAllUsers call against the timeout
      const allUsers = await Promise.race([
        getAllUsers(),
        timeoutPromise
      ]);
      setUsers(allUsers);
    } catch (e) {
      let message = 'Failed to load users.';
      if (e instanceof Error) {
        if (e.message.includes('timed out')) {
            message += ' The request timed out. This often indicates a database security policy (RLS) is blocking the query without returning an error. Please ensure admins have SELECT permissions on the users table.';
        } else {
            message += ` Details: ${e.message}`;
        }
      }
      setError(message);
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
        let message = 'Failed to update user subscription.';
        if (e instanceof Error) {
            if (e.message.includes('security policy')) {
                message += ' This is likely a database permissions issue. Please ensure your user has the "admin" role and that the RLS policy for admin updates is correctly configured in your Supabase project.';
            } else {
                message += ` Details: ${e.message}`;
            }
        }
        setError(message);
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

      {error && (
        <div 
            className="aurora-card p-4 mb-4 text-sm" 
            role="alert"
            style={{
                '--color-surface': 'var(--color-error-surface)',
                '--color-border': 'var(--color-error-border)',
                color: 'var(--color-error-text)'
            } as React.CSSProperties}
        >
          <p className="font-bold" style={{ color: 'var(--color-error-accent)' }}>Error</p>
          <p>{error}</p>
        </div>
      )}


      <div className="aurora-card p-4 sm:p-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[var(--color-inset-bg)]">
              <th className="p-3 text-sm font-semibold">Name</th>
              <th className="p-3 text-sm font-semibold">Email</th>
              <th className="p-3 text-sm font-semibold">Plan</th>
              <th className="p-3 text-sm font-semibold">Role</th>
              <th className="p-3 text-sm font-semibold">Lesson Credits</th>
              <th className="p-3 text-sm font-semibold">Image Credits</th>
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
                <td className="p-3 text-sm text-[var(--color-text-secondary)]">{user.lesson_credits_remaining}</td>
                <td className="p-3 text-sm text-[var(--color-text-secondary)]">{user.image_credits_remaining}</td>
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