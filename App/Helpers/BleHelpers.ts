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
import { CellularStateParser } from '../Models/CellularStateModel';
import { CellularConfigParser } from '../Models/CellularConfigModel';
import { CellularStatusParser } from '../Models/CellularStatusModel';
import { CellularIMEIParser } from '../Models/CellularIMEIModel';
import { CellularPSMParser } from '../Models/CellularPSMModel';
import { CellularIntervalParser } from '../Models/CellularIntervalModel';
import { CellularAPNParser } from '../Models/CellularAPNModel';
import { CellularServerParser } from '../Models/CellularServerModel';
import { CellularModuleParser } from '../Models/CellularModuleModel';
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
  
  // Cellular commands (CIDs 46-55) - Fixed to match firmware exactly
  READ_CELLULAR_STATE : 0x2E,    // 46
  WRITE_CELLULAR_STATE : 0xAE,   // 46 | 0x80
  READ_CELLULAR_CONFIG : 0x2F,   // 47
  WRITE_CELLULAR_CONFIG : 0xAF,  // 47 | 0x80
  READ_CELLULAR_STATUS : 0x30,   // 48
  WRITE_CELLULAR_SEND : 0xB1,    // 49 | 0x80 (was 0xB0)
  READ_CELLULAR_IMEI : 0x32,     // 50 (was 0x31)
  READ_CELLULAR_PSM : 0x33,      // 51 (was 0x32)
  WRITE_CELLULAR_PSM : 0xB3,     // 51 | 0x80 (was 0xB2)
  READ_CELLULAR_INTERVAL : 0x34, // 52 (was 0x33)
  WRITE_CELLULAR_INTERVAL : 0xB4, // 52 | 0x80 (was 0xB3)
  READ_CELLULAR_APN : 0x35,      // 53 (was 0x34)
  WRITE_CELLULAR_APN : 0xB5,     // 53 | 0x80 (was 0xB4)
  READ_CELLULAR_SERVER : 0x36,   // 54 (was 0x35)
  WRITE_CELLULAR_SERVER : 0xB6,  // 54 | 0x80 (was 0xB5)
  READ_CELLULAR_MODULE : 0x37,   // 55
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type BluetoothState = 
"off" |                 // Bluetooth is turned off
"pairedConnected" |     // Bluetooth is on and all paired peripherals are connected
"pairedNotConnected" |  // Bluetooth is on and not all paired peripherals are connected
"noPaired"              // Bluetooth is on and there are no paired peripherals

export const BLE_NAME_PREFIX = "BEEPBASE-"
export const BEEP_SERVICE = "be4768a1-719f-4bad-5040-c6ebc5f8c31b"
export const CONTROL_POINT_CHARACTERISTIC = Platform.select({
  ios: "68b0",
  android: "000068b0-0000-1000-8000-00805f9b34fb",
}) 
export const LOG_FILE_CHARACTERISTIC = "be4768a3-719f-4bad-5040-c6ebc5f8c31b"
export const BATTERY_SERVICE = "0000180f-0000-1000-8000-00805f9b34fb"
export const BATTERY_LEVEL_CHARACTERISTIC = Platform.select({
  ios: "2a19",
  android: "00002a19-0000-1000-8000-00805f9b34fb",
})

export default class BleHelpers {

  static LOG_FILE_NAME = "BeepBaseLogFile.txt"
  static LOG_FILE_PATH = RNFS.CachesDirectoryPath + "/" + BleHelpers.LOG_FILE_NAME

  static BleManagerDidUpdateValueForControlPointCharacteristicSubscription: EmitterSubscription
  static BleManagerDidUpdateValueForTXLogCharacteristicSubscription: EmitterSubscription

  static enableBluetooth() {
    store.dispatch(BeepBaseActions.bleFailure(undefined))
    switch (Platform.OS) {
      case "ios":
        // Note: Direct Bluetooth settings linking not available (App-Prefs:Bluetooth rejected by Apple)
        // iOS automatically prompts users to enable Bluetooth when BLE operations are attempted
        return new Promise<void>((resolve) => {
          resolve() // iOS handles Bluetooth enabling automatically
        })
    
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

  static connectPeripheral(peripheralId: string, options: { timeout?: number, maxRetries?: number, retryDelay?: number } = {}) {
    const { timeout = 15000, maxRetries = 3, retryDelay = 2000 } = options
    store.dispatch(BeepBaseActions.bleFailure(undefined))
    
    return new Promise((resolve, reject) => {
      let attempt = 0
      let connectionTimeout: NodeJS.Timeout

      const attemptConnection = async () => {
        attempt++
        console.log(`Connection attempt ${attempt}/${maxRetries + 1} to ${peripheralId}`)
        
        try {
          // Check if already connected
          const isAlreadyConnected = await BleManager.isPeripheralConnected(peripheralId, [])
          if (isAlreadyConnected) {
            console.log('Already connected to', peripheralId)
            const services = await BleHelpers.retrieveServices(peripheralId)
            resolve(services)
            return
          }

          // Set connection timeout
          connectionTimeout = setTimeout(() => {
            console.log('Connection timeout reached')
            BleManager.disconnect(peripheralId, true).catch(() => {})
            
            if (attempt <= maxRetries) {
              console.log(`Connection timeout, retrying in ${retryDelay}ms...`)
              setTimeout(() => attemptConnection(), retryDelay)
            } else {
              const error = `Connection timeout after ${maxRetries + 1} attempts`
              store.dispatch(BeepBaseActions.bleFailure(error))
              reject(new Error(error))
            }
          }, timeout)

          // Attempt connection
          await BleManager.connect(peripheralId)
          console.log("Connected to", peripheralId)
          
          if (connectionTimeout) {
            clearTimeout(connectionTimeout)
            connectionTimeout = null
          }

          // Wait for connection to stabilize
          await delay(1000)
          
          // Configure MTU and retrieve services
          const retrieveServices = () => {
            return delay(500).then(() => {
              return BleHelpers.retrieveServices(peripheralId)
              .catch((error) => {
                console.log(error)
                store.dispatch(BeepBaseActions.bleFailure(error))
                throw error
              });
            });
          };

          let services
          if (Platform.OS === "android") {
            try {
              const mtu = await BleManager.requestMTU(peripheralId, 247 - 5)
              console.log("MTU size changed to " + mtu + " bytes")
              services = await retrieveServices()
            } catch (mtuError) {
              console.log('MTU request failed, continuing:', mtuError)
              services = await retrieveServices()
            }
          } else {
            //iOS kicks off an MTU exchange automatically upon connection.
            services = await retrieveServices()
          }
          
          resolve(services)
          
        } catch (error) {
          console.error(`Connection attempt ${attempt} failed:`, error)
          
          if (connectionTimeout) {
            clearTimeout(connectionTimeout)
            connectionTimeout = null
          }
          
          // Clean up partial connection
          try {
            await BleManager.disconnect(peripheralId, true)
          } catch (disconnectError) {
            console.log('Disconnect during cleanup failed:', disconnectError)
          }
          
          if (attempt <= maxRetries) {
            console.log(`Retrying connection in ${retryDelay}ms...`)
            setTimeout(() => attemptConnection(), retryDelay)
          } else {
            const message = `Failed to connect after ${maxRetries + 1} attempts: ${error}`
            store.dispatch(BeepBaseActions.bleFailure(message))
            reject(new Error(message))
          }
        }
      }

      attemptConnection()
    })
  }

  static scanPeripheralByName(startsWith: string, options: { timeout?: number, allowDuplicates?: boolean, maxRetries?: number } = {}): Promise<Peripheral> {
    const { timeout = 15, allowDuplicates = false, maxRetries = 3 } = options
    store.dispatch(BeepBaseActions.bleFailure(undefined))
    
    return new Promise<Peripheral>((resolve, reject) => {
      let attempt = 0
      let scanTimeout: NodeJS.Timeout
      let isScanning = false
      let foundPeripherals: Peripheral[] = []
      let discoverySubscription: any
      let stopScanSubscription: any

      const cleanup = () => {
        if (scanTimeout) clearTimeout(scanTimeout)
        discoverySubscription && discoverySubscription.remove()
        stopScanSubscription && stopScanSubscription.remove()
        isScanning = false
      }

      const attemptScan = () => {
        attempt++
        console.log(`BLE scan attempt ${attempt}/${maxRetries + 1}`)
        
        discoverySubscription = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', (peripheral: Peripheral) => {
          console.log('Found BLE peripheral', peripheral.id, peripheral.name, 'RSSI:', peripheral.rssi)
          
          // Validate peripheral
          if (!peripheral.advertising?.isConnectable) {
            console.log('Peripheral not connectable, skipping')
            return
          }
          
          // Normalize name
          if (!peripheral.name) {
            peripheral.name = peripheral.advertising?.localName
          }
          
          // Check if it matches our criteria
          if (peripheral.name?.startsWith(startsWith)) {
            // Check for duplicates
            if (!allowDuplicates && foundPeripherals.some(p => p.id === peripheral.id)) {
              return
            }
            
            foundPeripherals.push(peripheral)
            
            // For single device mode, connect to strongest signal
            if (!allowDuplicates) {
              cleanup()
              BleManager.stopScan()
              resolve(peripheral)
            }
          }
        })

        stopScanSubscription = bleManagerEmitter.addListener('BleManagerStopScan', () => {
          console.log('BLE scan stopped')
          if (isScanning) {
            if (foundPeripherals.length > 0) {
              // Return peripheral with strongest signal
              const bestPeripheral = foundPeripherals.reduce((prev, current) => 
                (prev.rssi > current.rssi) ? prev : current
              )
              cleanup()
              resolve(bestPeripheral)
            } else if (attempt <= maxRetries) {
              // Retry after delay
              console.log(`No devices found, retrying in 2 seconds...`)
              setTimeout(() => attemptScan(), 2000)
            } else {
              cleanup()
              reject(new Error(`No BEEP devices found after ${maxRetries + 1} attempts`))
            }
          }
        })

        // Set scan timeout
        scanTimeout = setTimeout(() => {
          if (isScanning) {
            console.log('BLE scan timeout reached')
            BleManager.stopScan()
          }
        }, timeout * 1000)

        switch (Platform.OS) {
          case "android":
            BleManager.enableBluetooth().then(() => {
              console.log("Bluetooth enabled, starting scan")
              isScanning = true
              foundPeripherals = []
              
              return BleManager.scan([BEEP_SERVICE], timeout, allowDuplicates)
            })
            .then(() => {
              console.log('BLE scanning started...')
            })
            .catch((error) => {
              console.error('BLE scan failed:', error)
              isScanning = false
              
              if (attempt <= maxRetries) {
                console.log(`Scan failed, retrying in 3 seconds...`)
                setTimeout(() => attemptScan(), 3000)
              } else {
                cleanup()
                const message = `Failed to start BLE scan after ${maxRetries + 1} attempts: ${error}`
                store.dispatch(BeepBaseActions.bleFailure(message))
                reject(new Error(message))
              }
            });
            break;
            
          case "ios":
            isScanning = true
            foundPeripherals = []
            
            BleManager.scan([BEEP_SERVICE], timeout, allowDuplicates).then(() => {
              console.log('BLE scanning started...')
            }).catch((error) => {
              console.error('BLE scan failed:', error)
              isScanning = false
              
              if (attempt <= maxRetries) {
                console.log(`Scan failed, retrying in 3 seconds...`)
                setTimeout(() => attemptScan(), 3000)
              } else {
                cleanup()
                const message = `Failed to start BLE scan: ${error}`
                store.dispatch(BeepBaseActions.bleFailure(message))
                reject(new Error(message))
              }
            })
            break;
        }
      }

      attemptScan()
    })
  }

  static scanForMultipleDevices(startsWith: string, options: { 
    timeout?: number, 
    maxDevices?: number,
    minRssi?: number 
  } = {}): Promise<Peripheral[]> {
    const { timeout = 15, maxDevices = 10, minRssi = -80 } = options
    store.dispatch(BeepBaseActions.bleFailure(undefined))
    
    return new Promise<Peripheral[]>((resolve, reject) => {
      let scanTimeout: NodeJS.Timeout
      let foundPeripherals: Peripheral[] = []
      let discoverySubscription: any
      let stopScanSubscription: any

      const cleanup = () => {
        if (scanTimeout) clearTimeout(scanTimeout)
        discoverySubscription?.remove()
        stopScanSubscription?.remove()
      }

      discoverySubscription = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', (peripheral: Peripheral) => {
        console.log('Found peripheral:', peripheral.name, 'RSSI:', peripheral.rssi)
        
        if (!peripheral.advertising?.isConnectable) return
        if (peripheral.rssi < minRssi) {
          console.log('Peripheral RSSI too weak:', peripheral.rssi)
          return
        }
        
        if (!peripheral.name) {
          peripheral.name = peripheral.advertising?.localName
        }
        
        if (peripheral.name?.startsWith(startsWith)) {
          // Avoid duplicates
          if (!foundPeripherals.some(p => p.id === peripheral.id)) {
            foundPeripherals.push(peripheral)
            console.log(`Found BEEP device: ${peripheral.name} (${foundPeripherals.length}/${maxDevices})`)
            
            if (foundPeripherals.length >= maxDevices) {
              cleanup()
              BleManager.stopScan()
              resolve(foundPeripherals.sort((a, b) => a.name?.localeCompare(b.name || '') || 0))
            }
          }
        }
      })

      stopScanSubscription = bleManagerEmitter.addListener('BleManagerStopScan', () => {
        cleanup()
        // Sort alphanumerically by name
        const sorted = foundPeripherals.sort((a, b) => a.name?.localeCompare(b.name || '') || 0)
        resolve(sorted)
      })

      scanTimeout = setTimeout(() => {
        BleManager.stopScan()
      }, timeout * 1000)

      switch (Platform.OS) {
        case "android":
          BleManager.enableBluetooth()
            .then(() => BleManager.scan([BEEP_SERVICE], timeout, true))
            .then(() => console.log('Scanning for multiple devices...'))
            .catch((error) => {
              cleanup()
              const message = `Failed to start device scan: ${error}`
              store.dispatch(BeepBaseActions.bleFailure(message))
              reject(new Error(message))
            })
          break
          
        case "ios":
          BleManager.scan([BEEP_SERVICE], timeout, true)
            .then(() => console.log('Scanning for multiple devices...'))
            .catch((error) => {
              cleanup()
              const message = `Failed to start device scan: ${error}`
              store.dispatch(BeepBaseActions.bleFailure(message))
              reject(new Error(message))
            })
          break
      }
    })
  }

  static onValueForCharacteristic({ value, peripheral, characteristic, service }) {
    // console.log(`Recieved ${data} for characteristic ${characteristic}`);
    
    // Normalize characteristic to handle platform differences
    const normalizedCharacteristic = characteristic.toLowerCase().replace(/-/g, '').slice(-4)
    const normalizedControlPoint = CONTROL_POINT_CHARACTERISTIC.toLowerCase().replace(/-/g, '').slice(-4)
    const normalizedLogFile = LOG_FILE_CHARACTERISTIC.toLowerCase().replace(/-/g, '').slice(-4)
    
    switch (normalizedCharacteristic) {
      case normalizedControlPoint:
        BleHelpers.handleControlPointCharacteristic({ value, peripheral })
        break

      case normalizedLogFile:
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

        // Cellular command handlers
        case COMMANDS.READ_CELLULAR_STATE:
          model = new CellularStateParser({ data }).parse()
          store.dispatch(BeepBaseActions.setCellularState(model))
          break

        case COMMANDS.READ_CELLULAR_CONFIG:
          model = new CellularConfigParser({ data }).parse()
          store.dispatch(BeepBaseActions.setCellularConfig(model))
          break

        case COMMANDS.READ_CELLULAR_STATUS:
          model = new CellularStatusParser({ data }).parse()
          store.dispatch(BeepBaseActions.setCellularStatus(model))
          break

        case COMMANDS.READ_CELLULAR_IMEI:
          model = new CellularIMEIParser({ data }).parse()
          store.dispatch(BeepBaseActions.setCellularImei(model))
          break

        case COMMANDS.READ_CELLULAR_PSM:
          model = new CellularPSMParser({ data }).parse()
          store.dispatch(BeepBaseActions.setCellularPsm(model))
          break

        case COMMANDS.READ_CELLULAR_INTERVAL:
          model = new CellularIntervalParser({ data }).parse()
          store.dispatch(BeepBaseActions.setCellularInterval(model))
          break

        case COMMANDS.READ_CELLULAR_APN:
          model = new CellularAPNParser({ data }).parse()
          store.dispatch(BeepBaseActions.setCellularApn(model))
          break

        case COMMANDS.READ_CELLULAR_SERVER:
          model = new CellularServerParser({ data }).parse()
          store.dispatch(BeepBaseActions.setCellularServer(model))
          break

        case COMMANDS.READ_CELLULAR_MODULE:
          model = new CellularModuleParser({ data }).parse()
          store.dispatch(BeepBaseActions.setCellularModule(model))
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

  static write(peripheralId: string, command: any, params?: any, options: { 
    maxRetries?: number, 
    retryDelay?: number,
    validateConnection?: boolean 
  } = {}) {
    const { maxRetries = 2, retryDelay = 1000, validateConnection = true } = options
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

    let attempt = 0
    
    const attemptWrite = async (): Promise<void> => {
      attempt++
      
      try {
        // Validate connection if requested
        if (validateConnection) {
          const isConnected = await BleManager.isPeripheralConnected(peripheralId, [])
          if (!isConnected) {
            throw new Error('Device not connected or connection invalid')
          }
        }

        // Use the bottleneck limiter for rate limiting
        await BleHelpers.limiter.schedule(async () => {
          await BleManager.write(
            peripheralId,
            BEEP_SERVICE,
            CONTROL_POINT_CHARACTERISTIC,
            [...buffer]
          )
        })
        
        console.log(`${Date.now()} Written data (attempt ${attempt}): ${BleHelpers.byteToHexString([...buffer])}`)
        
      } catch (error) {
        console.error(`Write attempt ${attempt} failed:`, error)
        
        if (attempt <= maxRetries) {
          console.log(`Retrying write in ${retryDelay}ms...`)
          await delay(retryDelay)
          return attemptWrite()
        } else {
          const message = `Failed to write after ${maxRetries + 1} attempts: ${error}`
          console.error(message)
          store.dispatch(BeepBaseActions.bleFailure(message))
          throw new Error(message)
        }
      }
    }

    return attemptWrite()
  }
}
