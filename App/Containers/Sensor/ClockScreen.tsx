import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './styles'
import { Colors, Fonts, Metrics } from '../../Theme';
import { StyleSheet } from 'react-native';

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

const additionalStyles = StyleSheet.create({
  clockSourceContainer: {
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  rtcBorder: {
    borderColor: '#4CAF50', // Green
  },
  noRtcBorder: {
    borderColor: '#F44336', // Red
  },
  clockSourceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  rtcText: {
    color: '#4CAF50',
  },
  noRtcText: {
    color: '#F44336',
  },
});

const styles = StyleSheet.create({
  ...existingStyles,
  ...additionalStyles,
});

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

  useEffect(() => {
    refresh()
  }, [])

  const refresh = () => {
    if (pairedPeripheral) {
      //read clock sensor
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_CLOCK)
    }
  }

  const onSyncPress = () => {
    const params = Buffer.alloc(4)
    params.writeUint32BE((new Date().valueOf() + 1300) / 1000, 0)   //adding 1500 ms for processing and communication delay
    BleHelpers.write(pairedPeripheral.id, COMMANDS.WRITE_CLOCK, params)
    refresh()
  }
      
  const renderClockSourceIndicator = () => {
    if (!clockSensor) return null;
  
    const isRtc = clockSensor.isRtcModule();
    
    return (
      <View style={[
        styles.clockSourceContainer,
        isRtc ? styles.rtcBorder : styles.noRtcBorder
      ]}>
        <Text style={[
          styles.clockSourceText,
          isRtc ? styles.rtcText : styles.noRtcText
        ]}>
          {isRtc 
            ? "RTC module installed and active"
            : "No RTC module installed"}
        </Text>
      </View>
    );
  };

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

      {renderClockSourceIndicator()}

    </View>
  </>)    
  
}

export default ClockScreen