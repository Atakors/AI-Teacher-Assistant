import React, { useState, useMemo } from 'react';
import { User, CurriculumLevel, CanvasSequence, LessonPlan, LessonDetailLevel, CreativityLevel } from '../types';
import { CURRICULUM_LEVEL_OPTIONS_FOR_VIEW, SparklesIcon, DownloadIcon, FileWordIcon } from './constants';
import { YEAR_3_CANVAS_STRUCTURE_DATA } from './constants_year3';
import { YEAR_4_CANVAS_STRUCTURE_DATA } from './constants_year4';
import { YEAR_5_CANVAS_STRUCTURE_DATA } from './constants_year5';
import { generateLessonPlanWithGemini } from '../services/geminiService';
import ErrorMessage from './ErrorMessage';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, VerticalAlign, PageBreak, BorderStyle } from 'docx';

interface BulkGeneratorViewProps {
  currentUser: User;
  lessonDetailLevel: LessonDetailLevel;
  creativityLevel: CreativityLevel;
  selectedMaterials: string[];
  onOpenPremiumModal: (featureName?: string) => void;
}

const BulkGeneratorView: React.FC<BulkGeneratorViewProps> = ({
  currentUser,
  lessonDetailLevel,
  creativityLevel,
  selectedMaterials,
  onOpenPremiumModal,
}) => {
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumLevel | null>(currentUser.defaultCurriculum);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState(currentUser.name);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [generatedPlans, setGeneratedPlans] = useState<LessonPlan[]>([]);
  const [includeTextbookActivities, setIncludeTextbookActivities] = useState(true);

  const curriculumDataMap = useMemo((): Record<string, CanvasSequence[]> => ({
    [CurriculumLevel.PRIMARY_3]: YEAR_3_CANVAS_STRUCTURE_DATA,
    [CurriculumLevel.PRIMARY_4]: YEAR_4_CANVAS_STRUCTURE_DATA,
    [CurriculumLevel.PRIMARY_5]: YEAR_5_CANVAS_STRUCTURE_DATA,
  }), []);

  const availableSequences = useMemo(() => {
    return selectedCurriculum ? curriculumDataMap[selectedCurriculum] || [] : [];
  }, [selectedCurriculum, curriculumDataMap]);

  const handleGenerateClick = async () => {
    if (!selectedCurriculum || !selectedSequenceId) {
      setError("Please select a curriculum and a sequence.");
      return;
    }

    const sequence = availableSequences.find(s => s.id === selectedSequenceId);
    if (!sequence) {
      setError("Selected sequence not found.");
      return;
    }

    const lessonsToGenerate = sequence.sections.flatMap(sec => sec.lessons.filter(l => !l.name.toLowerCase().includes("initial situation")));
    
    if (!window.confirm(`This will generate ${lessonsToGenerate.length} lesson plans. This process may take several minutes. Do you want to proceed?`)) {
      return;
    }

    setIsLoading(true);
    setGeneratedPlans([]);
    setError(null);
    setProgress({ current: 0, total: lessonsToGenerate.length });

    const plans: LessonPlan[] = [];

    for (let i = 0; i < lessonsToGenerate.length; i++) {
      const lesson = lessonsToGenerate[i];
      const section = sequence.sections.find(sec => sec.lessons.includes(lesson));
      if (!section) continue;

      setProgress({ current: i + 1, total: lessonsToGenerate.length });

      try {
        let topicForAI = `Generate a lesson plan for the ${selectedCurriculum} session: "${lesson.name}" from Sequence: "${sequence.title}" within Section: "${section.name}".`;
        
        if (includeTextbookActivities && lesson.bookActivities?.length) {
            topicForAI += `\n**Important**: You MUST base some of the lesson's procedure on the following textbook activities: ${lesson.bookActivities.map(a => `P${a.page}${a.activityNumber ? ` (Act. ${a.activityNumber})` : ''}: ${a.description}`).join('; ')}`;
        } else {
            topicForAI += `\n**Important**: Do NOT mention or include any textbook activities. Create original activities based only on the provided curriculum content.`;
        }
        
        const plan = await generateLessonPlanWithGemini(
          teacherName,
          selectedCurriculum,
          topicForAI,
          section.detailedContent || null,
          lessonDetailLevel,
          creativityLevel,
          selectedMaterials,
          'structured',
          '',
          sequence.title
        );
        plans.push(plan);
        
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay for API stability

      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        setError(`Failed while generating lesson "${lesson.name}". Process stopped. Error: ${errorMessage}`);
        setIsLoading(false);
        return;
      }
    }

    setGeneratedPlans(plans);
    setIsLoading(false);
  };

  const handleExportDocx = async () => {
    if (generatedPlans.length === 0) return;

    // Helper to ensure we don't pass null/undefined to docx components
    const safeString = (value: any): string => {
      if (value === null || typeof value === 'undefined') return '';
      if (Array.isArray(value)) return value.join(', ');
      return String(value);
    };

    const docChildren: (Paragraph | Table)[] = [];
    const cellMargin = { top: 80, bottom: 80, left: 100, right: 100 };

    generatedPlans.forEach((plan, index) => {
      // Helper for creating cells in the header table
      const createHeaderCell = (label: string, value: string, options: any = {}) => new TableCell({
          children: [
              new Paragraph({ children: [new TextRun({ text: `${label}:`, bold: true })] }),
              new Paragraph(value)
          ],
          margins: cellMargin, ...options
      });

      const headerTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createHeaderCell('School', safeString(plan.school)), createHeaderCell('Teacher', safeString(plan.teacher)), createHeaderCell('Number of Ls', safeString(plan.numberOfLearners))] }),
            new TableRow({ children: [createHeaderCell('Sequence', safeString(plan.sequence)), createHeaderCell('Section', safeString(plan.section)), createHeaderCell('Level', safeString(plan.level))] }),
            new TableRow({ children: [createHeaderCell('Session', safeString(plan.session)), createHeaderCell('Session focus', safeString(plan.sessionFocus)), createHeaderCell('Domain', safeString(plan.domain))] }),
            new TableRow({ children: [createHeaderCell('Targeted Competency', safeString(plan.targetedCompetency), { columnSpan: 3 })] }),
            new TableRow({ children: [createHeaderCell('Session Objective(s)', safeString(plan.sessionObjectives), { columnSpan: 3 })] }),
            new TableRow({ children: [createHeaderCell('Subsidiary Objective', safeString(plan.subsidiaryObjective), { columnSpan: 3 })] }),
            new TableRow({ children: [createHeaderCell('Anticipated Problems', safeString(plan.anticipatedProblems), { columnSpan: 3 })] }),
            new TableRow({ children: [createHeaderCell('Solutions', safeString(plan.solutions), { columnSpan: 3 })] }),
            new TableRow({ children: [createHeaderCell('Materials', safeString(plan.materials), { columnSpan: 3 })] }),
            new TableRow({ children: [createHeaderCell('Cross Curricular Competence', safeString(plan.crossCurricularCompetence), { columnSpan: 3 })] }),
          ],
      });

      const procedureTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: ['Time', 'Stages', 'Procedure', 'Interaction'].map(text => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })], margins: cellMargin })),
                tableHeader: true,
            }),
            ...(plan.procedureTable || []).map(row => new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph(safeString(row.time))], verticalAlign: VerticalAlign.TOP, margins: cellMargin }),
                    new TableCell({ children: [new Paragraph(safeString(row.stage))], verticalAlign: VerticalAlign.TOP, margins: cellMargin }),
                    new TableCell({ children: safeString(row.procedure).split('\n').map(p => new Paragraph(safeString(p))), verticalAlign: VerticalAlign.TOP, margins: cellMargin }),
                    new TableCell({ children: [new Paragraph(safeString(row.interaction))], verticalAlign: VerticalAlign.TOP, margins: cellMargin }),
                ]
            }))
        ],
      });

      docChildren.push(headerTable);
      docChildren.push(new Paragraph({ text: '' })); // Spacer
      docChildren.push(procedureTable);

      if (index < generatedPlans.length - 1) {
        docChildren.push(new Paragraph({ children: [new PageBreak()] }));
      }
    });

    const doc = new Document({ sections: [{ children: docChildren }] });
    
    const sequenceName = safeString(generatedPlans[0]?.sequence).replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'sequence';
    const fileName = `lesson_plans_${sequenceName}.docx`;

    Packer.toBlob(doc).then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });
  };

  const selectClasses = "w-full p-3";

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-on-bg)]">
          Bulk Lesson Plan Generator
          <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-primary)' }} />
        </h2>
        <p className="text-[var(--color-on-surface-variant)] mt-2">
          Generate all lesson plans for an entire sequence in one go. This feature is for administrators only.
        </p>
      </div>

      <div className="material-card p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-3 text-[var(--color-on-surface)]">1. Select Sequence</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-on-surface-variant)] mb-1 block">Curriculum Year</label>
              <select value={selectedCurriculum || ''} onChange={e => { setSelectedCurriculum(e.target.value as CurriculumLevel); setSelectedSequenceId(null); }} className={selectClasses} disabled={isLoading}>
                <option value="" disabled>-- Select a Year --</option>
                {CURRICULUM_LEVEL_OPTIONS_FOR_VIEW.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-on-surface-variant)] mb-1 block">Sequence</label>
              <select value={selectedSequenceId || ''} onChange={e => setSelectedSequenceId(e.target.value)} className={selectClasses} disabled={!selectedCurriculum || isLoading}>
                <option value="" disabled>-- Select a Sequence --</option>
                {availableSequences.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
          </div>
           <div className="mt-4">
              <label className="text-sm font-medium text-[var(--color-on-surface-variant)] mb-1 block">Teacher's Name</label>
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-2">
                  This name will be used in all generated lesson plans.
              </p>
              <input 
                  type="text" 
                  value={teacherName} 
                  onChange={e => setTeacherName(e.target.value)} 
                  className={selectClasses} 
                  disabled={isLoading}
              />
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--color-outline)]">
            <h3 className="text-xl font-semibold mb-3 text-[var(--color-on-surface)]">2. Generation Options</h3>
            <label className="flex items-center p-2 cursor-pointer rounded-lg hover:bg-[var(--color-surface-variant)]">
                <input
                    type="checkbox"
                    checked={includeTextbookActivities}
                    onChange={(e) => setIncludeTextbookActivities(e.target.checked)}
                    disabled={isLoading}
                />
                <span className="ml-2 text-sm text-[var(--color-on-surface)]">Include Textbook Activities</span>
            </label>
        </div>


        <div className="pt-4 border-t border-[var(--color-outline)]">
          <h3 className="text-xl font-semibold mb-3 text-[var(--color-on-surface)]">3. Generate</h3>
          <button
            onClick={handleGenerateClick}
            disabled={!selectedSequenceId || isLoading}
            className="w-full material-button material-button-primary py-3"
          >
            {isLoading ? 'Generating...' : 'Generate Sequence Plans'}
          </button>
        </div>

        {isLoading && (
          <div className="pt-4">
            <p className="text-center font-medium mb-2">
              Generating plan {progress.current} of {progress.total}...
            </p>
            <div className="w-full bg-[var(--color-surface-variant)] rounded-full h-2.5">
              <div
                className="bg-[var(--color-primary)] h-2.5 rounded-full"
                style={{ width: `${(progress.current / progress.total) * 100}%`, transition: 'width 0.5s ease-in-out' }}
              ></div>
            </div>
            <p className="text-xs text-center text-[var(--color-on-surface-variant)] mt-2">This may take several minutes. Please do not close this window.</p>
          </div>
        )}

        {error && <ErrorMessage message={error} />}

        {generatedPlans.length > 0 && !isLoading && (
          <div className="pt-4 border-t border-[var(--color-outline)] text-center">
            <p className="text-emerald-600 font-semibold mb-3">
              Generation complete! {generatedPlans.length} lesson plans have been created.
            </p>
            <button
              onClick={handleExportDocx}
              className="w-full sm:w-auto material-button material-button-secondary py-3 flex items-center justify-center gap-2 mx-auto"
            >
              <DownloadIcon className="w-5 h-5" />
              Download as Single Word File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkGeneratorView;