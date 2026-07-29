import { Languages } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface LanguageToggleProps {
  tone?: 'light' | 'dark' | 'red';
  compact?: boolean;
  className?: string;
}

export default function LanguageToggle({
  tone = 'light',
  compact = false,
  className = '',
}: LanguageToggleProps) {
  const { language, toggleLanguage, t } = useLanguage();
  const dark = tone === 'dark';
  const red = tone === 'red';
  const nextLanguage = language === 'vi' ? 'EN' : 'VI';
  const switchLabel = language === 'vi' ? t('Switch to English') : t('Switch to Vietnamese');

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-1 border-2 p-1 shadow-[2px_2px_0px_#141414] ${
        dark ? 'border-neutral-600 bg-[#181820]' : red ? 'border-white/80 bg-[#E63946]' : 'border-ink-black bg-white'
      } ${className}`}
      aria-label={switchLabel}
      title={switchLabel}
    >
      {!compact && (
        <Languages className={`w-3.5 h-3.5 mx-1 ${dark || red ? 'text-white' : 'text-ink-black'}`} />
      )}
      <span
        className={`min-w-8 px-2 py-1 font-mono text-[10px] font-black uppercase transition-colors ${
          dark
            ? 'bg-white text-ink-black'
            : red
              ? 'bg-white text-[#E63946]'
              : 'bg-ink-black text-white'
        }`}
      >
        {language.toUpperCase()}
      </span>
      <span className={`px-1 font-mono text-[9px] font-black ${dark || red ? 'text-white/75' : 'text-neutral-500'}`}>
        → {nextLanguage}
      </span>
    </button>
  );
}