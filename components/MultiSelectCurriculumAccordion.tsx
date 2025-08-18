
import React, { useState } from 'react';
import { CanvasSequence } from '../types';
import { ChevronDownIcon } from './constants';

interface MultiSelectCurriculumAccordionProps {
  sequences: CanvasSequence[];
  selectedSectionIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  disabled?: boolean;
}

const MultiSelectCurriculumAccordion: React.FC<MultiSelectCurriculumAccordionProps> = ({
  sequences, selectedSectionIds, onSelectionChange, disabled = false,
}) => {
  const [expandedSequenceIds, setExpandedSequenceIds] = useState<string[]>([]);

  const handleSequenceToggle = (sequenceId: string) => {
    setExpandedSequenceIds(prev =>
      prev.includes(sequenceId) ? prev.filter(id => id !== sequenceId) : [...prev, sequenceId]
    );
  };

  const handleSequenceCheckboxChange = (sequence: CanvasSequence) => {
    const sectionIdsInSequence = sequence.sections.map(sec => sec.id);
    const allSelected = sectionIdsInSequence.every(id => selectedSectionIds.includes(id));
    
    let newSelectedIds: string[];
    if (allSelected) {
      newSelectedIds = selectedSectionIds.filter(id => !sectionIdsInSequence.includes(id));
    } else {
      newSelectedIds = [...new Set([...selectedSectionIds, ...sectionIdsInSequence])];
    }
    onSelectionChange(newSelectedIds);
  };

  const handleSectionCheckboxChange = (sectionId: string) => {
    const isSelected = selectedSectionIds.includes(sectionId);
    const newSelectedIds = isSelected
      ? selectedSectionIds.filter(id => id !== sectionId)
      : [...selectedSectionIds, sectionId];
    onSelectionChange(newSelectedIds);
  };

  const getSequenceCheckboxState = (sequence: CanvasSequence): 'checked' | 'indeterminate' | 'unchecked' => {
    const sectionIdsInSequence = sequence.sections.map(sec => sec.id);
    if (sectionIdsInSequence.length === 0) return 'unchecked';
    const selectedCount = sectionIdsInSequence.filter(id => selectedSectionIds.includes(id)).length;

    if (selectedCount === 0) return 'unchecked';
    if (selectedCount === sectionIdsInSequence.length) return 'checked';
    return 'indeterminate';
  };

  if (!sequences.length) {
    return <p className="text-sm text-[var(--color-text-secondary)]">No curriculum data. Select a year.</p>;
  }

  return (
    <div className="space-y-1 p-2 rounded-lg" style={{backgroundColor: 'var(--color-inset-bg)'}}>
      {sequences.map(seq => {
        const checkboxState = getSequenceCheckboxState(seq);
        const isSeqExpanded = expandedSequenceIds.includes(seq.id);

        return (
          <div key={seq.id}>
            <div className="flex items-center p-2 rounded-md hover:bg-[var(--color-surface)]">
              <input
                type="checkbox"
                checked={checkboxState === 'checked'}
                ref={el => { if (el) el.indeterminate = checkboxState === 'indeterminate'; }}
                onChange={() => handleSequenceCheckboxChange(seq)}
                disabled={disabled}
                className="h-4 w-4 shrink-0 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                aria-label={`Select all sections in ${seq.title}`}
              />
              <button onClick={() => handleSequenceToggle(seq.id)} disabled={disabled}
                className="w-full flex justify-between items-center text-left text-sm ml-2"
                aria-expanded={isSeqExpanded}
              >
                <span className="font-medium flex-1 pr-2">{seq.title}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isSeqExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {isSeqExpanded && (
              <div className="pl-6 pt-1 space-y-1">
                {seq.sections.map(sec => (
                  <label key={sec.id} className="flex items-center p-2 rounded-md hover:bg-[var(--color-surface)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSectionIds.includes(sec.id)}
                      onChange={() => handleSectionCheckboxChange(sec.id)}
                      disabled={disabled}
                      className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                    />
                    <span className="ml-3 text-sm font-normal">{sec.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MultiSelectCurriculumAccordion;
