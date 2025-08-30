

import React, { useState, useMemo } from 'react';
import { Exam, ExamSection, ExamQuestion } from '../types';
import { Document, Packer, Paragraph, TextRun, Numbering, Indent, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DownloadIcon, FileWordIcon, FilePdfIcon, BookmarkSquareIcon, ChevronDownIcon } from './constants';

interface ExamDisplayProps {
  exam: Exam | null;
  onSave: () => void;
}

const ExamDisplay: React.FC<ExamDisplayProps> = ({ exam, onSave }) => {
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  // Helper function to shuffle an array for the matching game display
  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleExportWord = async () => {
    if (!exam) return;
    
    const children: (Paragraph | Table)[] = [];
    
    children.push(new Paragraph({ text: exam.title, heading: "Title", alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ text: exam.instructions, alignment: AlignmentType.LEFT, spacing: { after: 200 } }));

    if (exam.readingPassage) {
        children.push(new Paragraph({ text: "Reading Passage", heading: "Heading1", spacing: { before: 400, after: 200 }}));
        exam.readingPassage.split('\n').forEach(p => children.push(new Paragraph({ text: p, style: "IntenseQuote", indent: { left: 400 } })));
    }

    exam.sections.forEach(section => {
        children.push(new Paragraph({ text: `${section.title} (${section.points || 0} pts)`, heading: "Heading2", spacing: { before: 400, after: 200 } }));
        if(section.instructions) children.push(new Paragraph({ text: section.instructions, style: "Quote" }));

        section.questions.forEach((q, qIndex) => {
            children.push(new Paragraph({ text: q.questionText, numbering: { reference: "default-numbering", level: 0 } }));

            if (section.questionType === 'Matching' && q.matchingPairs) {
                const shuffledMatches = shuffleArray(q.matchingPairs.map(p => p.match));
                const table = new Table({
                    width: { size: 90, type: WidthType.PERCENTAGE },
                    rows: q.matchingPairs.map((pair, i) => new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(`${i + 1}. ${pair.prompt}`)], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
                            new TableCell({ children: [new Paragraph(`____ ${shuffledMatches[i]}`)], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
                        ]
                    }))
                });
                children.push(table);
            }
             if (section.questionType === 'Complete the Table' && q.tableToComplete) {
                const table = new Table({
                    width: { size: 90, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: q.tableToComplete.headers.map(h => new TableCell({ children: [new Paragraph({ text: h, alignment: AlignmentType.CENTER })] })) }),
                        ...q.tableToComplete.rows.map(row => new TableRow({ children: row.map(cell => new TableCell({ children: [new Paragraph(cell || '')] })) }))
                    ]
                });
                children.push(table);
            }
            if (q.options) q.options.forEach(opt => children.push(new Paragraph({ text: `  - ${opt}`, indent: { left: 1080 } })));
            if (q.wordBank) children.push(new Paragraph({ text: `Word Bank: [ ${q.wordBank.join(' / ')} ]`, style: "IntenseQuote" }));
            if (q.jumbledWords) children.push(new Paragraph({ text: q.jumbledWords.join(' / '), style: "Quote" }));
            children.push(new Paragraph({ text: "" })); // Spacer
        });
    });
    
    // Answer Key
    children.push(new Paragraph({ text: "Answer Key", pageBreakBefore: true, heading: "Title", alignment: AlignmentType.CENTER }));
    exam.sections.forEach((section, sIndex) => {
        children.push(new Paragraph({ text: section.title, heading: "Heading2", spacing: { before: 400, after: 200 } }));
        section.questions.forEach((q, qIndex) => {
             children.push(new Paragraph({ text: `${qIndex + 1}. ${exam.answerKey[sIndex][qIndex] || 'N/A'}`, indent: { left: 720 }}));
        });
    });

    const doc = new Document({
      numbering: { config: [ { reference: "default-numbering", levels: [ { level: 0, format: "decimal", text: "%1.", style: { paragraph: { indent: { left: 720, hanging: 360 } } } } ] } ] },
      sections: [{ children }],
    });
    
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exam.title.replace(/ /g, '_')}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (!exam) return;
    const doc = new jsPDF();
    let yPos = 15;
    const writeText = (text: string, x: number, y: number, options: any = {}) => {
        const maxWidth = doc.internal.pageSize.getWidth() - (options.xOffset || x) - 15;
        const lines = doc.splitTextToSize(text, maxWidth);
        if (yPos + lines.length * 5 > 280) { doc.addPage(); yPos = 15; }
        doc.text(lines, x, y);
        return y + lines.length * 5;
    };
    
    doc.setFontSize(18); yPos = writeText(exam.title, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
    doc.setFontSize(12); yPos = writeText(exam.instructions, 15, yPos + 2); yPos += 5;

    if (exam.readingPassage) {
        doc.setFont(undefined, 'bold'); yPos = writeText("Reading Passage", 15, yPos);
        doc.setFont(undefined, 'normal'); yPos = writeText(exam.readingPassage, 15, yPos + 2); yPos += 5;
    }

    exam.sections.forEach((section, sIndex) => {
      doc.setFontSize(14); doc.setFont(undefined, 'bold'); yPos = writeText(`${section.title} (${section.points || 0} pts)`, 15, yPos);
      doc.setFont(undefined, 'normal'); doc.setFontSize(12);
      if(section.instructions) { yPos = writeText(section.instructions, 15, yPos, {fontStyle: 'italic'}); yPos += 2; }
      
      section.questions.forEach((q, qIndex) => {
          yPos = writeText(`${qIndex + 1}. ${q.questionText}`, 15, yPos); yPos += 2;
          // Render specific question types
          if (q.options) q.options.forEach(opt => { yPos = writeText(`  - ${opt}`, 20, yPos); });
          if (q.wordBank) { yPos = writeText(`Word Bank: ${q.wordBank.join(' / ')}`, 20, yPos, {fontStyle: 'italic'}); }
          if (q.jumbledWords) { yPos = writeText(q.jumbledWords.join(' / '), 20, yPos); }
          if (q.matchingPairs) {
              const head = [['Prompt', 'Match']];
              const body = q.matchingPairs.map(p => [p.prompt, '']);
              autoTable(doc, { head, body, startY: yPos, theme: 'grid' });
              yPos = (doc as any).lastAutoTable.finalY;
          }
          if (q.tableToComplete) {
              autoTable(doc, { head: [q.tableToComplete.headers], body: q.tableToComplete.rows, startY: yPos, theme: 'grid' });
              yPos = (doc as any).lastAutoTable.finalY;
          }
          yPos += 4;
      });
    });

    // Answer Key on new page
    doc.addPage(); yPos = 15;
    doc.setFontSize(18); doc.text("Answer Key", doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' }); yPos += 10;
    exam.sections.forEach((section, sIndex) => {
        doc.setFontSize(14); doc.setFont(undefined, 'bold'); yPos = writeText(section.title, 15, yPos);
        doc.setFont(undefined, 'normal'); doc.setFontSize(12);
        section.questions.forEach((q, qIndex) => {
            yPos = writeText(`${qIndex + 1}. ${exam.answerKey[sIndex]?.[qIndex] || 'N/A'}`, 20, yPos);
        });
        yPos += 5;
    });

    doc.save(`${exam.title.replace(/ /g, '_')}.pdf`);
  };

  const renderQuestion = (q: ExamQuestion, s: ExamSection) => {
    switch (s.questionType) {
        case 'Matching':
            const shuffledMatches = useMemo(() => shuffleArray(q.matchingPairs?.map(p => p.match) || []), [q.matchingPairs]);
            return (
                <table className="w-full my-2 border-collapse">
                    <tbody>
                    {q.matchingPairs?.map((pair, i) => (
                        <tr key={i}><td className="p-2 border border-[var(--color-outline)]">{i+1}. {pair.prompt}</td><td className="p-2 border border-[var(--color-outline)]">____ {shuffledMatches[i]}</td></tr>
                    ))}
                    </tbody>
                </table>
            );
        case 'Complete the Table':
            return (
                 <table className="w-full my-2 border-collapse">
                    <thead><tr>{q.tableToComplete?.headers.map(h => <th key={h} className="p-2 border border-[var(--color-outline)] bg-[var(--color-surface-variant)]">{h}</th>)}</tr></thead>
                    <tbody>{q.tableToComplete?.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="p-2 border border-[var(--color-outline)]">{cell}</td>)}</tr>)}</tbody>
                </table>
            );
        case 'Fill in the Blanks':
            return q.wordBank ? <div className="p-2 my-2 border border-dashed border-[var(--color-outline)]">Word Bank: {q.wordBank.join(' / ')}</div> : null;
        case 'Reorder the Words':
            return <p className="my-2 p-2 bg-[var(--color-surface-variant)] rounded-md"><i>{q.jumbledWords?.join(' / ')}</i></p>;
        case 'Guided Writing':
            return <ul className="list-none my-2 p-2 bg-[var(--color-surface-variant)] rounded-md space-y-1"> {q.guidedWritingNotes?.map(note => <li key={note.key}><b>{note.key}:</b> {note.value}</li>)}</ul>;
        case 'Handwriting Practice':
        case 'Short Answer':
            return <div className="border-b border-dashed border-[var(--color-text-secondary)] mt-4"></div>;
        case 'Essay':
            return <div className="border-b border-dashed border-[var(--color-text-secondary)] mt-4 h-24"></div>;
        case 'Multiple Choice':
        case 'True/False':
             return <ul className="list-disc pl-5 mt-2 space-y-1">{q.options?.map((opt, oIndex) => <li key={oIndex}>{opt}</li>)}</ul>;
        default: return null;
    }
  };


  if (!exam) {
    return (
      <div className="aurora-card text-center p-8 h-full flex flex-col justify-center items-center">
        <p className="mt-4 text-lg font-medium text-[var(--color-text-primary)]">Your generated exam will appear here.</p>
      </div>
    );
  }

  return (
    <div className="aurora-card p-4 sm:p-8 space-y-6">
      <div className="flex justify-end gap-2">
        <button onClick={onSave} className="material-button material-button-secondary flex items-center justify-center text-sm">
          <BookmarkSquareIcon className="w-5 h-5 mr-2" /> Save Exam
        </button>
         <button onClick={handleExportWord} className="material-button material-button-secondary flex items-center justify-center text-sm"><FileWordIcon className="w-5 h-5 mr-2" /> Word</button>
         <button onClick={handleExportPdf} className="material-button material-button-secondary flex items-center justify-center text-sm"><FilePdfIcon className="w-5 h-5 mr-2" /> PDF</button>
      </div>

      <article className="prose prose-sm sm:prose-base max-w-none dark:prose-invert text-[var(--color-text-primary)]">
        <h1 className="text-center">{exam.title}</h1>
        <p className="text-sm italic text-center">{exam.instructions}</p>
        
        {exam.readingPassage && (
            <div className="p-4 my-6 rounded-lg bg-[var(--color-surface-variant)] border border-[var(--color-outline)]">
                <h3 className="mt-0">Reading Passage</h3>
                {exam.readingPassage.split('\n').map((p, i) => <p key={i}>{p}</p>)}
            </div>
        )}
        
        {exam.sections.map((section, sIndex) => (
          <div key={sIndex} className="mt-6">
            <h2 className="border-b border-[var(--color-border)] pb-2">{section.title} {section.points && `(${section.points} pts)`}</h2>
            {section.instructions && <p className="italic">{section.instructions}</p>}
            <ol className="list-decimal pl-5 space-y-4">
              {section.questions.map((q, qIndex) => (
                <li key={qIndex}>
                  <p className="font-medium" dangerouslySetInnerHTML={{ __html: q.questionText.replace(/____/g, '<span class="inline-block border-b-2 border-dotted border-current w-24"></span>') }} />
                  {renderQuestion(q, section)}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </article>

      <div className="pt-6 border-t border-[var(--color-border)]">
        <button onClick={() => setShowAnswerKey(!showAnswerKey)} className="text-lg font-semibold flex items-center gap-2">
          Answer Key
          <ChevronDownIcon className={`w-5 h-5 transition-transform ${showAnswerKey ? 'rotate-180' : ''}`} />
        </button>
        {showAnswerKey && (
          <div className="mt-4 space-y-4 text-sm">
            {exam.sections.map((section, sIndex) => (
              <div key={`ans-s-${sIndex}`}>
                <h4 className="font-bold">{section.title}</h4>
                <ol className="list-decimal pl-8">
                  {section.questions.map((q, qIndex) => (
                    <li key={`ans-q-${qIndex}`} className="mt-1" dangerouslySetInnerHTML={{ __html: exam.answerKey[sIndex]?.[qIndex] || '<i class="text-[var(--color-text-secondary)]">No answer provided.</i>' }} />
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamDisplay;