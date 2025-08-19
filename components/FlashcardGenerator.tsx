import React, { useState, useEffect } from 'react';
import { User, SavedFlashcard } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import ImagePreviewModal from './ImagePreviewModal';
import { SparklesIcon, PhotoIcon as ImageIcon, DownloadIcon, BookmarkSquareIcon } from './constants';

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

const FlashcardGenerator: React.FC<FlashcardGeneratorProps> = ({ onGenerate, onSave, currentUser, viewingSavedFlashcard, setViewingSavedFlashcard }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('1:1');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedStyleName, setSelectedStyleName] = useState<string>('Default');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        setError(err.message || "An unknown error occurred while generating the image.");
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
          <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-text-primary)]">
            Flashcard Image Generator
            <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-accent)' }} />
          </h2>
          <p className="text-[var(--color-text-secondary)] mt-2 px-4">
            Enter a prompt, choose a style and aspect ratio, and generate a simple image for your flashcards.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="lg:w-2/5 w-full">
            <div className="aurora-card p-6 sm:p-8 space-y-6 sticky top-8">
              <div>
                <label htmlFor="image-prompt" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  Image Prompt
                </label>
                <textarea
                  id="image-prompt"
                  rows={3}
                  className="mt-1 block w-full p-3 text-base rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] sm:text-sm resize-none border border-[var(--color-border)]"
                  style={{ backgroundColor: 'var(--color-input-bg)'}}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., a happy cartoon sun wearing sunglasses"
                />
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Describe the image you want to create. Be descriptive!</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Image Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {IMAGE_STYLES.map((style) => (
                    <button
                      key={style.name}
                      type="button"
                      onClick={() => { setSelectedStyle(style.value); setSelectedStyleName(style.name); }}
                      className={`p-2 text-xs font-medium rounded-lg transition-all border ${
                        selectedStyle === style.value
                          ? 'zenith-button text-white border-transparent'
                          : 'zenith-button-secondary'
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  Aspect Ratio
                </label>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                  {ASPECT_RATIO_OPTIONS.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer text-sm text-[var(--color-text-primary)] p-2 rounded-lg hover:bg-[var(--color-inset-bg)]">
                      <input
                        type="radio"
                        name="aspectRatio"
                        value={option.value}
                        checked={selectedAspectRatio === option.value}
                        onChange={() => setSelectedAspectRatio(option.value as AspectRatio)}
                        className="h-4 w-4 shrink-0 appearance-none rounded-full border-2 border-[var(--color-border)] checked:bg-[var(--color-accent)] checked:border-[var(--color-accent)] focus-visible:outline-none"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {currentUser.plan === 'free' && (
                <p className="text-xs text-center text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border)]">
                  You have <span className="font-bold text-[var(--color-text-primary)]">{currentUser.imageCreditsRemaining}</span> image credits remaining.
                </p>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={isLoading || !prompt.trim()}
                  className="zenith-button w-full flex justify-center items-center py-3 px-4 text-sm font-medium rounded-lg"
                >
                  {isLoading ? 'Generating your image...' : <><SparklesIcon className="w-5 h-5 mr-2" />Generate Image</>}
                </button>

                 {generatedImage && !isLoading && (
                   <div className="flex gap-3">
                      <button 
                        type="button" 
                        onClick={handleSaveImage} 
                        className="zenith-button w-full flex justify-center items-center py-3 px-4 text-sm font-medium rounded-lg"
                      >
                        <BookmarkSquareIcon className="w-5 h-5 mr-2" /> Save to Collection
                      </button>
                      <button type="button" onClick={handleDownloadImage} className="zenith-button-secondary w-full flex justify-center items-center py-3 px-4 text-sm font-medium rounded-lg">
                        <DownloadIcon className="w-5 h-5 mr-2" /> Download
                      </button>
                   </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:w-3/5 w-full">
            <div className={`p-2 sm:p-4 flex items-center justify-center w-full ${currentAspectRatioClass} overflow-hidden transition-all duration-300 ease-in-out rounded-lg`} style={{backgroundColor: 'var(--color-inset-bg)'}}>
              {isLoading && <LoadingSpinner text="Generating your image..." />}
              {error && !isLoading && <div className="w-full p-4"><ErrorMessage message={error} /></div>}
              {!isLoading && !error && generatedImage && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full h-full flex items-center justify-center focus:outline-none group"
                  aria-label="Preview generated image"
                >
                    <img src={generatedImage} alt={prompt || 'Generated image'} className="max-w-full max-h-full object-contain rounded-md shadow-lg group-hover:scale-105 transition-transform" />
                </button>
              )}
              {!isLoading && !error && !generatedImage && (
                <div className="text-center p-4 text-[var(--color-text-secondary)]">
                  <ImageIcon className="w-24 h-24 mx-auto opacity-50" />
                  <p className="mt-4 text-lg font-medium">Your generated image will appear here.</p>
                  <p className="text-sm">Select an aspect ratio on the left to see a preview of the shape.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && generatedImage && (
        <ImagePreviewModal imageUrl={generatedImage} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};

export default FlashcardGenerator;