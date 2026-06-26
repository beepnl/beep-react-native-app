import React, { FunctionComponent, useEffect, useRef } from 'react';

// Hooks
import useAppState from '@/App/Helpers/useAppState';
import { useTypedSelector } from '@/App/Stores';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import styles from './RootScreenStyle';

// Utils
import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';
import i18n from '@/App/Localization';
import api from '@/App/Services/ApiService';
import { navigationRef } from '@/App/Services/NavigationService';
import { NavigationContainer } from '@react-navigation/native';
import moment from 'moment';
import BleManager from 'react-native-ble-manager';
import { AppStack, AuthStack } from './AppNavigation';

// Data
import { getError as getApiError } from '@/App/Stores/Api/Selectors';
import BeepBaseActions from '@/App/Stores/BeepBase/Actions';
import { getError as getBleError, getDfuUpdating } from '@/App/Stores/BeepBase/Selectors';
import { getLanguageCode } from '@/App/Stores/Settings/Selectors';
import StartupActions from '@/App/Stores/Startup/Actions';
import { getToken } from '@/App/Stores/User/Selectors';

// Data
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import { getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';

// Components
import { Colors } from '@/App/Theme';
import { View } from 'react-native';
import DropdownAlert from 'react-native-dropdownalert';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RootScreenBaseProps {
  startup?: typeof StartupActions.startup;
}

const RootScreenBase: FunctionComponent<RootScreenBaseProps> = ({ startup }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const languageCode = useTypedSelector<string>(getLanguageCode)
  const dropDownAlert = useRef<typeof DropdownAlert>(null);
  const apiError: any = useTypedSelector<any>(getApiError)
  const bleError: string = useTypedSelector<any>(getBleError)
  const token: string = useTypedSelector<string>(getToken)
  const peripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const { appState } = useAppState();
  const isDfuUpdating: boolean = useTypedSelector<any>(getDfuUpdating)
  const isConnected = peripheral && peripheral.isConnected
  const params = Buffer.alloc(4)

  const peripheralRef = useRef(peripheral);
  useEffect(() => {
    peripheralRef.current = peripheral;
  }, [peripheral]);

  useEffect(() => {
    dispatch(StartupActions.startup())

    const BleManagerConnectPeripheralSubscription = BleManager.onConnectPeripheral((args: any) => {
      const peripheralId: string = args?.peripheral
      const currentPeripheral = peripheralRef.current
      if (currentPeripheral && currentPeripheral.id == peripheralId) {
        const updated = {
          ...currentPeripheral,
          isConnected: true,
        }
        dispatch(BeepBaseActions.setPairedPeripheral(updated))

        /*
        if (peripheral)
            {
        params.writeUint32BE((new Date().valueOf() + 1300) / 1000, 0)
        BleHelpers.write(peripheral.id, COMMANDS.WRITE_CLOCK, params)
            //console.log('clock synced from rootscreen')
            if (dropDownAlert?.current) {       
                dropDownAlert.current.alertWithType('success', 'Clock sync', 'Internal clock has been synchronized', params);
              }
            }
        */
      }
    });

    const BleManagerDisconnectPeripheralSubscription = BleManager.onDisconnectPeripheral((args: any) => {
      const peripheralId: string = args?.peripheral
      const currentPeripheral = peripheralRef.current
      if (currentPeripheral && currentPeripheral.id == peripheralId) {
        const updated = {
          ...currentPeripheral,
          isConnected: false,
        }
        dispatch(BeepBaseActions.setPairedPeripheral(updated))


      }
    });

    BleHelpers.init().catch(error => {
      console.error('[ROOT] BleHelpers.init() failed:', error)
    })

    if (token) {
      api.setToken(token)
    }

    return (() => {
      BleManagerConnectPeripheralSubscription?.remove()
      BleManagerDisconnectPeripheralSubscription?.remove()
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

          if (peripheral)
          {    
      params.writeUint32BE((new Date().valueOf() + 1300) / 1000, 0)
      BleHelpers.write(peripheral.id, COMMANDS.WRITE_CLOCK, params)
          //console.log('clock synced from rootscreen')
          if (dropDownAlert?.current) {       
              dropDownAlert.current.alertWithType('success', 'Clock sync', 'Internal clock has been synchronized', params);
            }
        }
      }
      })
    }
  }, [peripheral, appState])

  useEffect(() => {
    i18n.changeLanguage(languageCode)
    moment.locale(languageCode)
  }, [languageCode])
  
  /*
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
  */

  return (
    <View style={styles.mainContainer}>
      <NavigationContainer ref={navigationRef}>
        { !token && 
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top', 'bottom']}>
            <AuthStack />
          </SafeAreaView>
        }
        { !!token && 
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.yellow }} edges={['top']}>
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={['bottom']}>
              <AppStack /> 
            </SafeAreaView>
          </SafeAreaView>
        }
      </NavigationContainer>
      <DropdownAlert ref={dropDownAlert} />
    </View>
  )
}

export default RootScreenBase
