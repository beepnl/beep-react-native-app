import i18n from 'i18next';
import { Languages } from '../Components/LanguagePicker';
// import RNLanguageDetector from '@os-team/i18next-react-native-language-detector';

i18n
  // .use(RNLanguageDetector)
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    fallbackLng: 'en',
    // supportedLngs: Languages.map(language => language.code),
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
