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
import { getAudio } from '../../Stores/BeepBase/Selectors';

// Components
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import { AudioModel } from '../../Models/AudioModel';
import { getFrequencyByBin } from '../Wizard/CalibrateAudioScreen';

interface Props {
  navigation: StackNavigationProp,
}

const AudioScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const audioSensor: AudioModel = useTypedSelector<AudioModel>(getAudio)

  useEffect(() => {
    BleHelpers.write(pairedPeripheral.id, [COMMANDS.READ_AUDIO_ADC_CONFIG])
  }, [])

  const onConfigurePress = () => {
    navigation.navigate("CalibrateAudioScreen")
  }

  return (<>
    <ScreenHeader title={t("sensor.audio.screenTitle")} back />

    <View style={styles.container}>
      <View style={styles.spacer} />

      <Text style={styles.label}>{t("sensor.currentReading")}</Text>

      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.audio.channel")}</Text>
          <Text style={styles.text}>{audioSensor ? audioSensor.channel.name : "-"}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.audio.startFrequency")}</Text>
          <Text style={styles.text}>{audioSensor ? `${getFrequencyByBin(audioSensor.startBin)} Hz` : "- Hz"}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.audio.stopFrequency")}</Text>
          <Text style={styles.text}>{audioSensor ? `${getFrequencyByBin(audioSensor.stopBin)} Hz` : "- Hz"}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.audio.bins")}</Text>
          <Text style={styles.text}>{audioSensor ? audioSensor.bins : "-"}</Text>
        </View>

        // show list of spectrum values
        <View style={styles.itemRow}>
          <Text style={styles.text}>{t("sensor.audio.spectrum")}</Text>
          <Text style={styles.text}>{audioSensor ? audioSensor.bins : "-"}</Text>
        </View>
      </View>

      <View style={[styles.spacer, { flex: 1 }]} />

      <TouchableOpacity style={styles.button} onPress={onConfigurePress} >
        <Text style={styles.text}>{t("sensor.configure")}</Text>
      </TouchableOpacity>

    </View>
  </>)
}

export default AudioScreen