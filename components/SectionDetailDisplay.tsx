
import React, { useState } from 'react';
import { CanvasSection, CanvasLesson, CurriculumLevel } from '../types'; 
import { ListBulletIcon, ChevronDownIcon, ChevronUpIcon, BookOpenIcon } from './constants'; 

interface SectionDetailDisplayProps {
  section: CanvasSection;
  selectedLesson: CanvasLesson;
  selectedYear: CurriculumLevel | null;
}

const DomainContent: React.FC<{ lines: string[] }> = ({ lines }) => {
    const isSubHeading = (line: string) => {
        const trimmedLine = line.trim();
        return [
            'Communicative objectives:', 'Resources:', 'Key vocabulary:', 'Grammar:', 
            'Suggested communicative situation:', 'Cross curricular resources:', 'Values:', 
            'Phonics (Sound and Spelling):', 'Handwriting:', 'Oral:', 'Written comprehension:', 'Written production:',
            'Intellectual:', 'Methodological:', 'Communicative:', 'Personal and Social:'
        ].some(h => trimmedLine.toLowerCase().startsWith(h.toLowerCase()) && trimmedLine.endsWith(':'));
    };

    return (
        <div className="space-y-1 text-[var(--color-on-surface-variant)] text-xs sm:text-sm">
        {lines.map((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return null;

            if (isSubHeading(trimmedLine)) {
                return <h5 key={index} className="font-medium text-[var(--color-on-surface)] mt-2 mb-0.5 ml-2 text-sm">{trimmedLine}</h5>;
            }
            if (trimmedLine.startsWith('- ')) {
                return <p key={index} className="flex items-start ml-4 text-xs sm:text-sm leading-relaxed"><span className="mr-2 mt-1">•</span><span>{trimmedLine.substring(2)}</span></p>;
            }
            return <p key={index} className="ml-2 text-xs sm:text-sm leading-relaxed">{trimmedLine}</p>;
        })}
        </div>
    );
};

const getCanonicalDomain = (lessonName: string, year: CurriculumLevel | null): string => {
    const name = lessonName.toLowerCase().replace(/&/g, "and");

    // Specific logic for all supported years to differentiate oral domains
    if (year === CurriculumLevel.PRIMARY_3 || year === CurriculumLevel.PRIMARY_4 || year === CurriculumLevel.PRIMARY_5) {
        if (name.includes('sing and have fun') || name.includes('listen and repeat') || name.includes('listen and discover')) return 'Oral comprehension';
        if (name.includes('play roles') || name.includes('listen and interact')) return 'Oral production';
        if (name.includes('read and discover') || name.includes('read and understand') || name.includes('read and enjoy')) return 'Written Comprehension';
        if (name.includes('read and write') || name.includes('learn to write') || name.includes('i write')) return 'Written Production';
    }

    // Fallback logic from original function
    if (name.includes('sing and have fun') || name.includes('listen and repeat') || name.includes('play roles') || name.includes('listen and interact') || name.includes('♫i sing and have fun')) return 'Oral';
    if (name.includes('read and discover') || name.includes('read and understand') || name.includes('listen and discover') || name.includes('read and enjoy')) return 'Written Comprehension';
    if (name.includes('read and write') || name.includes('learn to write') || name.includes('i write')) return 'Written Production';
    return 'Other';
};


const RelevantLessonsList: React.FC<{ lessons: CanvasLesson[], title: string }> = ({ lessons, title }) => {
    if (lessons.length === 0) return null;
    return (
        <div className="mt-4 pt-3 border-t border-[var(--color-outline)]">
            <h5 className="font-semibold text-[var(--color-on-surface)] text-sm mb-2">{title}</h5>
            <ul className="space-y-1">
                {lessons.map((lesson, idx) => (
                    <li key={idx} className="flex items-start text-xs text-[var(--color-on-surface-variant)]">
                        <BookOpenIcon className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" style={{color: 'var(--color-primary)'}} />
                        <span>{lesson.name} {lesson.timing && `(${lesson.timing})`}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const SectionDetailDisplay: React.FC<SectionDetailDisplayProps> = ({ section, selectedLesson, selectedYear }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpand = () => setIsExpanded(!isExpanded);
  const selectedLessonDomain = getCanonicalDomain(selectedLesson.name, selectedYear);
  const sectionContentId = `section-content-${section.id}`;
  
  const lessonsByDomain: Record<string, CanvasLesson[]> = {
    'Oral comprehension': section.lessons.filter(l => getCanonicalDomain(l.name, selectedYear) === 'Oral comprehension' && !l.name.toLowerCase().includes('initial situation')),
    'Oral production': section.lessons.filter(l => getCanonicalDomain(l.name, selectedYear) === 'Oral production' && !l.name.toLowerCase().includes('initial situation')),
    'Oral': section.lessons.filter(l => getCanonicalDomain(l.name, selectedYear) === 'Oral' && !l.name.toLowerCase().includes('initial situation')),
    'Written Comprehension': section.lessons.filter(l => getCanonicalDomain(l.name, selectedYear) === 'Written Comprehension' && !l.name.toLowerCase().includes('initial situation')),
    'Written Production': section.lessons.filter(l => getCanonicalDomain(l.name, selectedYear) === 'Written Production' && !l.name.toLowerCase().includes('initial situation')),
  };

  const renderDomainContent = () => {
    const content = section.detailedContent;
    if (!content) {
        return <p className="text-sm italic mb-6">No detailed domain content available.</p>;
    }
    
    // --- Logic for Year 4 and 5 ---
    if (selectedYear === CurriculumLevel.PRIMARY_4 || selectedYear === CurriculumLevel.PRIMARY_5) {
        const headings = [ // The order is important for parsing logic
            'oral:',
            'written comprehension:',
            'written production:',
            'resources:',
            'phonics (sound and spelling):',
            'handwriting:',
            'cross curricular resources:',
            'values:'
        ];
        
        const lowerSelectedDomain = selectedLessonDomain.toLowerCase();
        let targetHeading = '';
        if (lowerSelectedDomain.includes('oral')) targetHeading = 'oral:';
        else if (lowerSelectedDomain.includes('written comprehension')) targetHeading = 'written comprehension:';
        else if (lowerSelectedDomain.includes('written production')) targetHeading = 'written production:';
        
        if (targetHeading) {
            const lowerContent = content.toLowerCase();
            const startIndex = lowerContent.indexOf(targetHeading);
            
            if (startIndex !== -1) {
                let endIndex = content.length;
                const targetHeadingIndexInList = headings.indexOf(targetHeading);
                
                for (let i = targetHeadingIndexInList + 1; i < headings.length; i++) {
                    const nextHeading = headings[i];
                    const nextHeadingPos = lowerContent.indexOf(nextHeading, startIndex + targetHeading.length);
                    if (nextHeadingPos !== -1) {
                        endIndex = nextHeadingPos;
                        break;
                    }
                }
                
                const domainSpecificContent = content.substring(startIndex, endIndex).trim();
                const lines = domainSpecificContent.split('\n');
                const title = lines.shift() || 'Details';
                
                const oralLessons = [...new Set([...lessonsByDomain['Oral comprehension'], ...lessonsByDomain['Oral production']])];
                const relevantLessons = lowerSelectedDomain.includes('oral') ? oralLessons : (lessonsByDomain[selectedLessonDomain] || []);
                const relevantLessonsTitle = lowerSelectedDomain.includes('oral') ? "Oral Sessions:" : `${selectedLessonDomain} Sessions:`;

                return (
                    <div className="p-4 rounded-lg mb-6 bg-[var(--color-surface-variant)]">
                        <h4 className="font-bold text-base text-[var(--color-on-surface)] mb-2">{title}</h4>
                        <DomainContent lines={lines} />
                        <RelevantLessonsList lessons={relevantLessons} title={relevantLessonsTitle} />
                    </div>
                );
            }
        }
    }
    
    // --- Logic for Year 3 ---
    if (selectedYear === CurriculumLevel.PRIMARY_3) {
        const allDomainBlocks = content.split(/\n(?=Domain: )/).map(b => b.trim()).filter(Boolean);
        if (allDomainBlocks.length > 0) {
            const blockToRender = allDomainBlocks.find(block =>
                block.split('\n')[0].toLowerCase().includes(selectedLessonDomain.toLowerCase())
            );
            
            if (blockToRender) {
                const lines = blockToRender.split('\n');
                const title = lines.shift() || 'Domain';
                const lessons = lessonsByDomain[selectedLessonDomain] || [];
                
                return (
                    <div className="p-4 rounded-lg mb-6 bg-[var(--color-surface-variant)]">
                        <h4 className="font-bold text-base text-[var(--color-on-surface)] mb-2">{title.replace(/Domain: /i, '')}</h4>
                        <DomainContent lines={lines} />
                        <RelevantLessonsList lessons={lessons} title="Relevant Sessions:" />
                    </div>
                );
            }
        }
    }
    
    // Generic fallback if no specific logic matches.
    const relevantLessonsForCurrentDomain = lessonsByDomain[selectedLessonDomain] || [];
    return (
        <div className="p-4 rounded-lg mb-6 bg-[var(--color-surface-variant)]">
            <DomainContent lines={content.split('\n')} />
            {relevantLessonsForCurrentDomain.length > 0 && 
              <RelevantLessonsList lessons={relevantLessonsForCurrentDomain} title={`${selectedLessonDomain} Sessions:`} />
            }
        </div>
    );
  };

  return (
    <div className="material-card p-6 sm:p-8 mt-6">
      <button
        onClick={toggleExpand}
        aria-expanded={isExpanded}
        aria-controls={sectionContentId}
        className="w-full flex justify-between items-center text-xl font-semibold mb-3 border-b border-[var(--color-outline)] pb-2 p-1"
        style={{ color: 'var(--color-primary)' }}
      >
        <span>
          Details for: <span className="font-bold">{selectedLesson.name}</span>
        </span>
        {isExpanded ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
      </button>
      
      {isExpanded && (
        <div id={sectionContentId} className="transition-all duration-300 ease-in-out">
          {renderDomainContent()}
          {selectedLesson.bookActivities?.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mt-4 mb-2 border-t border-[var(--color-outline)] pt-3" style={{color: 'var(--color-primary)'}}>
                Textbook Activities: <span className="italic font-normal">{selectedLesson.name}{selectedLesson.timing && ` (${selectedLesson.timing})`}</span>
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                {selectedLesson.bookActivities.map((activity, idx) => (
                  <li key={`activity-${idx}`} className="flex items-start text-[var(--color-on-surface)] p-3 rounded-lg bg-[var(--color-surface-variant)]">
                    <ListBulletIcon className="w-4 h-4 mr-3 mt-1 flex-shrink-0" style={{color: 'var(--color-primary)'}} />
                    <span>
                      <span className="font-semibold">P{activity.page}</span>
                      {activity.activityNumber && <span className="font-semibold"> (Act. {activity.activityNumber})</span>}: 
                      {' '}{activity.description}
                      {activity.taskType && <span className="text-xs text-[var(--color-on-surface-variant)] ml-2">[{activity.taskType}]</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SectionDetailDisplay;
