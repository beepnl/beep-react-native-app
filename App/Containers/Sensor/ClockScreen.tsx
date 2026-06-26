import React, { FunctionComponent, useEffect } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import styles from './styles';

// Utils
import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';
import { NavigationProp } from '@react-navigation/native';

// Data
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import { getClock, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import { ClockModel } from '@/App/Models/ClockModel';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
  navigation: NavigationProp<any>,
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

export default ClockScreen