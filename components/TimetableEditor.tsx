import React, { useState, useEffect, useRef } from 'react';
import { School, ClassEntry, TimetableData, Day, User } from '../types';
import { TIMETABLE_DAYS, TIME_PERIODS, SparklesIcon, DownloadIcon, ChevronDownIcon, PencilIcon, TrashIcon, CheckIcon, XIcon, SaveIcon } from './constants';
import { getSchools, addSchool as dbAddSchool, updateSchool, deleteSchoolAndRelatedData, getClasses, addClass as dbAddClass, updateClass, deleteClassAndCleanTimetable, getTimetable, saveTimetable } from '../services/dbService';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, VerticalAlign, Footer, Header, BorderStyle, PageOrientation } from 'docx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ErrorMessage from './ErrorMessage';

interface TimetableEditorProps {
  userId: string;
  currentUser: User;
}

const initialTimetableData = (): TimetableData => {
  const data: Partial<TimetableData> = {};
  TIMETABLE_DAYS.forEach(day => { data[day] = Array(TIME_PERIODS.length).fill(null); });
  return data as TimetableData;
};

// --- Color Utility for Timetable ---
const colorPalette = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
const getEventColorFromString = (str: string): string => {
  if (!str) return colorPalette[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
};

const EditClassModal: React.FC<{
    classEntry: ClassEntry;
    schools: School[];
    onSave: (updatedClass: ClassEntry) => void;
    onClose: () => void;
}> = ({ classEntry, schools, onSave, onClose }) => {
    const [name, setName] = useState(classEntry.name);
    const [subject, setSubject] = useState(classEntry.subject);
    const [schoolId, setSchoolId] = useState(classEntry.schoolId);

    const handleSave = () => {
        onSave({ ...classEntry, name, subject, schoolId });
    };

    const inputClasses = "w-full p-3 rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] border border-[var(--color-border)] bg-[var(--color-input-bg)]";
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div className="relative w-full max-w-md bg-[var(--color-surface)] rounded-xl shadow-2xl text-[var(--color-text-primary)] overflow-hidden" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors z-20">
                    <XIcon className="w-6 h-6" />
                </button>
                <div className="p-8">
                    <h3 className="text-xl font-semibold mb-6 text-center">Edit Class</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">Class Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">Subject</label>
                            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className={inputClasses} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">School</label>
                            <select value={schoolId} onChange={e => setSchoolId(e.target.value)} className={inputClasses}>
                                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <button onClick={handleSave} className="w-full mt-6 py-3 font-semibold rounded-lg blueprint-button">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const TimetableEditor: React.FC<TimetableEditorProps> = ({ userId, currentUser }) => {
  // Main Data State
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [timetableData, setTimetableData] = useState<TimetableData>(initialTimetableData());
  
  // Input State
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [selectedSchoolForNewClass, setSelectedSchoolForNewClass] = useState<string>('');
  
  // UI/Interaction State
  const [selectedClassForAssignment, setSelectedClassForAssignment] = useState<ClassEntry['id'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  // Editing State
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [editingSchoolName, setEditingSchoolName] = useState('');
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState<ClassEntry | null>(null);


  const loadData = async () => {
    if (!userId) return;
    try {
        const [loadedSchools, loadedClasses, loadedTimetable] = await Promise.all([
            getSchools(userId),
            getClasses(userId),
            getTimetable(userId)
        ]);
        setSchools(loadedSchools);
        setClasses(loadedClasses);
        if (loadedSchools.length > 0 && selectedSchoolForNewClass === '') {
            setSelectedSchoolForNewClass(loadedSchools[0].id);
        }
        if (loadedTimetable) {
            setTimetableData(loadedTimetable);
        } else {
            setTimetableData(initialTimetableData());
        }
    } catch (dbError) {
        console.error("Failed to load data from database", dbError);
        setError("Could not load timetable data. Please check your internet connection.");
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
            setIsExportMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [exportMenuRef]);

  const handleAddSchool = async () => {
    if (!newSchoolName.trim()) return setError("School name cannot be empty.");
    if (schools.some(s => s.name.toLowerCase() === newSchoolName.trim().toLowerCase())) return setError("A school with this name already exists.");
    const newSchoolData: Omit<School, 'id'> = { name: newSchoolName.trim(), userId };
    try {
        const newSchoolId = await dbAddSchool(newSchoolData);
        const newSchool = { id: newSchoolId, ...newSchoolData };
        setSchools([...schools, newSchool]);
        if(schools.length === 0) setSelectedSchoolForNewClass(newSchool.id);
        setNewSchoolName('');
        setError(null);
    } catch (dbError) {
        console.error("Failed to add school", dbError);
        setError("Failed to save the new school.");
    }
  };

  const handleUpdateSchool = async () => {
    if (!editingSchoolId || !editingSchoolName.trim()) return;
    if (schools.some(s => s.id !== editingSchoolId && s.name.toLowerCase() === editingSchoolName.trim().toLowerCase())) {
        setError("Another school with this name already exists.");
        return;
    }
    try {
        await updateSchool(editingSchoolId, editingSchoolName.trim());
        setSchools(schools.map(s => s.id === editingSchoolId ? { ...s, name: editingSchoolName.trim() } : s));
        setEditingSchoolId(null);
        setEditingSchoolName('');
        setError(null);
    } catch (dbError) {
        console.error("Failed to update school", dbError);
        setError("Failed to update the school.");
    }
  };

  const handleDeleteSchool = async (schoolId: string) => {
    const schoolToDelete = schools.find(s => s.id === schoolId);
    if (!schoolToDelete) return;
    if (window.confirm(`Are you sure you want to delete "${schoolToDelete.name}"? This will also delete all its classes and remove them from the timetable.`)) {
        try {
            await deleteSchoolAndRelatedData(schoolId, userId);
            await loadData(); // Easiest way to refresh all related data
        } catch (dbError) {
            console.error("Failed to delete school", dbError);
            setError("Failed to delete the school and its related data.");
        }
    }
  };

  const handleAddClass = async () => {
    if (!newClassName.trim() || !newClassSubject.trim() || !selectedSchoolForNewClass) return setError("Class name, subject, and school are required.");
    const newClassData: Omit<ClassEntry, 'id'> = { name: newClassName.trim(), subject: newClassSubject.trim(), schoolId: selectedSchoolForNewClass, userId };
    try {
        const newClassId = await dbAddClass(newClassData);
        setClasses([...classes, { id: newClassId, ...newClassData }]);
        setNewClassName('');
        setNewClassSubject('');
        setError(null);
    } catch (dbError) {
        console.error("Failed to add class", dbError);
        setError("Failed to save the new class.");
    }
  };

  const handleUpdateClass = async (updatedClassData: ClassEntry) => {
    const { id, ...updates } = updatedClassData;
    try {
        await updateClass(id, updates);
        setClasses(classes.map(c => c.id === id ? updatedClassData : c));
        setIsEditClassModalOpen(false);
        setClassToEdit(null);
    } catch (dbError) {
        console.error("Failed to update class", dbError);
        setError("Failed to update the class.");
    }
  };

  const handleDeleteClass = async (classId: string) => {
    const classToDelete = classes.find(c => c.id === classId);
    if (!classToDelete) return;
    if (window.confirm(`Are you sure you want to delete the class "${classToDelete.name} - ${classToDelete.subject}"? It will be removed from the timetable.`)) {
        try {
            await deleteClassAndCleanTimetable(classId, userId);
            await loadData();
        } catch (dbError) {
            console.error("Failed to delete class", dbError);
            setError("Failed to delete the class.");
        }
    }
  };
  
  const handleTimetableSlotClick = async (day: Day, timePeriodIndex: number) => {
    const newTimetableData = { ...timetableData };
    const newDaySchedule = [...newTimetableData[day]];

    if (selectedClassForAssignment) {
        newDaySchedule[timePeriodIndex] = newDaySchedule[timePeriodIndex] === selectedClassForAssignment ? null : selectedClassForAssignment;
    } else if (newDaySchedule[timePeriodIndex] !== null) {
        newDaySchedule[timePeriodIndex] = null;
    }
    
    newTimetableData[day] = newDaySchedule;
    
    try {
        await saveTimetable(userId, newTimetableData);
        setTimetableData(newTimetableData);
    } catch (dbError) {
        console.error("Failed to save timetable", dbError);
        setError("Failed to save your changes to the timetable.");
    }
  };

  const getClassDetails = (classId: string | null): ClassEntry | null => classId ? classes.find(c => c.id === classId) || null : null;
  const getSchoolDetails = (schoolId: string | null): School | null => schoolId ? schools.find(s => s.id === schoolId) || null : null;

    const getSchoolsInTimetable = (): string => {
        return Array.from(new Set(
            Object.values(timetableData).flat().filter(Boolean).map(classId => {
                const classEntry = getClassDetails(classId as string);
                return classEntry ? getSchoolDetails(classEntry.schoolId)?.name : null;
            }).filter(Boolean) as string[]
        )).join(', ');
    }

    const handleExportPdf = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const teacherName = currentUser.name;
        const schoolsInTimetable = getSchoolsInTimetable();
        const title = "English Timetable";
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 14;

        doc.setFontSize(10);
        doc.text(`Teacher: ${teacherName}`, margin, 10, { align: 'left' });
        doc.setFont('helvetica', 'bold');
        doc.text(title, pageWidth / 2, 10, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(`School: ${schoolsInTimetable}`, pageWidth - margin, 10, { align: 'right' });
        
        const head = [['Time', ...TIMETABLE_DAYS]];
        const body = TIME_PERIODS.map((period, periodIndex) => {
            const row: string[] = [period];
            TIMETABLE_DAYS.forEach(day => {
                const classId = timetableData[day]?.[periodIndex];
                const classEntry = getClassDetails(classId);
                const isLunch = period === "11:15 - 13:00";
                const isPause = period === "09:30 - 09:45";

                if (isLunch) row.push("Lunch Break");
                else if (isPause) row.push("Pause");
                else if (classEntry) {
                    const school = getSchoolDetails(classEntry.schoolId);
                    row.push(`${classEntry.name} - ${classEntry.subject}\n${school?.name || 'N/A'}`);
                } else {
                    row.push("");
                }
            });
            return row;
        });

        autoTable(doc, {
            head: head,
            body: body,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 1, halign: 'center', valign: 'middle' },
            headStyles: { fillColor: '#4f46e5' }, // Accent color
            didParseCell: function (data) {
                const isLunch = data.cell.raw === "Lunch Break";
                const isPause = data.cell.raw === "Pause";
                if (isLunch || isPause) {
                    data.cell.styles.fillColor = '#e5e7eb'; // Light gray
                    data.cell.styles.textColor = '#111827';
                    data.cell.styles.fontStyle = 'bold';
                }
            },
            didDrawPage: function (data) {
                // Footer
                const pageHeight = doc.internal.pageSize.getHeight();
                const footerTextY = pageHeight - 10;
                const signatureLineY = footerTextY - 2;
                doc.setFontSize(8);

                // Teacher
                doc.text("Teacher:", data.settings.margin.left, footerTextY);
                doc.line(data.settings.margin.left, signatureLineY, data.settings.margin.left + 40, signatureLineY);

                // Headmaster
                doc.text("Headmaster:", pageWidth / 2, footerTextY, { align: 'center' });
                doc.line(pageWidth / 2 - 20, signatureLineY, pageWidth / 2 + 20, signatureLineY);

                // Inspector
                doc.text("Inspector:", pageWidth - data.settings.margin.right, footerTextY, { align: 'right' });
                doc.line(pageWidth - data.settings.margin.right - 40, signatureLineY, pageWidth - data.settings.margin.right, signatureLineY);
            },
        });
        
        doc.save('timetable.pdf');
        setIsExportMenuOpen(false);
    };

    const handleExportWord = () => {
        if (!currentUser) return;
        const teacherName = currentUser.name;
        const schoolsInTimetable = getSchoolsInTimetable();

        const createCell = (text: string, options: any = {}) => {
            const paragraphs = text.split('\n').map(line => new Paragraph({
                children: [new TextRun(line)],
                alignment: AlignmentType.CENTER,
            }));
            return new TableCell({
                children: paragraphs,
                verticalAlign: VerticalAlign.CENTER,
                ...options
            });
        };
        
        const headerRow = new TableRow({
            children: ['Time', ...TIMETABLE_DAYS].map(text => new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text, bold: true, color: "FFFFFF" })],
                    alignment: AlignmentType.CENTER,
                })],
                shading: { fill: "6366f1", type: ShadingType.SOLID },
                verticalAlign: VerticalAlign.CENTER,
            })),
        });

        const bodyRows = TIME_PERIODS.map((period, periodIndex) => {
            const rowCells = [createCell(period)];
            TIMETABLE_DAYS.forEach(day => {
                const classId = timetableData[day]?.[periodIndex];
                const classEntry = getClassDetails(classId);
                const isLunch = period === "11:15 - 13:00";
                const isPause = period === "09:30 - 09:45";

                if (isLunch) {
                    rowCells.push(createCell("Lunch Break", { shading: { fill: "e5e7eb", type: ShadingType.SOLID } }));
                } else if (isPause) {
                    rowCells.push(createCell("Pause", { shading: { fill: "e5e7eb", type: ShadingType.SOLID } }));
                } else if (classEntry) {
                    const school = getSchoolDetails(classEntry.schoolId);
                    rowCells.push(createCell(`${classEntry.name} - ${classEntry.subject}\n${school?.name || 'N/A'}`));
                } else {
                    rowCells.push(createCell(""));
                }
            });
            return new TableRow({ children: rowCells });
        });
        
        const table = new Table({
            rows: [headerRow, ...bodyRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
        });

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        size: {
                           orientation: PageOrientation.LANDSCAPE,
                        },
                    },
                },
                headers: {
                    default: new Header({
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun(`Teacher: ${teacherName}\t\t`),
                                new TextRun({text: "English Timetable", bold: true}),
                                new TextRun(`\t\tSchool: ${schoolsInTimetable}`),
                            ],
                        })],
                    }),
                },
                footers: {
                    default: new Footer({
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun("Teacher: __________\t\tHeadmaster: __________\t\tInspector: __________"),
                            ],
                        })],
                    }),
                },
                children: [table],
            }],
        });

        Packer.toBlob(doc).then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'timetable.docx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });

        setIsExportMenuOpen(false);
    };
    
    return (
        <div className="w-full max-w-7xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-text-primary)]">
                    Timetable Editor
                    <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-accent)' }} />
                </h2>
                <p className="text-[var(--color-text-secondary)] mt-2">Manage schools, classes, and build your weekly schedule.</p>
            </div>
            
            {error && <ErrorMessage message={error} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Controls */}
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8 self-start">
                    {/* Schools Management */}
                    <div className="blueprint-card p-4 sm:p-6">
                        <h3 className="font-semibold text-lg mb-3">Manage Schools</h3>
                        <div className="flex gap-2 mb-4">
                            <input type="text" value={newSchoolName} onChange={e => setNewSchoolName(e.target.value)} placeholder="New school name" className="flex-grow p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] text-sm" />
                            <button onClick={handleAddSchool} disabled={!newSchoolName.trim()} className="blueprint-button py-2 px-3 rounded-lg text-sm">Add</button>
                        </div>
                        <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar-container pr-2">
                            {schools.map(school => (
                                <li key={school.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-inset-bg)] text-sm">
                                    {editingSchoolId === school.id ? (
                                        <input type="text" value={editingSchoolName} onChange={e => setEditingSchoolName(e.target.value)} className="flex-grow p-1 rounded bg-transparent border-b border-[var(--color-accent)]"/>
                                    ) : (
                                        <span className="font-medium">{school.name}</span>
                                    )}
                                    <div className="flex items-center gap-1">
                                        {editingSchoolId === school.id ? (
                                            <>
                                                <button onClick={handleUpdateSchool} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-full"><CheckIcon className="w-4 h-4" /></button>
                                                <button onClick={() => setEditingSchoolId(null)} className="p-1 text-slate-500 hover:bg-slate-500/10 rounded-full"><XIcon className="w-4 h-4" /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => {setEditingSchoolId(school.id); setEditingSchoolName(school.name)}} className="p-1 text-slate-500 hover:bg-slate-500/10 rounded-full"><PencilIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteSchool(school.id)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-full"><TrashIcon className="w-4 h-4" /></button>
                                            </>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Classes Management */}
                    <div className="blueprint-card p-4 sm:p-6">
                         <h3 className="font-semibold text-lg mb-3">Manage Classes</h3>
                         <div className="space-y-2 mb-4">
                            <input type="text" value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="Class name (e.g., 4P1)" className="w-full p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] text-sm" />
                            <input type="text" value={newClassSubject} onChange={e => setNewClassSubject(e.target.value)} placeholder="Subject (e.g., English)" className="w-full p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] text-sm" />
                             <select value={selectedSchoolForNewClass} onChange={e => setSelectedSchoolForNewClass(e.target.value)} className="w-full p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] text-sm">
                                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                         </div>
                         <button onClick={handleAddClass} disabled={schools.length === 0 || !newClassName.trim() || !newClassSubject.trim()} className="w-full blueprint-button py-2 px-3 rounded-lg text-sm">Add Class</button>
                    </div>
                </div>
                {/* Right Column: Timetable */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="blueprint-card p-4 sm:p-6">
                        <h3 className="font-semibold text-lg mb-3">Assign Class</h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-3">Select a class below, then click on a slot in the timetable to assign or unassign it. To clear a slot, ensure no class is selected and click the slot.</p>
                        <div className="flex flex-wrap gap-2">
                            {classes.map(c => (
                                <button key={c.id} onClick={() => setSelectedClassForAssignment(prev => prev === c.id ? null : c.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${selectedClassForAssignment === c.id ? 'border-transparent shadow-lg' : 'border-[var(--color-border)]'}`}
                                    style={{backgroundColor: selectedClassForAssignment === c.id ? getEventColorFromString(c.schoolId) : 'transparent', color: selectedClassForAssignment === c.id ? 'white' : 'inherit'}}
                                >
                                    {c.name} - {c.subject} <span className="opacity-70">({getSchoolDetails(c.schoolId)?.name})</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="blueprint-card p-4 sm:p-6 overflow-x-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Weekly Timetable</h3>
                            {/* Export button */}
                        </div>
                        <table className="w-full border-collapse min-w-[800px]">
                            <thead>
                                <tr>
                                    <th className="p-2 border border-[var(--color-border)] bg-[var(--color-inset-bg)] w-28">Time</th>
                                    {TIMETABLE_DAYS.map(day => <th key={day} className="p-2 border border-[var(--color-border)] bg-[var(--color-inset-bg)]">{day}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {TIME_PERIODS.map((period, periodIndex) => {
                                    const isLunch = period === "11:15 - 13:00";
                                    const isPause = period === "09:30 - 09:45";

                                    if (isLunch || isPause) {
                                        return (
                                            <tr key={period}>
                                                <td className="p-2 border border-[var(--color-border)] text-center text-xs font-semibold bg-[var(--color-inset-bg)]">{period}</td>
                                                <td colSpan={5} className="p-2 border border-[var(--color-border)] text-center font-bold bg-[var(--color-inset-bg)]">{isLunch ? "Lunch Break" : "Pause"}</td>
                                            </tr>
                                        )
                                    }

                                    return (
                                        <tr key={period}>
                                            <td className="p-2 border border-[var(--color-border)] text-center text-xs font-semibold bg-[var(--color-inset-bg)]">{period}</td>
                                            {TIMETABLE_DAYS.map(day => {
                                                const classId = timetableData[day]?.[periodIndex];
                                                const classEntry = getClassDetails(classId);
                                                return (
                                                    <td key={`${day}-${period}`} className="p-0 border border-[var(--color-border)] h-20">
                                                        <button onClick={() => handleTimetableSlotClick(day, periodIndex)} className="w-full h-full p-1 text-center text-xs transition-colors hover:bg-[var(--color-accent)]/10">
                                                            {classEntry && (
                                                                <div className="h-full flex flex-col justify-center items-center rounded-md p-1" style={{backgroundColor: getEventColorFromString(classEntry.schoolId), color: 'white'}}>
                                                                    <p className="font-bold">{classEntry.name}</p>
                                                                    <p>{classEntry.subject}</p>
                                                                    <p className="text-[10px] opacity-80">{getSchoolDetails(classEntry.schoolId)?.name}</p>
                                                                </div>
                                                            )}
                                                        </button>
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
             {isEditClassModalOpen && classToEdit && (
                <EditClassModal 
                    classEntry={classToEdit}
                    schools={schools}
                    onSave={handleUpdateClass}
                    onClose={() => setIsEditClassModalOpen(false)}
                />
            )}
        </div>
    )
};

export default TimetableEditor;