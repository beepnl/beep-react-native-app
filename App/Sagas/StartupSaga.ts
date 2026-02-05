import { call, select, put } from 'redux-saga/effects'
import { getUseProduction } from '../Stores/User/Selectors'

// Utils
import api from '@/App/Services/ApiService'
import moment from 'moment'
import 'moment/locale/nl'
import { TOKEN_KEY } from './AuthSaga';
import AsyncStorage from '@react-native-async-storage/async-storage'
import UserActions from '@/App/Stores/User/Actions'

export function* startup() {
  console.log("**** App Startup ****")

  const useProduction: boolean = getUseProduction(yield select())
  yield call(api.setBaseUrl, useProduction)

  //set global locale of moment.js
  const language: string = yield select((state) => state.settings.language)
  moment.locale(language)

  console.log(moment().format('LLL'))

  //retrieve and restore token from async storage if available
  const storedToken = yield call(AsyncStorage.getItem, TOKEN_KEY)
  if (storedToken) {
    yield call(api.setToken, storedToken)
    yield put(UserActions.setToken(storedToken))
  }
}
