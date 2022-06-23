import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native';
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
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import IconMaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Collapsible from 'react-native-collapsible';

interface Props {
  navigation: StackNavigationProp,
}

const WizardLoRaScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
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

  const onAutomaticPress = () => {
  }

  const onManualPress = () => {
  }
  
  const onNextPress = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "HomeScreen" }],
      }),
    );
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

  return (<>
    <ScreenHeader title={t("wizard.lora.screenTitle")} back />

    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.itemContainer}>
        <Text style={styles.label}>{t("wizard.lora.loraState")}</Text>
        <Text style={styles.text}>{getStateText()}</Text>
      </View>

      <TouchableOpacity onPress={() => setDetailsCollapsed(!isDetailsCollapsed)}>
        <Text style={[styles.link, { alignSelf: "center" }]}>{t("wizard.lora.showDetails")}</Text>
      </TouchableOpacity>
      <Collapsible collapsed={isDetailsCollapsed}>
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
      </Collapsible>

      <View style={styles.spacer} />
      <View style={styles.separator} />
      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <Text style={[styles.text, { ...Fonts.style.bold }]}>{t("wizard.lora.subTitle")}</Text>
      </View>

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.lora.descriptionAutomatic")}</Text>
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.button} onPress={onAutomaticPress}>
        <Text style={styles.text}>{t("wizard.lora.automaticButton")}</Text>
      </TouchableOpacity>

      <View style={styles.spacerDouble} />

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.lora.descriptionManual")}</Text>
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.button} onPress={onManualPress}>
        <Text style={styles.text}>{t("wizard.lora.manualButton")}</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />

      <View style={[styles.spacer, { flex: 1 }]} />
      
      <TouchableOpacity style={styles.button} onPress={onNextPress}>
        <Text style={styles.text}>{t("common.btnSkip")}</Text>
      </TouchableOpacity>
    </ScrollView>
  </>)
}

export default WizardLoRaScreen