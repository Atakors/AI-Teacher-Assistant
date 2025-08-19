import React, { useState } from 'react';
import { User, FlashcardIdea } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import ImagePreviewModal from './ImagePreviewModal';
import { SparklesIcon, DownloadIcon, LightBulbIcon, ChevronRightIcon } from './constants';

interface FlashcardGeneratorV2Props {
  onGenerateIdeas: (topic: string) => Promise<FlashcardIdea[]>;
  onGenerateImage: (prompt: string, aspectRatio: string) => Promise<string>;
  currentUser: User;
}

const FlashcardGeneratorV2: React.FC<FlashcardGeneratorV2Props> = ({ onGenerateIdeas, onGenerateImage, currentUser }) => {
  const [topic, setTopic] = useState('');
  const [ideas, setIdeas] = useState<FlashcardIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<FlashcardIdea | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerateIdeas = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }
    setIsLoadingIdeas(true);
    setError(null);
    setIdeas([]);
    setSelectedIdea(null);
    setGeneratedImage(null);
    try {
      const generatedIdeas = await onGenerateIdeas(topic);
      setIdeas(generatedIdeas);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  const handleSelectIdea = async (idea: FlashcardIdea) => {
    if (selectedIdea?.term === idea.term) return;
      
    setSelectedIdea(idea);
    setIsLoadingImage(true);
    setGeneratedImage(null);
    setError(null);
    try {
      const fullPrompt = `A simple, cute cartoon drawing of a ${idea.term} for a child's flashcard, on a plain white background.`;
      const imageUrl = await onGenerateImage(fullPrompt, '1:1');
      setGeneratedImage(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoadingImage(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage || !selectedIdea) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    const termSlug = selectedIdea.term.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').substring(0, 50);
    link.download = `flashcard_${termSlug || 'image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold flex items-center justify-center text-[var(--color-text-primary)]">
            Flashcard Wizard
            <SparklesIcon className="w-7 h-7 ml-2" style={{ color: 'var(--color-accent)' }} />
          </h2>
          <p className="text-[var(--color-text-secondary)] mt-2 px-4">
            Enter a topic to get AI-powered ideas, then generate an image for each one.
          </p>
        </div>
        
        <div className="aurora-card p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter a topic, e.g., 'Jungle Animals', 'Fruits', 'Shapes'"
                    className="flex-grow p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    disabled={isLoadingIdeas}
                />
                <button 
                    onClick={handleGenerateIdeas} 
                    disabled={isLoadingIdeas || !topic.trim()}
                    className="interactive-glow bg-[var(--color-accent)] text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <LightBulbIcon className="w-5 h-5"/>
                    {isLoadingIdeas ? 'Generating...' : 'Generate Ideas'}
                </button>
            </div>
             {currentUser.plan === 'free' && (
                <p className="text-xs text-center text-[var(--color-text-secondary)]">
                  Idea generation uses 1 lesson credit. Image generation uses 1 image credit.
                </p>
            )}
        </div>

        {error && <div className="mt-6"><ErrorMessage message={error} /></div>}

        <div className="mt-8 flex flex-col lg:flex-row gap-8 items-start">
            {/* Ideas Column */}
            <div className="lg:w-2/5 w-full">
                <h3 className="font-semibold text-lg mb-3">Generated Ideas</h3>
                <div className="aurora-card p-4 space-y-2 max-h-96 overflow-y-auto custom-scrollbar-container">
                    {isLoadingIdeas && <LoadingSpinner text="Generating ideas..." />}
                    {!isLoadingIdeas && ideas.length === 0 && (
                        <p className="text-center text-sm text-[var(--color-text-secondary)] py-8">Your flashcard ideas will appear here.</p>
                    )}
                    {ideas.map((idea) => (
                        <button
                            key={idea.term}
                            onClick={() => handleSelectIdea(idea)}
                            className={`w-full text-left p-3 rounded-md transition-all flex justify-between items-center ${selectedIdea?.term === idea.term ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-inset-bg)]'}`}
                        >
                            <div>
                                <p className="font-medium">{idea.term}</p>
                                <p className={`text-xs ${selectedIdea?.term === idea.term ? 'text-white/80' : 'text-[var(--color-text-secondary)]'}`}>{idea.description}</p>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 flex-shrink-0" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Image Preview Column */}
            <div className="lg:w-3/5 w-full lg:sticky lg:top-8">
                <h3 className="font-semibold text-lg mb-3">Image Preview</h3>
                 <div className="aspect-square w-full bg-[var(--color-inset-bg)] rounded-lg flex items-center justify-center p-4">
                     {isLoadingImage && <LoadingSpinner text="Generating image..." />}
                     {!isLoadingImage && generatedImage && (
                         <button onClick={() => setIsModalOpen(true)} className="w-full h-full group">
                            <img src={generatedImage} alt={selectedIdea?.term || 'Generated image'} className="max-w-full max-h-full object-contain rounded-md shadow-lg group-hover:scale-105 transition-transform" />
                         </button>
                     )}
                     {!isLoadingImage && !generatedImage && (
                         <p className="text-center text-sm text-[var(--color-text-secondary)]">Select an idea on the left to generate an image.</p>
                     )}
                 </div>
                 {generatedImage && !isLoadingImage && (
                     <button onClick={handleDownloadImage} className="mt-4 w-full blueprint-button-secondary py-3 px-4 text-sm font-medium rounded-lg flex items-center justify-center gap-2">
                        <DownloadIcon className="w-5 h-5" /> Download Image
                     </button>
                 )}
            </div>
        </div>
      </div>
      {isModalOpen && generatedImage && (
        <ImagePreviewModal imageUrl={generatedImage} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};

export default FlashcardGeneratorV2;
