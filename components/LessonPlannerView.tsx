import React from 'react';
import { CurriculumLevel, CanvasSequence, CanvasSection, CanvasLesson, LessonPlan, LessonDetailLevel, CreativityLevel, PromptMode, User } from '../types';
import LessonPlannerControls from './LessonPlannerControls';
import SectionDetailDisplay from './SectionDetailDisplay';
import LessonPlanDisplay from './LessonPlanDisplay';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface LessonPlannerViewProps {
  selectedCurriculum: CurriculumLevel | null;
  onCurriculumChange: (value: CurriculumLevel) => void;
  sequences: CanvasSequence[];
  selectedSequenceId: string | null;
  selectedSectionId: string | null;
  selectedLesson: CanvasLesson | null;
  onSequenceChange: (sequenceId: string | null) => void;
  onSectionChange: (sectionId: string | null) => void;
  onLessonChange: (lesson: CanvasLesson | null) => void;
  isLoading: boolean;
  isGenerationAllowed: boolean;
  onGeneratePlan: () => void;
  includeTextbookActivities: boolean;
  onIncludeTextbookActivitiesChange: (checked: boolean) => void;
  selectedMaterials: string[];
  onSelectedMaterialsChange: (materials: string[]) => void;
  selectedSectionFullDetails: CanvasSection | null;
  generatedPlan: LessonPlan | null;
  error: string | null;
  lessonDetailLevel: LessonDetailLevel;
  setLessonDetailLevel: (level: LessonDetailLevel) => void;
  creativityLevel: CreativityLevel;
  setCreativityLevel: (level: CreativityLevel) => void;
  promptMode: PromptMode;
  setPromptMode: (mode: PromptMode) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  currentUser: User;
  // Props for saved plans
  isViewingSavedPlan: boolean;
  onCloseSavedPlan: () => void;
  viewingSavedPlanName: string | null;
  onSavePlan: () => void;
}

const LessonPlannerView: React.FC<LessonPlannerViewProps> = (props) => {
  const {
    selectedCurriculum, selectedSectionFullDetails, selectedLesson, isLoading, error, generatedPlan,
    isViewingSavedPlan, onCloseSavedPlan, viewingSavedPlanName, onSavePlan
  } = props;

  const showSectionDetails = selectedCurriculum && 
                              selectedCurriculum !== CurriculumLevel.SELECT_YEAR &&
                              [CurriculumLevel.PRIMARY_3, CurriculumLevel.PRIMARY_4, CurriculumLevel.PRIMARY_5].includes(selectedCurriculum) &&
                              selectedSectionFullDetails;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Column - Controls and Details */}
      <div className="lg:w-2/5 space-y-6">
        <div className="lg:sticky lg:top-8 self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto custom-scrollbar-container lg:pr-2">
            <LessonPlannerControls {...props} disabled={isViewingSavedPlan} />
            {showSectionDetails && (
                <SectionDetailDisplay 
                    section={selectedSectionFullDetails} 
                    selectedLesson={selectedLesson}
                    selectedYear={selectedCurriculum} 
                />
            )}
        </div>
      </div>

      {/* Right Column - Lesson Plan Display */}
      <div className="lg:w-3/5">
        {isViewingSavedPlan && (
            <div className="aurora-card p-4 mb-6 flex items-center justify-between">
                <p className="font-semibold">Viewing: <span className="text-[var(--color-accent)]">{viewingSavedPlanName}</span></p>
                <button onClick={onCloseSavedPlan} className="zenith-button-secondary text-sm py-1 px-3 rounded-lg">Close</button>
            </div>
        )}
        {error && !isLoading && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}
        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <LoadingSpinner text="Generating your lesson plan..." />
          </div>
        )}
        {!isLoading && (
          <LessonPlanDisplay plan={generatedPlan} isViewingSavedPlan={isViewingSavedPlan} onSavePlan={onSavePlan} />
        )}
      </div>
    </div>
  );
};

export default LessonPlannerView;