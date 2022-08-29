import React, { FunctionComponent, useEffect, useState, useCallback, useRef } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { CommonActions, RouteProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './styles'
import { ApplicationStyles, Colors, Fonts, Images, Metrics } from '../../Theme';

// Utils
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';
import ApiService from '../../Services/ApiService';

// Data
import ApiActions from 'App/Stores/Api/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getLoRaWanState } from '../../Stores/BeepBase/Selectors';
import { LoRaWanStateModel } from '../../Models/LoRaWanStateModel';
import { getLoRaConfigState } from '../../Stores/Api/Selectors';
import { LoRaConfigState } from '../../Stores/Api/InitialState';
import { getUseProduction } from '../../Stores/User/Selectors';

// Components
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import useInterval from '../../Helpers/useInterval';
import TextInputMask from 'react-native-text-input-mask';

const RETRY_COUNT = 8

interface Props {
  navigation: StackNavigationProp,
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
  const retry = useRef(RETRY_COUNT)

  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const loRaWanState: LoRaWanStateModel = useTypedSelector<LoRaWanStateModel>(getLoRaWanState)

  const [devEui, setDevEui] = useState("")
  const [devEuiFormatted, setDevEuiFormatted] = useState("")
  const [devEuiError, setDevEuiError] = useState("")
  const [appEui, setAppEui] = useState("")
  const [appEuiFormatted, setAppEuiFormatted] = useState("")
  const [appEuiError, setAppEuiError] = useState("")
  const [appKey, setAppKey] = useState("")
  const [appKeyFormatted, setAppKeyFormatted] = useState("")
  const [appKeyError, setAppKeyError] = useState("")
  
  const onDevEuiChangeText = (formatted: string, extracted?: string | undefined) => {
    setDevEui(extracted || "")
    setDevEuiFormatted(formatted)
  }

  const onDevEuiValidate = () => {
    if (devEui.match(/^[0-9A-F]+$/) && devEui.length == 16) {
      setDevEuiError("")
    } else {
      setDevEuiError(t("wizard.lora.manual.devEuiError"))
    }
  }

  const onAppEuiChangeText = (formatted: string, extracted?: string | undefined) => {
    setAppEui(extracted || "")
    setAppEuiFormatted(formatted)
  }

  const onAppEuiValidate = () => {
    if (appEui.match(/^[0-9A-F]+$/) && appEui.length == 16) {
      setAppEuiError("")
    } else {
      setAppEuiError(t("wizard.lora.manual.appEuiError"))
    }
  }

  const onAppKeyChangeText = (formatted: string, extracted?: string | undefined) => {
    setAppKey(extracted || "")
    setAppKeyFormatted(formatted)
  }

  const onAppKeyValidate = () => {
    if (appKey.match(/^[0-9A-F]+$/) && appKey.length == 32) {
      setAppKeyError("")
    } else {
      setAppKeyError(t("wizard.lora.manual.appKeyError"))
    }
  }

  useEffect(() => {
    dispatch(ApiActions.setLoRaConfigState("none"))
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
    if (loRaWanState?.hasJoined) {
      dispatch(ApiActions.setLoRaConfigState("connected"))
    }
  }, [loRaWanState])

  const keysAreValid = 
    devEui.length > 0 && 
    devEuiError == "" && 
    appEui.length > 0 && 
    appEuiError == "" && 
    appKey.length > 0 && 
    appKeyError == ""

  const onSetCredentialsPress = () => {
    if (keysAreValid) {
      dispatch(ApiActions.configureLoRaManual(devEui, appEui, appKey))
      retry.current = RETRY_COUNT
    }
  }

  const onNextPress = () => {
    navigation.navigate("WizardLoRaOverviewScreen", { fromSensorScreen })
  }

  return (<>
    <ScreenHeader title={t("wizard.lora.manual.screenTitle")} back />

    <ScrollView style={styles.container}>

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.lora.manual.description")}</Text>
      </View>

      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <Text style={[styles.itemText, { ...Fonts.style.bold }]}>{ApiService.getLoRaSensorsUrl(useProduction)}</Text>
      </View>

      <View style={styles.spacerDouble} />

      { state != "none" && <>
        <View style={styles.itemContainer}>
          <Text style={styles.itemText}>{t(`wizard.lora.automatic.state.${state}`)}</Text>
        </View>
        <View style={styles.spacerDouble} />
      </>}

      {/* Dev EUI */}
      <View style={ApplicationStyles.buttonsContainer}>
        <Text style={styles.label}>{t("wizard.lora.manual.devEui")}</Text>
        <Text style={styles.label}>{`(${devEui.length}/16)`}</Text>
      </View>
      <View style={styles.spacer} />
      <TextInputMask
        style={styles.input}
        onBlur={onDevEuiValidate}
        onChangeText={onDevEuiChangeText}
        value={devEuiFormatted}
        mask={"[__] [__] [__] [__] [__] [__] [__] [__]"}
        placeholder={t("wizard.lora.manual.devEuiPlaceholder")}
        autoCapitalize={"characters"}
        autoCompleteType={"off"}
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
      <TextInputMask
        style={styles.input}
        onBlur={onAppEuiValidate}
        onChangeText={onAppEuiChangeText}
        value={appEuiFormatted}
        mask={"[__] [__] [__] [__] [__] [__] [__] [__]"}
        placeholder={t("wizard.lora.manual.appEuiPlaceholder")}
        autoCapitalize={"characters"}
        autoCompleteType={"off"}
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
      <TextInputMask
        style={styles.input}
        onBlur={onAppKeyValidate}
        onChangeText={onAppKeyChangeText}
        value={appKeyFormatted}
        mask={"[__] [__] [__] [__] [__] [__] [__] [__] [__] [__] [__] [__] [__] [__] [__] [__]"}
        placeholder={t("wizard.lora.manual.appKeyPlaceholder")}
        autoCapitalize={"characters"}
        autoCompleteType={"off"}
        autoCorrect={false}
        returnKeyType={"next"}
      />
      { !!appKeyError && <>
        <View style={styles.spacerHalf} />
        <Text style={styles.error}>{appKeyError}</Text>
      </>}

      <View style={styles.spacerDouble} />

      { state != "connected" &&
        <TouchableOpacity style={styles.button} onPress={onSetCredentialsPress} disabled={!keysAreValid && state != "writingCredentials" && state != "checkingConnectivity"}>
          <Text style={styles.text}>{t("wizard.lora.manual.setCredentialsButton")}</Text>
        </TouchableOpacity>
      }

      <View style={styles.spacerDouble} />

    </ScrollView>

    { state == "connected" &&
      <View style={styles.itemContainer}>
        <TouchableOpacity style={styles.button} onPress={onNextPress}>
          <Text style={styles.text}>{t("common.btnNext")}</Text>
        </TouchableOpacity>
      </View>
    }
  </>)
}

export default WizardLoRaManualScreen