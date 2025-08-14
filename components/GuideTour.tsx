import React, { useState, useLayoutEffect } from 'react';
import { AppView } from '../types';
import { SparklesIcon } from '../constants';

interface GuideTourProps {
  onComplete: () => void;
  setActiveView: (view: AppView) => void;
}

interface TourStep {
  target: string;
  title: string;
  content: string;
  view?: AppView;
  placement?: 'bottom' | 'top' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'body',
    title: "Welcome to Teacher's AI Assistant!",
    content: "Let's take a quick tour to show you the main features. You can skip this anytime.",
  },
  {
    target: '#sidebar-nav',
    title: 'Main Navigation',
    content: 'This sidebar is your main hub. You can access all the tools from here.',
    placement: 'right'
  },
  {
    target: '#nav-lessonPlanner',
    title: 'Lesson Planner',
    content: "This is where the magic happens! Let's create a lesson plan.",
    view: 'lessonPlanner',
    placement: 'right'
  },
  {
    target: '#curriculum-year-selector',
    title: 'Select a Year',
    content: 'First, choose the curriculum year you want to plan for. The app will load the official curriculum data.',
    placement: 'bottom'
  },
  {
    target: '#lesson-accordion',
    title: 'Select a Lesson',
    content: 'Next, navigate through the sequences, sections, and lessons to pick your specific topic.',
    placement: 'bottom'
  },
  {
    target: '#ai-settings-panel',
    title: 'AI Settings',
    content: 'You can customize how detailed or creative you want the AI to be.',
    placement: 'top'
  },
  {
    target: '#generate-plan-button',
    title: 'Generate Your Plan',
    content: 'Once you have made your selections, click here to generate your detailed lesson plan.',
    placement: 'top'
  },
  {
    target: '#nav-flashcardGenerator',
    title: 'Flashcard Generator',
    content: 'Quickly create images for your flashcards by typing a simple prompt.',
    view: 'flashcardGenerator',
    placement: 'right'
  },
  {
    target: '#nav-timetableEditor',
    title: 'Timetable Editor',
    content: 'You can also manage your schools, classes, and weekly schedule here.',
    view: 'timetableEditor',
    placement: 'right'
  },
  {
    target: 'body',
    title: 'You are all set!',
    content: "That's a quick overview of the main features. Feel free to explore and start planning!",
  }
];

const GuideTour: React.FC<GuideTourProps> = ({ onComplete, setActiveView }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [styles, setStyles] = useState<{ popover: React.CSSProperties, highlight: React.CSSProperties }>({
    popover: { opacity: 0, pointerEvents: 'none' },
    highlight: { opacity: 0, pointerEvents: 'none' },
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const step = TOUR_STEPS[currentStep];

  useLayoutEffect(() => {
    if (isTransitioning) return;
    
    // Switch view if needed for the current step
    if (step.view) {
      setActiveView(step.view);
    }
    
    let poller: number | null = null;
    let timeout: number | null = null;

    const findAndPosition = () => {
      const targetElement = document.querySelector(step.target) as HTMLElement;
      
      if (step.target === 'body' || targetElement) {
        if (poller) clearInterval(poller);
        if (timeout) clearTimeout(timeout);
        
        const targetRect = step.target === 'body' ? { top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0, right: window.innerWidth / 2, bottom: window.innerHeight / 2 } : targetElement.getBoundingClientRect();
        
        const highlightStyle: React.CSSProperties = {
          position: 'fixed',
          left: `${targetRect.left - 4}px`,
          top: `${targetRect.top - 4}px`,
          width: `${targetRect.width + 8}px`,
          height: `${targetRect.height + 8}px`,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          borderRadius: step.target === 'body' ? '0' : '8px',
          zIndex: 1000,
          pointerEvents: 'none',
          opacity: 1,
          transition: 'all 0.3s ease-in-out',
        };

        const popoverStyle: React.CSSProperties = { zIndex: 1001, position: 'fixed', opacity: 1, transition: 'all 0.3s ease-in-out', width: 320, maxWidth: 'calc(100vw - 2rem)' };
        const placement = step.placement || 'bottom';
        const offset = 12;

        if (placement === 'bottom') {
          popoverStyle.top = targetRect.bottom + offset;
          popoverStyle.left = targetRect.left + targetRect.width / 2;
          popoverStyle.transform = 'translateX(-50%)';
        } else if (placement === 'top') {
          popoverStyle.top = targetRect.top - offset;
          popoverStyle.left = targetRect.left + targetRect.width / 2;
          popoverStyle.transform = 'translate(-50%, -100%)';
        } else if (placement === 'right') {
          popoverStyle.top = targetRect.top + targetRect.height / 2;
          popoverStyle.left = targetRect.right + offset;
          popoverStyle.transform = 'translateY(-50%)';
        } else if (placement === 'left') {
          popoverStyle.top = targetRect.top + targetRect.height / 2;
          popoverStyle.left = targetRect.left - offset;
          popoverStyle.transform = 'translate(-100%, -50%)';
        }

        // Viewport boundary checks
        const popoverRect = {
          width: 320,
          height: 250, // Estimate
          top: popoverStyle.top as number,
          left: popoverStyle.left as number,
        };
        
        if(popoverRect.left < offset) popoverStyle.left = offset;
        if(popoverRect.left + popoverRect.width > window.innerWidth - offset) popoverStyle.left = window.innerWidth - popoverRect.width - offset;
        if(popoverRect.top < offset) popoverStyle.top = offset;
        if(popoverRect.top + popoverRect.height > window.innerHeight - offset) popoverStyle.top = window.innerHeight - popoverRect.height - offset;


        setStyles({ highlight: highlightStyle, popover: popoverStyle });
        
        if (targetElement && step.target !== 'body') {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
      }
    };
    
    // Initial attempt after a brief delay for view transitions
    setTimeout(() => {
        findAndPosition();
        // If not found, start polling
        if (!document.querySelector(step.target)) {
            poller = window.setInterval(findAndPosition, 100);
            timeout = window.setTimeout(() => {
                if (poller) {
                    clearInterval(poller);
                    console.error(`Guide Tour: Could not find element "${step.target}".`);
                    onComplete(); // End tour if element not found
                }
            }, 3000); // Stop trying after 3 seconds
        }
    }, 300);

    window.addEventListener('resize', findAndPosition);
    window.addEventListener('scroll', findAndPosition, true);

    return () => {
      if (poller) clearInterval(poller);
      if (timeout) clearTimeout(timeout);
      window.removeEventListener('resize', findAndPosition);
      window.removeEventListener('scroll', findAndPosition, true);
    };
  }, [currentStep, step, isTransitioning, setActiveView, onComplete]);

  const goToStep = (stepIndex: number) => {
    setIsTransitioning(true);
    setStyles(prev => ({ ...prev, popover: {...prev.popover, opacity: 0}, highlight: {...prev.highlight, opacity: 0} }));
    setTimeout(() => {
        setCurrentStep(stepIndex);
        setIsTransitioning(false);
    }, 300); // Match transition duration
  };

  const handleNext = () => {
    const currentStepDetails = TOUR_STEPS[currentStep];
    if (currentStepDetails.target === '#curriculum-year-selector') {
        const event = new CustomEvent('guideTourAction', { detail: { action: 'ensureAccordionVisible' } });
        document.dispatchEvent(event);
    }
    
    if (currentStep < TOUR_STEPS.length - 1) {
      goToStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  return (
    <>
      <div style={styles.highlight}></div>
      <div style={styles.popover}>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 text-slate-800 dark:text-slate-200">
            <div className="flex items-start mb-3">
                <div className="p-2 bg-[var(--color-accent)]/10 rounded-full mr-3">
                    <SparklesIcon className="w-6 h-6 text-[var(--color-accent)]" />
                </div>
                <div>
                    <h3 className="text-lg font-bold">{step.title}</h3>
                </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{step.content}</p>

            <div className="flex justify-between items-center">
                <button onClick={onComplete} className="text-sm text-slate-500 hover:underline">Skip Tour</button>
                <div className="flex items-center gap-2">
                    {currentStep > 0 && (
                        <button onClick={handlePrev} className="blueprint-button-secondary text-sm py-2 px-4 rounded-lg">Back</button>
                    )}
                    <button onClick={handleNext} className="blueprint-button text-white text-sm py-2 px-4 rounded-lg">
                        {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
             <div className="flex justify-center mt-4">
                {TOUR_STEPS.map((_, index) => (
                    <div
                        key={index}
                        className={`w-2 h-2 rounded-full mx-1 transition-colors ${index === currentStep ? 'bg-[var(--color-accent)]' : 'bg-slate-300 dark:bg-slate-600'}`}
                    />
                ))}
            </div>
        </div>
      </div>
    </>
  );
};

export default GuideTour;