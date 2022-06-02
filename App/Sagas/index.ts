import { takeLatest, all } from 'redux-saga/effects'
import { StartupTypes } from 'App/Stores/Startup/Actions'
import { AuthTypes } from 'App/Stores/Auth/Actions'
import { ApiTypes } from 'App/Stores/Api/Actions'

import { startup } from './StartupSaga'

import { 
  login,
  logout,
} from './AuthSaga'

import {
  getDevices,
  registerDevice,
  getSensorDefinitions,
  getFirmwares,
} from './ApiSaga'

export default function* root() {
  yield all([
    takeLatest(StartupTypes.STARTUP, startup),

    takeLatest(AuthTypes.LOGIN, login),
    takeLatest(AuthTypes.LOGOUT, logout),

    takeLatest(ApiTypes.GET_DEVICES, getDevices),
    takeLatest(ApiTypes.REGISTER_DEVICE, registerDevice),
    takeLatest(ApiTypes.GET_SENSOR_DEFINITIONS, getSensorDefinitions),
    takeLatest(ApiTypes.GET_FIRMWARES, getFirmwares),
  ])
}
