import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './styles'
import { Colors, Fonts, Images, Metrics } from '../../Theme';
import { markerStyle, pressedMarkerStyle, selectedStyle, trackStyle } from '../../Theme/ApplicationStyles';

// Utils
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';
import useInterval from '../../Helpers/useInterval';
import BatteryHelper from '../../Helpers/BatteryHelper';

// Data
import ApiActions from 'App/Stores/Api/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { ApplicationConfigModel } from '../../Models/ApplicationConfigModel';
import { getApplicationConfig } from '../../Stores/BeepBase/Selectors';

// Components
import { ScrollView, Text, View, TouchableOpacity, Image } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

const BATTERY_CAPACITY_MILLI_AMPS = 750

interface Props {
  navigation: StackNavigationProp,
}

const WizardEnergyScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const applicationConfig: ApplicationConfigModel = useTypedSelector<ApplicationConfigModel>(getApplicationConfig)
  const [sliderIndex, setSliderIndex] = useState([8])
  const measureToSendRatio = 1    //currently not able to change this using the app

  const INTERVALS = [1440, 720, 360, 180, 120, 60, 30, 20, 15, 10, 5, 1].map((duration: number) => ({ duration, description: t(`wizard.energy.interval.${duration}`) }))

  useEffect(() => {
    //read config from device
    if (pairedPeripheral) {
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_APPLICATION_CONFIG)
    }
  }, [])

  const updateFirmware = () => {
    const params = Buffer.alloc(3)
    let i = 0
    params.writeUint8(measureToSendRatio, i++)
    params.writeUInt16BE(INTERVALS[sliderIndex[0]].duration, i++)
    BleHelpers.write(pairedPeripheral.id, COMMANDS.WRITE_APPLICATION_CONFIG, params)
  }

  const onNextPress = () => {
    //update firmware
    updateFirmware()

    //next step in wizard
    navigation.navigate("WizardCongratulationsScreen")
  }

  const getAveragePower = () => {
    if (applicationConfig) {
      const measurementInterval = INTERVALS[sliderIndex[0]].duration
      const consumption = BatteryHelper.energyConsumptionMilliWattPerHour(applicationConfig.measureToSendRatio, measurementInterval)
      return `${consumption.toFixed(2)} mW`
    }
    return "-"
  }

  const getBatteryLife = () => {
    if (applicationConfig) {
      const measurementInterval = INTERVALS[sliderIndex[0]].duration
      const estimatedBatteryLife = BatteryHelper.estimatedBatteryLifeDays(BATTERY_CAPACITY_MILLI_AMPS, applicationConfig.measureToSendRatio, measurementInterval)
      return estimatedBatteryLife.toFixed(0)
    }
    return "-"
  }
  
  return (<>
    <ScreenHeader title={t("wizard.energy.screenTitle")} back />

    <ScrollView style={styles.container}>

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.energy.description")}</Text>
      </View>

      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{t("wizard.energy.takeEvery")}</Text>
        <View style={styles.spacer} />
        <Text style={[styles.itemText, { ...Fonts.style.bold }]}>{INTERVALS[sliderIndex[0]].description}</Text>
      </View>

      <View style={styles.spacerHalf} />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginHorizontal: Metrics.baseMargin }}>
        <View style={styles.spacerDouble} />
        <Text style={styles.text}>{t("wizard.energy.maxInterval")}</Text>
        <View style={styles.spacer} />
        <MultiSlider
          sliderLength={200}
          values={sliderIndex}
          onValuesChange={setSliderIndex}
          min={0}
          max={INTERVALS.length - 1}
          enabledOne={true}
          enabledTwo={false}
          trackStyle={trackStyle}
          markerStyle={markerStyle}
          pressedMarkerStyle={pressedMarkerStyle}
          selectedStyle={trackStyle}
        />
        <View style={styles.spacer} />
        <Text style={styles.text}>{t("wizard.energy.minInterval")}</Text>

        <View style={styles.spacerDouble} />
      </View>

      <View style={styles.spacerDouble} />

      <View style={styles.itemContainer}>
        <Text style={styles.label}>{t("wizard.energy.averagePower")}<Text style={[styles.text, { ...Fonts.style.bold }]}>{getAveragePower()}</Text></Text>
        <View style={styles.spacerDouble} />
        <Text style={styles.label}>{t("wizard.energy.estimatedBatteryLife")}<Text style={[styles.text, { ...Fonts.style.bold }]}>{t("wizard.energy.estimatedBatteryLifeValue", { days: getBatteryLife() })}</Text></Text>
        <View style={styles.spacerHalf} />
        <Text style={styles.instructions}>{t("wizard.energy.disclaimer")}</Text>
      </View>

    </ScrollView>

    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.button} onPress={onNextPress}>
        <Text style={styles.text}>{t("common.btnNext")}</Text>
      </TouchableOpacity>
    </View>
  </>)
}

export default WizardEnergyScreen