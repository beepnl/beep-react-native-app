import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import {RouteProp, NavigationProp} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import { ApplicationStyles, Colors, Fonts } from '@/App/Theme';
import styles from './styles';

// Utils
import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';
import ApiService from '@/App/Services/ApiService';

// Data
import { LoRaWanAppEUIModel } from '@/App/Models/LoRaWanAppEUIModel';
import { LoRaWanAppKeyModel } from '@/App/Models/LoRaWanAppKeyModel';
import { LoRaWanDeviceEUIModel } from '@/App/Models/LoRaWanDeviceEUIModel';
import { LoRaWanStateModel } from '@/App/Models/LoRaWanStateModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import ApiActions from '@/App/Stores/Api/Actions';
import { LoRaConfigState } from '@/App/Stores/Api/InitialState';
import { getLoRaConfigState } from '@/App/Stores/Api/Selectors';
import BeepBaseActions from '@/App/Stores/BeepBase/Actions';
import { getLoRaWanAppEUI, getLoRaWanAppKey, getLoRaWanDeviceEUI, getLoRaWanState, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';
import { getUseProduction } from '@/App/Stores/User/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import LoRaConnectionDiagnostics from '@/App/Components/LoRaConnectionDiagnostics';
import useInterval from '@/App/Helpers/useInterval';
import { ScrollView, Text, TouchableOpacity, View, TextInput, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';

const cleanHex = (str: string) => str.replace(/[^0-9A-Fa-f]/gi, '').toUpperCase();

const RETRY_COUNT = 8

interface Props {
  navigation: NavigationProp<any>,
  route: RouteProp<any, any>,
}

const WizardLoRaManualScreen: FunctionComponent<Props> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const useProduction = useTypedSelector<boolean>(getUseProduction)
  const fromSensorScreen = route.params?.fromSensorScreen
  const state: LoRaConfigState = useTypedSelector<LoRaConfigState>(getLoRaConfigState)
  const loRaWanDeviceEUI: LoRaWanDeviceEUIModel = useTypedSelector<LoRaWanDeviceEUIModel>(getLoRaWanDeviceEUI)
  const loRaWanAppEUI: LoRaWanAppEUIModel = useTypedSelector<LoRaWanAppEUIModel>(getLoRaWanAppEUI)
  const loRaWanAppKey: LoRaWanAppKeyModel = useTypedSelector<LoRaWanAppKeyModel>(getLoRaWanAppKey)
  const retry = useRef(RETRY_COUNT)
  const [configurationStarted, setConfigurationStarted] = useState(false)

  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const loRaWanState: LoRaWanStateModel = useTypedSelector<LoRaWanStateModel>(getLoRaWanState)

  const [devEui, setDevEui] = useState(loRaWanDeviceEUI?.devEUI ?? "")
  const [devEuiFormatted, setDevEuiFormatted] = useState(loRaWanDeviceEUI?.formatted ?? "")
  const [devEuiError, setDevEuiError] = useState("")
  const [appEui, setAppEui] = useState(loRaWanAppEUI?.appEUI ?? "")
  const [appEuiFormatted, setAppEuiFormatted] = useState(loRaWanAppEUI?.formatted ?? "")
  const [appEuiError, setAppEuiError] = useState("")
  const [appKey, setAppKey] = useState(loRaWanAppKey?.appKey ?? "")
  const [appKeyFormatted, setAppKeyFormatted] = useState(loRaWanAppKey?.formatted ?? "")
  const [appKeyError, setAppKeyError] = useState("")
  
  const onDevEuiChangeText = (text: string) => {
    setDevEui(cleanHex(text).slice(0, 16))
    setDevEuiFormatted(cleanHex(text).slice(0, 16))
    setDevEuiError("")
  }

  const onDevEuiValidate = () => {
    if (devEui.length == 16) {
      setDevEuiError("")
    } else {
      setDevEuiError(t("wizard.lora.manual.devEuiError"))
    }
  }

  const onAppEuiChangeText = (text: string) => {
    setAppEui(cleanHex(text).slice(0, 16))
    setAppEuiFormatted(cleanHex(text).slice(0, 16))
    setAppEuiError("")
  }

  const onAppEuiValidate = () => {
    if (appEui.length == 16) {
      setAppEuiError("")
    } else {
      setAppEuiError(t("wizard.lora.manual.appEuiError"))
    }
  }

  const onAppKeyChangeText = (text: string) => {
    setAppKey(cleanHex(text).slice(0, 32))
    setAppKeyFormatted(cleanHex(text).slice(0, 32))
    setAppKeyError("")
  }

  const onAppKeyValidate = () => {
    if (appKey.length == 32) {
      setAppKeyError("")
    } else {
      setAppKeyError(t("wizard.lora.manual.appKeyError"))
    }
  }

  const onSmartPaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      const cleaned = cleanHex(text);

      // Try JSON format first
      try {
        const json = JSON.parse(text);
        if (json.DevEUI || json.devEui || json.devEUI) onDevEuiChangeText(json.DevEUI || json.devEui || json.devEUI);
        if (json.AppEUI || json.appEui || json.appEUI || json.JoinEUI || json.joinEUI) onAppEuiChangeText(json.AppEUI || json.appEui || json.appEUI || json.JoinEUI || json.joinEUI);
        if (json.AppKey || json.appKey) onAppKeyChangeText(json.AppKey || json.appKey);
        return;
      } catch (e) {}

      // Fallback: If it's a raw continuous string, try to split it into the three keys if it's exactly 16+16+32 = 64 chars
      if (cleaned.length === 64) {
        onDevEuiChangeText(cleaned.slice(0, 16));
        onAppEuiChangeText(cleaned.slice(16, 32));
        onAppKeyChangeText(cleaned.slice(32, 64));
        return;
      }

      Alert.alert("Paste failed", "Could not parse JSON or valid raw credentials from clipboard. Try pasting into individual fields.");
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    dispatch(ApiActions.setLoRaConfigState("none"))
    dispatch(BeepBaseActions.setLoRaWanState(undefined))
    BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_STATE)
  }, [])

  useInterval(() => {
    BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_STATE)
    retry.current = retry.current - 1
    if (retry.current <= 0) {
      dispatch(ApiActions.setLoRaConfigState("failedToConnect"))
    }
  }, (state == "checkingConnectivity") && (retry.current > 0) ? 5000 : null)

  useEffect(() => {
    if (configurationStarted && state == "checkingConnectivity" && loRaWanState?.hasJoined) {
      dispatch(ApiActions.setLoRaConfigState("connected"))
    }
  }, [configurationStarted, dispatch, loRaWanState, state])

  const keysAreValid = 
    devEui.length > 0 && 
    devEuiError == "" && 
    appEui.length > 0 && 
    appEuiError == "" && 
    appKey.length > 0 && 
    appKeyError == ""

  const onSetCredentialsPress = () => {
    if (keysAreValid) {
      setConfigurationStarted(true)
      dispatch(ApiActions.configureLoRaManual(devEui, appEui, appKey.toUpperCase()))
      retry.current = RETRY_COUNT
    }
  }

  const onNextPress = () => {
    navigation.navigate("WizardLoRaOverviewScreen", { fromSensorScreen })
  }

  const displayState: LoRaConfigState = configurationStarted ? state : "none"

  return (<>
    <ScreenHeader title={t("wizard.lora.manual.screenTitle")} back />

    <ScrollView style={styles.container}>

      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
        <Text style={[styles.text, { flex: 1, paddingRight: 10 }]}>{t("wizard.lora.manual.description")}</Text>
        <TouchableOpacity onPress={onSmartPaste} style={{backgroundColor: Colors.yellow, padding: 10, borderRadius: 8}}>
          <Text style={{fontWeight: 'bold'}}>Smart Paste</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <Text style={[styles.itemText, { ...Fonts.style.bold }]}>{ApiService.getLoRaSensorsUrl(useProduction)}</Text>
      </View>

      <View style={styles.spacerDouble} />

      { displayState != "none" && <>
        <View style={styles.itemContainer}>
          <Text style={styles.itemText}>{t(`wizard.lora.automatic.state.${displayState}`)}</Text>
        </View>
        <View style={styles.spacerDouble} />
      </>}

      {/* Dev EUI */}
      <View style={ApplicationStyles.buttonsContainer}>
        <Text style={styles.label}>{t("wizard.lora.manual.devEui")}</Text>
        <Text style={styles.label}>{`(${devEui.length}/16)`}</Text>
      </View>
      <View style={styles.spacer} />
      <TextInput
        style={styles.input}
        onBlur={onDevEuiValidate}
        onChangeText={onDevEuiChangeText}
        value={devEuiFormatted}
        placeholder={t("wizard.lora.manual.devEuiPlaceholder")}
        placeholderTextColor={Colors.placeholder}
        autoCapitalize={"characters"}
        autoComplete={"off"}
        autoCorrect={false}
        returnKeyType={"next"}
      />
      { !!devEuiError && <>
        <View style={styles.spacerHalf} />
        <Text style={styles.error}>{devEuiError}</Text>
      </>}

      <View style={styles.spacerDouble} />

      {/* App EUI */}
      <View style={ApplicationStyles.buttonsContainer}>
        <Text style={styles.label}>{t("wizard.lora.manual.appEui")}</Text>
        <Text style={styles.label}>{`(${appEui.length}/16)`}</Text>
      </View>
      <View style={styles.spacer} />
      <TextInput
        style={styles.input}
        onBlur={onAppEuiValidate}
        onChangeText={onAppEuiChangeText}
        value={appEuiFormatted}
        placeholder={t("wizard.lora.manual.appEuiPlaceholder")}
        placeholderTextColor={Colors.placeholder}
        autoCapitalize={"characters"}
        autoComplete={"off"}
        autoCorrect={false}
        returnKeyType={"next"}
      />
      { !!appEuiError && <>
        <View style={styles.spacerHalf} />
        <Text style={styles.error}>{appEuiError}</Text>
      </>}

      <View style={styles.spacerDouble} />

      {/* App Key */}
      <View style={ApplicationStyles.buttonsContainer}>
        <Text style={styles.label}>{t("wizard.lora.manual.appKey")}</Text>
        <Text style={styles.label}>{`(${appKey.length}/32)`}</Text>
      </View>
      <View style={styles.spacer} />
      <TextInput
        style={styles.input}
        onBlur={onAppKeyValidate}
        onChangeText={onAppKeyChangeText}
        value={appKeyFormatted}
        placeholder={t("wizard.lora.manual.appKeyPlaceholder")}
        placeholderTextColor={Colors.placeholder}
        autoCapitalize={"characters"}
        autoComplete={"off"}
        autoCorrect={false}
        returnKeyType={"next"}
      />
      { !!appKeyError && <>
        <View style={styles.spacerHalf} />
        <Text style={styles.error}>{appKeyError}</Text>
      </>}

      <View style={styles.spacerDouble} />

      { displayState != "connected" && displayState != "writingCredentials" && displayState != "checkingConnectivity" &&
        <TouchableOpacity style={styles.button} onPress={onSetCredentialsPress} disabled={!keysAreValid && displayState != "writingCredentials" && displayState != "checkingConnectivity"}>
          <Text style={styles.text}>{t("wizard.lora.manual.setCredentialsButton")}</Text>
        </TouchableOpacity>
      }

      { configurationStarted && state == "connected" &&
        <LoRaConnectionDiagnostics
          loRaWanState={loRaWanState}
          peripheralId={pairedPeripheral?.id}
          isBleConnected={pairedPeripheral?.isConnected}
        />
      }

      <View style={styles.spacerDouble} />

    </ScrollView>

    { configurationStarted && state == "connected" &&
      <View style={styles.itemContainer}>
        <TouchableOpacity style={styles.button} onPress={onNextPress}>
          <Text style={styles.text}>{t("common.btnNext")}</Text>
        </TouchableOpacity>
      </View>
    }
  </>)
}

export default WizardLoRaManualScreen
