import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers'
import { CHANNELS } from '@/App/Models/AudioModel'
import { DeviceModel } from '@/App/Models/DeviceModel'
import { FirmwareModel } from '@/App/Models/FirmwareModel'
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel'
import { SensorDefinitionModel } from '@/App/Models/SensorDefinitionModel'
import { APP_EUI, TTNModel } from '@/App/Models/TTNModel'
import api from '@/App/Services/ApiService'
import { navigate } from '@/App/Services/NavigationService'
import ApiActions from '@/App/Stores/Api/Actions'
import BeepBaseActions, { BeepBaseTypes } from '@/App/Stores/BeepBase/Actions'
import UserActions from '@/App/Stores/User/Actions'
import { getRefreshToken } from '@/App/Stores/User/Selectors'
import { all, call, delay, put, race, select, take } from 'redux-saga/effects'
import { BITMASK_ADAPTIVE_DATA_RATE, BITMASK_DISABLED, BITMASK_DUTY_CYCLE_LIMITATION, BITMASK_ENABLED, LoRaWanStateModel } from '../Models/LoRaWanStateModel'
import { LoRaCoverageProvider } from '../Stores/Api/InitialState'
import { getWeightSensorDefinitions, getDevice, getHardwareId, getLoRaWanState, getPairedPeripheral, getTemperatureSensorDefinitions } from '../Stores/BeepBase/Selectors'

const BLE_RESPONSE_TIMEOUT = 8000

function apiFailureFromError(error: any) {
  return {
    status: 0,
    problem: 'BLE_ERROR',
    data: {
      message: error?.message ?? error?.toString?.() ?? 'Bluetooth command failed',
    },
  }
}

function* writeBle(peripheralId: string, command: any, params?: any) {
  yield call(BleHelpers.write, peripheralId, command, params, { throwOnError: true })
}

function* readLoRaStateWithTimeout(peripheralId: string) {
  yield call(writeBle, peripheralId, COMMANDS.READ_LORAWAN_STATE)
  const { timeout } = yield race({
    state: take(BeepBaseTypes.SET_LO_RA_WAN_STATE),
    timeout: delay(BLE_RESPONSE_TIMEOUT),
  })

  if (timeout) {
    throw new Error('Timed out waiting for LoRa state from BEEP base.')
  }

  return getLoRaWanState(yield select())
}

function* guardedRequest<Fn extends (...args: any[]) => any>(fn: Fn, ...args: Parameters<Fn>) {
  const response = yield fn(...args)
  if (response.status == 401 || response.status == 403) {
    //token expired
    console.log("token expired!", response)
    
    //refresh token
    const refreshToken = yield select(getRefreshToken)
    if (!refreshToken) {
      //no refresh token, logout user
      console.log("no refresh token")
      //yield put(AuthActions.logout())
      return { ok: false, data: "Authorization token expired" }
    }
    //Beep API has no support for refresh tokens
    // const refreshResponse = yield call(api.refreshToken, refreshToken)
    const refreshResponse = { ok: false }
    if (refreshResponse.ok && refreshResponse.data?.token) {
      //refresh successful
      console.log("refresh successful!", refreshResponse)
      const { token, refresh_token } = refreshResponse.data
      yield call(api.setKey, token)
      yield put(UserActions.setToken(token, refresh_token))
      
      //redo request with new token
      const redoResponse = yield fn(...args)
      if (redoResponse.code == 401) {
        //request failed after refresh, logout user
        // yield put(AuthActions.logout())
      }
      return redoResponse
    } else {
      //refresh failed, logout user
      console.log("refresh failed")
      // yield put(AuthActions.logout())
    }
  }
  else if(response.status == 500 || response.status == 400 ){
      console.error("Server error")
      console.log("server error", response)
  }
  return response
}

export function* getDevices(action: any) {
  const response = yield guardedRequest(api.getDevices)
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
  const deviceResponse = yield guardedRequest(api.getDevice, hardwareId.id)
  if (deviceResponse && deviceResponse.ok && deviceResponse.data) {
    console.log("deviceResponse", deviceResponse)
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

        const device = new DeviceModel(deviceResponse.data[0])
        if (!device.devEUI) {
          yield put(ApiActions.setRegisterState("notYetRegistered"))
          console.log("Registration failed (device exists but devEUI is not defined)")
          return
        }

        yield put(ApiActions.setRegisterState("alreadyRegistered"))
        yield put(BeepBaseActions.setDevice(device))

        //update firmware with LoRa devEUI. This will also rename the BLE name
        try {
          yield call(writeBle, peripheralId, COMMANDS.WRITE_LORAWAN_DEVEUI, device.devEUI)
        } catch (error) {
          yield put(ApiActions.setRegisterState("failed"))
          yield put(ApiActions.apiFailure(apiFailureFromError(error)))
        }

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
  const registerResponse = yield guardedRequest(api.registerDevice, requestParams)
  if (registerResponse && registerResponse.ok) {
    const device = new DeviceModel(registerResponse.data)
    yield put(BeepBaseActions.setDevice(device))

    try {
      //update firmware with LoRa devEUI. This will also rename the BLE name
      yield call(writeBle, peripheralId, COMMANDS.WRITE_LORAWAN_DEVEUI, device.devEUI)

      //reset device to factory defaults (as specified here)

      //ENERGY
      let params = Buffer.alloc(3)
      let i = 0
      params.writeUint8(1, i++)                   //message to send ratio
      params.writeUInt16BE(15, i++)               //interval in minutes
      yield call(writeBle, peripheralId, COMMANDS.WRITE_APPLICATION_CONFIG, params)

      //LORA
      const loRaWanState: LoRaWanStateModel | undefined = yield call(readLoRaStateWithTimeout, peripheralId)
      let newState = BITMASK_ADAPTIVE_DATA_RATE | BITMASK_DUTY_CYCLE_LIMITATION
      if (loRaWanState?.hasJoined) {
        newState |= BITMASK_ENABLED
      }
      yield call(writeBle, peripheralId, COMMANDS.WRITE_LORAWAN_STATE, newState)

      //AUDIO
      params = Buffer.alloc(6)
      i = 0
      params.writeUint8(CHANNELS[0].bitmask, i++)   //IN3LM
      params.writeUint8(20, i++)                    //gain
      params.writeInt8(0, i++)                      //volume
      params.writeUint8(10, i++)                    //number of bins
      params.writeUint8(9, i++)                     //start bin
      params.writeUint8(70, i++)                    //stop bin
      yield call(writeBle, peripheralId, COMMANDS.WRITE_AUDIO_ADC_CONFIG, params)

      //CLOCK TODO: check if feature is supported in firmware
      params = Buffer.alloc(4)
      params.writeUint32BE((new Date().valueOf() + 1300) / 1000, 0)
      yield call(writeBle, peripheralId, COMMANDS.WRITE_CLOCK, params)

      //refresh user device list
      yield call(getDevices, null)
      yield put(ApiActions.setRegisterState("registered"))
    } catch (error) {
      yield put(ApiActions.setRegisterState("failed"))
      yield put(ApiActions.apiFailure(apiFailureFromError(error)))
    }
  } else {
    yield put(ApiActions.setRegisterState("failed"))
    yield put(ApiActions.apiFailure(registerResponse))
  }
}

export function* readLoraState(action: any) {
  const peripheral: PairedPeripheralModel = getPairedPeripheral(yield select())
  yield call(writeBle, peripheral.id, COMMANDS.READ_LORAWAN_STATE)
  yield call(writeBle, peripheral.id, COMMANDS.READ_LORAWAN_DEVEUI)
  yield call(writeBle, peripheral.id, COMMANDS.READ_LORAWAN_APPEUI)
  yield call(writeBle, peripheral.id, COMMANDS.READ_LORAWAN_APPKEY)
}

export function* configureLoRaAutomatic(action: any) {
  yield put(ApiActions.setLoRaConfigState("registeringApi"))

  const { appKey, devEUI } = action
  const hardwareId: string = getHardwareId(yield select())
  const device: DeviceModel = getDevice(yield select())
  const peripheral: PairedPeripheralModel = getPairedPeripheral(yield select())

  const requestParams = {
    lorawan_device: {
      dev_eui: devEUI,
      app_key: appKey,
    }
  }
  const response = yield guardedRequest(api.createTtnDevice, hardwareId.toString(), requestParams)
  if (response && response.ok) {
    //retrieve keys from api's TTN registration
    const ttn = new TTNModel(response.data)

    //update devEUI on device in db
    const deviceUpdateParams = {
      id: device.id,
      key: devEUI,
      hardware_id: device.hardwareId,
    }
    const updateDeviceResponse = yield guardedRequest(api.updateDevice, device.id, deviceUpdateParams)
    if (updateDeviceResponse && updateDeviceResponse.ok) {
      try {
        yield put(ApiActions.setLoRaConfigState("writingCredentials"))

        //write lora credentials to peripheral
        yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_APPEUI, APP_EUI)
        yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_DEVEUI, ttn.devEUI)
        yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_APPKEY, ttn.appKey)
        yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_STATE, BITMASK_ENABLED | BITMASK_ADAPTIVE_DATA_RATE | BITMASK_DUTY_CYCLE_LIMITATION)

        //read back from device into redux store
        yield call(readLoraState, action)

        //update device model in beep base store
        const newDevice = {
          ...device,
          devEUI,
        }
        yield put(BeepBaseActions.setDevice(newDevice))

        //refresh user device list
        yield call(getDevices, null)

        //next wizard state
        yield put(ApiActions.setLoRaConfigState("checkingConnectivity"))
      } catch (error) {
        yield put(ApiActions.setLoRaConfigState("failedToConnect"))
        yield put(ApiActions.apiFailure(apiFailureFromError(error)))
      }
    } else {
      yield put(ApiActions.setLoRaConfigState("failedToRegister"))
      yield put(ApiActions.apiFailure(updateDeviceResponse))
    }
  } else {
    yield put(ApiActions.setLoRaConfigState("failedToRegister"))
    //TODO: messages = response.data.errors.[lorawan_device.app_key]
    //      msg1 = message[0]
    //      msg2 = message[1]
    yield put(ApiActions.apiFailure(response))
  }
}

export function* configureLoRaManual(action: any) {
  yield put(ApiActions.setLoRaConfigState("registeringApi"))

  const device: DeviceModel = getDevice(yield select())

  const { devEUI, appEui, appKey } = action
  const peripheral: PairedPeripheralModel = getPairedPeripheral(yield select())

  //update devEUI on device in db
  const deviceUpdateParams = {
    id: device.id,
    key: devEUI,
    hardware_id: device.hardwareId,
  }
  const updateDeviceResponse = yield guardedRequest(api.updateDevice, device.id, deviceUpdateParams)
  if (updateDeviceResponse && updateDeviceResponse.ok) {
    try {
      yield put(ApiActions.setLoRaConfigState("writingCredentials"))

      //write lora credentials to peripheral
      yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_APPEUI, appEui)
      yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_DEVEUI, devEUI)
      yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_APPKEY, appKey)
      yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_STATE, BITMASK_ENABLED | BITMASK_ADAPTIVE_DATA_RATE | BITMASK_DUTY_CYCLE_LIMITATION)

      //read back from device into redux store
      yield call(readLoraState, action)

      //update device model in beep base store
      const newDevice = {
        ...device,
        devEUI,
      }
      yield put(BeepBaseActions.setDevice(newDevice))

      //refresh user device list
      yield call(getDevices, null)

      //next wizard state
      yield put(ApiActions.setLoRaConfigState("checkingConnectivity"))
    } catch (error) {
      yield put(ApiActions.setLoRaConfigState("failedToConnect"))
      yield put(ApiActions.apiFailure(apiFailureFromError(error)))
    }
  } else {
    yield put(ApiActions.setLoRaConfigState("failedToRegister"))
    yield put(ApiActions.apiFailure(updateDeviceResponse))
  }
}

export function* configureLoRaHeliumAutomatic(action: any) {
  yield put(ApiActions.setLoRaConfigState("registeringApi"))

  const device: DeviceModel = getDevice(yield select())
  const peripheral: PairedPeripheralModel = getPairedPeripheral(yield select())

  if (!device?.id || !peripheral?.id) {
    yield put(ApiActions.setLoRaConfigState("failedToRegister"))
    yield put(ApiActions.apiFailure({
      status: 0,
      problem: 'APP_ERROR',
      data: { message: 'No registered BEEP base or Bluetooth connection available.' },
    }))
    return
  }

  const response = yield guardedRequest(api.createHeliumDevice, device.id)
  if (response && response.ok && response.data?.dev_eui && response.data?.app_eui && response.data?.app_key) {
    const devEUI = response.data.dev_eui
    const appEui = response.data.app_eui
    const appKey = response.data.app_key

    try {
      yield put(ApiActions.setLoRaConfigState("writingCredentials"))

      yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_APPEUI, appEui)
      yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_DEVEUI, devEUI)
      yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_APPKEY, appKey)
      yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_STATE, BITMASK_ENABLED | BITMASK_ADAPTIVE_DATA_RATE | BITMASK_DUTY_CYCLE_LIMITATION)

      yield call(readLoraState, action)

      const newDevice = {
        ...device,
        devEUI,
      }
      yield put(BeepBaseActions.setDevice(newDevice))
      yield call(getDevices, null)
      yield put(ApiActions.setLoRaConfigState("checkingConnectivity"))
    } catch (error) {
      yield put(ApiActions.setLoRaConfigState("failedToConnect"))
      yield put(ApiActions.apiFailure(apiFailureFromError(error)))
    }
  } else {
    yield put(ApiActions.setLoRaConfigState("failedToRegister"))
    yield put(ApiActions.apiFailure(response))
  }
}

export function* configureLoRaCoverageCheck(action: any) {
  yield put(ApiActions.setLoRaConfigState("registeringApi"))

  const { provider }: { provider: LoRaCoverageProvider } = action
  const device: DeviceModel = getDevice(yield select())
  const peripheral: PairedPeripheralModel = getPairedPeripheral(yield select())

  if (!device?.id || !peripheral?.id) {
    yield put(ApiActions.setLoRaConfigState("failedToRegister"))
    yield put(ApiActions.apiFailure({
      status: 0,
      problem: 'APP_ERROR',
      data: { message: 'No registered BEEP base or Bluetooth connection available.' },
    }))
    return
  }

  const response = yield guardedRequest(api.createLoRaCoverageCheck, device.id, provider)
  if (response && response.ok && response.data?.dev_eui && response.data?.app_eui && response.data?.app_key) {
    const devEUI = response.data.dev_eui
    const appEui = response.data.app_eui
    const appKey = response.data.app_key

    try {
      yield put(ApiActions.setLoRaConfigState("writingCredentials"))

      yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_APPEUI, appEui)
      yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_DEVEUI, devEUI)
      yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_APPKEY, appKey)
      yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_STATE, BITMASK_ENABLED | BITMASK_ADAPTIVE_DATA_RATE | BITMASK_DUTY_CYCLE_LIMITATION)

      yield call(readLoraState, action)

      yield put(ApiActions.setLoRaConfigState("checkingConnectivity"))
    } catch (error) {
      yield put(ApiActions.setLoRaConfigState("failedToConnect"))
      yield put(ApiActions.apiFailure(apiFailureFromError(error)))
    }
  } else {
    yield put(ApiActions.setLoRaConfigState("failedToRegister"))
    yield put(ApiActions.apiFailure(response))
  }
}

export function* disableLoRa(action: any) {

  const peripheral: PairedPeripheralModel = getPairedPeripheral(yield select())

  try {
    if (!peripheral?.id) {
      throw new Error('No connected BEEP base available.')
    }

    yield call(writeBle, peripheral.id, COMMANDS.WRITE_LORAWAN_STATE, BITMASK_DISABLED | BITMASK_ADAPTIVE_DATA_RATE | BITMASK_DUTY_CYCLE_LIMITATION)

    //read back from device into redux store
    yield call(readLoraState, action)

    //next wizard state
    yield put(ApiActions.setLoRaConfigState("isDisabled"))
  } catch (error) {
    yield put(ApiActions.setLoRaConfigState("failedToConnect"))
    yield put(ApiActions.apiFailure(apiFailureFromError(error)))
  }

}

export function* initializeTemperatureSensors(action: any) {
  const { device, temperatureSensors, navigateToScreen } = action
  yield call(getSensorDefinitions, action)
  const temperatureSensorDefinitions: Array<SensorDefinitionModel> = getTemperatureSensorDefinitions(yield select())
  yield all(temperatureSensors.map((temperatureModel: any, index: number) => {
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
      return call(createSensorDefinition, { device, requestParams })
    }
  }))
  if (navigateToScreen) {
    navigate(navigateToScreen)
  }
}

export function* initializeWeightSensor(action: any) {
  const { device, weight } = action
  console.log("[ApiSagas] initializeWeightSensor", device)
  yield call(getSensorDefinitions, action)
  const weightSensorDefinitions: SensorDefinitionModel[] = getWeightSensorDefinitions(yield select())
  if (!weightSensorDefinitions.length) {
    //definition for this sensor not found in api
    const requestParams = {
      device_hardware_id: device.hardwareId,
      input_measurement_abbreviation: "w_v",
      output_measurement_abbreviation: "weight_kg",
      name: "Weight sensor",
      // offset: weight.offset,
      // multiplier: weight.multiplier,
    }
    yield call(createSensorDefinition, { device, requestParams })
  }
}

export function* getSensorDefinitions(action: any) {
  const { device } = action
  console.log("[ApiSagas] getSensorDefinitions", device)
  const response = yield guardedRequest(api.getSensorDefinitions, device.id)
  console.log("[ApiSagas] getSensorDefinitions response", response)
  if (response && response.ok) {
    const sensorDefinitions: Array<SensorDefinitionModel> = []
    response.data?.map((item: any) => sensorDefinitions.push(new SensorDefinitionModel(item)))

    //sort on updated desc
    sensorDefinitions.sort((a: SensorDefinitionModel, b: SensorDefinitionModel) => b.updatedAt.valueOf() - a.updatedAt.valueOf())

    console.log("[ApiSagas] getSensorDefinitions sensorDefinitions", sensorDefinitions)
    //store in beep base store because it belongs to the currently connected beep base
    yield put(BeepBaseActions.setSensorDefinitions(sensorDefinitions))
  } else {
    yield put(ApiActions.apiFailure(response))
  }
}

export function* createSensorDefinition(action: any) {
  const { device, requestParams } = action
  console.log("[ApiSagas] createSensorDefinition", requestParams)
  const response = yield guardedRequest(api.createSensorDefinition, requestParams)
  console.log("[ApiSagas] createSensorDefinition response", response)
  if (response && response.ok) {
    yield call(getSensorDefinitions, { device })
  } else {
    yield put(ApiActions.apiFailure(response))
  }
}

export function* updateApiSensorDefinition(action: any) {
  const { sensorDefinition } = action

  const requestParams: any = {
    device_id: sensorDefinition.deviceId,
    input_measurement_abbreviation: sensorDefinition.inputAbbreviation,
  }
  if (sensorDefinition.name != undefined) requestParams.name = sensorDefinition.name
  if (sensorDefinition.isInside != undefined) requestParams.inside = sensorDefinition.isInside
  if (sensorDefinition.offset != undefined) requestParams.offset = sensorDefinition.offset
  if (sensorDefinition.multiplier != undefined) requestParams.multiplier = sensorDefinition.multiplier
  
  const response = yield guardedRequest(api.updateSensorDefinition, sensorDefinition.id, requestParams)
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
