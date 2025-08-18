import React, { useState } from 'react';
import { User } from '../types';
import { XIcon } from './constants';

interface AdminUserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (userId: string, updates: Partial<User>) => void;
}

const AdminUserEditModal: React.FC<AdminUserEditModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [plan, setPlan] = useState<'free' | 'premium'>(user.plan);
  const [lessonCredits, setLessonCredits] = useState(user.lessonCreditsRemaining);
  const [imageCredits, setImageCredits] = useState(user.imageCreditsRemaining);
  const [role, setRole] = useState<'user' | 'admin'>(user.role);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(user.uid, { plan, lessonCreditsRemaining: lessonCredits, imageCreditsRemaining: imageCredits, role });
  };

  const inputClasses = "w-full p-3 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] border border-slate-300 bg-slate-50";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl text-slate-900 overflow-hidden" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-800 transition-colors z-20">
          <XIcon className="w-6 h-6" />
        </button>
        <div className="p-8">
          <h3 className="text-xl font-semibold mb-2 text-center text-slate-800">Edit User</h3>
          <p className="text-sm text-slate-500 text-center mb-6">{user.name} ({user.email})</p>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Subscription Plan</label>
              <select value={plan} onChange={e => setPlan(e.target.value as 'free' | 'premium')} className={inputClasses}>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Role</label>
              <select value={role} onChange={e => setRole(e.target.value as 'user' | 'admin')} className={inputClasses}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-600 mb-1 block">Lesson Credits</label>
                <input 
                  type="number" 
                  value={lessonCredits} 
                  onChange={e => setLessonCredits(parseInt(e.target.value, 10) || 0)} 
                  className={inputClasses}
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-600 mb-1 block">Image Credits</label>
                <input 
                  type="number" 
                  value={imageCredits} 
                  onChange={e => setImageCredits(parseInt(e.target.value, 10) || 0)} 
                  className={inputClasses}
                />
              </div>
            </div>
            <button onClick={handleSave} className="w-full mt-6 py-3 font-semibold rounded-lg blueprint-button">
                Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserEditModal;