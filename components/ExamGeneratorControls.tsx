
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
  examSections: { id: number; title: string; questionType: QuestionType; numberOfQuestions: number }[];
  setExamSections: (sections: { id: number; title: string; questionType: QuestionType; numberOfQuestions: number }[]) => void;
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

const ExamGeneratorControls: React.FC<ExamGeneratorControlsProps> = (props) => {
  const { isLoading, onGenerateExam, examSource, setExamSource, examTopic, setExamTopic, examCustomPrompt, setExamCustomPrompt, examSections, setExamSections, examDifficulty, setExamDifficulty, examTitle, setExamTitle, examInstructions, setExamInstructions, selectedCurriculum, onCurriculumChange, sequences, selectedExamSectionIds, onSelectedExamSectionIdsChange } = props;

  const isGenerateDisabled = isLoading || (examSource === 'curriculum' && selectedExamSectionIds.length === 0) || (examSource === 'topic' && !examTopic.trim()) || (examSource === 'custom' && !examCustomPrompt.trim()) || examSections.length === 0;

  const handleAddSection = () => {
    const newSection = {
      id: Date.now(),
      title: `Section ${examSections.length + 1}`,
      questionType: 'Multiple Choice' as QuestionType,
      numberOfQuestions: 5,
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
  const inputClasses = "mt-1 block w-full p-3 text-base rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none sm:text-sm border border-[var(--color-border)]";
  const selectClasses = `${inputClasses} appearance-none`;

  return (
    <div className="aurora-card p-6 sm:p-8 space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-3 text-[var(--color-accent)]">Exam Source</h3>
        <SegmentedButton options={sourceOptions} selectedValue={examSource} onChange={setExamSource} disabled={isLoading} />
      </div>

      {examSource === 'curriculum' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Curriculum Year</label>
            <select value={selectedCurriculum || ''} onChange={e => onCurriculumChange(e.target.value as CurriculumLevel)} disabled={isLoading} className={selectClasses} style={{ backgroundColor: 'var(--color-input-bg)'}}>
                <option value="" disabled>-- Select a Year --</option>
                {CURRICULUM_LEVEL_OPTIONS_FOR_VIEW.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {selectedCurriculum && (
            <div>
              <label className="block text-sm font-medium mb-1">Select Section(s)</label>
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
          <input id="exam-topic" type="text" value={examTopic} onChange={e => setExamTopic(e.target.value)} placeholder="e.g., Present Simple Tense" className={inputClasses} style={{ backgroundColor: 'var(--color-input-bg)'}} disabled={isLoading} />
        </div>
      )}

      {examSource === 'custom' && (
        <div>
          <label htmlFor="exam-custom-prompt" className="block text-sm font-medium mb-1">Custom Prompt</label>
          <textarea id="exam-custom-prompt" value={examCustomPrompt} onChange={e => setExamCustomPrompt(e.target.value)} rows={5} placeholder="e.g., Create an exam about Algerian national heroes for Year 4 students..." className={`${inputClasses} resize-y`} style={{ backgroundColor: 'var(--color-input-bg)'}} disabled={isLoading} />
        </div>
      )}

      <div className="pt-4 border-t border-[var(--color-border)]">
        <h3 className="text-lg font-semibold mb-2">Exam Details</h3>
        <div className="space-y-4">
            <div>
                <label htmlFor="exam-title" className="block text-sm font-medium mb-1">Exam Title</label>
                <input id="exam-title" type="text" value={examTitle} onChange={e => setExamTitle(e.target.value)} placeholder="AI will suggest one if left blank" className={inputClasses} style={{ backgroundColor: 'var(--color-input-bg)'}} disabled={isLoading}/>
            </div>
            <div>
                <label htmlFor="exam-instructions" className="block text-sm font-medium mb-1">Instructions</label>
                <textarea id="exam-instructions" value={examInstructions} onChange={e => setExamInstructions(e.target.value)} rows={3} placeholder="AI will suggest instructions if left blank" className={`${inputClasses} resize-y`} style={{ backgroundColor: 'var(--color-input-bg)'}} disabled={isLoading}/>
            </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--color-border)]">
        <h3 className="text-lg font-semibold mb-2">Structure & Sections</h3>
        <div className="space-y-3">
          {examSections.map((section, index) => (
            <div key={section.id} className="p-3 rounded-lg bg-[var(--color-inset-bg)] space-y-2">
              <div className="flex justify-between items-center">
                <p className="font-medium text-sm">Section {index + 1}</p>
                <button onClick={() => handleRemoveSection(section.id)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-full" disabled={isLoading}>
                    <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              <input type="text" value={section.title} onChange={e => handleSectionChange(section.id, 'title', e.target.value)} className={inputClasses} style={{ backgroundColor: 'var(--color-surface)'}} disabled={isLoading}/>
              <div className="flex gap-2">
                  <select value={section.questionType} onChange={e => handleSectionChange(section.id, 'questionType', e.target.value)} className={`${selectClasses} flex-grow`} style={{ backgroundColor: 'var(--color-surface)'}} disabled={isLoading}>
                      <option>Multiple Choice</option>
                      <option>Short Answer</option>
                      <option>Essay</option>
                  </select>
                  <input type="number" value={section.numberOfQuestions} onChange={e => handleSectionChange(section.id, 'numberOfQuestions', parseInt(e.target.value) || 1)} min="1" className={`${inputClasses} w-20`} style={{ backgroundColor: 'var(--color-surface)'}} disabled={isLoading}/>
              </div>
            </div>
          ))}
          <button onClick={handleAddSection} className="w-full blueprint-button-secondary text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2" disabled={isLoading}>
            <PlusIcon className="w-4 h-4" /> Add Section
          </button>
        </div>
      </div>
      
       <div className="pt-4 border-t border-[var(--color-border)]">
          <h3 className="text-lg font-semibold mb-2">Difficulty</h3>
          <SegmentedButton options={difficultyOptions} selectedValue={examDifficulty} onChange={setExamDifficulty} disabled={isLoading} />
       </div>

      <div className="pt-4 border-t border-[var(--color-border)]">
        <button onClick={onGenerateExam} disabled={isGenerateDisabled} className="w-full flex justify-center items-center py-3 px-4 font-medium rounded-lg transition-colors border border-transparent disabled:opacity-50 disabled:cursor-not-allowed interactive-glow" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
          {isLoading ? 'Generating...' : <><SparklesIcon className="w-5 h-5 mr-2" />Generate Exam</>}
        </button>
      </div>
    </div>
  );
};

export default ExamGeneratorControls;
