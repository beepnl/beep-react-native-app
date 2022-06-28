import { put, call, select, all } from 'redux-saga/effects'
import ApiActions from 'App/Stores/Api/Actions'
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import UserActions from 'App/Stores/User/Actions'
import api from 'App/Services/ApiService'
import { DeviceModel } from '../Models/DeviceModel'
import { FirmwareModel } from '../Models/FirmwareModel'
import { SensorDefinitionModel } from '../Models/SensorDefinitionModel'
import { getDevice, getHardwareId, getPairedPeripheral, getTemperatureSensorDefinitions, getWeightSensorDefinitions } from '../Stores/BeepBase/Selectors'
import BleHelpers, { COMMANDS } from '../Helpers/BleHelpers'
import { PairedPeripheralModel } from '../Models/PairedPeripheralModel'
import { BITMASK_ADAPTIVE_DATA_RATE, BITMASK_DUTY_CYCLE_LIMITATION, BITMASK_ENABLED } from '../Models/LoRaWanStateModel'

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

export function* checkDeviceRegistration(action: any) {
  yield put(ApiActions.setRegisterState("checking"))

  const { peripheralId, hardwareId } = action

  //search for existing device
  const deviceResponse = yield call(api.getDevice, hardwareId.id)
  if (deviceResponse && deviceResponse.ok && deviceResponse.data) {
    if (deviceResponse.data.info) {
      //info field has error code
      switch (deviceResponse.data.info) {
        case "device_not_yours":
          //cancel wizard
          yield put(ApiActions.setRegisterState("deviceAlreadyLinkedToAnotherAccount"))
          break;
      }
    } else {
      //no info field means we have a search result
      if (Array.isArray(deviceResponse.data) && deviceResponse.data.length > 0) {
        //device is already in db
        yield put(ApiActions.setRegisterState("alreadyRegistered"))
        const device = new DeviceModel(deviceResponse.data[0])
        yield put(BeepBaseActions.setDevice(device))
        //update firmware with LoRa devEUI. This will also rename the BLE name
        BleHelpers.write(peripheralId, COMMANDS.WRITE_LORAWAN_DEVEUI, device.devEUI)
      } else {
        //device not found
        yield put(ApiActions.setRegisterState("notYetRegistered"))
      }
    }
  } else {
    yield put(ApiActions.setRegisterState("failed"))
    yield put(ApiActions.apiFailure(deviceResponse))
  }
}

export function* registerDevice(action: any) {
  yield put(ApiActions.setRegisterState("registering"))

  const { peripheralId, requestParams } = action
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

export function* configureLoRaAutomatic(action: any) {
  yield put(ApiActions.setLoRaConfigState("registeringApi"))

  const { appKey } = action
  const hardwareId: string = getHardwareId(yield select())
  const device: DeviceModel = getDevice(yield select())
  const peripheral: PairedPeripheralModel = getPairedPeripheral(yield select())
  const appEui: string = "70b3d57ed0028d38"

  const requestParams = {
    lorawan_device: {
      dev_eui: device.devEUI,
      app_key: appKey,
    }
  }
  
  const response = yield call(api.createTtnDevice, hardwareId.toString(), requestParams)
  if (response && response.ok) {
    yield put(ApiActions.setLoRaConfigState("writingCredentials"))
    // console.log(response)
    //write lora credentials to peripheral
    yield call(BleHelpers.write, peripheral.id, COMMANDS.WRITE_LORAWAN_APPEUI, appEui)
    yield call(BleHelpers.write, peripheral.id, COMMANDS.WRITE_LORAWAN_DEVEUI, device.devEUI)
    yield call(BleHelpers.write, peripheral.id, COMMANDS.WRITE_LORAWAN_APPKEY, appKey)
    yield call(BleHelpers.write, peripheral.id, COMMANDS.WRITE_LORAWAN_STATE, BITMASK_ENABLED | BITMASK_ADAPTIVE_DATA_RATE | BITMASK_DUTY_CYCLE_LIMITATION)
    yield put(ApiActions.setLoRaConfigState("checkingConnectivity"))
  } else {
    yield put(ApiActions.setLoRaConfigState("failedToRegister"))
    //TODO: messages = response.data.errors.[lorawan_device.app_key]
    //      msg1 = message[0]
    //      msg2 = message[1]
    yield put(ApiActions.apiFailure(response))
  }
}

export function* initializeTemperatureSensors(action: any) {
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

export function* initializeWeightSensor(action: any) {
  const { device, weight } = action
  yield call(getSensorDefinitions, action)
  const weightSensorDefinitions: Array<SensorDefinitionModel> = getWeightSensorDefinitions(yield select())
  const sensorAbbr = "w_v"
  const sensorDefinition = weightSensorDefinitions.find(weightSensorDefinition => weightSensorDefinition.inputAbbreviation === sensorAbbr)
  if (!sensorDefinition) {
    //definition for this sensor not found in api
    const requestParams = {
      device_hardware_id: device.hardwareId,
      input_measurement_abbreviation: sensorAbbr,
      output_measurement_abbreviation: "weight_kg",
      name: "Weight sensor",
      // offset: weight.offset,
      // multiplier: weight.multiplier,
    }
    yield call(createSensorDefinition, { requestParams })
  }
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

  const requestParams: any = {
    device_id: sensorDefinition.deviceId,
    input_measurement_abbreviation: sensorDefinition.inputAbbreviation,
  }
  if (sensorDefinition.name != undefined) requestParams.name = sensorDefinition.name
  if (sensorDefinition.isInside != undefined) requestParams.inside = sensorDefinition.isInside
  if (sensorDefinition.offset != undefined) requestParams.offset = sensorDefinition.offset
  if (sensorDefinition.multiplier != undefined) requestParams.multiplier = sensorDefinition.multiplier
  
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