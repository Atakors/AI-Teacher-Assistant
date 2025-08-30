import React, { useState, useRef } from 'react';
import { User, CurriculumLevel } from '../types';
import { XIcon, SaveIcon, UserCircleIcon, ExclamationTriangleIcon, CURRICULUM_LEVEL_OPTIONS_FOR_VIEW, CheckBadgeIcon } from './constants';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSave: (updates: Partial<User>) => Promise<void>;
  onPasswordChange: (currentPass: string, newPass: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onOpenPremiumModal: (featureName?: string) => void;
  onDowngrade: () => Promise<void>;
  isProcessing: boolean;
}

type ActiveTab = 'profile' | 'preferences' | 'subscription' | 'dangerZone';

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        return 'Invalid Date';
    }
};

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, currentUser, onSave, onPasswordChange, onDeleteAccount, onOpenPremiumModal, onDowngrade, isProcessing }) => {
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

  // Subscription Tab State
  const [subError, setSubError] = useState<string | null>(null);
  const [isDowngrading, setIsDowngrading] = useState(false);

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
        await onSave({ name: name.trim(), avatar, title, primarySchool, specialization, bio });
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
  };

  const handleDowngradeClick = async () => {
    setSubError(null);
    setIsDowngrading(true);
    try {
      await onDowngrade();
      // On success, modal will close and global notification will show
    } catch (e) {
      setSubError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsDowngrading(false);
    }
  };

  const inputClasses = "w-full p-3";
  const TabButton: React.FC<{tabId: ActiveTab, children: React.ReactNode, isDanger?: boolean}> = ({tabId, children, isDanger}) => (
    <button onClick={() => setActiveTab(tabId)} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tabId ? ` ${isDanger ? 'text-red-500 border-red-500' : 'text-[var(--color-primary)] border-[var(--color-primary)]'}` : 'text-[var(--color-on-surface-variant)] border-transparent hover:text-[var(--color-on-surface)]'}`}>
        {children}
    </button>
  );

  const isProfileUnchanged = (
    title === (currentUser.title || '') &&
    name === currentUser.name &&
    primarySchool === (currentUser.primarySchool || '') &&
    specialization === (currentUser.specialization || '') &&
    bio === (currentUser.bio || '') &&
    avatar === (currentUser.avatar || null)
  );
  const isProfileSaveDisabled = isProfileUnchanged || !name.trim();

  const isPrefsUnchanged = defaultCurriculum === (currentUser.defaultCurriculum || CurriculumLevel.SELECT_YEAR);
  const isPrefsSaveDisabled = isPrefsUnchanged;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="relative material-card text-[var(--color-on-surface)] overflow-hidden">
          <button onClick={onClose} className="absolute top-3 right-3 p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors z-20">
            <XIcon className="w-6 h-6" />
          </button>
          <div className="border-b border-[var(--color-outline)]">
              <nav className="flex items-center justify-center -mb-px">
                  <TabButton tabId="profile">Profile</TabButton>
                  <TabButton tabId="preferences">Preferences</TabButton>
                  <TabButton tabId="subscription">Subscription</TabButton>
                  <TabButton tabId="dangerZone" isDanger>Danger Zone</TabButton>
              </nav>
          </div>
          <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar-container">
              {activeTab === 'profile' && (
                  <form onSubmit={handleProfileSave}>
                      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                          {avatar ? <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover"/> : <UserCircleIcon className="w-24 h-24 text-[var(--color-outline)]" />}
                          <div className="text-center sm:text-left">
                              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} style={{display: 'none'}} accept="image/*" />
                              <button type="button" onClick={() => fileInputRef.current?.click()} className="material-button material-button-secondary text-sm">Change Picture</button>
                              <p className="text-xs text-[var(--color-on-surface-variant)] mt-2">Recommended: Square image (e.g., 200x200px)</p>
                          </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                              <label className="text-sm font-medium text-[var(--color-on-surface-variant)] mb-1 block">Title</label>
                              <select value={title} onChange={e => setTitle(e.target.value)} className={inputClasses}>
                                  <option value="">None</option>
                                  <option>Mr.</option><option>Mrs.</option><option>Ms.</option><option>Dr.</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-sm font-medium text-[var(--color-on-surface-variant)] mb-1 block">Full Name</label>
                              <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
                          </div>
                           <div>
                              <label className="text-sm font-medium text-[var(--color-on-surface-variant)] mb-1 block">Primary School</label>
                              <input type="text" value={primarySchool} onChange={e => setPrimarySchool(e.target.value)} className={inputClasses} placeholder="e.g., Oakwood Primary"/>
                          </div>
                          <div>
                              <label className="text-sm font-medium text-[var(--color-on-surface-variant)] mb-1 block">Specialization</label>
                              <input type="text" value={specialization} onChange={e => setSpecialization(e.target.value)} className={inputClasses} placeholder="e.g., English, Year 3 Lead" />
                          </div>
                          <div className="sm:col-span-2">
                              <label className="text-sm font-medium text-[var(--color-on-surface-variant)] mb-1 block">Professional Bio</label>
                              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className={`${inputClasses} resize-y`} placeholder="A short 'About Me' to personalize your experience."></textarea>
                          </div>
                           <div className="sm:col-span-2">
                              <label className="text-sm font-medium text-[var(--color-on-surface-variant)] mb-1 block">Email</label>
                              <input type="email" value={currentUser.email || 'N/A'} className={`${inputClasses} bg-[var(--color-surface-variant)] cursor-not-allowed`} readOnly />
                          </div>
                      </div>
                       {profileMessage && <p className={`mt-4 text-sm text-center ${profileMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>{profileMessage.text}</p>}
                      <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[var(--color-outline)]">
                          <button type="button" onClick={onClose} className="material-button material-button-secondary text-sm">Close</button>
                          <button 
                              type="submit" 
                              disabled={isProfileSaveDisabled}
                              className="material-button material-button-primary text-sm flex items-center gap-2"
                          >
                              <SaveIcon className="w-5 h-5" /> Save Profile
                          </button>
                      </div>
                  </form>
              )}
               {activeTab === 'preferences' && (
                  <form onSubmit={handlePreferencesSave}>
                      <h3 className="text-lg font-semibold mb-4">App Preferences</h3>
                      <div className="space-y-4">
                          <div>
                              <label className="text-sm font-medium text-[var(--color-on-surface-variant)] mb-1 block">Default Curriculum</label>
                               <select value={defaultCurriculum} onChange={e => setDefaultCurriculum(e.target.value as CurriculumLevel)} className={inputClasses}>
                                  <option value={CurriculumLevel.SELECT_YEAR}>None (Select on start)</option>
                                  {CURRICULUM_LEVEL_OPTIONS_FOR_VIEW.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                              <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">This curriculum will be automatically selected when you open the Lesson Planner.</p>
                          </div>
                      </div>
                       {prefsMessage && <p className={`mt-4 text-sm text-center ${prefsMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>{prefsMessage.text}</p>}
                      <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[var(--color-outline)]">
                          <button type="button" onClick={onClose} className="material-button material-button-secondary text-sm">Close</button>
                          <button 
                              type="submit" 
                              disabled={isPrefsSaveDisabled}
                              className="material-button material-button-primary text-sm flex items-center gap-2"
                          >
                              <SaveIcon className="w-5 h-5" /> Save Preferences
                          </button>
                      </div>
                  </form>
              )}
               {activeTab === 'subscription' && (
                  <div>
                      <h3 className="text-lg font-semibold mb-4">Subscription Details</h3>
                      <div className="p-6 rounded-lg bg-[var(--color-surface-variant)] space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-[var(--color-on-surface-variant)]">Current Plan</span>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${currentUser.plan === 'pro' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300'}`}>{currentUser.plan.charAt(0).toUpperCase() + currentUser.plan.slice(1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-[var(--color-on-surface-variant)]">Status</span>
                            <span className="text-sm font-medium">{currentUser.subscriptionStatus.charAt(0).toUpperCase() + currentUser.subscriptionStatus.slice(1)}</span>
                        </div>
                         {currentUser.plan === 'pro' && (
                            <>
                                <div className="flex justify-between items-center pt-3 border-t border-[var(--color-outline)]">
                                    <span className="text-sm font-medium text-[var(--color-on-surface-variant)]">Subscription Start</span>
                                    <span className="text-sm font-medium">{formatDate(currentUser.subscriptionStartDate)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-[var(--color-on-surface-variant)]">Next Billing Date</span>
                                    <span className="text-sm font-medium">{formatDate(currentUser.subscriptionEndDate)}</span>
                                </div>
                            </>
                         )}
                      </div>

                      {subError && <p className="mt-4 text-sm text-center text-red-600">{subError}</p>}

                      {currentUser.plan === 'free' ? (
                        <div className="mt-6 text-center">
                            <p className="mb-4">Upgrade to the Pro Co-Pilot plan to unlock all features, remove limits, and get priority support.</p>
                            <button onClick={() => onOpenPremiumModal()} className="material-button material-button-primary flex items-center justify-center gap-2 w-full sm:w-auto mx-auto">
                                <CheckBadgeIcon className="w-5 h-5" /> Upgrade to Pro
                            </button>
                        </div>
                      ) : (
                         <div className="mt-6 text-center">
                             <p className="mb-4">You are currently on the Pro plan. You can downgrade to the free plan below.</p>
                             <button onClick={handleDowngradeClick} disabled={isProcessing || isDowngrading} className="material-button material-button-secondary w-full sm:w-auto mx-auto">
                                {isProcessing || isDowngrading ? 'Processing...' : 'Downgrade to Explorer'}
                             </button>
                             <p className="text-xs text-[var(--color-on-surface-variant)] mt-4">For payment issues or to cancel your subscription, please <a href="mailto:contact@aitadz.pro?subject=Subscription Management Request" className="text-[var(--color-primary)] underline">contact support</a>.</p>
                        </div>
                      )}
                  </div>
              )}
              {activeTab === 'dangerZone' && (
                  <div>
                      <div className="p-4 rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10">
                          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 flex items-center gap-2">
                              <ExclamationTriangleIcon className="w-6 h-6" />
                              Danger Zone
                          </h3>
                          <p className="mt-2 text-sm text-red-700 dark:text-red-200/80">Deleting your account is a permanent action. All your data, including schools, classes, timetables, and calendar events, will be removed forever. This cannot be undone.</p>
                          <div className="mt-4">
                              <label htmlFor="delete-confirm" className="text-sm font-medium text-red-800 dark:text-red-200 mb-1 block">To confirm, type "delete" below:</label>
                              <input id="delete-confirm" type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} className={`${inputClasses} border-red-400 focus:ring-red-500`} />
                          </div>
                          <button 
                              onClick={handleDelete} 
                              disabled={deleteConfirmText.toLowerCase() !== 'delete'}
                              className="w-full mt-4 py-2 px-4 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              Delete My Account
                          </button>
                      </div>
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;