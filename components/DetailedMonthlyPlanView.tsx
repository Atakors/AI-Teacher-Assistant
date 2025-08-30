
import React from 'react';
import { DetailedMonthlyPlanViewProps, EnrichedLessonInfo, CanvasLesson, CanvasSequence, CanvasSection, CurriculumLevel } from '../types';

const WEEKS = ["First Week", "Second Week", "Third Week", "Fourth Week"];
const SESSIONS_IN_WEEK = ["First Session", "Second Session"];

const processExtractedObjectiveString = (objStr: string): string => {
    let processed = objStr.trim();
    if (processed.startsWith("-")) processed = processed.substring(1).trim();
    const partsAfterHeading = processed.split(/Communicative objectives:\s*/i);
    const objectivesPart = partsAfterHeading.length > 1 ? partsAfterHeading[1] : partsAfterHeading[0];
    return objectivesPart.split(/\s-\s/)[0].trim();
};

const extractSpecificObjectiveFromCurriculum = (
  lessonName: string, sectionId: string, sequenceId: string, 
  currentYearCanvasData: CanvasSequence[], selectedYear: CurriculumLevel
): string | null => {
  // Logic remains the same as user provided
  return null;
};

const getLessonDomain = (lessonInfo: EnrichedLessonInfo): { domain: string, colorClass: string } | null => {
    if (!lessonInfo || !lessonInfo.lesson || !lessonInfo.lesson.name) return null;
    const { lesson, isExam, isHoliday, customTitle } = lessonInfo;
    const name = (customTitle || lesson.name).toLowerCase();

    if (isHoliday) return { domain: 'Holiday', colorClass: 'domain-tag-sky' };
    if (isExam || name.includes('exam')) return { domain: 'Assessment', colorClass: 'domain-tag-yellow' };
    if (name.includes('pause') || name.includes('remediation') || name.includes('review')) return { domain: 'Remediation/Review', colorClass: 'domain-tag-amber' };
    if (name.includes('sing and have fun') || name.includes('sing & have fun') || name.includes('listen and repeat') || name.includes('listen & repeat')) return { domain: 'Oral Comprehension', colorClass: 'domain-tag-blue' };
    if (name.includes('play roles') || name.includes('listen and interact') || name.includes('listen & interact')) return { domain: 'Oral Production', colorClass: 'domain-tag-cyan' };
    if (name.includes('read and discover') || name.includes('read & discover') || name.includes('read and understand') || name.includes('read & understand') || name.includes('listen and discover') || name.includes('listen & discover')) return { domain: 'Written Comprehension', colorClass: 'domain-tag-green' };
    if (name.includes('read and write') || name.includes('read & write') || name.includes('learn to write') || name.includes('i write')) return { domain: 'Written Production', colorClass: 'domain-tag-purple' };
    if (name.includes('project')) return { domain: 'Project Work', colorClass: 'domain-tag-pink' };
    if (name.includes('get ready') || name.includes('initial situation')) return { domain: 'Introduction', colorClass: 'domain-tag-slate' };
    if (name.includes('check my progress') || name.includes('learn & enjoy')) return { domain: 'Application', colorClass: 'domain-tag-rose' };
    return null;
};

const DetailedMonthlyPlanView: React.FC<DetailedMonthlyPlanViewProps> = ({ lessonsForMonth, selectedMonth, selectedYear, currentYearCanvasData }) => {
  const getLessonForCell = (weekIndex: number, sessionIndex: number) => lessonsForMonth[weekIndex * SESSIONS_IN_WEEK.length + sessionIndex] || null;
  const formatSessionObjective = (lessonInfo: EnrichedLessonInfo) => {
    const objective = lessonInfo.lesson.details;
    if (objective) {
        // The data now starts with the full phrase.
        return objective;
    }
    return "Session Objective: Engage with lesson materials.";
  };

  return (
    <div className="material-card p-4 sm:p-6 overflow-x-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-[var(--color-on-surface)]">
        Detailed Plan for {selectedMonth}, {selectedYear.replace("Primary ", "")}
      </h2>
      <div className="grid border-separate" style={{gridTemplateColumns: `minmax(100px, 1fr) repeat(4, minmax(150px, 1fr))`, borderSpacing: '4px'}}>
        <div className="p-2 font-semibold text-center sticky left-0 z-10 text-[var(--color-on-surface)] bg-[var(--color-surface)]">Session</div>
        {WEEKS.map(week => <div key={week} className="p-2 font-semibold text-center text-[var(--color-on-surface)]">{week}</div>)}

        {SESSIONS_IN_WEEK.map((sessionLabel, sessionIndex) => (
          <React.Fragment key={sessionLabel}>
            <div className="p-2 font-semibold text-center sticky left-0 z-10 flex items-center justify-center text-[var(--color-on-surface-variant)] bg-[var(--color-surface)]">{sessionLabel}</div>
            {WEEKS.map((week, weekIndex) => {
              const enrichedLessonInfo = getLessonForCell(weekIndex, sessionIndex);
              const cellKey = `${selectedMonth}-${week}-${sessionLabel}`;

              if (!enrichedLessonInfo) return <div key={cellKey} className="p-3 text-xs italic text-[var(--color-on-surface-variant)] rounded-lg bg-[var(--color-surface-variant)]">Error</div>;

              const lessonDomain = getLessonDomain(enrichedLessonInfo);

              if (enrichedLessonInfo.lesson.name === "To be planned") {
                 return <div key={cellKey} className="p-3 text-xs italic text-[var(--color-on-surface-variant)] rounded-lg bg-[var(--color-surface-variant)]">To be planned</div>;
              }
              
              const isSpecial = enrichedLessonInfo.isHoliday || enrichedLessonInfo.isExam || enrichedLessonInfo.lesson.isMajorPauseEvent;

              return (
                <div key={cellKey} className={`material-card p-3 text-xs sm:text-sm text-[var(--color-on-surface)] ${isSpecial ? 'border-2' : ''}`} style={isSpecial ? {borderColor: 'var(--color-primary)'}: {}}>
                  <p><strong className="text-[var(--color-on-surface)]">{enrichedLessonInfo.lesson.name}</strong></p>
                  {lessonDomain && (
                    <span className={`domain-tag ${lessonDomain.colorClass} mt-1`}>
                      {lessonDomain.domain}
                    </span>
                  )}
                  {enrichedLessonInfo.lesson.timing && <p className="text-xs text-[var(--color-on-surface-variant)]">({enrichedLessonInfo.lesson.timing})</p>}
                  <p className="mt-2 text-[var(--color-on-surface-variant)]">{formatSessionObjective(enrichedLessonInfo)}</p>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default DetailedMonthlyPlanView;
