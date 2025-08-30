
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, SavedFlashcard } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import ImagePreviewModal from './ImagePreviewModal';
import { SparklesIcon, PhotoIcon as ImageIcon, DownloadIcon, BookmarkSquareIcon, XIcon, PrinterIcon } from './constants';

interface FlashcardGeneratorProps {
  onGenerate: (prompt: string, aspectRatio: string) => Promise<string>;
  onSave: (prompt: string, style: string, aspectRatio: string, imageData: string) => void;
  currentUser: User;
  viewingSavedFlashcard: SavedFlashcard | null;
  setViewingSavedFlashcard: (flashcard: SavedFlashcard | null) => void;
}

type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16';

interface AspectRatioOption {
  value: AspectRatio;
  label: string;
}

const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { value: '1:1', label: '1:1 (Square)' },
  { value: '4:3', label: '4:3 (Landscape)' },
  { value: '3:4', label: '3:4 (Portrait)' },
  { value: '16:9', label: '16:9 (Widescreen)' },
  { value: '9:16', label: '9:16 (Tall)' },
];

const IMAGE_STYLES = [
  { name: 'Default', value: '' },
  { name: 'Cartoon', value: ', in a cute cartoon style for children' },
  { name: 'Watercolor', value: ', watercolor painting style' },
  { name: 'Line Art', value: ', simple black and white line art for coloring' },
  { name: 'Pixel Art', value: ', 8-bit pixel art style' },
  { name: 'Photorealistic', value: ', photorealistic, high detail' },
  { name: 'Minimalist', value: ', minimalist, simple shapes and colors' },
  { name: '3D Render', value: ', cute 3D render, claymation style' },
];

const PrintableFlashcardSheet: React.FC<{ items: { prompt: string, imageData: string }[], size: 'a4' | 'letter', orientation: 'portrait' | 'landscape' }> = ({ items, size, orientation }) => {
    if (items.length === 0) return null;
    
    return (
        <div className={`printable-flashcard-sheet ${size} ${orientation}`}>
            {items.map((item, index) => (
                <div key={index} className="flashcard-print-item">
                    <div className="flashcard-print-image-container">
                        <img src={item.imageData} alt={item.prompt} />
                    </div>
                    <p className="flashcard-print-prompt">{item.prompt}</p>
                </div>
            ))}
        </div>
    );
};


const FlashcardGenerator: React.FC<FlashcardGeneratorProps> = ({ onGenerate, onSave, currentUser, viewingSavedFlashcard, setViewingSavedFlashcard }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('1:1');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedStyleName, setSelectedStyleName] = useState<string>('Default');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New state for print sheet
  const [printSheetItems, setPrintSheetItems] = useState<{ id: number, prompt: string, imageData: string }[]>([]);
  const [paperSize, setPaperSize] = useState<'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [printableAreaReady, setPrintableAreaReady] = useState(false);
  
  useEffect(() => {
    // Ensure the printable-area div exists before trying to render into it
    if (document.getElementById('printable-area')) {
      setPrintableAreaReady(true);
    }
  }, []);

  useEffect(() => {
    if (viewingSavedFlashcard) {
        setPrompt(viewingSavedFlashcard.prompt);
        const styleObject = IMAGE_STYLES.find(s => s.value === viewingSavedFlashcard.style) || IMAGE_STYLES[0];
        setSelectedStyle(styleObject.value);
        setSelectedStyleName(styleObject.name);
        setSelectedAspectRatio(viewingSavedFlashcard.aspectRatio as AspectRatio);
        setGeneratedImage(viewingSavedFlashcard.imageData);
        setViewingSavedFlashcard(null); 
    }
  }, [viewingSavedFlashcard, setViewingSavedFlashcard]);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt for the image.");
      return;
    }
    setIsLoading(true);
    setGeneratedImage(null);
    setError(null);

    const fullPrompt = `${prompt.trim()}${selectedStyle}`;

    try {
      const imageUrl = await onGenerate(fullPrompt, selectedAspectRatio);
      setGeneratedImage(imageUrl);
    } catch (err) {
       if (err instanceof Error) {
        if (err.message === 'QUOTA_EXCEEDED') {
            setError('QUOTA_EXCEEDED_FLASHCARD_GENERATOR');
        } else {
            setError(err.message || "An unknown error occurred while generating the image.");
        }
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    const promptSlug = prompt.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').substring(0, 50);
    link.download = `flashcard_${promptSlug || 'image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleSaveImage = () => {
    if (!generatedImage) return;
    onSave(prompt, selectedStyle, selectedAspectRatio, generatedImage);
  };
  
  const handleAddToSheet = () => {
    if (generatedImage && !printSheetItems.some(item => item.imageData === generatedImage)) {
        setPrintSheetItems(prev => [...prev, { id: Date.now(), prompt, imageData: generatedImage }]);
    }
  };

  const handleRemoveFromSheet = (id: number) => {
      setPrintSheetItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearSheet = () => {
      setPrintSheetItems([]);
  };

  const handlePrintSheet = () => {
      window.print();
  };


  const currentAspectRatioClass = {
    '1:1': 'aspect-square',
    '4:3': 'aspect-[4/3]',
    '3:4': 'aspect-[3/4]',
    '16:9': 'aspect-[16/9]',
    '9:16': 'aspect-[9/16]',
  }[selectedAspectRatio];

  return (
    <>
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-on-bg)]">
            Flashcard Image Generator
            <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-primary)' }} />
          </h2>
          <p className="text-[var(--color-on-surface-variant)] mt-2 px-4">
            Enter a prompt, choose a style and aspect ratio, and generate a simple image for your flashcards.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="md:w-2/5 w-full">
            <div className="material-card p-6 sm:p-8 space-y-6 md:sticky top-8">
              <div>
                <label htmlFor="image-prompt" className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">
                  Image Prompt
                </label>
                <textarea
                  id="image-prompt"
                  rows={3}
                  className="mt-1 block w-full text-base sm:text-sm resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., a happy cartoon sun wearing sunglasses"
                />
                <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">Describe the image you want to create. Be descriptive!</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2">
                  Image Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {IMAGE_STYLES.map((style) => (
                    <button
                      key={style.name}
                      type="button"
                      onClick={() => { setSelectedStyle(style.value); setSelectedStyleName(style.name); }}
                      className={`p-2 text-xs font-medium rounded-full transition-all ${
                        selectedStyle === style.value
                          ? 'material-button material-button-primary'
                          : 'material-button material-button-secondary'
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">
                  Aspect Ratio
                </label>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                  {ASPECT_RATIO_OPTIONS.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer text-sm text-[var(--color-on-surface)] p-2 rounded-lg hover:bg-[var(--color-surface-variant)]">
                      <input
                        type="radio"
                        name="aspectRatio"
                        value={option.value}
                        checked={selectedAspectRatio === option.value}
                        onChange={() => setSelectedAspectRatio(option.value as AspectRatio)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {currentUser.plan === 'free' && (
                <p className="text-xs text-center text-[var(--color-on-surface-variant)] pt-2 border-t border-[var(--color-outline)]">
                  You have <span className="font-bold text-[var(--color-on-surface)]">{currentUser.flashcardGeneratorCredits}</span> image credits remaining.
                </p>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={isLoading || !prompt.trim()}
                  className="material-button material-button-primary w-full flex justify-center items-center py-3 px-4 text-sm"
                >
                  {isLoading ? 'Generating your image...' : <><SparklesIcon className="w-5 h-5 mr-2" />Generate Image</>}
                </button>

                 {generatedImage && !isLoading && (
                   <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        type="button" 
                        onClick={handleSaveImage} 
                        className="material-button material-button-primary w-full flex justify-center items-center py-3 px-4 text-sm"
                      >
                        <BookmarkSquareIcon className="w-5 h-5 mr-2" /> Save
                      </button>
                      <button type="button" onClick={handleDownloadImage} className="material-button material-button-secondary w-full flex justify-center items-center py-3 px-4 text-sm">
                        <DownloadIcon className="w-5 h-5 mr-2" /> Download
                      </button>
                      <button 
                          type="button" 
                          onClick={handleAddToSheet} 
                          disabled={!generatedImage || printSheetItems.some(item => item.imageData === generatedImage)}
                          className="material-button material-button-secondary w-full flex justify-center items-center py-3 px-4 text-sm"
                      >
                        Add to Sheet
                      </button>
                   </div>
                )}
              </div>
            </div>
          </div>

          <div className="md:w-3/5 w-full">
            <div className={`p-2 sm:p-4 flex items-center justify-center w-full ${currentAspectRatioClass} overflow-hidden transition-all duration-300 ease-in-out rounded-lg bg-[var(--color-surface-variant)]`}>
               {(() => {
                  if (isLoading) {
                      return <LoadingSpinner text="Generating your image..." />;
                  }
                  if (error) {
                      if (error === 'QUOTA_EXCEEDED_FLASHCARD_GENERATOR') {
                          return (
                              <div className="text-center p-4">
                                  <p className="mt-4 text-lg font-medium text-[var(--color-on-surface)]">
                                    Flashcard Generator under maintenance, be back soon.
                                  </p>
                              </div>
                          );
                      }
                      return <div className="w-full p-4"><ErrorMessage message={error} /></div>;
                  }
                  if (generatedImage) {
                      return (
                          <button 
                              onClick={() => setIsModalOpen(true)}
                              className="w-full h-full flex items-center justify-center focus:outline-none group"
                              aria-label="Preview generated image"
                          >
                              <img src={generatedImage} alt={prompt || 'Generated image'} className="max-w-full max-h-full object-contain rounded-md shadow-lg group-hover:scale-105 transition-transform" />
                          </button>
                      );
                  }
                  return (
                      <div className="text-center p-4 text-[var(--color-on-surface-variant)]">
                          <ImageIcon className="w-24 h-24 mx-auto opacity-50" />
                          <p className="mt-4 text-lg font-medium">Your generated image will appear here.</p>
                          <p className="text-sm">Select an aspect ratio on the left to see a preview of the shape.</p>
                      </div>
                  );
              })()}
            </div>
          </div>
        </div>

        {printSheetItems.length > 0 && (
            <div className="mt-12 no-print">
                <h3 className="text-2xl font-semibold mb-4 text-center">Print Sheet</h3>
                <div className="material-card p-6 sm:p-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
                        <div>
                            <label className="block text-sm font-medium mb-1">Paper Size</label>
                            <select value={paperSize} onChange={e => setPaperSize(e.target.value as any)} className="w-full p-2">
                                <option value="a4">A4</option>
                                <option value="letter">US Letter</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Orientation</label>
                            <select value={orientation} onChange={e => setOrientation(e.target.value as any)} className="w-full p-2">
                                <option value="portrait">Portrait</option>
                                <option value="landscape">Landscape</option>
                            </select>
                        </div>
                        <button onClick={handlePrintSheet} className="material-button material-button-primary h-10 mt-auto flex items-center justify-center gap-2"><PrinterIcon className="w-5 h-5"/> Print Sheet</button>
                        <button onClick={handleClearSheet} className="material-button material-button-secondary h-10 mt-auto">Clear Sheet</button>
                    </div>
                    
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 bg-[var(--color-surface-variant)] p-2 rounded-lg">
                        {printSheetItems.map(item => (
                            <div key={item.id} className="relative group aspect-square">
                                <img src={item.imageData} alt={item.prompt} className="w-full h-full object-cover rounded-md" />
                                <button onClick={() => handleRemoveFromSheet(item.id)} className="absolute top-1 right-1 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" title="Remove">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
        
        {printableAreaReady && createPortal(
            <PrintableFlashcardSheet items={printSheetItems} size={paperSize} orientation={orientation} />,
            document.getElementById('printable-area')!
        )}

      </div>
      {isModalOpen && generatedImage && (
        <ImagePreviewModal imageUrl={generatedImage} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};

export default FlashcardGenerator;
