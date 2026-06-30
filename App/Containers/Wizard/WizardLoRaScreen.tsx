import React, { FunctionComponent, useEffect, useState } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import { RouteProp } from '@react-navigation/native';
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
import { LoRaCoverageProvider } from '@/App/Stores/Api/InitialState';
import { getLoRaWanAppEUI, getLoRaWanAppKey, getLoRaWanDeviceEUI, getLoRaWanState, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Collapsible } from '@/App/Components/collapsible';
import Modal from 'react-native-modal';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  navigation: any,
  route: RouteProp<any, any>,
}

interface LoRaProviders {
  ttn?: {
    can_coverage_check?: boolean
  }
  helium?: {
    can_provision?: boolean
    can_coverage_check?: boolean
  }
}

const WizardLoRaScreen: FunctionComponent<Props> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const fromSensorScreen = route.params?.fromSensorScreen
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const pairedPeripheralId = pairedPeripheral?.id
  const loRaWanState: LoRaWanStateModel = useTypedSelector<LoRaWanStateModel>(getLoRaWanState)
  const loRaWanDeviceEUI: LoRaWanDeviceEUIModel = useTypedSelector<LoRaWanDeviceEUIModel>(getLoRaWanDeviceEUI)
  const loRaWanAppEUI: LoRaWanAppEUIModel = useTypedSelector<LoRaWanAppEUIModel>(getLoRaWanAppEUI)
  const loRaWanAppKey: LoRaWanAppKeyModel = useTypedSelector<LoRaWanAppKeyModel>(getLoRaWanAppKey)
  const [isModalVisible, setModalVisible] = useState(false)
  const [loRaProviders, setLoRaProviders] = useState<LoRaProviders>()
  const heliumAutomaticAvailable = loRaProviders?.helium?.can_provision === true
  const heliumCoverageAvailable = loRaProviders?.helium?.can_coverage_check === true
  const ttnCoverageAvailable = loRaProviders?.ttn?.can_coverage_check !== false

  useEffect(() => {
    //read state from device
    if (pairedPeripheralId) {
      BleHelpers.write(pairedPeripheralId, COMMANDS.READ_LORAWAN_STATE)
      BleHelpers.write(pairedPeripheralId, COMMANDS.READ_LORAWAN_DEVEUI)
      BleHelpers.write(pairedPeripheralId, COMMANDS.READ_LORAWAN_APPEUI)
      BleHelpers.write(pairedPeripheralId, COMMANDS.READ_LORAWAN_APPKEY)
    }
  }, [pairedPeripheralId])

  useEffect(() => {
    let isMounted = true
    ApiService.getLoRaProviders().then((response: any) => {
      if (isMounted && response?.ok && response?.data) {
        setLoRaProviders(response.data)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  const onAutomaticPress = () => {
    navigation.navigate("WizardLoRaAutomaticScreen", { fromSensorScreen })
  }

  const onHeliumAutomaticPress = () => {
    navigation.navigate("WizardLoRaHeliumScreen", { fromSensorScreen })
  }

  const onManualPress = () => {
    navigation.navigate("WizardLoRaManualScreen", { fromSensorScreen })
  }

  const onCoverageCheckPress = (provider: LoRaCoverageProvider) => {
    navigation.navigate("WizardLoRaCoverageCheckScreen", { provider, fromSensorScreen })
  }

  const onDisablePress = () => {
    if (pairedPeripheral) {
      BleHelpers.write(pairedPeripheral.id, COMMANDS.WRITE_LORAWAN_STATE, 0)
      dispatch(ApiActions.setDisableLoRa())
      dispatch(ApiActions.setLoRaConfigState("isDisabled"))
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_LORAWAN_STATE)
    }
  }

  const onNextPress = () => {
    if (loRaWanState?.hasJoined) {
      onNextConfirmPress()
    } else {
      setModalVisible(true)
    }
  }

  const onNextConfirmPress = () => {
    setModalVisible(false)
    navigation.navigate("WizardEnergyScreen")
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

  const hideModal = () => {
    setModalVisible(false)
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
        <Text style={styles.itemText}>{t("wizard.lora.loraState")}</Text>
        <View style={styles.spacer} />
        <View style={styles.centeredContainer}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="radio-outline" size={30} color={(loRaWanState?.isEnabled && loRaWanState?.hasJoined) ? Colors.green : Colors.red} style={{ transform: [{ rotate: '90deg' }] }} />
            <Text style={styles.itemText}>{getStateText()}</Text>
          </View>
        </View>
      </View>

      <Collapsible>
        {renderDetails()}
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

      { heliumAutomaticAvailable && <>
        <View style={styles.itemContainer}>
          <Text style={styles.text}>{t("wizard.lora.descriptionHeliumAutomatic")}</Text>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.button} onPress={onHeliumAutomaticPress}>
          <Text style={styles.text}>{t("wizard.lora.heliumAutomaticButton")}</Text>
        </TouchableOpacity>

        <View style={styles.spacerDouble} />
      </>}

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.lora.descriptionManual")}</Text>
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.button} onPress={onManualPress}>
        <Text style={styles.text}>{t("wizard.lora.manualButton")}</Text>
      </TouchableOpacity>

      <View style={styles.spacerDouble} />

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.lora.coverage.description")}</Text>
      </View>

      <View style={styles.spacer} />

      { heliumCoverageAvailable && <>
        <TouchableOpacity style={styles.button} onPress={() => onCoverageCheckPress("helium")}>
          <Text style={styles.text}>{t("wizard.lora.coverage.heliumButton")}</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </>}

      { ttnCoverageAvailable &&
        <TouchableOpacity style={styles.button} onPress={() => onCoverageCheckPress("ttn")}>
          <Text style={styles.text}>{t("wizard.lora.coverage.ttnButton")}</Text>
        </TouchableOpacity>
      }

      <View style={styles.spacerDouble} />

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.lora.descriptionDisable")}</Text>
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.button} onPress={onDisablePress}>
        <Text style={styles.text}>{t("wizard.lora.disableButton")}</Text>
      </TouchableOpacity>

      <View style={styles.spacerDouble} />
    </ScrollView>

    {!fromSensorScreen &&
      <View style={styles.itemContainer}>
        <TouchableOpacity style={styles.button} onPress={onNextPress}>
          <Text style={styles.text}>{t("common.btnNext")}</Text>
        </TouchableOpacity>
      </View>
    }

    <Modal
      isVisible={isModalVisible}
      onBackdropPress={hideModal}
      onBackButtonPress={hideModal}
      useNativeDriver={true}
      backdropOpacity={0.3}
    >
      <View style={ApplicationStyles.modalContainer}>
        <Text style={[styles.itemText, { ...Fonts.style.bold }]}>{t("wizard.lora.NextTitle")}</Text>
        <View style={styles.spacer} />
        <View style={styles.itemContainer}>
          <Text style={styles.itemText}>{t("wizard.lora.NextMessage")}</Text>
          <View style={styles.spacerDouble} />
          <View style={ApplicationStyles.buttonsContainer}>
            <TouchableOpacity style={[styles.button, { width: "40%" }]} onPress={onNextConfirmPress}>
              <Text style={styles.text}>{t("common.btnNext")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { width: "40%" }]} onPress={hideModal}>
              <Text style={styles.text}>{t("common.btnCancel")}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.spacerHalf} />
        </View>
      </View>
    </Modal>

  </>)
}

export default WizardLoRaScreen
