
import React from 'react';
import { SparklesIcon, CheckIcon } from './constants';

const PricingView: React.FC = () => {
  const proFeatures = [
    "25 Lesson Plans / month",
    "50 Flashcard Images / month",
    "Unlimited Saved Lesson Plans, Exams, Flashcards, and Canvases",
    "Full Curriculum & Calendar Customization",
    "Watermark-Free Professional PDF & Word Exports",
    "Priority Support",
    "Access to all future premium features",
  ];
  
  const freeFeatures = [
    "10 AI Lesson Plan Generations / month",
    "15 AI Flashcard Images / month",
    "Save up to 5 Lesson Plans",
    "Save up to 10 Flashcards & Canvases",
    "Watermarked PDF & Word Exports",
    "Full Timetable Editor Access",
    "View-Only Curriculum & Calendar",
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
        <div className="relative p-8">
            <div 
                className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-[var(--color-accent)] to-purple-500 opacity-10 dark:opacity-20"
                style={{ filter: 'blur(100px)'}}
            ></div>
            <div className="relative text-center mb-12 max-w-2xl mx-auto">
                <SparklesIcon className="w-12 h-12 mx-auto text-[var(--color-accent)]" />
                <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[var(--color-text-primary)]">
                    Find the Plan That’s Right For You
                </h2>
                <p className="text-[var(--color-text-secondary)] mt-2">
                    Start for free and upgrade for powerful Pro features.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Explorer Plan (Free) */}
              <div className="aurora-card p-6 h-full flex flex-col">
                <h3 className="text-2xl font-semibold text-[var(--color-accent)]">Explorer Plan</h3>
                <p className="text-[var(--color-text-secondary)] mb-6">Perfect for getting started.</p>
                <p className="text-4xl font-bold text-[var(--color-text-primary)] mb-2">Free</p>
                <p className="text-[var(--color-text-secondary)] mb-6">No credit card required</p>
                <button disabled className="w-full py-3 font-semibold rounded-lg bg-[var(--color-inset-bg)] text-[var(--color-text-secondary)] cursor-default">Your Current Plan</button>
                <div className="border-t border-[var(--color-border)] my-6"></div>
                <ul className="space-y-3 text-sm flex-grow">
                  {freeFeatures.map(f => <li key={f} className="flex items-start"><CheckIcon className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" /><span>{f}</span></li>)}
                </ul>
              </div>

              {/* Pro Co-Pilot Plan */}
              <div className="relative border-2 border-[var(--color-accent)] rounded-xl p-6 h-full flex flex-col shadow-2xl shadow-[var(--color-accent)]/20 bg-[var(--color-surface)]">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-accent)] text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                 </div>
                <h3 className="text-2xl font-semibold text-[var(--color-accent)]">Pro Co-Pilot Plan</h3>
                <p className="text-[var(--color-text-secondary)] mb-6">The ultimate toolkit for modern educators.</p>
                
                <p className="text-4xl font-bold text-[var(--color-text-primary)] text-center">
                    1,700 DZD
                </p>
                <p className="text-[var(--color-text-secondary)] mb-6 text-center">
                    / month
                </p>

                <a href="mailto:dz.ai.teacher.assistant@gmail.com?subject=Upgrade to Pro Co-Pilot Plan" className="w-full py-3 font-semibold rounded-lg zenith-button text-center">Contact to Upgrade</a>
                 <div className="border-t border-[var(--color-border)] my-6"></div>
                <ul className="space-y-3 text-sm flex-grow">
                  {proFeatures.map(f => <li key={f} className="flex items-start"><CheckIcon className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" /><span>{f}</span></li>)}
                </ul>
              </div>
            </div>
            
            <div className="mt-12 pt-10 border-t border-[var(--color-border)] text-center">
                <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">Extra Credits (Top-Ups)</h3>
                <p className="text-[var(--color-text-secondary)] mt-2 max-w-xl mx-auto">
                    Run out of your monthly credits? No problem. Purchase an extra credit pack anytime to continue creating.
                </p>
                <div className="mt-6 text-sm text-[var(--color-text-secondary)]">
                     <p>1 Flashcard = 1 Credit &nbsp;•&nbsp; 1 Lesson Plan = 2 Credits &nbsp;•&nbsp; 1 Exam = 3 Credits</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 max-w-3xl mx-auto">
                    <div className="aurora-card p-4">
                        <p className="text-xl font-bold text-[var(--color-accent)]">50 Credits</p>
                        <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">500 DZD</p>
                    </div>
                    <div className="aurora-card p-4">
                        <p className="text-xl font-bold text-[var(--color-accent)]">120 Credits</p>
                        <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">1,000 DZD</p>
                    </div>
                    <div className="aurora-card p-4">
                        <p className="text-xl font-bold text-[var(--color-accent)]">250 Credits</p>
                        <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">2,000 DZD</p>
                    </div>
                </div>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] mt-8 text-center max-w-md mx-auto">
                To upgrade or buy credits, please contact us for payment instructions (CCP / Bank Transfer available). We will activate your plan upon payment confirmation.
            </p>
        </div>
    </div>
  );
};

export default PricingView;
