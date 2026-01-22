import React, { FunctionComponent, useEffect, useState } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import { Colors, Fonts, Metrics } from '@/App/Theme';
import styles from './styles';

// Utils
import BatteryHelper from '@/App/Helpers/BatteryHelper';
import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';

// Data
import { ApplicationConfigModel } from '@/App/Models/ApplicationConfigModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import { getApplicationConfig, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import Slider from '@react-native-community/slider';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const BATTERY_CAPACITY_MILLI_AMPS = 750

interface Props {
  navigation: StackNavigationProp,
  route: RouteProp<any, any>,
}

const WizardEnergyScreen: FunctionComponent<Props> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const fromSensorScreen = route.params?.fromSensorScreen
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const applicationConfig: ApplicationConfigModel = useTypedSelector<ApplicationConfigModel>(getApplicationConfig)
  const [sliderIndex, setSliderIndex] = useState(8)
  const [measureToSendRatio, _setMeasureToSendRatio] = useState(applicationConfig?.measureToSendRatio ?? 1)

  const INTERVALS = [1440, 720, 360, 180, 120, 60, 30, 20, 15, 10, 5, 1].map((duration: number) => ({ duration, description: t(`wizard.energy.interval.${duration}`) }))

  const setMeasureToSendRatio = (value: number) => {
    //convert linear scale into lograthimic exponent
    const exponent = 0.52   //was 0.42
    const curve = Math.pow(10, exponent)
    const originalMin = 1
    const originalMax = 255
    const mappedOutputMin = 1
    const mappedOutputMax = 255
    const originalRange = originalMax - originalMin;
    const newRange = mappedOutputMax - mappedOutputMin;
    const zeroRefCurVal = value - originalMin
    const normalizedCurVal = zeroRefCurVal / originalRange
    const rangedValue = Math.round((Math.pow(normalizedCurVal, curve) * newRange) + mappedOutputMin)
    _setMeasureToSendRatio(rangedValue)
  }
  
  useEffect(() => {
    //read config from device
    if (pairedPeripheral) {
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_APPLICATION_CONFIG)
    }
  }, [])

  useEffect(() => {
    if (applicationConfig) {
      const intervalIndex = INTERVALS.findIndex(interval => interval.duration == applicationConfig.measurementInterval)
      if (intervalIndex) {
        setSliderIndex(intervalIndex)
      }

      _setMeasureToSendRatio(applicationConfig.measureToSendRatio)
    }
  }, [applicationConfig])

  const updateFirmware = () => {
    const params = Buffer.alloc(3)
    let i = 0
    params.writeUint8(measureToSendRatio, i++)
    params.writeUInt16BE(INTERVALS[sliderIndex].duration, i++)
    BleHelpers.write(pairedPeripheral.id, COMMANDS.WRITE_APPLICATION_CONFIG, params)
  }

  const onNextPress = () => {
    //update firmware
    updateFirmware()

    if (fromSensorScreen) {
      navigation.goBack()

      //refresh audio sensor on previous screen
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.READ_APPLICATION_CONFIG])
    } else {
      //next step in wizard
      navigation.navigate("WizardCongratulationsScreen")
    }
  }

  const getAveragePower = () => {
    if (applicationConfig) {
      const measurementInterval = INTERVALS[sliderIndex]?.duration
      const consumption = BatteryHelper.energyConsumptionMilliWattPerHour(measureToSendRatio, measurementInterval)
      return `${consumption.toFixed(2)} mW`
    }
    return "-"
  }

  const getBatteryLife = () => {
    if (applicationConfig) {
      const measurementInterval = INTERVALS[sliderIndex]?.duration
      const estimatedBatteryLife = BatteryHelper.estimatedBatteryLifeDays(BATTERY_CAPACITY_MILLI_AMPS, measureToSendRatio, measurementInterval)
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
        <Text style={[styles.itemText, { ...Fonts.style.bold }]}>{INTERVALS[sliderIndex]?.description}</Text>
      </View>

      <View style={styles.spacerHalf} />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginHorizontal: Metrics.baseMargin }}>
        <View style={styles.spacerDouble} />
        <Text style={styles.text}>{t("wizard.energy.maxInterval")}</Text>
        <View style={styles.spacer} />
        <Slider
          style={{ width: 200 }}
          minimumValue={0}
          maximumValue={INTERVALS.length - 1}
          step={1}
          onValueChange={setSliderIndex}
          value={sliderIndex}
          tapToSeek={true}
          thumbTintColor={Colors.yellow}
        />
        <View style={styles.spacer} />
        <Text style={styles.text}>{t("wizard.energy.minInterval")}</Text>

        <View style={styles.spacerDouble} />
      </View>

      <View style={styles.spacerDouble} />

      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{t("wizard.energy.measureToSendRatio")}</Text>
        <View style={styles.spacer} />
        <Text style={[styles.itemText, { ...Fonts.style.bold }]}>{`${measureToSendRatio}`}</Text>
      </View>

      <View style={styles.spacerHalf} />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginHorizontal: Metrics.baseMargin }}>
        <View style={styles.spacerDouble} />
        <Text style={styles.text}>{"1"}</Text>
        <View style={styles.spacer} />
        <Slider
          style={{ width: 200 }}
          minimumValue={1}
          maximumValue={255}
          step={1}
          onValueChange={setMeasureToSendRatio}
          value={measureToSendRatio}
          tapToSeek={true}
          thumbTintColor={Colors.yellow}
        />
        <View style={styles.spacer} />
        <Text style={styles.text}>{"255"}</Text>
        {/* <Text style={styles.text}>{t("wizard.energy.minInterval")}</Text> */}

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
        <Text style={styles.text}>{fromSensorScreen ? t("common.btnFinish") : t("common.btnNext")}</Text>
      </TouchableOpacity>
    </View>
  </>)
}

export default WizardEnergyScreen