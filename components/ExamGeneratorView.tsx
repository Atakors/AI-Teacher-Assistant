


import React from 'react';
import { CurriculumLevel, CanvasSequence, Exam, ExamDifficulty, ExamSource, QuestionType, User } from '../types';
import ExamGeneratorControls from './ExamGeneratorControls';
import ExamDisplay from './ExamDisplay';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface ExamGeneratorViewProps {
  currentUser: User;
  isLoading: boolean;
  error: string | null;
  generatedExam: Exam | null;
  onGenerateExam: () => void;
  onSaveExam: () => void;

  // Control props
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
  
  // Curriculum props
  selectedCurriculum: CurriculumLevel | null;
  onCurriculumChange: (value: CurriculumLevel) => void;
  sequences: CanvasSequence[];
  selectedExamSectionIds: string[];
  onSelectedExamSectionIdsChange: (ids: string[]) => void;
}

const ExamGeneratorView: React.FC<ExamGeneratorViewProps> = (props) => {
  const { isLoading, error, generatedExam } = props;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:w-2/5">
        <div className="lg:sticky lg:top-8 self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto custom-scrollbar-container lg:pr-2">
          <ExamGeneratorControls {...props} />
        </div>
      </div>
      <div className="lg:w-3/5">
        {error && !isLoading && <div className="mb-6"><ErrorMessage message={error} /></div>}
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <LoadingSpinner text="Generating your exam..." />
          </div>
        ) : (
          <ExamDisplay exam={generatedExam} onSave={props.onSaveExam} />
        )}
      </div>
    </div>
  );
};

export default ExamGeneratorView;