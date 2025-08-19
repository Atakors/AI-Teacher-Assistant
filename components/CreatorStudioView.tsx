
import React, { useState, useRef, useEffect } from 'react';
import { CanvasElement, TextElement, ImageElement, ShapeElement } from '../types';
import { MousePointerIcon, TypeIcon, RectangleIcon, CircleIcon, PhotoIcon, TrashIcon } from './constants';

interface CreatorStudioViewProps {
  elements: CanvasElement[];
  setElements: (elements: CanvasElement[]) => void;
  onSave: (elements: CanvasElement[]) => void;
}

type Tool = 'select' | 'text' | 'rectangle' | 'circle';

const CreatorStudioView: React.FC<CreatorStudioViewProps> = ({ elements, setElements, onSave }) => {
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [draggingState, setDraggingState] = useState<{ elementId: string; offsetX: number; offsetY: number } | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedElement = elements.find(el => el.id === selectedElementId);

  // Add a new element to the canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If we clicked on the canvas background itself
    if (e.target === canvasRef.current) {
        if (activeTool === 'select') {
            setSelectedElementId(null);
            return;
        }

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newId = `el_${Date.now()}`;
        let newElement: CanvasElement | null = null;

        switch (activeTool) {
            case 'text':
                newElement = { id: newId, type: 'text', x, y, width: 150, height: 24, rotation: 0, text: 'New Text', fontSize: 16, fontFamily: 'Inter', color: '#1F2937' };
                break;
            case 'rectangle':
                newElement = { id: newId, type: 'shape', shapeType: 'rectangle', x, y, width: 100, height: 60, rotation: 0, fill: '#a7f3d0', stroke: '#065f46', strokeWidth: 0 };
                break;
            case 'circle':
                newElement = { id: newId, type: 'shape', shapeType: 'circle', x, y, width: 80, height: 80, rotation: 0, fill: '#bfdbfe', stroke: '#1e40af', strokeWidth: 0 };
                break;
        }

        if (newElement) {
            setElements([...elements, newElement]);
            setSelectedElementId(newId);
            setActiveTool('select');
        }
    }
  };
  
  // Start dragging an element
  const handleElementMouseDown = (e: React.MouseEvent, element: CanvasElement) => {
    e.stopPropagation();
    if (activeTool !== 'select') return;

    setSelectedElementId(element.id);
    
    // Calculate offset from the top-left corner of the element
    const elementDiv = e.currentTarget as HTMLDivElement;
    const rect = elementDiv.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDraggingState({ elementId: element.id, offsetX, offsetY });
  };
  
  // Handle dragging movement
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingState || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - canvasRect.left - draggingState.offsetX;
    const newY = e.clientY - canvasRect.top - draggingState.offsetY;

    setElements(elements.map(el =>
      el.id === draggingState.elementId ? { ...el, x: newX, y: newY } : el
    ));
  };
  
  // Stop dragging
  const handleMouseUp = () => {
    setDraggingState(null);
  };
  
  const updateSelectedElement = (updates: Partial<CanvasElement>) => {
    if (!selectedElementId) return;
    setElements(elements.map(el =>
      el.id === selectedElementId ? { ...el, ...updates } : el
    ) as CanvasElement[]);
  };

  const handleDeleteElement = () => {
    if (!selectedElementId) return;
    setElements(elements.filter(el => el.id !== selectedElementId));
    setSelectedElementId(null);
  };
  
  // Handle keyboard events (e.g., delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        handleDeleteElement();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, elements]);
  
  // Handle image upload from file input
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const newElement: ImageElement = {
            id: `el_${Date.now()}`, type: 'image', x: 20, y: 20, 
            width: img.width > 200 ? 200 : img.width, 
            height: img.width > 200 ? (img.height * (200 / img.width)) : img.height,
            rotation: 0,
            src: event.target?.result as string,
          };
          setElements([...elements, newElement]);
          setSelectedElementId(newElement.id);
        }
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(e.target.files[0]);
    }
    if(e.target) e.target.value = '';
  };

  const ToolbarButton = ({ tool, label, Icon, action }: { tool?: Tool, label: string, Icon: React.ElementType, action?: () => void }) => (
    <button
      onClick={() => action ? action() : (tool && setActiveTool(tool))}
      className={`w-full flex items-center justify-start p-3 gap-3 rounded-lg text-sm transition-colors ${activeTool === tool ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-inset-bg)] text-[var(--color-text-primary)]'}`}
      title={label}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span>{label}</span>
    </button>
  );
  
  const inputClasses = "w-full p-2 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-input-bg)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

  return (
    <div className="flex w-full h-screen bg-slate-200 dark:bg-slate-900 text-[var(--color-text-primary)]">
      {/* Toolbar */}
      <aside className="w-60 bg-[var(--color-surface)] p-4 flex-shrink-0 border-r border-[var(--color-border)] flex flex-col gap-2">
        <h2 className="text-lg font-bold mb-2">Tools</h2>
        <ToolbarButton tool="select" label="Select" Icon={MousePointerIcon} />
        <ToolbarButton tool="text" label="Text" Icon={TypeIcon} />
        <ToolbarButton tool="rectangle" label="Rectangle" Icon={RectangleIcon} />
        <ToolbarButton tool="circle" label="Circle" Icon={CircleIcon} />
        <ToolbarButton label="Image" Icon={PhotoIcon} action={() => fileInputRef.current?.click()} />
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

        <div className="mt-auto">
          <button onClick={() => onSave(elements)} className="zenith-button w-full">Save Canvas</button>
        </div>
      </aside>

      {/* Canvas */}
      <main className="flex-1 overflow-auto custom-scrollbar-container p-8" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <div
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="relative mx-auto bg-white shadow-lg cursor-crosshair"
          style={{ width: '794px', height: '1123px' }}
        >
          {elements.map(el => {
            const style: React.CSSProperties = {
              position: 'absolute', left: `${el.x}px`, top: `${el.y}px`,
              width: `${el.width}px`, height: `${el.height}px`,
              transform: `rotate(${el.rotation}deg)`,
              cursor: activeTool === 'select' ? 'move' : 'default',
            };

            return (
              <div
                key={el.id}
                onMouseDown={(e) => handleElementMouseDown(e, el)}
                style={style}
                className={`group ${selectedElementId === el.id ? 'outline-2 outline-dashed outline-[var(--color-accent)]' : 'hover:outline-2 hover:outline-dashed hover:outline-[var(--color-accent)]/50'}`}
              >
                {el.type === 'text' && (
                  <div className="w-full h-full flex items-center justify-center" style={{ fontSize: el.fontSize, fontFamily: el.fontFamily, color: el.color, whiteSpace: 'nowrap' }}>
                    {(el as TextElement).text}
                  </div>
                )}
                {el.type === 'image' && <img src={(el as ImageElement).src} alt="canvas element" className="w-full h-full object-cover" />}
                {el.type === 'shape' && (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: (el as ShapeElement).fill,
                      borderRadius: (el as ShapeElement).shapeType === 'circle' ? '50%' : '0',
                      border: `${(el as ShapeElement).strokeWidth}px solid ${(el as ShapeElement).stroke}`
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Properties Panel */}
      <aside className="w-72 bg-[var(--color-surface)] p-4 flex-shrink-0 border-l border-[var(--color-border)] overflow-y-auto custom-scrollbar-container">
        <h2 className="text-lg font-bold mb-4">Properties</h2>
        {!selectedElement ? (
          <p className="text-sm text-[var(--color-text-secondary)]">Select an element to edit.</p>
        ) : (
          <div className="space-y-4">
            {selectedElement.type === 'text' && (
              <>
                <div>
                  <label className="text-xs font-medium">Text Content</label>
                  <input type="text" value={(selectedElement as TextElement).text} onChange={e => updateSelectedElement({ text: e.target.value })} className={inputClasses} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                     <label className="text-xs font-medium">Font Size</label>
                     <input type="number" value={(selectedElement as TextElement).fontSize} onChange={e => updateSelectedElement({ fontSize: parseInt(e.target.value) || 12 })} className={inputClasses} />
                  </div>
                   <div>
                     <label className="text-xs font-medium">Color</label>
                     <input type="color" value={(selectedElement as TextElement).color} onChange={e => updateSelectedElement({ color: e.target.value })} className={`${inputClasses} h-9 p-1`} />
                  </div>
                </div>
              </>
            )}

            {selectedElement.type === 'shape' && (
              <div>
                <label className="text-xs font-medium">Fill Color</label>
                <input type="color" value={(selectedElement as ShapeElement).fill} onChange={e => updateSelectedElement({ fill: e.target.value })} className={`${inputClasses} h-9 p-1`} />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs font-medium">X</label><input type="number" value={Math.round(selectedElement.x)} onChange={e => updateSelectedElement({ x: parseInt(e.target.value) })} className={inputClasses}/></div>
                <div><label className="text-xs font-medium">Y</label><input type="number" value={Math.round(selectedElement.y)} onChange={e => updateSelectedElement({ y: parseInt(e.target.value) })} className={inputClasses}/></div>
                <div><label className="text-xs font-medium">W</label><input type="number" value={Math.round(selectedElement.width)} onChange={e => updateSelectedElement({ width: parseInt(e.target.value) })} className={inputClasses}/></div>
                <div><label className="text-xs font-medium">H</label><input type="number" value={Math.round(selectedElement.height)} onChange={e => updateSelectedElement({ height: parseInt(e.target.value) })} className={inputClasses}/></div>
            </div>

            <div className="pt-4 border-t border-[var(--color-border)]">
              <button onClick={handleDeleteElement} className="w-full zenith-button-secondary text-rose-500 hover:border-rose-500 hover:bg-rose-500/10 flex items-center justify-center gap-2">
                <TrashIcon className="w-4 h-4" /> Delete Element
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default CreatorStudioView;
