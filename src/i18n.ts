import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ru',
    supportedLngs: ['ru', 'kaa'],
    debug: false, // Set to false to hide missing translation warnings
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    saveMissing: false,
    missingKeyHandler: false,
  });

export default i18n;
