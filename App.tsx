
import React, { useState, useEffect } from 'react';
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
    // This function handles the logic for a given session, either setting the user or landing page.
    const handleSession = async (session: any) => { // Let TS infer session type
      try {
        if (session?.user) {
          // User is authenticated. Now get or create their profile.
          const userProfile = await getUserById(session.user.id);

          if (userProfile) {
            // Existing user, set their profile.
            setCurrentUser(userProfile);
            setAppState('app');
            if (!userProfile.hasCompletedTour) {
                setIsTourActive(true);
            }
          } else {
            // New user, create their profile.
            const newProfileData: Omit<User, 'uid'> = {
              name: session.user.user_metadata?.name || session.user.email || 'New User',
              email: session.user.email!,
              avatar: session.user.user_metadata?.avatar_url,
              plan: 'free',
              lessonGenerations: 0,
              flashcardGenerations: 0,
              hasCompletedTour: false,
              role: 'user', // Always default to 'user'
            };
            await addUser(session.user.id, newProfileData);
            const createdProfile = { uid: session.user.id, ...newProfileData };
            
            setCurrentUser(createdProfile);
            setAppState('app');
            // A new user should always see the tour.
            setIsTourActive(true);
          }
        } else {
          // User is not authenticated.
          setCurrentUser(null);
          setAppState('landing');
        }
      } catch (error) {
          // This catch is for background refreshes. A failure here should not log the user out.
          // The initial load failure is handled by the `catch` block in `checkInitialSession`.
          console.warn("Failed to update session in background:", error);
      }
    };

    // Check for an active session when the app first loads.
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const userProfile = await getUserById(session.user.id);
            if (userProfile) {
                setCurrentUser(userProfile);
                setAppState('app');
                if (!userProfile.hasCompletedTour) {
                    setIsTourActive(true);
                }
            } else {
                // If there's a session but no profile, it might be a new user, but something is wrong.
                // It's safer to treat as logged out and let them log in again to create a profile.
                throw new Error("Session found but no user profile. Forcing re-authentication.");
            }
        } else {
            setCurrentUser(null);
            setAppState('landing');
        }
      } catch (error) {
        console.error("Critical error during initial session check:", error);
        setCurrentUser(null);
        setAppState('landing');
      } finally {
        // This is crucial: always hide the loading screen, even if errors occur.
        setIsAuthLoading(false);
      }
    };

    checkInitialSession();

    // Set up a listener for auth events like sign-in/sign-out.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // The initial session is handled by getSession(). We only handle subsequent changes here.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        await handleSession(session);
      }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, []); // The empty dependency array ensures this runs only once on mount.


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

export default App;
