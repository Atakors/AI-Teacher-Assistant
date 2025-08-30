

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import TimetableEditor from './TimetableEditor';
import CurriculumOverview from './CurriculumOverview';
import { SchoolCalendarView } from './SchoolCalendarView';
import LessonPlannerView from './LessonPlannerView';
import AdminDashboard from './AdminDashboard';
import DashboardView from './DashboardView';
import SavedPlansView from './SavedPlansView';
import SavedExamsView from './SavedExamsView';
import ExamGeneratorView from './ExamGeneratorView';
import CreatorStudioView from './CreatorStudioView';
import SavedCanvasView from './SavedCanvasView';
import FlashcardGenerator from './FlashcardGenerator';
import SavedFlashcardsView from './SavedFlashcardsView';
import PricingView from './PricingView';
import BulkGeneratorView from './BulkGeneratorView';
import { WordGameGeneratorView } from './WordGameGeneratorView';
import ReviewsView from './ReviewsView';
import Chatbot from './Chatbot';
import DigitalSpinnerView from './DigitalSpinnerView';
import { CertificateGeneratorView } from './CertificateGeneratorView';
import { generateLessonPlanWithGemini, generateFlashcardImageWithGemini, generateExamWithGemini } from '../services/geminiService';
import { LessonPlan, CurriculumLevel, CanvasLesson, CanvasSection, CanvasSequence, AppView, ThemeSettings, AccentColor, User, LessonDetailLevel, CreativityLevel, PromptMode, SavedLessonPlan, SavedLessonPlanContext, Exam, SavedExam, ExamSource, QuestionType, ExamDifficulty, CanvasElement, SavedCanvas, SavedFlashcard, WordGameType, WordGameData } from '../types'; 
import { getUserById, decrementLessonPlannerCredits, decrementFlashcardGeneratorCredits, decrementExamGeneratorCredits, saveLessonPlan, saveExam, saveCanvas, updateCanvas, saveFlashcard, saveWordGame, decrementWordGameGeneratorCredits } from '../services/dbService';
import { YEAR_3_PRIMARY_CURRICULUM_CONTENT, YEAR_3_CANVAS_STRUCTURE_DATA } from './constants_year3';
import { YEAR_4_PRIMARY_CURRICULUM_CONTENT, YEAR_4_CANVAS_STRUCTURE_DATA } from './constants_year4';
import { YEAR_5_PRIMARY_CURRICULUM_CONTENT, YEAR_5_CANVAS_STRUCTURE_DATA } from './constants_year5';
import { CURRICULUM_LEVEL_OPTIONS_FOR_VIEW, MenuIcon, EnvelopeIcon, FacebookIcon, ChevronUpIcon } from './constants';


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
  includeTextbookActivities: boolean;
  setIncludeTextbookActivities: (value: boolean) => void;
  // Lifted props
  setNotification: (notification: { message: string, type: 'success' | 'error' } | null) => void;
}

const MainApplication: React.FC<MainApplicationProps> = (props) => {
  const { 
    currentUser, setCurrentUser, onLogout, onEditProfile, onOpenPremiumModal, onOpenReviewModal,
    themeSettings, toggleThemeMode, setAccentColor,
    lessonDetailLevel, setLessonDetailLevel, creativityLevel, setCreativityLevel,
    selectedMaterials, setSelectedMaterials,
    promptMode, setPromptMode, customPrompt, setCustomPrompt,
    includeTextbookActivities, setIncludeTextbookActivities,
    activeView, setActiveView,
    setNotification
  } = props;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State and ref for Go Up button
  const [showGoUpButton, setShowGoUpButton] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  
  // Curriculum Selection State
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumLevel | null>(null);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedSectionFullDetails, setSelectedSectionFullDetails] = useState<CanvasSection | null>(null);

  // Lesson Planner Output State
  const [generatedPlan, setGeneratedPlan] = useState<LessonPlan | null>(null);
  const [selectedLessonDetails, setSelectedLessonDetails] = useState<CanvasLesson | null>(null);
  const [viewingSavedPlan, setViewingSavedPlan] = useState<SavedLessonPlan | null>(null);

  // Exam Generator State
  const [generatedExam, setGeneratedExam] = useState<Exam | null>(null);
  const [viewingSavedExam, setViewingSavedExam] = useState<SavedExam | null>(null);
  const [examSource, setExamSource] = useState<ExamSource>('curriculum');
  const [examTopic, setExamTopic] = useState('');
  const [examCustomPrompt, setExamCustomPrompt] = useState('');
  const [examSections, setExamSections] = useState<{ id: number; title: string; questionType: QuestionType; numberOfQuestions: number; points: number }[]>([
    { id: 1, title: 'Reading Comprehension', questionType: 'True/False', numberOfQuestions: 3, points: 3 },
    { id: 2, title: 'Vocabulary', questionType: 'Matching', numberOfQuestions: 4, points: 2 },
    { id: 3, title: 'Grammar', questionType: 'Fill in the Blanks', numberOfQuestions: 1, points: 2 },
    { id: 4, title: 'Writing', questionType: 'Handwriting Practice', numberOfQuestions: 1, points: 1 },
  ]);
  const [examDifficulty, setExamDifficulty] = useState<ExamDifficulty>('Medium');
  const [examTitle, setExamTitle] = useState('');
  const [examInstructions, setExamInstructions] = useState('');
  const [examIncludeReadingPassage, setExamIncludeReadingPassage] = useState(true);
  const [examReadingPassageTopic, setExamReadingPassageTopic] = useState('');

  
  // Exam Generator specific curriculum selection
  const [examSelectedCurriculum, setExamSelectedCurriculum] = useState<CurriculumLevel | null>(null);
  const [selectedExamSectionIds, setSelectedExamSectionIds] = useState<string[]>([]);

  // Creator Studio State
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [loadedCanvasId, setLoadedCanvasId] = useState<string | null>(null);
  
  // Flashcard State
  const [viewingSavedFlashcard, setViewingSavedFlashcard] = useState<SavedFlashcard | null>(null);


  // Effect for the "Go Up" button visibility
  useEffect(() => {
    const mainEl = mainContentRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
        if (mainEl.scrollTop > 300) {
            setShowGoUpButton(true);
        } else {
            setShowGoUpButton(false);
        }
    };

    mainEl.addEventListener('scroll', handleScroll);
    return () => {
        mainEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleGoUpClick = () => {
      mainContentRef.current?.scrollTo({
          top: 0,
          behavior: 'smooth'
      });
  };

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

  const curriculumDataMap = useMemo((): Record<string, CanvasSequence[]> => ({
    [CurriculumLevel.PRIMARY_3]: YEAR_3_CANVAS_STRUCTURE_DATA,
    [CurriculumLevel.PRIMARY_4]: YEAR_4_CANVAS_STRUCTURE_DATA,
    [CurriculumLevel.PRIMARY_5]: YEAR_5_CANVAS_STRUCTURE_DATA,
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

  const handleLessonChange = (lesson: CanvasLesson | null) => {
    setSelectedLessonDetails(lesson);
  };
  
  const handleViewChange = (view: AppView) => {
    if (view === 'bulkGenerator' && currentUser.role !== 'admin') {
      onOpenPremiumModal('Bulk Generator (Admin Only)');
      return;
    }

    if (view === 'creatorStudio') {
      setCanvasElements([]);
      setLoadedCanvasId(null);
    }
    setActiveView(view);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
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
    if (freshUser.lessonPlannerCredits <= 0) {
        onOpenPremiumModal('Lesson Plan Generations');
        return;
    }
    if (!isGenerationAllowed) {
        setError("Please complete all required selections before generating.");
        return;
    }
    
    const displayArea = document.getElementById('lesson-plan-display-area');
    if (displayArea) {
      displayArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPlan(null);
    setViewingSavedPlan(null);

    let curriculumContentToPass: string | null = null;
    let topicForAI: string = '';
    const sequence = availableSequences.find(s => s.id === selectedSequenceId);

    if (promptMode === 'structured' && selectedCurriculum && selectedLessonDetails) {
        curriculumContentToPass = selectedSectionFullDetails?.detailedContent || null;
        
        const section = sequence?.sections.find(sec => sec.id === selectedSectionId);
        topicForAI = `Generate a lesson plan for the ${selectedCurriculum} session: "${selectedLessonDetails.name}" from Sequence: "${sequence?.title}" within Section: "${section?.name}".`;
        if (includeTextbookActivities && selectedLessonDetails.bookActivities?.length) {
            topicForAI += `\n**Important**: You MUST base some of the lesson's procedure on the following textbook activities: ${selectedLessonDetails.bookActivities.map(a => `P${a.page}${a.activityNumber ? ` (Act. ${a.activityNumber})` : ''}: ${a.description}`).join('; ')}`;
        } else {
            topicForAI += `\n**Important**: Do NOT mention or include any textbook activities. Create original activities based only on the provided curriculum content.`;
        }
    }

    try {
      const plan = await generateLessonPlanWithGemini(currentUser.name, selectedCurriculum!, topicForAI, curriculumContentToPass, lessonDetailLevel, creativityLevel, selectedMaterials, promptMode, customPrompt, sequence?.title || null);
      setGeneratedPlan(plan);
      await decrementLessonPlannerCredits(currentUser.uid, 2);
      const updatedUser = await getUserById(currentUser.uid);
      if (updatedUser) setCurrentUser(updatedUser);
    } catch (err) {
      if (err instanceof Error && err.message === 'QUOTA_EXCEEDED') {
        setGeneratedPlan(null); // Clear any old plan
        setError("QUOTA_EXCEEDED_LESSON_PLANNER");
      } else {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, onOpenPremiumModal, isGenerationAllowed, promptMode, customPrompt, selectedCurriculum, selectedLessonDetails, selectedSequenceId, selectedSectionId, selectedSectionFullDetails, includeTextbookActivities, lessonDetailLevel, creativityLevel, selectedMaterials, setCurrentUser, availableSequences]);
  
  const handleFlashcardGeneration = async (prompt: string, aspectRatio: string): Promise<string> => {
    const freshUser = await getUserById(currentUser.uid);
    if (!freshUser) throw new Error("Could not verify your account status.");
    if (freshUser.flashcardGeneratorCredits <= 0) {
        onOpenPremiumModal('Flashcard Generations');
        throw new Error("Image generation limit reached. Upgrade to Premium.");
    }
    try {
      const imageUrl = await generateFlashcardImageWithGemini(prompt, aspectRatio);
      await decrementFlashcardGeneratorCredits(currentUser.uid, 1);
      const updatedUser = await getUserById(currentUser.uid);
      if (updatedUser) setCurrentUser(updatedUser);
      return imageUrl;
    } catch (err) {
      throw err;
    }
  };

  const handleSaveFlashcard = async (prompt: string, style: string, aspectRatio: string, imageData: string) => {
    if (currentUser.plan === 'free') {
        onOpenPremiumModal('Saving Flashcards');
        return;
    }
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
    if (currentUser.plan === 'free') {
        onOpenPremiumModal('Saving Lesson Plans');
        return;
    }
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
      if (currentUser.plan === 'free') {
          onOpenPremiumModal('Exam Generator');
          return;
      }
      const freshUser = await getUserById(currentUser.uid);
      if (!freshUser) {
          setError("Could not verify your account status.");
          return;
      }
      if (freshUser.examGeneratorCredits <= 0) {
          onOpenPremiumModal('Exam Generations');
          return;
      }
      
      setIsLoading(true);
      setError(null);
      setGeneratedExam(null);

      let curriculumContent: string | null = null;
      let topicForAI = examTopic;
      let sequenceIds: string[] = [];

      if (examSource === 'curriculum') {
          const allSequences = getExamCanvasStructureData();
          const contentParts: string[] = [];
          const sectionNames: string[] = [];
          const sequenceIdSet = new Set<string>();

          selectedExamSectionIds.forEach(sectionId => {
              for (const seq of allSequences) {
                  const section = seq.sections.find(sec => sec.id === sectionId);
                  if (section) {
                      if (section.detailedContent) {
                          contentParts.push(section.detailedContent);
                      }
                      sectionNames.push(`${seq.title} > ${section.name}`);
                      sequenceIdSet.add(seq.id);
                      break;
                  }
              }
          });
          curriculumContent = contentParts.join('\n\n---\n\n');
          if (sectionNames.length > 0 && !examTopic.trim()) {
              topicForAI = `Exam based on: ${sectionNames.join('; ')}`;
          }
          sequenceIds = Array.from(sequenceIdSet);
      }

      const context = {
          curriculum: examSelectedCurriculum,
          sectionContent: curriculumContent,
          topic: topicForAI,
          customPrompt: examCustomPrompt,
          sequenceIds: sequenceIds
      };
      
      const examConfig = {
          sections: examSections.map(({ id, ...rest }) => rest), // Remove client-side ID before sending to AI
          difficulty: examDifficulty,
          title: examTitle,
          instructions: examInstructions,
          includeReadingPassage: examIncludeReadingPassage,
          readingPassageTopic: examReadingPassageTopic
      };

      try {
          const exam = await generateExamWithGemini(examSource, context, examConfig);
          setGeneratedExam(exam);
          await decrementExamGeneratorCredits(currentUser.uid, 3);
          const updatedUser = await getUserById(currentUser.uid);
          if (updatedUser) setCurrentUser(updatedUser);
      } catch (err) {
          if (err instanceof Error && err.message === 'QUOTA_EXCEEDED') {
              setGeneratedExam(null);
              setError("QUOTA_EXCEEDED_EXAM_GENERATOR");
          } else {
              setError(err instanceof Error ? err.message : "An unknown error occurred while generating the exam.");
          }
      } finally {
          setIsLoading(false);
      }
  }, [currentUser.uid, currentUser.plan, onOpenPremiumModal, examSelectedCurriculum, selectedExamSectionIds, examTopic, examCustomPrompt, examSource, examSections, examDifficulty, examTitle, examInstructions, examIncludeReadingPassage, examReadingPassageTopic, setCurrentUser, getExamCanvasStructureData]);

  const handleSaveExam = async () => {
      if (currentUser.plan === 'free') {
          onOpenPremiumModal('Saving Exams');
          return;
      }
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
  const handleSaveCanvas = async () => {
      if (currentUser.plan === 'free') {
          onOpenPremiumModal('Saving Canvases');
          return;
      }
      const canvasData = {
          elements: canvasElements,
          width: 794,
          height: 1123,
          backgroundColor: '#FFFFFF',
      };
      
      try {
          if (loadedCanvasId) {
              await updateCanvas(loadedCanvasId, canvasData);
              setNotification({ message: "Canvas updated successfully!", type: 'success' });
          } else {
              const name = window.prompt("Enter a name for your new canvas:", "Untitled Design");
              if (!name?.trim()) return;
              const newId = await saveCanvas(currentUser.uid, name.trim(), canvasData);
              setLoadedCanvasId(newId);
              setNotification({ message: "Canvas saved successfully!", type: 'success' });
          }
      } catch (e) {
          setNotification({ message: `Save failed: ${e instanceof Error ? e.message : "Unknown error"}`, type: 'error' });
      }
  };

  const handleSaveCanvasAs = async () => {
      if (currentUser.plan === 'free') {
          onOpenPremiumModal('Saving Canvases');
          return;
      }
      const name = window.prompt("Enter a name for the new copy:", "Copy of Design");
      if (!name?.trim()) return;

      const canvasData = {
          elements: canvasElements,
          width: 794,
          height: 1123,
          backgroundColor: '#FFFFFF',
      };
      
      try {
          const newId = await saveCanvas(currentUser.uid, name.trim(), canvasData);
          setLoadedCanvasId(newId);
          setNotification({ message: "Canvas saved as new copy!", type: 'success' });
      } catch (e) {
          setNotification({ message: `Save failed: ${e instanceof Error ? e.message : "Unknown error"}`, type: 'error' });
      }
  };

  const handleLoadCanvas = (savedCanvas: SavedCanvas) => {
      setCanvasElements(savedCanvas.canvasData.elements);
      setLoadedCanvasId(savedCanvas.id);
      setActiveView('creatorStudio');
  };

  const handleSaveGame = async (name: string, gameType: WordGameType, level: CurriculumLevel, topic: string, gameData: WordGameData) => {
    if (currentUser.plan === 'free') {
        onOpenPremiumModal('Saving Word Games');
        return;
    }
    try {
        await saveWordGame(currentUser.uid, name.trim(), gameType, level, topic, gameData);
        setNotification({ message: "Word game saved successfully!", type: 'success' });
    } catch (e) {
        setNotification({ message: `Save failed: ${e instanceof Error ? e.message : "Unknown error"}`, type: 'error' });
    }
  };


  const renderCurrentView = () => {
    switch(activeView) {
      case 'dashboard':
        return <DashboardView 
            currentUser={currentUser} 
            onOpenPremiumModal={onOpenPremiumModal} 
            setActiveView={handleViewChange}
            onEditProfile={onEditProfile}
            onOpenReviewModal={onOpenReviewModal}
            themeSettings={themeSettings}
            toggleThemeMode={toggleThemeMode}
            setAccentColor={setAccentColor}
        />;
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
      case 'bulkGenerator':
        return <BulkGeneratorView
            currentUser={currentUser}
            lessonDetailLevel={lessonDetailLevel}
            creativityLevel={creativityLevel}
            selectedMaterials={selectedMaterials}
            onOpenPremiumModal={onOpenPremiumModal}
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
            examIncludeReadingPassage={examIncludeReadingPassage} setExamIncludeReadingPassage={setExamIncludeReadingPassage}
            examReadingPassageTopic={examReadingPassageTopic} setExamReadingPassageTopic={setExamReadingPassageTopic}
          />;
      case 'wordGameGenerator':
        return <WordGameGeneratorView 
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            onOpenPremiumModal={onOpenPremiumModal}
            onSaveGame={handleSaveGame}
        />;
       case 'creatorStudio':
        return <CreatorStudioView
            elements={canvasElements}
            setElements={setCanvasElements}
            onSave={handleSaveCanvas}
            onSaveAs={handleSaveCanvasAs}
            onToggleSidebar={() => setIsSidebarOpen(p => !p)}
        />;
      case 'flashcardGenerator':
        return <FlashcardGenerator
                    onGenerate={handleFlashcardGeneration}
                    onSave={handleSaveFlashcard}
                    currentUser={currentUser}
                    viewingSavedFlashcard={viewingSavedFlashcard}
                    setViewingSavedFlashcard={setViewingSavedFlashcard}
                />;
      case 'digitalSpinner':
          return <DigitalSpinnerView
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            onOpenPremiumModal={onOpenPremiumModal}
            setNotification={setNotification}
           />;
      case 'certificateGenerator':
        return <CertificateGeneratorView
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            onOpenPremiumModal={onOpenPremiumModal}
            setNotification={setNotification}
        />;
      case 'timetableEditor':
        return <TimetableEditor userId={currentUser.uid} currentUser={currentUser} />;
      case 'curriculumOverview':
        return <CurriculumOverview curriculumDataMap={curriculumDataMap} />;
      case 'schoolCalendar':
        return <SchoolCalendarView userId={currentUser.uid} currentUser={currentUser} onOpenPremiumModal={onOpenPremiumModal} />;
      case 'pricing':
        return <PricingView currentUser={currentUser} />;
      case 'reviews':
        return <ReviewsView />;
      case 'savedPlans':
        return <SavedPlansView currentUser={currentUser} onLoadPlan={handleLoadPlan} />;
      case 'savedExams':
        return <SavedExamsView currentUser={currentUser} onLoadExam={handleLoadExam} />;
      case 'savedCanvas':
          return <SavedCanvasView currentUser={currentUser} onLoadCanvas={handleLoadCanvas} />;
      case 'savedFlashcards':
          return <SavedFlashcardsView currentUser={currentUser} onLoadFlashcard={handleLoadFlashcard} />;
      case 'adminDashboard':
        return currentUser.role === 'admin' ? <AdminDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} setNotification={setNotification} /> : <p>Access Denied.</p>;
      default:
        return <p>View not found.</p>;
    }
  };
  
  const mainContentPaddingClass = activeView === 'creatorStudio' ? '' : 'p-4 sm:p-6 lg:p-8';

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          user={currentUser}
          onLogout={onLogout}
          activeView={activeView}
          setActiveView={handleViewChange}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
        <main className="flex-grow main-content flex flex-col">
            {activeView !== 'creatorStudio' && (
                <header className="lg:hidden flex items-center h-16 px-4 bg-[var(--color-surface)] border-b border-[var(--color-outline)] flex-shrink-0 z-10 sticky top-0">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-md hover:bg-[var(--color-surface-variant)]" title="Open Menu">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                </header>
            )}
            <div ref={mainContentRef} className={`flex-grow text-[var(--color-on-bg)] overflow-y-auto custom-scrollbar-container ${mainContentPaddingClass}`}>
                {renderCurrentView()}
            </div>
            {activeView !== 'creatorStudio' && (
              <footer className="flex-shrink-0 text-[var(--color-on-surface-variant)] p-4 text-sm border-t border-[var(--color-outline)] flex flex-col sm:flex-row items-center justify-between gap-4" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <p className="text-center sm:text-left">&copy; {new Date().getFullYear()} Designed and made by MKS. Powered by Gemini.</p>
                  <div className="flex items-center justify-center gap-x-6">
                      <a href="mailto:contact@aitadz.pro?subject=Support%20Request%20from%20AI%20Teacher%20Assistant" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 hover:text-[var(--color-on-surface)] underline">
                          <EnvelopeIcon className="h-4 w-4" />
                          <span>Contact Support</span>
                      </a>
                      <a href="https://www.facebook.com/profile.php?id=61579128010849" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 hover:text-[var(--color-on-surface)] underline">
                          <FacebookIcon className="h-4 w-4" />
                          <span>Join us on Facebook</span>
                      </a>
                  </div>
              </footer>
            )}
        </main>
      </div>
      <button
        onClick={handleGoUpClick}
        className={`go-up-button material-button material-button-primary !p-4 !rounded-full ${showGoUpButton ? 'visible' : ''}`}
        aria-label="Scroll to top"
        title="Scroll to top"
      >
        <ChevronUpIcon className="w-6 h-6" />
      </button>
      <Chatbot />
    </div>
  );
};

export default MainApplication;