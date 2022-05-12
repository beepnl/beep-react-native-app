import React, { FunctionComponent, useEffect, useRef, useState } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useTypedSelector } from 'App/Stores';
import useAppState from '../../Helpers/useAppState';

// Styles
import styles from './RootScreenStyle'

// Utils
import NavigationService from 'App/Services/NavigationService'
import AppNavigator from 'App/Navigators/AppNavigator'
import { NativeModules, NativeEventEmitter, ToastAndroid, Platform } from "react-native";
import BleManager, { Peripheral } from 'react-native-ble-manager'
import BleHelpers from '../../Helpers/BleHelpers';
import moment from 'moment'

// Redux
import StartupActions from 'App/Stores/Startup/Actions'
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import { getError } from 'App/Stores/Api/Selectors';
import { getPairedPeripherals } from 'App/Stores/Settings/Selectors'
import { PairedPeripheralModel } from 'App/Models/PairedPeripheral';
import { getLanguageCode } from 'App/Stores/Settings/Selectors';

// Components
import { View } from 'react-native'
import DropdownAlert from 'react-native-dropdownalert';
import i18n from '../../Localization';

const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);

interface RootScreenBaseProps {
  startup?: typeof StartupActions.startup;
}

const RootScreenBase: FunctionComponent<RootScreenBaseProps> = ({ startup }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const languageCode = useTypedSelector<string>(getLanguageCode)
  const [isScanning, setIsScanning] = useState(false)
  const dropDownAlert = useRef<DropdownAlert>(null);
  const error = useSelector(getError)
  const pairedPeripherals: Array<PairedPeripheralModel> = useTypedSelector<Array<PairedPeripheralModel>>(getPairedPeripherals)
  const { appState } = useAppState();

  useEffect(() => {
    dispatch(StartupActions.startup())

    const BleManagerDiscoverPeripheralSubscription = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', (peripheral: Peripheral) => {
      console.log('Found BLE peripheral', peripheral.id, peripheral.name);
      if (pairedPeripherals) {
        const pairedPeripheral = pairedPeripherals.find(p => p.id == peripheral.id)
        if (pairedPeripheral) {
          //found paired peripheral
          BleManager.stopScan().then(() => {
            setIsScanning(false)
              // DISABLED RECONNECT
            // BleHelpers.connectPeripheral(pairedPeripheral.id)
          })
        }
      }
    });

    const BleManagerConnectPeripheralSubscription = bleManagerEmitter.addListener("BleManagerConnectPeripheral", (args) => {
      const peripheralId: string = args?.peripheral
      // Platform.OS == "android" && ToastAndroid.show("BleManagerConnectPeripheral " + peripheralId, ToastAndroid.SHORT);
      if (pairedPeripherals) {
        const peripheral = pairedPeripherals.find(p => p.id == peripheralId)
        if (peripheral) {
          const updated = {
            ...peripheral,
            isConnected: true,
          }
          dispatch(BeepBaseActions.setPairedPeripheral(updated))
        }
      }
    });

    const BleManagerDisconnectPeripheralSubscription = bleManagerEmitter.addListener("BleManagerDisconnectPeripheral", (args) => {
      // dispatch(BeepBaseActions.clearPairedPeripheral())
    });

    BleHelpers.init(pairedPeripherals)
    
    return (() => {
      BleManagerDiscoverPeripheralSubscription && BleManagerDiscoverPeripheralSubscription.remove()
      BleManagerConnectPeripheralSubscription && BleManagerConnectPeripheralSubscription.remove()
      BleManagerDisconnectPeripheralSubscription && BleManagerDisconnectPeripheralSubscription.remove()
    })
  }, [])
  
  useEffect(() => {
    if (pairedPeripherals && appState == "active") {
      let scanning = false    //also need a local flag because useState setter is async
      pairedPeripherals.forEach((peripheral: PairedPeripheralModel) => {
        BleHelpers.isConnected(peripheral.id).then((isConnected : boolean) => {
          if (peripheral.isConnected != isConnected) {
            const updated = {
              ...peripheral,
              isConnected,
            }
            dispatch(BeepBaseActions.setPairedPeripheral(updated))
  
            if (!isConnected && !isScanning && !scanning) {
              // DISABLED RECONNECT
              //reconnect by scanning
              // scanning = true
              // BleManager.scan([], 10, false).then(() => {
              //   setIsScanning(true)
              // })
            }
          }
        })
      })
    }
  }, [pairedPeripherals, appState])

  useEffect(() => {
    i18n.changeLanguage(languageCode)
    moment.locale(languageCode)
  }, [languageCode])

  useEffect(() => {
    if (error && dropDownAlert?.current) {
      const apiMessage = error.api?.error?.message
      const message = t(`error.${error.problem}`, apiMessage)
      dropDownAlert.current.alertWithType('error', t("common.error"), message);
    }
  }, [error])

  return (
    <View style={styles.mainContainer}>
      <AppNavigator
        // Initialize the NavigationService (see https://reactnavigation.org/docs/en/navigating-without-navigation-prop.html)
        ref={(navigatorRef) => {
          NavigationService.setTopLevelNavigator(navigatorRef)
        }}
      />
      <DropdownAlert ref={dropDownAlert} />
    </View>
  )
}

export default RootScreenBase
