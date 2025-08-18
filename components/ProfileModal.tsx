


import React, { useState, useRef } from 'react';
import { User, CurriculumLevel } from '../types';
import { XIcon, SaveIcon, UserCircleIcon, ExclamationTriangleIcon, CURRICULUM_LEVEL_OPTIONS_FOR_VIEW } from './constants';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSave: (updates: Partial<User>) => Promise<void>;
  onPasswordChange: (currentPass: string, newPass: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

type ActiveTab = 'profile' | 'preferences' | 'security' | 'dangerZone';

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, currentUser, onSave, onPasswordChange, onDeleteAccount }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  
  // Profile Tab State
  const [title, setTitle] = useState(currentUser.title || '');
  const [name, setName] = useState(currentUser.name);
  const [primarySchool, setPrimarySchool] = useState(currentUser.primarySchool || '');
  const [specialization, setSpecialization] = useState(currentUser.specialization || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState<string | null>(currentUser.avatar || null);
  const [profileMessage, setProfileMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preferences Tab State
  const [defaultCurriculum, setDefaultCurriculum] = useState(currentUser.defaultCurriculum || CurriculumLevel.SELECT_YEAR);
  const [prefsMessage, setPrefsMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Security Tab State (Note: Firebase makes this more complex, so it's currently disabled)
  // const [currentPassword, setCurrentPassword] = useState('');
  // const [newPassword, setNewPassword] = useState('');
  // const [confirmNewPassword, setConfirmNewPassword] = useState('');
  // const [securityMessage, setSecurityMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Danger Zone State
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  if (!isOpen) return null;
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => setAvatar(event.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    if (!name.trim()) {
        setProfileMessage({ type: 'error', text: 'Name cannot be empty.' });
        return;
    }
    try {
        await onSave({ name: name.trim(), avatar: avatar || undefined, title, primarySchool, specialization, bio });
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
        setProfileMessage({ type: 'error', text: 'Failed to update profile.' });
    }
  };

  const handlePreferencesSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefsMessage(null);
    try {
        await onSave({ defaultCurriculum });
        setPrefsMessage({ type: 'success', text: 'Preferences saved successfully!' });
    } catch (err) {
        setPrefsMessage({ type: 'error', text: 'Failed to save preferences.' });
    }
  }

  const handleDelete = async () => {
    alert("Account deletion is a sensitive operation and has been temporarily disabled in this version for security reasons.");
    // if (deleteConfirmText.toLowerCase() !== 'delete') {
    //     alert("Please type 'delete' to confirm.");
    //     return;
    // }
    // if (window.confirm("Are you absolutely sure? This action cannot be undone and will permanently delete your account and all your data.")) {
    //     try {
    //         await onDeleteAccount();
    //     } catch(err) {
    //         alert("Failed to delete account. Please try again.");
    //     }
    // }
  };
  
  const inputClasses = "w-full p-3 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] border border-slate-300 bg-slate-50";
  const TabButton: React.FC<{tabId: ActiveTab, children: React.ReactNode, isDanger?: boolean}> = ({tabId, children, isDanger}) => (
    <button onClick={() => setActiveTab(tabId)} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tabId ? `border-b-2 ${isDanger ? 'text-red-600 border-red-600' : 'text-[var(--color-accent)] border-[var(--color-accent)]'}` : 'text-slate-500 hover:text-slate-800'}`}>
        {children}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl text-slate-900 overflow-hidden" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-800 transition-colors z-20">
          <XIcon className="w-6 h-6" />
        </button>
        <div className="border-b border-slate-200">
            <nav className="flex items-center justify-center -mb-px">
                <TabButton tabId="profile">Profile</TabButton>
                <TabButton tabId="preferences">Preferences</TabButton>
                {/* Security tab is hidden as Firebase password changes are more complex */}
                {/* <TabButton tabId="security">Security</TabButton> */}
                <TabButton tabId="dangerZone" isDanger>Danger Zone</TabButton>
            </nav>
        </div>
        <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar-container">
            {activeTab === 'profile' && (
                <form onSubmit={handleProfileSave}>
                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                        {avatar ? <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover"/> : <UserCircleIcon className="w-24 h-24 text-slate-300" />}
                        <div className="text-center sm:text-left">
                            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} style={{display: 'none'}} accept="image/*" />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-semibold py-2 px-4 rounded-lg blueprint-button-secondary">Change Picture</button>
                            <p className="text-xs text-slate-500 mt-2">Recommended: Square image (e.g., 200x200px)</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-1 block">Title</label>
                            <select value={title} onChange={e => setTitle(e.target.value)} className={inputClasses}>
                                <option value="">None</option>
                                <option>Mr.</option><option>Mrs.</option><option>Ms.</option><option>Dr.</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-1 block">Full Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
                        </div>
                         <div>
                            <label className="text-sm font-medium text-slate-600 mb-1 block">Primary School</label>
                            <input type="text" value={primarySchool} onChange={e => setPrimarySchool(e.target.value)} className={inputClasses} placeholder="e.g., Oakwood Primary"/>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-1 block">Specialization</label>
                            <input type="text" value={specialization} onChange={e => setSpecialization(e.target.value)} className={inputClasses} placeholder="e.g., English, Year 3 Lead" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-sm font-medium text-slate-600 mb-1 block">Professional Bio</label>
                            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className={`${inputClasses} resize-y`} placeholder="A short 'About Me' to personalize your experience."></textarea>
                        </div>
                         <div className="sm:col-span-2">
                            <label className="text-sm font-medium text-slate-600 mb-1 block">Email</label>
                            <input type="email" value={currentUser.email || 'N/A'} className={`${inputClasses} bg-slate-200 cursor-not-allowed`} readOnly />
                        </div>
                    </div>
                     {profileMessage && <p className={`mt-4 text-sm text-center ${profileMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>{profileMessage.text}</p>}
                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg text-sm blueprint-button-secondary">Close</button>
                        <button type="submit" className="py-2 px-4 rounded-lg text-sm text-white blueprint-button flex items-center gap-2">
                            <SaveIcon className="w-5 h-5" /> Save Profile
                        </button>
                    </div>
                </form>
            )}
             {activeTab === 'preferences' && (
                <form onSubmit={handlePreferencesSave}>
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">App Preferences</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-1 block">Default Curriculum</label>
                             <select value={defaultCurriculum} onChange={e => setDefaultCurriculum(e.target.value as CurriculumLevel)} className={inputClasses}>
                                <option value={CurriculumLevel.SELECT_YEAR}>None (Select on start)</option>
                                {CURRICULUM_LEVEL_OPTIONS_FOR_VIEW.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">This curriculum will be automatically selected when you open the Lesson Planner.</p>
                        </div>
                    </div>
                     {prefsMessage && <p className={`mt-4 text-sm text-center ${prefsMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>{prefsMessage.text}</p>}
                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg text-sm blueprint-button-secondary">Close</button>
                        <button type="submit" className="py-2 px-4 rounded-lg text-sm text-white blueprint-button flex items-center gap-2">
                            <SaveIcon className="w-5 h-5" /> Save Preferences
                        </button>
                    </div>
                </form>
            )}
            {activeTab === 'dangerZone' && (
                <div>
                    <div className="p-4 rounded-lg border border-red-300 bg-red-50">
                        <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-6 h-6" />
                            Danger Zone
                        </h3>
                        <p className="mt-2 text-sm text-red-700">Deleting your account is a permanent action. All your data, including schools, classes, timetables, and calendar events, will be removed forever. This cannot be undone.</p>
                        <div className="mt-4">
                            <label htmlFor="delete-confirm" className="text-sm font-medium text-red-800 mb-1 block">To confirm, type "delete" below:</label>
                            <input id="delete-confirm" type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} className={`${inputClasses} border-red-400 focus:ring-red-500`} />
                        </div>
                        <button onClick={handleDelete} className="w-full mt-4 py-2 px-4 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg">
                            Delete My Account
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;