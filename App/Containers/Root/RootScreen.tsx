import React, { FunctionComponent, useEffect, useRef, useState } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useTypedSelector } from 'App/Stores';
import useAppState from '../../Helpers/useAppState';

// Styles
import styles from './RootScreenStyle'

// Utils
import { NavigationContainer } from '@react-navigation/native';
import { AuthStack, AppStack } from './AppNavigation';
import { navigationRef } from '../../Services/NavigationService';
import { NativeModules, NativeEventEmitter, ToastAndroid, Platform } from "react-native";
import BleManager, { Peripheral } from 'react-native-ble-manager'
import BleHelpers from '../../Helpers/BleHelpers';
import moment from 'moment'
import i18n from '../../Localization';
import api from 'App/Services/ApiService'

// Data
import StartupActions from 'App/Stores/Startup/Actions'
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import { getError } from 'App/Stores/Api/Selectors';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { PairedPeripheralModel } from 'App/Models/PairedPeripheral';
import { getToken } from 'App/Stores/User/Selectors';
import { getLanguageCode } from 'App/Stores/Settings/Selectors';

// Components
import { View } from 'react-native'
import DropdownAlert from 'react-native-dropdownalert';

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
  const token: string = useTypedSelector<string>(getToken)
  const peripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  // const pairedPeripherals: Array<PairedPeripheralModel> = useTypedSelector<Array<PairedPeripheralModel>>(getPairedPeripherals)
  const { appState } = useAppState();

  useEffect(() => {
    dispatch(StartupActions.startup())

    const BleManagerConnectPeripheralSubscription = bleManagerEmitter.addListener("BleManagerConnectPeripheral", (args) => {
      const peripheralId: string = args?.peripheral
      if (peripheral && peripheral.id == peripheralId) {
        const updated = {
          ...peripheral,
          isConnected: true,
        }
        dispatch(BeepBaseActions.setPairedPeripheral(updated))
      }
    });

    const BleManagerDisconnectPeripheralSubscription = bleManagerEmitter.addListener("BleManagerDisconnectPeripheral", (args) => {
      const peripheralId: string = args?.peripheral
      if (peripheral && peripheral.id == peripheralId) {
        const updated = {
          ...peripheral,
          isConnected: false,
        }
        dispatch(BeepBaseActions.setPairedPeripheral(updated))
      }
    });

    BleHelpers.init(peripheral)

    if (token) {
      api.setToken(token)
    }
    
    return (() => {
      // BleManagerDiscoverPeripheralSubscription && BleManagerDiscoverPeripheralSubscription.remove()
      BleManagerConnectPeripheralSubscription && BleManagerConnectPeripheralSubscription.remove()
      BleManagerDisconnectPeripheralSubscription && BleManagerDisconnectPeripheralSubscription.remove()
    })
  }, [])
  
  useEffect(() => {
    if (peripheral && appState == "active") {
      let scanning = false    //also need a local flag because useState setter is async
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
    }
  }, [peripheral, appState])

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
      <NavigationContainer ref={navigationRef}>
        { !token && <AuthStack /> }
        { !!token && <AppStack /> }
      </NavigationContainer>
      <DropdownAlert ref={dropDownAlert} />
    </View>
  )
}

export default RootScreenBase
