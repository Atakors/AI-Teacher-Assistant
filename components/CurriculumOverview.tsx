import React, { useState, useMemo } from 'react';
import { CurriculumLevel, CanvasSequence, CurriculumOverviewSubView, MonthlyDistribution, EnrichedLessonInfo } from '../types';
import { CURRICULUM_LEVEL_OPTIONS_FOR_VIEW, ACADEMIC_MONTHS, SparklesIcon } from './constants';
import DetailedMonthlyPlanView from './DetailedMonthlyPlanView';

interface CurriculumOverviewProps {
    curriculumDataMap: Record<CurriculumLevel, CanvasSequence[]>;
}

const YearlyPlanView: React.FC<{ sequences: CanvasSequence[] }> = ({ sequences }) => {
    if (!sequences || sequences.length === 0) {
        return <p className="text-[var(--color-on-surface-variant)] text-center py-8">Select a year to see the yearly plan.</p>;
    }
    return (
        <div className="space-y-6">
            {sequences.map((sequence) => (
                <div key={sequence.id} className="material-card p-6">
                    <h3 className={`text-xl font-semibold mb-3`} style={{ color: sequence.isPause ? '#f59e0b' : 'var(--color-primary)' }}>
                        {sequence.isPause ? sequence.pauseTitle || sequence.title : sequence.title}
                    </h3>
                    {sequence.isPause ? (
                        <>
                            {sequence.pauseDuration && <p className="text-sm mb-2" style={{color: '#f59e0b'}}><strong>Duration:</strong> {sequence.pauseDuration}</p>}
                            {sequence.objectives && <div className="mb-4">
                                <h4 className="text-md font-semibold text-[var(--color-on-surface)] mb-1">Objectives:</h4>
                                <ul className="list-disc list-inside ml-4 space-y-1 text-sm text-[var(--color-on-surface-variant)]">{sequence.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
                            </div>}
                            {sequence.pauseDetails && <div className="mb-1 text-sm text-[var(--color-on-surface-variant)]">
                                <h4 className="font-medium">Details:</h4>
                                <ul className="list-disc list-inside ml-4">{sequence.pauseDetails.map((d, i) => <li key={i}>{d}</li>)}</ul>
                            </div>}
                        </>
                    ) : (
                        <>
                            {sequence.objectives && <div className="mb-4">
                                <h4 className="text-md font-semibold text-[var(--color-on-surface)] mb-1">Objectives:</h4>
                                <ul className="list-disc list-inside ml-4 space-y-1 text-sm text-[var(--color-on-surface-variant)]">{sequence.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
                            </div>}
                            {sequence.sections && <div className={sequence.objectives ? "pt-4 border-t border-[var(--color-outline)]" : ""}>
                                <h4 className="text-md font-semibold text-[var(--color-on-surface)] mb-2">Sections:</h4>
                                <ul className="list-disc list-inside ml-4 space-y-1 text-sm text-[var(--color-on-surface-variant)]">{sequence.sections.map(s => <li key={s.id}>{s.name}</li>)}</ul>
                            </div>}
                            {!sequence.objectives && !sequence.sections && <p className="text-sm italic mt-3 text-[var(--color-on-surface-variant)]">No details.</p>}
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};

const calculateMonthlyDistributionData = (sequences: CanvasSequence[], academicMonths: string[]): MonthlyDistribution => {
    const newDistribution: MonthlyDistribution = {};
    academicMonths.forEach(month => newDistribution[month] = []);
    if (academicMonths.includes("September")) newDistribution["September"].push({id: "PRE_SEQ", title: "Review & Initial Assessments", isPause: true, sections: []});
    const allSequences = [...sequences]; 
    let monthIdx = academicMonths.indexOf("October") > -1 ? academicMonths.indexOf("October") : 0;
    while (allSequences.length > 0 && monthIdx < academicMonths.length) {
        newDistribution[academicMonths[monthIdx]].push(allSequences.shift()!);
        monthIdx++;
    }
    if (allSequences.length > 0) allSequences.forEach(s => newDistribution[academicMonths[academicMonths.length - 1]].push(s));
    return newDistribution;
};

const MonthlyDistributionView: React.FC<{ sequences: CanvasSequence[], academicMonths: string[] }> = ({ sequences, academicMonths }) => {
    const distribution = useMemo(() => calculateMonthlyDistributionData(sequences, academicMonths), [sequences, academicMonths]);
    if (!sequences || sequences.length === 0) return <p className="text-[var(--color-on-surface-variant)] text-center py-8">Select a year.</p>;
    return (
        <div className="space-y-8">
            {academicMonths.map(month => (
                <div key={month} className="material-card p-6">
                    <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>{month}</h3>
                    {distribution[month]?.length > 0 ? (
                        <ul className="space-y-3">
                            {distribution[month].map(seq => (
                                <li key={`${month}-${seq.id}`} className="p-3 rounded-lg border-l-4" style={{backgroundColor: 'var(--color-surface-variant)', borderColor: seq.isPause ? '#f59e0b' : 'var(--color-primary)'}}>
                                    <p className="font-medium text-[var(--color-on-surface)]">{seq.isPause ? seq.pauseTitle || seq.title : seq.title}</p>
                                    {!seq.isPause && <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Sections: {seq.sections.map(s => s.name).join(', ')}</p>}
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-[var(--color-on-surface-variant)]">No sequences planned.</p>}
                </div>
            ))}
        </div>
    );
};

const CurriculumOverview: React.FC<CurriculumOverviewProps> = ({ curriculumDataMap }) => {
  const [selectedYear, setSelectedYear] = useState<CurriculumLevel>(CurriculumLevel.SELECT_YEAR);
  const [activeSubView, setActiveSubView] = useState<CurriculumOverviewSubView>('yearly');
  const [selectedMonthForDetailedView, setSelectedMonthForDetailedView] = useState<string>(ACADEMIC_MONTHS[0]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value as CurriculumLevel);
    setSelectedMonthForDetailedView(ACADEMIC_MONTHS.find(m => m !== "September") || ACADEMIC_MONTHS[0]); 
  };
  const currentYearData = useMemo(() => curriculumDataMap[selectedYear] || [], [selectedYear, curriculumDataMap]);

  const lessonsForDetailedMonthlyView = useMemo((): EnrichedLessonInfo[] => {
    if (activeSubView !== 'detailedMonthly' || !currentYearData.length) return [];

    let allLessons: EnrichedLessonInfo[] = [];
    currentYearData.forEach(seq => {
        seq.sections.forEach(sec => {
            sec.lessons.forEach(lesson => {
                allLessons.push({
                    lesson,
                    sectionName: sec.name,
                    sectionId: sec.id,
                    sequenceTitle: seq.title,
                    sequenceId: seq.id,
                });
            });
        });
    });

    const monthDistribution = calculateMonthlyDistributionData(currentYearData, ACADEMIC_MONTHS);
    const sequencesForMonth = monthDistribution[selectedMonthForDetailedView] || [];
    
    let lessons: EnrichedLessonInfo[] = [];
    sequencesForMonth.forEach(seq => {
      if(seq.isPause) {
        lessons.push({lesson: {name: seq.pauseTitle || "Pause Event", isMajorPauseEvent: true}, sectionName: "", sectionId: "", sequenceId: seq.id, sequenceTitle: seq.title});
        lessons.push({lesson: {name: "To be planned"}, sectionName: "", sectionId: "", sequenceId: seq.id, sequenceTitle: seq.title});
      } else {
        seq.sections.forEach(sec => {
            sec.lessons.forEach(l => {
                lessons.push({ lesson: l, sectionName: sec.name, sectionId: sec.id, sequenceTitle: seq.title, sequenceId: seq.id });
            });
        });
      }
    });

    return lessons;
  }, [activeSubView, selectedYear, selectedMonthForDetailedView, currentYearData]);

  const SubViewButton: React.FC<{ view: CurriculumOverviewSubView, label: string }> = ({ view, label }) => (
    <button
      onClick={() => setActiveSubView(view)}
      className={`px-4 py-2 text-sm transition-colors rounded-full ${activeSubView === view ? 'material-button material-button-primary' : 'material-button material-button-secondary'}`}
      aria-pressed={activeSubView === view}
    >{label}</button>
  );
  
  const selectClasses = "mt-1 block w-full sm:w-auto max-w-xs p-2 text-base";

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-on-bg)]">
          Curriculum Overview
          <SparklesIcon className="w-7 h-7 ml-2" style={{color: 'var(--color-primary)'}} />
        </h2>
        <p className="text-[var(--color-on-surface-variant)] mt-2 px-4">Explore yearly, monthly, and detailed weekly plans.</p>
      </div>

      <div className="material-card p-6 sm:p-8 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <label htmlFor="year-select-overview" className="block text-lg font-medium mb-2 text-[var(--color-on-surface)]">Academic Year:</label>
            <select
              id="year-select-overview" value={selectedYear} onChange={handleYearChange}
              className={selectClasses}
            >
              <option value={CurriculumLevel.SELECT_YEAR} disabled>-- Select a Year --</option>
              {CURRICULUM_LEVEL_OPTIONS_FOR_VIEW.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
        {activeSubView === 'detailedMonthly' && selectedYear !== CurriculumLevel.SELECT_YEAR && (
            <div>
                <label htmlFor="month-select-detailed" className="block text-lg font-medium mb-2 text-[var(--color-on-surface)]">Month:</label>
                <select id="month-select-detailed" value={selectedMonthForDetailedView} onChange={(e) => setSelectedMonthForDetailedView(e.target.value)}
                    className={selectClasses}>
                    {ACADEMIC_MONTHS.map(month => <option key={month} value={month}>{month}</option>)}
                </select>
            </div>
        )}
      </div>
      
      {selectedYear !== CurriculumLevel.SELECT_YEAR ? (
        <>
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            <SubViewButton view="yearly" label="Yearly Plan" />
            <SubViewButton view="monthly" label="Monthly Distribution" />
            <SubViewButton view="detailedMonthly" label="Detailed Monthly Plan" />
          </div>
          {activeSubView === 'yearly' && <YearlyPlanView sequences={currentYearData} />}
          {activeSubView === 'monthly' && <MonthlyDistributionView sequences={currentYearData} academicMonths={ACADEMIC_MONTHS} />}
          {activeSubView === 'detailedMonthly' && (
              selectedMonthForDetailedView === "September" ? (
                  <div className="material-card text-center py-10"><p>The Detailed Monthly Plan is not applicable for September.</p></div>
              ) : (
                  <DetailedMonthlyPlanView lessonsForMonth={lessonsForDetailedMonthlyView} selectedMonth={selectedMonthForDetailedView} selectedYear={selectedYear} currentYearCanvasData={currentYearData} />
              )
          )}
        </>
      ) : (
         <div className="material-card text-center py-10"><p>Please select an academic year.</p></div>
      )}
    </div>
  );
};

export default CurriculumOverview;