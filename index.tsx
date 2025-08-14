import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import LandingPage from './components/LandingPage';
import MainApplication from './components/MainApplication';
import ProfileModal from './components/ProfileModal';
import PremiumModal from './components/PremiumModal';
import ReviewModal from './components/ReviewModal';
import GuideTour from './components/GuideTour';
import LoadingSpinner from './components/LoadingSpinner';
import { AppState, ThemeSettings, AccentColor, User, LessonDetailLevel, CreativityLevel, PromptMode, CurriculumLevel, AppView } from './types'; 
import { getUserById, updateUser, addUser } from './services/dbService';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    id: 1,
    mode: 'dark',
    accentColor: 'indigo',
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [premiumModalFeature, setPremiumModalFeature] = useState<string | undefined>(undefined);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  
  // AI Settings State
  const [lessonDetailLevel, setLessonDetailLevel] = useState<LessonDetailLevel>('standard');
  const [creativityLevel, setCreativityLevel] = useState<CreativityLevel>('balanced');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [promptMode, setPromptMode] = useState<PromptMode>('structured');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  // Lifted state for tour control
  const [activeView, setActiveView] = useState<AppView>('lessonPlanner');

  useEffect(() => {
    // This effect establishes a single, robust flow for handling authentication.
    // It uses onAuthStateChange as the primary source of truth for the user's session.
    let initialCheckCompleted = false;

    const processSession = async (session: any) => {
        try {
            if (session?.user) {
                const userProfile = await getUserById(session.user.id);
                if (userProfile) {
                    setCurrentUser(userProfile);
                    setAppState('app');
                    if (!userProfile.hasCompletedTour && !initialCheckCompleted) {
                        setIsTourActive(true);
                    }
                } else {
                    // A session exists but no profile, meaning this is a new user.
                    const newProfileData: Omit<User, 'uid'> = {
                        name: session.user.user_metadata?.name || session.user.email || 'New User',
                        email: session.user.email!,
                        avatar: session.user.user_metadata?.avatar_url,
                        plan: 'free',
                        lessonGenerations: 0,
                        flashcardGenerations: 0,
                        hasCompletedTour: false,
                        role: 'user',
                    };
                    await addUser(session.user.id, newProfileData);
                    const createdProfile = { uid: session.user.id, ...newProfileData };
                    
                    setCurrentUser(createdProfile);
                    setAppState('app');
                    setIsTourActive(true); // Always show tour for new user.
                }
            } else {
                // No session, user is logged out.
                setCurrentUser(null);
                setAppState('landing');
            }
        } catch (error) {
            console.error("Error processing session:", error);
            setCurrentUser(null);
            setAppState('landing');
        } finally {
            // This is the crucial part: always hide the loading screen after the first
            // session check is complete.
            if (!initialCheckCompleted) {
                setIsAuthLoading(false);
                initialCheckCompleted = true;
            }
        }
    };
    
    // The listener is the primary source of truth. It fires on login, logout, and initial page load if a session exists.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        processSession(session);
    });

    // A failsafe: onAuthStateChange may not fire if the user is logged out and there's no session in storage.
    // This manual check ensures the loading screen is hidden in that case.
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session && !initialCheckCompleted) {
            processSession(null);
        }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, []);


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
    if (appState === 'landing' && !isAuthLoading) {
      document.body.classList.add('landing-page-active');
    } else {
      document.body.classList.remove('landing-page-active');
    }
    return () => {
      document.body.classList.remove('landing-page-active');
    };
  }, [appState, isAuthLoading]);

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
    // Immediately update UI for a responsive feel
    setCurrentUser(null);
    setAppState('landing');
    
    // Perform the actual sign-out in the background
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error signing out from Supabase: ", error);
    }
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

      // The `updates` object from ProfileModal doesn't contain `uid`, but to satisfy
      // the strict type of `updateUser`, we ensure it's not present for TypeScript.
      const { uid, ...updatesForDb } = finalUpdates;
      await updateUser(currentUser.uid, updatesForDb);
      
      const updatedUser = { ...currentUser, ...finalUpdates };
      setCurrentUser(updatedUser);

    } catch (e) {
      console.error("Failed to update user profile:", e);
      throw e;
    }
  };

  const handlePasswordChange = async (currentPass: string, newPass: string) => {
    console.warn("Password change functionality needs to be implemented with Supabase.");
    throw new Error("Password change is currently disabled.");
  };

  const handleDeleteAccount = async () => {
    console.warn("Account deletion is a sensitive operation and requires server-side logic with Supabase.");
    throw new Error("Account deletion is currently disabled.");
  };

  const handleTourComplete = async () => {
    if (!currentUser) return;
    try {
      await updateUser(currentUser.uid, { hasCompletedTour: true });
      setCurrentUser({ ...currentUser, hasCompletedTour: true });
      setIsTourActive(false);
    } catch (e) {
      console.error("Failed to update tour status", e);
      setIsTourActive(false);
    }
  };

  const renderContent = () => {
    if (isAuthLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#0B0F19] z-[200]">
                <LoadingSpinner text="Loading your profile..." />
            </div>
        );
    }

    if (appState === 'app' && currentUser) {
        return (
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
                activeView={activeView}
                setActiveView={setActiveView}
            />
        );
    }
    
    return <LandingPage />;
  };

  return (
    <>
      {renderContent()}
      {isProfileModalOpen && currentUser && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onSave={handleSaveProfile}
          onPasswordChange={handlePasswordChange}
          onDeleteAccount={handleDeleteAccount}
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
       {isTourActive && currentUser && (
        <GuideTour onComplete={handleTourComplete} setActiveView={setActiveView} />
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