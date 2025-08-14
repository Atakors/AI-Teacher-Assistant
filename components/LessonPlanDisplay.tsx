

import React, { useState, useRef, useEffect } from 'react';
import { LessonPlan } from '../types';
import { EmptyLessonPlanStructure, DownloadIcon, ChevronDownIcon, FileWordIcon, FilePdfIcon, BookmarkSquareIcon } from '../constants';
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
    <div className={`border border-[var(--color-border)] p-1.5 ${className}`}>
        <p className={`text-xs font-semibold text-[var(--color-text-secondary)] mb-0.5 ${labelClassName}`}>{label}</p>
        <div className={`text-base text-[var(--color-text-primary)] min-h-[1.25rem] ${contentClassName}`}>{children}</div>
    </div>
);

interface LessonPlanDisplayProps {
    plan: LessonPlan | null;
    isViewingSavedPlan: boolean;
    onSavePlan: () => void;
}

const LessonPlanDisplay: React.FC<LessonPlanDisplayProps> = ({ plan, isViewingSavedPlan, onSavePlan }) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [exportMenuRef]);

  if (!plan) {
    return (
      <div className="aurora-card text-center p-8 h-full flex flex-col justify-center items-center">
        <EmptyLessonPlanStructure className="w-16 h-16 mx-auto text-[var(--color-text-secondary)]" />
        <p className="mt-4 text-lg font-medium text-[var(--color-text-primary)]">Your generated lesson plan will appear here.</p>
        <p className="text-sm max-w-md mx-auto text-[var(--color-text-secondary)]">
          Select a curriculum and a specific lesson from the controls on the left, then click "Generate Lesson Plan".
        </p>
      </div>
    );
  }
  
  const handleExportPdf = () => {
    if (!plan) return;
    const doc = new jsPDF();
    const margin = 10;

    // --- Header Part ---
    autoTable(doc, {
        body: [
            [
                { content: `School:\n${plan.school}`, styles: { cellWidth: 80 } },
                { content: `Teacher:\n${plan.teacher}`, styles: { cellWidth: 80 } },
                { content: `Level:\n${plan.level}`, styles: { cellWidth: 'auto' } },
            ],
            [
                { content: `Sequence:\n${plan.sequence}` },
                { content: `Section:\n${plan.section}` },
                { content: `Number of Ls:\n${plan.numberOfLearners}` },
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
        startY: margin,
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
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: '#333', textColor: '#fff' }
    });

    const fileName = `lesson-plan-${plan.session.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    doc.save(fileName);
    setIsExportMenuOpen(false);
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
            new TableRow({ children: [createHeaderCell('School', plan.school), createHeaderCell('Teacher', plan.teacher), createHeaderCell('Level', plan.level)] }),
            new TableRow({ children: [createHeaderCell('Sequence', plan.sequence), createHeaderCell('Section', plan.section), createHeaderCell('Number of Ls', plan.numberOfLearners)] }),
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
    setIsExportMenuOpen(false);
  };


  return (
    <div className="aurora-card p-4 sm:p-6 space-y-4">
      <div className="flex justify-end gap-2">
        {!isViewingSavedPlan && (
            <button
                onClick={onSavePlan}
                disabled={!plan}
                className="interactive-glow bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center py-2 px-4 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <BookmarkSquareIcon className="w-5 h-5 mr-2" />
                Save Plan
            </button>
        )}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            disabled={!plan}
            className="interactive-glow bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center py-2 px-4 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-haspopup="true" aria-expanded={isExportMenuOpen}
          >
            <DownloadIcon className="w-5 h-5 mr-2" />
            Export
            <ChevronDownIcon className={`w-5 h-5 ml-1 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {isExportMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 origin-top-right bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-lg z-10">
              <div className="py-1">
                <button onClick={handleExportWord} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-inset-bg)]"><FileWordIcon className="w-4 h-4" /> As Word (.docx)</button>
                <button onClick={handleExportPdf} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-inset-bg)]"><FilePdfIcon className="w-4 h-4" /> As PDF</button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Header Info Display */}
      <div className="grid grid-cols-3 gap-0.5">
          <InfoCell label="School" className="col-span-1">{plan.school}</InfoCell>
          <InfoCell label="Teacher" className="col-span-1">{plan.teacher}</InfoCell>
          <InfoCell label="Level" className="col-span-1">{plan.level}</InfoCell>

          <InfoCell label="Sequence" className="col-span-1">{plan.sequence}</InfoCell>
          <InfoCell label="Section" className="col-span-1">{plan.section}</InfoCell>
          <InfoCell label="Number of Ls" className="col-span-1">{plan.numberOfLearners}</InfoCell>

          <InfoCell label="Session" className="col-span-1">{plan.session}</InfoCell>
          <InfoCell label="Session focus" className="col-span-1">{plan.sessionFocus}</InfoCell>
          <InfoCell label="Domain" className="col-span-1">{plan.domain}</InfoCell>

          <InfoCell label="Targeted Competency" className="col-span-3">{plan.targetedCompetency}</InfoCell>
          <InfoCell label="Session Objective(s)" className="col-span-3">{plan.sessionObjectives}</InfoCell>
          <InfoCell label="Subsidiary Objective" className="col-span-3">{plan.subsidiaryObjective}</InfoCell>
          <InfoCell label="Anticipated Problems" className="col-span-3">{plan.anticipatedProblems}</InfoCell>
          <InfoCell label="Solutions" className="col-span-3">{plan.solutions}</InfoCell>
          
          {plan.materials && plan.materials.length > 0 && (
            <InfoCell label="Materials" className="col-span-3">{plan.materials.join(', ')}</InfoCell>
          )}

          <InfoCell label="Cross Curricular Competence" className="col-span-3 min-h-[6rem]">{plan.crossCurricularCompetence}</InfoCell>
      </div>

      {/* Procedure Table Display */}
      <div className="overflow-x-auto pt-4">
        <table className="w-full border-collapse text-left">
            <thead>
                <tr className="bg-[var(--color-inset-bg)]">
                    {['Time', 'Stages', 'Procedure', 'Interaction'].map(header => (
                        <th key={header} className="p-2 border border-[var(--color-border)] text-sm font-semibold">{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {plan.procedureTable.map((row, index) => (
                    <tr key={index} className="border-t border-[var(--color-border)]">
                        <td className="p-2 border border-[var(--color-border)] align-top text-sm w-1/12">{row.time}</td>
                        <td className="p-2 border border-[var(--color-border)] align-top font-medium text-sm w-2/12">{row.stage}</td>
                        <td className="p-2 border border-[var(--color-border)] align-top w-7/12"><ProcedureCellContent text={row.procedure} /></td>
                        <td className="p-2 border border-[var(--color-border)] align-top text-sm w-2/12">{row.interaction}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default LessonPlanDisplay;