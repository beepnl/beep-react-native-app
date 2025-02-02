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
import { getAudio } from '../../Stores/BeepBase/Selectors';

// Components
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import { AudioModel } from '../../Models/AudioModel';
import { getFrequencyByBin } from '../Wizard/CalibrateAudioScreen';
import Spectrogram from 'react-native-spectrogram'

interface Props {
  navigation: StackNavigationProp,
}

const additionalStyles = StyleSheet.create({
  spectrogramContainer: {
    marginVertical: 16,
    height: 240, // Spectrogram + label + padding
  },
  label: {
    ...Fonts.normal,
    color: Colors.text,
    marginBottom: 8,
  },
});

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
  // State for spectrogram data
  const [spectrogramData, setSpectrogramData] = useState<number[]>([]);
    
  // Get screen width for spectrogram
  const screenWidth = Dimensions.get('window').width;

  // Set up continuous audio readings
  useEffect(() => {
    const startAudioReadings = async () => {
      try {
        // Initial config read
        await BleHelpers.write(pairedPeripheral.id, [COMMANDS.READ_AUDIO_ADC_CONFIG]);
        
        // Start continuous readings
        const readingInterval = setInterval(() => {
          BleHelpers.write(pairedPeripheral.id, [COMMANDS.READ_AUDIO_ADC_CONVERSION]);
        }, 100); // 10 Hz update rate

        return () => clearInterval(readingInterval);
      } catch (error) {
        console.error('Failed to start audio readings:', error);
      }
    };

    startAudioReadings();
  }, [pairedPeripheral.id]);

  // Update spectrogram when audio data changes
  useEffect(() => {
    if (audioSensor?.values) {
      setSpectrogramData(audioSensor.values);
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

          {/* Configuration button */}
          <TouchableOpacity style={styles.button} onPress={onConfigurePress}>
            <Text style={styles.text}>{t("sensor.configure")}</Text>
          </TouchableOpacity>
        </View>
      <View style={[styles.spacer, { flex: 1 }]} />

      <TouchableOpacity style={styles.button} onPress={onConfigurePress} >
        <Text style={styles.text}>{t("sensor.configure")}</Text>
      </TouchableOpacity>

    </View>
  </>)
}

export default AudioScreen