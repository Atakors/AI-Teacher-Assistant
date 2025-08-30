import React from 'react';
import { XIcon, SparklesIcon, CheckIcon, ShieldCheckIcon } from './constants';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, featureName }) => {

  if (!isOpen) return null;

  const isAdminFeature = featureName?.toLowerCase().includes('admin');

  const proFeatures = [
    "Unlocks all premium tools (Exam, Bulk & Word Game Gen)",
    "Monthly credit bundle (resets each month)",
    "50 Lesson Planner Credits",
    "50 Flashcard Generator Credits",
    "10 Exam Generator Credits",
    "20 Word Game Generator Credits",
    "Full Resource Access & Customization",
    "Professional, Watermark-Free Exports",
    "Priority Support",
  ];
  
  const AdminContent = () => (
    <>
      <div className="text-center mb-8 max-w-md mx-auto">
        <ShieldCheckIcon className="w-12 h-12 mx-auto text-rose-500" />
        <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[var(--color-on-bg)]">
          Admin Access Required
        </h2>
        <p className="text-[var(--color-on-surface-variant)] mt-2">
          The "{featureName?.replace(' (Admin Only)','')}" feature is available for administrators only.
        </p>
      </div>
      <div className="text-center">
        <button onClick={onClose} className="material-button material-button-primary">
          Got it
        </button>
      </div>
    </>
  );

  const ProUpgradeContent = () => (
     <>
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <SparklesIcon className="w-12 h-12 mx-auto text-[var(--color-primary)]" />
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[var(--color-on-bg)]">
            Upgrade to Pro Co-Pilot
          </h2>
          <p className="text-[var(--color-on-surface-variant)] mt-2">
            {featureName 
              ? `The "${featureName}" feature is part of our Pro plan. Upgrade to unlock it and much more!`
              : "Unlock all premium features and remove all limits by upgrading to Pro."
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pro Plan Column */}
          <div className="border border-[var(--color-outline)] rounded-lg p-6 bg-[var(--color-surface-variant)]">
              <h4 className="text-xl font-semibold mb-4 text-center">Pro Plan Features</h4>
              <ul className="space-y-3 text-sm">
                  {proFeatures.map(f => (
                      <li key={f} className="flex items-start">
                          <CheckIcon className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                      </li>
                  ))}
              </ul>
          </div>
          {/* Price and CTA column */}
          <div className="flex flex-col items-center justify-center p-6">
              <p className="text-4xl font-bold text-[var(--color-on-bg)]">
                  1,700 DZD
              </p>
              <p className="text-[var(--color-on-surface-variant)] mb-6">
                  / month
              </p>
              <a href="mailto:contact@aitadz.pro?subject=Upgrade to Pro Co-Pilot Plan" className="w-full block py-3 font-semibold rounded-full material-button material-button-primary text-center">
                  Contact to Upgrade
              </a>
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-2 text-center">
                  An administrator will process your payment and upgrade your account.
              </p>
          </div>
        </div>
     </>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="relative material-card text-[var(--color-on-surface)] overflow-hidden">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors z-20">
            <XIcon className="w-6 h-6" />
          </button>
          
          <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar-container">
            {isAdminFeature ? <AdminContent /> : <ProUpgradeContent />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;