import React from 'react';
import { XIcon, SparklesIcon, CheckIcon } from '../constants';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string; // Optional: name of the feature they tried to access
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, featureName }) => {
  if (!isOpen) return null;

  const premiumFeatures = [
    "Unlimited AI Lesson Plan Generations",
    "Unlimited AI Flashcard Generations",
    "Full Access to Curriculum Overview",
    "Customizable School Calendar",
    "Priority Support & Early Access to New Features",
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl text-slate-900 dark:text-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div 
            className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-[var(--color-accent)] to-purple-500 opacity-30"
            style={{ filter: 'blur(80px)'}}
        ></div>
        <button onClick={onClose} className="absolute top-3 right-3 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors z-20">
          <XIcon className="w-6 h-6" />
        </button>
        
        <div className="relative p-8">
            <div className="text-center mb-8">
                <SparklesIcon className="w-12 h-12 mx-auto text-[var(--color-accent)]" />
                <h2 className="text-2xl font-bold mt-2 text-slate-800 dark:text-white">
                    Unlock Your Full Potential
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    {featureName ? `The "${featureName}" feature is part of our Premium plan.` : "You've reached the limit of the free plan."}
                    {' '}Save dozens of hours every month and focus on what matters most—teaching.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Monthly Plan */}
                <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Monthly Plan</h3>
                    <p className="text-3xl font-bold my-2 text-[var(--color-accent)]">1200 DZD</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">per month</p>
                </div>

                {/* Annual Plan */}
                <div className="relative border-2 border-[var(--color-accent)] rounded-lg p-6 text-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-accent)] text-white text-xs font-bold px-3 py-1 rounded-full">
                        BEST VALUE
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Annual Plan</h3>
                    <p className="text-3xl font-bold my-2 text-[var(--color-accent)]">12,000 DZD</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">per year</p>
                    <p className="text-sm font-medium text-emerald-500 mt-1">✨ Save 2 months! ✨</p>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4 text-center">Premium features include:</h3>
                <ul className="space-y-2">
                    {premiumFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start">
                            <CheckIcon className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-600 dark:text-slate-300">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="mt-8 text-center">
                <a 
                    href="mailto:dz.ai.teacher.assistant@gmail.com?subject=Premium Plan Inquiry"
                    className="inline-block w-full max-w-xs py-3 px-4 font-medium rounded-lg blueprint-button text-center"
                >
                    Contact to Upgrade
                </a>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 max-w-sm mx-auto">
                    To upgrade, please contact us for payment instructions (CCP / Bank Transfer available).
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;