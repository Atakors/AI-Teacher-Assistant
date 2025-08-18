import React, { useState, useEffect } from 'react';
import { CurriculumLevel, CanvasSequence, CanvasSection, CanvasLesson, LessonDetailLevel, CreativityLevel, PromptMode, User } from '../types';
import { CURRICULUM_LEVEL_OPTIONS_FOR_VIEW, SparklesIcon, SaveIcon, CheckIcon, COMMON_MATERIALS, ChevronDownIcon } from './constants';
import CurriculumAccordion from './CurriculumAccordion';

interface LessonPlannerControlsProps {
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
  lessonDetailLevel: LessonDetailLevel;
  setLessonDetailLevel: (level: LessonDetailLevel) => void;
  creativityLevel: CreativityLevel;
  setCreativityLevel: (level: CreativityLevel) => void;
  promptMode: PromptMode;
  setPromptMode: (mode: PromptMode) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  currentUser: User;
  disabled?: boolean;
}

const SegmentedButton: React.FC<{
  options: { label: string, value: string }[];
  selectedValue: string;
  onChange: (value: any) => void;
  disabled?: boolean;
}> = ({ options, selectedValue, onChange, disabled }) => (
  <div className="flex items-center p-1 rounded-lg w-full" style={{backgroundColor: 'var(--color-inset-bg)'}}>
    {options.map(option => (
      <button
        key={option.value}
        onClick={() => onChange(option.value)}
        disabled={disabled}
        className={`w-full p-1 rounded-md text-sm font-medium transition-all text-center ${selectedValue === option.value ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]/50'}`}
      >
        {option.label}
      </button>
    ))}
  </div>
);


const LessonPlannerControls: React.FC<LessonPlannerControlsProps> = ({
  selectedCurriculum, onCurriculumChange, sequences,
  selectedSequenceId, selectedSectionId, selectedLesson,
  onSequenceChange, onSectionChange, onLessonChange,
  isLoading, isGenerationAllowed, onGeneratePlan,
  includeTextbookActivities, onIncludeTextbookActivitiesChange,
  selectedMaterials, onSelectedMaterialsChange,
  lessonDetailLevel, setLessonDetailLevel, creativityLevel, setCreativityLevel,
  promptMode, setPromptMode, customPrompt, setCustomPrompt,
  currentUser,
  disabled = false
}) => {
  const showTextbookOption = selectedLesson?.bookActivities?.length > 0;
  const [isMaterialsExpanded, setIsMaterialsExpanded] = useState(false);

  // Local state for AI settings to enable explicit saving
  const [localDetailLevel, setLocalDetailLevel] = useState<LessonDetailLevel>(lessonDetailLevel);
  const [localCreativityLevel, setLocalCreativityLevel] = useState<CreativityLevel>(creativityLevel);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Sync local state if props change from parent (e.g., initial load)
  useEffect(() => {
    setLocalDetailLevel(lessonDetailLevel);
    setLocalCreativityLevel(creativityLevel);
  }, [lessonDetailLevel, creativityLevel]);

  const haveSettingsChanged = localDetailLevel !== lessonDetailLevel || localCreativityLevel !== creativityLevel;

  const handleSaveSettings = () => {
    setLessonDetailLevel(localDetailLevel);
    setCreativityLevel(localCreativityLevel);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000); // Hide message after 2s
  };

  const handleMaterialChange = (material: string) => {
    const newSelection = selectedMaterials.includes(material)
      ? selectedMaterials.filter(m => m !== material)
      : [...selectedMaterials, material];
    onSelectedMaterialsChange(newSelection);
  };

  const detailOptions = [
    { label: 'Concise', value: 'concise' },
    { label: 'Standard', value: 'standard' },
    { label: 'Detailed', value: 'detailed' }
  ];

  const creativityOptions = [
    { label: 'Focused', value: 'focused' },
    { label: 'Balanced', value: 'balanced' },
    { label: 'Creative', value: 'creative' }
  ];
  
  const promptModeOptions = [
    { label: 'Structured', value: 'structured' },
    { label: 'Custom', value: 'custom' },
  ];

  return (
    <div className={`aurora-card p-6 sm:p-8 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-accent)' }}>Prompt Mode</h3>
          <SegmentedButton options={promptModeOptions} selectedValue={promptMode} onChange={setPromptMode} disabled={isLoading || disabled} />
        </div>
        
        {promptMode === 'custom' && (
          <div>
            <label htmlFor="custom-prompt-textarea" className="block text-lg font-semibold mb-2 text-[var(--color-text-primary)]">Custom Prompt</label>
            <textarea
              id="custom-prompt-textarea"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={6}
              className="mt-1 block w-full p-3 text-base rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none sm:text-sm resize-y border border-[var(--color-border)]"
              style={{ backgroundColor: 'var(--color-input-bg)'}}
              placeholder="Enter your detailed lesson plan prompt here. The AI will still be instructed to return the output in the required JSON format."
              disabled={isLoading || disabled}
            />
          </div>
        )}

        <div className={promptMode === 'custom' ? 'opacity-50 pointer-events-none' : ''}>
          <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-accent)' }}>Curriculum Selection</h3>
          <div id="curriculum-year-selector" className="space-y-1 p-2 rounded-lg" style={{backgroundColor: 'var(--color-inset-bg)'}}>
            {CURRICULUM_LEVEL_OPTIONS_FOR_VIEW.map(option => (
              <button key={option.value} onClick={() => onCurriculumChange(option.value)} disabled={isLoading || disabled || promptMode === 'custom'}
                className={`w-full text-left p-2 text-sm rounded-md transition-colors ${selectedCurriculum === option.value ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-surface)]'}`}>
                {option.label}
              </button>
            ))}
          </div>
        
          {selectedCurriculum && (
            <div id="lesson-accordion">
              <h3 className="text-lg font-semibold mb-2 mt-4 text-[var(--color-text-primary)]">Lesson Details</h3>
              <CurriculumAccordion sequences={sequences} selectedSequenceId={selectedSequenceId}
                selectedSectionId={selectedSectionId} selectedLesson={selectedLesson} onSequenceChange={onSequenceChange}
                onSectionChange={onSectionChange} onLessonChange={onLessonChange} disabled={isLoading || disabled || promptMode === 'custom'}
              />
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t border-[var(--color-border)]">
          <h3 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">Options</h3>
          <div className="space-y-2">
            {showTextbookOption && (
                <label className="flex items-center p-2 cursor-pointer rounded-lg hover:bg-[var(--color-inset-bg)]">
                    <input type="checkbox" checked={includeTextbookActivities} onChange={(e) => onIncludeTextbookActivitiesChange(e.target.checked)} disabled={isLoading || disabled}
                      className="h-4 w-4 shrink-0 appearance-none rounded-sm border-2 border-[var(--color-border)] checked:bg-[var(--color-accent)] focus-visible:outline-none"
                    />
                    <span className="ml-2 text-sm">Include Textbook Activities</span>
                </label>
            )}
            
            {/* New Materials Checklist */}
            <div>
              <button
                onClick={() => setIsMaterialsExpanded(!isMaterialsExpanded)}
                className="w-full flex justify-between items-center p-2 text-left text-sm font-medium rounded-lg hover:bg-[var(--color-inset-bg)]"
                aria-expanded={isMaterialsExpanded}
                disabled={disabled}
              >
                <span>Available Materials</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isMaterialsExpanded ? 'rotate-180' : ''}`} />
              </button>
              {isMaterialsExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 mt-1">
                  {COMMON_MATERIALS.map(material => (
                    <label key={material} className="flex items-center p-2 cursor-pointer rounded-lg hover:bg-[var(--color-inset-bg)]">
                      <input
                        type="checkbox"
                        checked={selectedMaterials.includes(material)}
                        onChange={() => handleMaterialChange(material)}
                        disabled={isLoading || disabled}
                        className="h-4 w-4 shrink-0 appearance-none rounded-sm border-2 border-[var(--color-border)] checked:bg-[var(--color-accent)] focus-visible:outline-none"
                      />
                      <span className="ml-2 text-sm">{material}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div id="ai-settings-panel" className="pt-4 border-t border-[var(--color-border)]">
          <h3 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">AI Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Lesson Detail Level</label>
              <SegmentedButton options={detailOptions} selectedValue={localDetailLevel} onChange={setLocalDetailLevel} disabled={isLoading || disabled} />
            </div>
             <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Creativity Level</label>
              <SegmentedButton options={creativityOptions} selectedValue={localCreativityLevel} onChange={setLocalCreativityLevel} disabled={isLoading || disabled} />
            </div>
            <div className="flex items-center gap-4 pt-2">
                <button
                    onClick={handleSaveSettings}
                    disabled={!haveSettingsChanged || isLoading || disabled}
                    className="flex-grow blueprint-button-secondary text-sm py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <SaveIcon className="w-4 h-4" />
                    Save AI Settings
                </button>
                {showSaveSuccess && (
                    <div className="flex items-center gap-1 text-emerald-500 transition-opacity duration-300">
                        <CheckIcon className="w-4 h-4"/>
                        <span className="text-xs font-medium">Saved!</span>
                    </div>
                )}
            </div>
          </div>
        </div>

         <div className="pt-4 border-t border-[var(--color-border)]">
            {currentUser.plan === 'free' && (
                <p className="text-xs text-center text-[var(--color-text-secondary)] mb-2">
                   You have <span className="font-bold text-[var(--color-text-primary)]">{currentUser.lessonCreditsRemaining}</span> lesson credits remaining.
                </p>
            )}
            <button
              id="generate-plan-button"
              type="button"
              onClick={onGeneratePlan}
              disabled={isLoading || !isGenerationAllowed || disabled}
              className="w-full flex justify-center items-center py-3 px-4 font-medium rounded-lg transition-colors border border-transparent disabled:opacity-50 disabled:cursor-not-allowed interactive-glow"
              style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
            >
              {isLoading ? 'Generating...' : <><SparklesIcon className="w-5 h-5 mr-2" />Generate Lesson Plan</>}
            </button>
          </div>
      </div>
    </div>
  );
};

export default LessonPlannerControls;