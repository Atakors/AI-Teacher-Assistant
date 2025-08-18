import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CanvasElement, CanvasTool, TextElement, ImageElement, ShapeElement } from '../types';
import {
  SelectIcon, TextIcon, PhotoIcon as ImageIcon, RectIcon, EllipseIcon,
  BoldIcon, ItalicIcon, TrashIcon, LayerForwardIcon, LayerBackwardIcon,
  SendToBackIcon, BringToFrontIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon,
  MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, ArrowsPointingInIcon, BookmarkSquareIcon,
  SparklesIcon, DocumentDuplicateIcon
} from './constants';

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const GRID_SIZE = 10;

interface CreatorStudioViewProps {
  elements: CanvasElement[];
  setElements: (elements: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => void;
  onSave: (elements: CanvasElement[]) => void;
}

const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

const CreatorStudioView: React.FC<CreatorStudioViewProps> = ({ elements, setElements, onSave }) => {
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.6);
  const [history, setHistory] = useState<CanvasElement[][]>([elements]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const editingTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const interactionState = useRef<{
    isInteracting: boolean;
    interactionType: 'drag' | 'resize' | 'rotate' | null;
    handle: string | null;
    elementStart: CanvasElement | null;
    dragStart: { x: number; y: number };
    elementCenter: { x: number; y: number };
  }>({
    isInteracting: false,
    interactionType: null,
    handle: null,
    elementStart: null,
    dragStart: { x: 0, y: 0 },
    elementCenter: { x: 0, y: 0 },
  });

  // --- HISTORY MANAGEMENT ---
  const updateHistory = (newElements: CanvasElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleSetElements = (newElements: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[]), addToHistory: boolean = true) => {
    const updatedElements = typeof newElements === 'function' ? newElements(elements) : newElements;
    setElements(updatedElements);
    if (addToHistory) {
      updateHistory(updatedElements);
    }
  };

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      setSelectedElementId(null);
    }
  }, [historyIndex, history, setElements]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      setSelectedElementId(null);
    }
  }, [historyIndex, history, setElements]);

  // --- ELEMENT MANIPULATION ---
  const updateElement = (id: string, updates: Partial<CanvasElement>, finalize: boolean = false) => {
    const applyUpdates = (prev: CanvasElement[]) => prev.map(el => (el.id === id ? { ...el, ...updates } as CanvasElement : el));
    handleSetElements(applyUpdates, finalize);
  };
  
  const addElement = (type: 'text' | 'shape', shapeType?: 'rectangle' | 'ellipse') => {
      let newElement: CanvasElement;
      const newId = `el_${Date.now()}`;
      if(type === 'text') {
          newElement = { id: newId, type: 'text', text: 'New Text', x: 100, y: 100, width: 200, height: 40, rotation: 0, opacity: 1, fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', color: '#111827' };
      } else {
          newElement = { id: newId, type: 'shape', shape: shapeType!, x: 150, y: 150, width: 150, height: 100, rotation: 0, opacity: 1, fill: '#bfdbfe', stroke: '#3b82f6', strokeWidth: 1 };
      }
      handleSetElements(prev => [...prev, newElement]);
      setSelectedElementId(newId);
      setActiveTool('select');
  };

  const handleDeleteElement = () => {
    if (!selectedElementId) return;
    handleSetElements(elements.filter(el => el.id !== selectedElementId));
    setSelectedElementId(null);
  };

  const handleDuplicateElement = () => {
    const selectedElement = elements.find(el => el.id === selectedElementId);
    if (!selectedElement) return;

    const newElementProps = {
      id: `el_${Date.now()}`,
      x: selectedElement.x + GRID_SIZE,
      y: selectedElement.y + GRID_SIZE,
    };
    
    let newElement: CanvasElement;

    // Using if/else if helps TypeScript correctly narrow the type of selectedElement
    if (selectedElement.type === 'text') {
      newElement = { ...selectedElement, ...newElementProps };
    } else if (selectedElement.type === 'image') {
      newElement = { ...selectedElement, ...newElementProps };
    } else if (selectedElement.type === 'shape') {
      newElement = { ...selectedElement, ...newElementProps };
    } else {
      return;
    }
    
    handleSetElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
            const newId = `el_${Date.now()}`;
            const newElement: ImageElement = {
              id: newId,
              type: 'image',
              x: 100,
              y: 100,
              width: img.width > 300 ? 300 : img.width,
              height: img.width > 300 ? img.height * (300 / img.width) : img.height,
              rotation: 0,
              opacity: 1,
              src: reader.result as string,
            };
            handleSetElements(prev => [...prev, newElement]);
            setSelectedElementId(newId);
            setActiveTool('select');
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset file input
    }
  };
  
  const handleLayering = (direction: 'forward' | 'backward' | 'front' | 'back') => {
    if (!selectedElementId) return;
    const currentIndex = elements.findIndex(el => el.id === selectedElementId);
    if (currentIndex === -1) return;
    const newElements = [...elements];
    const [elementToMove] = newElements.splice(currentIndex, 1);
    let newIndex = currentIndex;
    if (direction === 'forward' && currentIndex < newElements.length) {
      newIndex = currentIndex + 1;
    } else if (direction === 'backward' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'front') {
      newIndex = newElements.length;
    } else if (direction === 'back') {
      newIndex = 0;
    }
    newElements.splice(newIndex, 0, elementToMove);
    handleSetElements(newElements);
  };
  
  // --- MOUSE & KEYBOARD EVENT HANDLING ---
  const getCanvasCoordinates = (e: MouseEvent): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.detail > 1) {
      e.preventDefault();
      return;
    }
    const target = e.target as HTMLElement;
    const elementId = target.closest('[data-element-id]')?.getAttribute('data-element-id');
    const handle = target.getAttribute('data-handle');

    const startCoords = getCanvasCoordinates(e.nativeEvent);

    if (elementId) {
      setSelectedElementId(elementId);
      setEditingElementId(null);
      const element = elements.find(el => el.id === elementId);
      if (element) {
        interactionState.current = {
          isInteracting: true,
          interactionType: handle ? (handle === 'rotate' ? 'rotate' : 'resize') : 'drag',
          handle: handle,
          elementStart: { ...element },
          dragStart: startCoords,
          elementCenter: {
            x: element.x + element.width / 2,
            y: element.y + element.height / 2,
          }
        };
      }
    } else {
      setSelectedElementId(null);
      setEditingElementId(null);
    }
  }, [elements, zoom]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!interactionState.current.isInteracting || !interactionState.current.elementStart) return;
    e.preventDefault();

    const { interactionType, elementStart, dragStart, handle, elementCenter } = interactionState.current;
    const currentCoords = getCanvasCoordinates(e);
    const dx = currentCoords.x - dragStart.x;
    const dy = currentCoords.y - dragStart.y;
    
    if (interactionType === 'drag') {
        updateElement(elementStart.id, { x: snapToGrid(elementStart.x + dx), y: snapToGrid(elementStart.y + dy) });
    } else if (interactionType === 'resize' && handle) {
        let { x, y, width, height } = elementStart;
        if (handle.includes('r')) width = Math.max(GRID_SIZE, snapToGrid(elementStart.width + dx));
        if (handle.includes('b')) height = Math.max(GRID_SIZE, snapToGrid(elementStart.height + dy));
        if (handle.includes('l')) {
            width = Math.max(GRID_SIZE, snapToGrid(elementStart.width - dx));
            x = snapToGrid(elementStart.x + dx);
        }
        if (handle.includes('t')) {
            height = Math.max(GRID_SIZE, snapToGrid(elementStart.height - dy));
            y = snapToGrid(elementStart.y + dy);
        }
        updateElement(elementStart.id, { x, y, width, height });
    } else if (interactionType === 'rotate') {
        const angle = Math.atan2(currentCoords.y - elementCenter.y, currentCoords.x - elementCenter.x) * (180 / Math.PI) + 90;
        updateElement(elementStart.id, { rotation: Math.round(angle) });
    }

  }, [zoom]);
  
  const handleMouseUp = useCallback(() => {
    if(interactionState.current.isInteracting) {
        handleSetElements(elements, true); // Finalize and add to history
    }
    interactionState.current.isInteracting = false;
  }, [elements]);

  const handleDoubleClick = (e: React.MouseEvent, element: CanvasElement) => {
    e.stopPropagation();
    interactionState.current.isInteracting = false;
  
    if (element.type === 'text') {
      setEditingElementId(element.id);
    }
  };

  useEffect(() => {
    if (editingElementId && editingTextareaRef.current) {
        editingTextareaRef.current.focus();
        editingTextareaRef.current.select();
    }
  }, [editingElementId]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingElementId) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedElementId) handleDeleteElement(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedElementId, editingElementId]);

  const selectedElement = elements.find(el => el.id === selectedElementId) || null;
  const ToolButton: React.FC<{ tool: CanvasTool, Icon: React.ElementType, onClick?: () => void, title: string }> = ({ tool, Icon, onClick, title }) => (
    <button onClick={onClick || (() => setActiveTool(tool))} className={`p-3 rounded-lg w-full ${activeTool === tool ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-inset-bg)]'}`} title={title}><Icon className="w-6 h-6 mx-auto" /></button>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--color-inset-bg)] text-[var(--color-text-primary)]">
      <header className="flex-shrink-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] p-2 flex items-center justify-between z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={historyIndex === 0} className="p-2 rounded-md hover:bg-[var(--color-inset-bg)] disabled:opacity-50" title="Undo (Ctrl+Z)"><ArrowUturnLeftIcon className="w-5 h-5" /></button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-md hover:bg-[var(--color-inset-bg)] disabled:opacity-50" title="Redo (Ctrl+Y)"><ArrowUturnRightIcon className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-2 rounded-md hover:bg-[var(--color-inset-bg)]" title="Zoom Out"><MagnifyingGlassMinusIcon className="w-5 h-5" /></button>
          <span className="text-sm font-medium w-16 text-center tabular-nums">{(zoom * 100).toFixed(0)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-2 rounded-md hover:bg-[var(--color-inset-bg)]" title="Zoom In"><MagnifyingGlassPlusIcon className="w-5 h-5" /></button>
          <button onClick={() => setZoom(0.6)} className="p-2 rounded-md hover:bg-[var(--color-inset-bg)]" title="Fit to View"><ArrowsPointingInIcon className="w-5 h-5"/></button>
        </div>
        <button onClick={() => onSave(elements)} className="blueprint-button py-2 px-4 rounded-lg text-sm flex items-center gap-2"><BookmarkSquareIcon className="w-5 h-5"/> Save Canvas</button>
      </header>
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        <aside className="w-full lg:w-16 bg-[var(--color-surface)] border-b lg:border-b-0 lg:border-r border-[var(--color-border)] p-2 flex lg:flex-col items-center gap-2">
          <ToolButton tool="select" Icon={SelectIcon} title="Select"/>
          <ToolButton tool="text" Icon={TextIcon} onClick={() => addElement('text')} title="Add Text"/>
          <ToolButton tool="image" Icon={ImageIcon} onClick={() => fileInputRef.current?.click()} title="Add Image"/>
          <ToolButton tool="rectangle" Icon={RectIcon} onClick={() => addElement('shape', 'rectangle')} title="Add Rectangle"/>
          <ToolButton tool="ellipse" Icon={EllipseIcon} onClick={() => addElement('shape', 'ellipse')} title="Add Ellipse"/>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        </aside>

        <main className="flex-grow overflow-auto custom-scrollbar-container p-4 md:p-8 flex justify-center items-start" onMouseDown={handleMouseDown}>
          <div ref={canvasRef} id="canvas-container" className="relative shadow-lg flex-shrink-0" style={{ width: A4_WIDTH, height: A4_HEIGHT, transform: `scale(${zoom})`, transformOrigin: 'top left', backgroundColor: '#FFF' }}>
            <svg width="100%" height="100%" className="absolute top-0 left-0 pointer-events-none"><defs><pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse"><path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#e5e7eb" strokeWidth="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg>
            {elements.map(el => (
              <div key={el.id} data-element-id={el.id} onDoubleClick={(e) => handleDoubleClick(e, el)} className="absolute cursor-move" style={{ left: el.x, top: el.y, width: el.width, height: el.height, transform: `rotate(${el.rotation}deg)`, opacity: el.opacity }}>
                {el.id === editingElementId && el.type === 'text' ? (
                  <textarea ref={editingTextareaRef} value={el.text} onChange={(e) => updateElement(el.id, { text: e.target.value })} onBlur={() => { setEditingElementId(null); updateHistory(elements); }} style={{ fontFamily: el.fontFamily, fontSize: el.fontSize, fontWeight: el.fontWeight, fontStyle: el.fontStyle, color: el.color, textAlign: el.textAlign, width: '100%', height: '100%', border: '1px solid var(--color-accent)', background: 'rgba(255,255,255,0.9)', resize: 'none', outline: 'none' }} />
                ) : ( el.type === 'text' && <div style={{ fontFamily: el.fontFamily, fontSize: el.fontSize, fontWeight: el.fontWeight, fontStyle: el.fontStyle, color: el.color, textAlign: el.textAlign, width: '100%', height: '100%', whiteSpace: 'pre-wrap', overflow: 'hidden', pointerEvents: 'none' }}>{el.text}</div> )}
                {el.type === 'image' && <img src={el.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable="false" className="pointer-events-none" />}
                {el.type === 'shape' && el.shape === 'rectangle' && <div style={{ width: '100%', height: '100%', backgroundColor: el.fill, border: `${el.strokeWidth}px solid ${el.stroke}` }} className="pointer-events-none"/>}
                {el.type === 'shape' && el.shape === 'ellipse' && <div style={{ width: '100%', height: '100%', backgroundColor: el.fill, border: `${el.strokeWidth}px solid ${el.stroke}`, borderRadius: '50%' }} className="pointer-events-none" />}
              </div>
            ))}
            {selectedElement && <SelectionBox element={selectedElement} />}
          </div>
        </main>
        
        <aside className="w-full lg:w-64 bg-[var(--color-surface)] border-t lg:border-t-0 lg:border-l border-[var(--color-border)] p-4 overflow-y-auto custom-scrollbar-container">
          <h3 className="font-semibold mb-4 border-b pb-2">Properties</h3>
          {selectedElement ? <PropertiesPanel selectedElement={selectedElement} updateElement={updateElement} finalizeUpdate={() => handleSetElements(elements, true)} handleDelete={handleDeleteElement} handleLayering={handleLayering} handleDuplicate={handleDuplicateElement} />
           : <div className="text-center py-10"><SparklesIcon className="w-12 h-12 mx-auto text-[var(--color-text-secondary)] opacity-50"/><p className="text-sm text-[var(--color-text-secondary)] mt-2">Select an element to edit.</p></div>}
        </aside>
      </div>
    </div>
  );
};

const SelectionBox: React.FC<{ element: CanvasElement }> = ({ element }) => {
  const handles = ['tl', 't', 'tr', 'l', 'r', 'bl', 'b', 'br', 'rotate'];
  const HANDLE_SIZE = 8;
  const HANDLE_HITBOX_SIZE = 24;

  const getHandleContainerStyle = (handle: string): React.CSSProperties => {
    const style: React.CSSProperties = {
      position: 'absolute',
      width: HANDLE_HITBOX_SIZE,
      height: HANDLE_HITBOX_SIZE,
      pointerEvents: 'auto',
    };

    if (handle.includes('l')) style.left = -HANDLE_HITBOX_SIZE / 2;
    if (handle.includes('r')) style.left = element.width - HANDLE_HITBOX_SIZE / 2;
    if (handle.includes('t')) style.top = -HANDLE_HITBOX_SIZE / 2;
    if (handle.includes('b')) style.top = element.height - HANDLE_HITBOX_SIZE / 2;
    if (handle === 't' || handle === 'b') style.left = element.width / 2 - HANDLE_HITBOX_SIZE / 2;
    if (handle === 'l' || handle === 'r') style.top = element.height / 2 - HANDLE_HITBOX_SIZE / 2;
    
    if (handle === 'rotate') {
      style.top = -30;
      style.left = element.width / 2 - HANDLE_HITBOX_SIZE / 2;
      style.cursor = 'grab';
    } else {
      const cursors: { [key: string]: string } = { tl: 'nwse-resize', t: 'ns-resize', tr: 'nesw-resize', l: 'ew-resize', r: 'ew-resize', bl: 'nesw-resize', b: 'ns-resize', br: 'nwse-resize' };
      if (cursors[handle]) style.cursor = cursors[handle];
    }

    return style;
  };

  const innerHandleStyle: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: HANDLE_SIZE,
      height: HANDLE_SIZE,
      border: '1px solid white',
      background: 'var(--color-accent)',
      borderRadius: '50%',
      boxShadow: '0 0 5px rgba(0,0,0,0.3)',
  };

  return (
    <div className="absolute pointer-events-none" style={{ left: element.x, top: element.y, width: element.width, height: element.height, transform: `rotate(${element.rotation}deg)`}}>
      <div className="w-full h-full relative" style={{ border: '1px solid var(--color-accent)' }}>
        {handles.map(h => (
          <div key={h} data-handle={h} style={getHandleContainerStyle(h)}>
            <div style={innerHandleStyle} />
          </div>
        ))}
        <div className="absolute pointer-events-none" style={{ top: -30 + (HANDLE_HITBOX_SIZE / 2), left: element.width / 2, height: 30 - (HANDLE_HITBOX_SIZE / 2), borderLeft: '1px solid var(--color-accent)' }} />
      </div>
    </div>
  );
};

const PropertiesPanel: React.FC<{ selectedElement: CanvasElement; updateElement: (id: string, updates: Partial<CanvasElement>, finalize?: boolean) => void; finalizeUpdate: () => void; handleDelete: () => void; handleLayering: (dir: 'forward' | 'backward' | 'front' | 'back') => void; handleDuplicate: () => void; }> = ({ selectedElement, updateElement, finalizeUpdate, handleDelete, handleLayering, handleDuplicate }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-2 text-sm">
      <button onClick={() => handleLayering('forward')} className="p-2 rounded-md hover:bg-[var(--color-inset-bg)] flex items-center justify-center gap-1"><LayerForwardIcon className="w-4 h-4"/> Forward</button>
      <button onClick={() => handleLayering('backward')} className="p-2 rounded-md hover:bg-[var(--color-inset-bg)] flex items-center justify-center gap-1"><LayerBackwardIcon className="w-4 h-4"/> Backward</button>
      <button onClick={() => handleLayering('front')} className="p-2 rounded-md hover:bg-[var(--color-inset-bg)] flex items-center justify-center gap-1"><BringToFrontIcon className="w-4 h-4"/> To Front</button>
      <button onClick={() => handleLayering('back')} className="p-2 rounded-md hover:bg-[var(--color-inset-bg)] flex items-center justify-center gap-1"><SendToBackIcon className="w-4 h-4"/> To Back</button>
    </div>
    <div className="flex items-center gap-2">
      <button onClick={handleDuplicate} className="w-full blueprint-button-secondary text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2"><DocumentDuplicateIcon className="w-4 h-4" /> Duplicate</button>
      <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500"><TrashIcon className="w-5 h-5" /></button>
    </div>
    
    <div className="space-y-2 pt-2 border-t text-sm">
      <div className="grid grid-cols-2 gap-2">
          <div><label>X</label><input type="number" value={Math.round(selectedElement.x)} onChange={e => updateElement(selectedElement.id, { x: parseInt(e.target.value) })} onBlur={finalizeUpdate} className="w-full p-2 rounded border bg-[var(--color-input-bg)]"/></div>
          <div><label>Y</label><input type="number" value={Math.round(selectedElement.y)} onChange={e => updateElement(selectedElement.id, { y: parseInt(e.target.value) })} onBlur={finalizeUpdate} className="w-full p-2 rounded border bg-[var(--color-input-bg)]"/></div>
          <div><label>W</label><input type="number" value={Math.round(selectedElement.width)} onChange={e => updateElement(selectedElement.id, { width: parseInt(e.target.value) })} onBlur={finalizeUpdate} className="w-full p-2 rounded border bg-[var(--color-input-bg)]"/></div>
          <div><label>H</label><input type="number" value={Math.round(selectedElement.height)} onChange={e => updateElement(selectedElement.id, { height: parseInt(e.target.value) })} onBlur={finalizeUpdate} className="w-full p-2 rounded border bg-[var(--color-input-bg)]"/></div>
          <div><label>Angle</label><input type="number" value={Math.round(selectedElement.rotation)} onChange={e => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })} onBlur={finalizeUpdate} className="w-full p-2 rounded border bg-[var(--color-input-bg)]"/></div>
      </div>
    </div>

    {selectedElement.type === 'text' && (
      <div className="space-y-4 pt-2 border-t">
        <label className="text-xs font-bold uppercase">Text</label>
        <div>
            <label htmlFor="font-family-select" className="text-sm">Font Family</label>
            <select 
                id="font-family-select"
                value={(selectedElement as TextElement).fontFamily} 
                onChange={e => updateElement(selectedElement.id, { fontFamily: e.target.value }, true)}
                className="w-full p-2 rounded border bg-[var(--color-input-bg)] text-sm"
                style={{ fontFamily: (selectedElement as TextElement).fontFamily }}
            >
                <option value="Inter, sans-serif" style={{ fontFamily: 'Inter, sans-serif' }}>Inter</option>
                <option value="Roboto, sans-serif" style={{ fontFamily: 'Roboto, sans-serif' }}>Roboto</option>
                <option value="Lato, sans-serif" style={{ fontFamily: 'Lato, sans-serif' }}>Lato</option>
                <option value="Montserrat, sans-serif" style={{ fontFamily: 'Montserrat, sans-serif' }}>Montserrat</option>
                <option value="'Playfair Display', serif" style={{ fontFamily: "'Playfair Display', serif" }}>Playfair Display</option>
                <option value="'Courier Prime', monospace" style={{ fontFamily: "'Courier Prime', monospace" }}>Courier Prime</option>
                <option value="Arial, sans-serif" style={{ fontFamily: 'Arial, sans-serif' }}>Arial</option>
                <option value="Georgia, serif" style={{ fontFamily: 'Georgia, serif' }}>Georgia</option>
            </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
            <div>
                <label className="text-sm">Size</label>
                <input type="number" value={(selectedElement as TextElement).fontSize} onChange={e => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 12 })} onBlur={finalizeUpdate} className="w-full p-2 rounded border bg-[var(--color-input-bg)] text-sm" />
            </div>
            <div>
                <label className="text-sm">Color</label>
                <input type="color" value={(selectedElement as TextElement).color} onChange={e => updateElement(selectedElement.id, { color: e.target.value })} onBlur={finalizeUpdate} className="w-full h-10 p-1 border-none cursor-pointer rounded bg-[var(--color-input-bg)]" />
            </div>
        </div>
        <div className="flex items-center p-1 rounded-lg bg-[var(--color-inset-bg)]">
          <button onClick={() => updateElement(selectedElement.id, { fontWeight: (selectedElement as TextElement).fontWeight === 'bold' ? 'normal' : 'bold' }, true)} className={`w-full p-1 rounded ${ (selectedElement as TextElement).fontWeight === 'bold' ? 'bg-[var(--color-surface)] shadow-sm' : ''}`}><BoldIcon className="w-5 h-5 mx-auto"/></button>
          <button onClick={() => updateElement(selectedElement.id, { fontStyle: (selectedElement as TextElement).fontStyle === 'italic' ? 'normal' : 'italic' }, true)} className={`w-full p-1 rounded ${ (selectedElement as TextElement).fontStyle === 'italic' ? 'bg-[var(--color-surface)] shadow-sm' : ''}`}><ItalicIcon className="w-5 h-5 mx-auto"/></button>
        </div>
      </div>
    )}
    {selectedElement.type === 'shape' && (
      <div className="space-y-2 pt-2 border-t">
        <label className="text-xs font-bold uppercase">Shape</label>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Fill <input type="color" value={(selectedElement as ShapeElement).fill} onChange={e => updateElement(selectedElement.id, { fill: e.target.value })} onBlur={finalizeUpdate} className="w-full h-10 p-1 border-none cursor-pointer rounded bg-[var(--color-input-bg)]" /></div>
          <div>Stroke <input type="color" value={(selectedElement as ShapeElement).stroke} onChange={e => updateElement(selectedElement.id, { stroke: e.target.value })} onBlur={finalizeUpdate} className="w-full h-10 p-1 border-none cursor-pointer rounded bg-[var(--color-input-bg)]" /></div>
        </div>
      </div>
    )}
  </div>
);

export default CreatorStudioView;