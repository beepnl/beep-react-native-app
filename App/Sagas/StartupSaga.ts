import { call, select } from 'redux-saga/effects'
import { getUseProduction } from '../Stores/User/Selectors'

// Utils
import api from '@/App/Services/ApiService'
import moment from 'moment'
import 'moment/locale/nl'

export function* startup() {
  console.log("**** App Startup ****")

  const useProduction: boolean = getUseProduction(yield select())
  yield call(api.setBaseUrl, useProduction)

  //set global locale of moment.js
  const language: string = yield select((state) => state.settings.language)
  moment.locale(language)

  console.log(moment().format('LLL'))
}
