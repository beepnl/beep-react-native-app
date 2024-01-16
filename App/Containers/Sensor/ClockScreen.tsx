import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

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

// Data
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getClock } from '../../Stores/BeepBase/Selectors';

// Components
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import { ClockModel } from '../../Models/ClockModel';

interface Props {
  navigation: StackNavigationProp,
}

const ClockScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const clockSensor: ClockModel = useTypedSelector<ClockModel>(getClock)
  const bool RTC_installed = false

  useEffect(() => {
    refresh()
  }, [])

  const refresh = () => {
    if (pairedPeripheral) {
      //read clock sensor
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_CLOCK)
      RTC_installed = ClockModel.checkRTC()
    }
  }

  const onSyncPress = () => {
    const params = Buffer.alloc(4)
    params.writeUint32BE((new Date().valueOf() + 1300) / 1000, 0)   //adding 1500 ms for processing and communication delay
    BleHelpers.write(pairedPeripheral.id, COMMANDS.WRITE_CLOCK, params)
    refresh()
  }

  return (<>
    <ScreenHeader title={t("sensor.clock.screenTitle")} back />

    <View style={styles.container}>
      <View style={styles.spacer} />

      <Text style={styles.label}>{t("sensor.currentReading")}</Text>

      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.clock.date")}</Text>
          <Text style={styles.text}>{clockSensor ? clockSensor.toDate() : "-"}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.clock.time")}</Text>
          <Text style={styles.text}>{clockSensor ? clockSensor.toTime() : "-"}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.clock.drift")}</Text>
          <Text style={styles.text}>{clockSensor ? `${clockSensor.toDrift()} ${t("sensor.clock.seconds")}` : ""}</Text>
        </View>
      </View>

      <View style={[styles.spacer, { flex: 1 }]} />

      <Text style={styles.instructions}>{t("sensor.clock.syncInstructions")}</Text>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.button} onPress={onSyncPress} >
        <Text style={styles.text}>{t("sensor.clock.syncButton")}</Text>
      </TouchableOpacity>
      

    </View>
  </>)
}

      // todo: show RTC status  in view
      /*
      <Text style={styles.text}>{ RTC_installed    
      */  

export default ClockScreen