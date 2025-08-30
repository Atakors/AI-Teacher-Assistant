import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, AdminUserView } from '../types';
import { getAllUsers, updateUserByAdmin, getUserById, deleteUserByAdmin, bulkUpgradeUsersByAdmin, bulkAddCreditsByAdmin } from '../services/dbService';
import AdminUserEditModal from './AdminUserEditModal';
import AdminAddCreditsModal from './AdminAddCreditsModal';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { SparklesIcon, UsersIcon, CheckBadgeIcon, TrashIcon, ArrowsUpDownIcon, ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon, PlusIcon, WifiIcon, PencilIcon } from './constants';
import { supabase } from '../services/supabase';

interface AdminDashboardProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  setNotification: (notification: { message: string, type: 'success' | 'error' } | null) => void;
}

const StatCard: React.FC<{ title: string; value: number | string; Icon: React.ElementType }> = ({ title, value, Icon }) => (
  <div className="material-card p-4 flex items-center">
    <div className="p-3 rounded-full mr-4" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }}>
      <Icon className="w-6 h-6 text-[var(--color-primary)]" />
    </div>
    <div>
      <p className="text-sm text-[var(--color-on-surface-variant)]">{title}</p>
      <p className="text-2xl font-bold text-[var(--color-on-surface)]">{value}</p>
    </div>
  </div>
);

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'N/A';
        }
        return date.toLocaleDateString();
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'N/A';
    }
};


const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, setCurrentUser, setNotification }) => {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [stats, setStats] = useState({ total: 0, pro: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddCreditsModalOpen, setIsAddCreditsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Bulk action state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Presence state
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Data management state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{ plan: 'all' | 'free' | 'pro'; role: 'all' | 'user' | 'admin' }>({ plan: 'all', role: 'all' });
  const [sortConfig, setSortConfig] = useState<{ key: keyof AdminUserView; direction: 'ascending' | 'descending' } | null>({ key: 'createdAt', direction: 'descending' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      setStats({
        total: allUsers.length,
        pro: allUsers.filter(u => u.plan === 'pro').length
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

  // Presence tracking effect - LISTENER ONLY
  useEffect(() => {
    // This channel is a listener only, it does not track presence to avoid conflicts.
    const channel = supabase.channel('online_users');

    const handleSync = () => {
      const presences = channel.presenceState();
      // The keys of the presence state are the user UIDs we tracked with.
      const userIds = Object.keys(presences);
      setOnlineUsers(userIds);
    };

    channel
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => [...new Set([...prev, key])]);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => prev.filter(uid => uid !== key));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const processedUsers = useMemo(() => {
    let filtered = [...users];

    if (filters.plan !== 'all') {
      filtered = filtered.filter(u => u.plan === filters.plan);
    }
    if (filters.role !== 'all') {
      filtered = filtered.filter(u => u.role === filters.role);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [users, filters, searchTerm, sortConfig]);

  const totalPages = Math.ceil(processedUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [processedUsers, currentPage, itemsPerPage]);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
    } else if (currentPage === 0 && totalPages > 0) {
        setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm, itemsPerPage]);

  useEffect(() => {
    if (!selectAllCheckboxRef.current) return;
    const allVisibleSelected = paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUserIds.includes(u.uid));
    const someVisibleSelected = paginatedUsers.some(u => selectedUserIds.includes(u.uid));
    selectAllCheckboxRef.current.checked = allVisibleSelected;
    selectAllCheckboxRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
  }, [selectedUserIds, paginatedUsers]);

  const handleSelectUser = (userId: string) => {
    setSelectedUserIds(prev =>
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      const allVisibleIds = paginatedUsers.map(u => u.uid);
      if (e.target.checked) {
          setSelectedUserIds(prev => [...new Set([...prev, ...allVisibleIds])]);
      } else {
          setSelectedUserIds(prev => prev.filter(id => !allVisibleIds.includes(id)));
      }
  };

  const handleSort = (key: keyof AdminUserView) => {
    let direction: 'ascending' | 'descending' = 'descending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  const handleEditUser = (user: User) => {
    const fullUser = users.find(u => u.uid === user.uid);
    if (fullUser) {
        setSelectedUser(fullUser);
        setIsEditModalOpen(true);
    } else {
        setError("Could not find full details for the selected user.");
    }
  };

  const handleSaveUser = async (userId: string, updates: Partial<User>) => {
    try {
      await updateUserByAdmin(userId, updates);
      await loadUsers();
      setIsEditModalOpen(false);
      setNotification({ message: 'User updated successfully!', type: 'success' });
      if (userId === currentUser.uid) {
          const updatedCurrentUser = await getUserById(userId);
          if (updatedCurrentUser) setCurrentUser(updatedCurrentUser);
      }
    } catch (e) {
      console.error("Failed to save user updates:", e);
      setIsEditModalOpen(false);
      setNotification({ message: 'Failed to update user.', type: 'error' });
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Are you sure you want to permanently delete user ${user.name} (${user.email})? This action is irreversible.`)) {
      try {
        await deleteUserByAdmin(user.uid);
        await loadUsers();
        setNotification({ message: 'User deleted successfully!', type: 'success' });
      } catch (e) {
        console.error("Failed to delete user:", e);
        setNotification({ message: 'Failed to delete user.', type: 'error' });
      }
    }
  };
  
  const handleBulkUpgrade = async () => {
      if (selectedUserIds.length === 0) return;
      if (window.confirm(`Are you sure you want to upgrade ${selectedUserIds.length} users to the Pro plan?`)) {
          setIsBulkProcessing(true);
          try {
              await bulkUpgradeUsersByAdmin(selectedUserIds);
              await loadUsers();
              setSelectedUserIds([]);
              setNotification({ message: `${selectedUserIds.length} users upgraded successfully!`, type: 'success' });
          } catch (e) {
              setNotification({ message: 'Bulk upgrade failed.', type: 'error' });
          } finally {
              setIsBulkProcessing(false);
          }
      }
  };
  
  const handleBulkAddCredits = async (creditsToAdd: { [key: string]: number }) => {
      if (selectedUserIds.length === 0) return;
      setIsBulkProcessing(true);
      try {
          await bulkAddCreditsByAdmin(selectedUserIds, creditsToAdd);
          await loadUsers();
          setSelectedUserIds([]);
          setIsAddCreditsModalOpen(false);
          setNotification({ message: `Credits added to ${selectedUserIds.length} users successfully!`, type: 'success' });
      } catch (e) {
          setNotification({ message: 'Failed to add credits.', type: 'error' });
      } finally {
          setIsBulkProcessing(false);
      }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading admin data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-on-bg)]">
          Admin Dashboard
          <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-primary)' }} />
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Users" value={stats.total} Icon={UsersIcon} />
        <StatCard title="Pro Subscribers" value={stats.pro} Icon={CheckBadgeIcon} />
        <StatCard title="Online Visitors" value={onlineUsers.length} Icon={WifiIcon} />
      </div>

      <div className="material-card p-4 sm:p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3 p-2"
          />
          <div className="flex gap-4">
            <select value={filters.plan} onChange={e => setFilters({...filters, plan: e.target.value as any})} className="p-2">
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
            </select>
            <select value={filters.role} onChange={e => setFilters({...filters, role: e.target.value as any})} className="p-2">
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={loadUsers} className="p-2 material-button material-button-secondary text-sm" title="Refresh Users">
                <ArrowPathIcon className="w-5 h-5"/>
            </button>
          </div>
        </div>
        
        {selectedUserIds.length > 0 && (
            <div className="bg-[var(--color-surface-variant)] p-3 rounded-lg mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm font-medium">{selectedUserIds.length} user(s) selected</p>
                <div className="flex gap-2">
                    <button onClick={handleBulkUpgrade} disabled={isBulkProcessing} className="material-button material-button-secondary text-xs">
                        {isBulkProcessing ? 'Processing...' : 'Upgrade to Pro'}
                    </button>
                    <button onClick={() => setIsAddCreditsModalOpen(true)} disabled={isBulkProcessing} className="material-button material-button-secondary text-xs flex items-center gap-1">
                        <PlusIcon className="w-4 h-4" />
                        {isBulkProcessing ? 'Processing...' : 'Add Credits'}
                    </button>
                </div>
            </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-[var(--color-on-surface-variant)]">
            <thead className="text-xs uppercase bg-[var(--color-surface-variant)]">
              <tr>
                 <th scope="col" className="p-4"><input type="checkbox" ref={selectAllCheckboxRef} onChange={handleSelectAll} /></th>
                 <th scope="col" className="px-6 py-3">User</th>
                 <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('plan')}>Plan <ArrowsUpDownIcon className="inline w-4 h-4 ml-1"/></th>
                 <th scope="col" className="px-6 py-3">Credits</th>
                 <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('createdAt')}>Joined <ArrowsUpDownIcon className="inline w-4 h-4 ml-1"/></th>
                 <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('subscriptionStartDate')}>Sub Start <ArrowsUpDownIcon className="inline w-4 h-4 ml-1"/></th>
                 <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('subscriptionEndDate')}>Sub End <ArrowsUpDownIcon className="inline w-4 h-4 ml-1"/></th>
                 <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map(user => (
                <tr key={user.uid} className="border-b border-[var(--color-outline)] hover:bg-[var(--color-surface-variant)]">
                  <td className="p-4"><input type="checkbox" checked={selectedUserIds.includes(user.uid)} onChange={() => handleSelectUser(user.uid)} /></td>
                  <td className="px-6 py-4 font-medium text-[var(--color-on-surface)] whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                            {user.avatar ? <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-600"></div> }
                            <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${onlineUsers.includes(user.uid) ? 'bg-green-400' : 'bg-slate-400'}`}></span>
                        </div>
                        <div>
                            <div>{user.name} {user.role === 'admin' && <span className="text-xs font-bold text-[var(--color-primary)]">(Admin)</span>}</div>
                            <div className="text-xs text-[var(--color-on-surface-variant)]">{user.email}</div>
                        </div>
                      </div>
                  </td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 text-xs font-medium rounded-full ${user.plan === 'pro' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>{user.plan}</span></td>
                  <td className="px-6 py-4 text-xs">
                    <div>L: {user.lessonPlannerCredits} | F: {user.flashcardGeneratorCredits}</div>
                    <div>E: {user.examGeneratorCredits} | W: {user.wordGameGeneratorCredits}</div>
                  </td>
                  <td className="px-6 py-4">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4">{formatDate(user.subscriptionStartDate)}</td>
                  <td className="px-6 py-4">{formatDate(user.subscriptionEndDate)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditUser(user)} className="p-2 text-slate-500 hover:bg-slate-500/10 rounded-full"><PencilIcon className="w-4 h-4"/></button>
                      <button onClick={() => handleDeleteUser(user)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <nav className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 p-4" aria-label="Table navigation">
            <span className="text-sm font-normal">
                Showing <span className="font-semibold">{Math.min((currentPage - 1) * itemsPerPage + 1, processedUsers.length)}-{Math.min(currentPage * itemsPerPage, processedUsers.length)}</span> of <span className="font-semibold">{processedUsers.length}</span>
            </span>
            <div className="flex items-center gap-2">
                <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))} className="p-2 text-sm">
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                </select>
                <ul className="inline-flex items-stretch -space-x-px">
                    <li><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-2 ml-0 leading-tight rounded-l-lg border border-[var(--color-outline)] hover:bg-[var(--color-surface-variant)] disabled:opacity-50"><ChevronLeftIcon className="w-4 h-4"/></button></li>
                    <li><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-2 leading-tight rounded-r-lg border border-[var(--color-outline)] hover:bg-[var(--color-surface-variant)] disabled:opacity-50"><ChevronRightIcon className="w-4 h-4"/></button></li>
                </ul>
            </div>
        </nav>

      </div>
       {isEditModalOpen && selectedUser && (
        <AdminUserEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={selectedUser}
          onSave={handleSaveUser}
        />
      )}
      {isAddCreditsModalOpen && (
        <AdminAddCreditsModal
            isOpen={isAddCreditsModalOpen}
            onClose={() => setIsAddCreditsModalOpen(false)}
            onAddCredits={handleBulkAddCredits}
            selectedUserCount={selectedUserIds.length}
            isProcessing={isBulkProcessing}
        />
      )}
    </div>
  );
};

export default AdminDashboard;