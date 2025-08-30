import React from 'react';
import { User } from '../types';
import { SparklesIcon, CheckIcon } from './constants';

interface PricingViewProps {
  currentUser: User;
}

const CreditPackCard: React.FC<{
  title: string;
  packs: { quantity: number; price: number; unitPrice: number; isBestValue?: boolean }[];
}> = ({ title, packs }) => (
  <div className="material-card p-6 h-full flex flex-col">
    <h4 className="text-xl font-bold text-center text-[var(--color-primary)] mb-4">{title}</h4>
    <div className="space-y-4 flex-grow">
      {packs.map(pack => (
        <div key={pack.quantity} className={`relative p-4 rounded-lg border text-center ${pack.isBestValue ? 'border-[var(--color-primary)] bg-[var(--color-surface)]' : 'border-[var(--color-outline)] bg-[var(--color-surface-variant)]'}`}>
          {pack.isBestValue && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white text-xs font-bold px-2 py-0.5 rounded-full">BEST VALUE</div>}
          <p className="text-2xl font-bold">{pack.quantity} <span className="text-base font-medium">Credits</span></p>
          <p className="text-3xl font-bold text-[var(--color-on-surface)] mt-1">{pack.price} DZD</p>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">{pack.unitPrice.toFixed(1)} DZD / Credit</p>
        </div>
      ))}
    </div>
     <a href="mailto:contact@aitadz.pro?subject=Credit%20Pack%20Purchase%20Inquiry" className="material-button material-button-secondary w-full mt-6 text-center">
        Contact to Purchase
    </a>
  </div>
);

const PricingView: React.FC<PricingViewProps> = ({ currentUser }) => {

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

  return (
    <div className="w-full max-w-7xl mx-auto">
        <div className="relative p-8">
            <div className="relative text-center mb-12 max-w-2xl mx-auto">
                <SparklesIcon className="w-12 h-12 mx-auto text-[var(--color-primary)]" />
                <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[var(--color-on-bg)]">
                    Plans & Credits
                </h2>
                <p className="text-[var(--color-on-surface-variant)] mt-2">
                    Upgrade to Pro for a monthly credit bundle and unlock all features, or top-up your favorite tools with non-expiring credit packs.
                </p>
            </div>

            {/* Pro Plan Feature Box */}
            <div className="relative border-2 border-[var(--color-primary)] rounded-xl p-8 mb-12 flex flex-col lg:flex-row items-center gap-8 shadow-2xl shadow-[var(--color-primary)]/20 bg-[var(--color-surface)] material-card">
              <div className="flex-grow">
                <h3 className="text-2xl font-semibold text-[var(--color-primary)]">Pro Co-Pilot Plan</h3>
                <p className="text-[var(--color-on-surface-variant)] mt-2 mb-4">The complete toolkit for modern educators. Get a balanced monthly credit bundle that resets, and unlock every premium feature.</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {proFeatures.map(f => <li key={f} className="flex items-start"><CheckIcon className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" /><span>{f}</span></li>)}
                </ul>
              </div>
              <div className="flex-shrink-0 text-center lg:text-right">
                <p className="text-4xl font-bold text-[var(--color-on-bg)]">1,700 DZD</p>
                <p className="text-[var(--color-on-surface-variant)] mb-4">/ month</p>
                {currentUser.plan === 'pro' ? (
                   <button disabled className="w-full py-3 px-8 font-semibold rounded-full bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] cursor-default">Your Current Plan</button>
                ) : (
                   <a href="mailto:contact@aitadz.pro?subject=Upgrade to Pro Co-Pilot Plan" className="w-full block py-3 px-8 font-semibold rounded-full material-button material-button-primary text-center">
                      Contact to Upgrade
                   </a>
                )}
              </div>
            </div>

            <div className="text-center mb-10">
                <h3 className="text-2xl font-bold text-[var(--color-on-bg)]">Buy Extra Credits (Top-Ups)</h3>
                <p className="text-[var(--color-on-surface-variant)] mt-2 max-w-xl mx-auto">
                   Need more creative power? Add credits anytime. **These credits never expire.**
                </p>
            </div>
            
            {/* Credit Packs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <CreditPackCard title="Lesson, Bulk & Word Game Credits" packs={[
                    { quantity: 20, price: 300, unitPrice: 15.0 },
                    { quantity: 50, price: 650, unitPrice: 13.0, isBestValue: true },
                    { quantity: 100, price: 1200, unitPrice: 12.0 },
                ]} />
                <CreditPackCard title="Flashcard Generator Credits" packs={[
                    { quantity: 50, price: 400, unitPrice: 8.0 },
                    { quantity: 150, price: 1000, unitPrice: 6.7, isBestValue: true },
                    { quantity: 300, price: 1800, unitPrice: 6.0 },
                ]} />
                <CreditPackCard title="Exam Generator Credits" packs={[
                    { quantity: 15, price: 300, unitPrice: 20.0 },
                    { quantity: 45, price: 800, unitPrice: 17.8, isBestValue: true },
                    { quantity: 90, price: 1500, unitPrice: 16.7 },
                ]} />
            </div>
             <p className="text-xs text-[var(--color-on-surface-variant)] mt-10 text-center max-w-md mx-auto">
                To purchase a Pro plan or credit packs, please contact us for payment instructions (CCP / Bank Transfer available). We will update your account upon payment confirmation.
            </p>
        </div>
    </div>
  );
};

export default PricingView;