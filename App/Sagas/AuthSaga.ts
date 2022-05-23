import { put, call } from 'redux-saga/effects'
import AuthActions from 'App/Stores/Auth/Actions'
import SettingsActions from 'App/Stores/Settings/Actions'
import api from 'App/Services/ApiService'

export function* login(action: any) {
  const { username, password } = action
  const response = yield call(api.login, username, password)
  if (response && response.ok) {
    debugger
    //authentication successful
    const { api_token } = response.data
    //setting token will switch navigation in root screen
    yield put(SettingsActions.setToken(api_token))
  } else {
    yield put(AuthActions.loginFailure(response))

  }
}

export function* logout(action: any) {
}