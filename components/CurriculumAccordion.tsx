
import React, { useState, useEffect } from 'react';
import { CanvasSequence, CanvasLesson } from '../types';
import { ChevronDownIcon, BookOpenIcon } from '../constants';

interface CurriculumAccordionProps {
  sequences: CanvasSequence[];
  selectedSequenceId: string | null;
  selectedSectionId: string | null;
  selectedLesson: CanvasLesson | null;
  onSequenceChange: (sequenceId: string | null) => void;
  onSectionChange: (sectionId: string | null) => void;
  onLessonChange: (lesson: CanvasLesson | null) => void;
  disabled?: boolean;
}

const CurriculumAccordion: React.FC<CurriculumAccordionProps> = ({
  sequences, selectedSequenceId, selectedSectionId,
  selectedLesson, onSequenceChange, onSectionChange, onLessonChange, disabled = false,
}) => {
  const [expandedSequenceId, setExpandedSequenceId] = useState<string | null>(selectedSequenceId);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(selectedSectionId);

  useEffect(() => {
    setExpandedSequenceId(selectedSequenceId);
    setExpandedSectionId(selectedSectionId);
  }, [selectedSequenceId, selectedSectionId]);

  const handleSequenceClick = (sequenceId: string) => {
    if (disabled) return;
    const isCurrentlySelected = selectedSequenceId === sequenceId;
    onSequenceChange(isCurrentlySelected ? null : sequenceId);
  };

  const handleSectionClick = (sectionId: string) => {
    if (disabled) return;
    const isCurrentlySelected = selectedSectionId === sectionId;
    onSectionChange(isCurrentlySelected ? null : sectionId);
  };

  const handleLessonClick = (lesson: CanvasLesson) => {
    if (disabled) return;
    onLessonChange(lesson);
  };

  if (!sequences.length) {
    return <p className="text-sm text-[var(--color-text-secondary)]">No curriculum data.</p>;
  }
  
  const getButtonStyle = (isSelected: boolean) => ({
    backgroundColor: isSelected ? 'var(--color-accent)' : 'transparent',
    color: isSelected ? 'white' : 'var(--color-text-primary)',
  });

  return (
    <div className="space-y-1 p-2 rounded-lg" style={{backgroundColor: 'var(--color-inset-bg)'}}>
      {sequences.map(seq => {
        const isSeqSelected = selectedSequenceId === seq.id;
        const isSeqExpanded = expandedSequenceId === seq.id;
        return (
          <div key={seq.id}>
            <button onClick={() => handleSequenceClick(seq.id)} disabled={disabled}
              className={`w-full flex justify-between items-center p-2 text-left text-sm rounded-md transition-colors hover:bg-[var(--color-surface)]`}
               style={getButtonStyle(isSeqSelected)}
               >
              <span className="font-medium flex-1 pr-2">{seq.title}</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isSeqExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isSeqExpanded && (
              <div className="pl-2 pt-1 space-y-1">
                {seq.sections.map(sec => {
                  const isSecSelected = selectedSectionId === sec.id;
                  const isSecExpanded = expandedSectionId === sec.id;
                  return (
                    <div key={sec.id}>
                      <button onClick={() => handleSectionClick(sec.id)} disabled={disabled}
                        className={`w-full flex justify-between items-center p-2 text-left text-sm rounded-md transition-colors hover:bg-[var(--color-surface)]`}
                        style={getButtonStyle(isSecSelected)}>
                        <span className="font-normal flex-1 pr-2">{sec.name}</span>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isSecExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {isSecExpanded && (
                        <div className="pl-2 pt-1 space-y-1">
                          {sec.lessons.filter(lesson => !lesson.name.includes("Initial Situation")).map((lesson, index) => {
                             const isLessonSelected = selectedLesson?.name === lesson.name && selectedLesson?.timing === lesson.timing;
                             return (
                                <button key={`${lesson.name}-${index}`} onClick={() => handleLessonClick(lesson)} disabled={disabled}
                                  className={`w-full flex items-start text-left p-2 text-xs rounded-md transition-colors hover:bg-[var(--color-surface)]`}
                                  style={getButtonStyle(isLessonSelected)}>
                                  <BookOpenIcon className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" style={isLessonSelected ? { color: 'white' } : { color: 'var(--color-accent)' }}/>
                                  <span className="flex-1">{lesson.name}
                                    {lesson.timing && <span className="opacity-70 ml-1">({lesson.timing})</span>}
                                  </span>
                                </button>
                             )
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CurriculumAccordion;
