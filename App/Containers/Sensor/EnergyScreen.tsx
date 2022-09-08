import React, { FunctionComponent, useEffect, useState, useCallback, useRef } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './styles'
import { Colors, Fonts, Metrics } from '../../Theme';

// Utils
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';
import useInterval from '../../Helpers/useInterval';
import BatteryHelper from '../../Helpers/BatteryHelper';

// Data
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral, getBatteryPercentage } from 'App/Stores/BeepBase/Selectors'
import { getApplicationConfig } from '../../Stores/BeepBase/Selectors';
import { BatteryModel } from '../../Models/BatteryModel';

// Components
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import { ApplicationConfigModel } from '../../Models/ApplicationConfigModel';
import IconIonicons from 'react-native-vector-icons/Ionicons';

interface Props {
  navigation: StackNavigationProp,
}

const EnergyScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const applicationConfig: ApplicationConfigModel = useTypedSelector<ApplicationConfigModel>(getApplicationConfig)
  const battery: BatteryModel = useTypedSelector<BatteryModel>(getBatteryPercentage)

  const INTERVALS = [1440, 720, 360, 180, 120, 60, 30, 20, 15, 10, 5, 1].map((duration: number) => ({ duration, description: t(`wizard.energy.interval.${duration}`) }))

  useEffect(() => {
    //read config from device
    if (pairedPeripheral) {
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_APPLICATION_CONFIG)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.WRITE_nRF_ADC_CONVERSION)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_nRF_ADC_CONVERSION)
      // BleHelpers.readBatteryLevel(pairedPeripheral.id)
    }
  }, [])

  const getInterval = () => {
    if (applicationConfig) {
      const interval = INTERVALS.find(interval => interval.duration == applicationConfig.measurementInterval)
      if (interval) {
        return interval.description
      }

      return t("sensor.energy.intervalMinutes", { interval: applicationConfig.measurementInterval })
    }
  }

  const getAveragePower = () => {
    if (applicationConfig) {
      const consumption = BatteryHelper.energyConsumptionMilliWattPerHour(applicationConfig.measureToSendRatio, applicationConfig.measurementInterval)
      return `${consumption.toFixed(2)} mW`
    }
    return "-"
  }

  return (<>
    <ScreenHeader title={t("sensor.energy.screenTitle")} back />

    <ScrollView style={styles.container}>
      <View style={styles.spacer} />

      <Text style={styles.label}>{t("sensor.energy.battery")}</Text>
      <View style={styles.spacer} />
      <View style={styles.itemContainer}>
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.energy.capacity")}</Text>
          <Text style={styles.text}>{battery ? battery.toString() : "-"}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.energy.voltage")}</Text>
          <Text style={styles.text}>{battery ? battery.getVoltage() : "-"}</Text>
        </View>
        { battery.mvBattery < 2900 &&
          <View style={[styles.itemRow, { alignItems: "center", justifyContent: "center" }]}>
            <IconIonicons name="warning" size={30} color={Colors.black} />
            <View style={styles.spacerHalf} />
            <Text style={styles.text}>{t("sensor.energy.warning")}</Text>
          </View>
        }
      </View>

      <View style={styles.spacerDouble} />

      <Text style={styles.label}>{t("sensor.energy.usage")}</Text>
      <View style={styles.spacer} />
      <View style={styles.itemContainer}>
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.energy.interval")}</Text>
          <Text style={styles.text}>{getInterval()}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.energy.measureToSendRatio")}</Text>
          <Text style={styles.text}>{applicationConfig ? `${applicationConfig.measureToSendRatio}:1` : "-"}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.energy.averagePower")}</Text>
          <Text style={styles.text}>{getAveragePower()}</Text>
        </View>
      </View>

      <View style={styles.spacer} />

      <Text style={styles.instructions}>{t("sensor.energy.instructions")}</Text>

    </ScrollView>
  </>)
}

export default EnergyScreen