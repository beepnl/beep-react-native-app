// Utils
import BleManager, { Peripheral } from 'react-native-ble-manager'
import { EmitterSubscription, Linking, PermissionsAndroid, Platform } from "react-native";
import OSLogger from './OSLogger';
import { BleLogger } from './BleLogger';
import { stringToBytes, bytesToString } from "convert-string";
import { PairedPeripheralModel } from '../Models/PairedPeripheralModel';
import { NativeModules, NativeEventEmitter } from "react-native";
import { Buffer } from 'buffer';
import { TemperatureParser } from '../Models/TemperatureModel';
import { store } from 'App/App.tsx';
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import { LogFileSizeModel } from '../Models/LogFileSizeModel';
import { LogFileFrameModel } from '../Models/LogFileFrameModel';
import { FirmwareVersionParser } from '../Models/FirmwareVersionModel';
import RNFS from 'react-native-fs';
import { FileSystem } from 'react-native-file-access';
import { AteccParser } from '../Models/AteccModel';
import { HardwareVersionParser } from '../Models/HardwareVersionModel';
import { WeightParser } from '../Models/WeightModel';
import { AudioParser } from '../Models/AudioModel';
import { LoRaWanStateParser } from '../Models/LoRaWanStateModel';
import { LoRaWanDeviceEUIParser } from '../Models/LoRaWanDeviceEUIModel';
import { LoRaWanAppEUIParser } from '../Models/LoRaWanAppEUIModel';
import { LoRaWanAppKeyParser } from '../Models/LoRaWanAppKeyModel';
import { ApplicationConfigParser } from '../Models/ApplicationConfigModel';
// import { BatteryParser } from '../Models/BatteryServiceModel';
import { ClockModel } from '../Models/ClockModel';
import { ResponseModel } from '../Models/ResponseModel';
import { getLogFileSize } from '../Stores/BeepBase/Selectors';
import { EraseLogFileModel } from '../Models/EraseLogFileModel';
import { TiltModel } from '../Models/TiltModel';
import { BatteryModel } from '../Models/BatteryModel';
import Bottleneck from 'bottleneck';

const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);

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
  WRITE_LORAWAN_TRANSMIT : 0x88,
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

export type BluetoothState = 
"off" |                 // Bluetooth is turned off
"pairedConnected" |     // Bluetooth is on and all paired peripherals are connected
"pairedNotConnected" |  // Bluetooth is on and not all paired peripherals are connected
"noPaired"              // Bluetooth is on and there are no paired peripherals

export const BLE_NAME_PREFIX = "BEEPBASE-"
export const BEEP_SERVICE = "be4768a1-719f-4bad-5040-c6ebc5f8c31b"
export const CONTROL_POINT_CHARACTERISTIC = "000068b0-0000-1000-8000-00805f9b34fb"
export const LOG_FILE_CHARACTERISTIC = "be4768a3-719f-4bad-5040-c6ebc5f8c31b"
export const BATTERY_SERVICE = "0000180f-0000-1000-8000-00805f9b34fb"
export const BATTERY_LEVEL_CHARACTERISTIC = "00002a19-0000-1000-8000-00805f9b34fb"

export default class BleHelpers {

  static LOG_FILE_NAME = "BeepBaseLogFile.txt"
  static LOG_FILE_PATH = RNFS.CachesDirectoryPath + "/" + BleHelpers.LOG_FILE_NAME

  static BleManagerDidUpdateValueForControlPointCharacteristicSubscription: EmitterSubscription
  static BleManagerDidUpdateValueForTXLogCharacteristicSubscription: EmitterSubscription

  static enableBluetooth() {
    store.dispatch(BeepBaseActions.bleFailure(undefined))
    switch (Platform.OS) {
      case "ios":
        return new Promise<void>((resolve) => {
          Linking.openURL('App-Prefs:Bluetooth')
          resolve()
        })
        // Linking.openURL('App-Prefs:Bluetooth')    //TODO: this is for iOS 10+   //TODO2:check if this gets approved by Apple
        // break;
    
      case "android":
        return  BleManager.enableBluetooth()
        .catch((error) => {
          const message = "The user did not enable bluetooth. Error: " + error
          console.log(message)
          store.dispatch(BeepBaseActions.bleFailure(message))
        });
    }
  }

  static getBluetoothState(bleState: string, pairedPeripherals: Array<PairedPeripheralModel>) {
    if (bleState == "on") {
      if (pairedPeripherals && pairedPeripherals.length > 0) {
        if (pairedPeripherals.every(p => p.isConnected == true)) {
          return "pairedConnected"
        }
        return "pairedNotConnected"
      }
      return "noPaired"
    }
    return "off"
  }

  static init() {
    console.log("BleManager start");
    return BleManager.start({
      showAlert: true,
      restoreIdentifierKey: "nl.beep.BEEP.restoreIdentifierKey",
      queueIdentifierKey: "nl.beep.BEEP.queueIdentifierKey",
    }).then(async () => {
      //request usage of Bluetooth on Android (iOS is handled by OS via info.plist entry)
      if (Platform.OS === 'android' && Platform.Version >= 31) {
        const grantedSCAN = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN)
        console.log("Permission BLUETOOTH_SCAN", grantedSCAN)
        const grantedCONNECT = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT)
        console.log("Permission BLUETOOTH_CONNECT", grantedCONNECT)
      }
      else if (Platform.OS === 'android' && Platform.Version >= 23) {
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
          if (result) {
            console.log("Permission is ACCESS_FINE_LOCATION OK");
          } else {
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
              if (result) {
                console.log("User accepted ACCESS_FINE_LOCATION permission");
              } else {
                console.log("User refused ACCESS_FINE_LOCATION permission");
              }
            });
          }
        });
      }    
    })
  }

  // Request high connection priority on Android API 21+
  static async requestConnectionPriorityHigh(peripheralId: string): Promise<void> {
    if (Platform.OS !== 'android' || Platform.Version < 21) return
    const fn = (BleManager as any).requestConnectionPriority
    if (typeof fn === 'function') {
      try {
        OSLogger.log(`[BLE] Requesting HIGH connection priority for ${peripheralId}`)
        await fn(peripheralId, 1)
        OSLogger.log(`[BLE] Connection priority set to HIGH for ${peripheralId}`)
      } catch (e) {
        OSLogger.log(`[BLE] ERROR requesting connection priority for ${peripheralId}: ${e}`)
      }
    }
  }

  // Request MTU negotiation on Android API 21+
  static async requestMtu(peripheralId: string): Promise<number> {
    if (Platform.OS !== 'android') return 0
    if (Platform.Version < 21 || typeof (BleManager as any).requestMTU !== 'function') {
      return 0
    }
    const mtuSizes = [247, 185, 158, 104, 52]
    for (const requestedMtu of mtuSizes) {
      try {
        OSLogger.log(`[BLE] Requesting MTU ${requestedMtu} for ${peripheralId}...`)
        const mtu = await (BleManager as any).requestMTU(peripheralId, requestedMtu)
        if (mtu >= 23) return mtu
      } catch (_) {}
    }
    return 0
  }

  static pair(peripheralId: string) {
    return BleManager.createBond(peripheralId).catch(() => {})
  }

  static connectPeripheral(peripheralOrId: Peripheral | string) {
    const peripheralId = typeof peripheralOrId === 'string' ? peripheralOrId : peripheralOrId.id;
    OSLogger.log(`[BLE] Attempting to connect to peripheral: ${peripheralId}`);
    store.dispatch(BeepBaseActions.bleFailure(undefined));
    return BleManager.isPeripheralConnected(peripheralId).then(isConnected => {
      if (isConnected) {
        OSLogger.log(`[BLE] Peripheral ${peripheralId} is already connected`);
        if (Platform.OS === 'android') {
          return BleHelpers.requestConnectionPriorityHigh(peripheralId)
            .catch(() => {})
            .then(() => BleHelpers.requestMtu(peripheralId))
            .catch(() => {})
            .then(() => BleHelpers.retrieveServices(peripheralId))
        }
        return BleHelpers.retrieveServices(peripheralId);
      }

      OSLogger.log(`[BLE] Peripheral ${peripheralId} is not connected, starting connection process...`);

      return BleManager.connect(peripheralId)
        .then(() => {
          OSLogger.log(`[BLE] Successfully connected to ${peripheralId}`);
          if (typeof peripheralOrId !== 'string') {
            BleLogger.logPeripheral(peripheralOrId);
          }
          OSLogger.log(`[BLE] Waiting 500ms before pairing...`);
          return delay(500);
        })
        .then(() => {
          OSLogger.log(`[BLE] Attempting to pair with ${peripheralId}`);
          return this.pair(peripheralId);
        })
        .then(() => {
          if (Platform.OS === 'android') {
            OSLogger.log(`[BLE] Negotiating connection priority and MTU for ${peripheralId}`);
            return BleHelpers.requestConnectionPriorityHigh(peripheralId)
              .catch(() => {})
              .then(() => BleHelpers.requestMtu(peripheralId))
              .catch(() => {})
              .then(() => delay(150))
          }
        })
        .then(() => {
          OSLogger.log(`[BLE] Successfully paired with ${peripheralId}, retrieving services...`);
          return BleHelpers.retrieveServices(peripheralId);
        })
        .catch(error => {
          const errorMessage = `[BLE] ERROR: Failed during connection process for ${peripheralId}: ${error}`;
          OSLogger.log(errorMessage);
          store.dispatch(BeepBaseActions.bleFailure(errorMessage));
          BleManager.disconnect(peripheralId).catch(() => {});
          throw error;
        });
    });
  }

  static scanPeripheralByName(startsWith: string, options?: { attempts?: number, timeoutSec?: number }): Promise<Peripheral> {
    const maxAttempts = options?.attempts ?? 3
    const timeoutSec = options?.timeoutSec ?? 10
    const startsWithUpper = (startsWith || '').toUpperCase()
    const last4Match = startsWithUpper.match(/[0-9A-F]{4}$/)
    const targetLast4 = last4Match ? last4Match[0] : undefined

    OSLogger.log(`[BLE] Starting scan (attempts=${maxAttempts}, timeout=${timeoutSec}s) for name: ${startsWithUpper}${targetLast4 ? ` (suffix ${targetLast4})` : ''}`)
    store.dispatch(BeepBaseActions.bleFailure(undefined))

    const attemptOnce = (attempt: number): Promise<Peripheral> => {
      OSLogger.log(`[BLE] Scan attempt ${attempt}/${maxAttempts}...`)
      let isScanning = false
      let resolved = false
      const candidates = new Map<string, Peripheral>()

      const cleanup = (subs: Array<EmitterSubscription | undefined>) => subs.forEach(s => s && s.remove())

      return new Promise<Peripheral>((resolve, reject) => {
        const BleManagerDiscoverPeripheralSubscription = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', (peripheral: Peripheral) => {
          const adv = peripheral?.advertising
          const localName = adv?.localName
          let name: string = peripheral?.name || localName || ''
          const nameUpper = name.toUpperCase()
          OSLogger.log(`[BLE] Found ID=${peripheral.id} Name=${name} RSSI=${peripheral.rssi} Conn=${adv?.isConnectable}`)
          BleLogger.logPeripheral(peripheral)

          if (!adv?.isConnectable) return

          const nameMatches = nameUpper.startsWith(startsWithUpper) || (targetLast4 ? nameUpper.includes(targetLast4) : false)
          if (nameMatches) {
            OSLogger.log(`[BLE] Match: ${name} (by ${nameUpper.startsWith(startsWithUpper) ? 'startsWith' : 'last4'})`)
            resolved = true
            cleanup([BleManagerDiscoverPeripheralSubscription, BleManagerStopScanSubscription])
            BleManager.stopScan()
            return resolve(peripheral)
          }

          if (nameUpper.startsWith(BLE_NAME_PREFIX)) {
            candidates.set(peripheral.id, peripheral)
          }
        })

        const BleManagerStopScanSubscription = bleManagerEmitter.addListener('BleManagerStopScan', () => {
          OSLogger.log(`[BLE] Scan stopped (attempt ${attempt}). Was scanning: ${isScanning}. Candidates: ${candidates.size}`)
          isScanning = false
          if (resolved) {
            cleanup([BleManagerDiscoverPeripheralSubscription, BleManagerStopScanSubscription])
            return
          }

          // Fallback: prefer unique candidate containing last4
          if (targetLast4) {
            const last4Candidates = Array.from(candidates.values()).filter(p => (p.name || p.advertising?.localName || '').toUpperCase().includes(targetLast4))
            if (last4Candidates.length === 1) {
              const fallback = last4Candidates[0]
              OSLogger.log(`[BLE] Using fallback by last4: ${fallback?.name} (${fallback?.id})`)
              resolved = true
              cleanup([BleManagerDiscoverPeripheralSubscription, BleManagerStopScanSubscription])
              return resolve(fallback)
            }
          }

          // Fallback: if exactly one BEEPBASE device seen
          if (candidates.size === 1) {
            const fallback = Array.from(candidates.values())[0]
            OSLogger.log(`[BLE] Using fallback candidate: ${fallback?.name} (${fallback?.id})`)
            resolved = true
            cleanup([BleManagerDiscoverPeripheralSubscription, BleManagerStopScanSubscription])
            return resolve(fallback)
          }

          cleanup([BleManagerDiscoverPeripheralSubscription, BleManagerStopScanSubscription])
          const errorMessage = candidates.size > 1
            ? "[BLE] Multiple BEEPBASE devices found; cannot disambiguate"
            : "[BLE] No matching device found during scan"
          OSLogger.log(errorMessage)
          reject(new Error(errorMessage))
        })

        BleManager.enableBluetooth().then(() => {
          OSLogger.log(`[BLE] Bluetooth enabled, starting scan (no filter) for ${timeoutSec}s...`)
          isScanning = true
          BleManager.scan([], timeoutSec, false).then(() => {
            OSLogger.log(`[BLE] Scanning...`)
          }).catch(err => {
            isScanning = false
            const errorMessage = `[BLE] ERROR: Scan failed: ${err}`
            OSLogger.log(errorMessage)
            store.dispatch(BeepBaseActions.bleFailure(errorMessage))
            cleanup([BleManagerDiscoverPeripheralSubscription, BleManagerStopScanSubscription])
            reject(err)
          })
        })
        .catch((error) => {
          isScanning = false
          const errorMessage = `[BLE] ERROR: User refused to enable bluetooth: ${error}`
          OSLogger.log(errorMessage)
          store.dispatch(BeepBaseActions.bleFailure(errorMessage))
          cleanup([BleManagerDiscoverPeripheralSubscription, BleManagerStopScanSubscription])
          reject(error)
        })
      })
    }

    const run = async (): Promise<Peripheral> => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const p = await attemptOnce(attempt)
          return p
        } catch (e) {
          if (attempt < maxAttempts) {
            OSLogger.log(`[BLE] Retry in 1500ms (attempt ${attempt + 1}/${maxAttempts})...`)
            await delay(1500)
          } else {
            throw e
          }
        }
      }
      throw new Error('[BLE] Unexpected scan loop exit')
    }

    return run()
  }

  static onValueForCharacteristic({ value, peripheral, characteristic, service }) {
    // console.log(`Recieved ${data} for characteristic ${characteristic}`);
    switch (characteristic.toLowerCase()) {
      case CONTROL_POINT_CHARACTERISTIC:
        BleHelpers.handleControlPointCharacteristic({ value, peripheral })
        break

      case LOG_FILE_CHARACTERISTIC:
        BleHelpers.handleLogFileCharacteristic({ value, peripheral })
        break
    }
  }
  
  static handleControlPointCharacteristic({ value, peripheral }) {
    const buffer: Buffer = Buffer.from(value)
    const command = buffer.readInt8()
    const data: Buffer = buffer.subarray(1)
    if (data.length) {
      let model
      switch (command) {
        case COMMANDS.RESPONSE:
          console.log("BLE response", data)
          const response = ResponseModel.parse(data)
          if (response.code > 0) {
            switch (response.command) {
              case COMMANDS.READ_MX_FLASH:
                  //00 00 0E 0F
                  if (response.code == 0x00E0F) {
                    console.log("Download ready, received response code 0x00E0F")
                    const logFileSize = getLogFileSize(store.getState())
                    store.dispatch(BeepBaseActions.setLogFileProgress(logFileSize.data))
                  }
                break;

              case COMMANDS.ERASE_MX_FLASH:
                //fatfs mode error code or full mode timeout
                const eraseLogFileModel = EraseLogFileModel.parse(data)
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
                console.log("Download ready, received NRF_SUCCESS")
                const logFileSize = getLogFileSize(store.getState())
                store.dispatch(BeepBaseActions.setLogFileProgress(logFileSize.data))
                break

              case COMMANDS.ERASE_MX_FLASH:
                store.dispatch(BeepBaseActions.setEraseLogFileProgress(1))
              break
            }
          }
          break

        case COMMANDS.READ_FIRMWARE_VERSION:
          model = new FirmwareVersionParser({ data }).parse()
          store.dispatch(BeepBaseActions.setFirmwareVersion(model))
          break

        case COMMANDS.READ_HARDWARE_VERSION:
          model = new HardwareVersionParser({ data }).parse()
          store.dispatch(BeepBaseActions.setHardwareVersion(model))
          break

        //Application config
        case COMMANDS.READ_APPLICATION_CONFIG:
          model = new ApplicationConfigParser({ data }).parse()
          store.dispatch(BeepBaseActions.setApplicationConfig(model))
          break

        //Tilt sensor
        case COMMANDS.READ_SQ_MIN_STATE:
          model = TiltModel.parse(data)
          store.dispatch(BeepBaseActions.setTilt(model))
          break

        //LoRaWan state
        case COMMANDS.READ_LORAWAN_STATE:
          model = new LoRaWanStateParser({ data }).parse()
          store.dispatch(BeepBaseActions.setLoRaWanState(model))
          break

        //LoRaWan device EUI
        case COMMANDS.READ_LORAWAN_DEVEUI:
          model = new LoRaWanDeviceEUIParser({ data }).parse()
          store.dispatch(BeepBaseActions.setLoRaWanDeviceEUI(model))
          break

        //LoRaWan app EUI
        case COMMANDS.READ_LORAWAN_APPEUI:
          model = new LoRaWanAppEUIParser({ data }).parse()
          store.dispatch(BeepBaseActions.setLoRaWanAppEUI(model))
          break

        //LoRaWan app key
        case COMMANDS.READ_LORAWAN_APPKEY:
          model = new LoRaWanAppKeyParser({ data }).parse()
          store.dispatch(BeepBaseActions.setLoRaWanAppKey(model))
          break

        //temperature sensor
        case COMMANDS.READ_DS18B20_CONVERSION:
          const models = new TemperatureParser({ data }).parse()
          store.dispatch(BeepBaseActions.setTemperatures(models))
          break

        //weight sensor
        case COMMANDS.READ_HX711_CONVERSION:
          model = new WeightParser({ data }).parse()
          store.dispatch(BeepBaseActions.setWeight(model))
          break

        //audio sensor
        case COMMANDS.READ_AUDIO_ADC_CONFIG:
          model = new AudioParser({ data }).parse()
          store.dispatch(BeepBaseActions.setAudio(model))
          break

        //hardware id
        case COMMANDS.READ_ATECC_READ_ID:
          model = new AteccParser({ data }).parse()
          store.dispatch(BeepBaseActions.setHardwareId(model))
          break

        //flash log file
        case COMMANDS.READ_MX_FLASH:
          console.log(data)
          break

        //flash log file size
        case COMMANDS.SIZE_MX_FLASH:
          model = LogFileSizeModel.parse(data)
          store.dispatch(BeepBaseActions.setLogFileSize(model))
          break

        //erase flash log file
        case COMMANDS.ERASE_MX_FLASH:
          // model = EraseLogFileModel.parse(data)
          // store.dispatch(BeepBaseActions.setEraseLogFileProgress(0))
          break

        //clock
        case COMMANDS.READ_CLOCK:
          model = ClockModel.parse(data)
          store.dispatch(BeepBaseActions.setClock(model))
          break

        //battery (old mode, not using Battery Service)
        case COMMANDS.READ_nRF_ADC_CONVERSION:
          model = BatteryModel.parse(data)
          store.dispatch(BeepBaseActions.setBattery(model))
          break
      }
    }
  }

  static lastFrame: number = -1

  static initLogFile() {
    BleHelpers.lastFrame = -1

    //delete old log file
    return RNFS.exists(BleHelpers.LOG_FILE_PATH).then((exists: boolean) => {
      if (exists) {
        RNFS.unlink(BleHelpers.LOG_FILE_PATH)
        .then(() => {
          console.log("Existing log file deleted");
        })
        .catch((err) => {
          console.log("Error initLogFile.unlink", err.message);
        });
      }
    })
    .catch((err) => {
      console.log("Error initLogFile.exists", err.message);
    });
  }

  static exportLogFile() {
    FileSystem.cpExternal(BleHelpers.LOG_FILE_PATH, BleHelpers.LOG_FILE_NAME, "downloads").catch(error => {
      console.log("Error copying to SD card", error)
    })
  }

  static handleLogFileCharacteristic({ value, peripheral }) {
    const buffer: Buffer = Buffer.from(value)
    const model = LogFileFrameModel.parse(buffer)
    if (model) {
      //skip frames with equal frame numbers, see https://github.com/innoveit/react-native-ble-manager/issues/577
      if (model.frame != BleHelpers.lastFrame) {
        store.dispatch(BeepBaseActions.addLogFileFrame(model))
        BleHelpers.lastFrame = model.frame
        RNFS.appendFile(BleHelpers.LOG_FILE_PATH, model.data.toString("hex"))
        .catch((err) => {
          console.log("Error writing log file frame", err);
        });
      }
    }
  }

  static retrieveServices(peripheralId: string) {
    store.dispatch(BeepBaseActions.bleFailure(undefined))
    console.log("BleHelpers retrieveServices")
    return delay(500).then(() => {
      return BleManager.retrieveServices(peripheralId).then((peripheralInfo) => {
        // console.log("Peripheral info:", peripheralInfo);
        console.log("retrieveServices OK")
        return BleManager.startNotification(peripheralId, BEEP_SERVICE, CONTROL_POINT_CHARACTERISTIC).then(() => {
          console.log("Notification BEEP CONTROL POINT subscribed")
          BleHelpers.BleManagerDidUpdateValueForControlPointCharacteristicSubscription && BleHelpers.BleManagerDidUpdateValueForControlPointCharacteristicSubscription.remove()
          BleHelpers.BleManagerDidUpdateValueForControlPointCharacteristicSubscription = bleManagerEmitter.addListener("BleManagerDidUpdateValueForCharacteristic", BleHelpers.onValueForCharacteristic);
        }).then(() => {
          return BleManager.startNotification(peripheralId, BEEP_SERVICE, LOG_FILE_CHARACTERISTIC).then(() => {
            console.log("Notification LOG FILE subscribed")
            BleHelpers.BleManagerDidUpdateValueForTXLogCharacteristicSubscription && BleHelpers.BleManagerDidUpdateValueForTXLogCharacteristicSubscription.remove()
            BleHelpers.BleManagerDidUpdateValueForTXLogCharacteristicSubscription = bleManagerEmitter.addListener("BleManagerDidUpdateValueForCharacteristic", BleHelpers.onValueForCharacteristic);
          })
        })
      })
      .catch((error) => {
        const message = "Failed to retrieve services of " + peripheralId + ". Error: " + error
        console.log(message)
        store.dispatch(BeepBaseActions.bleFailure(message))
      })
    })
  }

  static isConnected(peripheralId: string) {
    return BleManager.isPeripheralConnected(peripheralId, [BEEP_SERVICE])
  }

  static readRSSI(peripheralId: string) {
    // return new Promise<void>((resolve) => resolve());

    return BleManager.isPeripheralConnected(peripheralId, []).then(isConnected => {
      if (isConnected) {
        return BleManager.readRSSI(peripheralId)
      } else {
        BleHelpers.connectPeripheral(peripheralId)
      }
    })
  }

  static disconnectPeripheral(peripheral: PairedPeripheralModel) {
    BleHelpers.BleManagerDidUpdateValueForControlPointCharacteristicSubscription && BleHelpers.BleManagerDidUpdateValueForControlPointCharacteristicSubscription.remove()
    BleHelpers.BleManagerDidUpdateValueForTXLogCharacteristicSubscription && BleHelpers.BleManagerDidUpdateValueForTXLogCharacteristicSubscription.remove()

    if (peripheral) {
      return BleManager.disconnect(peripheral.id, true)
    }
  }

  static disconnectAllPeripherals() {
    BleManager.getBondedPeripherals().then((peripherals: Array<Peripheral>) => {
      peripherals.forEach((peripheral: Peripheral) => {
        if (peripheral.name?.startsWith(BLE_NAME_PREFIX)) {
          BleManager.disconnect(peripheral.id, true).catch(error => console.log(error))
        }
      })
    })
  }

  static byteToHexString(uint8arr) {
    if (!uint8arr) {
      return '';
    }
    var hexStr = '';
    for (var i = 0; i < uint8arr.length; i++) {
      var hex = (uint8arr[i] & 0xff).toString(16);
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
    return BleManager.read(peripheralId, serviceUUID, characteristicUUID)
  }

  //limit calls to write() with these settings:
  static limiter = new Bottleneck({
    maxConcurrent: 1,                       // max 1 call at a time
    minTime: 500                            // wait for x ms minimum before next call
  })
  
  static lastWrite: { peripheralId: string, command: any, params?: any } | undefined = undefined

  static write(peripheralId: string, command: any, params?: any) {
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

    return BleHelpers.limiter.schedule(() => 
      BleManager.write(
        peripheralId,
        BEEP_SERVICE,
        CONTROL_POINT_CHARACTERISTIC,
        [...buffer]
      )
      .then(() => {
        console.log(Date.now() + " Written data: " + BleHelpers.byteToHexString([...buffer]));
      })
      .catch((error) => {
        console.log(error)
        store.dispatch(BeepBaseActions.bleFailure(error))
      })
    )
  }
}
