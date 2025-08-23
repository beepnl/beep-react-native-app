// Utils
import BleManager, { Peripheral } from 'react-native-ble-manager'
import { EmitterSubscription, Linking, PermissionsAndroid, Platform, ToastAndroid } from "react-native";
import { stringToBytes, bytesToString } from "convert-string";
import { PairedPeripheralModel } from '../Models/PairedPeripheralModel';
import { NativeModules, NativeEventEmitter } from "react-native";
import { Buffer } from 'buffer';
import { TemperatureParser } from '../Models/TemperatureModel';
import { store } from '../App';
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
import { BleLogger } from './BleLogger';
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

import { RNLogger } from './RNLogger';
import { OSLogger } from './OSLogger';

export default class BleHelpers {

  static LOG_FILE_NAME = "BeepBaseLogFile.txt"
  static LOG_FILE_PATH = RNFS.CachesDirectoryPath + "/" + BleHelpers.LOG_FILE_NAME
  
  // File logging is now handled by BleLogger and RNLogger classes
  static async exportBleLogFile() {
    await BleLogger.exportToDownloads();
    return RNLogger.exportToDownloads();
  }

  static BleManagerDidUpdateValueForControlPointCharacteristicSubscription: EmitterSubscription
  static BleManagerDidUpdateValueForTXLogCharacteristicSubscription: EmitterSubscription

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

  static init() {
    // Initialize the loggers
    BleLogger.init()
    RNLogger.init()
    
    OSLogger.log("[BLE] Initializing BleManager...");
    return BleManager.start({
      showAlert: true,
      restoreIdentifierKey: "nl.beep.BEEP.restoreIdentifierKey",
      queueIdentifierKey: "nl.beep.BEEP.queueIdentifierKey",
    }).then(async () => {
      OSLogger.log("[BLE] BleManager started successfully");
      //request usage of Bluetooth on Android (iOS is handled by OS via info.plist entry)
      if (Platform.OS === 'android' && Platform.Version >= 31) {
        OSLogger.log("[BLE] Android 12+: Requesting Bluetooth permissions...");
        const grantedSCAN = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN)
        OSLogger.log(`[BLE] Permission BLUETOOTH_SCAN: ${grantedSCAN}`)
        const grantedCONNECT = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT)
        OSLogger.log(`[BLE] Permission BLUETOOTH_CONNECT: ${grantedCONNECT}`)
      }
      else if (Platform.OS === 'android' && Platform.Version >= 23) {
        OSLogger.log("[BLE] Android 6+: Checking location permissions...");
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
          if (result) {
            OSLogger.log("[BLE] Permission ACCESS_FINE_LOCATION is OK");
          } else {
            OSLogger.log("[BLE] Requesting ACCESS_FINE_LOCATION permission...");
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
              if (result) {
                OSLogger.log("[BLE] User accepted ACCESS_FINE_LOCATION permission");
              } else {
                OSLogger.log("[BLE] User refused ACCESS_FINE_LOCATION permission");
              }
            });
          }
        });
      }    
    })
    .catch(error => {
      OSLogger.log(`[BLE] ERROR: Failed to start BleManager: ${error}`);
      throw error;
    })
  }

  static pair(peripheralId: string) {
    return BleManager.createBond(peripheralId).then(() => {
      OSLogger.log(`[BLE] Successfully bonded with ${peripheralId}`);
    }).catch(() => {
      OSLogger.log(`[BLE] Failed to bond with ${peripheralId}`);
    })
  }

  static connectPeripheral(peripheral: Peripheral) {
    const peripheralId = peripheral.id;
    OSLogger.log(`[BLE] Attempting to connect to peripheral: ${peripheralId}`);
    store.dispatch(BeepBaseActions.bleFailure(undefined));
    return BleManager.isPeripheralConnected(peripheralId).then(isConnected => {
      if (isConnected) {
        OSLogger.log(`[BLE] Peripheral ${peripheralId} is already connected, retrieving services...`);
        return BleHelpers.retrieveServices(peripheralId);
      }

      OSLogger.log(`[BLE] Peripheral ${peripheralId} is not connected, starting connection process...`);
      if (Platform.OS === 'android') {
        this.refreshDeviceCache(peripheralId);
      }

      return BleManager.connect(peripheralId)
        .then(() => {
          OSLogger.log(`[BLE] Successfully connected to ${peripheralId}`);
          OSLogger.logPeripheral(peripheral);
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
      const BleManagerDiscoverPeripheralSubscription = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', (peripheral: Peripheral) => {
        OSLogger.log(`[BLE] Discovered peripheral - ID: ${peripheral.id}, Name: ${peripheral.name}, RSSI: ${peripheral.rssi}, Connectable: ${peripheral.advertising?.isConnectable}`);
        OSLogger.logPeripheral(peripheral);
        if (peripheral.advertising?.isConnectable) {
          if (!peripheral.name) {
            peripheral.name = peripheral.advertising?.localName
            OSLogger.log(`[BLE] Using localName for peripheral: ${peripheral.name}`);
          }
          if (peripheral.name?.startsWith(startsWith)) {
            OSLogger.log(`[BLE] Found matching peripheral: ${peripheral.name}`);
            BleManagerDiscoverPeripheralSubscription && BleManagerDiscoverPeripheralSubscription.remove()
            BleManager.stopScan()
            resolve(peripheral)
          }
        }
      })

      const BleManagerStopScanSubscription = bleManagerEmitter.addListener('BleManagerStopScan', () => {
        OSLogger.log(`[BLE] Scan stopped. Was scanning: ${isScanning}`);
        BleManagerStopScanSubscription && BleManagerStopScanSubscription.remove()
        if (isScanning) {
          //if still scanning at this point no device matching filter was found
          const errorMessage = "[BLE] No matching device found during scan";
          OSLogger.log(errorMessage);
          reject(new Error(errorMessage))
        }
        isScanning = false
      })

      BleManager.enableBluetooth().then(() => {
        OSLogger.log("[BLE] Bluetooth enabled, starting scan...");
        isScanning = true
        BleManager.scan([BEEP_SERVICE], TIME_OUT, false).then((results) => {
          OSLogger.log(`[BLE] Scanning started with ${TIME_OUT}s timeout...`)
        }).catch(err => {
          isScanning = false
          const errorMessage = `[BLE] ERROR: Scan failed: ${err}`;
          OSLogger.log(errorMessage);
          store.dispatch(BeepBaseActions.bleFailure(errorMessage))
          reject(err)
        })
      })
      .catch((error) => {
        isScanning = false
        const errorMessage = `[BLE] ERROR: User refused to enable bluetooth: ${error}`;
        OSLogger.log(errorMessage);
        store.dispatch(BeepBaseActions.bleFailure(errorMessage))
        reject(error)
      });
    })
  }

  static onValueForCharacteristic({ value, peripheral, characteristic, service }) {
    OSLogger.log(`[BLE] onValueForCharacteristic - Peripheral: ${peripheral.id}, Characteristic: ${characteristic.toLowerCase()}, Value: ${BleHelpers.byteToHexString(value)}`);
    OSLogger.logPeripheral(peripheral);
    switch (characteristic.toLowerCase()) {
      case CONTROL_POINT_CHARACTERISTIC:
        BleHelpers.handleControlPointCharacteristic({ value, peripheral })
        break

      case LOG_FILE_CHARACTERISTIC:
        BleHelpers.handleLogFileCharacteristic({ value, peripheral })
        break
        
      default:
        OSLogger.log(`[BLE] onValueForCharacteristic - Unhandled characteristic: ${characteristic.toLowerCase()}`);
    }
  }
  
  static handleControlPointCharacteristic({ value, peripheral }) {
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
                OSLogger.log("Download ready, received NRF_SUCCESS")
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
          OSLogger.log(`[BLE] Parsed LoRaWan Device EUI: ${model.toString()}`);
          store.dispatch(BeepBaseActions.setLoRaWanDeviceEUI(model))
          break

        //LoRaWan app EUI
        case COMMANDS.READ_LORAWAN_APPEUI:
          model = new LoRaWanAppEUIParser({ data }).parse()
          OSLogger.log(`[BLE] Parsed LoRaWan App EUI: ${model.toString()}`);
          store.dispatch(BeepBaseActions.setLoRaWanAppEUI(model))
          break

        //LoRaWan app key
        case COMMANDS.READ_LORAWAN_APPKEY:
          model = new LoRaWanAppKeyParser({ data }).parse()
          OSLogger.log(`[BLE] Parsed LoRaWan App Key: ${model.toString()}`);
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
          store.dispatch(BeepBaseActions.setLogFileSize(model))
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
      OSLogger.log(`[BLE] ERROR in handleControlPointCharacteristic: ${error.message}`)
      OSLogger.log(`[BLE] ERROR stack: ${error.stack}`)
      store.dispatch(BeepBaseActions.bleFailure(`BLE data parsing error: ${error.message}`))
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
          OSLogger.log("Existing log file deleted");
        })
        .catch((err) => {
          OSLogger.log(`Error initLogFile.unlink: ${err.message}`);
        });
      }
    })
    .catch((err) => {
      OSLogger.log(`Error initLogFile.exists: ${err.message}`);
    });
  }

  static exportLogFile() {
    FileSystem.cpExternal(BleHelpers.LOG_FILE_PATH, BleHelpers.LOG_FILE_NAME, "downloads").catch(error => {
      OSLogger.log(`Error copying to SD card: ${error}`)
    })
  }

  static handleLogFileCharacteristic({ value, peripheral }) {
    try {
      // Convert value to Buffer - handle both array-like objects and arrays
      const valueArray = Array.isArray(value) ? value : Object.values(value)
      const buffer: Buffer = Buffer.from(valueArray)
      const model = LogFileFrameModel.parse(buffer)
      if (model) {
        OSLogger.log(`[BLE] Parsed Log File Frame: Frame ${model.frame}, Length ${model.data.length}`);
        //skip frames with equal frame numbers, see https://github.com/innoveit/react-native-ble-manager/issues/577
        if (model.frame != BleHelpers.lastFrame) {
          store.dispatch(BeepBaseActions.addLogFileFrame(model))
          BleHelpers.lastFrame = model.frame
          RNFS.appendFile(BleHelpers.LOG_FILE_PATH, model.data.toString("hex"))
          .catch((err) => {
            OSLogger.log(`Error writing log file frame: ${err}`);
          });
        } else {
          OSLogger.log(`[BLE] Duplicate log file frame received: Frame ${model.frame}`);
        }
      } else {
        OSLogger.log(`[BLE] Failed to parse log file frame`);
      }
    } catch (error) {
      OSLogger.log(`[BLE] ERROR in handleLogFileCharacteristic: ${error.message}`)
      OSLogger.log(`[BLE] ERROR stack: ${error.stack}`)
    }
  }

  static retrieveServices(peripheralId: string) {
    OSLogger.log(`[BLE] Retrieving services for peripheral: ${peripheralId}`);
    store.dispatch(BeepBaseActions.bleFailure(undefined))
    return delay(500).then(() => {
      OSLogger.log("[BLE] Calling BleManager.retrieveServices...");
      return BleManager.retrieveServices(peripheralId).then((peripheralInfo) => {
        OSLogger.log(`[BLE] Services retrieved successfully for ${peripheralId}. Service count: ${peripheralInfo?.services?.length || 0}`);
        return BleManager.startNotification(peripheralId, BEEP_SERVICE, CONTROL_POINT_CHARACTERISTIC).then(() => {
          OSLogger.log(`[BLE] Notification subscribed for CONTROL POINT characteristic on ${peripheralId}`);
          BleHelpers.BleManagerDidUpdateValueForControlPointCharacteristicSubscription && BleHelpers.BleManagerDidUpdateValueForControlPointCharacteristicSubscription.remove()
          BleHelpers.BleManagerDidUpdateValueForControlPointCharacteristicSubscription = bleManagerEmitter.addListener("BleManagerDidUpdateValueForCharacteristic", BleHelpers.onValueForCharacteristic);
        }).then(() => {
          OSLogger.log(`[BLE] Starting notification for LOG FILE characteristic on ${peripheralId}...`);
          return BleManager.startNotification(peripheralId, BEEP_SERVICE, LOG_FILE_CHARACTERISTIC).then(() => {
            OSLogger.log(`[BLE] Notification subscribed for LOG FILE characteristic on ${peripheralId}`);
            BleHelpers.BleManagerDidUpdateValueForTXLogCharacteristicSubscription && BleHelpers.BleManagerDidUpdateValueForTXLogCharacteristicSubscription.remove()
            BleHelpers.BleManagerDidUpdateValueForTXLogCharacteristicSubscription = bleManagerEmitter.addListener("BleManagerDidUpdateValueForCharacteristic", BleHelpers.onValueForCharacteristic);
          })
        })
      })
      .catch((error) => {
        const message = `[BLE] ERROR: Failed to retrieve services of ${peripheralId}. Error: ${error}`
        console.log(message)
        store.dispatch(BeepBaseActions.bleFailure(message))
      })
    })
  }

  static isConnected(peripheralId: string) {
    OSLogger.log(`[BLE] Checking connection status for ${peripheralId}`);
    return BleManager.isPeripheralConnected(peripheralId, [BEEP_SERVICE])
      .then(isConnected => {
        OSLogger.log(`[BLE] Peripheral ${peripheralId} is ${isConnected ? 'connected' : 'not connected'}`);
        return isConnected;
      })
  }

  static readRSSI(peripheralId: string) {
    OSLogger.log(`[BLE] Reading RSSI for ${peripheralId}`);
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
        return BleHelpers.connectPeripheral(peripheralId)
      }
    })
  }

  static disconnectPeripheral(peripheral: PairedPeripheralModel) {
    OSLogger.log(`[BLE] Disconnecting peripheral: ${peripheral?.id}`);
    BleHelpers.BleManagerDidUpdateValueForControlPointCharacteristicSubscription && BleHelpers.BleManagerDidUpdateValueForControlPointCharacteristicSubscription.remove()
    BleHelpers.BleManagerDidUpdateValueForTXLogCharacteristicSubscription && BleHelpers.BleManagerDidUpdateValueForTXLogCharacteristicSubscription.remove()

    if (peripheral) {
      return BleManager.disconnect(peripheral.id, true)
        .then(() => {
          OSLogger.log(`[BLE] Successfully disconnected from ${peripheral.id}`);
        })
        .catch(error => {
          OSLogger.log(`[BLE] ERROR: Failed to disconnect from ${peripheral.id}: ${error}`);
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
  
  static lastWrite: { peripheralId: string, command: any, params?: any } | undefined = undefined

  static write(peripheralId: string, command: any, params?: any) {
    OSLogger.log(`[BLE] Writing to peripheral ${peripheralId} - Command: 0x${command.toString(16)}, Params: ${params}`);
    OSLogger.logPeripheral(peripheral);
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
        OSLogger.log(`[BLE] Write successful - ${Date.now()} - Data: ${BleHelpers.byteToHexString([...buffer])}`);
      })
      .catch((error) => {
        OSLogger.log(`[BLE] ERROR: Write failed to ${peripheralId}: ${error}`)
        store.dispatch(BeepBaseActions.bleFailure(error))
      })
    )
  }
}
