// Utils
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import BeepBaseActions from '@/App/Stores/BeepBase/Actions';
import { Buffer } from 'buffer';
import { EventSubscription, Linking, PermissionsAndroid, Platform, ToastAndroid } from "react-native";
import BleManager, { BleManagerDidUpdateValueForCharacteristicEvent, Peripheral } from 'react-native-ble-manager';
// import { FileSystem } from 'react-native-file-access';
// import RNFS from 'react-native-fs';
import { File, Paths } from 'expo-file-system';
import { store } from '../App';
import { ApplicationConfigParser } from '../Models/ApplicationConfigModel';
import { AteccParser } from '../Models/AteccModel';
import { AudioParser } from '../Models/AudioModel';
import { FirmwareVersionParser } from '../Models/FirmwareVersionModel';
import { HardwareVersionParser } from '../Models/HardwareVersionModel';
import { LogFileFrameModel } from '../Models/LogFileFrameModel';
import { LogFileSizeModel } from '../Models/LogFileSizeModel';
import { LoRaWanAppEUIParser } from '../Models/LoRaWanAppEUIModel';
import { LoRaWanAppKeyParser } from '../Models/LoRaWanAppKeyModel';
import { LoRaWanDeviceEUIParser } from '../Models/LoRaWanDeviceEUIModel';
import { LoRaWanStateParser } from '../Models/LoRaWanStateModel';
import { TemperatureParser } from '../Models/TemperatureModel';
import { WeightParser } from '../Models/WeightModel';
// import { BatteryParser } from '../Models/BatteryServiceModel';
import Bottleneck from 'bottleneck';
import { BatteryModel } from '../Models/BatteryModel';
import { ClockModel } from '../Models/ClockModel';
import { EraseLogFileModel } from '../Models/EraseLogFileModel';
import { ResponseModel } from '../Models/ResponseModel';
import { TiltModel } from '../Models/TiltModel';
import { getLogFileProgress, getLogFileSize } from '../Stores/BeepBase/Selectors';
import { OSLogger } from './OSLogger';

export const COMMANDS = {
  RESPONSE : 0x00,
  READ_FIRMWARE_VERSION : 0x01,
  TRIGGER_PINCODE : 0x01,
  READ_HARDWARE_VERSION : 0x02,
  READ_DS18B20_STATE : 0x03,
  WRITE_DS18B20_STATE : 0x83,
  READ_DS18B20_CONVERSION : 0x04,
  WRITE_DS18B20_CONVERSION : 0x84,
  READ_DS18B20_CONFIG : 0x05,
  BME280_CONFIG_READ : 0x06,
  BME280_CONVERSION_READ : 0x07,
  BME280_CONVERSION_START : 0x87,
  READ_BME280_I2C : 0x08,
  READ_HX711_STATE : 0x09,
  WRITE_HX711_STATE : 0x89,
  READ_HX711_CONVERSION : 0x0A,
  WRITE_HX711_CONVERSION : 0x8A,
  READ_AUDIO_ADC_CONFIG : 0x0B,
  WRITE_AUDIO_ADC_CONFIG : 0x8B,
  READ_AUDIO_ADC_CONVERSION : 0x0C,
  START_AUDIO_ADC_CONVERSION : 0x0D,
  READ_ATECC_READ_ID : 0x0E,
  READ_ATECC_I2C : 0x0F,
  READ_BUZZER_STATE : 0x10,
  WRITE_BUZZER_DEFAULT_TUNE : 0x91,
  WRITE_BUZZER_CUSTOM_TUNE : 0x92,
  READ_SQ_MIN_STATE : 0x13,
  WRITE_SQ_MIN_STATE : 0x93,
  READ_LORAWAN_STATE : 0x14,
  WRITE_LORAWAN_STATE : 0x94,
  READ_LORAWAN_DEVEUI : 0x15,
  WRITE_LORAWAN_DEVEUI : 0x95,
  READ_LORAWAN_APPEUI : 0x16,
  WRITE_LORAWAN_APPEUI : 0x96,
  READ_LORAWAN_APPKEY : 0x17,
  WRITE_LORAWAN_APPKEY : 0x97,
  WRITE_LORAWAN_TRANSMIT : 0x98,
  READ_CID_nRF_FLASH : 0x19,
  READ_nRF_ADC_CONFIG : 0x1A,
  READ_nRF_ADC_CONVERSION : 0x1B,
  WRITE_nRF_ADC_CONVERSION : 0x9B,
  READ_APPLICATION_STATE : 0x1C,
  READ_APPLICATION_CONFIG : 0x1D,
  WRITE_APPLICATION_CONFIG : 0x9D,
  READ_PINCODE : 0x1E,
  WRITE_PINCODE : 0x9E,
  READ_BOOT_COUNT : 0x1F,
  READ_MX_FLASH : 0x20,
  ERASE_MX_FLASH : 0x21,
  SIZE_MX_FLASH : 0x22,
  ALARM_CONFIG_READ : 0x23,
  ALARM_CONFIG_WRITE : 0xA3,
  ALARM_STATUS_READ : 0x24,
  READ_CLOCK : 0x25,
  WRITE_CLOCK : 0xA5,
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const ANDROID_TRANSFER_MTU = 512;
export const BLUETOOTH_ENABLE_REQUIRED_MESSAGE = "Bluetooth is off. Turn Bluetooth on in Android Quick Settings, then try again."

export type BluetoothState = 
"off" |                 // Bluetooth is turned off
"pairedConnected" |     // Bluetooth is on and all paired peripherals are connected
"pairedNotConnected" |  // Bluetooth is on and not all paired peripherals are connected
"noPaired"              // Bluetooth is on and there are no paired peripherals

export const BLE_NAME_PREFIX = "BEEPBASE-"
export const BEEP_SERVICE = "be4768a1-719f-4bad-5040-c6ebc5f8c31b"
export const CONTROL_POINT_CHARACTERISTIC = "000068b0-0000-1000-8000-00805f9b34fb"
export const CONTROL_POINT_CHARACTERISTIC_IOS = "68b0"
export const LOG_FILE_CHARACTERISTIC = "be4768a3-719f-4bad-5040-c6ebc5f8c31b"
export const BATTERY_SERVICE = "0000180f-0000-1000-8000-00805f9b34fb"
export const BATTERY_LEVEL_CHARACTERISTIC = "00002a19-0000-1000-8000-00805f9b34fb"

type LogDownloadSession = {
  peripheralId: string
  deviceId?: string
  file: File
  fileName: string
  fileNumber: number
  lastFrame: number
}

export default class BleHelpers {
  static lastFrame: number = -1
  static LOG_FILE_NAME = "BeepBaseLogFile"
  static LOG_FILE_NUMBER = 0
  static LOG_FILE = undefined as File | undefined
  static activeLogPeripheralId: string | undefined = undefined
  static logDownloadSessions: Map<string, LogDownloadSession> = new Map()
  static cancelledLogPeripheralIds: Set<string> = new Set()
  static stoppedLogNotificationPeripheralIds: Set<string> = new Set()

  static BleManagerDidUpdateValueForCharacteristicSubscription: EventSubscription | undefined

  static enableBluetooth() {
    OSLogger.log("[BLE] Enabling Bluetooth...")
    store.dispatch(BeepBaseActions.bleFailure(undefined))
    switch (Platform.OS) {
      case "ios":
        OSLogger.log("[BLE] iOS: Opening Bluetooth settings")
        return new Promise<void>((resolve) => {
          Linking.openURL('App-Prefs:Bluetooth')
          resolve()
        })
        // Linking.openURL('App-Prefs:Bluetooth')    //TODO: this is for iOS 10+   //TODO2:check if this gets approved by Apple
        // break;
    
      case "android":
        OSLogger.log("[BLE] Android: Enabling Bluetooth via BleManager")
        return  BleManager.enableBluetooth()
        .then(() => {
          OSLogger.log("[BLE] Android: Bluetooth enabled successfully")
        })
        .catch((error) => {
          const message = "The user did not enable bluetooth. Error: " + error
          OSLogger.log("[BLE] ERROR: " + message)
          store.dispatch(BeepBaseActions.bleFailure(message))
        });
    }
  }

  static async ensureBluetoothEnabled(context = "BLE") {
    if (Platform.OS !== "android") {
      return true
    }

    const hasPermission = await BleHelpers.ensureConnectPermission()
    if (!hasPermission) {
      return false
    }

    const state = await BleManager.checkState()
    OSLogger.log(`[BLE] ${context}: Bluetooth adapter state is ${state}`)

    if (state === "on") {
      return true
    }

    try {
      await BleManager.enableBluetooth()
      const nextState = await BleManager.checkState()
      OSLogger.log(`[BLE] ${context}: Bluetooth adapter state after enable request is ${nextState}`)

      if (nextState === "on") {
        return true
      }
    } catch (error) {
      OSLogger.log(`[BLE] ${context}: Bluetooth enable request failed or was blocked by Android: ${error}`)
    }

    store.dispatch(BeepBaseActions.bleFailure(BLUETOOTH_ENABLE_REQUIRED_MESSAGE))
    return false
  }

  static getBluetoothState(bleState: string, pairedPeripherals: Array<PairedPeripheralModel>) {
    OSLogger.log(`[BLE] Getting Bluetooth state - BLE state: ${bleState}, Paired peripherals: ${pairedPeripherals?.length || 0}`)
    if (bleState == "on") {
      if (pairedPeripherals && pairedPeripherals.length > 0) {
        if (pairedPeripherals.every(p => p.isConnected == true)) {
          OSLogger.log("[BLE] State: pairedConnected")
          return "pairedConnected"
        }
        OSLogger.log("[BLE] State: pairedNotConnected")
        return "pairedNotConnected"
      }
      OSLogger.log("[BLE] State: noPaired")
      return "noPaired"
    }
    OSLogger.log("[BLE] State: off")
    return "off"
  }

  static async init() {
    OSLogger.log("[BLE] Initializing BleManager...");
    return BleManager.start({
      showAlert: true,
      restoreIdentifierKey: "nl.beep.BEEP.restoreIdentifierKey",
      queueIdentifierKey: "nl.beep.BEEP.queueIdentifierKey",
    }).then(async () => {
      OSLogger.log("[BLE] BleManager started successfully");
      BleHelpers.ensureCharacteristicListener()
      return BleHelpers.ensureScanPermissions()
    })
    .catch(error => {
      OSLogger.log(`[BLE] ERROR: Failed to start BleManager: ${error}`);
      throw error;
    })
  }

  static ensureCharacteristicListener() {
    if (BleHelpers.BleManagerDidUpdateValueForCharacteristicSubscription) {
      return
    }

    BleHelpers.BleManagerDidUpdateValueForCharacteristicSubscription = BleManager.onDidUpdateValueForCharacteristic(BleHelpers.onValueForCharacteristic)
    OSLogger.log("[BLE] Characteristic update listener registered")
  }

  static async ensureScanPermissions() {
    if (Platform.OS !== 'android') {
      return true
    }

    if (Platform.Version >= 31) {
      OSLogger.log("[BLE] Android 12+: Requesting Bluetooth scan/connect permissions...");
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ])

      const hasScan = results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED
      const hasConnect = results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED

      OSLogger.log(`[BLE] Permission BLUETOOTH_SCAN granted: ${hasScan}`)
      OSLogger.log(`[BLE] Permission BLUETOOTH_CONNECT granted: ${hasConnect}`)

      if (!(hasScan && hasConnect)) {
        const message = "Nearby devices permission is required to scan for BEEP bases."
        OSLogger.log(`[BLE] ${message}`)
        store.dispatch(BeepBaseActions.bleFailure(message))
        return false
      }

      return true
    }

    if (Platform.Version >= 23) {
      OSLogger.log("[BLE] Android 6-11: Checking location permission for BLE scan...");
      const hasLocation = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)

      if (hasLocation) {
        OSLogger.log("[BLE] Permission ACCESS_FINE_LOCATION is OK");
        return true
      }

      OSLogger.log("[BLE] Requesting ACCESS_FINE_LOCATION permission...");
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
      const granted = result === PermissionsAndroid.RESULTS.GRANTED
      OSLogger.log(`[BLE] Permission ACCESS_FINE_LOCATION granted: ${granted}`)

      if (!granted) {
        const message = "Location permission is required to scan for BEEP bases on this Android version."
        OSLogger.log(`[BLE] ${message}`)
        store.dispatch(BeepBaseActions.bleFailure(message))
        return false
      }
    }

    return true
  }

  static async ensureConnectPermission() {
    if (Platform.OS !== 'android' || Platform.Version < 31) {
      return true
    }

    const hasConnect = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT)
    if (hasConnect) {
      return true
    }

    OSLogger.log("[BLE] Android 12+: Requesting Bluetooth connect permission...")
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT)
    const granted = result === PermissionsAndroid.RESULTS.GRANTED
    if (!granted) {
      const message = "Nearby devices permission is required to connect to BEEP bases."
      OSLogger.log(`[BLE] ${message}`)
      store.dispatch(BeepBaseActions.bleFailure(message))
    }
    return granted
  }

  static async pair(peripheralId: string) {
    const hasPermission = await BleHelpers.ensureConnectPermission()
    if (!hasPermission) {
      throw new Error("Nearby devices permission is required to pair with BEEP bases.")
    }

    return BleManager.createBond(peripheralId).then(() => {
      OSLogger.log(`[BLE] Successfully bonded with ${peripheralId}`);
    }).catch(() => {
      OSLogger.log(`[BLE] Failed to bond with ${peripheralId}`);
    })
  }

  static async connectPeripheral(peripheralId: string) {
    OSLogger.log(`[BLE] Attempting to connect to peripheral: ${peripheralId}`);
    store.dispatch(BeepBaseActions.bleFailure(undefined));
    const hasPermission = await BleHelpers.ensureConnectPermission()
    if (!hasPermission) {
      throw new Error("Nearby devices permission is required to connect to BEEP bases.")
    }

    return BleManager.isPeripheralConnected(peripheralId).then(isConnected => {
      if (isConnected) {
        OSLogger.log(`[BLE] Peripheral ${peripheralId} is already connected, retrieving services...`);
        return BleHelpers.retrieveServices(peripheralId);
      }

      OSLogger.log(`[BLE] Peripheral ${peripheralId} is not connected, starting connection process...`);
      if (Platform.OS === 'android') {
        this.refreshDeviceCache(peripheralId).catch(error => {
          OSLogger.log(`[BLE] Device cache refresh failed for ${peripheralId}: ${error}`)
        });
      }

      return BleManager.connect(peripheralId)
        .then(async () => {
          OSLogger.log(`[BLE] Successfully connected to ${peripheralId}`);
          // // BleLogger.logPeripheral(peripheral);
          OSLogger.log(`[BLE] Waiting 500ms before pairing...`);
          return delay(500);
        })
        .then(() => {
          OSLogger.log(`[BLE] Attempting to pair with ${peripheralId}`);
          return this.pair(peripheralId);
        })
        .then(() => {
          OSLogger.log(`[BLE] Successfully paired with ${peripheralId}, retrieving services...`);
          return BleHelpers.retrieveServices(peripheralId);
        })
        .catch(error => {
          const errorMessage = `[BLE] ERROR: Failed during connection process for ${peripheralId}: ${error}`;
          OSLogger.log(errorMessage);
          store.dispatch(BeepBaseActions.bleFailure(errorMessage));
          BleManager.disconnect(peripheralId).catch(disconnectError => {
            OSLogger.log(`[BLE] ERROR: Failed to disconnect after connection error: ${disconnectError}`);
          });
          throw error;
        });
    });
  }

  static scanPeripheralByName(startsWith: string): Promise<Peripheral> {
    OSLogger.log(`[BLE] Starting scan for peripherals with name starting with: ${startsWith}`);
    store.dispatch(BeepBaseActions.bleFailure(undefined))
    const TIME_OUT = 15   //seconds
    let isScanning = false

    return new Promise<Peripheral>((resolve, reject) => {
      let settled = false
      const cleanup = () => {
        bleManagerDiscoverPeripheralSubscription?.remove()
        bleManagerStopScanSubscription?.remove()
      }
      const resolveOnce = (peripheral: Peripheral) => {
        if (settled) return
        settled = true
        isScanning = false
        cleanup()
        BleManager.stopScan().catch(error => OSLogger.log(`[BLE] stopScan after match failed: ${error}`))
        resolve(peripheral)
      }
      const rejectOnce = (error: Error) => {
        if (settled) return
        settled = true
        isScanning = false
        cleanup()
        reject(error)
      }

      const bleManagerDiscoverPeripheralSubscription = BleManager.onDiscoverPeripheral((peripheral: Peripheral) => {
        OSLogger.log(`[BLE] Discovered peripheral - ID: ${peripheral.id}, Name: ${peripheral.name}, RSSI: ${peripheral.rssi}, Connectable: ${peripheral.advertising?.isConnectable}`);
        // BleLogger.logPeripheral(peripheral);
        if (peripheral.advertising?.isConnectable) {
          if (!peripheral.name) {
            peripheral.name = peripheral.advertising?.localName
            OSLogger.log(`[BLE] Using localName for peripheral: ${peripheral.name}`);
          }
          if (peripheral.name?.startsWith(startsWith) || peripheral.advertising?.localName?.startsWith(startsWith)) {
            OSLogger.log(`[BLE] Found matching peripheral: ${peripheral.name}, localName: ${peripheral.advertising?.localName}), ID: ${peripheral.id}`);
            resolveOnce(peripheral)
          }
        }
      })

      const bleManagerStopScanSubscription = BleManager.onStopScan(() => {
        OSLogger.log(`[BLE] Scan stopped. Was scanning: ${isScanning}`);
        if (isScanning) {
          //if still scanning at this point no device matching filter was found
          const errorMessage = "[BLE] No matching device found during scan";
          OSLogger.log(errorMessage);
          rejectOnce(new Error(errorMessage))
        }
        isScanning = false
      })

      if (Platform.OS === "android") {
        BleHelpers.ensureScanPermissions().then((hasPermissions) => {
          if (!hasPermissions) {
            rejectOnce(new Error("Nearby devices permission is required to scan for BEEP bases."))
            return
          }

          BleHelpers.ensureBluetoothEnabled("scanUntilPeripheral").then((isBluetoothEnabled) => {
            if (!isBluetoothEnabled) {
              isScanning = false
              rejectOnce(new Error(BLUETOOTH_ENABLE_REQUIRED_MESSAGE))
              return
            }

            OSLogger.log("[BLE] Bluetooth enabled, starting scan...");
            isScanning = true
            //TODO: check why scanning for specific serviceUUIDs does not find devices
            // BleManager.scan({ serviceUUIDs: [BEEP_SERVICE], seconds: TIME_OUT/*, allowDuplicates: false*/ }).then((results) => {
            BleManager.scan({ serviceUUIDs: [], seconds: TIME_OUT, allowDuplicates: false }).then((results) => {
              OSLogger.log(`[BLE] Scanning started with ${TIME_OUT}s timeout...`)
            }).catch(err => {
              isScanning = false
              const errorMessage = `[BLE] ERROR: Scan failed: ${err}`;
              OSLogger.log(errorMessage);
              store.dispatch(BeepBaseActions.bleFailure(errorMessage))
              rejectOnce(err instanceof Error ? err : new Error(String(err)))
            })
          })
          .catch((error) => {
            isScanning = false
            const errorMessage = `[BLE] ERROR: Bluetooth readiness check failed: ${error}`;
            OSLogger.log(errorMessage);
            store.dispatch(BeepBaseActions.bleFailure(errorMessage))
            rejectOnce(error instanceof Error ? error : new Error(String(error)))
          });
        })
        .catch((error) => {
          rejectOnce(error instanceof Error ? error : new Error(String(error)))
        })
      } else if (Platform.OS === "ios") {
        OSLogger.log("[BLE] starting scan...");
        isScanning = true
        //TODO: check why scanning for specific serviceUUIDs does not find devices
        // BleManager.scan({ serviceUUIDs: [BEEP_SERVICE], seconds: TIME_OUT/*, allowDuplicates: false*/ }).then((results) => {
        BleManager.scan({ serviceUUIDs: [], seconds: TIME_OUT, allowDuplicates: false }).then((results) => {
          OSLogger.log(`[BLE] Scanning started with ${TIME_OUT}s timeout...`)
        }).catch(err => {
          isScanning = false
          const errorMessage = `[BLE] ERROR: Scan failed: ${err}`;
          OSLogger.log(errorMessage);
          store.dispatch(BeepBaseActions.bleFailure(errorMessage))
          rejectOnce(err instanceof Error ? err : new Error(String(err)))
        })
      }
    })
  }

  static onValueForCharacteristic({ value, peripheral, characteristic, service }: BleManagerDidUpdateValueForCharacteristicEvent) {
    const peripheralId = peripheral
    switch (characteristic.toLowerCase()) {
      case CONTROL_POINT_CHARACTERISTIC:
      case CONTROL_POINT_CHARACTERISTIC_IOS:
        OSLogger.log(`[BLE] onValueForCharacteristic - Peripheral: ${peripheralId}, Characteristic: ${characteristic.toLowerCase()}, Value: ${BleHelpers.byteToHexString(value)}`);
        // BleLogger.logPeripheral(peripheral);
        BleHelpers.handleControlPointCharacteristic({ value, peripheralId })
        break

      case LOG_FILE_CHARACTERISTIC:
        // Skip detailed logging during log file download for better performance
        BleHelpers.handleLogFileCharacteristic({ value, peripheralId })
        break
        
      default:
        OSLogger.log(`[BLE] onValueForCharacteristic - Unhandled characteristic: ${characteristic.toLowerCase()}`);
    }
  }

  static finalizeLogDownloadFromResponse(peripheralId?: string) {
    const state = store.getState() as any
    const logFileSize = getLogFileSize(state, peripheralId)
    const logFileProgress = getLogFileProgress(state, peripheralId)

    if (!logFileSize) {
      store.dispatch(BeepBaseActions.setLogDownloadError(`Log download finished before log size was known${peripheralId ? ` for ${peripheralId}` : ""}.`, peripheralId))
      store.dispatch(BeepBaseActions.bleFailure(`Log download finished before log size was known${peripheralId ? ` for ${peripheralId}` : ""}.`))
      return
    }

    const session = BleHelpers.getLogSession(peripheralId)
    const expectedBytes = logFileSize.value()
    const downloadedBytes = logFileProgress ?? 0
    const fileHexChars = session?.file?.size ?? BleHelpers.LOG_FILE?.size ?? 0
    const fileBytes = Math.floor(fileHexChars / 2)

    if (downloadedBytes >= expectedBytes || fileBytes >= expectedBytes) {
      store.dispatch(BeepBaseActions.setLogFileProgress(expectedBytes, peripheralId))
      return
    }

    const message = `Log download ended early${peripheralId ? ` for ${peripheralId}` : ""}: received ${downloadedBytes} of ${expectedBytes} bytes.`
    OSLogger.log(`[BLE] ERROR: ${message}`)
    store.dispatch(BeepBaseActions.setLogDownloadError(message, peripheralId))
    store.dispatch(BeepBaseActions.bleFailure(message))
  }
  
  static handleControlPointCharacteristic({ value, peripheralId }: { value: number[] | Uint8Array, peripheralId: string }) {
    try {
      // Convert value to Buffer - handle both array-like objects and arrays
      const valueArray = Array.isArray(value) ? value : Object.values(value)
      const buffer: Buffer = Buffer.from(valueArray)
      const command = buffer.readInt8()
      const data: Buffer = buffer.subarray(1)
      
      OSLogger.log(`[BLE] handleControlPointCharacteristic - Command: 0x${command.toString(16)}, Data: ${data.toString('hex')}`);
      
      if (data.length) {
      let model
      switch (command) {
        case COMMANDS.RESPONSE:
          OSLogger.log(`[BLE] Response data: ${data.toString('hex')}`)
          const response = ResponseModel.parse(data)
          if (response.code > 0) {
            switch (response.command) {
              case COMMANDS.READ_MX_FLASH:
                  //00 00 0E 0F
		                  if (response.code == 0x00E0F) {
		                    OSLogger.log("Download ready, received response code 0x00E0F")
		                    BleHelpers.finalizeLogDownloadFromResponse(peripheralId)
		                  }
                break;

              case COMMANDS.ERASE_MX_FLASH:
                //fatfs mode error code or full mode timeout
                const eraseLogFileModel = EraseLogFileModel.parse(data)
                store.dispatch(BeepBaseActions.setLogDownloadError(eraseLogFileModel.toString(), peripheralId))
                store.dispatch(BeepBaseActions.bleFailure(eraseLogFileModel.toString()))
                break;

              default:
                if (response.code == 8) {
                  //invalid state, retry
                  if (BleHelpers.lastWrite != undefined) {
                    const { peripheralId, command, params } = BleHelpers.lastWrite
                    //only retry same command that failed
                    if (peripheralId && command && command == response.command) {
                      //call write again (scheduled)
                      // BleHelpers.write(peripheralId, command, params).finally(() => {
                        //clear retry info (max 1 retry)
                        BleHelpers.lastWrite = undefined
                      // })
                    }
                  }
                }
                store.dispatch(BeepBaseActions.bleFailure(response.toString()))
                break;
            }
          } else {
            //NRF_SUCCESS
            switch (response.command) {
	              case COMMANDS.READ_MX_FLASH:
	                OSLogger.log("Download ready, received NRF_SUCCESS")
		                BleHelpers.finalizeLogDownloadFromResponse(peripheralId)
	                break

              case COMMANDS.ERASE_MX_FLASH:
                store.dispatch(BeepBaseActions.setEraseLogFileProgress(1, peripheralId))
              break
            }
          }
          break

        case COMMANDS.READ_FIRMWARE_VERSION:
          model = new FirmwareVersionParser({ data }).parse()
          OSLogger.log(`[BLE] Parsed Firmware Version: ${model.toString()}`);
          store.dispatch(BeepBaseActions.setFirmwareVersion(model))
          break

        case COMMANDS.READ_HARDWARE_VERSION:
          model = new HardwareVersionParser({ data }).parse()
          OSLogger.log(`[BLE] Parsed Hardware Version: ${model.toString()}`);
          store.dispatch(BeepBaseActions.setHardwareVersion(model))
          break

        //Application config
        case COMMANDS.READ_APPLICATION_CONFIG:
          model = new ApplicationConfigParser({ data }).parse()
          OSLogger.log(`[BLE] Parsed Application Config: ${JSON.stringify(model)}`);
          store.dispatch(BeepBaseActions.setApplicationConfig(model))
          break

        //Tilt sensor
        case COMMANDS.READ_SQ_MIN_STATE:
          model = TiltModel.parse(data)
          OSLogger.log(`[BLE] Parsed Tilt: ${JSON.stringify(model)}`);
          store.dispatch(BeepBaseActions.setTilt(model))
          break

        //LoRaWan state
        case COMMANDS.READ_LORAWAN_STATE:
          model = new LoRaWanStateParser({ data }).parse()
          OSLogger.log(`[BLE] Parsed LoRaWan State: ${JSON.stringify(model)}`);
          store.dispatch(BeepBaseActions.setLoRaWanState(model))
          break

        //LoRaWan device EUI
        case COMMANDS.READ_LORAWAN_DEVEUI:
          model = new LoRaWanDeviceEUIParser({ data }).parse()
	          OSLogger.log(`[BLE] Parsed LoRaWan Device EUI: ${model?.toString()}`);
          store.dispatch(BeepBaseActions.setLoRaWanDeviceEUI(model))
          break

        //LoRaWan app EUI
        case COMMANDS.READ_LORAWAN_APPEUI:
          model = new LoRaWanAppEUIParser({ data }).parse()
	          OSLogger.log(`[BLE] Parsed LoRaWan App EUI: ${model?.toString()}`);
          store.dispatch(BeepBaseActions.setLoRaWanAppEUI(model))
          break

        //LoRaWan app key
        case COMMANDS.READ_LORAWAN_APPKEY:
          model = new LoRaWanAppKeyParser({ data }).parse()
	          OSLogger.log(`[BLE] Parsed LoRaWan App Key: ${model?.toString()}`);
          store.dispatch(BeepBaseActions.setLoRaWanAppKey(model))
          break

        //temperature sensor
        case COMMANDS.READ_DS18B20_CONVERSION:
          const models = new TemperatureParser({ data }).parse()
          OSLogger.log(`[BLE] Parsed Temperature: ${JSON.stringify(models)}`);
          store.dispatch(BeepBaseActions.setTemperatures(models))
          break

        //weight sensor
        case COMMANDS.READ_HX711_CONVERSION:
          model = new WeightParser({ data }).parse()
          OSLogger.log(`[BLE] Parsed Weight: ${JSON.stringify(model)}`);
          store.dispatch(BeepBaseActions.setWeight(model))
          break

        //audio sensor
        case COMMANDS.READ_AUDIO_ADC_CONFIG:
          model = new AudioParser({ data }).parse()
          OSLogger.log(`[BLE] Parsed Audio: ${JSON.stringify(model)}`);
          store.dispatch(BeepBaseActions.setAudio(model))
          break

        //hardware id
        case COMMANDS.READ_ATECC_READ_ID:
          model = new AteccParser({ data }).parse()
          OSLogger.log(`[BLE] Parsed Hardware ID: ${model.toString()}`);
          store.dispatch(BeepBaseActions.setHardwareId(model))
          break

        //flash log file
        case COMMANDS.READ_MX_FLASH:
          OSLogger.log(`[BLE] Flash data: ${data.toString('hex')}`)
          break

        //flash log file size
        case COMMANDS.SIZE_MX_FLASH:
          model = LogFileSizeModel.parse(data)
          OSLogger.log(`[BLE] Parsed Log File Size: ${JSON.stringify(model)}`);
          store.dispatch(BeepBaseActions.setLogDownloadError(undefined, peripheralId))
          store.dispatch(BeepBaseActions.setLogFileSize(model, peripheralId))
          break

        //erase flash log file
        case COMMANDS.ERASE_MX_FLASH:
          OSLogger.log(`[BLE] Erase Log File command processed`);
          // model = EraseLogFileModel.parse(data)
          // store.dispatch(BeepBaseActions.setEraseLogFileProgress(0))
          break

        //clock
        case COMMANDS.READ_CLOCK:
          model = ClockModel.parse(data)
          OSLogger.log(`[BLE] Parsed Clock: ${JSON.stringify(model)}`);
          store.dispatch(BeepBaseActions.setClock(model))
          break

        //battery (old mode, not using Battery Service)
        case COMMANDS.READ_nRF_ADC_CONVERSION:
          model = BatteryModel.parse(data)
          OSLogger.log(`[BLE] Parsed Battery: ${JSON.stringify(model)}`);
          store.dispatch(BeepBaseActions.setBattery(model))
          break
      }
    }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const stack = error instanceof Error ? error.stack : undefined
      OSLogger.log(`[BLE] ERROR in handleControlPointCharacteristic: ${message}`)
      if (stack) {
        OSLogger.log(`[BLE] ERROR stack: ${stack}`)
      }
      store.dispatch(BeepBaseActions.bleFailure(`BLE data parsing error: ${message}`))
    }
  }

  static getFallbackLogPeripheralId() {
    const state = store.getState() as any
    return state?.beepBase?.pairedPeripheral?.id
  }

  static sanitizeLogFilePart(value: string) {
    return value.replace(/[^a-zA-Z0-9_-]/g, "_")
  }

  static syncLegacyLogFileState(session: LogDownloadSession) {
    BleHelpers.activeLogPeripheralId = session.peripheralId
    BleHelpers.lastFrame = session.lastFrame
    BleHelpers.LOG_FILE_NAME = session.fileName
    BleHelpers.LOG_FILE_NUMBER = session.fileNumber
    BleHelpers.LOG_FILE = session.file
  }

  static getLogSession(peripheralId?: string) {
    const id = peripheralId ?? BleHelpers.activeLogPeripheralId ?? BleHelpers.getFallbackLogPeripheralId()
    return id ? BleHelpers.logDownloadSessions.get(id) : undefined
  }

  static getLogFile(peripheralId?: string) {
    return BleHelpers.getLogSession(peripheralId)?.file ?? BleHelpers.LOG_FILE
  }

  static getLogFileName(peripheralId?: string) {
    return BleHelpers.getLogSession(peripheralId)?.fileName ?? BleHelpers.LOG_FILE_NAME
  }

  static updateLogFilePath(peripheralId?: string) {
    const id = peripheralId ?? BleHelpers.getFallbackLogPeripheralId() ?? "unknown"
    const safePeripheralId = BleHelpers.sanitizeLogFilePart(id)
    const fileName = `BeepBaseLogFile_${safePeripheralId}_${BleHelpers.LOG_FILE_NUMBER}.txt`
    BleHelpers.LOG_FILE = new File(Paths.cache, fileName)
    BleHelpers.LOG_FILE_NAME = fileName
  }

  static initLogFile(peripheralId?: string, deviceId?: string) {
    const id = peripheralId ?? BleHelpers.getFallbackLogPeripheralId()
    if (!id) {
      OSLogger.log("[BLE] ERROR: Cannot initialize log file without peripheral id")
      return undefined
    }

    const safePeripheralId = BleHelpers.sanitizeLogFilePart(id)
    let fileNumber = BleHelpers.LOG_FILE_NUMBER
    let fileName = `BeepBaseLogFile_${safePeripheralId}_${fileNumber}.txt`
    let file = new File(Paths.cache, fileName)

    // Keep old log files and increment the file number instead of deleting.
    while (file.exists) {
      fileNumber += 1
      fileName = `BeepBaseLogFile_${safePeripheralId}_${fileNumber}.txt`
      file = new File(Paths.cache, fileName)
    }

    file.create({ intermediates: true, overwrite: true })
    const session: LogDownloadSession = {
      peripheralId: id,
      deviceId,
      file,
      fileName,
      fileNumber,
      lastFrame: -1,
    }
    BleHelpers.logDownloadSessions.set(id, session)
    BleHelpers.syncLegacyLogFileState(session)
    return session
  }

  static exportLogFile() {
    // TODO: migrate to expo-file-system
    // FileSystem.cpExternal(BleHelpers.LOG_FILE_PATH, BleHelpers.LOG_FILE_NAME, "downloads").catch(error => {
    //   OSLogger.log(`Error copying to SD card: ${error}`)
    // })
  }

  static handleLogFileCharacteristic({ value, peripheralId }: { value: number[] | Uint8Array, peripheralId: string }) {
    if (BleHelpers.cancelledLogPeripheralIds.has(peripheralId)) {
      return
    }

    try {
      // Convert value to Buffer - handle both array-like objects and arrays
      const valueArray = Array.isArray(value) ? value : Object.values(value)
      const buffer: Buffer = Buffer.from(valueArray)
      const model = LogFileFrameModel.parse(buffer)
      if (model) {
        let session = BleHelpers.getLogSession(peripheralId)
        if (!session) {
          OSLogger.log(`[BLE] Log frame received for ${peripheralId} before a session was initialized; creating one now.`)
          session = BleHelpers.initLogFile(peripheralId)
        }

        if (!session) {
          return
        }

        //skip frames with equal frame numbers, see https://github.com/innoveit/react-native-ble-manager/issues/577
        if (model.frame != session.lastFrame) {
          if (__DEV__) {
            OSLogger.log(`[BLE] Processing frame ${model.frame} for ${peripheralId}`);
          }

          store.dispatch(BeepBaseActions.addLogFileFrame(model, peripheralId))
          session.lastFrame = model.frame
          BleHelpers.syncLegacyLogFileState(session)
          if (session.file) {
            const fileHandle = session.file.open()
            try {
              fileHandle.offset = fileHandle.size ?? 0;
              const hexString = model.data.toString("hex")
              const bytes = new TextEncoder().encode(hexString);
              fileHandle.writeBytes(bytes);
            } catch (err) {
              const message = `Error writing log file frame for ${peripheralId}: ${err}`
              OSLogger.log(`[BLE] ERROR ${message}`);
              store.dispatch(BeepBaseActions.setLogDownloadError(message, peripheralId))
            } finally {
              fileHandle.close()
            }
          }
          // OSLogger.log(`Log file size: ${BleHelpers.LOG_FILE?.size}`);
        } else if (__DEV__) {
          // Only log duplicates in debug mode
          OSLogger.log(`[BLE] Duplicate log file frame received for ${peripheralId}: lastFrame = ${session.lastFrame}, model.frame = ${model.frame}`);
        }
      } else {
        OSLogger.log(`[BLE] ERROR: Failed to parse log file frame`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const stack = error instanceof Error ? error.stack : undefined
      OSLogger.log(`[BLE] ERROR in handleLogFileCharacteristic: ${message}`)
      store.dispatch(BeepBaseActions.setLogDownloadError(message, peripheralId))
      if (stack) {
        OSLogger.log(`[BLE] ERROR stack: ${stack}`)
      }
    }
  }

  static async prepareLogDownload(peripheralId: string) {
    if (!BleHelpers.stoppedLogNotificationPeripheralIds.has(peripheralId)) {
      BleHelpers.cancelledLogPeripheralIds.delete(peripheralId)
      return
    }

    await BleManager.startNotification(peripheralId, BEEP_SERVICE, LOG_FILE_CHARACTERISTIC)
    BleHelpers.stoppedLogNotificationPeripheralIds.delete(peripheralId)
    BleHelpers.cancelledLogPeripheralIds.delete(peripheralId)
    OSLogger.log(`[BLE] Log notification restored for ${peripheralId}`)
  }

  static async cancelLogDownload(peripheralId: string) {
    if (BleHelpers.cancelledLogPeripheralIds.has(peripheralId) && BleHelpers.stoppedLogNotificationPeripheralIds.has(peripheralId)) {
      return
    }

    BleHelpers.cancelledLogPeripheralIds.add(peripheralId)
    BleHelpers.logDownloadSessions.delete(peripheralId)

    try {
      await BleManager.stopNotification(peripheralId, BEEP_SERVICE, LOG_FILE_CHARACTERISTIC)
      BleHelpers.stoppedLogNotificationPeripheralIds.add(peripheralId)
      OSLogger.log(`[BLE] Log notification stopped for ${peripheralId}`)
    } catch (error) {
      OSLogger.log(`[BLE] Failed to stop log notification for ${peripheralId}; disconnecting to stop the firmware transfer: ${error}`)
      await BleManager.disconnect(peripheralId, true).catch(disconnectError => {
        OSLogger.log(`[BLE] Failed to disconnect ${peripheralId} while cancelling log transfer: ${disconnectError}`)
      })
      BleHelpers.stoppedLogNotificationPeripheralIds.add(peripheralId)
    }

    if (BleHelpers.activeLogPeripheralId === peripheralId) {
      BleHelpers.activeLogPeripheralId = undefined
      BleHelpers.LOG_FILE = undefined
      BleHelpers.lastFrame = -1
    }
  }

  static async retrieveServices(peripheralId: string) {
    OSLogger.log(`[BLE] Retrieving services for peripheral: ${peripheralId}`);
    store.dispatch(BeepBaseActions.bleFailure(undefined))
    const hasPermission = await BleHelpers.ensureConnectPermission()
    if (!hasPermission) {
      throw new Error("Nearby devices permission is required to discover BEEP services.")
    }

    return delay(500).then(() => {
      OSLogger.log("[BLE] Calling BleManager.retrieveServices...");
      BleHelpers.ensureCharacteristicListener()
      return BleManager.retrieveServices(peripheralId).then(async (peripheralInfo) => {
        OSLogger.log(`[BLE] Services retrieved successfully for ${peripheralId}. Service count: ${peripheralInfo?.services?.length || 0}`);
        if (Platform.OS === 'android') {
          try {
            const mtu = await BleManager.requestMTU(peripheralId, ANDROID_TRANSFER_MTU)
            OSLogger.log(`[BLE] Negotiated MTU ${mtu} for ${peripheralId} (requested ${ANDROID_TRANSFER_MTU})`)
          } catch (error) {
            OSLogger.log(`[BLE] MTU negotiation failed for ${peripheralId}; continuing with Android default: ${error}`)
          }
        }
        return BleManager.startNotification(peripheralId, BEEP_SERVICE, CONTROL_POINT_CHARACTERISTIC).then(() => {
          OSLogger.log(`[BLE] Notification subscribed for CONTROL POINT characteristic on ${peripheralId}`);
        }).then(() => {
          OSLogger.log(`[BLE] Starting notification for LOG FILE characteristic on ${peripheralId}...`);
          return BleManager.startNotification(peripheralId, BEEP_SERVICE, LOG_FILE_CHARACTERISTIC).then(() => {
            OSLogger.log(`[BLE] Notification subscribed for LOG FILE characteristic on ${peripheralId}`);
            BleHelpers.cancelledLogPeripheralIds.delete(peripheralId)
            BleHelpers.stoppedLogNotificationPeripheralIds.delete(peripheralId)
            return peripheralInfo
          })
        })
      })
      .catch((error) => {
        const message = `[BLE] ERROR: Failed to retrieve services of ${peripheralId}. Error: ${error}`
        console.log(message)
        store.dispatch(BeepBaseActions.bleFailure(message))
        throw error
      })
    })
  }

  static async isConnected(peripheralId: string) {
    OSLogger.log(`[BLE] Checking connection status for ${peripheralId}`);
    const hasPermission = await BleHelpers.ensureConnectPermission()
    if (!hasPermission) {
      return false
    }
    return BleManager.isPeripheralConnected(peripheralId, [BEEP_SERVICE])
      .then(isConnected => {
        OSLogger.log(`[BLE] Peripheral ${peripheralId} is ${isConnected ? 'connected' : 'not connected'}`);
        return isConnected;
      })
  }

  static async readRSSI(peripheralId: string) {
    OSLogger.log(`[BLE] Reading RSSI for ${peripheralId}`);
    const hasPermission = await BleHelpers.ensureConnectPermission()
    if (!hasPermission) {
      return undefined
    }
    return BleManager.isPeripheralConnected(peripheralId, []).then(isConnected => {
      if (isConnected) {
        OSLogger.log(`[BLE] Peripheral connected, reading RSSI...`);
        return BleManager.readRSSI(peripheralId)
          .then(rssi => {
            OSLogger.log(`[BLE] RSSI for ${peripheralId}: ${rssi}`);
            return rssi;
          })
      } else {
        OSLogger.log(`[BLE] Peripheral not connected, attempting to connect...`);
        return BleHelpers.connectPeripheral(peripheralId).then(() => undefined)
      }
    })
  }

  static async disconnectPeripheral(peripheralId: string) {
    OSLogger.log(`[BLE] Disconnecting peripheral: ${peripheralId}`);
    const hasPermission = await BleHelpers.ensureConnectPermission()
    if (!hasPermission) {
      throw new Error("Nearby devices permission is required to disconnect from BEEP bases.")
    }

    if (peripheralId) {
      return BleManager.disconnect(peripheralId, true)
        .then(() => {
          OSLogger.log(`[BLE] Successfully disconnected from ${peripheralId}`);
        })
        .catch(error => {
          OSLogger.log(`[BLE] ERROR: Failed to disconnect from ${peripheralId}: ${error}`);
          throw error;
        })
    }
  }

  static refreshDeviceCache(peripheralId: string) {
    return new Promise(resolve => {
      BleManager.refreshCache(peripheralId).then(()=>{
        ToastAndroid.show("Your device cache is cleared", ToastAndroid.SHORT);
        resolve(true);
      });
    })
  }

  static async disconnectAllPeripherals() {
    const hasPermission = await BleHelpers.ensureConnectPermission()
    if (!hasPermission) {
      return
    }
    BleManager.getBondedPeripherals().then((peripherals: Array<Peripheral>) => {
      peripherals.forEach((peripheral: Peripheral) => {
        if (peripheral.name?.startsWith(BLE_NAME_PREFIX)) {
          BleManager.disconnect(peripheral.id, true).catch(error => console.log(error))
        }
      })
    })
  }

  static byteToHexString(uint8arr: any) {
    if (!uint8arr) {
      return '';
    }
    let hexStr = '';
    for (let i = 0; i < uint8arr.length; i++) {
      let hex = (uint8arr[i] & 0xff).toString(16);
      hex = (hex.length === 1) ? '0' + hex : hex;
      hexStr += hex;
    }
    return hexStr.toUpperCase();
  }

  static readBatteryLevel(peripheralId: string) {
    // store.dispatch(BeepBaseActions.bleFailure(undefined))
    // return BleHelpers.read(peripheralId, BATTERY_SERVICE, BATTERY_LEVEL_CHARACTERISTIC).then((value: any) => {
    //   const buffer: Buffer = Buffer.from(value)
    //   const model = new BatteryParser({ data: buffer }).parse()
    //   store.dispatch(BeepBaseActions.setBattery(model))
    // }).catch(error => {
    //   store.dispatch(BeepBaseActions.bleFailure(error))
    // })
  }

  static read(peripheralId: string, serviceUUID: string, characteristicUUID: string) {
    OSLogger.log(`[BLE] Reading from peripheral ${peripheralId} - Service: ${serviceUUID}, Characteristic: ${characteristicUUID}`);
    return BleManager.read(peripheralId, serviceUUID, characteristicUUID)
      .then(data => {
        OSLogger.log(`[BLE] Read successful from ${peripheralId} - Data length: ${data?.length || 0}`);
        return data;
      })
      .catch(error => {
        OSLogger.log(`[BLE] ERROR: Read failed from ${peripheralId}: ${error}`);
        throw error;
      })
  }

  //limit calls to write() with these settings:
  static limiter = new Bottleneck({
    maxConcurrent: 1,                       // max 1 call at a time
    minTime: 500                            // wait for x ms minimum before next call
  })
  static writeLimiters: Map<string, Bottleneck> = new Map()

  static getWriteLimiter(peripheralId: string) {
    const existing = BleHelpers.writeLimiters.get(peripheralId)
    if (existing) {
      return existing
    }

    const limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 500,
    })
    BleHelpers.writeLimiters.set(peripheralId, limiter)
    return limiter
  }
  
  static lastWrite: { peripheralId: string, command: any, params?: any } | undefined = undefined

  static write(peripheralId: string, command: any, params?: any) {
    OSLogger.log(`[BLE] Writing to peripheral ${peripheralId} - Command: 0x${command.toString(16)}, Params: ${params}`);
    BleHelpers.lastWrite = { peripheralId, command, params }

    store.dispatch(BeepBaseActions.bleFailure(undefined))

    const isString = function(value: any) {
      return typeof value === 'string' || value instanceof String
    }

    const isBuffer = function(obj: any) {
      return obj != null && obj.constructor != null && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
    }

    // const isLittleEndian = (function () {
    //   let t32 = new Uint32Array(1);
    //   let t8 = new Uint8Array(t32.buffer);
    //   t8[0] = 0x0A;
    //   t8[1] = 0x0B;
    //   t8[2] = 0x0C;
    //   t8[3] = 0x0D;
    //   return t32[0] === 0x0D0C0B0A;
    // })();
    // const isBigEndian = !isLittleEndian;

    let buffer: Buffer
    const arrayCommand = Array.isArray(command) ? command : [command]
    let arrayCommandParams
    if (params !== undefined) {
      if (isBuffer(params)) {
        buffer = Buffer.concat([Buffer.from(arrayCommand), params])
      } else {
        const arrayParams = Array.isArray(params) ? params : isString(params) ? Buffer.from(params, "hex") : [params]
        arrayCommandParams = [...arrayCommand, ...arrayParams]
        buffer = Buffer.from(arrayCommandParams)
      }
    } else {
      buffer = Buffer.from(arrayCommand)
    }

    // if (isLittleEndian) {
    //   buffer.swap16()
    // }

    return BleHelpers.getWriteLimiter(peripheralId).schedule(() =>
      BleManager.write(
        peripheralId,
        BEEP_SERVICE,
        CONTROL_POINT_CHARACTERISTIC,
        [...buffer]
      )
      .then(() => {
        OSLogger.log(`[BLE] Write successful - ${Date.now()} - Data: ${BleHelpers.byteToHexString([...buffer])}`);
      })
      .catch((error) => {
        OSLogger.log(`[BLE] ERROR: Write failed to ${peripheralId}: ${error}`)
        const commandByte = Array.isArray(command) ? command[0] : command
        if (commandByte === COMMANDS.READ_MX_FLASH || commandByte === COMMANDS.ERASE_MX_FLASH || commandByte === COMMANDS.SIZE_MX_FLASH) {
          store.dispatch(BeepBaseActions.setLogDownloadError(String(error), peripheralId))
        }
        store.dispatch(BeepBaseActions.bleFailure(error))
      })
    )
  }
}
