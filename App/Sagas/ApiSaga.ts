import { put, call, select, all, take } from 'redux-saga/effects'
import ApiActions from 'App/Stores/Api/Actions'
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import UserActions from 'App/Stores/User/Actions'
import api from 'App/Services/ApiService'
import { DeviceModel } from '../Models/DeviceModel'
import { FirmwareModel } from '../Models/FirmwareModel'
import { SensorDefinitionModel } from '../Models/SensorDefinitionModel'
import { getDevice, getHardwareId, getLoRaWanState, getPairedPeripheral, getTemperatureSensorDefinitions, getWeightSensorDefinitions } from '../Stores/BeepBase/Selectors'
import BleHelpers, { COMMANDS } from '../Helpers/BleHelpers'
import { PairedPeripheralModel } from '../Models/PairedPeripheralModel'
import { BITMASK_ADAPTIVE_DATA_RATE, BITMASK_DUTY_CYCLE_LIMITATION, BITMASK_ENABLED, LoRaWanStateModel } from '../Models/LoRaWanStateModel'
import { APP_EUI, TTNModel } from '../Models/TTNModel'
import { BeepBaseTypes } from '../Stores/BeepBase/Actions'
import { CHANNELS } from '../Models/AudioModel'

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
        yield call(BleHelpers.write, peripheralId, COMMANDS.WRITE_LORAWAN_DEVEUI, device.devEUI)
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
    yield call(BleHelpers.write, peripheralId, COMMANDS.WRITE_LORAWAN_DEVEUI, device.devEUI)

    //reset device to factory defaults (as specified here)

    //ENERGY
    let params = Buffer.alloc(3)
    let i = 0
    params.writeUint8(1, i++)                   //message to send ratio
    params.writeUInt16BE(15, i++)               //interval in minutes
    yield call(BleHelpers.write, peripheralId, COMMANDS.WRITE_APPLICATION_CONFIG, params)

    //LORA
    yield call(BleHelpers.write, peripheralId, COMMANDS.READ_LORAWAN_STATE)
    yield take(BeepBaseTypes.SET_LO_RA_WAN_STATE)
    const loRaWanState: LoRaWanStateModel = getLoRaWanState(yield select())
    let newState = BITMASK_ADAPTIVE_DATA_RATE | BITMASK_DUTY_CYCLE_LIMITATION
    if (loRaWanState.hasJoined) {
      newState |= BITMASK_ENABLED
    }
    yield call(BleHelpers.write, peripheralId, COMMANDS.WRITE_LORAWAN_STATE, newState)
    
    //AUDIO
    params = Buffer.alloc(6)
    i = 0
    params.writeUint8(CHANNELS[0].bitmask, i++)   //IN3LM
    params.writeUint8(20, i++)                    //gain
    params.writeInt8(0, i++)                      //volume
    params.writeUint8(10, i++)                    //number of bins
    params.writeUint8(9, i++)                     //start bin
    params.writeUint8(70, i++)                    //stop bin
    yield call(BleHelpers.write, peripheralId, COMMANDS.WRITE_AUDIO_ADC_CONFIG, params)

    //CLOCK TODO: check if feature is supported in firmware
    params = Buffer.alloc(4)
    params.writeUint32BE((new Date().valueOf() + 1300) / 1000, 0)
    yield call(BleHelpers.write, peripheralId, COMMANDS.WRITE_CLOCK, params)

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

  const requestParams = {
    lorawan_device: {
      dev_eui: device.devEUI,
      app_key: appKey,
    }
  }
  
  const response = yield call(api.createTtnDevice, hardwareId.toString(), requestParams)
  if (response && response.ok) {
    //retrieve keys from api's TTN registration
    const ttn = new TTNModel(response.data)

    yield put(ApiActions.setLoRaConfigState("writingCredentials"))
    //write lora credentials to peripheral
    yield call(BleHelpers.write, peripheral.id, COMMANDS.WRITE_LORAWAN_APPEUI, APP_EUI)
    yield call(BleHelpers.write, peripheral.id, COMMANDS.WRITE_LORAWAN_DEVEUI, ttn.devEUI)
    yield call(BleHelpers.write, peripheral.id, COMMANDS.WRITE_LORAWAN_APPKEY, ttn.appKey)
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

export function* configureLoRaManual(action: any) {
  yield put(ApiActions.setLoRaConfigState("writingCredentials"))

  const { devEUI, appEui, appKey } = action
  const peripheral: PairedPeripheralModel = getPairedPeripheral(yield select())

  //write lora credentials to peripheral
  yield call(BleHelpers.write, peripheral.id, COMMANDS.WRITE_LORAWAN_APPEUI, appEui)
  yield call(BleHelpers.write, peripheral.id, COMMANDS.WRITE_LORAWAN_DEVEUI, devEUI)
  yield call(BleHelpers.write, peripheral.id, COMMANDS.WRITE_LORAWAN_APPKEY, appKey)
  yield call(BleHelpers.write, peripheral.id, COMMANDS.WRITE_LORAWAN_STATE, BITMASK_ENABLED | BITMASK_ADAPTIVE_DATA_RATE | BITMASK_DUTY_CYCLE_LIMITATION)
  yield put(ApiActions.setLoRaConfigState("checkingConnectivity"))
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