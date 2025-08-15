import React, { useState, useEffect, useRef } from 'react';
import { School, ClassEntry, TimetableData, Day, User } from '../types';
import { TIMETABLE_DAYS, TIME_PERIODS, SparklesIcon, DownloadIcon, ChevronDownIcon, PencilIcon, TrashIcon, CheckIcon, XIcon, SaveIcon } from '../constants';
import { getSchools, addSchool as dbAddSchool, updateSchool, deleteSchoolAndRelatedData, getClasses, addClass as dbAddClass, updateClass, deleteClassAndCleanTimetable, getTimetable, saveTimetable } from '../services/dbService';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, VerticalAlign, Footer, Header, BorderStyle, PageOrientation } from 'docx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


interface TimetableEditorProps {
  userId: string;
  currentUser: User;
}

const initialTimetableData = (): TimetableData => {
  const data: Partial<TimetableData> = {};
  TIMETABLE_DAYS.forEach(day => { data[day] = Array(TIME_PERIODS.length).fill(null); });
  return data as TimetableData;
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
        setSchools([...schools, { id: newSchoolId, ...newSchoolData }]);
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
                doc.setFontSize(10);
                const footerY = pageHeight - 10;
        
                doc.text("Teacher:", data.settings.margin.left, footerY, { align: 'left' });
                doc.text("Headmaster:", pageWidth / 2, footerY, { align: 'center' });
                doc.text("Inspector:", pageWidth - data.settings.margin.right, footerY, { align: 'right' });
            },
        });
        
        doc.save('timetable.pdf');
        setIsExportMenuOpen(false);
    };

    const handleExportWord = () => {
        const createCell = (text: string, isHeader = false) => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text, bold: isHeader, color: isHeader ? "FFFFFF" : "000000" })], alignment: AlignmentType.CENTER })],
            shading: isHeader ? { fill: "4F46E5", type: ShadingType.CLEAR, color: "auto" } : undefined,
            verticalAlign: VerticalAlign.CENTER,
        });
    
        const createSpecialCell = (text: string) => new TableCell({
            children: [new Paragraph({ children: [new TextRun(text)], alignment: AlignmentType.CENTER })],
            shading: { fill: "E5E7EB", type: ShadingType.CLEAR, color: "auto" },
            verticalAlign: VerticalAlign.CENTER,
        });
        
        const createClassCell = (classEntry: ClassEntry) => {
            const school = getSchoolDetails(classEntry.schoolId);
            return new TableCell({
                children: [
                    new Paragraph({ children: [new TextRun({ text: classEntry.name, bold: true })] }),
                    new Paragraph(classEntry.subject),
                    new Paragraph({ children: [new TextRun({ text: school?.name || 'N/A', italics: true, color: "555555" })]}),
                ],
                verticalAlign: VerticalAlign.TOP,
            })
        };
    
        const headerRow = new TableRow({
            children: [createCell('Time', true), ...TIMETABLE_DAYS.map(day => createCell(day, true))],
            tableHeader: true,
        });
    
        const bodyRows = TIME_PERIODS.map((period, periodIndex) => {
            const cells: TableCell[] = [createCell(period)];
            TIMETABLE_DAYS.forEach(day => {
                const classId = timetableData[day]?.[periodIndex];
                const classEntry = getClassDetails(classId);
                const isLunch = period === "11:15 - 13:00";
                const isPause = period === "09:30 - 09:45";
    
                if (isLunch) cells.push(createSpecialCell("Lunch Break"));
                else if (isPause) cells.push(createSpecialCell("Pause"));
                else if (classEntry) cells.push(createClassCell(classEntry));
                else cells.push(new TableCell({ children: [new Paragraph('')], verticalAlign: VerticalAlign.CENTER }));
            });
            return new TableRow({ children: cells });
        });
    
        const table = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...bodyRows],
        });
    
        const footer = new Footer({
            children: [
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph("Teacher:")],
                                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                }),
                                new TableCell({
                                    children: [new Paragraph({ text: "Headmaster:", alignment: AlignmentType.CENTER })],
                                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                }),
                                new TableCell({
                                    children: [new Paragraph({ text: "Inspector:", alignment: AlignmentType.RIGHT })],
                                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        const header = new Header({
            children: [
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 6, color: "auto" },
                        left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                        insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph(`Teacher: ${currentUser.name}`)],
                                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                }),
                                new TableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: "English Timetable", bold: true})], alignment: AlignmentType.CENTER })],
                                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                }),
                                new TableCell({
                                    children: [new Paragraph({ text: `School: ${getSchoolsInTimetable()}`, alignment: AlignmentType.RIGHT })],
                                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: { top: 1440, right: 720, bottom: 720, left: 720 },
                        size: { orientation: PageOrientation.LANDSCAPE },
                    },
                },
                headers: {
                    default: header,
                },
                footers: {
                    default: footer,
                },
                children: [
                    table,
                ],
            }],
        });
    
        Packer.toBlob(doc).then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `timetable.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
        
        setIsExportMenuOpen(false);
    };

  const inputClasses = "w-full p-2 rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none border border-[var(--color-border)]";
  const buttonClasses = "blueprint-button-secondary w-full py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left mb-8">
        <div>
            <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-text-primary)]">
            Timetable Editor
            <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-accent)' }} />
            </h2>
            <p className="text-[var(--color-text-secondary)] mt-2 px-4 sm:px-0">Manage schools, classes, and weekly schedule.</p>
        </div>
        <div className="relative mt-4 sm:mt-0" ref={exportMenuRef}>
            <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="interactive-glow bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center py-2 px-4 text-sm font-medium rounded-lg"
                aria-haspopup="true" aria-expanded={isExportMenuOpen}
            >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Export
                <ChevronDownIcon className={`w-5 h-5 ml-1 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-lg z-20">
                    <div className="py-1">
                        <button onClick={handleExportWord} className="block w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-inset-bg)]">As Word (.docx)</button>
                        <button onClick={handleExportPdf} className="block w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-inset-bg)]">As PDF</button>
                    </div>
                </div>
            )}
        </div>
      </div>


      {error && <div className="mb-4 blueprint-card p-3" style={{'--color-surface': 'var(--color-error-surface)', '--color-border': 'var(--color-error-border)', color: 'var(--color-error-text)'} as React.CSSProperties}>{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* School Management */}
        <div className="blueprint-card p-6">
          <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-accent)' }}>Manage Schools</h3>
          <div className="space-y-3 mb-4">
            <input type="text" value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)} placeholder="New School Name" className={inputClasses} style={{backgroundColor: 'var(--color-input-bg)'}} />
            <button onClick={handleAddSchool} className={buttonClasses}>Add School</button>
          </div>
          <h4 className="text-md font-medium mb-1 text-[var(--color-text-primary)]">Existing Schools:</h4>
           <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar-container">
              {schools.length === 0 ? <p className="text-sm text-[var(--color-text-secondary)]">No schools added.</p> :
                  schools.map(school => (
                      <div key={school.id} className="group flex items-center justify-between p-1 rounded-md hover:bg-[var(--color-inset-bg)]">
                          {editingSchoolId === school.id ? (
                              <>
                                <input type="text" value={editingSchoolName} onChange={e => setEditingSchoolName(e.target.value)}
                                  className={`${inputClasses} text-sm p-1 flex-grow mr-2`} style={{ backgroundColor: 'var(--color-surface)' }} autoFocus/>
                                <div className="flex items-center">
                                    <button onClick={handleUpdateSchool} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-full"><CheckIcon className="w-5 h-5"/></button>
                                    <button onClick={() => setEditingSchoolId(null)} className="p-1 text-slate-500 hover:bg-slate-500/10 rounded-full"><XIcon className="w-5 h-5"/></button>
                                </div>
                              </>
                          ) : (
                              <>
                                <span className="text-sm text-[var(--color-text-secondary)]">{school.name}</span>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingSchoolId(school.id); setEditingSchoolName(school.name); }} className="p-1 text-slate-500 hover:text-[var(--color-accent)]"><PencilIcon className="w-4 h-4"/></button>
                                    <button onClick={() => handleDeleteSchool(school.id)} className="p-1 text-slate-500 hover:text-rose-500"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                              </>
                          )}
                      </div>
                  ))
              }
            </div>
        </div>

        {/* Class Management */}
        <div className="blueprint-card p-6">
          <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-accent)' }}>Manage Classes</h3>
          <div className="space-y-3 mb-4">
            <input type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="Class Name (e.g., Year 3A)" className={inputClasses} style={{backgroundColor: 'var(--color-input-bg)'}} />
            <input type="text" value={newClassSubject} onChange={(e) => setNewClassSubject(e.target.value)} placeholder="Subject (e.g., Maths)" className={inputClasses} style={{backgroundColor: 'var(--color-input-bg)'}} />
            <select value={selectedSchoolForNewClass} onChange={(e) => setSelectedSchoolForNewClass(e.target.value)} disabled={schools.length === 0} className={`${inputClasses} disabled:opacity-50`} style={{backgroundColor: 'var(--color-input-bg)'}}>
              <option value="">{schools.length === 0 ? "Add a school first" : "Select School"}</option>
              {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
            </select>
            <button onClick={handleAddClass} disabled={schools.length === 0} className={buttonClasses}>Add Class</button>
          </div>
        </div>
        
        {/* Available Classes */}
        <div className="blueprint-card p-6">
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-accent)' }}>Available Classes</h3>
            {classes.length === 0 ? <p className="text-sm text-[var(--color-text-secondary)]">No classes added.</p> :
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar-container pr-2">
                {classes.map(cls => (
                    <div key={cls.id} className="group p-2 rounded-lg transition-all"
                        style={{ backgroundColor: selectedClassForAssignment === cls.id ? 'var(--color-inset-bg)' : 'transparent' }}
                    >
                        <div onClick={() => setSelectedClassForAssignment(cls.id === selectedClassForAssignment ? null : cls.id)} className="cursor-pointer">
                            <p className="font-medium text-[var(--color-text-primary)]">{cls.name} - {cls.subject}</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">{getSchoolDetails(cls.schoolId)?.name || 'Unknown School'}</p>
                        </div>
                        <div className="flex items-center justify-end space-x-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setClassToEdit(cls); setIsEditClassModalOpen(true); }} className="p-1 text-slate-500 hover:text-[var(--color-accent)]"><PencilIcon className="w-4 h-4"/></button>
                            <button onClick={() => handleDeleteClass(cls.id)} className="p-1 text-slate-500 hover:text-rose-500"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    </div>
                ))}
                </div>
            }
            {selectedClassForAssignment && <p className="mt-3 text-sm" style={{color: 'var(--color-accent)'}}>Selected: {getClassDetails(selectedClassForAssignment)?.name}. Click a slot to assign/unassign.</p>}
        </div>
      </div>

      {/* Timetable */}
      <div className="blueprint-card p-4 sm:p-6 overflow-x-auto">
        <div className="grid border-separate" style={{ gridTemplateColumns: `minmax(100px, auto) repeat(${TIMETABLE_DAYS.length}, minmax(120px, 1fr))`, borderSpacing: '4px' }}>
          <div className="p-2 font-semibold text-center sticky left-0 z-10 text-[var(--color-text-primary)] bg-[var(--color-surface)]">Time</div>
          {TIMETABLE_DAYS.map(day => <div key={day} className="p-2 font-semibold text-center text-[var(--color-text-primary)]">{day}</div>)}
          {TIME_PERIODS.map((period, periodIndex) => (
            <React.Fragment key={period}>
              <div className="p-2 font-medium text-center sticky left-0 z-10 flex items-center justify-center text-[var(--color-text-secondary)] text-xs sm:text-sm bg-[var(--color-surface)]">{period}</div>
              {TIMETABLE_DAYS.map(day => {
                const classId = timetableData[day]?.[periodIndex];
                const classEntry = getClassDetails(classId);
                const school = classEntry ? getSchoolDetails(classEntry.schoolId) : null;
                const isLunch = period === "11:15 - 13:00";
                const isPause = period === "09:30 - 09:45";
                const isSpecialSlot = isLunch || isPause;
                
                let cellClasses = "p-1.5 sm:p-2 min-h-[60px] text-xs rounded-lg transition-all duration-150 ease-in-out flex items-center justify-center text-center";
                if(isSpecialSlot) cellClasses += ' bg-[var(--color-accent)] text-white font-medium';
                else if (classEntry) cellClasses += ' blueprint-card text-left items-start p-2';
                else cellClasses += ' rounded-lg cursor-pointer bg-[var(--color-inset-bg)] hover:shadow-inner';

                return (
                  <div key={`${day}-${period}`} onClick={() => !isSpecialSlot && handleTimetableSlotClick(day, periodIndex)} className={cellClasses} >
                    {isLunch ? <span>Lunch Break</span> : isPause ? <span>Pause</span> : classEntry ? (
                      <div className='text-[var(--color-text-primary)]'>
                        <p className="font-semibold">{classEntry.name}</p>
                        <p className="text-[10px] sm:text-xs">{classEntry.subject}</p>
                        <p className="text-[9px] sm:text-[10px] italic text-[var(--color-text-secondary)]">{school?.name || 'N/A'}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      
        {isEditClassModalOpen && classToEdit && (
            <EditClassModal
                isOpen={isEditClassModalOpen}
                onClose={() => setIsEditClassModalOpen(false)}
                classToEdit={classToEdit}
                onSave={handleUpdateClass}
                schools={schools}
            />
        )}
    </div>
  );
};


const EditClassModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    classToEdit: ClassEntry,
    onSave: (updatedClass: ClassEntry) => void,
    schools: School[]
}> = ({ isOpen, onClose, classToEdit, onSave, schools }) => {
    const [name, setName] = useState(classToEdit.name);
    const [subject, setSubject] = useState(classToEdit.subject);
    const [schoolId, setSchoolId] = useState(classToEdit.schoolId);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({ ...classToEdit, name, subject, schoolId });
    };

    const inputClasses = "w-full p-3 rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] border border-[var(--color-border)]";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div 
                className="relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden" 
                onClick={e => e.stopPropagation()}
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)'}}
            >
                <div className="p-8">
                    <h3 className="text-xl font-semibold mb-4 text-center" style={{ color: 'var(--color-accent)' }}>Edit Class</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">Class Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} style={{ backgroundColor: 'var(--color-input-bg)'}} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">Subject</label>
                            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className={inputClasses} style={{ backgroundColor: 'var(--color-input-bg)'}} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 block">School</label>
                            <select value={schoolId} onChange={e => setSchoolId(e.target.value)} className={inputClasses} style={{ backgroundColor: 'var(--color-input-bg)'}}>
                                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={onClose} className="py-2 px-4 rounded-lg text-sm blueprint-button-secondary">Cancel</button>
                        <button onClick={handleSave} className="py-2 px-4 rounded-lg text-sm blueprint-button">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default TimetableEditor;