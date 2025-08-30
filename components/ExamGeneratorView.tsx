
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
  examSections: { id: number; title: string; questionType: QuestionType; numberOfQuestions: number; points: number }[];
  setExamSections: (sections: { id: number; title: string; questionType: QuestionType; numberOfQuestions: number; points: number }[]) => void;
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

  // New Passage Props
  examIncludeReadingPassage: boolean;
  setExamIncludeReadingPassage: (include: boolean) => void;
  examReadingPassageTopic: string;
  setExamReadingPassageTopic: (topic: string) => void;
}

const ExamGeneratorView: React.FC<ExamGeneratorViewProps> = (props) => {
  const { isLoading, error, generatedExam } = props;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="md:w-2/5">
        <div className="md:sticky md:top-8 self-start md:max-h-[calc(100vh-4rem)] md:overflow-y-auto custom-scrollbar-container md:pr-2">
          <ExamGeneratorControls {...props} />
        </div>
      </div>
      <div className="md:w-3/5">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <LoadingSpinner text="Generating your exam..." />
          </div>
        ) : error ? (
            error === 'QUOTA_EXCEEDED_EXAM_GENERATOR' ? (
                <div className="material-card text-center p-8 h-full flex flex-col justify-center items-center">
                    <p className="mt-4 text-lg font-medium text-[var(--color-on-surface)]">
                        Exam Generator under maintenance, be back soon.
                    </p>
                </div>
            ) : (
                <div className="mb-6"><ErrorMessage message={error} /></div>
            )
        ) : (
          <ExamDisplay exam={generatedExam} onSave={props.onSaveExam} />
        )}
      </div>
    </div>
  );
};

export default ExamGeneratorView;
