import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TimetableEditor from './components/TimetableEditor';
import CurriculumOverview from './components/CurriculumOverview';
import SchoolCalendarView from './components/SchoolCalendarView';
import LessonPlannerView from './components/LessonPlannerView';
import AdminDashboard from './components/AdminDashboard';
import SavedPlansView from './components/SavedPlansView';
import SavedExamsView from './components/SavedExamsView';
import ExamGeneratorView from './components/ExamGeneratorView';
import CreatorStudioView from './components/CreatorStudioView';
import SavedCanvasView from './components/SavedCanvasView';
import FlashcardGenerator from './components/FlashcardGenerator';
import SavedFlashcardsView from './components/SavedFlashcardsView';
import { generateLessonPlanWithGemini, generateFlashcardImageWithGemini, generateExamWithGemini } from './services/geminiService';
import { LessonPlan, CurriculumLevel, CanvasLesson, CanvasSection, CanvasSequence, AppView, ThemeSettings, AccentColor, User, LessonDetailLevel, CreativityLevel, PromptMode, SavedLessonPlan, SavedLessonPlanContext, Exam, SavedExam, ExamSource, QuestionType, ExamDifficulty, CanvasElement, SavedCanvas, SavedFlashcard } from './types'; 
import { getUserById, decrementLessonCredits, decrementImageCredits, saveLessonPlan, saveExam, saveCanvas, saveFlashcard } from './services/dbService';
import { YEAR_3_PRIMARY_CURRICULUM_CONTENT, YEAR_3_CANVAS_STRUCTURE_DATA } from './components/constants_year3';
import { YEAR_4_PRIMARY_CURRICULUM_CONTENT, YEAR_4_CANVAS_STRUCTURE_DATA } from './components/constants_year4';
import { YEAR_5_PRIMARY_CURRICULUM_CONTENT, YEAR_5_CANVAS_STRUCTURE_DATA } from './components/constants_year5';
import { CURRICULUM_LEVEL_OPTIONS_FOR_VIEW } from './components/constants';


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
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  // Lesson Planner Props
  lessonDetailLevel: LessonDetailLevel;
  setLessonDetailLevel: (level: LessonDetailLevel) => void;
  creativityLevel: CreativityLevel;
  setCreativityLevel: (level: CreativityLevel) => void;
  selectedMaterials: string[];
  setSelectedMaterials: (materials: string[]) => void;
  promptMode: PromptMode;
  setPromptMode: (mode: PromptMode) => void;
  customPrompt: string;
  setCustomPrompt: (string) => void;
}

const MainApplication: React.FC<MainApplicationProps> = (props) => {
  const { 
    currentUser, setCurrentUser, onLogout, onEditProfile, onOpenPremiumModal, onOpenReviewModal,
    themeSettings, toggleThemeMode, setAccentColor,
    lessonDetailLevel, setLessonDetailLevel, creativityLevel, setCreativityLevel,
    selectedMaterials, setSelectedMaterials,
    promptMode, setPromptMode, customPrompt, setCustomPrompt,
    activeView, setActiveView
  } = props;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  // Curriculum Selection State
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumLevel | null>(null);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedSectionFullDetails, setSelectedSectionFullDetails] = useState<CanvasSection | null>(null);

  // Lesson Planner Output State
  const [generatedPlan, setGeneratedPlan] = useState<LessonPlan | null>(null);
  const [selectedLessonDetails, setSelectedLessonDetails] = useState<CanvasLesson | null>(null);
  const [includeTextbookActivities, setIncludeTextbookActivities] = useState<boolean>(true);
  const [viewingSavedPlan, setViewingSavedPlan] = useState<SavedLessonPlan | null>(null);

  // Exam Generator State
  const [generatedExam, setGeneratedExam] = useState<Exam | null>(null);
  const [viewingSavedExam, setViewingSavedExam] = useState<SavedExam | null>(null);
  const [examSource, setExamSource] = useState<ExamSource>('curriculum');
  const [examTopic, setExamTopic] = useState('');
  const [examCustomPrompt, setExamCustomPrompt] = useState('');
  const [examSections, setExamSections] = useState<{ id: number; title: string; questionType: QuestionType; numberOfQuestions: number }[]>([
    { id: 1, title: 'Part One: Reading Comprehension', questionType: 'Multiple Choice', numberOfQuestions: 5 },
    { id: 2, title: 'Part Two: Vocabulary', questionType: 'Short Answer', numberOfQuestions: 5 },
  ]);
  const [examDifficulty, setExamDifficulty] = useState<ExamDifficulty>('Medium');
  const [examTitle, setExamTitle] = useState('');
  const [examInstructions, setExamInstructions] = useState('');
  
  // Exam Generator specific curriculum selection
  const [examSelectedCurriculum, setExamSelectedCurriculum] = useState<CurriculumLevel | null>(null);
  const [selectedExamSectionIds, setSelectedExamSectionIds] = useState<string[]>([]);

  // Creator Studio State
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  
  // Flashcard State
  const [viewingSavedFlashcard, setViewingSavedFlashcard] = useState<SavedFlashcard | null>(null);


  // Effect to initialize and reset state on user load/refresh
  useEffect(() => {
    const initialCurriculum = currentUser.defaultCurriculum || null;
    setSelectedCurriculum(initialCurriculum);
    setExamSelectedCurriculum(initialCurriculum);
    // Reset other states
    setSelectedSequenceId(null);
    setSelectedSectionId(null);
    setSelectedLessonDetails(null);
    setSelectedSectionFullDetails(null);
    setSelectedExamSectionIds([]);
    setGeneratedPlan(null);
    setError(null);
    setViewingSavedPlan(null);
  }, [currentUser.uid]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleCurriculumChange = useCallback((value: CurriculumLevel) => {
    setSelectedCurriculum(value);
    setSelectedSequenceId(null);
    setSelectedSectionId(null);
    setSelectedLessonDetails(null);
    setSelectedSectionFullDetails(null);
    setGeneratedPlan(null);
    setError(null);
    setViewingSavedPlan(null);
  }, []);

   const handleExamCurriculumChange = useCallback((value: CurriculumLevel) => {
    setExamSelectedCurriculum(value);
    setSelectedExamSectionIds([]); // Reset multi-selection when year changes
  }, []);

  useEffect(() => {
    const handleTourAction = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail?.action === 'ensureAccordionVisible') {
            if (!selectedCurriculum) handleCurriculumChange(CURRICULUM_LEVEL_OPTIONS_FOR_VIEW[0].value);
        }
    };
    document.addEventListener('guideTourAction', handleTourAction);
    return () => document.removeEventListener('guideTourAction', handleTourAction);
  }, [selectedCurriculum, handleCurriculumChange]);

  const getCurrentCanvasStructureData = useCallback((): CanvasSequence[] => {
    if (selectedCurriculum === CurriculumLevel.PRIMARY_3) return YEAR_3_CANVAS_STRUCTURE_DATA;
    if (selectedCurriculum === CurriculumLevel.PRIMARY_4) return YEAR_4_CANVAS_STRUCTURE_DATA;
    if (selectedCurriculum === CurriculumLevel.PRIMARY_5) return YEAR_5_CANVAS_STRUCTURE_DATA;
    return [];
  }, [selectedCurriculum]);
  
  const getExamCanvasStructureData = useCallback((): CanvasSequence[] => {
    if (examSelectedCurriculum === CurriculumLevel.PRIMARY_3) return YEAR_3_CANVAS_STRUCTURE_DATA;
    if (examSelectedCurriculum === CurriculumLevel.PRIMARY_4) return YEAR_4_CANVAS_STRUCTURE_DATA;
    if (examSelectedCurriculum === CurriculumLevel.PRIMARY_5) return YEAR_5_CANVAS_STRUCTURE_DATA;
    return [];
  }, [examSelectedCurriculum]);

  const curriculumDataMap = useMemo((): Record<CurriculumLevel, CanvasSequence[]> => ({
    [CurriculumLevel.PRIMARY_3]: YEAR_3_CANVAS_STRUCTURE_DATA,
    [CurriculumLevel.PRIMARY_4]: YEAR_4_CANVAS_STRUCTURE_DATA,
    [CurriculumLevel.PRIMARY_5]: YEAR_5_CANVAS_STRUCTURE_DATA,
    [CurriculumLevel.SELECT_YEAR]: [],
  }), []);

  const availableSequences = useMemo(() => getCurrentCanvasStructureData().filter(seq => !seq.isPause), [getCurrentCanvasStructureData]);
  const examAvailableSequences = useMemo(() => getExamCanvasStructureData().filter(seq => !seq.isPause), [getExamCanvasStructureData]);


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
      const sequence = getCurrentCanvasStructureData().find(seq => seq.id === selectedSequenceId);
      const section = sequence?.sections.find(sec => sec.id === sectionId);
      setSelectedSectionFullDetails(section || null);
    } else {
      setSelectedSectionFullDetails(null);
    }
  };

  const handleLessonChange = (lesson: CanvasLesson | null) => setSelectedLessonDetails(lesson);
  
  const handleViewChange = (view: AppView) => {
    if (currentUser.plan === 'free' && (view === 'curriculumOverview' || view === 'schoolCalendar' || view === 'savedPlans' || view === 'examGenerator' || view === 'savedExams' || view === 'savedCanvas' || view === 'savedFlashcards')) {
      const featureMap: Record<string, string> = {
        curriculumOverview: 'Curriculum Overview',
        schoolCalendar: 'School Calendar',
        savedPlans: 'Saved Plans',
        examGenerator: 'Exam Generator',
        savedExams: 'Saved Exams',
        savedCanvas: 'Saved Canvases',
        savedFlashcards: 'Saved Flashcards',
      };
      onOpenPremiumModal(featureMap[view]);
    } else {
      setActiveView(view);
    }
  };

  const isGenerationAllowed = useMemo(() => {
    if (promptMode === 'custom') return !!customPrompt.trim();
    if (!selectedCurriculum || selectedCurriculum === CurriculumLevel.SELECT_YEAR) return false;
    return !!selectedLessonDetails; 
  }, [selectedCurriculum, selectedLessonDetails, promptMode, customPrompt]);
  
  const handleGeneratePlan = useCallback(async () => {
    const freshUser = await getUserById(currentUser.uid);
    if (!freshUser) {
        setError("Could not verify your account status. Please try logging in again.");
        return;
    }
    if (freshUser.plan === 'free' && freshUser.lessonCreditsRemaining <= 0) {
        onOpenPremiumModal('Lesson Plan Generations');
        return;
    }
    if (!isGenerationAllowed) {
        setError("Please complete all required selections before generating.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPlan(null);
    setViewingSavedPlan(null);

    let curriculumContentToPass: string | null = null;
    let topicForAI: string = '';

    if (promptMode === 'structured' && selectedCurriculum && selectedLessonDetails) {
        curriculumContentToPass = selectedSectionFullDetails?.detailedContent || null;
        const sequence = availableSequences.find(s => s.id === selectedSequenceId);
        const section = sequence?.sections.find(sec => sec.id === selectedSectionId);
        topicForAI = `Generate a lesson plan for the ${selectedCurriculum} session: "${selectedLessonDetails.name}" from Sequence: "${sequence?.title}" within Section: "${section?.name}".`;
        if (includeTextbookActivities && selectedLessonDetails.bookActivities?.length) {
            topicForAI += `\nConsider these textbook activities: ${selectedLessonDetails.bookActivities.map(a => `P${a.page} (Act. ${a.activityNumber}): ${a.description}`).join('; ')}`;
        }
    }

    try {
      const plan = await generateLessonPlanWithGemini(selectedCurriculum!, topicForAI, curriculumContentToPass, lessonDetailLevel, creativityLevel, selectedMaterials, promptMode, customPrompt);
      setGeneratedPlan(plan);
      if (freshUser.plan === 'free') {
        await decrementLessonCredits(currentUser.uid);
        const updatedUser = await getUserById(currentUser.uid);
        if (updatedUser) setCurrentUser(updatedUser);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, onOpenPremiumModal, isGenerationAllowed, promptMode, customPrompt, selectedCurriculum, selectedLessonDetails, selectedSequenceId, selectedSectionId, selectedSectionFullDetails, includeTextbookActivities, lessonDetailLevel, creativityLevel, selectedMaterials, setCurrentUser, availableSequences]);
  
  const handleFlashcardGeneration = async (prompt: string, aspectRatio: string): Promise<string> => {
    const freshUser = await getUserById(currentUser.uid);
    if (!freshUser) throw new Error("Could not verify your account status.");
    if (freshUser.plan === 'free' && freshUser.imageCreditsRemaining <= 0) {
        onOpenPremiumModal('Flashcard Generations');
        throw new Error("Image generation limit reached. Upgrade to Premium.");
    }
    try {
      const imageUrl = await generateFlashcardImageWithGemini(prompt, aspectRatio);
      if (freshUser.plan === 'free') {
        await decrementImageCredits(currentUser.uid);
        const updatedUser = await getUserById(currentUser.uid);
        if (updatedUser) setCurrentUser(updatedUser);
      }
      return imageUrl;
    } catch (err) {
      throw err;
    }
  };

  const handleSaveFlashcard = async (prompt: string, style: string, aspectRatio: string, imageData: string) => {
    const name = window.prompt("Enter a name for this flashcard:", prompt);
    if (!name?.trim()) return;

    try {
        await saveFlashcard(currentUser.uid, name.trim(), { prompt, style, aspectRatio, imageData });
        setNotification({ message: "Flashcard saved successfully!", type: 'success' });
    } catch (e) {
        setNotification({ message: `Save failed: ${e instanceof Error ? e.message : "Unknown error"}`, type: 'error' });
    }
  };

  const handleLoadFlashcard = (flashcard: SavedFlashcard) => {
      setViewingSavedFlashcard(flashcard);
      setActiveView('flashcardGenerator');
  };

  const handleSavePlan = async () => {
    if (!generatedPlan || !selectedCurriculum || !selectedLessonDetails) {
      setNotification({ message: "Cannot save: Complete context is required.", type: 'error' });
      return;
    }
    const planName = window.prompt("Enter a name for this lesson plan:", `Plan for ${selectedLessonDetails.name}`);
    if (!planName?.trim()) return; 

    const sequence = availableSequences.find(s => s.id === selectedSequenceId);
    const section = sequence?.sections.find(sec => sec.id === selectedSectionId);
    const context: SavedLessonPlanContext = {
        curriculumLevel: selectedCurriculum,
        sequenceName: sequence?.title || 'N/A',
        sectionName: section?.name || 'N/A',
        lessonName: selectedLessonDetails.name,
    };
    try {
        await saveLessonPlan(currentUser.uid, planName.trim(), generatedPlan, context);
        setNotification({ message: "Lesson plan saved successfully!", type: 'success' });
    } catch (e) {
        setNotification({ message: `Save failed: ${e instanceof Error ? e.message : "Unknown error"}`, type: 'error' });
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
  
  // --- EXAM GENERATOR LOGIC ---
  const handleGenerateExam = useCallback(async () => {
      const freshUser = await getUserById(currentUser.uid);
      if (!freshUser) {
          setError("Could not verify your account status.");
          return;
      }
      if (freshUser.plan === 'free' && freshUser.lessonCreditsRemaining <= 0) {
          onOpenPremiumModal('Exam Generations');
          return;
      }
      
      setIsLoading(true);
      setError(null);
      setGeneratedExam(null);

      let curriculumContent = null;
      let topicForAI = examTopic;

      if (examSource === 'curriculum') {
          const allSequences = getExamCanvasStructureData();
          const contentParts: string[] = [];
          const sectionNames: string[] = [];

          selectedExamSectionIds.forEach(sectionId => {
              for (const seq of allSequences) {
                  const section = seq.sections.find(sec => sec.id === sectionId);
                  if (section) {
                      if (section.detailedContent) {
                          contentParts.push(section.detailedContent);
                      }
                      sectionNames.push(`${seq.title} > ${section.name}`);
                      break;
                  }
              }
          });
          curriculumContent = contentParts.join('\n\n---\n\n');
          if (sectionNames.length > 0 && !examTopic.trim()) {
              topicForAI = `Exam based on: ${sectionNames.join('; ')}`;
          }
      }

      const context = {
          curriculum: examSelectedCurriculum,
          sectionContent: curriculumContent,
          topic: topicForAI,
          customPrompt: examCustomPrompt
      };

      try {
          const exam = await generateExamWithGemini(examSource, context, examSections, examDifficulty, examTitle, examInstructions);
          setGeneratedExam(exam);
           if (freshUser.plan === 'free') {
              await decrementLessonCredits(currentUser.uid); // Using lesson credits for now
              const updatedUser = await getUserById(currentUser.uid);
              if (updatedUser) setCurrentUser(updatedUser);
          }
      } catch (err) {
          setError(err instanceof Error ? err.message : "An unknown error occurred while generating the exam.");
      } finally {
          setIsLoading(false);
      }
  }, [currentUser.uid, examSelectedCurriculum, selectedExamSectionIds, examTopic, examCustomPrompt, examSource, examSections, examDifficulty, examTitle, examInstructions, onOpenPremiumModal, setCurrentUser, getExamCanvasStructureData]);

  const handleSaveExam = async () => {
      if (!generatedExam) {
          setNotification({ message: "No exam to save.", type: 'error' });
          return;
      }
      const examName = window.prompt("Enter a name for this exam:", generatedExam.title);
      if (!examName?.trim()) return;

      try {
          await saveExam(currentUser.uid, examName.trim(), generatedExam);
          setNotification({ message: "Exam saved successfully!", type: 'success' });
      } catch (e) {
          setNotification({ message: `Save failed: ${e instanceof Error ? e.message : "Unknown error"}`, type: 'error' });
      }
  };
  
  const handleLoadExam = (exam: SavedExam) => {
      setViewingSavedExam(exam);
      setGeneratedExam(exam.examData);
      setActiveView('examGenerator');
  };
  
  // --- CREATOR STUDIO LOGIC ---
  const handleSaveCanvas = async (elements: CanvasElement[]) => {
      const name = window.prompt("Enter a name for your canvas:", "Untitled Design");
      if (!name?.trim()) return;

      const canvasData = {
          elements,
          width: 794, // A4 width in pixels at 96 DPI
          height: 1123, // A4 height
          backgroundColor: '#FFFFFF',
      };

      try {
          await saveCanvas(currentUser.uid, name.trim(), canvasData);
          setNotification({ message: "Canvas saved successfully!", type: 'success' });
      } catch (e) {
          setNotification({ message: `Save failed: ${e instanceof Error ? e.message : "Unknown error"}`, type: 'error' });
      }
  };

  const handleLoadCanvas = (savedCanvas: SavedCanvas) => {
      setCanvasElements(savedCanvas.canvasData.elements);
      setActiveView('creatorStudio');
  };

  const renderCurrentView = () => {
    switch(activeView) {
      case 'lessonPlanner':
        return <LessonPlannerView
            selectedCurriculum={selectedCurriculum} onCurriculumChange={handleCurriculumChange} sequences={availableSequences}
            selectedSequenceId={selectedSequenceId} selectedSectionId={selectedSectionId} selectedLesson={selectedLessonDetails}
            onSequenceChange={handleSequenceChange} onSectionChange={handleSectionChange} onLessonChange={handleLessonChange}
            isLoading={isLoading} isGenerationAllowed={isGenerationAllowed} onGeneratePlan={handleGeneratePlan}
            includeTextbookActivities={includeTextbookActivities} onIncludeTextbookActivitiesChange={setIncludeTextbookActivities}
            selectedMaterials={selectedMaterials} onSelectedMaterialsChange={setSelectedMaterials}
            selectedSectionFullDetails={selectedSectionFullDetails} generatedPlan={generatedPlan} error={error}
            lessonDetailLevel={lessonDetailLevel} setLessonDetailLevel={setLessonDetailLevel} creativityLevel={creativityLevel} setCreativityLevel={setCreativityLevel}
            promptMode={promptMode} setPromptMode={setPromptMode} customPrompt={customPrompt} setCustomPrompt={setCustomPrompt}
            currentUser={currentUser} isViewingSavedPlan={!!viewingSavedPlan} onCloseSavedPlan={handleCloseSavedPlan}
            viewingSavedPlanName={viewingSavedPlan?.name || null} onSavePlan={handleSavePlan}
          />;
      case 'examGenerator':
        return <ExamGeneratorView 
            currentUser={currentUser} isLoading={isLoading} error={error} generatedExam={generatedExam} onGenerateExam={handleGenerateExam} onSaveExam={handleSaveExam}
            examSource={examSource} setExamSource={setExamSource} examTopic={examTopic} setExamTopic={setExamTopic}
            examCustomPrompt={examCustomPrompt} setExamCustomPrompt={setExamCustomPrompt} examSections={examSections} setExamSections={setExamSections}
            examDifficulty={examDifficulty} setExamDifficulty={setExamDifficulty} examTitle={examTitle} setExamTitle={setExamTitle}
            examInstructions={examInstructions} setExamInstructions={setExamInstructions}
            selectedCurriculum={examSelectedCurriculum} onCurriculumChange={handleExamCurriculumChange} sequences={examAvailableSequences}
            selectedExamSectionIds={selectedExamSectionIds} onSelectedExamSectionIdsChange={setSelectedExamSectionIds}
          />;
       case 'creatorStudio':
        return <CreatorStudioView elements={canvasElements} setElements={setCanvasElements} onSave={handleSaveCanvas} />;
      case 'flashcardGenerator':
        return <FlashcardGenerator
                    onGenerate={handleFlashcardGeneration}
                    onSave={handleSaveFlashcard}
                    currentUser={currentUser}
                    viewingSavedFlashcard={viewingSavedFlashcard}
                    setViewingSavedFlashcard={setViewingSavedFlashcard}
                />;
      case 'timetableEditor':
        return <TimetableEditor userId={currentUser.uid} currentUser={currentUser} />;
      case 'curriculumOverview':
        return <CurriculumOverview curriculumDataMap={curriculumDataMap} />;
      case 'schoolCalendar':
        return <SchoolCalendarView userId={currentUser.uid} />;
      case 'savedPlans':
        return <SavedPlansView currentUser={currentUser} onLoadPlan={handleLoadPlan} />;
      case 'savedExams':
        return <SavedExamsView currentUser={currentUser} onLoadExam={handleLoadExam} />;
      case 'savedCanvas':
          return <SavedCanvasView currentUser={currentUser} onLoadCanvas={handleLoadCanvas} />;
      case 'savedFlashcards':
          return <SavedFlashcardsView currentUser={currentUser} onLoadFlashcard={handleLoadFlashcard} />;
      case 'adminDashboard':
        return currentUser.role === 'admin' ? <AdminDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} /> : <p>Access Denied.</p>;
      default:
        return <p>View not found.</p>;
    }
  };
  
  const mainContentPaddingClass = activeView === 'creatorStudio' ? '' : 'p-4 sm:p-6 lg:p-8';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          user={currentUser} onLogout={onLogout} onEditProfile={onEditProfile} onOpenReviewModal={onOpenReviewModal}
          activeView={activeView} setActiveView={handleViewChange} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
          themeSettings={themeSettings} toggleThemeMode={toggleThemeMode} setAccentColor={setAccentColor}
        />
        <div className={`flex-grow main-content ${isSidebarOpen ? 'ml-80' : 'ml-20'} flex flex-col h-screen`}>
            <div className={`flex-grow text-[var(--color-text-primary)] overflow-y-auto ${mainContentPaddingClass}`}>
                {renderCurrentView()}
            </div>
            {activeView !== 'creatorStudio' && (
              <footer className="flex-shrink-0 text-[var(--color-text-secondary)] text-center p-4 text-sm" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <p>&copy; {new Date().getFullYear()} Designed and made by MKS. Powered by Gemini.</p>
                  <p className="mt-2">
                      Contact: <a href="mailto:dz.ai.teacher.assistant@gmail.com" className="hover:text-[var(--color-text-primary)] underline">dz.ai.teacher.assistant@gmail.com</a>
                  </p>
              </footer>
            )}
        </div>
      </div>
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
    </div>
  );
};

export default MainApplication;