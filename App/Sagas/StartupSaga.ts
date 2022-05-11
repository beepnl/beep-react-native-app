import { select } from 'redux-saga/effects'

// Utils
import moment from 'moment'
import momentDurationFormatSetup from 'moment-duration-format'
import 'moment/locale/nl'

export function* startup() {
  console.log("**** App Startup ****")

  //init moment duration plug-in
  momentDurationFormatSetup(moment)

  //set global locale of moment.js
  const language: string = yield select((state) => state.settings.language)
  moment.locale(language)

  moment.updateLocale('nl', {
    durationLabelsStandard: {
      S: 'milliseconde',
      SS: 'milliseconden',
      s: 'seconde',
      ss: 'seconden',
      m: 'minuut',
      mm: 'minuten',
      h: 'uur',
      hh: 'uur',
      d: 'dag',
      dd: 'dagen',
      w: 'week',
      ww: 'weken',
      M: 'maand',
      MM: 'maanden',
      y: 'jaar',
      yy: 'jaar'
    },
    durationLabelsShort: {
      S: 'msec',
      SS: 'msec',
      s: 'sec',
      ss: 'sec',
      m: 'min',
      mm: 'min',
      h: 'uur',
      hh: 'uur',
      d: 'dag',
      dd: 'dgn',
      w: 'wk',
      ww: 'wkn',
      M: 'mnd',
      MM: 'mnd',
      y: 'jr',
      yy: 'jr'
    },
    relativeTime : {
      future : 'over %s',
      past : '%s',
      s : "zojuist",
      m : 'één minuut',
      mm : '%d minuten',
      h : 'één uur',
      hh : '%d uur',
      d : "gisteren",
      dd : '%d dagen',
      M : "vorige maand",
      MM : '%d maanden',
      y : "vorig jaar",
      yy : '%d jaar'
    },
    durationTimeTemplates: {
      HMS: 'h:mm:ss',
      HM: 'h:mm',
      MS: 'm:ss'
    },
    durationLabelTypes: [
      { type: "standard", string: "__" },
      { type: "short", string: "_" }
    ],
    durationPluralKey: function (token: string, integerValue: number, decimalValue: number) {
      // Singular for a value of `1`, but not for `1.0`.
      if (integerValue === 1 && decimalValue === null) {
        return token;
      }

      return token + token;
    }
  });

  console.log(moment().format('LLL'))

}
