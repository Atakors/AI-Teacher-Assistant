import React, { useState } from 'react';
import { CanvasSection, CanvasLesson, CurriculumLevel } from '../types'; 
import { ListBulletIcon, ChevronDownIcon, ChevronUpIcon, BookOpenIcon } from '../constants'; 

interface SectionDetailDisplayProps {
  section: CanvasSection | null;
  selectedLesson: CanvasLesson | null;
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
        <div className="space-y-1 text-[var(--color-text-secondary)] text-xs sm:text-sm">
        {lines.map((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return null;

            if (isSubHeading(trimmedLine)) {
                return <h5 key={index} className="font-medium text-[var(--color-text-primary)] mt-2 mb-0.5 ml-2 text-sm">{trimmedLine}</h5>;
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
    if (year === CurriculumLevel.PRIMARY_3) {
        if (name.includes('sing and have fun') || name.includes('listen and repeat')) return 'Oral comprehension';
        if (name.includes('play roles') || name.includes('listen and interact')) return 'Oral production';
        if (name.includes('read and discover')) return 'Written Comprehension';
        if (name.includes('read and write')) return 'Written Production';
    }
    if (name.includes('sing and have fun') || name.includes('listen and repeat') || name.includes('play roles') || name.includes('listen and interact') || name.includes('♫i sing and have fun')) return 'Oral';
    if (name.includes('read and discover') || name.includes('read and understand') || name.includes('listen and discover') || name.includes('read and enjoy')) return 'Written Comprehension';
    if (name.includes('read and write') || name.includes('learn to write') || name.includes('i write')) return 'Written Production';
    return 'Other';
};

const mapDomainTitleToCanonical = (title: string): string[] => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.startsWith("domain: oral comprehension") && !lowerTitle.includes('&')) return ['Oral comprehension'];
    if (lowerTitle.startsWith("domain: oral production")) return ['Oral production'];
    if (lowerTitle.startsWith("domain: oral comprehension & oral production")) return ['Oral', 'Oral comprehension', 'Oral production'];
    if (lowerTitle.startsWith("domain: written comprehension")) return ['Written Comprehension'];
    if (lowerTitle.startsWith("domain: written production")) return ['Written Production'];
    return [];
};


const RelevantLessonsList: React.FC<{ lessons: CanvasLesson[], title: string }> = ({ lessons, title }) => {
    if (lessons.length === 0) return null;
    return (
        <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
            <h5 className="font-semibold text-[var(--color-text-primary)] text-sm mb-2">{title}</h5>
            <ul className="space-y-1">
                {lessons.map((lesson, idx) => (
                    <li key={idx} className="flex items-start text-xs text-[var(--color-text-secondary)]">
                        <BookOpenIcon className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" style={{color: 'var(--color-accent)'}} />
                        <span>{lesson.name} {lesson.timing && `(${lesson.timing})`}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const SectionDetailDisplay: React.FC<SectionDetailDisplayProps> = ({ section, selectedLesson, selectedYear }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  if (!section) return null;

  const toggleExpand = () => setIsExpanded(!isExpanded);
  const selectedLessonDomain = selectedLesson ? getCanonicalDomain(selectedLesson.name, selectedYear) : null;
  const sectionContentId = `section-content-${section.id}`;
  
  const lessonsByDomain: Record<string, CanvasLesson[]> = {
    'Oral comprehension': section.lessons.filter(l => getCanonicalDomain(l.name, selectedYear) === 'Oral comprehension' && !l.name.toLowerCase().includes('initial situation')),
    'Oral production': section.lessons.filter(l => getCanonicalDomain(l.name, selectedYear) === 'Oral production' && !l.name.toLowerCase().includes('initial situation')),
    'Oral': section.lessons.filter(l => getCanonicalDomain(l.name, selectedYear) === 'Oral' && !l.name.toLowerCase().includes('initial situation')),
    'Written Comprehension': section.lessons.filter(l => getCanonicalDomain(l.name, selectedYear) === 'Written Comprehension' && !l.name.toLowerCase().includes('initial situation')),
    'Written Production': section.lessons.filter(l => getCanonicalDomain(l.name, selectedYear) === 'Written Production' && !l.name.toLowerCase().includes('initial situation')),
  };

  const renderDomainContent = () => {
    const allDomainBlocks = section.detailedContent?.split(/\n(?=Domain: )/).map(b => b.trim()).filter(b => b.startsWith("Domain: ")) || [];

    if (allDomainBlocks.length > 0) {
      const blocksToRender = selectedLessonDomain
        ? allDomainBlocks.filter(block => 
            mapDomainTitleToCanonical(block.split('\n')[0]).some(c => c.toLowerCase() === selectedLessonDomain.toLowerCase())
          )
        : allDomainBlocks;

      if (blocksToRender.length === 0 && selectedLessonDomain) return <p className="text-sm italic mb-6">No specific curriculum details found for '{selectedLessonDomain}'.</p>;
      
      return (
        <div className="space-y-4 mb-6">
          {blocksToRender.map((block, index) => {
            const lines = block.split('\n');
            const title = lines.shift() || 'Domain';
            let relevantLessons: CanvasLesson[] = [];
            if (selectedYear === CurriculumLevel.PRIMARY_3) {
                 const canonicals = mapDomainTitleToCanonical(title);
                 if(canonicals.includes('Oral comprehension')) relevantLessons = lessonsByDomain['Oral comprehension'];
                 else if (canonicals.includes('Oral production')) relevantLessons = lessonsByDomain['Oral production'];
                 else if (canonicals.includes('Written Comprehension')) relevantLessons = lessonsByDomain['Written Comprehension'];
                 else if (canonicals.includes('Written Production')) relevantLessons = lessonsByDomain['Written Production'];
            }
            return (
              <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-inset-bg)'}}>
                <h4 className="font-bold text-base text-[var(--color-text-primary)] mb-2">{title.replace('Domain: ', '')}</h4>
                <DomainContent lines={lines} />
                {selectedYear === CurriculumLevel.PRIMARY_3 && <RelevantLessonsList lessons={relevantLessons} title="Relevant Sessions:" />}
              </div>
            );
          })}
        </div>
      );
    }
    
    if (section.detailedContent) {
        return (
            <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: 'var(--color-inset-bg)'}}>
                <DomainContent lines={section.detailedContent.split('\n')} />
                <div className="mt-4 pt-3 border-t border-[var(--color-border)] space-y-4">
                    <RelevantLessonsList lessons={lessonsByDomain['Oral']} title="Oral Sessions:" />
                    <RelevantLessonsList lessons={lessonsByDomain['Written Comprehension']} title="Comprehension Sessions:" />
                    <RelevantLessonsList lessons={lessonsByDomain['Written Production']} title="Production Sessions:" />
                </div>
            </div>
        );
    }
    
    return <p className="text-sm italic mb-6">No detailed domain content available.</p>;
  };

  return (
    <div className="aurora-card p-6 sm:p-8 mt-6">
      <button
        onClick={toggleExpand}
        aria-expanded={isExpanded}
        aria-controls={sectionContentId}
        className="w-full flex justify-between items-center text-xl font-semibold mb-3 border-b border-[var(--color-border)] pb-2 p-1"
        style={{ color: 'var(--color-accent)' }}
      >
        <span>
          Details for: <span className="font-bold">{section.name}</span>
        </span>
        {isExpanded ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
      </button>
      
      {isExpanded && (
        <div id={sectionContentId} className="transition-all duration-300 ease-in-out">
          {renderDomainContent()}
          {selectedLesson?.bookActivities?.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mt-4 mb-2 border-t border-[var(--color-border)] pt-3" style={{color: 'var(--color-accent)'}}>
                Textbook Activities: <span className="italic font-normal">{selectedLesson.name}{selectedLesson.timing && ` (${selectedLesson.timing})`}</span>
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                {selectedLesson.bookActivities.map((activity, idx) => (
                  <li key={`activity-${idx}`} className="flex items-start text-[var(--color-text-primary)] p-3 rounded-lg" style={{ backgroundColor: 'var(--color-inset-bg)'}}>
                    <ListBulletIcon className="w-4 h-4 mr-3 mt-1 flex-shrink-0" style={{color: 'var(--color-accent)'}} />
                    <span>
                      <span className="font-semibold">P{activity.page}</span>
                      {activity.activityNumber && <span className="font-semibold"> (Act. {activity.activityNumber})</span>}: 
                      {' '}{activity.description}
                      {activity.taskType && <span className="text-xs text-[var(--color-text-secondary)] ml-2">[{activity.taskType}]</span>}
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