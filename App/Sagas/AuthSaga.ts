import api from '@/App/Services/ApiService'
import AuthActions from '@/App/Stores/Auth/Actions'
import BeepBaseActions from '@/App/Stores/BeepBase/Actions'
import SettingsActions from '@/App/Stores/Settings/Actions'
import UserActions from '@/App/Stores/User/Actions'
import { call, put } from 'redux-saga/effects'
import { UserModel } from '../Models/UserModel'
import { getDevices } from './ApiSaga'
import { persistData, removeData, TOKEN_KEY, USER_KEY } from '../Helpers/AsyncStorageHelpers'

export function* login(action: any) {
  const { username, password } = action
  const response = yield call(api.login, username, password)
  if (response && response.ok) {
    //authentication successful
    const { api_token } = response.data
    //setting token will switch navigation in root screen
    if (api_token) {
      //persist username for next login
      yield put(SettingsActions.setUsername(username))
      //persist token to async storage for future app runs
      yield call(persistData, TOKEN_KEY, api_token)
      //persist user to async storage
      const user = new UserModel(response.data)
      yield call(persistData, USER_KEY, user)
      yield call(handleLogin, { apiToken: api_token, user })
    }
  } else {
    yield put(AuthActions.loginFailure(response))
  }
}

export function* handleLogin(action: any) {
  const { apiToken, user } = action
  console.log("Handle login", apiToken ? "<redacted>" : undefined, user)
  //set token for authentication
  yield call(api.setToken, apiToken)
  yield put(UserActions.setToken(apiToken))
  //store user details
  yield put(UserActions.setUser(user))
  //refresh registered devices linked to user account
  yield call(getDevices, null)
}

export function* logout(action: any) {
  //clear token from async storage
  yield call(removeData, TOKEN_KEY)
  yield put(UserActions.setToken(undefined))
  yield put(UserActions.setUser(undefined))
  yield put(UserActions.setDevices([]))
  yield put(BeepBaseActions.clear())
}
