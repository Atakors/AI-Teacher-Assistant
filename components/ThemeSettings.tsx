
import React from 'react';
import { ThemeSettings, AccentColor } from '../types';
import { SunIcon, MoonIcon, ACCENT_COLORS } from '../constants';

interface ThemeSettingsProps {
  settings: ThemeSettings;
  onModeToggle: () => void;
  onAccentChange: (color: AccentColor) => void;
}

const ThemeSettingsComponent: React.FC<ThemeSettingsProps> = ({ settings, onModeToggle, onAccentChange }) => {
  return (
    <div className="aurora-card p-4 space-y-4">
      <div>
        <h4 className="text-xs uppercase font-semibold text-[var(--color-text-secondary)] mb-2">Mode</h4>
        <div className="flex items-center p-1 rounded-lg" style={{backgroundColor: 'var(--color-inset-bg)'}}>
          <button 
            onClick={onModeToggle} 
            disabled={settings.mode === 'light'} 
            className={`w-1/2 p-1 rounded-md text-sm transition-all ${settings.mode === 'light' ? 'bg-[var(--color-surface)] shadow-md' : ''}`}
            aria-label="Switch to light mode"
          >
            <SunIcon className="w-5 h-5 mx-auto" />
          </button>
          <button 
            onClick={onModeToggle} 
            disabled={settings.mode === 'dark'}
            className={`w-1/2 p-1 rounded-md text-sm transition-all ${settings.mode === 'dark' ? 'bg-[var(--color-surface)] shadow-md' : ''}`}
            aria-label="Switch to dark mode"
          >
            <MoonIcon className="w-5 h-5 mx-auto" />
          </button>
        </div>
      </div>
       <div>
        <h4 className="text-xs uppercase font-semibold text-[var(--color-text-secondary)] mb-2">Accent</h4>
         <div className="grid grid-cols-4 gap-2">
            {ACCENT_COLORS.map(color => (
                <button
                    key={color.name}
                    onClick={() => onAccentChange(color.name)}
                    className={`w-full h-8 rounded-md transition-all border-2 ${settings.accentColor === color.name ? 'border-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]' : 'border-transparent hover:border-[var(--color-border)]'}`}
                    style={{ backgroundColor: color.colorValue }}
                    aria-label={`Set accent color to ${color.name}`}
                >
                </button>
            ))}
         </div>
      </div>
    </div>
  );
};

export default ThemeSettingsComponent;
