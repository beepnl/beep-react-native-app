import { put, call } from 'redux-saga/effects'
import AuthActions from 'App/Stores/Auth/Actions'
import SettingsActions from 'App/Stores/Settings/Actions'
import UserActions from 'App/Stores/User/Actions'
import api from 'App/Services/ApiService'
import { UserModel } from '../Models/UserModel'

export function* login(action: any) {
  const { username, password } = action
  const response = yield call(api.login, username, password)
  if (response && response.ok) {
    //authentication successful
    const { api_token } = response.data
    //setting token will switch navigation in root screen
    if (api_token) {
      yield put(UserActions.setToken(api_token))
    }
    yield put(UserActions.setUser(new UserModel(response.data)))
  } else {
    yield put(AuthActions.loginFailure(response))
  }
}

export function* logout(action: any) {
  yield put(UserActions.setToken(undefined))
}