// Utils
import BleManager, { Peripheral } from 'react-native-ble-manager'
import { EmitterSubscription, Linking, PermissionsAndroid, Platform } from "react-native";
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
import { BatteryParser } from '../Models/BatteryModel';
import { ClockModel } from '../Models/ClockModel';
import { ResponseModel } from '../Models/ResponseModel';

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
      restoreIdentifierKey: "it.vandillen.beep.restoreIdentifierKey",
      queueIdentifierKey: "it.vandillen.beep.queueIdentifierKey",
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

  static connectPeripheral(peripheralId: string) {
    store.dispatch(BeepBaseActions.bleFailure(undefined))
    return BleManager.connect(peripheralId).then(() => {
      console.log("Connected to " + peripheralId)
      return delay(500).then(() => {
        return BleHelpers.retrieveServices(peripheralId)
        .catch((error) => {
          console.log(error)
          store.dispatch(BeepBaseActions.bleFailure(error))
        })
      })
    })
    .catch((error) => {
      console.log(error)
      store.dispatch(BeepBaseActions.bleFailure(error))
    })
  }

  static scanPeripheralByName(startsWith: string): Promise<Peripheral> {
    store.dispatch(BeepBaseActions.bleFailure(undefined))
    const TIME_OUT = 10   //seconds
    let isScanning = false

    return new Promise<Peripheral>((resolve, reject) => {
      const BleManagerDiscoverPeripheralSubscription = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', (peripheral: Peripheral) => {
        console.log('Found BLE peripheral', peripheral.id, peripheral.name);
        if (peripheral.advertising?.isConnectable) {
          if (!peripheral.name) {
            peripheral.name = peripheral.advertising?.localName
          }
          if (peripheral.name?.startsWith(startsWith)) {
            BleManagerDiscoverPeripheralSubscription && BleManagerDiscoverPeripheralSubscription.remove()
            BleManager.stopScan()
            resolve(peripheral)
          }
        }
      })

      const BleManagerStopScanSubscription = bleManagerEmitter.addListener('BleManagerStopScan', () => {
        BleManagerStopScanSubscription && BleManagerStopScanSubscription.remove()
        if (isScanning) {
          //if still scanning at this point no device matching filter was found
          reject()
        }
        isScanning = false
      })

      BleManager.enableBluetooth().then(() => {
        console.log("The bluetooth is already enabled or the user confirmed");
        isScanning = true
        BleManager.scan([/*BEEP_SERVICE*/], TIME_OUT, false).then((results) => {
          console.log('Scanning...')
        }).catch(err => {
          isScanning = false
          console.error(err)
          store.dispatch(BeepBaseActions.bleFailure(err))
        })
      })
      .catch((error) => {
        isScanning = false
        console.log("The user refuse to enable bluetooth", error)
        store.dispatch(BeepBaseActions.bleFailure(error))
      });
    })
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
          model = ResponseModel.parse(data)
          if (model.code > 0) {
            store.dispatch(BeepBaseActions.bleFailure(model.toString()))
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

        //clock
        case COMMANDS.READ_CLOCK:
          model = ClockModel.parse(data)
          store.dispatch(BeepBaseActions.setClock(model))
          break
      }
    }
  }

  static initLogFile() {
    //delete old log file
    RNFS.exists(BleHelpers.LOG_FILE_PATH).then((exists: boolean) => {
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

  static lastFrame: number = -1

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
    store.dispatch(BeepBaseActions.bleFailure(undefined))
    return BleHelpers.read(peripheralId, BATTERY_SERVICE, BATTERY_LEVEL_CHARACTERISTIC).then((value: any) => {
      const buffer: Buffer = Buffer.from(value)
      const model = new BatteryParser({ data: buffer }).parse()
      store.dispatch(BeepBaseActions.setBattery(model))
    }).catch(error => {
      store.dispatch(BeepBaseActions.bleFailure(error))
    })
  }

  static read(peripheralId: string, serviceUUID: string, characteristicUUID: string) {
    return BleManager.read(peripheralId, serviceUUID, characteristicUUID)
  }

  static write(peripheralId: string, command: any, params?: any) {
    store.dispatch(BeepBaseActions.bleFailure(undefined))

    const isString = function(value: any) {
      return typeof value === 'string' || value instanceof String
    }

    const isBuffer = function(obj: any) {
      return obj != null && obj.constructor != null && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
    }

    const isLittleEndian = (function () {
      let t32 = new Uint32Array(1);
      let t8 = new Uint8Array(t32.buffer);
      t8[0] = 0x0A;
      t8[1] = 0x0B;
      t8[2] = 0x0C;
      t8[3] = 0x0D;
      return t32[0] === 0x0D0C0B0A;
    })();
    const isBigEndian = !isLittleEndian;

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

    return BleManager.write(
      peripheralId,
      BEEP_SERVICE,
      CONTROL_POINT_CHARACTERISTIC,
      [...buffer]
    )
    .then(() => {
      console.log("Written data: " + BleHelpers.byteToHexString([...buffer]));
    })
    .catch((error) => {
      console.log(error)
      store.dispatch(BeepBaseActions.bleFailure(error))
    });
  }
}
