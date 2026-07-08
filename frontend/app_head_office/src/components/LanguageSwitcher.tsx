import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1 text-xs font-semibold">
      <button
        onClick={() => i18n.changeLanguage('fr')}
        className={i18n.language === 'fr' ? 'text-[#4A3022] underline' : 'text-gray-400 hover:text-[#4A3022]'}
      >
        FR
      </button>
      <span className="text-gray-300">/</span>
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={i18n.language === 'en' ? 'text-[#4A3022] underline' : 'text-gray-400 hover:text-[#4A3022]'}
      >
        EN
      </button>
    </div>
  );
}