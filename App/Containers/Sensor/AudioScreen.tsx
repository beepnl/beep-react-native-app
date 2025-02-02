import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './styles'
import { ApplicationStyles, Colors, Fonts, Metrics } from '../../Theme';

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

import { Dimensions } from 'react-native';
import Spectrogram from 'react-spectrogram';

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
  const [spectrogramData, setSpectrogramData] = useState<number[]>([]);

  useEffect(() => {
    let isSubscribed = true;
    const startAudioReadings = async () => {
      try {
        // Initial config read
        await BleHelpers.safeWrite(pairedPeripheral.id, [COMMANDS.READ_AUDIO_ADC_CONFIG]);
  
        try {
            console.error('Start audio read from TLV..', err);
            await BleHelpers.safeWrite(pairedPeripheral.id, [COMMANDS.START_AUDIO_ADC_CONVERSION]);
          } catch (err) {
            console.error('Audio reading error:', err);
            clearInterval(readingInterval);
          }
            // Start continuous readings
          const readingInterval = setInterval(async () => {
            if (!isSubscribed) return;
            try {
              await BleHelpers.safeWrite(pairedPeripheral.id, [COMMANDS.READ_AUDIO_ADC_CONVERSION]);
            } catch (err) {
              console.error('Audio reading error:', err);
              clearInterval(readingInterval);
            }
          }, 1000); // update once a sec
        return () => {
          isSubscribed = false;
          clearInterval(readingInterval);
        };
      } catch (error) {
        console.error('Failed to start audio readings:', error);
      }
    };
  
    startAudioReadings();
    
    return () => {
      isSubscribed = false;
    };
  }, [pairedPeripheral.id]);

  // Update spectrogram when audio data changes
  useEffect(() => {
    if (audioSensor?.values && Array.isArray(audioSensor.values)) {
      try {
        if (audioSensor.values.length > audioSensor.bins) {
          console.warn('Audio data exceeds configured bins');
          return;
        }
        setSpectrogramData(audioSensor.values);
      } catch (error) {
        console.error('Error updating spectrogram:', error);
      }
    }
  }, [audioSensor]);

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
    <View style={styles.spectrogramContainer}>
            <Text style={styles.label}>{t("sensor.audio.spectrogram")}</Text>
            <Spectrogram
              data={spectrogramData}
              height={200}
              width={screenWidth - 32} // Account for padding
              colorScale="viridis"
              minFreq={getFrequencyByBin(audioSensor?.startBin || 0)}
              maxFreq={getFrequencyByBin(audioSensor?.stopBin || 0)}
              pixelsPerBin={audioSensor?.bins || 1}
            />
          </View>
      <View style={[styles.spacer, { flex: 1 }]} />

      <TouchableOpacity style={styles.button} onPress={onConfigurePress} >
        <Text style={styles.text}>{t("sensor.configure")}</Text>
      </TouchableOpacity>
    </View>
  </>)
}

export default AudioScreen