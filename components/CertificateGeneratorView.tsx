
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { User } from '../types';
// FIX: Removed ColorSwatchIcon and EyeDropperIcon as they are not exported from the constants file.
import { SparklesIcon, PrinterIcon, ZoomInIcon, ZoomOutIcon, PhotoIcon, TrashIcon, ChevronDownIcon } from './constants';
import { generateCertificateIdeas } from '../services/geminiService';
import { getUserById, decrementWordGameGeneratorCredits } from '../services/dbService';
import LoadingSpinner from './LoadingSpinner';

interface CertificateGeneratorViewProps {
    currentUser: User;
    setCurrentUser: (user: User) => void;
    onOpenPremiumModal: (featureName?: string) => void;
    setNotification: (notification: { message: string, type: 'success' | 'error' } | null) => void;
}

type Template = 'playful' | 'formal' | 'modern' | 'elegant' | 'creative' | 'space' | 'jungle' | 'superhero' | 'blank';
type PageSize = 'a4' | 'letter';
type Orientation = 'landscape' | 'portrait';

const getCoords = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
  const event = 'nativeEvent' in e ? e.nativeEvent : e;
  if ('touches' in event && event.touches.length > 0) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  if ('clientX' in event) {
    return { x: event.clientX, y: event.clientY };
  }
  return { x: 0, y: 0 };
};

export const CertificateGeneratorView: React.FC<CertificateGeneratorViewProps> = ({ currentUser, setCurrentUser, onOpenPremiumModal, setNotification }) => {
    const [template, setTemplate] = useState<Template>('playful');
    const [pageSize, setPageSize] = useState<PageSize>('a4');
    const [orientation, setOrientation] = useState<Orientation>('landscape');
    
    const [studentName, setStudentName] = useState('Amina K.');
    const [awardTitle, setAwardTitle] = useState('Star Reader of the Month');
    const [teacherName, setTeacherName] = useState(currentUser.name);
    const [awardDate, setAwardDate] = useState(new Date().toLocaleDateString('en-CA'));
    
    const [aiTopic, setAiTopic] = useState('');
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const [zoom, setZoom] = useState(0.5);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [imageOpacity, setImageOpacity] = useState(1);
    
    const printableRef = useRef<HTMLDivElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // --- Draggable Text State & Logic ---
    const [textPositions, setTextPositions] = useState({
        title: { x: 0, y: -90 },
        presented: { x: 0, y: -45 },
        studentName: { x: 0, y: 0 },
        description: { x: 0, y: 55 },
        awardTitle: { x: 0, y: 80 },
        footer: { x: 0, y: 130 },
    });
    
    const [interactionState, setInteractionState] = useState<{
        id: keyof typeof textPositions,
        startX: number,
        startY: number,
        originalX: number,
        originalY: number
    } | null>(null);

    const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, id: keyof typeof textPositions) => {
        e.preventDefault();
        e.stopPropagation();
        if (interactionState) return;
        const { x: clientX, y: clientY } = getCoords(e);
        setInteractionState({
            id,
            startX: clientX,
            startY: clientY,
            originalX: textPositions[id].x,
            originalY: textPositions[id].y,
        });
    }, [interactionState, textPositions]);

    const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!interactionState) return;
        e.preventDefault();
        const { id, startX, startY, originalX, originalY } = interactionState;
        const { x: clientX, y: clientY } = getCoords(e);
        const dx = (clientX - startX) / zoom;
        const dy = (clientY - startY) / zoom;
        setTextPositions(prev => ({ ...prev, [id]: { x: originalX + dx, y: originalY + dy } }));
    }, [interactionState, zoom]);

    const handleInteractionEnd = useCallback(() => {
        setInteractionState(null);
    }, []);

    useEffect(() => {
        if (interactionState) {
            window.addEventListener('mousemove', handleInteractionMove);
            window.addEventListener('mouseup', handleInteractionEnd);
            window.addEventListener('touchmove', handleInteractionMove, { passive: false });
            window.addEventListener('touchend', handleInteractionEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleInteractionMove);
            window.removeEventListener('mouseup', handleInteractionEnd);
            window.removeEventListener('touchmove', handleInteractionMove);
            window.removeEventListener('touchend', handleInteractionEnd);
        };
    }, [interactionState, handleInteractionMove, handleInteractionEnd]);
    
    const DraggableText: React.FC<{ id: keyof typeof textPositions, children: React.ReactNode }> = ({ id, children }) => {
        const pos = textPositions[id];
        return (
            <div
                onMouseDown={(e) => handleDragStart(e, id)}
                onTouchStart={(e) => handleDragStart(e, id)}
                className="draggable-text"
                style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, cursor: 'move', userSelect: 'none' }}
            >
                {children}
            </div>
        );
    };
    // --- End Draggable Text Logic ---

    const TEMPLATES: Template[] = ['playful', 'formal', 'modern', 'elegant', 'creative', 'space', 'jungle', 'superhero', 'blank'];
    
    const fitToScreen = useCallback(() => {
        if (!previewContainerRef.current || !printableRef.current?.firstElementChild) return;
        const container = previewContainerRef.current;
        const certificate = printableRef.current.firstElementChild as HTMLElement;

        setTimeout(() => {
            const containerWidth = container.offsetWidth - 40;
            const certWidth = certificate.offsetWidth;
            if (certWidth > 0) {
                setZoom(containerWidth / certWidth);
            }
        }, 50);
    }, [pageSize, orientation, template]);

    useEffect(() => {
        fitToScreen();
        window.addEventListener('resize', fitToScreen);
        return () => window.removeEventListener('resize', fitToScreen);
    }, [fitToScreen]);
    
    const handleGenerateIdeas = async () => {
        if (!aiTopic.trim()) return;
        if (currentUser.plan === 'free') {
            onOpenPremiumModal('AI Award Suggestions');
            return;
        }
        const freshUser = await getUserById(currentUser.uid);
        if (!freshUser || freshUser.wordGameGeneratorCredits <= 0) {
            onOpenPremiumModal('AI Award Suggestions');
            return;
        }
        
        setIsGenerating(true);
        setAiError(null);
        setAiSuggestions([]);
        try {
            const ideas = await generateCertificateIdeas(aiTopic);
            setAiSuggestions(ideas);
            await decrementWordGameGeneratorCredits(currentUser.uid, 1);
            const updatedUser = await getUserById(currentUser.uid);
            if(updatedUser) setCurrentUser(updatedUser);
        } catch (e) {
            setAiError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setBackgroundImage(event.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handlePrint = () => {
        const printContent = printableRef.current?.innerHTML;
        if (!printContent) return;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;
        
        let customBgStyle = '';
        if (backgroundImage) {
            customBgStyle = `
                .certificate-container.has-custom-bg {
                    background-image: url(${backgroundImage});
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    background-color: transparent !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
            `;
        }
        
        doc.open();
        doc.write(`
            <html>
                <head>
                    <title>Print Certificate</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
                    <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
                     <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
                     <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap" rel="stylesheet">
                     <link href="https://fonts.googleapis.com/css2?family=Comic+Sans+MS&display=swap" rel="stylesheet">
                    <style>
                        ${certificateStyles} 
                        ${customBgStyle}
                        .draggable-text { transform: none !important; position: static !important; }
                        .c-group-wrapper { display: contents; }
                    </style>
                </head>
                <body>${printContent}</body>
            </html>
        `);
        doc.close();

        iframe.contentWindow?.focus();
        setTimeout(() => {
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
        }, 250);
    };
    
    const formattedDate = useMemo(() => {
        try {
           return new Date(awardDate + 'T00:00:00').toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric'
           });
        } catch (e) {
            return "Invalid Date";
        }
    }, [awardDate]);
    
    const inputClasses = "w-full p-3";

    return (
        <>
            <style>{certificateStyles}</style>
            <div className="w-full max-w-7xl mx-auto">
                 <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-on-bg)]">
                      Certificate & Award Editor
                      <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-primary)' }} />
                    </h2>
                    <p className="text-[var(--color-on-surface-variant)] mt-2">Create and print beautiful awards for your students.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <div className="lg:w-1/3 w-full">
                        <div className="material-card p-6 sm:p-8 space-y-6 lg:sticky top-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div><h3 className="text-lg font-semibold mb-2">Size</h3><select value={pageSize} onChange={e => setPageSize(e.target.value as PageSize)} className={inputClasses}><option value="a4">A4</option><option value="letter">US Letter</option></select></div>
                                <div><h3 className="text-lg font-semibold mb-2">Orientation</h3><select value={orientation} onChange={e => setOrientation(e.target.value as Orientation)} className={inputClasses}><option value="landscape">Landscape</option><option value="portrait">Portrait</option></select></div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-3">Template</h3>
                                <select value={template} onChange={e => setTemplate(e.target.value as Template)} className={inputClasses}>
                                    {TEMPLATES.map(t => (
                                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-[var(--color-outline)]">
                                <h3 className="text-lg font-semibold mb-1">Details</h3>
                                <div><label className="text-sm font-medium mb-1 block">Student's Name</label><input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} className={inputClasses} /></div>
                                <div><label className="text-sm font-medium mb-1 block">Award Title</label><input type="text" value={awardTitle} onChange={e => setAwardTitle(e.target.value)} className={inputClasses} /></div>
                                <div><label className="text-sm font-medium mb-1 block">Teacher's Name</label><input type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)} className={inputClasses} /></div>
                                <div><label className="text-sm font-medium mb-1 block">Date</label><input type="date" value={awardDate} onChange={e => setAwardDate(e.target.value)} className={inputClasses} /></div>
                            </div>
                            
                            <div className="pt-4 border-t border-[var(--color-outline)] space-y-3">
                                <h3 className="text-lg font-semibold">Background</h3>
                                <div className="grid grid-cols-2 gap-3 items-center">
                                    <label className="text-sm font-medium">Color</label>
                                    <input type="color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="w-full h-10 p-1 bg-transparent border border-[var(--color-outline)] rounded-md" />
                                </div>
                                <div className="grid grid-cols-2 gap-3 items-center">
                                    <label className="text-sm font-medium">Image Opacity</label>
                                    <input type="range" min="0" max="1" step="0.05" value={imageOpacity} onChange={e => setImageOpacity(parseFloat(e.target.value))} className="w-full" disabled={!backgroundImage} />
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleBackgroundImageUpload} className="hidden" accept="image/*" />
                                <button onClick={() => fileInputRef.current?.click()} className="w-full material-button material-button-secondary text-sm flex items-center justify-center gap-2"><PhotoIcon className="w-5 h-5"/> Upload Image</button>
                                {backgroundImage && (
                                    <button onClick={() => setBackgroundImage(null)} className="w-full material-button material-button-secondary text-sm flex items-center justify-center gap-2 text-rose-500 hover:border-rose-500"><TrashIcon className="w-5 h-5"/> Remove Image</button>
                                )}
                            </div>
                            
                            <div className="pt-4 border-t border-[var(--color-outline)] space-y-3">
                                <h3 className="text-lg font-semibold">AI Suggestions ✨</h3>
                                <p className="text-xs text-[var(--color-on-surface-variant)]">Stuck for an award title? Get some creative ideas!</p>
                                <div><label className="text-sm font-medium mb-1 block">Topic</label><input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="e.g., Science Fair, Good Citizenship" className={inputClasses} /></div>
                                <button onClick={handleGenerateIdeas} disabled={isGenerating || !aiTopic.trim()} className="w-full material-button material-button-secondary text-sm">{isGenerating ? 'Generating...' : 'Get Ideas'}</button>
                                {isGenerating && <LoadingSpinner />}
                                {aiError && <p className="text-xs text-red-500 text-center">{aiError}</p>}
                                {aiSuggestions.length > 0 && <div className="space-y-1">{aiSuggestions.map((s, i) => <button key={i} onClick={() => setAwardTitle(s)} className="w-full text-left p-2 text-sm rounded-md hover:bg-[var(--color-surface-variant)]">💡 {s}</button>)}</div>}
                            </div>

                            <div className="pt-4 border-t border-[var(--color-outline)]"><button onClick={handlePrint} className="w-full material-button material-button-primary py-3 flex items-center justify-center gap-2"><PrinterIcon className="w-5 h-5" /> Print Certificate</button></div>
                        </div>
                    </div>

                    <div className="lg:w-2/3 w-full flex flex-col">
                        <div className="flex items-center justify-center gap-2 mb-4 p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-outline)] flex-shrink-0">
                            <button onClick={() => setZoom(z => z * 0.9)} className="p-2 rounded-md hover:bg-[var(--color-surface-variant)]" title="Zoom Out"><ZoomOutIcon className="w-5 h-5" /></button>
                            <button onClick={fitToScreen} className="p-2 rounded-md hover:bg-[var(--color-surface-variant)] text-sm w-16 text-center" title="Fit to Screen">{Math.round(zoom * 100)}%</button>
                            <button onClick={() => setZoom(z => z * 1.1)} className="p-2 rounded-md hover:bg-[var(--color-surface-variant)]" title="Zoom In"><ZoomInIcon className="w-5 h-5" /></button>
                        </div>
                        <div ref={previewContainerRef} className="w-full flex-grow overflow-auto custom-scrollbar-container flex items-start justify-center p-4 bg-[var(--color-surface-variant)] rounded-lg">
                            <div className="origin-top transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
                                <div ref={printableRef}>
                                    <div 
                                      className={`certificate-container ${template}-template ${pageSize} ${orientation} shadow-2xl ${backgroundImage ? 'has-custom-bg' : ''}`}
                                      style={{ backgroundColor: backgroundColor }}
                                    >
                                        {backgroundImage && <div className="certificate-bg-image" style={{ backgroundImage: `url(${backgroundImage})`, opacity: imageOpacity }} />}
                                        <div className="certificate-content">
                                            <DraggableText id="title"><div className="c-group-wrapper"><span className="c-title">Certificate of Achievement</span></div></DraggableText>
                                            <DraggableText id="presented"><div className="c-group-wrapper"><span className="c-presented">This certificate is proudly presented to</span></div></DraggableText>
                                            <DraggableText id="studentName"><div className="c-group-wrapper"><span className="c-student-name">{studentName || "Student Name"}</span></div></DraggableText>
                                            <DraggableText id="description"><div className="c-group-wrapper"><span className="c-description">For outstanding achievement in</span></div></DraggableText>
                                            <DraggableText id="awardTitle"><div className="c-group-wrapper"><span className="c-award-title">{awardTitle || "Award Title"}</span></div></DraggableText>
                                            <DraggableText id="footer"><div className="c-group-wrapper"><div className="c-footer"><div><span className="c-teacher-name">{teacherName || "Teacher's Name"}</span><span className="c-signature-line"></span><span className="c-signature-label">Teacher</span></div><div><span className="c-date">{formattedDate}</span><span className="c-signature-line"></span><span className="c-signature-label">Date</span></div></div></div></DraggableText>
                                            <div className="c-seal"></div>
                                            <div className="c-bg-elements"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const certificateStyles = `
/* Common Certificate Styles */
.certificate-container { position: relative; display: flex; justify-content: center; align-items: center; box-sizing: border-box; color: #111; overflow: hidden; }
.a4.landscape { width: 297mm; height: 210mm; }
.a4.portrait { width: 210mm; height: 297mm; }
.letter.landscape { width: 11in; height: 8.5in; }
.letter.portrait { width: 8.5in; height: 11in; }
.certificate-bg-image { position: absolute; inset: 0; background-size: cover; background-position: center; z-index: 0; }
.certificate-content { width: 90%; height: 85%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; position: relative; padding: 2mm 5mm; box-sizing: border-box; }
.draggable-text { position: absolute; width: 100%; left: 0; display: flex; justify-content: center; z-index: 10; padding: 4px; border: 1px dashed transparent; transition: border-color 0.2s; }
.draggable-text:hover { border-color: rgba(0, 120, 255, 0.5); }
.c-group-wrapper { width: 100%; }
.c-title, .c-presented, .c-student-name, .c-description, .c-award-title { display: block; }
.c-footer { display: flex; justify-content: space-between; width: 80%; margin: 0 auto; }
.c-footer > div { display: flex; flex-direction: column; align-items: center; width: 40%; }
.c-signature-line { border-bottom: 2px solid #333; width: 100%; margin-top: 1mm; }
.c-signature-label { font-size: 14pt; margin-top: 2mm; }
.c-seal { position: absolute; z-index: 1; }
.c-bg-elements { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.has-custom-bg .certificate-content span, .has-custom-bg .c-footer > div { text-shadow: 0 0 3px white, 0 0 5px white, 0 0 8px white; }
.has-custom-bg.space-template .certificate-content span { text-shadow: 0 0 3px black, 0 0 5px black; }
@media print { body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .certificate-container { box-shadow: none !important; } @page { size: A4 landscape; margin: 0; } .a4.landscape { page: a4-land; } .a4.portrait { page: a4-port; } .letter.landscape { page: letter-land; } .letter.portrait { page: letter-port; } @page a4-land { size: A4 landscape; } @page a4-port { size: A4 portrait; } @page letter-land { size: letter landscape; } @page letter-port { size: letter portrait; } }

/* Templates */
.formal-template { font-family: 'Playfair Display', serif; border: 10px double #c09d41; }
.formal-template .certificate-content { border: 2px solid #d4af37; }
.formal-template .c-title { font-size: 52pt; font-weight: 700; color: #3a2e0e; }
.formal-template .c-presented { font-size: 20pt; margin-top: 5mm; }
.formal-template .c-student-name { font-size: 40pt; font-weight: 700; color: #c09d41; margin: 3mm 0; border-bottom: 2px solid #d4af37; padding-bottom: 3mm; }
.formal-template .c-description { font-size: 18pt; margin-top: 5mm; }
.formal-template .c-award-title { font-size: 24pt; font-style: italic; margin-top: 2mm; color: #3a2e0e; }
.formal-template .c-teacher-name, .formal-template .c-date { font-size: 16pt; font-style: italic; }
.formal-template .c-seal { bottom: 10mm; right: 10mm; width: 50mm; height: 50mm; background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="48" fill="%23fdfaf2" stroke="%23c09d41" stroke-width="2"/%3E%3Ccircle cx="50" cy="50" r="42" fill="none" stroke="%23d4af37" stroke-width="1"/%3E%3Cpath id="curve" d="M15,50 a35,35 0 1,1 70,0" fill="none"/%3E%3Ctext width="100" font-size="9" fill="%233a2e0e" font-family="serif" letter-spacing="2"%3E%3CtextPath href="%23curve"%3EEXCELLENCE IN ACHIEVEMENT%3C/textPath%3E%3C/text%3E%3Cpath id="curve2" d="M85,50 a35,35 0 1,1 -70,0" fill="none"/%3E%3Ctext width="100" font-size="9" fill="%233a2e0e" font-family="serif" letter-spacing="2"%3E%3CtextPath href="%23curve2"%3EAI TEACHER ASSISTANT%3C/textPath%3E%3C/text%3E%3Cpolygon points="50,25 55,45 75,45 60,55 65,75 50,65 35,75 40,55 25,45 45,45" fill="%23c09d41"/%3E%3C/svg%3E'); background-size: contain; }
.modern-template { font-family: 'Inter', sans-serif; border: 1px solid #e5e7eb; }
.modern-template .c-bg-elements::before { content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 10mm; background-color: var(--color-primary); }
.modern-template .certificate-content { align-items: flex-start; text-align: left; padding-left: 20mm; }
.modern-template .draggable-text { justify-content: flex-start; }
.modern-template .c-group-wrapper { width: auto; }
.modern-template .c-title { font-size: 20pt; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; }
.modern-template .c-presented { font-size: 16pt; }
.modern-template .c-student-name { font-size: 52pt; font-weight: 700; color: var(--color-primary); margin: 0; text-align: left; }
.modern-template .c-description { font-size: 16pt; }
.modern-template .c-award-title { font-size: 24pt; font-weight: 600; margin-top: 2mm; text-align: left; }
.modern-template .c-footer { justify-content: flex-start; gap: 20mm; width: 100%; text-align: left; }
.modern-template .c-footer > div { align-items: flex-start; }
.modern-template .c-teacher-name, .modern-template .c-date { font-size: 16pt; }
.modern-template .c-signature-label { font-size: 12pt; }
.playful-template { font-family: 'Comic Sans MS', cursive; border: 8px solid #38bdf8; border-radius: 15px; }
.playful-template .c-bg-elements { background-image: url('data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M50 0L61.2 34.5H97.6L68.2 55.9L79.4 90.5L50 69.1L20.6 90.5L31.8 55.9L2.4 34.5H38.8z" fill="%23facc15" opacity="0.1"/%3E%3C/svg%3E'), url('data:image/svg+xml,%3Csvg width="60" height="60" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M30 0L36.7 20.7H58.6L40.9 33.5L47.6 54.3L30 41.5L12.4 54.3L19.1 33.5L1.4 20.7H23.3z" fill="%23fb923c" opacity="0.1"/%3E%3C/svg%3E'); background-position: 10% 15%, 90% 80%; background-repeat: no-repeat; }
.playful-template .c-title { font-size: 48pt; font-weight: 700; color: #0284c7; }
.playful-template .c-presented { font-size: 18pt; }
.playful-template .c-student-name { font-size: 42pt; font-weight: 700; color: #f59e0b; }
.playful-template .c-description { font-size: 16pt; }
.playful-template .c-award-title { font-size: 26pt; font-weight: 600; color: #0284c7; }
.playful-template .c-teacher-name, .playful-template .c-date { font-size: 16pt; }
.playful-template .c-signature-line { border-bottom: 2px solid #38bdf8; }
.elegant-template { font-family: 'Dancing Script', cursive; border: 1px solid #d6d3d1; }
.elegant-template .certificate-content { border: 1px solid #a8a29e; }
.elegant-template .c-title { font-size: 38pt; color: #44403c; font-weight: 700; }
.elegant-template .c-presented { font-size: 20pt; font-family: 'Inter', sans-serif; font-style: italic; color: #78716c; }
.elegant-template .c-student-name { font-size: 56pt; font-weight: 700; color: #1c1917; }
.elegant-template .c-description { font-size: 20pt; font-family: 'Inter', sans-serif; font-style: italic; color: #78716c; }
.elegant-template .c-award-title { font-size: 28pt; color: #44403c; }
.elegant-template .c-teacher-name, .elegant-template .c-date { font-size: 20pt; }
.elegant-template .c-signature-line { border-color: #a8a29e; }
.elegant-template .c-signature-label { font-size: 12pt; font-family: 'Inter', sans-serif; color: #78716c; }
.elegant-template .c-bg-elements { background: radial-gradient(circle, rgba(168, 162, 158, 0.08) 0%, rgba(168, 162, 158, 0) 60%); }
.creative-template { font-family: 'Montserrat', sans-serif; border: none; }
.creative-template .c-bg-elements { background-image: url('data:image/svg+xml,...'), url('data:image/svg+xml,...'); background-position: -50px -50px, calc(100% + 20px) calc(100% + 20px); background-repeat: no-repeat; }
.creative-template .certificate-content { border: 2px solid #fb923c; border-radius: 10px; }
.creative-template .c-title { font-size: 24pt; font-weight: 300; text-transform: uppercase; letter-spacing: 5px; color: #9a3412; }
.creative-template .c-presented { font-size: 16pt; color: #ea580c; }
.creative-template .c-student-name { font-size: 50pt; font-weight: 700; color: #c2410c; }
.creative-template .c-description { font-size: 16pt; color: #ea580c; }
.creative-template .c-award-title { font-size: 28pt; font-weight: 600; color: #9a3412; }
.creative-template .c-footer { width: 90%; }
.creative-template .c-teacher-name, .creative-template .c-date { font-size: 16pt; font-weight: 500; }
.creative-template .c-signature-line { border-color: #fdba74; }
.creative-template .c-signature-label { font-size: 12pt; color: #f97316; }
.space-template { font-family: 'Oswald', sans-serif; border: 4px solid #f0f8ff; color: #fff; }
.space-template .c-bg-elements { background-image: radial-gradient(circle at 15% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 10%, white 1.5px, transparent 1.5px), radial-gradient(circle at 50% 70%, white 1px, transparent 1px), radial-gradient(circle at 90% 90%, white 1.5px, transparent 1.5px), radial-gradient(circle at 25% 85%, white 1px, transparent 1px); background-size: 150px 150px, 200px 200px, 100px 100px, 300px 300px, 250px 250px; }
.space-template .c-title { font-size: 38pt; font-weight: 700; color: #7dd3fc; text-transform: uppercase; letter-spacing: 3px; }
.space-template .c-presented { font-size: 18pt; }
.space-template .c-student-name { font-size: 44pt; font-weight: 700; color: #facc15; }
.space-template .c-description { font-size: 16pt; }
.space-template .c-award-title { font-size: 28pt; font-weight: 600; color: #7dd3fc; }
.space-template .c-teacher-name, .space-template .c-date { font-size: 16pt; color: #e0e7ff; }
.space-template .c-signature-line { border-color: #93c5fd; }
.space-template .c-signature-label { color: #93c5fd; font-size: 12pt; }
.jungle-template { font-family: 'Montserrat', sans-serif; border: 12px solid transparent; border-image: url('data:image/svg+xml,...') 30 stretch; }
.jungle-template .certificate-content { border: 2px dashed #15803d; }
.jungle-template .c-title { font-size: 48pt; font-weight: 700; color: #166534; }
.jungle-template .c-presented { font-size: 18pt; }
.jungle-template .c-student-name { font-size: 42pt; font-weight: 700; color: #f97316; }
.jungle-template .c-description { font-size: 16pt; }
.jungle-template .c-award-title { font-size: 26pt; font-weight: 600; color: #166534; }
.jungle-template .c-teacher-name, .jungle-template .c-date { font-size: 16pt; }
.jungle-template .c-signature-line { border-color: #16a34a; }
.superhero-template { font-family: 'Oswald', sans-serif; border: 5px solid #ef4444; position: relative; }
.superhero-template::after { content: ''; position: absolute; inset: 5px; border: 5px solid #3b82f6; }
.superhero-template .c-bg-elements { background-image: radial-gradient(circle, rgba(251, 191, 36, 0.2) 20%, transparent 20%), radial-gradient(circle, rgba(251, 191, 36, 0.2) 20%, transparent 20%); background-size: 30px 30px; background-position: 0 0, 15px 15px; }
.superhero-template .certificate-content { z-index: 1; }
.superhero-template .c-title { font-size: 56pt; font-weight: 700; color: #b91c1c; text-transform: uppercase; text-shadow: 2px 2px #facc15; }
.superhero-template .c-presented { font-size: 18pt; font-weight: 600; }
.superhero-template .c-student-name { font-size: 44pt; font-weight: 700; color: #1d4ed8; -webkit-text-stroke: 1px #facc15; }
.superhero-template .c-description { font-size: 16pt; font-weight: 600; }
.superhero-template .c-award-title { font-size: 28pt; font-weight: 700; color: #b91c1c; }
.superhero-template .c-teacher-name, .superhero-template .c-date { font-size: 16pt; font-weight: 600; }
.superhero-template .c-signature-line { border-color: #3b82f6; }
.blank-template { font-family: 'Inter', sans-serif; border: 1px dashed #a8a29e; }
.blank-template .c-title { font-size: 32pt; font-weight: 600; color: #111; text-transform: uppercase; letter-spacing: 2px; }
.blank-template .c-presented { font-size: 16pt; color: #333; }
.blank-template .c-student-name { font-size: 36pt; font-weight: 700; color: #000; }
.blank-template .c-description { font-size: 14pt; color: #333; }
.blank-template .c-award-title { font-size: 22pt; font-weight: 500; color: #111; }
.blank-template .c-teacher-name, .blank-template .c-date { font-size: 14pt; }
.blank-template .c-signature-line { border-color: #333; }
.blank-template .c-signature-label { font-size: 11pt; color: #555; }
.blank-template .c-seal, .blank-template .c-bg-elements { display: none; }
`;
