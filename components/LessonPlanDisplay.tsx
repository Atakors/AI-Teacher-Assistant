
import React, { useState, useRef, useEffect } from 'react';
import { LessonPlan } from '../types';
import { EmptyLessonPlanStructure, DownloadIcon, ChevronDownIcon, FileWordIcon, FilePdfIcon, BookmarkSquareIcon } from './constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, VerticalAlign, BorderStyle } from 'docx';

// Helper for rendering multi-line procedure text inside tables
const ProcedureCellContent: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;
    return (
        <>
            {text.split('\n').map((line, index) => (
                <p key={index} className="text-sm mb-1 last:mb-0">{line}</p>
            ))}
        </>
    );
};

// Helper for creating table cells in the display component
const InfoCell: React.FC<{ label: string; children: React.ReactNode; className?: string; labelClassName?: string; contentClassName?: string; }> = ({ label, children, className = '', labelClassName = '', contentClassName = '' }) => (
    <div className={`border border-[var(--color-outline)] p-2 ${className}`}>
        <p className={`text-xs font-semibold text-[var(--color-on-surface-variant)] mb-0.5 ${labelClassName}`}>{label}</p>
        <div className={`text-base text-[var(--color-on-surface)] min-h-[1.25rem] break-words ${contentClassName}`}>{children}</div>
    </div>
);

interface ActionButtonsProps {
  plan: LessonPlan | null;
  isViewingSavedPlan: boolean;
  onSavePlan: () => void;
  isExportMenuOpen: boolean;
  setIsExportMenuOpen: (isOpen: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement>;
  onExportWord: () => void;
  onExportPdf: () => void;
  dropdownDirection?: 'up' | 'down';
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  plan,
  isViewingSavedPlan,
  onSavePlan,
  isExportMenuOpen,
  setIsExportMenuOpen,
  menuRef,
  onExportWord,
  onExportPdf,
  dropdownDirection = 'down'
}) => {
  const dropdownClasses = dropdownDirection === 'up'
    ? "absolute right-0 bottom-full mb-2 w-48 origin-bottom-right"
    : "absolute right-0 top-full mt-2 w-48 origin-top-right";

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap justify-end gap-2">
      {!isViewingSavedPlan && (
        <button
          onClick={onSavePlan}
          disabled={!plan}
          className="material-button material-button-secondary flex items-center justify-center text-sm w-full sm:w-auto"
        >
          <BookmarkSquareIcon className="w-5 h-5 mr-2" />
          Save Plan
        </button>
      )}
      <div className="relative w-full sm:w-auto" ref={menuRef}>
        <button
          onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
          disabled={!plan}
          className="material-button material-button-secondary flex items-center justify-center text-sm w-full"
          aria-haspopup="true" aria-expanded={isExportMenuOpen}
        >
          <DownloadIcon className="w-5 h-5 mr-2" />
          Export
          <ChevronDownIcon className={`w-5 h-5 ml-1 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
        </button>
        {isExportMenuOpen && (
          <div className={`${dropdownClasses} bg-[var(--color-surface)] border border-[var(--color-outline)] rounded-md shadow-lg z-10`}>
            <div className="py-1">
              <button onClick={onExportWord} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)]"><FileWordIcon className="w-4 h-4" /> As Word (.docx)</button>
              <button onClick={onExportPdf} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)]"><FilePdfIcon className="w-4 h-4" /> As PDF</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


interface LessonPlanDisplayProps {
    plan: LessonPlan | null;
    isViewingSavedPlan: boolean;
    onSavePlan: () => void;
}

const LessonPlanDisplay: React.FC<LessonPlanDisplayProps> = ({ plan, isViewingSavedPlan, onSavePlan }) => {
  const [isTopExportMenuOpen, setIsTopExportMenuOpen] = useState(false);
  const [isBottomExportMenuOpen, setIsBottomExportMenuOpen] = useState(false);
  const topExportMenuRef = useRef<HTMLDivElement>(null);
  const bottomExportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (topExportMenuRef.current && !topExportMenuRef.current.contains(event.target as Node)) {
        setIsTopExportMenuOpen(false);
      }
      if (bottomExportMenuRef.current && !bottomExportMenuRef.current.contains(event.target as Node)) {
        setIsBottomExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!plan) {
    return (
      <div className="material-card text-center p-8 h-full flex flex-col justify-center items-center">
        <EmptyLessonPlanStructure className="w-16 h-16 mx-auto text-[var(--color-on-surface-variant)]" />
        <p className="mt-4 text-lg font-medium text-[var(--color-on-surface)]">Your generated lesson plan will appear here.</p>
        <p className="text-sm max-w-md mx-auto text-[var(--color-on-surface-variant)]">
          Select a curriculum and a specific lesson from the controls on the left, then click "Generate Lesson Plan".
        </p>
      </div>
    );
  }
  
  const handleExportPdf = () => {
    if (!plan) return;
    const doc = new jsPDF();
    const marginValue = 12.7; // 0.5 inches in mm

    // --- Header Part ---
    autoTable(doc, {
        body: [
            [
                { content: `School:\n${plan.school}`, styles: { cellWidth: 80 } },
                { content: `Teacher:\n${plan.teacher}`, styles: { cellWidth: 80 } },
                { content: `Number of Ls:\n${plan.numberOfLearners}` },
            ],
            [
                { content: `${plan.sequence}` },
                { content: `Section:\n${plan.section}` },
                { content: `Level:\n${plan.level}` },
            ],
            [
                { content: `Session:\n${plan.session}` },
                { content: `Session focus:\n${plan.sessionFocus}` },
                { content: `Domain:\n${plan.domain}` },
            ],
            [{ content: `Targeted Competency:\n${plan.targetedCompetency}`, colSpan: 3, styles: { minCellHeight: 15 } }],
            [{ content: `Session Objective(s):\n${plan.sessionObjectives}`, colSpan: 3, styles: { minCellHeight: 15 } }],
            [{ content: `Subsidiary Objective:\n${plan.subsidiaryObjective}`, colSpan: 3 }],
            [{ content: `Anticipated Problems:\n${plan.anticipatedProblems}`, colSpan: 3 }],
            [{ content: `Solutions:\n${plan.solutions}`, colSpan: 3 }],
            [
                { content: `Materials:\n${plan.materials.join(', ')}`, colSpan: 3 },
            ],
            [{ content: `Cross Curricular Competence:\n${plan.crossCurricularCompetence}`, colSpan: 3, styles: { minCellHeight: 25 } }],
        ],
        theme: 'grid',
        margin: marginValue,
        styles: { fontSize: 8, cellPadding: 1.5 },
    });
    
    // --- Procedure Table Part ---
    const lastY = (doc as any).lastAutoTable.finalY + 10;
    autoTable(doc, {
        head: [['Time', 'Stages', 'Procedure', 'Interaction']],
        body: plan.procedureTable.map(row => [
            row.time,
            row.stage,
            row.procedure,
            row.interaction,
        ]),
        theme: 'grid',
        startY: lastY,
        margin: { left: marginValue, right: marginValue, bottom: marginValue },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: '#333', textColor: '#fff' }
    });

    const fileName = `lesson-plan-${plan.session.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    doc.save(fileName);
    setIsTopExportMenuOpen(false);
    setIsBottomExportMenuOpen(false);
  };

  const handleExportWord = () => {
    if (!plan) return;
    
    const cellMargin = { top: 80, bottom: 80, left: 100, right: 100 };
    const createCell = (text: string, options: any = {}) => new TableCell({ children: [new Paragraph(text)], margins: cellMargin, ...options });
    const createHeaderCell = (label: string, value: string, options: any = {}) => new TableCell({
        children: [
            new Paragraph({ children: [new TextRun({ text: `${label}:`, bold: true })] }),
            new Paragraph(value)
        ],
        margins: cellMargin,
        ...options
    });

    const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({ children: [createHeaderCell('School', plan.school), createHeaderCell('Teacher', plan.teacher), createHeaderCell('Number of Ls', plan.numberOfLearners)] }),
            new TableRow({ children: [createCell(plan.sequence), createHeaderCell('Section', plan.section), createHeaderCell('Level', plan.level)] }),
            new TableRow({ children: [createHeaderCell('Session', plan.session), createHeaderCell('Session focus', plan.sessionFocus), createHeaderCell('Domain', plan.domain)] }),
            new TableRow({ children: [createHeaderCell('Targeted Competency', plan.targetedCompetency, { columnSpan: 3 })] }),
            new TableRow({ children: [createHeaderCell('Session Objective(s)', plan.sessionObjectives, { columnSpan: 3 })] }),
            new TableRow({ children: [createHeaderCell('Subsidiary Objective', plan.subsidiaryObjective, { columnSpan: 3 })] }),
            new TableRow({ children: [createHeaderCell('Anticipated Problems', plan.anticipatedProblems, { columnSpan: 3 })] }),
            new TableRow({ children: [createHeaderCell('Solutions', plan.solutions, { columnSpan: 3 })] }),
            new TableRow({ children: [
                createHeaderCell('Materials', plan.materials.join(', '), { columnSpan: 3 }), 
            ] }),
            new TableRow({ children: [createHeaderCell('Cross Curricular Competence', plan.crossCurricularCompetence, { columnSpan: 3 })] }),
        ],
    });

    const procedureTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [ 'Time', 'Stages', 'Procedure', 'Interaction' ].map(text => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })], margins: cellMargin })),
                tableHeader: true,
            }),
            ...plan.procedureTable.map(row => new TableRow({
                children: [
                    createCell(row.time, { verticalAlign: VerticalAlign.TOP }),
                    createCell(row.stage, { verticalAlign: VerticalAlign.TOP }),
                    new TableCell({ children: row.procedure.split('\n').map(p => new Paragraph(p)), verticalAlign: VerticalAlign.TOP, margins: cellMargin }),
                    createCell(row.interaction, { verticalAlign: VerticalAlign.TOP }),
                ]
            }))
        ],
    });

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 720,
                        right: 720,
                        bottom: 720,
                        left: 720,
                    },
                }
            },
            children: [
                headerTable,
                new Paragraph({ text: '' }), // Spacer
                procedureTable,
            ],
        }],
    });

    Packer.toBlob(doc).then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `lesson-plan-${plan.session.toLowerCase().replace(/\s+/g, '-')}.docx`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });
    setIsTopExportMenuOpen(false);
    setIsBottomExportMenuOpen(false);
  };


  return (
    <div className="material-card p-4 sm:p-6 space-y-4">
      <ActionButtons
        plan={plan}
        isViewingSavedPlan={isViewingSavedPlan}
        onSavePlan={onSavePlan}
        isExportMenuOpen={isTopExportMenuOpen}
        setIsExportMenuOpen={setIsTopExportMenuOpen}
        menuRef={topExportMenuRef}
        onExportWord={handleExportWord}
        onExportPdf={handleExportPdf}
        dropdownDirection="down"
      />
      
      {/* Header Info Display */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0.5">
          <InfoCell label="School" className="col-span-1">{plan.school}</InfoCell>
          <InfoCell label="Teacher" className="col-span-1">{plan.teacher}</InfoCell>
          <InfoCell label="Number of Ls" className="col-span-1">{plan.numberOfLearners}</InfoCell>

          <InfoCell label="Sequence" className="col-span-1">{plan.sequence}</InfoCell>
          <InfoCell label="Section" className="col-span-1">{plan.section}</InfoCell>
          <InfoCell label="Level" className="col-span-1">{plan.level}</InfoCell>

          <InfoCell label="Session" className="col-span-1">{plan.session}</InfoCell>
          <InfoCell label="Session focus" className="col-span-1">{plan.sessionFocus}</InfoCell>
          <InfoCell label="Domain" className="col-span-1">{plan.domain}</InfoCell>

          <InfoCell label="Targeted Competency" className="sm:col-span-3">{plan.targetedCompetency}</InfoCell>
          <InfoCell label="Session Objective(s)" className="sm:col-span-3">{plan.sessionObjectives}</InfoCell>
          <InfoCell label="Subsidiary Objective" className="sm:col-span-3">{plan.subsidiaryObjective}</InfoCell>
          <InfoCell label="Anticipated Problems" className="sm:col-span-3">{plan.anticipatedProblems}</InfoCell>
          <InfoCell label="Solutions" className="sm:col-span-3">{plan.solutions}</InfoCell>
          
          {plan.materials && plan.materials.length > 0 && (
            <InfoCell label="Materials" className="sm:col-span-3">{plan.materials.join(', ')}</InfoCell>
          )}

          <InfoCell label="Cross Curricular Competence" className="sm:col-span-3 min-h-[6rem]">{plan.crossCurricularCompetence}</InfoCell>
      </div>

      {/* Procedure Table Display */}
      {/* Desktop Table View */}
      <div className="overflow-x-auto pt-4 hidden md:block">
        <table className="w-full border-collapse text-left">
            <thead>
                <tr className="bg-[var(--color-surface-variant)]">
                    {['Time', 'Stages', 'Procedure', 'Interaction'].map(header => (
                        <th key={header} className="p-1 sm:p-2 border border-[var(--color-outline)] text-sm font-semibold text-[var(--color-on-surface-variant)]">{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {plan.procedureTable.map((row, index) => (
                    <tr key={index} className="border-t border-[var(--color-outline)]">
                        <td className="p-1 sm:p-2 border border-[var(--color-outline)] align-top text-sm w-1/12">{row.time}</td>
                        <td className="p-1 sm:p-2 border border-[var(--color-outline)] align-top font-medium text-sm w-2/12">{row.stage}</td>
                        <td className="p-1 sm:p-2 border border-[var(--color-outline)] align-top w-7/12 break-words"><ProcedureCellContent text={row.procedure} /></td>
                        <td className="p-1 sm:p-2 border border-[var(--color-outline)] align-top text-sm w-2/12">{row.interaction}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden pt-4 space-y-4">
        <h3 className="text-lg font-semibold text-[var(--color-on-surface)]">Lesson Procedure</h3>
        {plan.procedureTable.map((row, index) => (
            <div key={index} className="material-card p-4 space-y-3 rounded-lg border-l-4" style={{ borderColor: 'var(--color-primary)' }}>
                <div className="flex justify-between items-start">
                    <p className="font-bold text-lg text-[var(--color-on-surface)]">{row.stage}</p>
                    <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-sm font-medium">{row.time}</p>
                        <p className="text-xs text-[var(--color-on-surface-variant)]">{row.interaction}</p>
                    </div>
                </div>
                <div className="pt-2 border-t border-[var(--color-outline)]">
                    <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] mb-1">Procedure</p>
                    <div className="text-sm text-[var(--color-on-surface)]"><ProcedureCellContent text={row.procedure} /></div>
                </div>
            </div>
        ))}
      </div>


      {plan && (
        <div className="pt-4 mt-4 border-t border-[var(--color-outline)]">
            <ActionButtons
                plan={plan}
                isViewingSavedPlan={isViewingSavedPlan}
                onSavePlan={onSavePlan}
                isExportMenuOpen={isBottomExportMenuOpen}
                setIsExportMenuOpen={setIsBottomExportMenuOpen}
                menuRef={bottomExportMenuRef}
                onExportWord={handleExportWord}
                onExportPdf={handleExportPdf}
                dropdownDirection="up"
            />
        </div>
      )}
    </div>
  );
};

export default LessonPlanDisplay;
