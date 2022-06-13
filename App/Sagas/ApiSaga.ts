import { put, call, select, all } from 'redux-saga/effects'
import ApiActions from 'App/Stores/Api/Actions'
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import UserActions from 'App/Stores/User/Actions'
import api from 'App/Services/ApiService'
import { DeviceModel } from '../Models/DeviceModel'
import { FirmwareModel } from '../Models/FirmwareModel'
import { SensorDefinitionModel } from '../Models/SensorDefinitionModel'
import { getTemperatureSensorDefinitions } from '../Stores/BeepBase/Selectors'

export function* getDevices(action: any) {
  const response = yield call(api.getDevices)
  if (response && response.ok) {
    const devices: Array<DeviceModel> = []
    response.data?.map((item: any) => devices.push(new DeviceModel(item)))
    yield put(UserActions.setDevices(devices))
  } else {
    yield put(ApiActions.apiFailure(response))
  }
}

export function* registerDevice(action: any) {
  yield put(ApiActions.setRegisterState("registering"))

  const { peripheralId, hardwareId, requestParams } = action

  //search for existing device
  const deviceResponse = yield call(api.getDevice, hardwareId.id)
  if (deviceResponse && deviceResponse.ok && deviceResponse.data) {
    if (deviceResponse.data.info) {
      //info field has error code
      switch (deviceResponse.data.info) {
        case "device_not_yours":
          yield put(ApiActions.setRegisterState("deviceAlreadyLinkedToAnotherAccount"))
          break;
      }
    } else {
      //no info field means search result
      if (Array.isArray(deviceResponse.data) && deviceResponse.data.length > 0) {
        //device already in db
        yield put(ApiActions.setRegisterState("alreadyRegistered"))
        const device = new DeviceModel(deviceResponse.data[0])
        yield put(BeepBaseActions.setDevice(device))
        //update firmware with LoRa devEUI. This will also rename the BLE name
        BleHelpers.write(peripheralId, COMMANDS.WRITE_LORAWAN_DEVEUI, device.devEUI)
      } else {
        //device not found, register it
        const registerResponse = yield call(api.registerDevice, requestParams)
        if (registerResponse && registerResponse.ok) {
          yield put(ApiActions.setRegisterState("registered"))
          const device = new DeviceModel(registerResponse.data)
          yield put(BeepBaseActions.setDevice(device))
          //update firmware with LoRa devEUI. This will also rename the BLE name
          BleHelpers.write(peripheralId, COMMANDS.WRITE_LORAWAN_DEVEUI, device.devEUI)
          //refresh user device list
          yield call(getDevices, null)
        } else {
          yield put(ApiActions.setRegisterState("failed"))
          yield put(ApiActions.apiFailure(registerResponse))
        }
      }
    }
  } else {
    yield put(ApiActions.setRegisterState("failed"))
    yield put(ApiActions.apiFailure(deviceResponse))
  }
}

export function* initializeSensors(action: any) {
  const { device, temperatures } = action
  yield call(getSensorDefinitions, action)
  const temperatureSensorDefinitions: Array<SensorDefinitionModel> = getTemperatureSensorDefinitions(yield select())
  yield all(temperatures.map((temperatureModel: any, index: number) => {
    const sensorAbbr = `t_${index}`
    const sensorDefinition = temperatureSensorDefinitions.find(temperatureSensorDefinition => temperatureSensorDefinition.inputAbbreviation === sensorAbbr)
    if (!sensorDefinition) {
      //definition for this sensor not found in api
      const requestParams = {
        device_hardware_id: device.hardwareId,
        input_measurement_abbreviation: sensorAbbr,
        name: `Temperature sensor ${index + 1}`,
        inside: true,
      }
      return call(createSensorDefinition, { requestParams })
    }
  }))
}

export function* getSensorDefinitions(action: any) {
  const { device } = action
  const response = yield call(api.getSensorDefinitions, device.id)
  if (response && response.ok) {
    const sensorDefinitions: Array<SensorDefinitionModel> = []
    response.data?.map((item: any) => sensorDefinitions.push(new SensorDefinitionModel(item)))
    //store in beep base store because it belongs to the currently connected beep base
    yield put(BeepBaseActions.setSensorDefinitions(sensorDefinitions))
  } else {
    yield put(ApiActions.apiFailure(response))
  }
}

export function* createSensorDefinition(action: any) {
  const { requestParams } = action
  const response = yield call(api.createSensorDefinition, requestParams)
  if (response && response.ok) {
    //TODO: update device with defs from response
  } else {
    yield put(ApiActions.apiFailure(response))
  }
}

export function* updateSensorDefinition(action: any) {
  const { sensorDefinition } = action
  const requestParams = {
    device_id: sensorDefinition.deviceId,
    input_measurement_abbreviation: sensorDefinition.inputAbbreviation,
    name: sensorDefinition.name,
    inside: sensorDefinition.isInside,
  }
  const response = yield call(api.updateSensorDefinition, sensorDefinition.id, requestParams)
  if (response && response.ok) {
    const sensorDefinition = new SensorDefinitionModel(response.data)
    yield put(BeepBaseActions.updateSensorDefinition(sensorDefinition))
  } else {
    yield put(ApiActions.apiFailure(response))
  }
}

export function* getFirmwares(action: any) {
  const response = yield call(api.getFirmwares)
  if (response && response.ok) {
    const firmwares: Array<FirmwareModel> = []
    response.data?.map((item: any) => firmwares.push(new FirmwareModel(item)))
    yield put(ApiActions.setFirmwares(firmwares))
  } else {
    yield put(ApiActions.apiFailure(response))
  }
}