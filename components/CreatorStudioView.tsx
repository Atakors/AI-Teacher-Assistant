
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CanvasElement, TextElement, ImageElement, ShapeElement } from '../types';
import { MousePointerIcon, TypeIcon, RectangleIcon, CircleIcon, PhotoIcon, TrashIcon, SaveIcon, ZoomInIcon, ZoomOutIcon, BringToFrontIcon, SendToBackIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, TriangleIcon, LineIcon, FONT_FACES, ChevronDownIcon, LayersIcon, DocumentDuplicateIcon, GridIcon, NoSymbolIcon, XIcon, MenuIcon, BoldIcon, ItalicIcon, UnderlineIcon } from './constants';

interface CreatorStudioViewProps {
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  onSave: () => void;
  onSaveAs: () => void;
  onToggleSidebar: () => void;
}

type Tool = 'select' | 'text' | 'shape' | 'image';
type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line';
type HandleType = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | 'rotate';
const GRID_SIZE = 10;
const SNAP_THRESHOLD = 5;

// --- HELPER & CHILD COMPONENTS ---
const getCoords = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
  if ('touches' in e) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
};

const PropertyGroup: React.FC<{ title: string; children: React.ReactNode; isCollapsible?: boolean }> = ({ title, children, isCollapsible = false }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isCollapsible) {
    return (
      <div className="pt-4 first:pt-0 border-t first:border-t-0 border-[var(--color-outline)]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)] mb-3">{title}</h3>
        <div className="space-y-3">{children}</div>
      </div>
    );
  }

  return (
    <div className="pt-4 first:pt-0 border-t first:border-t-0 border-[var(--color-outline)]">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">{title}</h3>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="space-y-3">{children}</div>}
    </div>
  );
};


const InputRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-2 gap-3 items-center">{children}</div>
);

const PropertyLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-sm font-medium text-[var(--color-on-surface)]">{children}</label>
);

const ColorInput: React.FC<{ label: string; value: string; onChange: (color: string) => void; onTransparent: () => void; }> = ({ label, value, onChange, onTransparent }) => (
  <div>
    <PropertyLabel>{label}</PropertyLabel>
    <div className="flex items-center gap-2">
      <div className="relative h-9 flex-grow flex items-center px-2 rounded-md border border-[var(--color-outline)]" style={{ backgroundColor: 'var(--color-surface-variant)'}}>
        <input type="color" value={value === 'transparent' ? '#ffffff' : value} onChange={e => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        <div className="w-5 h-5 rounded border border-[var(--color-outline)]" style={{ 
            backgroundColor: value,
            backgroundImage: value === 'transparent' ? `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h5v5H0zM5 5h5v5H5z' fill='%23ccc' fill-opacity='0.4'/%3E%3C/svg%3E")` : 'none'
        }}></div>
        <span className="ml-2 text-xs font-mono">{value}</span>
      </div>
      <button onClick={onTransparent} title="Set Transparent" className="p-2 h-9 w-9 flex-shrink-0 rounded-md border border-[var(--color-outline)] hover:bg-[var(--color-surface-variant)]">
        <NoSymbolIcon className="w-5 h-5" />
      </button>
    </div>
  </div>
);


const RenderElement: React.FC<{ element: CanvasElement }> = ({ element }) => {
    switch(element.type) {
        case 'text':
            const textStyle: React.CSSProperties = {
                fontSize: element.fontSize,
                fontFamily: element.fontFamily,
                color: element.color === 'transparent' ? 'rgba(0,0,0,0)' : element.color,
                textAlign: element.textAlign,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontWeight: element.fontWeight || 'normal',
                fontStyle: element.fontStyle || 'normal',
                textDecoration: element.textDecoration || 'none',
                letterSpacing: `${element.letterSpacing || 0}px`,
                lineHeight: element.lineHeight || 1.2,
            };
            if(element.stroke && element.strokeWidth && element.stroke !== 'transparent') {
                textStyle.WebkitTextStroke = `${element.strokeWidth}px ${element.stroke}`;
            }
            return <div className="w-full h-full pointer-events-none" style={textStyle}>{element.text}</div>;
        
        case 'image':
            const crop = element.crop || { x: 0, y: 0, width: 100, height: 100 };
            const imgWidth = 100 / (crop.width / 100);
            const imgHeight = 100 / (crop.height / 100);
            const imgLeft = -imgWidth * (crop.x / 100);
            const imgTop = -imgHeight * (crop.y / 100);

            return (
                <div className="w-full h-full overflow-hidden">
                    <img 
                        src={element.src} 
                        alt="canvas element" 
                        className="absolute max-w-none pointer-events-none"
                        style={{
                            width: `${imgWidth}%`,
                            height: `${imgHeight}%`,
                            left: `${imgLeft}%`,
                            top: `${imgTop}%`,
                        }}
                    />
                </div>
            );

        case 'shape':
            if (element.shapeType === 'triangle') {
                return <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none">
                    <polygon points="50,0 100,100 0,100" fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} />
                </svg>
            }
            if (element.shapeType === 'line') {
                 return <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none">
                    <line x1="0" y1="50" x2="100" y2="50" stroke={element.fill} strokeWidth={element.strokeWidth || 5} />
                </svg>
            }
            return <div className="w-full h-full pointer-events-none" style={{
                backgroundColor: element.fill,
                borderRadius: element.shapeType === 'circle' ? '50%' : '0',
                border: `${element.strokeWidth}px solid ${element.stroke === 'transparent' ? 'rgba(0,0,0,0)' : element.stroke}`
            }}/>;

        default: return null;
    }
}

const CreatorStudioView: React.FC<CreatorStudioViewProps> = ({ elements, setElements, onSave, onSaveAs, onToggleSidebar }) => {
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [shapeToDraw, setShapeToDraw] = useState<ShapeType>('rectangle');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  const [isEditingText, setIsEditingText] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.5);
  const [isShapePickerOpen, setIsShapePickerOpen] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [isPropertiesSheetOpen, setIsPropertiesSheetOpen] = useState(false);

  const [interactionState, setInteractionState] = useState<{ type: 'drag' | 'resize' | 'rotate', elementId: string, handle?: HandleType, startX: number, startY: number, originalElement: CanvasElement } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, elementId: string } | null>(null);
  const [guides, setGuides] = useState<{ type: 'h' | 'v', position: number }[]>([]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shapePickerRef = useRef<HTMLDivElement>(null);
  
  const selectedElement = elements.find(el => el.id === selectedElementId);
  const selectedTextElement = selectedElement?.type === 'text' ? selectedElement as TextElement : null;
  const selectedImageElement = selectedElement?.type === 'image' ? selectedElement as ImageElement : null;
  const selectedShapeElement = selectedElement?.type === 'shape' ? selectedElement as ShapeElement : null;
  
  const snap = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;
  
  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prevElements => prevElements.map(el =>
      el.id === id ? ({ ...el, ...updates } as CanvasElement) : el
    ));
  }, [setElements]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (shapePickerRef.current && !shapePickerRef.current.contains(event.target as Node)) {
            setIsShapePickerOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [shapePickerRef]);

  const addElement = (newElement: CanvasElement) => {
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
    setActiveTool('select');
  };

  const createNewElement = (x: number, y: number, type: 'text' | 'shape' | 'image', shapeType?: ShapeType) => {
    const newId = `el_${Date.now()}`;
    const zIndex = elements.length > 0 ? Math.max(...elements.map(el => el.zIndex)) + 1 : 0;
    let newElement: CanvasElement | null = null;
    
    switch (type) {
      case 'text':
        newElement = { id: newId, type: 'text', x: x - 75, y: y - 12, width: 150, height: 48, rotation: 0, zIndex, text: 'New Text', fontSize: 16, fontFamily: 'Inter, sans-serif', color: '#111827', textAlign: 'left', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', letterSpacing: 0, lineHeight: 1.2, strokeWidth: 0, stroke: 'transparent' };
        break;
      case 'shape':
        if(shapeType === 'rectangle') newElement = { id: newId, type: 'shape', shapeType: 'rectangle', x: x - 50, y: y - 30, width: 100, height: 60, rotation: 0, zIndex, fill: '#bfdbfe', stroke: 'transparent', strokeWidth: 0 };
        else if(shapeType === 'circle') newElement = { id: newId, type: 'shape', shapeType: 'circle', x: x - 40, y: y - 40, width: 80, height: 80, rotation: 0, zIndex, fill: '#a7f3d0', stroke: 'transparent', strokeWidth: 0 };
        else if(shapeType === 'triangle') newElement = { id: newId, type: 'shape', shapeType: 'triangle', x: x - 50, y: y - 50, width: 100, height: 100, rotation: 0, zIndex, fill: '#fef08a', stroke: 'transparent', strokeWidth: 0 };
        else if(shapeType === 'line') newElement = { id: newId, type: 'shape', shapeType: 'line', x: x - 50, y: y, width: 100, height: 4, rotation: 0, zIndex, fill: '#9ca3af', stroke: 'transparent', strokeWidth: 4 };
        break;
    }
    if (newElement) addElement(newElement);
  };
  
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current) {
        if (activeTool === 'select') {
            setSelectedElementId(null);
        } else {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / zoom;
            const y = (e.clientY - rect.top) / zoom;
            if (activeTool === 'text') createNewElement(x, y, 'text');
            else if (activeTool === 'shape') createNewElement(x, y, 'shape', shapeToDraw);
        }
    }
     setContextMenu(null);
  };

  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent, element: CanvasElement, handle?: HandleType) => {
    if (e.type === 'touchstart') e.stopPropagation();
    else e.preventDefault();

    if (activeTool !== 'select') return;
    
    setSelectedElementId(element.id);
    if (!canvasRef.current) return;

    const { x: clientX, y: clientY } = getCoords(e.nativeEvent as MouseEvent | TouchEvent);
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const startX = (clientX - canvasRect.left) / zoom;
    const startY = (clientY - canvasRect.top) / zoom;
    
    if (handle) {
        setInteractionState({ type: handle === 'rotate' ? 'rotate' : 'resize', elementId: element.id, handle, startX, startY, originalElement: element });
    } else {
        setInteractionState({ type: 'drag', elementId: element.id, startX, startY, originalElement: element });
    }
  };
  
  // --- GLOBAL EVENT LISTENERS FOR DRAG/RESIZE/ROTATE ---
  const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!interactionState || !canvasRef.current) return;
    if (e.type === 'touchmove') e.preventDefault();
    
    const { elementId, type, startX, startY, originalElement, handle } = interactionState;
    const { x: clientX, y: clientY } = getCoords(e);
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = (clientX - canvasRect.left) / zoom;
    const mouseY = (clientY - canvasRect.top) / zoom;
    let dx = mouseX - startX;
    let dy = mouseY - startY;

    let currentUpdates: Partial<CanvasElement> = {};
    let activeGuides: { type: 'h' | 'v', position: number }[] = [];
    
    // --- SNAPPING LOGIC ---
    if (snapToGrid && type !== 'rotate') {
        const otherElements = elements.filter(el => el.id !== elementId);
        const canvasSize = { width: 794, height: 1123 };
        const snapTargetsV = [canvasSize.width / 2, ...otherElements.flatMap(el => [el.x, el.x + el.width / 2, el.x + el.width])];
        const snapTargetsH = [canvasSize.height / 2, ...otherElements.flatMap(el => [el.y, el.y + el.height / 2, el.y + el.height])];
        
        const currentRect = {
            x: originalElement.x + (type === 'drag' ? dx : 0),
            y: originalElement.y + (type === 'drag' ? dy : 0),
            width: originalElement.width,
            height: originalElement.height,
        };
        
        if (type === 'resize' && handle) {
            // Preview resize before snapping
            if (handle.includes('e')) currentRect.width = originalElement.width + dx;
            if (handle.includes('w')) { currentRect.width = originalElement.width - dx; currentRect.x = originalElement.x + dx; }
            if (handle.includes('s')) currentRect.height = originalElement.height + dy;
            if (handle.includes('n')) { currentRect.height = originalElement.height - dy; currentRect.y = originalElement.y + dy; }
        }

        const elementPointsV = [currentRect.x, currentRect.x + currentRect.width / 2, currentRect.x + currentRect.width];
        const elementPointsH = [currentRect.y, currentRect.y + currentRect.height / 2, currentRect.y + currentRect.height];
        
        let snapDx = dx;
        let snapDy = dy;

        for(const point of elementPointsV) {
            for(const target of snapTargetsV) {
                if (Math.abs(point - target) < SNAP_THRESHOLD) {
                    snapDx += target - point;
                    activeGuides.push({ type: 'v', position: target });
                    break;
                }
            }
        }
        for(const point of elementPointsH) {
            for(const target of snapTargetsH) {
                if (Math.abs(point - target) < SNAP_THRESHOLD) {
                    snapDy += target - point;
                    activeGuides.push({ type: 'h', position: target });
                    break;
                }
            }
        }
        dx = snapDx;
        dy = snapDy;
    }
    setGuides(activeGuides);
    // --- END SNAPPING ---
    
    if (type === 'drag') {
        currentUpdates = { x: originalElement.x + dx, y: originalElement.y + dy };
    } else if (type === 'resize' && handle) {
        let { x, y, width, height } = originalElement;
        if (handle.includes('e')) width = originalElement.width + dx;
        if (handle.includes('w')) { width = originalElement.width - dx; x = originalElement.x + dx; }
        if (handle.includes('s')) height = originalElement.height + dy;
        if (handle.includes('n')) { height = originalElement.height - dy; y = originalElement.y + dy; }
        if (width > 10 && height > 10) currentUpdates = { x, y, width, height };
    } else if (type === 'rotate') {
        const centerX = originalElement.x + originalElement.width / 2;
        const centerY = originalElement.y + originalElement.height / 2;
        const startAngle = Math.atan2(startY - centerY, startX - centerX) * 180 / Math.PI;
        const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * 180 / Math.PI;
        let rotation = originalElement.rotation + (currentAngle - startAngle);
        if (snapToGrid) rotation = Math.round(rotation / 15) * 15;
        currentUpdates = { rotation };
    }

    updateElement(elementId, currentUpdates);
  }, [interactionState, zoom, snapToGrid, updateElement, elements]);

  const handleInteractionEnd = useCallback(() => {
    setInteractionState(null);
    setGuides([]);
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
  // --- END GLOBAL EVENT LISTENERS ---

  const handleDeleteElement = (elementId: string) => {
    setElements(elements.filter(el => el.id !== elementId));
    if (selectedElementId === elementId) setSelectedElementId(null);
  };
  
  const handleDuplicateElement = (elementId: string) => {
      const elementToDup = elements.find(el => el.id === elementId);
      if (!elementToDup) return;
      const newId = `el_${Date.now()}`;
      const zIndex = elements.length > 0 ? Math.max(...elements.map(el => el.zIndex)) + 1 : 0;
      const newElement = { ...elementToDup, id: newId, x: elementToDup.x + 10, y: elementToDup.y + 10, zIndex };
      setElements([...elements, newElement]);
      setSelectedElementId(newId);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const zIndex = elements.length > 0 ? Math.max(...elements.map(el => el.zIndex)) + 1 : 0;
          const newElement: ImageElement = { id: `el_${Date.now()}`, type: 'image', x: 20, y: 20, width: img.width > 200 ? 200 : img.width, height: img.width > 200 ? (img.height * (200 / img.width)) : img.height, rotation: 0, zIndex, src: event.target?.result as string };
          addElement(newElement);
        }
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(e.target.files[0]);
    }
    if(e.target) e.target.value = '';
  };

  const fitCanvasToScreen = () => {
      if (!canvasContainerRef.current) return;
      const { width, height } = canvasContainerRef.current.getBoundingClientRect();
      const scaleX = (width - 64) / 794;
      const scaleY = (height - 64) / 1123;
      setZoom(Math.min(scaleX, scaleY));
  };
  
  useEffect(fitCanvasToScreen, []);
  useEffect(() => {
    window.addEventListener('resize', fitCanvasToScreen);
    return () => window.removeEventListener('resize', fitCanvasToScreen);
  }, []);
  
  const changeLayer = (elementId: string, direction: 'forward' | 'backward') => {
      const element = elements.find(el => el.id === elementId);
      if (!element) return;
      
      const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
      const currentIndex = sortedElements.findIndex(el => el.id === elementId);
      
      if (direction === 'forward' && currentIndex < sortedElements.length - 1) {
          const nextElement = sortedElements[currentIndex + 1];
          updateElement(elementId, { zIndex: nextElement.zIndex });
          updateElement(nextElement.id, { zIndex: element.zIndex });
      } else if (direction === 'backward' && currentIndex > 0) {
          const prevElement = sortedElements[currentIndex - 1];
          updateElement(elementId, { zIndex: prevElement.zIndex });
          updateElement(prevElement.id, { zIndex: element.zIndex });
      }
  };
  
  const handleContextMenu = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, elementId });
  };

  const ToolbarButton: React.FC<{ tool?: Tool; label: string; Icon: React.ElementType; action?: () => void; children?: React.ReactNode; refProp?: React.Ref<HTMLDivElement> }> = ({ tool, label, Icon, action, children, refProp }) => (
    <div className="relative" ref={refProp}>
      <button
        onClick={action ? action : () => tool && setActiveTool(tool)}
        className={`w-full lg:w-12 h-12 flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${activeTool === tool ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-[var(--color-surface-variant)]'}`}
        title={label}
      >
        <Icon className="w-6 h-6" />
      </button>
      {children}
    </div>
  );
  
  const getCanvasCursor = () => {
    if (interactionState) {
        switch (interactionState.type) {
            case 'drag': return 'grabbing';
            case 'rotate': return 'grabbing';
            case 'resize':
                const handle = interactionState.handle;
                if (handle === 'n' || handle === 's') return 'ns-resize';
                if (handle === 'e' || handle === 'w') return 'ew-resize';
                if (handle === 'nw' || handle === 'se') return 'nwse-resize';
                if (handle === 'ne' || handle === 'sw') return 'nesw-resize';
                return 'default';
        }
    }
    return { select: 'default', text: 'text', shape: 'crosshair', image: 'crosshair' }[activeTool];
  };

  const renderPropertiesPanel = () => {
    if (!selectedElement) {
        return (
            <div className="text-center pt-10">
                <LayersIcon className="w-16 h-16 mx-auto text-[var(--color-outline)]" />
                <p className="text-sm text-[var(--color-on-surface-variant)] mt-4">Select an element on the canvas to see its properties.</p>
            </div>
        );
    }
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold capitalize">{selectedElement.type}</h2>
            <button onClick={() => handleDeleteElement(selectedElement.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full" title="Delete Element"><TrashIcon className="w-5 h-5"/></button>
            </div>

            <PropertyGroup title="Transform" isCollapsible>
                <InputRow><PropertyLabel>Position</PropertyLabel><div className="flex gap-2"><input type="number" value={Math.round(selectedElement.x)} onChange={e => updateElement(selectedElement.id, { x: parseInt(e.target.value) })} className="w-full p-1 rounded bg-[var(--color-surface-variant)] text-center text-sm" aria-label="X position"/><input type="number" value={Math.round(selectedElement.y)} onChange={e => updateElement(selectedElement.id, { y: parseInt(e.target.value) })} className="w-full p-1 rounded bg-[var(--color-surface-variant)] text-center text-sm" aria-label="Y position"/></div></InputRow>
                <InputRow><PropertyLabel>Size</PropertyLabel><div className="flex gap-2"><input type="number" value={Math.round(selectedElement.width)} onChange={e => updateElement(selectedElement.id, { width: parseInt(e.target.value) })} className="w-full p-1 rounded bg-[var(--color-surface-variant)] text-center text-sm" aria-label="Width"/><input type="number" value={Math.round(selectedElement.height)} onChange={e => updateElement(selectedElement.id, { height: parseInt(e.target.value) })} className="w-full p-1 rounded bg-[var(--color-surface-variant)] text-center text-sm" aria-label="Height"/></div></InputRow>
                <InputRow><PropertyLabel>Rotation</PropertyLabel><input type="number" value={Math.round(selectedElement.rotation)} onChange={e => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })} className="w-full p-1 rounded bg-[var(--color-surface-variant)] text-center text-sm"/></InputRow>
            </PropertyGroup>

            {(selectedShapeElement || selectedTextElement) && (
                <PropertyGroup title="Appearance" isCollapsible>
                    {selectedShapeElement && <ColorInput label="Fill" value={selectedShapeElement.fill} onChange={color => updateElement(selectedElementId!, { fill: color })} onTransparent={() => updateElement(selectedElementId!, { fill: 'transparent' })} />}
                    {selectedTextElement && <ColorInput label="Color" value={selectedTextElement.color} onChange={color => updateElement(selectedElementId!, { color: color })} onTransparent={() => updateElement(selectedElementId!, { color: 'transparent' })} />}
                    <ColorInput label="Stroke" value={selectedShapeElement?.stroke || selectedTextElement?.stroke || '#000000'} onChange={color => updateElement(selectedElementId!, { stroke: color })} onTransparent={() => updateElement(selectedElementId!, { stroke: 'transparent' })} />
                    <InputRow><PropertyLabel>Stroke Width</PropertyLabel><input type="number" min="0" value={selectedShapeElement?.strokeWidth || selectedTextElement?.strokeWidth || 0} onChange={e => updateElement(selectedElementId!, { strokeWidth: parseInt(e.target.value) || 0 })} className="w-full p-1 rounded bg-[var(--color-surface-variant)] text-center text-sm"/></InputRow>
                </PropertyGroup>
            )}
            
            {selectedImageElement && (
                 <PropertyGroup title="Crop" isCollapsible>
                    <InputRow><PropertyLabel>X Offset (%)</PropertyLabel><input type="number" value={selectedImageElement.crop?.x ?? 0} onChange={e => updateElement(selectedElement.id, { crop: { ...selectedImageElement.crop!, x: parseInt(e.target.value) } })} className="w-full p-1 rounded bg-[var(--color-surface-variant)] text-center text-sm"/></InputRow>
                    <InputRow><PropertyLabel>Y Offset (%)</PropertyLabel><input type="number" value={selectedImageElement.crop?.y ?? 0} onChange={e => updateElement(selectedElement.id, { crop: { ...selectedImageElement.crop!, y: parseInt(e.target.value) } })} className="w-full p-1 rounded bg-[var(--color-surface-variant)] text-center text-sm"/></InputRow>
                    <InputRow><PropertyLabel>Width (%)</PropertyLabel><input type="number" min="1" max="100" value={selectedImageElement.crop?.width ?? 100} onChange={e => updateElement(selectedElement.id, { crop: { ...selectedImageElement.crop!, width: parseInt(e.target.value) } })} className="w-full p-1 rounded bg-[var(--color-surface-variant)] text-center text-sm"/></InputRow>
                    <InputRow><PropertyLabel>Height (%)</PropertyLabel><input type="number" min="1" max="100" value={selectedImageElement.crop?.height ?? 100} onChange={e => updateElement(selectedElement.id, { crop: { ...selectedImageElement.crop!, height: parseInt(e.target.value) } })} className="w-full p-1 rounded bg-[var(--color-surface-variant)] text-center text-sm"/></InputRow>
                </PropertyGroup>
            )}

            {selectedTextElement && (
                <PropertyGroup title="Typography" isCollapsible>
                    <textarea value={selectedTextElement.text} onChange={e => updateElement(selectedElement.id, { text: e.target.value })} rows={3} className="w-full p-2 text-sm rounded-md bg-[var(--color-surface-variant)] resize-y" />
                    <div>
                        <PropertyLabel>Font</PropertyLabel>
                        <select value={selectedTextElement.fontFamily} onChange={e => updateElement(selectedElement.id, { fontFamily: e.target.value })} className="w-full p-2 text-sm rounded-md bg-[var(--color-surface-variant)] border-none">
                        {FONT_FACES.map(font => <option key={font.name} value={font.value}>{font.name}</option>)}
                        </select>
                    </div>
                    <InputRow><PropertyLabel>Size</PropertyLabel><input type="number" value={selectedTextElement.fontSize} onChange={e => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 12 })} className="w-full p-1 rounded bg-[var(--color-surface-variant)] text-center text-sm"/></InputRow>
                    <InputRow><PropertyLabel>Line Height</PropertyLabel><input type="number" step="0.1" value={selectedTextElement.lineHeight || 1.2} onChange={e => updateElement(selectedElement.id, { lineHeight: parseFloat(e.target.value) || 1.2 })} className="w-full p-1 rounded bg-[var(--color-surface-variant)] text-center text-sm"/></InputRow>
                    <InputRow><PropertyLabel>Letter Spacing</PropertyLabel><input type="number" value={selectedTextElement.letterSpacing || 0} onChange={e => updateElement(selectedElement.id, { letterSpacing: parseInt(e.target.value) || 0 })} className="w-full p-1 rounded bg-[var(--color-surface-variant)] text-center text-sm"/></InputRow>
                    <div className="flex items-center justify-around p-1 rounded-md bg-[var(--color-surface-variant)]">
                         <button onClick={() => updateElement(selectedElement.id, { fontWeight: selectedTextElement.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`p-2 rounded-md ${ selectedTextElement.fontWeight === 'bold' ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-primary)]' : ''}`}><BoldIcon className="w-5 h-5 mx-auto" /></button>
                         <button onClick={() => updateElement(selectedElement.id, { fontStyle: selectedTextElement.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`p-2 rounded-md ${ selectedTextElement.fontStyle === 'italic' ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-primary)]' : ''}`}><ItalicIcon className="w-5 h-5 mx-auto" /></button>
                         <button onClick={() => updateElement(selectedElement.id, { textDecoration: selectedTextElement.textDecoration === 'underline' ? 'none' : 'underline' })} className={`p-2 rounded-md ${ selectedTextElement.textDecoration === 'underline' ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-primary)]' : ''}`}><UnderlineIcon className="w-5 h-5 mx-auto" /></button>
                         {(['left', 'center', 'right'] as const).map(align => (
                            <button key={align} onClick={() => updateElement(selectedElement.id, { textAlign: align })} className={`p-2 rounded-md ${ selectedTextElement.textAlign === align ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-primary)]' : ''}`}>
                                {align === 'left' && <AlignLeftIcon className="w-5 h-5 mx-auto" />}
                                {align === 'center' && <AlignCenterIcon className="w-5 h-5 mx-auto" />}
                                {align === 'right' && <AlignRightIcon className="w-5 h-5 mx-auto" />}
                            </button>
                        ))}
                    </div>
                </PropertyGroup>
            )}

             <PropertyGroup title="Arrange" isCollapsible>
                <div className="grid grid-cols-2 gap-2">
                <button onClick={() => changeLayer(selectedElement.id, 'forward')} className="p-2 flex items-center justify-center gap-2 rounded-md bg-[var(--color-surface-variant)] hover:bg-[var(--color-outline)]/50" title="Bring Forward"><BringToFrontIcon className="w-5 h-5"/><span className="text-xs">Forward</span></button>
                <button onClick={() => changeLayer(selectedElement.id, 'backward')} className="p-2 flex items-center justify-center gap-2 rounded-md bg-[var(--color-surface-variant)] hover:bg-[var(--color-outline)]/50" title="Send Backward"><SendToBackIcon className="w-5 h-5"/><span className="text-xs">Backward</span></button>
                </div>
            </PropertyGroup>
        </div>
    );
  };
  
  return (
    <>
      <div className="w-full h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-on-surface)]">
        <header className="h-16 bg-[var(--color-surface)] border-b border-[var(--color-outline)] z-30 flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={onToggleSidebar} className="p-2 rounded-md hover:bg-[var(--color-surface-variant)]" title="Toggle Sidebar">
                  <MenuIcon className="w-5 h-5" />
              </button>
              <span className="font-semibold text-lg">Creator Studio</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSnapToGrid(!snapToGrid)} className={`p-2 rounded-md ${snapToGrid ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-[var(--color-surface-variant)]'}`} title="Snap to Grid"><GridIcon className="w-5 h-5" /></button>
              <button onClick={() => setZoom(z => z * 1.2)} className="p-2 rounded-md hover:bg-[var(--color-surface-variant)]" title="Zoom In"><ZoomInIcon className="w-5 h-5" /></button>
              <button onClick={fitCanvasToScreen} className="p-2 rounded-md hover:bg-[var(--color-surface-variant)] text-sm w-16 text-center" title="Fit to Screen">{Math.round(zoom * 100)}%</button>
              <button onClick={() => setZoom(z => z * 0.8)} className="p-2 rounded-md hover:bg-[var(--color-surface-variant)]" title="Zoom Out"><ZoomOutIcon className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onSave} className="material-button material-button-primary flex items-center gap-2"><SaveIcon className="w-5 h-5"/><span className="hidden sm:inline">Save</span></button>
              <button onClick={onSaveAs} className="material-button material-button-secondary flex items-center gap-2"><DocumentDuplicateIcon className="w-5 h-5"/><span className="hidden sm:inline">Save As</span></button>
            </div>
        </header>
        
        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
          <aside className="order-last lg:order-first w-full lg:w-16 h-16 lg:h-auto bg-[var(--color-surface)] border-t lg:border-t-0 lg:border-r border-[var(--color-outline)] z-20 flex flex-row lg:flex-col items-stretch justify-around lg:justify-start p-2 gap-2 flex-shrink-0">
            <ToolbarButton tool="select" label="Select" Icon={MousePointerIcon} />
            <ToolbarButton tool="text" label="Add Text" Icon={TypeIcon} />
            <ToolbarButton tool="shape" label="Add Shape" Icon={RectangleIcon} refProp={shapePickerRef} action={() => setIsShapePickerOpen(!isShapePickerOpen)}>
                {isShapePickerOpen && (
                    <div className="absolute bottom-full lg:left-full lg:top-0 lg:bottom-auto mb-2 lg:mb-0 lg:ml-2 p-1 bg-[var(--color-surface)] border border-[var(--color-outline)] rounded-lg shadow-lg flex lg:flex-col gap-1">
                        {[ { type: 'rectangle' as ShapeType, Icon: RectangleIcon }, { type: 'circle' as ShapeType, Icon: CircleIcon }, { type: 'triangle' as ShapeType, Icon: TriangleIcon }, { type: 'line' as ShapeType, Icon: LineIcon } ].map(shape => (
                            <button key={shape.type} onClick={() => { setShapeToDraw(shape.type); setActiveTool('shape'); setIsShapePickerOpen(false); }} className="p-2 rounded-md hover:bg-[var(--color-surface-variant)]"><shape.Icon className="w-5 h-5" /></button>
                        ))}
                    </div>
                )}
            </ToolbarButton>
            <ToolbarButton label="Upload Image" Icon={PhotoIcon} action={() => fileInputRef.current?.click()} />
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            <div className="lg:hidden">
              <button
                onClick={() => setIsPropertiesSheetOpen(true)}
                disabled={!selectedElementId}
                className={`w-full h-12 flex items-center justify-center p-2 rounded-lg transition-colors ${
                  isPropertiesSheetOpen && selectedElementId ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-[var(--color-surface-variant)]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Properties"
              >
                <LayersIcon className="w-6 h-6" />
              </button>
            </div>
          </aside>

          <main ref={canvasContainerRef} className="flex-grow overflow-auto custom-scrollbar-container flex items-start justify-center p-4 lg:p-8 relative">
            <div ref={canvasRef} onMouseDown={handleCanvasMouseDown} className="relative bg-white shadow-2xl origin-top-left" style={{ width: 794, height: 1123, transform: `scale(${zoom})`, cursor: getCanvasCursor() }}>
              {guides.map((guide, i) => (
                <div key={i} className="absolute bg-[var(--color-primary)] opacity-70" style={{
                    ...(guide.type === 'v' ? { left: guide.position - 0.5, top: 0, width: 1, height: '100%' } : { top: guide.position - 0.5, left: 0, height: 1, width: '100%' })
                }}/>
              ))}
              
              {elements.sort((a,b) => a.zIndex - b.zIndex).map(el => (
                <div key={el.id} onMouseDown={(e) => handleInteractionStart(e, el)} onTouchStart={(e) => handleInteractionStart(e, el)} onDoubleClick={() => el.type === 'text' && setIsEditingText(el.id)} onContextMenu={(e) => handleContextMenu(e, el.id)} className="absolute" style={{ left: el.x, top: el.y, width: el.width, height: el.height, transform: `rotate(${el.rotation}deg)`, zIndex: el.zIndex, cursor: activeTool === 'select' ? (interactionState && interactionState.elementId === el.id ? 'grabbing' : 'grab') : undefined }}>
                  <RenderElement element={el} />
                  {isEditingText === el.id && el.type === 'text' && (<textarea value={el.text} onChange={(e) => updateElement(el.id, { text: e.target.value })} onBlur={() => setIsEditingText(null)} autoFocus className="w-full h-full resize-none outline-none border-none bg-blue-100/50 absolute inset-0" style={{ fontSize: el.fontSize, fontFamily: el.fontFamily, color: el.color, textAlign: el.textAlign, lineHeight: el.lineHeight, letterSpacing: el.letterSpacing, fontWeight: el.fontWeight, fontStyle: el.fontStyle, textDecoration: el.textDecoration }}/>)}
                </div>
              ))}
              {selectedElement && <SelectionBox element={selectedElement} onInteractionStart={handleInteractionStart} zoom={zoom} />}
              {contextMenu && <ContextMenu {...contextMenu} setContextMenu={setContextMenu} actions={{ changeLayer, handleDuplicateElement, handleDeleteElement }} />}
            </div>
          </main>
          
          <aside className={`
            fixed bottom-0 left-0 right-0 h-[60vh] bg-[var(--color-surface)] rounded-t-2xl shadow-2xl z-40 
            transform transition-transform duration-300 ease-in-out flex flex-col
            lg:static lg:h-auto lg:w-72 lg:transform-none lg:rounded-none lg:shadow-none lg:border-l lg:border-[var(--color-outline)] lg:translate-y-0
            ${isPropertiesSheetOpen ? 'translate-y-0' : 'translate-y-full'}`}>
              <div className="p-2 border-b border-[var(--color-outline)] flex-shrink-0 lg:hidden">
                <button onClick={() => setIsPropertiesSheetOpen(false)} className="w-8 h-1.5 bg-[var(--color-outline)] rounded-full mx-auto" aria-label="Close properties panel"></button>
              </div>
              <div className="p-4 overflow-y-auto custom-scrollbar-container flex-grow">
                 {renderPropertiesPanel()}
              </div>
          </aside>
        </div>
      </div>
      {isPropertiesSheetOpen && (
          <div 
              onClick={() => setIsPropertiesSheetOpen(false)} 
              className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          />
      )}
    </>
  );
};

const SelectionBox: React.FC<{ element: CanvasElement, onInteractionStart: (e: React.MouseEvent | React.TouchEvent, element: CanvasElement, handle: HandleType) => void, zoom: number }> = ({ element, onInteractionStart, zoom }) => {
    const handleSize = 8 / zoom;
    const handles: HandleType[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw', 'rotate'];
    
    return (
        <div className="absolute pointer-events-none" style={{ left: element.x, top: element.y, width: element.width, height: element.height, transform: `rotate(${element.rotation}deg)` }}>
            <div className="w-full h-full border-2 border-[var(--color-primary)] border-dashed"></div>
            {handles.map(handle => {
                const style: React.CSSProperties = { position: 'absolute', width: handleSize, height: handleSize, backgroundColor: 'white', border: `${1 / zoom}px solid var(--color-primary)`, borderRadius: '50%', pointerEvents: 'all' };
                if (handle.includes('n')) { style.top = -handleSize / 2; style.cursor = 'ns-resize'; }
                if (handle.includes('s')) { style.bottom = -handleSize / 2; style.cursor = 'ns-resize'; }
                if (handle.includes('w')) { style.left = -handleSize / 2; style.cursor = 'ew-resize'; }
                if (handle.includes('e')) { style.right = -handleSize / 2; style.cursor = 'ew-resize'; }
                if (handle === 'nw' || handle === 'se') { style.cursor = 'nwse-resize'; }
                if (handle === 'ne' || handle === 'sw') { style.cursor = 'nesw-resize'; }
                if (handle === 'n' || handle === 's') style.left = `calc(50% - ${handleSize/2}px)`;
                if (handle === 'e' || handle === 'w') style.top = `calc(50% - ${handleSize/2}px)`;
                if (handle === 'rotate') { style.top = -handleSize * 3; style.left = `calc(50% - ${handleSize/2}px)`; style.cursor = 'grab'; }
                return <div key={handle} style={style} onMouseDown={e => onInteractionStart(e, element, handle)} onTouchStart={e => onInteractionStart(e, element, handle)} />;
            })}
        </div>
    );
};

const ContextMenu: React.FC<{ x: number, y: number, elementId: string, setContextMenu: (menu: any) => void, actions: any }> = ({ x, y, elementId, setContextMenu, actions }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setContextMenu(null); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setContextMenu]);

    const menuItems = [
        { label: 'Bring Forward', icon: BringToFrontIcon, action: () => actions.changeLayer(elementId, 'forward') },
        { label: 'Send Backward', icon: SendToBackIcon, action: () => actions.changeLayer(elementId, 'backward') },
        { label: 'Duplicate', icon: DocumentDuplicateIcon, action: () => actions.handleDuplicateElement(elementId) },
        { label: 'Delete', icon: TrashIcon, action: () => actions.handleDeleteElement(elementId), isDestructive: true },
    ];
    
    return (
        <div ref={menuRef} style={{ top: y, left: x }} className="fixed z-50 w-48 bg-[var(--color-surface)] border border-[var(--color-outline)] rounded-md shadow-lg p-1">
            {menuItems.map(item => (
                <button key={item.label} onClick={() => { item.action(); setContextMenu(null); }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-[var(--color-surface-variant)] ${item.isDestructive ? 'text-rose-500' : ''}`}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                </button>
            ))}
        </div>
    );
};

export default CreatorStudioView;
