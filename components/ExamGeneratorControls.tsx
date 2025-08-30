

import React from 'react';
import { CurriculumLevel, CanvasSequence, ExamDifficulty, ExamSource, QuestionType, User } from '../types';
import MultiSelectCurriculumAccordion from './MultiSelectCurriculumAccordion';
import { SparklesIcon, PlusIcon, TrashIcon, CURRICULUM_LEVEL_OPTIONS_FOR_VIEW } from './constants';

interface ExamGeneratorControlsProps {
  currentUser: User;
  isLoading: boolean;
  onGenerateExam: () => void;
  examSource: ExamSource;
  setExamSource: (source: ExamSource) => void;
  examTopic: string;
  setExamTopic: (topic: string) => void;
  examCustomPrompt: string;
  setExamCustomPrompt: (prompt: string) => void;
  examSections: { id: number; title: string; questionType: QuestionType; numberOfQuestions: number; points: number }[];
  setExamSections: (sections: { id: number; title: string; questionType: QuestionType; numberOfQuestions: number; points: number }[]) => void;
  examDifficulty: ExamDifficulty;
  setExamDifficulty: (difficulty: ExamDifficulty) => void;
  examTitle: string;
  setExamTitle: (title: string) => void;
  examInstructions: string;
  setExamInstructions: (instructions: string) => void;
  selectedCurriculum: CurriculumLevel | null;
  onCurriculumChange: (value: CurriculumLevel) => void;
  sequences: CanvasSequence[];
  selectedExamSectionIds: string[];
  onSelectedExamSectionIdsChange: (ids: string[]) => void;
  examIncludeReadingPassage: boolean;
  setExamIncludeReadingPassage: (include: boolean) => void;
  examReadingPassageTopic: string;
  setExamReadingPassageTopic: (topic: string) => void;
}

const SegmentedButton: React.FC<{
  options: { label: string, value: string }[];
  selectedValue: string;
  onChange: (value: any) => void;
  disabled?: boolean;
}> = ({ options, selectedValue, onChange, disabled }) => (
  <div className="flex items-center p-1 rounded-lg w-full bg-[var(--color-surface-variant)]">
    {options.map(option => (
      <button
        key={option.value}
        onClick={() => onChange(option.value)}
        disabled={disabled}
        className={`w-full p-1.5 rounded-md text-sm font-medium transition-all text-center ${selectedValue === option.value ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface)]/50'}`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const ALL_QUESTION_TYPES: QuestionType[] = [
  'Multiple Choice',
  'Short Answer',
  'Essay',
  'True/False',
  'Fill in the Blanks',
  'Matching',
  'Complete the Table',
  'Reorder the Words',
  'Guided Writing',
  'Handwriting Practice',
];


const ExamGeneratorControls: React.FC<ExamGeneratorControlsProps> = (props) => {
  const { isLoading, onGenerateExam, examSource, setExamSource, examTopic, setExamTopic, examCustomPrompt, setExamCustomPrompt, examSections, setExamSections, examDifficulty, setExamDifficulty, examTitle, setExamTitle, examInstructions, setExamInstructions, selectedCurriculum, onCurriculumChange, sequences, selectedExamSectionIds, onSelectedExamSectionIdsChange, currentUser, examIncludeReadingPassage, setExamIncludeReadingPassage, examReadingPassageTopic, setExamReadingPassageTopic } = props;

  const isGenerateDisabled = isLoading || (examSource === 'curriculum' && selectedExamSectionIds.length === 0) || (examSource === 'topic' && !examTopic.trim()) || (examSource === 'custom' && !examCustomPrompt.trim()) || examSections.length === 0;

  const handleAddSection = () => {
    const newSection = {
      id: Date.now(),
      title: `Section ${examSections.length + 1}`,
      questionType: 'Multiple Choice' as QuestionType,
      numberOfQuestions: 5,
      points: 5,
    };
    setExamSections([...examSections, newSection]);
  };

  const handleRemoveSection = (id: number) => {
    setExamSections(examSections.filter(s => s.id !== id));
  };

  const handleSectionChange = (id: number, field: string, value: string | number) => {
    setExamSections(examSections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
  
  const sourceOptions = [ { label: 'Curriculum', value: 'curriculum' }, { label: 'Topic', value: 'topic' }, { label: 'Custom', value: 'custom' } ];
  const difficultyOptions = [ { label: 'Easy', value: 'Easy' }, { label: 'Medium', value: 'Medium' }, { label: 'Hard', value: 'Hard' } ];
  const inputClasses = "w-full p-3";
  const selectClasses = `${inputClasses}`;

  return (
    <div className="material-card p-6 sm:p-8 space-y-6">
      <div className="pt-4 border-t border-[var(--color-outline)] first:pt-0 first:border-t-0">
        <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>General Settings</h3>
         <div className="space-y-4">
            <div>
                <label className="flex items-center p-2 cursor-pointer rounded-lg hover:bg-[var(--color-surface-variant)]">
                    <input type="checkbox" checked={examIncludeReadingPassage} onChange={(e) => setExamIncludeReadingPassage(e.target.checked)} disabled={isLoading} />
                    <span className="ml-2 text-sm font-medium">Include Reading Passage</span>
                </label>
                {examIncludeReadingPassage && (
                    <div className="pl-8 mt-2">
                        <label htmlFor="passage-topic" className="block text-sm font-medium mb-1">Passage Topic</label>
                        <input id="passage-topic" type="text" value={examReadingPassageTopic} onChange={e => setExamReadingPassageTopic(e.target.value)} placeholder="e.g., A Day at the Zoo" className={inputClasses} disabled={isLoading} />
                    </div>
                )}
            </div>
             <div>
                <label htmlFor="exam-title" className="block text-sm font-medium mb-1">Exam Title</label>
                <input id="exam-title" type="text" value={examTitle} onChange={e => setExamTitle(e.target.value)} placeholder="AI will suggest one if left blank" className={inputClasses} disabled={isLoading}/>
            </div>
            <div>
                <label htmlFor="exam-instructions" className="block text-sm font-medium mb-1">Instructions</label>
                <textarea id="exam-instructions" value={examInstructions} onChange={e => setExamInstructions(e.target.value)} rows={3} placeholder="AI will suggest instructions if left blank" className={`${inputClasses} resize-y`} disabled={isLoading}/>
            </div>
         </div>
      </div>

      <div className="pt-4 border-t border-[var(--color-outline)] first:pt-0 first:border-t-0">
        <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>Exam Source</h3>
        <SegmentedButton options={sourceOptions} selectedValue={examSource} onChange={setExamSource} disabled={isLoading} />
      </div>

      {examSource === 'curriculum' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Curriculum Year</label>
            <select value={selectedCurriculum || ''} onChange={e => onCurriculumChange(e.target.value as CurriculumLevel)} disabled={isLoading} className={selectClasses}>
                <option value="" disabled>-- Select a Year --</option>
                {CURRICULUM_LEVEL_OPTIONS_FOR_VIEW.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {selectedCurriculum && (
            <div>
              <label className="block text-sm font-medium mb-1">Select Content</label>
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-2">
                  Select sequences or sections. The exam will be based on this content.
              </p>
              <MultiSelectCurriculumAccordion 
                sequences={sequences} 
                selectedSectionIds={selectedExamSectionIds} 
                onSelectionChange={onSelectedExamSectionIdsChange}
                disabled={isLoading} 
              />
            </div>
          )}
        </div>
      )}

      {examSource === 'topic' && (
        <div>
          <label htmlFor="exam-topic" className="block text-sm font-medium mb-1">Topic</label>
          <input id="exam-topic" type="text" value={examTopic} onChange={e => setExamTopic(e.target.value)} placeholder="e.g., Present Simple Tense" className={inputClasses} disabled={isLoading} />
        </div>
      )}

      {examSource === 'custom' && (
        <div>
          <label htmlFor="exam-custom-prompt" className="block text-sm font-medium mb-1">Custom Prompt</label>
          <textarea id="exam-custom-prompt" value={examCustomPrompt} onChange={e => setExamCustomPrompt(e.target.value)} rows={5} placeholder="e.g., Create an exam about Algerian national heroes for Year 4 students..." className={`${inputClasses} resize-y`} disabled={isLoading} />
        </div>
      )}

      <div className="pt-4 border-t border-[var(--color-outline)]">
        <h3 className="text-lg font-semibold mb-2">Structure & Sections</h3>
        <div className="space-y-3">
          {examSections.map((section, index) => (
            <div key={section.id} className="p-3 rounded-lg bg-[var(--color-surface-variant)] space-y-2">
              <div className="flex justify-between items-center">
                <p className="font-medium text-sm">Section {index + 1}</p>
                <button onClick={() => handleRemoveSection(section.id)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-full" disabled={isLoading}>
                    <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              <input type="text" value={section.title} onChange={e => handleSectionChange(section.id, 'title', e.target.value)} className={inputClasses} style={{ backgroundColor: 'var(--color-surface)'}} disabled={isLoading}/>
              <div className="grid grid-cols-3 gap-2">
                  <select value={section.questionType} onChange={e => handleSectionChange(section.id, 'questionType', e.target.value)} className={`${selectClasses} col-span-2`} style={{ backgroundColor: 'var(--color-surface)'}} disabled={isLoading}>
                      {ALL_QUESTION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <input type="number" value={section.numberOfQuestions} onChange={e => handleSectionChange(section.id, 'numberOfQuestions', parseInt(e.target.value) || 1)} min="1" className={`${inputClasses}`} style={{ backgroundColor: 'var(--color-surface)'}} disabled={isLoading}/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Points</label>
                <input type="number" value={section.points} onChange={e => handleSectionChange(section.id, 'points', parseInt(e.target.value) || 0)} min="0" className={`${inputClasses} w-full`} style={{ backgroundColor: 'var(--color-surface)'}} disabled={isLoading}/>
              </div>
            </div>
          ))}
          <button onClick={handleAddSection} className="w-full material-button material-button-secondary text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2" disabled={isLoading}>
            <PlusIcon className="w-4 h-4" /> Add Section
          </button>
        </div>
      </div>
      
       <div className="pt-4 border-t border-[var(--color-outline)]">
          <h3 className="text-lg font-semibold mb-2">Difficulty</h3>
          <SegmentedButton options={difficultyOptions} selectedValue={examDifficulty} onChange={setExamDifficulty} disabled={isLoading} />
       </div>

      <div className="pt-4 border-t border-[var(--color-outline)]">
        <p className="text-xs text-center text-[var(--color-on-surface-variant)] mb-2">
            You have <span className="font-bold text-[var(--color-on-surface)]">{currentUser.examGeneratorCredits}</span> exam credits remaining.
        </p>
        <button onClick={onGenerateExam} disabled={isGenerateDisabled} className="w-full flex justify-center items-center py-3 px-4 font-medium rounded-lg material-button material-button-primary">
          {isLoading ? 'Generating...' : <><SparklesIcon className="w-5 h-5 mr-2" />Generate Exam</>}
        </button>
      </div>
    </div>
  );
};

export default ExamGeneratorControls;