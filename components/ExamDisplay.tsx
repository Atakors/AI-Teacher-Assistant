import React, { useState } from 'react';
import { Exam } from '../types';
import { Document, Packer, Paragraph, TextRun, Numbering, Indent, AlignmentType } from 'docx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DownloadIcon, FileWordIcon, FilePdfIcon, BookmarkSquareIcon, ChevronDownIcon } from './constants';

interface ExamDisplayProps {
  exam: Exam | null;
  onSave: () => void;
}

const ExamDisplay: React.FC<ExamDisplayProps> = ({ exam, onSave }) => {
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  const handleExportWord = async () => {
    if (!exam) return;

    const doc = new Document({
      numbering: {
        config: [
          {
            reference: "default-numbering",
            levels: [
              {
                level: 0,
                format: "decimal",
                text: "%1.",
                style: {
                  paragraph: {
                    indent: { left: 720, hanging: 360 },
                  },
                },
              },
            ],
          },
        ],
      },
      sections: [{
        children: [
          new Paragraph({ text: exam.title, heading: "Title", alignment: AlignmentType.CENTER }),
          new Paragraph({ text: exam.instructions, alignment: AlignmentType.LEFT, spacing: { after: 200 } }),
          ...exam.sections.flatMap(section => [
            new Paragraph({ text: section.title, heading: "Heading2", spacing: { before: 400, after: 200 } }),
            ...section.questions.flatMap(q => {
              const questionParagraphs = [ new Paragraph({ text: q.questionText, numbering: { reference: "default-numbering", level: 0 } }) ];
              if (q.options) {
                q.options.forEach(opt => {
                  questionParagraphs.push(new Paragraph({ text: `  - ${opt}`, indent: { left: 1080 } }));
                });
              }
              questionParagraphs.push(new Paragraph({ text: "" })); // Add space after question
              return questionParagraphs;
            })
          ]),
          // Answer Key
          new Paragraph({ text: "Answer Key", pageBreakBefore: true, heading: "Title", alignment: AlignmentType.CENTER }),
          ...exam.sections.flatMap((section, sIndex) => [
            new Paragraph({ text: section.title, heading: "Heading2", spacing: { before: 400, after: 200 } }),
            ...section.questions.map((q, qIndex) => new Paragraph({
              children: [
                new TextRun({ text: `${qIndex + 1}. `, bold: true }),
                new TextRun(exam.answerKey[sIndex][qIndex] || 'N/A')
              ],
               indent: { left: 720 }
            }))
          ])
        ],
      }],
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

    doc.setFontSize(18);
    doc.text(exam.title, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(12);
    const instructions = doc.splitTextToSize(exam.instructions, doc.internal.pageSize.getWidth() - 30);
    doc.text(instructions, 15, yPos);
    yPos += instructions.length * 5 + 10;

    exam.sections.forEach((section, sIndex) => {
      if (yPos > 260) { doc.addPage(); yPos = 15; }
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(section.title, 15, yPos);
      yPos += 8;
      doc.setFont(undefined, 'normal');

      section.questions.forEach((q, qIndex) => {
        if (yPos > 270) { doc.addPage(); yPos = 15; }
        const questionText = `${qIndex + 1}. ${q.questionText}`;
        const splitQuestion = doc.splitTextToSize(questionText, doc.internal.pageSize.getWidth() - 30);
        doc.text(splitQuestion, 15, yPos);
        yPos += splitQuestion.length * 5 + 2;

        if (q.options) {
          q.options.forEach(opt => {
            if (yPos > 270) { doc.addPage(); yPos = 15; }
            doc.text(`  - ${opt}`, 20, yPos);
            yPos += 6;
          });
        }
        yPos += 4; // Space between questions
      });
    });

    // Answer Key on a new page
    doc.addPage();
    yPos = 15;
    doc.setFontSize(18);
    doc.text("Answer Key", doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
    yPos += 10;

    exam.sections.forEach((section, sIndex) => {
        if (yPos > 260) { doc.addPage(); yPos = 15; }
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(section.title, 15, yPos);
        yPos += 8;
        doc.setFont(undefined, 'normal');
        
        section.questions.forEach((q, qIndex) => {
            if (yPos > 270) { doc.addPage(); yPos = 15; }
            const answer = exam.answerKey[sIndex]?.[qIndex] || 'N/A';
            const answerText = `${qIndex + 1}. ${answer}`;
            const splitAnswer = doc.splitTextToSize(answerText, doc.internal.pageSize.getWidth() - 30);
            doc.text(splitAnswer, 15, yPos);
            yPos += splitAnswer.length * 5 + 4;
        });
    });

    doc.save(`${exam.title.replace(/ /g, '_')}.pdf`);
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
        <button onClick={onSave} className="interactive-glow bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center py-2 px-4 text-sm font-medium rounded-lg">
          <BookmarkSquareIcon className="w-5 h-5 mr-2" /> Save Exam
        </button>
        <div className="relative">
             <button onClick={handleExportWord} className="interactive-glow bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center py-2 px-4 text-sm font-medium rounded-l-lg">
                <FileWordIcon className="w-5 h-5 mr-2" /> Word
            </button>
        </div>
        <div className="relative">
             <button onClick={handleExportPdf} className="interactive-glow bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center py-2 px-4 text-sm font-medium rounded-r-lg -ml-px">
                <FilePdfIcon className="w-5 h-5 mr-2" /> PDF
            </button>
        </div>
      </div>

      <article className="prose prose-sm sm:prose-base max-w-none dark:prose-invert text-[var(--color-text-primary)]">
        <h1 className="text-center">{exam.title}</h1>
        <p className="text-sm italic text-center">{exam.instructions}</p>
        
        {exam.sections.map((section, sIndex) => (
          <div key={sIndex} className="mt-6">
            <h2 className="border-b border-[var(--color-border)] pb-2">{section.title}</h2>
            <ol className="list-decimal pl-5 space-y-4">
              {section.questions.map((q, qIndex) => (
                <li key={qIndex}>
                  <p className="font-medium">{q.questionText}</p>
                  {q.options && (
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {q.options.map((opt, oIndex) => <li key={oIndex}>{opt}</li>)}
                    </ul>
                  )}
                   {section.questionType === 'Short Answer' && <div className="border-b border-dashed border-[var(--color-text-secondary)] mt-4"></div>}
                   {section.questionType === 'Essay' && <div className="border-b border-dashed border-[var(--color-text-secondary)] mt-4 h-24"></div>}
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
                    <li key={`ans-q-${qIndex}`} className="mt-1">
                      {exam.answerKey[sIndex]?.[qIndex] || <span className="italic text-[var(--color-text-secondary)]">No answer provided.</span>}
                    </li>
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