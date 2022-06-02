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
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type BluetoothState = 
"off" |                 // Bluetooth is turned off
"pairedConnected" |     // Bluetooth is on and all paired peripherals are connected
"pairedNotConnected" |  // Bluetooth is on and not all paired peripherals are connected
"noPaired"              // Bluetooth is on and there are no paired peripherals

export const BEEP_SERVICE = "be4768a1-719f-4bad-5040-c6ebc5f8c31b"
export const CONTROL_POINT_CHARACTERISTIC = "000068b0-0000-1000-8000-00805f9b34fb"
export const LOG_FILE_CHARACTERISTIC = "be4768a3-719f-4bad-5040-c6ebc5f8c31b"

export default class BleHelpers {

  static LOG_FILE_NAME = "BeepBaseLogFile.txt"
  static LOG_FILE_PATH = RNFS.CachesDirectoryPath + "/" + BleHelpers.LOG_FILE_NAME

  static BleManagerDidUpdateValueForControlPointCharacteristicSubscription: EmitterSubscription
  static BleManagerDidUpdateValueForTXLogCharacteristicSubscription: EmitterSubscription

  static enableBluetooth() {
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
          console.log("The user did not enable bluetooth. Error:", error);
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

  static init(peripheral: PairedPeripheralModel) {
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
      } else if (Platform.OS === 'android' && Platform.Version >= 23) {
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
          if (result) {
            console.log("Permission is ACCESS_FINE_LOCATION OK");
            // DISABLED RECONNECT
            // BleHelpers.connectPairedPeripherals(pairedPeripherals)
          } else {
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
              if (result) {
                console.log("User accepted ACCESS_FINE_LOCATION permission");
                // DISABLED RECONNECT
                // BleHelpers.connectPairedPeripherals(pairedPeripherals)
              } else {
                console.log("User refused ACCESS_FINE_LOCATION permission");
              }
            });
          }
        });
      } else {
        // DISABLED RECONNECT
        // BleHelpers.connectPairedPeripherals(pairedPeripherals)
      }    
    })
  }

  static reconnect(pairedPeripherals: Array<PairedPeripheralModel>) {
    console.log("reconnect")
    BleManager.scan([], 15, false).then((results) => {
    })
  }

  static connectPairedPeripherals(pairedPeripherals: Array<PairedPeripheralModel>) {
    console.log("connectPairedPeripherals")
    if (pairedPeripherals && pairedPeripherals.length > 0) {
      // console.log("scanning from connectPairedPeripherals")
      // BleManager.scan([], 10, false).then(() => {
        // console.log("waiting 10 seconds for scan to finish")
        // return delay(10000).then(() => {
          // console.log("after 10 seconds foreach paired peripheral")
          pairedPeripherals.forEach((pairedPeripheral) => {
            return BleManager.connect(pairedPeripheral.id).then(() => {
              console.log("Connected to " + pairedPeripheral.name)
              // BleManager.retrieveServices(pairedPeripheral.id)
              return BleHelpers.retrieveServices(pairedPeripheral.id)
            })
            .catch(() => {
              console.log("Failed to connect to " + pairedPeripheral.name);
            });
          })
        // }).catch(error => {
          // console.error(error);
        // });
      // })
    }
  }

  static connectPeripheral(peripheralId: string) {
    return BleManager.connect(peripheralId).then(() => {
      console.log("Connected to " + peripheralId)
      return delay(500).then(() => {
        return BleHelpers.retrieveServices(peripheralId)
        .catch((error) => {
          console.log(error);
        })
      })
    })
    .catch((error) => {
      console.log(error);
    })
  }

  static scanPeripheralByName(startsWith: string): Promise<Peripheral> {
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
        })
      })
      .catch((error) => {
        console.log("The user refuse to enable bluetooth", error);
      });
    })
  }

  static onValueForCharacteristic({ value, peripheral, characteristic, service }) {
    // console.log(`Recieved ${data} for characteristic ${characteristic}`);
    if (characteristic.toLowerCase() == CONTROL_POINT_CHARACTERISTIC) {
      const buffer: Buffer = Buffer.from(value)
      const command = buffer.readInt8()
      const data: Buffer = buffer.subarray(1)
      let model
      switch (command) {
        case COMMANDS.READ_FIRMWARE_VERSION:
          model = new FirmwareVersionParser({ data }).parse()
          store.dispatch(BeepBaseActions.setFirmwareVersion(model))
          break

        case COMMANDS.READ_HARDWARE_VERSION:
          model = new HardwareVersionParser({ data }).parse()
          store.dispatch(BeepBaseActions.setHardwareVersion(model))
          break

        case COMMANDS.READ_DS18B20_CONVERSION:
          const models = new TemperatureParser({ data }).parse()
          store.dispatch(BeepBaseActions.setTemperatures(models))
          break

        case COMMANDS.READ_ATECC_READ_ID:
          model = new AteccParser({ data }).parse()
          store.dispatch(BeepBaseActions.setHardwareId(model))
          break

        case COMMANDS.READ_MX_FLASH:
          console.log(data)
          break

        case COMMANDS.SIZE_MX_FLASH:
          model = LogFileSizeModel.parse(data)
          store.dispatch(BeepBaseActions.setLogFileSize(model))
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

  static onValueForLogFileCharacteristic({ value, peripheral, characteristic, service }) {
    if (characteristic.toLowerCase() == LOG_FILE_CHARACTERISTIC) {
      const buffer: Buffer = Buffer.from(value)
      const model = LogFileFrameModel.parse(buffer)
      if (model) {
        store.dispatch(BeepBaseActions.addLogFileFrame(model))
        RNFS.appendFile(BleHelpers.LOG_FILE_PATH, model.data.toString("hex"))
        .catch((err) => {
          console.log("Error writing log file frame", err);
        });
      }
    }
  }

  static retrieveServices(peripheralId: string) {
    console.log("BleHelpers retrieveServices")
    return delay(500).then(() => {
      return BleManager.retrieveServices(peripheralId).then((peripheralInfo) => {
        // console.log("Peripheral info:", peripheralInfo);
        console.log("retrieveServices OK")
        BleManager.startNotification(peripheralId, BEEP_SERVICE, CONTROL_POINT_CHARACTERISTIC).then(() => {
          console.log("Notification BEEP CONTROL POINT subscribed")
          BleHelpers.BleManagerDidUpdateValueForControlPointCharacteristicSubscription && BleHelpers.BleManagerDidUpdateValueForControlPointCharacteristicSubscription.remove()
          BleHelpers.BleManagerDidUpdateValueForControlPointCharacteristicSubscription = bleManagerEmitter.addListener("BleManagerDidUpdateValueForCharacteristic", BleHelpers.onValueForCharacteristic);
        })
        BleManager.startNotification(peripheralId, BEEP_SERVICE, LOG_FILE_CHARACTERISTIC).then(() => {
          console.log("Notification LOG FILE subscribed")
          BleHelpers.BleManagerDidUpdateValueForTXLogCharacteristicSubscription && BleHelpers.BleManagerDidUpdateValueForTXLogCharacteristicSubscription.remove()
          BleHelpers.BleManagerDidUpdateValueForTXLogCharacteristicSubscription = bleManagerEmitter.addListener("BleManagerDidUpdateValueForCharacteristic", BleHelpers.onValueForLogFileCharacteristic);
        })
      })
      .catch((error) => {
        console.log("Failed to retrieve services of " + peripheralId + ". Error: " + error);
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

  static write(peripheralId: string, command: any, params?: any) {

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

    const arrayCommand = Array.isArray(command) ? command : [command]
    const arrayParams = Array.isArray(params) ? params : [params]
    const arrayCommandParams = [...arrayCommand, arrayParams]
    const buffer = Buffer.from(arrayCommandParams)
    // const buffer = Buffer.from(Array.isArray(command) ? command : [command])

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
      console.log("Written data: " + BleHelpers.byteToHexString([command]));
    })
    .catch((error) => {
      console.log(error);
    });
  }
}
