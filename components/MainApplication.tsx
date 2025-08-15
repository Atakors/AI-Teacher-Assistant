

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Sidebar from './Sidebar';
import FlashcardGenerator from './FlashcardGenerator';
import TimetableEditor from './TimetableEditor';
import CurriculumOverview from './CurriculumOverview';
import SchoolCalendarView from './SchoolCalendarView';
import LessonPlannerView from './LessonPlannerView';
import AdminDashboard from './AdminDashboard';
import SavedPlansView from './SavedPlansView';
import { generateLessonPlanWithGemini, generateFlashcardImageWithGemini } from '../services/geminiService';
import { LessonPlan, CurriculumLevel, CanvasLesson, CanvasSection, CanvasSequence, AppView, ThemeSettings, AccentColor, User, LessonDetailLevel, CreativityLevel, PromptMode, SavedLessonPlan, SavedLessonPlanContext } from '../types'; 
import { getUserById, decrementLessonCredits, decrementImageCredits, saveLessonPlan } from '../services/dbService';
import { YEAR_3_PRIMARY_CURRICULUM_CONTENT, YEAR_3_CANVAS_STRUCTURE_DATA } from '../constants_year3';
import { YEAR_4_PRIMARY_CURRICULUM_CONTENT, YEAR_4_CANVAS_STRUCTURE_DATA } from '../constants_year4';
import { YEAR_5_PRIMARY_CURRICULUM_CONTENT, YEAR_5_CANVAS_STRUCTURE_DATA } from '../constants_year5';
import { CURRICULUM_LEVEL_OPTIONS_FOR_VIEW } from '../constants';


interface MainApplicationProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  onLogout: () => void;
  onEditProfile: () => void;
  onOpenPremiumModal: (featureName?: string) => void;
  onOpenReviewModal: () => void;
  themeSettings: ThemeSettings;
  toggleThemeMode: () => void;
  setAccentColor: (color: AccentColor) => void;
  lessonDetailLevel: LessonDetailLevel;
  setLessonDetailLevel: (level: LessonDetailLevel) => void;
  creativityLevel: CreativityLevel;
  setCreativityLevel: (level: CreativityLevel) => void;
  selectedMaterials: string[];
  setSelectedMaterials: (materials: string[]) => void;
  promptMode: PromptMode;
  setPromptMode: (mode: PromptMode) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
}

const MainApplication: React.FC<MainApplicationProps> = ({ 
  currentUser, setCurrentUser, onLogout, onEditProfile, onOpenPremiumModal, onOpenReviewModal,
  themeSettings, toggleThemeMode, setAccentColor,
  lessonDetailLevel, setLessonDetailLevel, creativityLevel, setCreativityLevel,
  selectedMaterials, setSelectedMaterials,
  promptMode, setPromptMode, customPrompt, setCustomPrompt,
  activeView, setActiveView
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumLevel | null>(currentUser.defaultCurriculum || null);
  const [generatedPlan, setGeneratedPlan] = useState<LessonPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedLessonDetails, setSelectedLessonDetails] = useState<CanvasLesson | null>(null);
  const [selectedSectionFullDetails, setSelectedSectionFullDetails] = useState<CanvasSection | null>(null);
  const [includeTextbookActivities, setIncludeTextbookActivities] = useState<boolean>(true);
  
  // State for viewing saved plans
  const [viewingSavedPlan, setViewingSavedPlan] = useState<SavedLessonPlan | null>(null);

  const handleCurriculumChange = useCallback((value: CurriculumLevel) => {
    setSelectedCurriculum(value);
    setSelectedSequenceId(null);
    setSelectedSectionId(null);
    setSelectedLessonDetails(null);
    setSelectedSectionFullDetails(null);
    setGeneratedPlan(null);
    setError(null);
    setViewingSavedPlan(null); // Ensure we exit viewing mode on curriculum change
  }, []);

  // Effect to update selected curriculum if user's default preference changes
  useEffect(() => {
    if (currentUser.defaultCurriculum && currentUser.defaultCurriculum !== selectedCurriculum) {
      handleCurriculumChange(currentUser.defaultCurriculum);
    }
  }, [currentUser.defaultCurriculum, selectedCurriculum, handleCurriculumChange]);

  // Effect to handle guided tour actions
  useEffect(() => {
    const handleTourAction = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail?.action === 'ensureAccordionVisible') {
            if (!selectedCurriculum) {
                handleCurriculumChange(CURRICULUM_LEVEL_OPTIONS_FOR_VIEW[0].value);
            }
        }
    };
    document.addEventListener('guideTourAction', handleTourAction);
    return () => {
        document.removeEventListener('guideTourAction', handleTourAction);
    };
  }, [selectedCurriculum, handleCurriculumChange]);


  const getCurrentCanvasStructureData = useCallback((): CanvasSequence[] => {
    if (selectedCurriculum === CurriculumLevel.PRIMARY_3) return YEAR_3_CANVAS_STRUCTURE_DATA;
    if (selectedCurriculum === CurriculumLevel.PRIMARY_4) return YEAR_4_CANVAS_STRUCTURE_DATA;
    if (selectedCurriculum === CurriculumLevel.PRIMARY_5) return YEAR_5_CANVAS_STRUCTURE_DATA;
    return [];
  }, [selectedCurriculum]);

  const curriculumDataMap = useMemo((): Record<CurriculumLevel, CanvasSequence[]> => ({
    [CurriculumLevel.PRIMARY_3]: YEAR_3_CANVAS_STRUCTURE_DATA,
    [CurriculumLevel.PRIMARY_4]: YEAR_4_CANVAS_STRUCTURE_DATA,
    [CurriculumLevel.PRIMARY_5]: YEAR_5_CANVAS_STRUCTURE_DATA,
    [CurriculumLevel.SELECT_YEAR]: [],
  }), []);


  const availableSequences = useMemo(() => {
    return getCurrentCanvasStructureData().filter(seq => !seq.isPause);
  }, [getCurrentCanvasStructureData]);

  const handleSequenceChange = (sequenceId: string | null) => {
    setSelectedSequenceId(sequenceId);
    setSelectedSectionId(null);
    setSelectedLessonDetails(null);
    setSelectedSectionFullDetails(null);
  };

  const handleSectionChange = (sectionId: string | null) => {
    setSelectedSectionId(sectionId);
    setSelectedLessonDetails(null); 
    if (sectionId && selectedSequenceId) {
      const currentCanvasData = getCurrentCanvasStructureData();
      const sequence = currentCanvasData.find(seq => seq.id === selectedSequenceId);
      const section = sequence?.sections.find(sec => sec.id === sectionId);
      setSelectedSectionFullDetails(section || null);
    } else {
      setSelectedSectionFullDetails(null);
    }
  };

  const handleLessonChange = (lesson: CanvasLesson | null) => {
    setSelectedLessonDetails(lesson);
  };
  
  const handleViewChange = (view: AppView) => {
    if (currentUser.plan === 'free' && (view === 'curriculumOverview' || view === 'schoolCalendar')) {
      const featureName = view === 'curriculumOverview' ? 'Curriculum Overview' : 'School Calendar';
      onOpenPremiumModal(featureName);
    } else {
      setActiveView(view);
    }
  };

  const isGenerationAllowed = useMemo(() => {
    if (promptMode === 'custom') {
      return !!customPrompt.trim();
    }
    if (!selectedCurriculum || selectedCurriculum === CurriculumLevel.SELECT_YEAR) return false;
    if ([CurriculumLevel.PRIMARY_3, CurriculumLevel.PRIMARY_4, CurriculumLevel.PRIMARY_5].includes(selectedCurriculum)) {
      return !!selectedLessonDetails; 
    }
    return true; 
  }, [selectedCurriculum, selectedLessonDetails, promptMode, customPrompt]);
  
  const handleGeneratePlan = useCallback(async () => {
    // Refetch user to get the absolute latest generation count
    const freshUser = await getUserById(currentUser.uid);
    if (!freshUser) {
        setError("Could not verify your account status. Please try logging in again.");
        return;
    }

    if (freshUser.plan === 'free' && freshUser.lesson_credits_remaining <= 0) {
        onOpenPremiumModal('Lesson Plan Generations');
        return;
    }
    
    if (!isGenerationAllowed) {
        if (promptMode === 'structured') {
            if (selectedCurriculum && [CurriculumLevel.PRIMARY_3, CurriculumLevel.PRIMARY_4, CurriculumLevel.PRIMARY_5].includes(selectedCurriculum) && !selectedLessonDetails) {
                setError(`For ${selectedCurriculum}, please select a Sequence, Section, and Lesson before generating.`);
            } else if (!selectedCurriculum || selectedCurriculum === CurriculumLevel.SELECT_YEAR) {
                setError("Please select a curriculum level.");
            } else {
                setError("Please complete all required selections for the chosen curriculum level.");
            }
        } else {
             setError("Please enter a custom prompt before generating.");
        }
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPlan(null);
    setViewingSavedPlan(null); // Generating a new plan exits viewing mode

    let curriculumContentToPass: string | null = null;
    let topicForAI: string = '';
    const currentCanvasData = getCurrentCanvasStructureData();

    if (promptMode === 'structured' && selectedCurriculum && selectedLessonDetails) {
      if (selectedCurriculum === CurriculumLevel.PRIMARY_3) curriculumContentToPass = YEAR_3_PRIMARY_CURRICULUM_CONTENT;
      else if (selectedCurriculum === CurriculumLevel.PRIMARY_4) curriculumContentToPass = YEAR_4_PRIMARY_CURRICULUM_CONTENT;
      else if (selectedCurriculum === CurriculumLevel.PRIMARY_5) curriculumContentToPass = YEAR_5_PRIMARY_CURRICULUM_CONTENT;
      
      const sequence = currentCanvasData.find(s => s.id === selectedSequenceId);
      const section = sequence?.sections.find(s => s.id === selectedSectionId);
      
      let lessonName = selectedLessonDetails.name;
      if (selectedLessonDetails.timing) lessonName += ` (${selectedLessonDetails.timing})`;
      if (selectedLessonDetails.details) lessonName += ` - ${selectedLessonDetails.details}`;
      
      const contextParts: string[] = [];
      if(sequence) contextParts.push(`from Sequence: "${sequence.title}"`);
      if(section) contextParts.push(`within Section: "${section.name}"`);
      
      topicForAI = `Generate a lesson plan for the ${selectedCurriculum} session: "${lessonName}"`;
      if (contextParts.length > 0) {
        topicForAI += ` ${contextParts.join(', ')}.`;
      }
      if (includeTextbookActivities && selectedLessonDetails.bookActivities && selectedLessonDetails.bookActivities.length > 0) {
        topicForAI += `\nConsider the following textbook activities for this session:`;
        selectedLessonDetails.bookActivities.forEach(act => {
          topicForAI += `\n- Page ${act.page}${act.activityNumber ? ` (Act. ${act.activityNumber})` : ''}: ${act.description}`;
        });
      }

    } else if (promptMode === 'structured' && selectedCurriculum) {
      topicForAI = `Generate a representative lesson plan suitable for ${selectedCurriculum}.`;
      if (selectedCurriculum === CurriculumLevel.PRIMARY_3) curriculumContentToPass = YEAR_3_PRIMARY_CURRICULUM_CONTENT;
      else if (selectedCurriculum === CurriculumLevel.PRIMARY_4) curriculumContentToPass = YEAR_4_PRIMARY_CURRICULUM_CONTENT;
      else if (selectedCurriculum === CurriculumLevel.PRIMARY_5) curriculumContentToPass = YEAR_5_PRIMARY_CURRICULUM_CONTENT;
    }

    try {
      const plan = await generateLessonPlanWithGemini(
        selectedCurriculum!, 
        topicForAI, 
        curriculumContentToPass,
        lessonDetailLevel,
        creativityLevel,
        selectedMaterials,
        promptMode,
        customPrompt
      );
      setGeneratedPlan(plan);
      if (freshUser.plan === 'free') {
        await decrementLessonCredits(currentUser.uid);
        const updatedUser = await getUserById(currentUser.uid);
        if (updatedUser) {
          setCurrentUser(updatedUser);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "An unknown error occurred while generating the lesson plan.");
      } else {
        setError("An unknown error occurred.");
      }
      console.error("Generation failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentUser, onOpenPremiumModal, isGenerationAllowed, promptMode, customPrompt, selectedCurriculum, selectedLessonDetails, 
    selectedSequenceId, selectedSectionId, getCurrentCanvasStructureData, includeTextbookActivities, 
    lessonDetailLevel, creativityLevel, selectedMaterials, setCurrentUser, setError, setGeneratedPlan, setIsLoading
  ]);

  const handleFlashcardGeneration = async (prompt: string, aspectRatio: string): Promise<string> => {
    const freshUser = await getUserById(currentUser.uid);
    if (!freshUser) {
        throw new Error("Could not verify your account status. Please try logging in again.");
    }

    if (freshUser.plan === 'free' && freshUser.image_credits_remaining <= 0) {
        onOpenPremiumModal('Flashcard Generations');
        throw new Error("Flashcard generation limit reached. Upgrade to Premium for unlimited generations.");
    }

    try {
      const imageUrl = await generateFlashcardImageWithGemini(prompt, aspectRatio);
      
      if (freshUser.plan === 'free') {
        await decrementImageCredits(currentUser.uid);
        const updatedUser = await getUserById(currentUser.uid);
        if (updatedUser) {
            setCurrentUser(updatedUser);
        }
      }
      return imageUrl;

    } catch (err) {
      // Re-throw the error to be handled by the FlashcardGenerator component's UI
      throw err;
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan || !selectedCurriculum || !selectedLessonDetails) {
      setError("Cannot save plan without complete context. Please ensure a lesson is selected.");
      return;
    }
    
    const planName = window.prompt("Enter a name for this lesson plan:", `Plan for ${selectedLessonDetails.name}`);
    if (!planName || !planName.trim()) return; // User cancelled or entered empty name

    const sequence = getCurrentCanvasStructureData().find(s => s.id === selectedSequenceId);
    const section = sequence?.sections.find(s => s.id === selectedSectionId);

    const context: SavedLessonPlanContext = {
        curriculumLevel: selectedCurriculum,
        sequenceName: sequence?.title || 'N/A',
        sectionName: section?.name || 'N/A',
        lessonName: selectedLessonDetails.name,
    };

    try {
        await saveLessonPlan(currentUser.uid, planName.trim(), generatedPlan, context);
        alert("Lesson plan saved successfully!");
    } catch (e) {
        console.error("Failed to save plan", e);
        setError("Could not save the lesson plan. Please try again.");
    }
  };

  const handleLoadPlan = (plan: SavedLessonPlan) => {
    setViewingSavedPlan(plan);
    setGeneratedPlan(plan.planData);
    setActiveView('lessonPlanner');
  };
  
  const handleCloseSavedPlan = () => {
    setViewingSavedPlan(null);
    setGeneratedPlan(null);
  };

  const renderCurrentView = () => {
    switch(activeView) {
      case 'lessonPlanner':
        return <LessonPlannerView
            selectedCurriculum={selectedCurriculum}
            onCurriculumChange={handleCurriculumChange}
            sequences={availableSequences}
            selectedSequenceId={selectedSequenceId}
            selectedSectionId={selectedSectionId}
            selectedLesson={selectedLessonDetails}
            onSequenceChange={handleSequenceChange}
            onSectionChange={handleSectionChange}
            onLessonChange={handleLessonChange}
            isLoading={isLoading}
            isGenerationAllowed={isGenerationAllowed}
            onGeneratePlan={handleGeneratePlan}
            includeTextbookActivities={includeTextbookActivities}
            onIncludeTextbookActivitiesChange={setIncludeTextbookActivities}
            selectedMaterials={selectedMaterials}
            onSelectedMaterialsChange={setSelectedMaterials}
            selectedSectionFullDetails={selectedSectionFullDetails}
            generatedPlan={generatedPlan}
            error={error}
            lessonDetailLevel={lessonDetailLevel}
            setLessonDetailLevel={setLessonDetailLevel}
            creativityLevel={creativityLevel}
            setCreativityLevel={setCreativityLevel}
            promptMode={promptMode}
            setPromptMode={setPromptMode}
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
            isViewingSavedPlan={!!viewingSavedPlan}
            onCloseSavedPlan={handleCloseSavedPlan}
            viewingSavedPlanName={viewingSavedPlan?.name || null}
            onSavePlan={handleSavePlan}
          />;
      case 'flashcardGenerator':
        return <FlashcardGenerator onGenerate={handleFlashcardGeneration} />;
      case 'timetableEditor':
        return <TimetableEditor userId={currentUser.uid} currentUser={currentUser} />;
      case 'curriculumOverview':
        return <CurriculumOverview curriculumDataMap={curriculumDataMap} />;
      case 'schoolCalendar':
        return <SchoolCalendarView userId={currentUser.uid} />;
      case 'savedPlans':
        return <SavedPlansView currentUser={currentUser} onLoadPlan={handleLoadPlan} />;
      case 'adminDashboard':
        return currentUser.role === 'admin' ? <AdminDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} /> : <p>Access Denied.</p>;
      default:
        return <LessonPlannerView
            selectedCurriculum={selectedCurriculum}
            onCurriculumChange={handleCurriculumChange}
            sequences={availableSequences}
            selectedSequenceId={selectedSequenceId}
            selectedSectionId={selectedSectionId}
            selectedLesson={selectedLessonDetails}
            onSequenceChange={handleSequenceChange}
            onSectionChange={handleSectionChange}
            onLessonChange={handleLessonChange}
            isLoading={isLoading}
            isGenerationAllowed={isGenerationAllowed}
            onGeneratePlan={handleGeneratePlan}
            includeTextbookActivities={includeTextbookActivities}
            onIncludeTextbookActivitiesChange={setIncludeTextbookActivities}
            selectedMaterials={selectedMaterials}
            onSelectedMaterialsChange={setSelectedMaterials}
            selectedSectionFullDetails={selectedSectionFullDetails}
            generatedPlan={generatedPlan}
            error={error}
            lessonDetailLevel={lessonDetailLevel}
            setLessonDetailLevel={setLessonDetailLevel}
            creativityLevel={creativityLevel}
            setCreativityLevel={setCreativityLevel}
            promptMode={promptMode}
            setPromptMode={setPromptMode}
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
            isViewingSavedPlan={!!viewingSavedPlan}
            onCloseSavedPlan={handleCloseSavedPlan}
            viewingSavedPlanName={viewingSavedPlan?.name || null}
            onSavePlan={handleSavePlan}
          />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="flex flex-1">
        <Sidebar
          user={currentUser}
          onLogout={onLogout}
          onEditProfile={onEditProfile}
          onOpenReviewModal={onOpenReviewModal}
          activeView={activeView}
          setActiveView={handleViewChange}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          themeSettings={themeSettings}
          toggleThemeMode={toggleThemeMode}
          setAccentColor={setAccentColor}
        />
        <main className={`flex-grow p-4 sm:p-6 lg:p-8 text-[var(--color-text-primary)] main-content ${isSidebarOpen ? 'ml-80' : 'ml-20'}`}>
          {renderCurrentView()}
        </main>
      </div>
       <footer className={`text-[var(--color-text-secondary)] text-center p-4 text-sm main-content ${isSidebarOpen ? 'ml-80' : 'ml-20'}`} style={{ backgroundColor: 'var(--color-bg)' }}>
        <p>&copy; {new Date().getFullYear()} Designed and made by MKS. Powered by Gemini.</p>
        <p className="mt-2">
          Contact: <a href="mailto:dz.ai.teacher.assistant@gmail.com" className="hover:text-[var(--color-text-primary)] underline">dz.ai.teacher.assistant@gmail.com</a>
        </p>
      </footer>
    </div>
  );
};

export default MainApplication;