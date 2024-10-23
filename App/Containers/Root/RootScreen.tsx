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
import { NativeModules, NativeEventEmitter, Text } from "react-native";
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';
import moment from 'moment'
import i18n from '../../Localization';
import api from 'App/Services/ApiService'

// Data
import StartupActions from 'App/Stores/Startup/Actions'
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import { getError as getApiError } from 'App/Stores/Api/Selectors';
import { getError as getBleError } from 'App/Stores/BeepBase/Selectors';
import { getDfuUpdating } from 'App/Stores/BeepBase/Selectors';
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
  const dropDownAlert = useRef<DropdownAlert>(null);
  const apiError: any = useTypedSelector<any>(getApiError)
  const bleError: string = useTypedSelector<any>(getBleError)
  const token: string = useTypedSelector<string>(getToken)
  const peripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const { appState } = useAppState();
  const isDfuUpdating: boolean = useTypedSelector<any>(getDfuUpdating)

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

    BleHelpers.init()

    if (token) {
      api.setToken(token)
    }
    
    return (() => {
      BleManagerConnectPeripheralSubscription && BleManagerConnectPeripheralSubscription.remove()
      BleManagerDisconnectPeripheralSubscription && BleManagerDisconnectPeripheralSubscription.remove()
    })
  }, [])
  
  useEffect(() => {
    if (peripheral && appState == "active") {
      BleHelpers.isConnected(peripheral.id).then((isConnected : boolean) => {
        if (peripheral.isConnected != isConnected) {
          const updated = {
            ...peripheral,
            isConnected,
          }
          dispatch(BeepBaseActions.setPairedPeripheral(updated))
        }
      })
    }
  }, [peripheral, appState])

  useEffect(() => {
    if (peripheral?.isConnected) {
      const params = Buffer.alloc(4)
      params.writeUint32BE((new Date().valueOf() + 1300) / 1000, 0)
      BleHelpers.write(peripheral.id, COMMANDS.WRITE_CLOCK, params)
      if (dropDownAlert?.current) {       
        dropDownAlert.current.alertWithType('success', t("root.clockSyncTitle"), t("root.clockSyncMessage"));
      }
    }
  }, [peripheral])

  useEffect(() => {
    i18n.changeLanguage(languageCode)
    moment.locale(languageCode)
  }, [languageCode])

  useEffect(() => {
    if (apiError && dropDownAlert?.current) {
      const apiMessage = apiError.message
      const message = t(`error.${apiError.problem}`, apiMessage)
      dropDownAlert.current.alertWithType('error', t("common.error"), message);
    }
  }, [apiError])

  useEffect(() => {
    if (bleError && (!isDfuUpdating) && dropDownAlert?.current) {
      dropDownAlert.current.alertWithType('error', t("common.error"), bleError);
    }
  }, [bleError])

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
