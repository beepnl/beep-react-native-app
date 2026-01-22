import { all, takeEvery, takeLatest } from 'redux-saga/effects'
import { ApiTypes } from '../Stores/Api/Actions'
import { AuthTypes } from '../Stores/Auth/Actions'
import { StartupTypes } from '../Stores/Startup/Actions'

import { startup } from './StartupSaga'

import {
  login,
  logout,
} from './AuthSaga'

import {
  checkDeviceRegistration,
  configureLoRaAutomatic,
  configureLoRaManual,
  createSensorDefinition,
  getDevices,
  getFirmwares,
  getSensorDefinitions,
  initializeTemperatureSensors,
  initializeWeightSensor,
  registerDevice,
  updateApiSensorDefinition,
} from './ApiSaga'

export default function* root() {
  yield all([
    takeLatest(StartupTypes.STARTUP, startup),

    takeLatest(AuthTypes.LOGIN, login),
    takeLatest(AuthTypes.LOGOUT, logout),

    takeLatest(ApiTypes.GET_DEVICES, getDevices),
    takeLatest(ApiTypes.CHECK_DEVICE_REGISTRATION, checkDeviceRegistration),
    takeLatest(ApiTypes.REGISTER_DEVICE, registerDevice),
    takeLatest(ApiTypes.CONFIGURE_LO_RA_AUTOMATIC, configureLoRaAutomatic),
    takeLatest(ApiTypes.CONFIGURE_LO_RA_MANUAL, configureLoRaManual),
    takeLatest(ApiTypes.GET_SENSOR_DEFINITIONS, getSensorDefinitions),
    takeEvery(ApiTypes.INITIALIZE_TEMPERATURE_SENSORS, initializeTemperatureSensors),
    takeEvery(ApiTypes.INITIALIZE_WEIGHT_SENSOR, initializeWeightSensor),
    takeEvery(ApiTypes.CREATE_SENSOR_DEFINITION, createSensorDefinition),
    takeEvery(ApiTypes.UPDATE_API_SENSOR_DEFINITION, updateApiSensorDefinition),
    takeLatest(ApiTypes.GET_FIRMWARES, getFirmwares),
  ])
}
