import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { SparklesIcon, XIcon, SaveIcon, TrashIcon, ChevronDownIcon } from './constants';
import { CurriculumLevel, CanvasSequence, CanvasLesson, User } from '../types';
import { generateSpinnerItemsForLesson } from '../services/geminiService';
import { getUserById, decrementWordGameGeneratorCredits } from '../services/dbService';
import { YEAR_3_CANVAS_STRUCTURE_DATA } from './constants_year3';
import { YEAR_4_CANVAS_STRUCTURE_DATA } from './constants_year4';
import { YEAR_5_CANVAS_STRUCTURE_DATA } from './constants_year5';
import { CURRICULUM_LEVEL_OPTIONS_FOR_VIEW } from './constants';
import CurriculumAccordion from './CurriculumAccordion';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const defaultItems = [
    'Amira', 'Youssef', 'Fatima', 'Karim', 'Lina', 'Mehdi', 'Sofia', 'Anis'
];

interface DigitalSpinnerViewProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  onOpenPremiumModal: (featureName?: string) => void;
  setNotification: (notification: { message: string, type: 'success' | 'error' } | null) => void;
}

const generateColors = (count: number): string[] => {
    const colors: string[] = [];
    const saturation = 70;
    const lightness = 60;
    for (let i = 0; i < count; i++) {
        const hue = (i * (360 / count)) % 360;
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
};

// --- Sound Effects Hook ---
const useSounds = () => {
    const audioCtxRef = useRef<AudioContext | null>(null);

    const playTick = useCallback(() => {
        if (!audioCtxRef.current) return;
        const oscillator = audioCtxRef.current.createOscillator();
        const gainNode = audioCtxRef.current.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.05);
        oscillator.start();
        oscillator.stop(audioCtxRef.current.currentTime + 0.05);
    }, []);
    
    const playWinnerSound = useCallback(() => {
        if (!audioCtxRef.current) return;
        const notes = [659.25, 783.99, 987.77, 1318.51]; // E5, G5, B5, E6
        notes.forEach((freq, i) => {
            const oscillator = audioCtxRef.current!.createOscillator();
            const gainNode = audioCtxRef.current!.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtxRef.current!.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, audioCtxRef.current!.currentTime + i * 0.1);
            gainNode.gain.setValueAtTime(0.2, audioCtxRef.current!.currentTime + i * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current!.currentTime + i * 0.1 + 0.2);
            oscillator.start(audioCtxRef.current!.currentTime + i * 0.1);
            oscillator.stop(audioCtxRef.current!.currentTime + i * 0.1 + 0.2);
        });
    }, []);

    const enableAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    };

    return { playTick, playWinnerSound, enableAudio };
};

// --- Confetti Hook ---
const useConfetti = (isFiring: boolean) => {
    const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isFiring || !confettiCanvasRef.current) return;
        
        const canvas = confettiCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        const confetti: { x: number; y: number; size: number; speed: number; angle: number; color: string, rotation: number, rotationSpeed: number }[] = [];
        const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

        const resizeCanvas = () => {
            canvas.width = canvas.parentElement!.clientWidth;
            canvas.height = canvas.parentElement!.clientHeight;
        };
        resizeCanvas();

        const createConfetti = () => {
            for (let i = 0; i < 100; i++) {
                confetti.push({
                    x: canvas.width / 2,
                    y: canvas.height,
                    size: Math.random() * 5 + 2,
                    speed: Math.random() * 8 + 4,
                    angle: Math.random() * Math.PI - (Math.PI * 3 / 4),
                    color: colors[Math.floor(Math.random() * colors.length)],
                    rotation: Math.random() * 2 * Math.PI,
                    rotationSpeed: Math.random() * 0.1 - 0.05,
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            confetti.forEach((p, i) => {
                p.x += Math.cos(p.angle) * p.speed;
                p.y += Math.sin(p.angle) * p.speed;
                p.speed *= 0.98; // gravity/drag
                p.rotation += p.rotationSpeed;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();

                if (p.size < 0.5) confetti.splice(i, 1);
            });
            animationFrameId = requestAnimationFrame(draw);
        };
        
        createConfetti();
        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isFiring]);

    return confettiCanvasRef;
};


const WinnerModal: React.FC<{ title: string; winner: string; onClose: () => void; playSound: () => void }> = ({ title, winner, onClose, playSound }) => {
    useEffect(() => {
        playSound();
    }, [playSound]);
    
    const confettiCanvasRef = useConfetti(true);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="winner-title">
            <canvas ref={confettiCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
            <div className="relative material-card text-center p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <p id="winner-title" className="text-sm font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider">{title}</p>
                <h2 className="text-4xl sm:text-5xl font-bold my-4 text-[var(--color-primary)] break-words">{winner}</h2>
                <button onClick={onClose} className="material-button material-button-primary mt-4">
                    Awesome!
                </button>
            </div>
        </div>
    );
};

const SegmentedButton: React.FC<{
  options: { label: string, value: any }[];
  selectedValue: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}> = ({ options, selectedValue, onChange, disabled }) => (
  <div className="flex items-center p-1 rounded-lg w-full bg-[var(--color-surface-variant)]">
    {options.map(option => (
      <button
        key={option.label}
        onClick={() => onChange(option.value)}
        disabled={disabled}
        className={`w-full p-1.5 rounded-md text-xs font-medium transition-all text-center ${selectedValue === option.value ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface)]/50'}`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const DigitalSpinnerView: React.FC<DigitalSpinnerViewProps> = ({ currentUser, setCurrentUser, onOpenPremiumModal, setNotification }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [items, setItems] = useState<string[]>(defaultItems);
    const [originalItems, setOriginalItems] = useState<string[]>(defaultItems);
    const [itemInput, setItemInput] = useState(defaultItems.join('\n'));
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [winnerTitle, setWinnerTitle] = useState('The winner is...');

    // Options State
    const [removeWinner, setRemoveWinner] = useState(true);
    const [spinDuration, setSpinDuration] = useState(6000);
    const [soundsEnabled, setSoundsEnabled] = useState(true);
    const [savedLists, setSavedLists] = useState<{ [name: string]: string[] }>({});
    
    // AI Generator State
    const [listSource, setListSource] = useState<'manual' | 'ai'>('manual');
    const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumLevel | null>(currentUser.defaultCurriculum);
    const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<CanvasLesson | null>(null);
    const [aiContentType, setAiContentType] = useState<'questions' | 'vocabulary' | 'prompts'>('questions');
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    // UI State
    const [activeTab, setActiveTab] = useState<'list' | 'options' | 'ai'>('list');

    const currentAngleRef = useRef(0);
    const tickIntervalRef = useRef<number | null>(null);
    const { playTick, playWinnerSound, enableAudio } = useSounds();

    const colors = useMemo(() => generateColors(items.length), [items.length]);

    const curriculumDataMap = useMemo((): Record<string, CanvasSequence[]> => ({
        [CurriculumLevel.PRIMARY_3]: YEAR_3_CANVAS_STRUCTURE_DATA,
        [CurriculumLevel.PRIMARY_4]: YEAR_4_CANVAS_STRUCTURE_DATA,
        [CurriculumLevel.PRIMARY_5]: YEAR_5_CANVAS_STRUCTURE_DATA,
    }), []);

    const availableSequences = useMemo(() => {
        return selectedCurriculum ? curriculumDataMap[selectedCurriculum] || [] : [];
    }, [selectedCurriculum, curriculumDataMap]);
    
    const isAiGenerationAllowed = selectedLesson !== null;

    useEffect(() => {
        try {
            const storedLists = localStorage.getItem('spinner_lists');
            if (storedLists) {
                setSavedLists(JSON.parse(storedLists));
            }
        } catch (e) {
            console.error("Failed to load saved lists from localStorage:", e);
        }
    }, []);

    const drawSpinner = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const radius = canvas.width / 2;
        const centerX = radius;
        const centerY = radius;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // --- Start drawing rotating parts ---
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(currentAngleRef.current);
        ctx.translate(-centerX, -centerY);

        const arc = 2 * Math.PI / (items.length || 1);

        // Draw Segments
        items.forEach((item, i) => {
            const angle = i * arc;
            ctx.beginPath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius * 0.95, angle, angle + arc);
            ctx.lineTo(centerX, centerY);
            ctx.fill();
        });

        // Draw separator lines
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        items.forEach((_, i) => {
            const angle = i * arc;
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + radius * 0.95 * Math.cos(angle), centerY + radius * 0.95 * Math.sin(angle));
        });
        ctx.stroke();

        // Draw Text
        items.forEach((item, i) => {
            const angle = i * arc;
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle + arc / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = "#fff";
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 4;
            ctx.font = `bold ${radius / 16}px Inter`;
            const text = item.length > 15 ? item.substring(0, 13) + '...' : item;
            ctx.fillText(text, radius * 0.82, 5);
            ctx.restore();
        });

        ctx.restore(); // Restore from rotation

        // --- Draw static parts on top ---

        // Draw Center Hub
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.2, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#4b5563'; // gray-600
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.18, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#9ca3af'; // gray-400
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.17, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#6b7280'; // gray-500
        ctx.fill();

        // Draw Pointer
        ctx.save();
        ctx.fillStyle = '#1f2937'; // gray-800
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 15, 0);
        ctx.lineTo(centerX + 15, 0);
        ctx.lineTo(centerX, 30);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // Add a little highlight to the pointer
        ctx.fillStyle = '#4b5563';
        ctx.beginPath();
        ctx.moveTo(centerX - 10, 2);
        ctx.lineTo(centerX + 10, 2);
        ctx.lineTo(centerX, 22);
        ctx.closePath();
        ctx.fill();

    }, [items, colors]);


    useEffect(() => {
        const canvas = canvasRef.current;
        const container = canvas?.parentElement;
        if (!canvas || !container) return;

        const resizeCanvas = () => {
            const size = Math.min(container.clientWidth, 500);
            canvas.width = size;
            canvas.height = size;
            drawSpinner();
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [drawSpinner]);

    const handleSpin = () => {
        if (isSpinning || items.length < 2) return;
        
        if (soundsEnabled) enableAudio();

        setIsSpinning(true);
        setWinner(null);

        if (soundsEnabled) {
            tickIntervalRef.current = window.setInterval(playTick, 50);
        }

        const spinAngle = Math.random() * 2 * Math.PI + 10 * Math.PI;
        const start = performance.now();
        const startAngle = currentAngleRef.current;

        const animate = (time: number) => {
            const elapsed = time - start;
            const progress = Math.min(elapsed / spinDuration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            currentAngleRef.current = startAngle + spinAngle * easeOut;
            drawSpinner();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (tickIntervalRef.current) {
                    clearInterval(tickIntervalRef.current);
                    tickIntervalRef.current = null;
                }

                const totalItems = items.length;
                const degreesPerSlice = 360 / totalItems;
                const finalRotationDegrees = (currentAngleRef.current * 180 / Math.PI);
                const winningAngle = (270 - finalRotationDegrees % 360 + 360) % 360;
                const winnerIndex = Math.floor(winningAngle / degreesPerSlice);
                
                const selectedWinner = items[winnerIndex];
                
                let title = 'The winner is...';
                if (listSource === 'ai') {
                    switch (aiContentType) {
                        case 'questions': title = 'Your Question Is...'; break;
                        case 'vocabulary': title = 'Vocabulary Word:'; break;
                        case 'prompts': title = 'Discussion Prompt:'; break;
                        default: title = 'Selected Item:';
                    }
                }
                setWinnerTitle(title);
                setWinner(selectedWinner);
                
                if (removeWinner && items.length > 1) {
                    const newItems = items.filter((_, i) => i !== winnerIndex);
                    setItems(newItems);
                    setItemInput(newItems.join('\n'));
                }
                setIsSpinning(false);
            }
        };

        requestAnimationFrame(animate);
    };

    const handleItemInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setItemInput(newText);
        const newItems = newText.split('\n').map(item => item.trim()).filter(Boolean);
        setItems(newItems);
        setOriginalItems(newItems);
        setListSource('manual');
    };
    
    const handleReset = () => {
        setItems(originalItems);
        setItemInput(originalItems.join('\n'));
        setListSource('manual');
    };

    const handleSaveList = () => {
        const listName = prompt("Enter a name for this list:", "My Students");
        if (listName && listName.trim()) {
            const newSavedLists = { ...savedLists, [listName.trim()]: originalItems };
            setSavedLists(newSavedLists);
            localStorage.setItem('spinner_lists', JSON.stringify(newSavedLists));
        }
    };
    
    const handleLoadList = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const listName = e.target.value;
        if (listName && savedLists[listName]) {
            const newItems = savedLists[listName];
            setItems(newItems);
            setOriginalItems(newItems);
            setItemInput(newItems.join('\n'));
            setListSource('manual');
        }
    };

    const handleDeleteList = () => {
        const select = document.getElementById('saved-lists-select') as HTMLSelectElement;
        const listName = select?.value;
        if (listName && window.confirm(`Are you sure you want to delete the list "${listName}"?`)) {
            const newSavedLists = { ...savedLists };
            delete newSavedLists[listName];
            setSavedLists(newSavedLists);
            localStorage.setItem('spinner_lists', JSON.stringify(newSavedLists));
        }
    };

    const handleGenerateAiItems = async () => {
        if (!isAiGenerationAllowed) {
            setAiError("Please select a lesson to generate content from.");
            return;
        }

        const freshUser = await getUserById(currentUser.uid);
        if (!freshUser) {
            setAiError("Could not verify your account status. Please try logging in again.");
            return;
        }

        if (freshUser.plan === 'free' && freshUser.wordGameGeneratorCredits <= 0) {
            onOpenPremiumModal('AI Spinner Content');
            return;
        }

        setIsGeneratingAi(true);
        setAiError(null);
        
        try {
            const sequence = availableSequences.find(s => s.id === selectedSequenceId);
            const section = sequence?.sections.find(sec => sec.id === selectedSectionId);

            const context = {
                level: selectedCurriculum!,
                sequence: sequence?.title || '',
                section: section?.name || '',
                lesson: selectedLesson!.name,
            };

            const newItems = await generateSpinnerItemsForLesson(context, aiContentType);

            setItems(newItems);
            setItemInput(newItems.join('\n'));
            setOriginalItems(newItems);
            setListSource('ai');
            setNotification({ message: `Successfully generated ${newItems.length} items for the spinner!`, type: 'success' });
            
            if (freshUser.plan === 'free') {
                await decrementWordGameGeneratorCredits(currentUser.uid, 1);
                const updatedUser = await getUserById(currentUser.uid);
                if (updatedUser) setCurrentUser(updatedUser);
            }
            
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setAiError(errorMessage);
        } finally {
            setIsGeneratingAi(false);
        }
    };
    
    const TabButton: React.FC<{ tabId: 'list' | 'options' | 'ai', label: string }> = ({ tabId, label }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`w-full py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tabId ? 'text-[var(--color-primary)] border-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] border-transparent hover:text-[var(--color-on-surface)]'}`}
        >
            {label}
        </button>
    );

    return (
        <>
            <div className="w-full max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-on-bg)]">
                        Digital Spinner
                        <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-primary)' }} />
                    </h2>
                    <p className="text-[var(--color-on-surface-variant)] mt-2">A fun and fair way to pick names, topics, or anything else!</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <div className="lg:w-1/3 w-full">
                        <div className="material-card p-4 sm:p-6 lg:sticky top-8">
                            <div className="flex border-b border-[var(--color-outline)] mb-4">
                                <TabButton tabId="list" label="List" />
                                <TabButton tabId="options" label="Options" />
                                <TabButton tabId="ai" label="AI Generator" />
                            </div>

                            <div className="space-y-6">
                                {activeTab === 'list' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="spinner-items" className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">Spinner Items</label>
                                            <textarea id="spinner-items" rows={8} className="mt-1 block w-full text-base sm:text-sm resize-y" value={itemInput} onChange={handleItemInputChange} placeholder="Enter one item per line..."/>
                                            <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">{items.length} items currently on the wheel.</p>
                                        </div>
                                         <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-[var(--color-on-surface)]">Saved Lists</h3>
                                            {Object.keys(savedLists).length > 0 ? (
                                                <div className="flex gap-2">
                                                    <select id="saved-lists-select" onChange={handleLoadList} className="w-full p-2 text-sm">
                                                        <option>-- Load a list --</option>
                                                        {Object.keys(savedLists).map(name => <option key={name} value={name}>{name}</option>)}
                                                    </select>
                                                    <button onClick={handleDeleteList} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full" title="Delete selected list"><TrashIcon className="w-5 h-5"/></button>
                                                </div>
                                            ) : <p className="text-xs text-center text-[var(--color-on-surface-variant)]">No lists saved yet.</p>}
                                            <button onClick={handleSaveList} className="material-button material-button-secondary w-full text-xs flex items-center justify-center gap-1"><SaveIcon className="w-4 h-4" /> Save Current List</button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'options' && (
                                    <div className="space-y-4">
                                        <label className="flex items-center p-2 cursor-pointer rounded-lg hover:bg-[var(--color-surface-variant)]"><input type="checkbox" checked={removeWinner} onChange={(e) => setRemoveWinner(e.target.checked)} /><span className="ml-2 text-xs">Remove winner after spin</span></label>
                                        <label className="flex items-center p-2 cursor-pointer rounded-lg hover:bg-[var(--color-surface-variant)]"><input type="checkbox" checked={soundsEnabled} onChange={(e) => setSoundsEnabled(e.target.checked)} /><span className="ml-2 text-xs">Enable sound effects</span></label>
                                        <div>
                                            <label className="block text-xs font-medium text-center mb-2">Spin Duration</label>
                                            <SegmentedButton options={[{label: 'Short', value: 3000}, {label: 'Medium', value: 6000}, {label: 'Long', value: 10000}]} selectedValue={spinDuration} onChange={setSpinDuration} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'ai' && (
                                    <div className="p-1 space-y-4">
                                      <p className="text-xs text-center text-[var(--color-on-surface-variant)]">Generate curriculum-based questions or vocabulary for the spinner.</p>
                                      <select value={selectedCurriculum || ''} onChange={e => setSelectedCurriculum(e.target.value as CurriculumLevel)} className="w-full p-2 text-sm">
                                          <option value="" disabled>-- Select a Year --</option>
                                          {CURRICULUM_LEVEL_OPTIONS_FOR_VIEW.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                      </select>
                                      {selectedCurriculum && <CurriculumAccordion sequences={availableSequences} selectedSequenceId={selectedSequenceId} selectedSectionId={selectedSectionId} selectedLesson={selectedLesson} onSequenceChange={setSelectedSequenceId} onSectionChange={setSelectedSectionId} onLessonChange={setSelectedLesson} />}
                                      <div>
                                          <label className="block text-xs text-center font-medium mb-1">Content Type</label>
                                           <SegmentedButton options={[{label: 'Questions', value: 'questions'}, {label: 'Vocabulary', value: 'vocabulary'}, {label: 'Prompts', value: 'prompts'}]} selectedValue={aiContentType} onChange={setAiContentType} />
                                      </div>
                                      {aiError && <ErrorMessage message={aiError} />}
                                      <button onClick={handleGenerateAiItems} disabled={isGeneratingAi || !isAiGenerationAllowed} className="w-full material-button material-button-primary text-xs">
                                          {isGeneratingAi ? <LoadingSpinner text="Generating..."/> : 'Generate Items'}
                                      </button>
                                       <p className="text-xs text-center text-[var(--color-on-surface-variant)]">Uses 1 Word Game credit. You have <span className="font-bold text-[var(--color-on-surface)]">{currentUser.wordGameGeneratorCredits}</span>.</p>
                                  </div>
                                )}
                            </div>
                            
                            <div className="pt-4 mt-6 border-t border-[var(--color-outline)] flex gap-2">
                                <button onClick={handleReset} className="material-button material-button-secondary w-full text-sm">Reset List</button>
                                <button onClick={handleSpin} disabled={isSpinning || items.length < 2} className="material-button material-button-primary w-full text-lg font-semibold py-3">
                                    {isSpinning ? '...' : 'Spin!'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="lg:w-2/3 w-full flex-grow flex items-center justify-center">
                        <div
                          className={`w-full max-w-xl aspect-square ${!isSpinning && items.length > 1 ? 'cursor-pointer' : ''}`}
                          onClick={handleSpin}
                          role="button"
                          aria-label="Spin the wheel"
                          tabIndex={0}
                        >
                            <canvas ref={canvasRef} className="w-full h-full"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            {winner && <WinnerModal title={winnerTitle} winner={winner} onClose={() => setWinner(null)} playSound={soundsEnabled ? playWinnerSound : () => {}} />}
        </>
    );
};

export default DigitalSpinnerView;
