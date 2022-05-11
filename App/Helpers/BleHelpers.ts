// Utils
import BleManager from 'react-native-ble-manager'
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
// export const LOG_FILE_CHARACTERISTIC = "000068a3-0000-1000-8000-00805f9b34fb"
export const LOG_FILE_CHARACTERISTIC = "be4768a3-719f-4bad-5040-c6ebc5f8c31b"
export default class BleHelpers {

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

  static init(pairedPeripherals: Array<PairedPeripheralModel>) {
    console.log("BleManager start");
    return BleManager.start({
      showAlert: true,
      restoreIdentifierKey: "it.vandillen.beep.restoreIdentifierKey",
      queueIdentifierKey: "it.vandillen.beep.queueIdentifierKey",
    }).then(() => {
      //request usage of Bluetooth on Android (iOS is handled by OS via info.plist entry)
      if (Platform.OS === 'android' && Platform.Version >= 23) {
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
          if (result) {
            console.log("Permission is OK");
            // DISABLED RECONNECT
            // BleHelpers.connectPairedPeripherals(pairedPeripherals)
          } else {
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
              if (result) {
                console.log("User accepted permission");
                BleHelpers.connectPairedPeripherals(pairedPeripherals)
              } else {
                console.log("User refused permission");
              }
            });
          }
        });
      } else {
        BleHelpers.connectPairedPeripherals(pairedPeripherals)
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

  static onValueForCharacteristic({ value, peripheral, characteristic, service }) {
    // console.log(`Recieved ${data} for characteristic ${characteristic}`);
    if (characteristic.toLowerCase() == CONTROL_POINT_CHARACTERISTIC) {
      const buffer: Buffer = Buffer.from(value)
      const command = buffer.readInt8()
      const data: Buffer = buffer.subarray(1)
      switch (command) {
        case COMMANDS.READ_DS18B20_CONVERSION:
          const models = new TemperatureParser({ data }).parse()
          store.dispatch(BeepBaseActions.setTemperatures(models))
          break

        case COMMANDS.READ_MX_FLASH:
          console.log(data)
          break

        case COMMANDS.SIZE_MX_FLASH:
          const model = LogFileSizeModel.parse(data)
          store.dispatch(BeepBaseActions.setLogFileSize(model))
          break
      }
    }
  }

  static onValueForLogFileCharacteristic({ value, peripheral, characteristic, service }) {
    if (characteristic.toLowerCase() == LOG_FILE_CHARACTERISTIC) {
      const buffer: Buffer = Buffer.from(value)
      const model = LogFileFrameModel.parse(buffer)
      if (model) {
        store.dispatch(BeepBaseActions.addLogFileFrame(model))
      } else {
        //TODO: does not seem to work. How to know when transfer is ready?
        store.dispatch(BeepBaseActions.setLogFileProgress(1))
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
    return BleManager.isPeripheralConnected(peripheralId, [])
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
      if (Platform.OS == "android") {
        // return BleManager.removeBond(peripheral.id).finally(() => {
          return BleManager.disconnect(peripheral.id, true)
        // })
      } else if (Platform.OS == "ios") {
        return BleManager.disconnect(peripheral.id, true)
      }
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

  static write(peripheralId: string, data: any) {

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

    const buffer = Buffer.from(Array.isArray(data) ? data : [data])
    // if (isLittleEndian) {
    //   buffer.swap16()
    // }

    return BleManager.write(
      peripheralId,
      BEEP_SERVICE,
      CONTROL_POINT_CHARACTERISTIC,
      // Array.isArray(data) ? data : [data],
      // Array.isArray(data) ? data : [data],
      [...buffer]
    )
    .then(() => {
      console.log("Written data: " + BleHelpers.byteToHexString([data]));
    })
    .catch((error) => {
      console.log(error);
    });
  }
}
