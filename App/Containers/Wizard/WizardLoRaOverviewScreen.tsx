import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { CommonActions, RouteProp, StackActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './styles'
import { Colors, Fonts, Images, Metrics } from '../../Theme';

// Utils
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';
import useInterval from '../../Helpers/useInterval';

// Data
import ApiActions from 'App/Stores/Api/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getLoRaWanAppEUI, getLoRaWanAppKey, getLoRaWanDeviceEUI, getLoRaWanState } from '../../Stores/BeepBase/Selectors';
import { LoRaWanStateModel } from '../../Models/LoRaWanStateModel';
import { LoRaWanDeviceEUIModel } from '../../Models/LoRaWanDeviceEUIModel';
import { LoRaWanAppEUIModel } from '../../Models/LoRaWanAppEUIModel';
import { LoRaWanAppKeyModel } from '../../Models/LoRaWanAppKeyModel';

// Components
import { ScrollView, Text, View, TouchableOpacity, Image } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';

interface Props {
  navigation: StackNavigationProp,
  route: RouteProp<any, any>,
}

const WizardLoRaOverviewScreen: FunctionComponent<Props> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const fromSensorScreen = route.params?.fromSensorScreen
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const loRaWanState: LoRaWanStateModel = useTypedSelector<LoRaWanStateModel>(getLoRaWanState)
  const loRaWanDeviceEUI: LoRaWanDeviceEUIModel = useTypedSelector<LoRaWanDeviceEUIModel>(getLoRaWanDeviceEUI)
  const loRaWanAppEUI: LoRaWanAppEUIModel = useTypedSelector<LoRaWanAppEUIModel>(getLoRaWanAppEUI)
  const loRaWanAppKey: LoRaWanAppKeyModel = useTypedSelector<LoRaWanAppKeyModel>(getLoRaWanAppKey)
  const [isDetailsCollapsed, setDetailsCollapsed] = useState(true)

  useEffect(() => {
    //read state from device
    if (pairedPeripheral) {
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_STATE)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_DEVEUI)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_APPEUI)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_APPKEY)
    }
  }, [])

  const onNextPress = () => {
    if (fromSensorScreen) {
      //go back to Sensor/LoRaScreen
      navigation.dispatch(StackActions.pop(3))
    } else {
      //continue wizard
      navigation.navigate("WizardEnergyScreen")
    }
  }

  const getStateText = () => {
    if (loRaWanState) {
      if (loRaWanState.isEnabled) {
        if (loRaWanState.hasJoined) {
          return t("wizard.lora.state.enabledJoined")
        } else {
          return t("wizard.lora.state.enabledNotJoined")
        }
      } else {
        return t("wizard.lora.state.disabled")
      }
    } else {
      return t("wizard.lora.state.reading")
    }
  }

  const renderDetails = () => (
    <View style={styles.itemContainer}>
      <Text style={styles.label}>{t("wizard.lora.details.deviceEUI")}</Text>
      <Text style={styles.text}>{loRaWanDeviceEUI?.toString()}</Text>
      <View style={styles.spacer} />
      <Text style={styles.label}>{t("wizard.lora.details.appEUI")}</Text>
      <Text style={styles.text}>{loRaWanAppEUI?.toString()}</Text>
      <View style={styles.spacer} />
      <Text style={styles.label}>{t("wizard.lora.details.appKey")}</Text>
      <Text style={styles.text}>{loRaWanAppKey?.toString()}</Text>
      <View style={styles.spacer} />
      <Text style={styles.label}>{t("wizard.lora.details.ADR")}</Text>
      <Text style={styles.text}>{t(`wizard.lora.details.${loRaWanState?.isAdaptiveDataRateEnabled ? "enabled" : "disabled"}`)}</Text>
      <View style={styles.spacer} />
      <Text style={styles.label}>{t("wizard.lora.details.DCL")}</Text>
      <Text style={styles.text}>{t(`wizard.lora.details.${loRaWanState?.isDutyCycleLimitationEnabled ? "enabled" : "disabled"}`)}</Text>
    </View>
  )

  return (<>
    <ScreenHeader title={t("wizard.lora.screenTitle")} back />

    <ScrollView style={styles.container}>

      <View style={styles.itemContainer}>
        <Text style={[styles.itemText, styles.label]}>{t("wizard.lora.loraState")}</Text>
        <Text style={styles.itemText}>{getStateText()}</Text>
      </View>

      { loRaWanState?.hasJoined && <>
        { renderDetails() }

        <View style={styles.spacerDouble} />

        <View style={styles.itemContainer}>
          <Text style={styles.text}>{t("wizard.lora.descriptionJoined")}</Text>
        </View>

        <View style={[styles.spacer, { flex: 1 }]} />
        
        <TouchableOpacity style={styles.button} onPress={onNextPress}>
          <Text style={styles.text}>{t("common.btnNext")}</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </>}

    </ScrollView>
  </>)
}

export default WizardLoRaOverviewScreen