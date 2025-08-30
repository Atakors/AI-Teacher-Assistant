import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import LandingPage from './components/LandingPage';
import MainApplication from './components/MainApplication';
import ProfileModal from './components/ProfileModal';
import PremiumModal from './components/PremiumModal';
import ReviewModal from './components/ReviewModal';
import LoadingSpinner from './components/LoadingSpinner';
import { AppState, ThemeSettings, AccentColor, User, LessonDetailLevel, CreativityLevel, PromptMode, CurriculumLevel, AppView } from './types'; 
import { getUserById, updateUser } from './services/dbService';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    id: 1,
    mode: 'dark',
    accentColor: 'indigo',
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [premiumModalFeature, setPremiumModalFeature] = useState<string | undefined>(undefined);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  // Lesson Planner AI Settings State
  const [lessonDetailLevel, setLessonDetailLevel] = useState<LessonDetailLevel>('standard');
  const [creativityLevel, setCreativityLevel] = useState<CreativityLevel>('balanced');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [promptMode, setPromptMode] = useState<PromptMode>('structured');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [includeTextbookActivities, setIncludeTextbookActivities] = useState<boolean>(true);

  // Lifted state for view control
  const [activeView, setActiveView] = useState<AppView>('dashboard');

  // Lifted state for notifications and plan changes
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isProcessingPlanChange, setIsProcessingPlanChange] = useState(false);

  useEffect(() => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const processSession = async (session: any) => {
        if (!session?.user) {
            setCurrentUser(null);
            setAppState('landing');
            return;
        }

        try {
            let userProfile = await getUserById(session.user.id);

            // Retry logic for new sign-ups where the DB trigger might be delayed
            if (!userProfile) {
                console.warn("User profile not found on first attempt, retrying in 1.5s...");
                await delay(1500);
                userProfile = await getUserById(session.user.id);
            }

            if (userProfile) {
                // --- AUTOMATIC DOWNGRADE LOGIC ---
                if (userProfile.plan === 'pro' && userProfile.subscriptionEndDate && new Date(userProfile.subscriptionEndDate) < new Date()) {
                    console.log(`User ${userProfile.uid} subscription expired. Downgrading.`);
                    await updateUser(userProfile.uid, { plan: 'free', subscriptionStatus: 'expired' });
                    // Re-fetch the user profile to get the updated plan
                    userProfile = await getUserById(session.user.id);
                    if (userProfile) {
                        setCurrentUser(userProfile);
                        setAppState('app');
                        setNotification({ message: "Your Pro subscription has expired. You've been switched to the Explorer plan.", type: 'success' });
                    }
                } else {
                    setCurrentUser(userProfile);
                    setAppState('app');
                }
            } else {
                console.error("Critical error: User exists in auth but not in public profiles after retry. Logging out.");
                throw new Error("User profile not found after retry.");
            }
        } catch (error) {
            console.error("Critical error processing user session:", error);
            try {
                await supabase.auth.signOut();
            } catch (signOutError) {
                console.error("Error signing out after session processing failure:", signOutError);
            }
            setCurrentUser(null);
            setAppState('landing');
        }
    };
    
    const initializeAuth = async () => {
        setIsAuthenticating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await processSession(session);

            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                processSession(session);
            });

            return () => {
                subscription?.unsubscribe();
            };
        } catch (e) {
            console.error("Fatal error during auth initialization:", e);
            setCurrentUser(null);
            setAppState('landing');
        } finally {
            setIsAuthenticating(false);
        }
    };

    const unsubscribePromise = initializeAuth();

    return () => {
        unsubscribePromise.then(unsubscribe => {
            if (unsubscribe) {
                unsubscribe();
            }
        });
    };
  }, []);

  // Presence tracking effect
  useEffect(() => {
    let channel: any = null;

    if (appState === 'app' && currentUser) {
        channel = supabase.channel('online_users', {
            config: {
                presence: {
                    key: currentUser.uid,
                },
            },
        });

        channel.subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED') {
                try {
                    await channel.track({ user_id: currentUser.uid, online_at: new Date().toISOString() });
                } catch (error) {
                    console.error('Failed to track presence:', error);
                }
            }
        });
    }

    return () => {
        if (channel) {
            channel.untrack();
            supabase.removeChannel(channel);
        }
    };
  }, [appState, currentUser]);


  // Theme initialization and persistence effect
  useEffect(() => {
    const savedSettings = localStorage.getItem('themeSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setThemeSettings(parsedSettings);
      } catch (e) {
        console.error("Could not parse theme settings from localStorage", e);
      }
    } else {
      const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeSettings(prev => ({ ...prev, mode: userPrefersDark ? 'dark' : 'light' }));
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (themeSettings.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.dataset.color = themeSettings.accentColor;
    localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
  }, [themeSettings]);

  // Landing page background effect
  useEffect(() => {
    if (appState === 'landing') {
      document.body.classList.add('landing-page-active');
    } else {
      document.body.classList.remove('landing-page-active');
    }
    return () => {
      document.body.classList.remove('landing-page-active');
    };
  }, [appState]);

  // Notification effect
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const toggleThemeMode = () => {
    setThemeSettings(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light'
    }));
  };

  const setAccentColor = (color: AccentColor) => {
    setThemeSettings(prev => ({ ...prev, accentColor: color }));
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error signing out from Supabase: ", error);
    }
    // onAuthStateChange will handle setting user to null and app state to 'landing'
  };

  const handleOpenProfileModal = () => setIsProfileModalOpen(true);
  
  const handleOpenPremiumModal = (featureName?: string) => {
      setPremiumModalFeature(featureName);
      setIsPremiumModalOpen(true);
  }

  const handleOpenReviewModal = () => setIsReviewModalOpen(true);

  const handleSaveProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    try {
      const finalUpdates = { ...updates };
      if (finalUpdates.defaultCurriculum === CurriculumLevel.SELECT_YEAR) {
        finalUpdates.defaultCurriculum = undefined;
      }
      await updateUser(currentUser.uid, finalUpdates);
      const updatedUser = { ...currentUser, ...finalUpdates };
      setCurrentUser(updatedUser);
    } catch (e) {
      console.error("Failed to update user profile:", e);
      throw e;
    }
  };

  const handlePasswordChange = async (currentPass: string, newPass: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) {
        console.error("Failed to update password:", error);
        throw error;
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to permanently delete your account? This action is irreversible.")) {
        console.error("User self-deletion is not implemented. This requires a secure RPC function.");
        throw new Error("Account deletion is currently disabled for security reasons. Please contact support.");
    }
  };

  const handleDowngradeToFree = async () => {
    if (!currentUser || isProcessingPlanChange) return;
    if (!window.confirm("Are you sure you want to downgrade to the free Explorer plan? Your Pro features will be removed, but you will keep your purchased credits.")) {
        return;
    }
    
    setIsProcessingPlanChange(true);
    try {
        await updateUser(currentUser.uid, {
            plan: 'free',
            subscriptionStatus: 'cancelled',
            subscriptionStartDate: null,
            subscriptionEndDate: null,
        });
        const updatedUser = await getUserById(currentUser.uid);
        if (updatedUser) setCurrentUser(updatedUser);
        setIsProfileModalOpen(false);
        setNotification({ message: "Successfully downgraded to Explorer Plan.", type: 'success' });
    } catch (e) {
        console.error("Failed to downgrade plan:", e);
        const message = e instanceof Error ? e.message : 'An unknown error occurred.';
        setNotification({ message: `Downgrade failed: ${message}`, type: 'error' });
        throw e;
    } finally {
        setIsProcessingPlanChange(false);
    }
  };
  
  if (isAuthenticating) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        <LoadingSpinner text="Authenticating..." />
      </div>
    );
  }

  return (
    <>
      {appState === 'app' && currentUser ? (
        <MainApplication
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            onLogout={handleLogout}
            onEditProfile={handleOpenProfileModal}
            onOpenPremiumModal={handleOpenPremiumModal}
            onOpenReviewModal={handleOpenReviewModal}
            themeSettings={themeSettings}
            toggleThemeMode={toggleThemeMode}
            setAccentColor={setAccentColor}
            lessonDetailLevel={lessonDetailLevel}
            setLessonDetailLevel={setLessonDetailLevel}
            creativityLevel={creativityLevel}
            setCreativityLevel={setCreativityLevel}
            selectedMaterials={selectedMaterials}
            setSelectedMaterials={setSelectedMaterials}
            promptMode={promptMode}
            setPromptMode={setPromptMode}
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
            includeTextbookActivities={includeTextbookActivities}
            setIncludeTextbookActivities={setIncludeTextbookActivities}
            activeView={activeView}
            setActiveView={setActiveView}
            setNotification={setNotification}
        />
      ) : (
        <LandingPage />
      )}

      {isProfileModalOpen && currentUser && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onSave={handleSaveProfile}
          onPasswordChange={handlePasswordChange}
          onDeleteAccount={handleDeleteAccount}
          onOpenPremiumModal={handleOpenPremiumModal}
          onDowngrade={handleDowngradeToFree}
          isProcessing={isProcessingPlanChange}
        />
      )}
      <PremiumModal 
        isOpen={isPremiumModalOpen} 
        onClose={() => setIsPremiumModalOpen(false)}
        featureName={premiumModalFeature}
      />
      {isReviewModalOpen && currentUser && (
        <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            currentUser={currentUser}
        />
      )}

      {notification && (
        <div 
          className={`fixed bottom-8 right-8 z-[200] p-4 rounded-lg shadow-2xl text-white text-sm font-medium transition-all duration-300
            ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}
            ${notification ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`
          }
          role="alert"
        >
          {notification.message}
        </div>
      )}
    </>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);