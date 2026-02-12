import { call, select, put } from 'redux-saga/effects'
import { getUseProduction } from '../Stores/User/Selectors'

// Utils
import api from '@/App/Services/ApiService'
import moment from 'moment'
import 'moment/locale/nl'
import { retrieveData, 
  TOKEN_KEY, 
  USE_PRODUCTION_KEY, 
  USER_KEY
} from '../Helpers/AsyncStorageHelpers'
import AuthActions from '@/App/Stores/Auth/Actions'
import UserActions from '@/App/Stores/User/Actions'

export function* startup() {
  console.log("**** App Startup ****")

  //set global locale of moment.js
  const language: string = yield select((state) => state.settings.language)
  moment.locale(language)

  console.log(moment().format('LLL'))

  //retrieve and restore persisted settings from async storage.
  //make sure useProduction is set before api token and user, as it determines the base url for api calls
  const useProduction = yield call(retrieveData, USE_PRODUCTION_KEY)
  if (typeof useProduction === 'boolean') {
    yield call(api.setBaseUrl, useProduction)
    yield put(UserActions.setUseProduction(useProduction))
  }
  const token = yield call(retrieveData, TOKEN_KEY)
  const user = yield call(retrieveData, USER_KEY)
  if (token && user) {
    yield put(AuthActions.handleLogin(token, user))
  }
}
