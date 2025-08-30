
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, CurriculumLevel, WordGameType, WordGameData, Riddle, WordScramble, SentenceBuilder, OddOneOut, HiddenWord, CrosswordData } from '../types';
import { generateWordGameWithGemini } from '../services/geminiService';
import { decrementWordGameGeneratorCredits, getUserById } from '../services/dbService';
import { SparklesIcon, EyeIcon, EyeSlashIcon, PrinterIcon, PuzzlePieceIcon, DownloadIcon, ChevronDownIcon, FileWordIcon, FilePdfIcon, BookmarkSquareIcon } from './constants';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ShadingType, VerticalAlign } from 'docx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


interface WordGameGeneratorViewProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  onOpenPremiumModal: (featureName?: string) => void;
  onSaveGame: (name: string, gameType: WordGameType, level: CurriculumLevel, topic: string, gameData: WordGameData) => void;
}

const SegmentedButton: React.FC<{
  options: { label: string, value: string | number }[];
  selectedValue: string | number;
  onChange: (value: any) => void;
  disabled?: boolean;
}> = ({ options, selectedValue, onChange, disabled }) => (
  <div className="flex items-center p-1 rounded-lg w-full bg-[var(--color-surface-variant)]">
    {options.map(option => (
      <button
        key={option.value}
        onClick={() => onChange(option.value)}
        disabled={disabled}
        className={`w-full p-1.5 rounded-md text-sm font-medium transition-all text-center ${selectedValue === option.value ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface)]/50'}`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export const WordGameGeneratorView: React.FC<WordGameGeneratorViewProps> = ({ currentUser, setCurrentUser, onOpenPremiumModal, onSaveGame }) => {
  const [gameType, setGameType] = useState<WordGameType>('Riddle');
  const [level, setLevel] = useState<CurriculumLevel>(CurriculumLevel.PRIMARY_4);
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameData, setGameData] = useState<WordGameData | null>(null);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [copiesPerPage, setCopiesPerPage] = useState<number>(1);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [hiddenWordGridSize, setHiddenWordGridSize] = useState<number>(12);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const isGenerateDisabled = isLoading || !topic.trim() || count < 1;
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
            setIsExportMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGameTypeChange = (newGameType: WordGameType) => {
    setGameType(newGameType);
    setGameData(null);
    setError(null);
    setShowAllAnswers(false);
  };

  const handleGenerate = async () => {
    if (isGenerateDisabled) return;

    const freshUser = await getUserById(currentUser.uid);
    if (!freshUser) {
      setError("Could not verify your account status. Please try logging in again.");
      return;
    }
    if (freshUser.plan === 'free' && freshUser.wordGameGeneratorCredits <= 0) {
      onOpenPremiumModal('Word Game Generation');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGameData(null);

    try {
      const data = await generateWordGameWithGemini(gameType, level, topic, count, gameType === 'Hidden Word' ? hiddenWordGridSize : 12);
      setGameData(data);
      if (freshUser.plan === 'free') {
        await decrementWordGameGeneratorCredits(currentUser.uid);
        const updatedUser = await getUserById(currentUser.uid);
        if (updatedUser) setCurrentUser(updatedUser);
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'QUOTA_EXCEEDED') {
          setError('QUOTA_EXCEEDED_WORD_GAME_GENERATOR');
      } else {
          const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
          setError(`Failed to generate game: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePrint = () => {
      window.print();
  };
  
  const handleSaveGame = () => {
    if (!gameData) return;
    const name = window.prompt("Enter a name for this game:", `${gameType} - ${topic}`);
    if (name?.trim()) {
        onSaveGame(name.trim(), gameType, level, topic, gameData);
    }
  };
  
  const handleExportWord = async () => {
    if (!gameData) return;
    setIsExportMenuOpen(false);

    const createGameContentForCell = (planTopic: string, planGameType: WordGameType, planGameData: WordGameData): (Paragraph | Table)[] => {
        const content: (Paragraph | Table)[] = [];
        content.push(new Paragraph({ text: `${planGameType}: ${planTopic}`, heading: "Heading2", alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
        
        if (planGameType === 'Crossword') {
            const cwData = planGameData as CrosswordData;
            const clueNumberMap = new Map<string, number>();
            cwData.clues.forEach(clue => clueNumberMap.set(`${clue.row},${clue.col}`, clue.number));

            const gridTable = new Table({
                rows: cwData.grid.map((row, rIndex) => new TableRow({
                    children: row.map((cell, cIndex) => {
                        const key = `${rIndex},${cIndex}`;
                        const number = clueNumberMap.get(key);
                        const cellChildren: Paragraph[] = [];

                        if (number) {
                            cellChildren.push(new Paragraph({ children: [new TextRun({ text: String(number), size: 12, superScript: true })] }));
                        }
                        
                        if (cell) {
                            cellChildren.push(new Paragraph({ text: cell.toUpperCase(), alignment: AlignmentType.CENTER }));
                        }

                        return new TableCell({
                            children: cellChildren.length > 0 ? cellChildren : [new Paragraph('')],
                            shading: cell === null ? { fill: "000000", type: ShadingType.SOLID } : undefined,
                            width: { size: 5, type: WidthType.PERCENTAGE },
                            verticalAlign: VerticalAlign.CENTER,
                        });
                    })
                }))
            });
            content.push(gridTable);

            const across = cwData.clues.filter(c => c.direction === 'Across').sort((a, b) => a.number - b.number);
            const down = cwData.clues.filter(c => c.direction === 'Down').sort((a, b) => a.number - b.number);
            content.push(new Paragraph({ text: "Across", heading: "Heading3", spacing: { before: 200 } }));
            across.forEach(c => content.push(new Paragraph({ text: `${c.number}. ${c.clue} (${c.answer})` })));
            content.push(new Paragraph({ text: "Down", heading: "Heading3", spacing: { before: 200 } }));
            down.forEach(c => content.push(new Paragraph({ text: `${c.number}. ${c.clue} (${c.answer})` })));
            return content;
        }

        if (planGameType === 'Hidden Word') {
            const hwItem = planGameData as HiddenWord;
            if (hwItem.grid) {
                const gridTable = new Table({
                    rows: hwItem.grid.map(row => new TableRow({
                        children: row.map(cell => new TableCell({
                            children: [new Paragraph({ text: cell.toUpperCase(), alignment: AlignmentType.CENTER })],
                            width: { size: 5, type: WidthType.PERCENTAGE },
                        }))
                    }))
                });
                content.push(gridTable);
                content.push(new Paragraph({ text: "Words to find:", style: "IntenseQuote", spacing: { before: 200 } }));
                hwItem.words.forEach(word => content.push(new Paragraph({ text: word, bullet: { level: 0 } })));
            }
            return content;
        }


        (planGameData as any[]).forEach((item, index) => {
            content.push(new Paragraph({ text: `Item #${index + 1}`, style: "IntenseQuote", spacing: { before: 200 } }));
            
            switch(planGameType) {
                case 'Riddle':
                    (item as Riddle).clues.forEach(clue => content.push(new Paragraph({ text: clue, bullet: { level: 0 } })));
                    content.push(new Paragraph({ children: [new TextRun({ text: `Answer: ${(item as Riddle).answer}`, bold: true})]}));
                    break;
                case 'Word Scramble':
                    content.push(new Paragraph({ children: [new TextRun({ text: (item as WordScramble).scrambled, font: "Courier New" })], spacing: { after: 100 } }));
                     content.push(new Paragraph({ children: [new TextRun({ text: `Answer: ${(item as WordScramble).answer}`, bold: true})]}));
                    break;
                case 'Sentence Builder':
                    content.push(new Paragraph({ text: (item as SentenceBuilder).jumbled.join(' / '), spacing: { after: 100 } }));
                    content.push(new Paragraph({ children: [new TextRun({ text: `Answer: ${(item as SentenceBuilder).answer}`, bold: true})]}));
                    break;
                case 'Odd One Out':
                    content.push(new Paragraph({ text: (item as OddOneOut).words.join(', '), spacing: { after: 100 } }));
                    content.push(new Paragraph({ children: [new TextRun({ text: `Answer: ${(item as OddOneOut).answer}`, bold: true})]}));
                    break;
            }
        });
        return content;
    };

    const gameContent = createGameContentForCell(topic, gameType, gameData);
    let docChildren: (Table | Paragraph)[] = gameContent;

    if (copiesPerPage > 1) {
        const createCell = (content: (Paragraph | Table)[]) => new TableCell({ children: content, margins: { top: 100, bottom: 100, left: 100, right: 100 } });
        let table;
        if (copiesPerPage === 4) {
            table = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: [createCell(gameContent), createCell(gameContent)] }),
                    new TableRow({ children: [createCell(gameContent), createCell(gameContent)] }),
                ]
            });
        } else { // 2 copies
            table = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: [createCell(gameContent)] }),
                    new TableRow({ children: [createCell(gameContent)] }),
                ]
            });
        }
        docChildren = [table];
    }
    
    const doc = new Document({ sections: [{ properties: { page: { size: { width: 11906, height: 16838 } } }, children: docChildren }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${gameType}_${topic.replace(/ /g, '_')}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleExportPdf = () => {
    if (!gameData) return;
    setIsExportMenuOpen(false);
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 10;
    const gap = 10;

    const drawGameContent = (x: number, y: number, w: number, h: number) => {
        let currentY = y;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`${gameType}: ${topic}`, x + w / 2, currentY, { align: 'center', maxWidth: w });
        currentY += 10;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        if (gameType === 'Crossword') {
            const cwData = gameData as CrosswordData;
            const clueNumberMap = new Map<string, number>();
            cwData.clues.forEach(clue => clueNumberMap.set(`${clue.row},${clue.col}`, clue.number));
            const cellSize = Math.min( (w / cwData.grid[0].length) , ( (h - 60) / cwData.grid.length) );
            
            autoTable(doc, {
                body: cwData.grid,
                startY: currentY,
                theme: 'grid',
                styles: { cellWidth: cellSize, minCellHeight: cellSize, halign: 'center', valign: 'middle', fontSize: cellSize * 0.5, font: 'Courier'},
                margin: { left: x },
                didDrawCell: (data) => {
                    const cell = cwData.grid[data.row.index][data.column.index];
                    if (cell === null) {
                        doc.setFillColor(0, 0, 0);
                        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                    } else {
                        const clueNumber = clueNumberMap.get(`${data.row.index},${data.column.index}`);
                        if (clueNumber) {
                           doc.setFontSize(cellSize * 0.3);
                           doc.text(String(clueNumber), data.cell.x + 1, data.cell.y + 2);
                        }
                    }
                }
            });

            currentY = (doc as any).lastAutoTable.finalY + 10;

            const across = cwData.clues.filter(c => c.direction === 'Across').sort((a, b) => a.number - b.number);
            const down = cwData.clues.filter(c => c.direction === 'Down').sort((a, b) => a.number - b.number);
            
            autoTable(doc, {
                head: [['Across']],
                body: across.map(c => [`${c.number}. ${c.clue} (${c.answer})`]),
                startY: currentY,
                theme: 'striped',
                margin: { left: x, right: pageW - (x + w/2 - 5) },
            });
            autoTable(doc, {
                head: [['Down']],
                body: down.map(c => [`${c.number}. ${c.clue} (${c.answer})`]),
                startY: currentY,
                theme: 'striped',
                margin: { left: x + w/2 + 5, right: pageW - (x + w) },
            });

            return;
        }
        
        if (gameType === 'Hidden Word') {
            const hwItem = gameData as HiddenWord;
            if (hwItem.grid) {
                autoTable(doc, {
                    body: hwItem.grid.map(row => row.map(cell => cell.toUpperCase())),
                    startY: currentY,
                    theme: 'grid',
                    styles: { halign: 'center', valign: 'middle', fontSize: 8, font: 'Courier' },
                    margin: { left: x }
                });
                currentY = (doc as any).lastAutoTable.finalY + 5;
                doc.setFont('Helvetica', 'bold');
                doc.text("Words to find:", x, currentY);
                currentY += 5;
                doc.setFont('Helvetica', 'normal');
                autoTable(doc, {
                    body: hwItem.words.reduce((acc, word, i) => {
                        if (i % 3 === 0) acc.push([]);
                        acc[acc.length - 1].push(word);
                        return acc;
                    }, [] as string[][]),
                    startY: currentY,
                    theme: 'plain',
                    styles: { fontSize: 9 },
                    margin: { left: x }
                });
            }
            return;
        }

        (gameData as any[]).forEach((item, index) => {
            if (currentY > y + h - 20) return;
            
            doc.setFont(undefined, 'bold');
            doc.text(`Item #${index + 1}`, x, currentY);
            currentY += 5;
            doc.setFont(undefined, 'normal');

            switch(gameType) {
                case 'Riddle':
                    (item as Riddle).clues.forEach(clue => {
                        const lines = doc.splitTextToSize(`- ${clue}`, w);
                        doc.text(lines, x, currentY);
                        currentY += lines.length * 4;
                    });
                    doc.setFont(undefined, 'bold');
                    doc.text(`Answer: ${(item as Riddle).answer}`, x, currentY);
                    doc.setFont(undefined, 'normal');
                    break;
                case 'Word Scramble':
                    doc.setFont("Courier", 'normal');
                    doc.setFontSize(14);
                    doc.text((item as WordScramble).scrambled, x, currentY);
                    doc.setFont("Helvetica", 'normal');
                    doc.setFontSize(10);
                    currentY += 7;
                     doc.setFont(undefined, 'bold');
                    doc.text(`Answer: ${(item as WordScramble).answer}`, x, currentY);
                    doc.setFont(undefined, 'normal');
                    break;
                case 'Sentence Builder':
                    const jumbled = (item as SentenceBuilder).jumbled.join(' / ');
                    const lines = doc.splitTextToSize(jumbled, w);
                    doc.text(lines, x, currentY);
                    currentY += lines.length * 4 + 3;
                    doc.setFont(undefined, 'bold');
                    doc.text(`Answer: ${(item as SentenceBuilder).answer}`, x, currentY);
                    doc.setFont(undefined, 'normal');
                    break;
                case 'Odd One Out':
                    const words = (item as OddOneOut).words.join(', ');
                    const wordLines = doc.splitTextToSize(words, w);
                    doc.text(wordLines, x, currentY);
                    currentY += wordLines.length * 4 + 3;
                    doc.setFont(undefined, 'bold');
                    doc.text(`Answer: ${(item as OddOneOut).answer}`, x, currentY);
                    doc.setFont(undefined, 'normal');
                    break;
            }
            currentY += 5;
        });
    };

    if (copiesPerPage === 1) {
        drawGameContent(margin, margin, pageW - margin * 2, pageH - margin * 2);
    } else if (copiesPerPage === 2) {
        const h = (pageH - margin * 2 - gap) / 2;
        drawGameContent(margin, margin, pageW - margin * 2, h);
        doc.line(margin, margin + h + gap/2, pageW - margin, margin + h + gap/2);
        drawGameContent(margin, margin + h + gap, pageW - margin * 2, h);
    } else if (copiesPerPage === 4) {
        const w = (pageW - margin * 2 - gap) / 2;
        const h = (pageH - margin * 2 - gap) / 2;
        drawGameContent(margin, margin, w, h);
        doc.line(margin + w + gap/2, margin, margin + w + gap/2, margin + h);
        drawGameContent(margin + w + gap, margin, w, h);
        doc.line(margin, margin + h + gap/2, pageW - margin, margin + h + gap/2);
        drawGameContent(margin, margin + h + gap, w, h);
        doc.line(margin + w + gap/2, margin + h + gap, margin + w + gap/2, pageH-margin);
        drawGameContent(margin + w + gap, margin + h + gap, w, h);
    }
    
    doc.save(`${gameType}_${topic.replace(/ /g, '_')}.pdf`);
  };

  const gameTypeOptions: { label: string, value: WordGameType }[] = [
    { label: 'Riddles', value: 'Riddle' },
    { label: 'Word Scramble', value: 'Word Scramble' },
    { label: 'Sentence Builder', value: 'Sentence Builder' },
    { label: 'Odd One Out', value: 'Odd One Out' },
    { label: 'Hidden Word', value: 'Hidden Word' },
    { label: 'Crossword', value: 'Crossword' },
  ];
  
  const levelOptions: { label: string, value: CurriculumLevel }[] = [
      { label: 'Year 4', value: CurriculumLevel.PRIMARY_4 },
      { label: 'Year 5', value: CurriculumLevel.PRIMARY_5 },
  ];

  const renderGameContent = () => {
    if (!gameData) return null;

    let content;

    switch (gameType) {
        case 'Riddle':
        case 'Word Scramble':
        case 'Sentence Builder':
        case 'Odd One Out':
            content = (
                <div className="space-y-4">
                    {(gameData as any[]).map((item, index) => (
                        <div key={index} className="material-card p-4 printable-item">
                            <p className="font-semibold text-sm text-[var(--color-on-surface-variant)] mb-2 print:text-gray-600">Item #{index + 1}</p>
                            {gameType === 'Riddle' && (
                                <div>
                                    <ul className="list-disc list-inside space-y-1 text-base print:text-black">
                                        {(item as Riddle).clues.map((clue, i) => <li key={i}>{clue}</li>)}
                                    </ul>
                                    {showAllAnswers && <p className="mt-2 text-[var(--color-primary)] font-semibold printable-answer">Answer: {(item as Riddle).answer}</p>}
                                </div>
                            )}
                            {gameType === 'Word Scramble' && (
                                <div>
                                    <p className="text-2xl font-mono tracking-widest text-[var(--color-on-surface)] print:text-black">{(item as WordScramble).scrambled}</p>
                                    {showAllAnswers && <p className="mt-2 text-[var(--color-primary)] font-semibold printable-answer">Answer: {(item as WordScramble).answer}</p>}
                                </div>
                            )}
                            {gameType === 'Sentence Builder' && (
                                <div>
                                    <p className="text-lg font-medium text-[var(--color-on-surface)] print:text-black">{(item as SentenceBuilder).jumbled.join(' / ')}</p>
                                    {showAllAnswers && <p className="mt-2 text-[var(--color-primary)] font-semibold printable-answer">Answer: {(item as SentenceBuilder).answer}</p>}
                                </div>
                            )}
                            {gameType === 'Odd One Out' && (
                                <div>
                                    <p className="text-lg font-medium text-[var(--color-on-surface)] print:text-black">{(item as OddOneOut).words.join(', ')}</p>
                                    {showAllAnswers && <p className="mt-2 text-[var(--color-primary)] font-semibold printable-answer">Answer: {(item as OddOneOut).answer} (Category: {(item as OddOneOut).category})</p>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            );
            break;

        case 'Hidden Word':
            const hwData = gameData as HiddenWord;
            content = hwData.grid ? (
                <div className="material-card p-4 printable-item">
                    <div className="grid gap-1 p-2 bg-[var(--color-surface-variant)] rounded-md" style={{ gridTemplateColumns: `repeat(${hwData.grid[0]?.length || 10}, minmax(0, 1fr))` }}>
                        {hwData.grid.flat().map((letter, i) => (
                            <div key={i} className="flex items-center justify-center aspect-square font-mono text-lg bg-[var(--color-surface)] rounded-sm print:text-black">
                                {letter.toUpperCase()}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4">
                        <h4 className="font-semibold text-base mb-2 print:text-black">Words to find:</h4>
                        {showAllAnswers ? (
                            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-base print:text-black">
                                {hwData.words.map((word, i) => <li key={i}>{word}</li>)}
                            </ul>
                        ) : (
                            <p className="text-[var(--color-on-surface-variant)] italic">Click "Show" to reveal the word list.</p>
                        )}
                    </div>
                </div>
            ) : <ErrorMessage message="Invalid Hidden Word data received." />;
            break;

        case 'Crossword':
            const cwData = gameData as CrosswordData;
            if (!cwData.grid || !cwData.clues) {
                content = <ErrorMessage message="Invalid crossword data received." />;
                break;
            }
            const clueNumberMap = new Map<string, number>();
            cwData.clues.forEach(clue => {
                clueNumberMap.set(`${clue.row},${clue.col}`, clue.number);
            });
            content = (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="overflow-x-auto">
                        <div
                            className="grid border-2 border-gray-700 print:border-black mx-auto"
                            style={{
                                gridTemplateColumns: `repeat(${cwData.grid[0]?.length || 1}, minmax(0, 1fr))`,
                                width: '100%',
                                maxWidth: '32rem',
                            }}
                        >
                            {cwData.grid.map((row, rIndex) =>
                                row.map((cell, cIndex) => {
                                    const key = `${rIndex},${cIndex}`;
                                    const number = clueNumberMap.get(key);
                                    return (
                                        <div key={key} className={`relative aspect-square border border-gray-300 print:border-gray-500 flex items-center justify-center ${cell === null ? 'bg-gray-800 print:bg-black' : 'bg-white print:bg-white'}`}>
                                            {number && <span className="absolute top-0 left-0.5 text-[0.6rem] font-bold text-gray-600 print:text-black">{number}</span>}
                                            {showAllAnswers && cell && <span className="text-lg font-semibold text-gray-900 print:text-black">{cell}</span>}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                        <div>
                            <h4 className="font-semibold text-lg mb-2 border-b-2 border-[var(--color-primary)] pb-1 print:text-black">Across</h4>
                            <ul className="space-y-3">
                                {cwData.clues.filter(c => c.direction === 'Across').sort((a, b) => a.number - b.number).map(clue => (
                                    <li key={`across-${clue.number}`} className="text-base print:text-black">
                                        <strong>{clue.number}.</strong> {clue.clue}
                                        {showAllAnswers && <span className="ml-2 text-[var(--color-primary)] font-semibold printable-answer">({clue.answer})</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg mb-2 border-b-2 border-[var(--color-primary)] pb-1 print:text-black">Down</h4>
                            <ul className="space-y-3">
                                {cwData.clues.filter(c => c.direction === 'Down').sort((a, b) => a.number - b.number).map(clue => (
                                    <li key={`down-${clue.number}`} className="text-base print:text-black">
                                        <strong>{clue.number}.</strong> {clue.clue}
                                        {showAllAnswers && <span className="ml-2 text-[var(--color-primary)] font-semibold printable-answer">({clue.answer})</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            );
            break;
        default:
            content = <ErrorMessage message="Unknown game type." />;
    }

    return (
        <div className="game-content-wrapper">
            <h3 className="text-xl font-bold mb-4 text-center print:text-black">
                {gameType}: {topic}
            </h3>
            {content}
        </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-on-bg)]">
          Word Game Generator
          <PuzzlePieceIcon className="w-8 h-8 ml-2" style={{ color: 'var(--color-primary)' }} />
        </h2>
        <p className="text-[var(--color-on-surface-variant)] mt-2">Create fun, curriculum-based word games for your students.</p>
      </div>

      <div className="material-card p-6 sm:p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Game Type</label>
          <SegmentedButton options={gameTypeOptions.map(o => ({label: o.label, value: o.value}))} selectedValue={gameType} onChange={handleGameTypeChange} disabled={isLoading} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Curriculum Level</label>
              <select value={level} onChange={e => setLevel(e.target.value as CurriculumLevel)} disabled={isLoading} className="w-full p-3">
                {levelOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Topic</label>
                <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Healthy Food" className="w-full p-3" disabled={isLoading}/>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Number of Items</label>
                <input type="number" value={count} onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))} min="1" max="20" className="w-full p-3" disabled={isLoading}/>
            </div>
        </div>

        {gameType === 'Hidden Word' && (
            <div>
                <label className="block text-sm font-medium text-center mb-2">Grid Size</label>
                <SegmentedButton 
                    options={[ { label: '10x10', value: 10 }, { label: '12x12', value: 12 }, { label: '15x15', value: 15 } ]}
                    selectedValue={hiddenWordGridSize}
                    onChange={setHiddenWordGridSize}
                    disabled={isLoading}
                />
            </div>
        )}

        <div className="pt-4 border-t border-[var(--color-outline)]">
          <p className="text-xs text-center text-[var(--color-on-surface-variant)] mb-2">
            This will consume 1 word game credit. You have {currentUser.wordGameGeneratorCredits} remaining.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerateDisabled}
            className="w-full material-button material-button-primary py-3"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            {isLoading ? 'Generating...' : 'Generate Game'}
          </button>
        </div>

        {isLoading ? (
          <div className="pt-4 border-t border-[var(--color-outline)]">
            <LoadingSpinner text="Generating your game..." />
          </div>
        ) : error ? (
           <div className="pt-4 border-t border-[var(--color-outline)]">
            {error === 'QUOTA_EXCEEDED_WORD_GAME_GENERATOR' ? (
                <div className="text-center p-8">
                    <p className="text-lg font-medium text-[var(--color-on-surface)]">
                      Word Game Generator under maintenance, be back soon.
                    </p>
                </div>
            ) : (
                <ErrorMessage message={error} />
            )}
           </div>
        ) : gameData && (
            <div className="pt-6 border-t border-[var(--color-outline)] space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-xl font-semibold">Generated Game</h3>
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                         <button onClick={() => setShowAllAnswers(!showAllAnswers)} className="material-button material-button-secondary text-sm flex items-center">
                           {showAllAnswers ? <EyeSlashIcon className="w-5 h-5 mr-2" /> : <EyeIcon className="w-5 h-5 mr-2" />}
                            {showAllAnswers ? 'Hide Answers' : 'Show Answers'}
                         </button>
                         <div className="flex items-center gap-2">
                             <label htmlFor="copies-select" className="text-sm font-medium">Copies:</label>
                             <select id="copies-select" value={copiesPerPage} onChange={e => setCopiesPerPage(Number(e.target.value))} className="p-2 rounded-md">
                                <option value={1}>1 per page</option>
                                <option value={2}>2 per page</option>
                                <option value={4}>4 per page</option>
                             </select>
                         </div>
                         <button onClick={handlePrint} className="material-button material-button-secondary text-sm flex items-center">
                            <PrinterIcon className="w-5 h-5 mr-2" /> Print
                         </button>
                        <div className="relative" ref={exportMenuRef}>
                           <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="material-button material-button-secondary text-sm flex items-center">
                             <DownloadIcon className="w-5 h-5 mr-2" /> Download <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`}/>
                           </button>
                           {isExportMenuOpen && (
                             <div className="absolute right-0 top-full mt-1 w-40 origin-top-right bg-[var(--color-surface)] border border-[var(--color-outline)] rounded-md shadow-lg z-10">
                                <button onClick={handleExportWord} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-surface-variant)]"><FileWordIcon className="w-4 h-4" /> Word (.docx)</button>
                                <button onClick={handleExportPdf} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-surface-variant)]"><FilePdfIcon className="w-4 h-4" /> PDF</button>
                             </div>
                           )}
                        </div>
                        <button onClick={handleSaveGame} className="material-button material-button-primary text-sm flex items-center">
                          <BookmarkSquareIcon className="w-5 h-5 mr-2" /> Save
                        </button>
                    </div>
                </div>

                <div className="no-print">
                   {renderGameContent()}
                </div>
                
                {/* Print-only container */}
                <div id="printable-area">
                    <div className={`printable-copies-container copies-${copiesPerPage}`}>
                        {Array.from({ length: copiesPerPage }).map((_, i) => (
                            <div key={i} className="printable-copy-instance">
                                {renderGameContent()}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
