import React, { useState } from 'react';
import { XIcon, SparklesIcon, CheckIcon } from '../constants';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, featureName }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');

  if (!isOpen) return null;

  const proFeatures = [
    "25 AI Lesson Plan Generations / month",
    "50 AI Flashcard Images / month",
    "Unlimited Saved Lesson Plans",
    "Full Curriculum & Calendar Customization",
    "Advanced AI Controls",
    "Watermark-Free PDF & Word Exports",
    "Priority Support",
  ];
  
  const freeFeatures = [
    "4 AI Lesson Plan Generations / month",
    "8 AI Flashcard Images / month",
    "Full Timetable Editor Access",
    "View-Only Curriculum & Calendar",
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div 
        className="relative w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden" 
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
      >
        <div 
            className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-[var(--color-accent)] to-purple-500 opacity-20 dark:opacity-30"
            style={{ filter: 'blur(100px)'}}
        ></div>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors z-20">
          <XIcon className="w-6 h-6" />
        </button>
        
        <div className="relative p-8">
            <div className="text-center mb-8 max-w-2xl mx-auto">
                <SparklesIcon className="w-12 h-12 mx-auto text-[var(--color-accent)]" />
                <h2 className="text-3xl sm:text-4xl font-bold mt-2">
                    Find the Plan That’s Right For You
                </h2>
                <p className="text-[var(--color-text-secondary)] mt-2">
                    {featureName ? `The "${featureName}" feature is part of our Pro plan.` : "You've reached the limit of the free plan."}
                    {' '}Start for free and upgrade for powerful Pro features.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Discovery Plan (Free) */}
              <div className="border border-[var(--color-border)] rounded-xl p-6 h-full flex flex-col">
                <h3 className="text-2xl font-semibold text-[var(--color-accent)]">Discovery</h3>
                <p className="text-[var(--color-text-secondary)] mb-6">Perfect for getting started.</p>
                <p className="text-4xl font-bold mb-2">Free</p>
                <p className="text-[var(--color-text-secondary)] mb-6">No credit card required</p>
                <button disabled className="w-full py-3 font-semibold rounded-lg bg-[var(--color-inset-bg)] text-[var(--color-text-secondary)] cursor-default">Your Current Plan</button>
                <div className="border-t border-[var(--color-border)] my-6"></div>
                <ul className="space-y-3 text-sm flex-grow">
                  {freeFeatures.map(f => <li key={f} className="flex items-start"><CheckIcon className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" /><span>{f}</span></li>)}
                </ul>
              </div>

              {/* Pro Teacher Plan */}
              <div className="relative border-2 border-[var(--color-accent)] rounded-xl p-6 h-full flex flex-col shadow-2xl shadow-[var(--color-accent)]/20">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-accent)] text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                 </div>
                <h3 className="text-2xl font-semibold text-[var(--color-accent)]">Pro Teacher</h3>
                <p className="text-[var(--color-text-secondary)] mb-6">The ultimate toolkit for modern educators.</p>
                
                <div className="flex justify-center items-center p-1 rounded-lg bg-[var(--color-inset-bg)] mb-4">
                  <button onClick={() => setBillingCycle('monthly')} className={`w-1/2 p-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm' : ''}`}>Monthly</button>
                  <button onClick={() => setBillingCycle('annually')} className={`w-1/2 p-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'annually' ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm' : ''}`}>Annually</button>
                </div>

                {billingCycle === 'annually' && (
                    <p className="text-center text-sm font-medium text-emerald-500 mb-2">Save 3,900 DZD - It's like 4 months free!</p>
                )}

                <p className="text-4xl font-bold text-center">
                    {billingCycle === 'monthly' ? '950 DZD' : '7,500 DZD'}
                </p>
                <p className="text-[var(--color-text-secondary)] mb-6 text-center">
                    {billingCycle === 'monthly' ? '/ month' : '/ year'}
                </p>

                <a href="mailto:dz.ai.teacher.assistant@gmail.com?subject=Upgrade to Pro Teacher Plan" className="w-full py-3 font-semibold rounded-lg blueprint-button text-center">Contact to Upgrade</a>
                 <div className="border-t border-[var(--color-border)] my-6"></div>
                <ul className="space-y-3 text-sm flex-grow">
                  {proFeatures.map(f => <li key={f} className="flex items-start"><CheckIcon className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" /><span>{f}</span></li>)}
                </ul>
              </div>
            </div>
             <p className="text-xs text-[var(--color-text-secondary)] mt-6 text-center max-w-md mx-auto">
                To upgrade, please contact us for payment instructions (CCP / Bank Transfer available). We will activate your Pro plan upon payment confirmation.
            </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;