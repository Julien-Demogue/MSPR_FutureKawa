import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'pt', label: 'PT' },
] as const;

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1 text-xs font-semibold">
      {LANGUAGES.map((lang, idx) => (
        <span key={lang.code} className="flex items-center gap-1">
          {idx > 0 && <span className="text-gray-300">/</span>}
          <button
            onClick={() => i18n.changeLanguage(lang.code)}
            className={
              i18n.language === lang.code
                ? 'text-[#4A3022] underline'
                : 'text-gray-400 hover:text-[#4A3022]'
            }
          >
            {lang.label}
          </button>
        </span>
      ))}
    </div>
  );
}