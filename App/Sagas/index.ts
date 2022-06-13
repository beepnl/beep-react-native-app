import { takeLatest, all, takeEvery } from 'redux-saga/effects'
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
  checkDeviceRegistration,
  registerDevice,
  initializeSensors,
  createSensorDefinition,
  getSensorDefinitions,
  updateSensorDefinition,
  getFirmwares,
} from './ApiSaga'

export default function* root() {
  yield all([
    takeLatest(StartupTypes.STARTUP, startup),

    takeLatest(AuthTypes.LOGIN, login),
    takeLatest(AuthTypes.LOGOUT, logout),

    takeLatest(ApiTypes.GET_DEVICES, getDevices),
    takeLatest(ApiTypes.CHECK_DEVICE_REGISTRATION, checkDeviceRegistration),
    takeLatest(ApiTypes.REGISTER_DEVICE, registerDevice),
    takeLatest(ApiTypes.GET_SENSOR_DEFINITIONS, getSensorDefinitions),
    takeEvery(ApiTypes.INITIALIZE_SENSORS, initializeSensors),
    takeEvery(ApiTypes.CREATE_SENSOR_DEFINITION, createSensorDefinition),
    takeEvery(ApiTypes.UPDATE_API_SENSOR_DEFINITION, updateSensorDefinition),
    takeLatest(ApiTypes.GET_FIRMWARES, getFirmwares),
  ])
}
