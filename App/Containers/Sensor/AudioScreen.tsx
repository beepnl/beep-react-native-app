import React, { FunctionComponent, useEffect } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import styles from './styles';

// Utils
import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';

// Data
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import { getAudio, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import { AudioModel } from '@/App/Models/AudioModel';
import { Text, TouchableOpacity, View } from 'react-native';
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
      </View>

      <View style={[styles.spacer, { flex: 1 }]} />

      <TouchableOpacity style={styles.button} onPress={onConfigurePress} >
        <Text style={styles.text}>{t("sensor.configure")}</Text>
      </TouchableOpacity>

    </View>
  </>)
}

export default AudioScreen