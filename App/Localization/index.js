import i18n from 'i18next';

i18n
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    fallbackLng: 'en',
    lng: 'en',
    supportedLngs: 'en',
    debug: __DEV__,
    compatibilityJSON: "v3",
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      "en": { translation: require('./en.json') },
    }
  });

export default i18n;
