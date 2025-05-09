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
import GlobalActions from 'App/Stores/Global/Actions'
import { getError as getApiError } from 'App/Stores/Api/Selectors';
import { getError as getBleError } from 'App/Stores/BeepBase/Selectors';
import { getDfuUpdating } from 'App/Stores/BeepBase/Selectors';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { PairedPeripheralModel } from 'App/Models/PairedPeripheral';
import { getToken } from 'App/Stores/User/Selectors';
import { getLanguageCode } from 'App/Stores/Settings/Selectors';
import { getAppMode } from 'App/Stores/Global/Selectors';
import { AppMode } from 'App/Stores/Global/InitialState';

// Components
import { View } from 'react-native'
import DropdownAlert from 'react-native-dropdownalert';
import WebView from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from 'App/Theme';

const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);

type Env = "prod" | "test"

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
  const appMode: AppMode = useTypedSelector<AppMode>(getAppMode)
  const [env, setEnv] = useState<Env>("prod")

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

  const ACTION_NEW_BEEP_BASE = "NewBeepBase";
  const ACTION_EDIT_BEEP_BASE = "EditBeepBase";
  const ACTION_SWITCH_ENV = "SwitchEnv";

  const injectedJavaScriptBeforeContentLoaded = `
    (function() {
      // New button
      const newButton = document.createElement("button");
      newButton.innerText = "New";
      newButton.style.position = "fixed";
      newButton.style.top = "5px";
      newButton.style.right = "100px";
      newButton.style.zIndex = "9999";
      newButton.style.padding = "10px";
      newButton.style.background = "blue";
      newButton.style.color = "white";
      newButton.style.border = "none";
      newButton.style.borderRadius = "5px";
      newButton.style.fontSize = "16px";
      newButton.onclick = function() {
        window.ReactNativeWebView.postMessage("${ACTION_NEW_BEEP_BASE}");
      };
      document.addEventListener("DOMContentLoaded", function() {
        document.body.appendChild(newButton);
      });

      // Edit button
      const editButton = document.createElement("button");
      editButton.innerText = "Edit Beep base";
      editButton.style.position = "fixed";
      editButton.style.top = "5px";
      editButton.style.right = "10px";
      editButton.style.zIndex = "9999";
      editButton.style.padding = "10px";
      editButton.style.background = "blue";
      editButton.style.color = "white";
      editButton.style.border = "none";
      editButton.style.borderRadius = "5px";
      editButton.style.fontSize = "16px";
      editButton.onclick = function() {
        window.ReactNativeWebView.postMessage("${ACTION_EDIT_BEEP_BASE}");
      };
      document.addEventListener("DOMContentLoaded", function() {
        // document.body.appendChild(editButton);
      });

      // Env button
      const envButton = document.createElement("button");
      envButton.innerText = "${env}";
      envButton.style.position = "fixed";
      envButton.style.top = "5px";
      envButton.style.right = "10px";
      envButton.style.zIndex = "9999";
      envButton.style.padding = "10px";
      envButton.style.background = "blue";
      envButton.style.color = "white";
      envButton.style.border = "none";
      envButton.style.borderRadius = "5px";
      envButton.style.fontSize = "16px";
      envButton.onclick = function() {
        window.ReactNativeWebView.postMessage("${ACTION_SWITCH_ENV}");
      };
      document.addEventListener("DOMContentLoaded", function() {
        document.body.appendChild(envButton);
      });

      //set auth token from native into web view local storage for single sign on
      const TOKEN_KEY = 'auth.beepToken';
      let tk = window.localStorage.getItem(TOKEN_KEY);
      if (tk) {
        tk = tk.replaceAll('"', '');    //token is mistakenly stored with quotes
      }
      if (tk != '${token}') {
        window.localStorage.setItem(TOKEN_KEY, '"${token}"');
        window.location.reload();
      }
    })();
  `;

  const handleWebViewMessage = (event: any) => {
    switch (event.nativeEvent.data) {
      case ACTION_NEW_BEEP_BASE:
        dispatch(GlobalActions.setAppMode({ mode: "app", params: { screen: "Wizard" } }))
        break;
      case ACTION_EDIT_BEEP_BASE:
        dispatch(GlobalActions.setAppMode({ mode: "app", params: { screen: "PeripheralDetailScreen", devEUI: "49b55e035a658a3d" } })) //TODO: get devEUI from webview
        break;
      case ACTION_SWITCH_ENV:
        setEnv((prevEnv) => prevEnv === "prod" ? "test" : "prod")
        break;
      default:
        break;
    }
  };

  console.log("appMode", appMode)

  return (
    <View style={styles.mainContainer}>
      <NavigationContainer ref={navigationRef}>
        { !token && <AuthStack /> }
        { !!token && 
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.yellow }} edges={["top"]}>
              <WebView
                style={{ flex: 1 }}
                source={{ uri: env == "prod" ? "https://app.beep.nl" : "https://app-test.beep.nl" }}
                javaScriptEnabled={true}
                injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
                onMessage={handleWebViewMessage}
              />
            </SafeAreaView>
        }
        { !!token && appMode.mode === "app" && <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}><AppStack /></View> }
      </NavigationContainer>
      <DropdownAlert ref={dropDownAlert} />
    </View>
  )
}

export default RootScreenBase
