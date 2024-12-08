import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEn from './translations/en/common.json';
import commonRu from './translations/ru/common.json';

const resources = {
  en: {
    translation: {
      ...commonEn,
    },
  },
  ru: {
    translation: {
      ...commonRu,
    },
  },
};

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources,
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
