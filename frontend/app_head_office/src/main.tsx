import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { IntlProvider } from 'react-intl'
import './index.css'
import App from './App.tsx'

import fr from "./i18n/fr.json";
import en from "./i18n/en.json";

type Locale = 'en' | 'fr';
type Messages = Record<string, string>;

const locale: Locale = 'fr';

const messages: Record<Locale, Messages> = {
    en,
    fr,
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IntlProvider locale={locale} messages={messages[locale]}>
      <App />
    </IntlProvider>
  </StrictMode>,
)
