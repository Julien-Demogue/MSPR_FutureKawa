import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import en from './en.json';
import es from './es.json';
import pt from './pt.json';

const STORAGE_KEY = 'futurekawa-lang';
const SUPPORTED = ['fr', 'en', 'es', 'pt'];
const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      es: { translation: es },
      pt: { translation: pt },
    },
    lng: saved && SUPPORTED.includes(saved) ? saved : 'fr',
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // navigation privée ou storage indisponible
  }
});

export default i18n;