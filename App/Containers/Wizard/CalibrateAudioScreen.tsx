import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './styles'
import { Colors, Fonts, Images, Metrics } from '../../Theme';

// Utils
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';
import useInterval from '../../Helpers/useInterval';
import useTimeout from '../../Helpers/useTimeout';

// Data
import ApiActions from 'App/Stores/Api/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { SensorDefinitionModel } from '../../Models/SensorDefinitionModel';
import { AudioModel, Channel, ChannelName, CHANNELS } from '../../Models/AudioModel';
import { getAudio } from '../../Stores/BeepBase/Selectors';

// Components
import { ScrollView, Text, View, TouchableOpacity, Image, TextInput } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import IconMaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

type PAGE = "plug" | "frequencies"

const BIN_RESOLUTION = 3.937752016
const FREQUENCY_STEP = 50
export const getFrequencyByBin = (bin: number) => Math.round((bin * 2 * BIN_RESOLUTION)/ FREQUENCY_STEP) * FREQUENCY_STEP

const trackStyle = { height: 4, backgroundColor: Colors.lightGrey }
const markerStyle = { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.yellow }
const pressedMarkerStyle = { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.yellow }
const selectedStyle = { backgroundColor: Colors.yellow }

interface Props {
  navigation: StackNavigationProp,
}

const CalibrateAudioScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const [page, setPage] = useState<PAGE>("plug")
  const audio: AudioModel = useTypedSelector<AudioModel>(getAudio)
  const [channel, setChannel] = useState<Channel>(audio?.channel)
  const [frequencies, setFrequencies] = useState([ getFrequencyByBin(audio.startBin), getFrequencyByBin(audio.stopBin) ])
  const [bins, setBins] = useState([audio.bins])

  const updateFirmware = () => {
    const startBin = Math.round(frequencies[0] / BIN_RESOLUTION / 2)
    const stopBin = Math.round(frequencies[1] / BIN_RESOLUTION / 2)

    const params = Buffer.alloc(6)
    let i = 0
    params.writeUint8(channel.bitmask, i++)
    params.writeUint8(audio.gain, i++)
    params.writeInt8(audio.volume, i++)
    params.writeUint8(bins[0], i++)
    params.writeUint8(startBin, i++)
    params.writeUint8(stopBin, i++)
    BleHelpers.write(pairedPeripheral.id, COMMANDS.WRITE_AUDIO_ADC_CONFIG, params)
  }

  const onNextPress = () => {
    //update firmware with selected channel
    // updateFirmware()

    //show page 2
    setPage("frequencies")
  }

  const onFinishPress = () => {
    //update firmware
    updateFirmware()
    
    //close screen
    navigation.goBack()
  }

  const getImage = (channel: Channel) => {
    switch (channel.name) {
      case "IN3LM":
        return Images.connectorIN3L
      case "IN2RP":
        return Images.connectorIN2R
      case "IN2LP":
        return Images.connectorIN2L
    }
  }

  return (<>
    <ScreenHeader title={t("wizard.calibrate.audio.screenTitle")} back />

    <ScrollView style={styles.container}>
      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t(`wizard.calibrate.audio.${page}.description`)}</Text>
      </View>

      <View style={styles.spacer} />

      { page == "plug" && <>
        <View style={{ marginHorizontal: 60, alignItems: "center" }}>
          <Image style={{ width: "80%", aspectRatio: 585/145, height: null, margin: Metrics.baseMargin }} source={Images.connectorOverview} resizeMode="contain" />
    
          <View style={styles.spacerDouble} />

          { CHANNELS.map((ch: Channel, index: number) => {
            return <TouchableOpacity key={index} style={{ flexDirection: "row", width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: Metrics.baseMargin }} onPress={() => setChannel(ch)}>
              <IconMaterialCommunityIcons name={ch == channel ? "radiobox-marked" : "radiobox-blank"} size={30} color={Colors.black} />
              <View style={styles.spacer} />
              <Image style={{ width: "60%", marginLeft: 10, aspectRatio: 420/79, height: null, margin: Metrics.baseMargin }} source={getImage(ch)} resizeMode="contain" />
            </TouchableOpacity>
          })}
        </View>
      </>}

      { page == "frequencies" && <>
        <View style={styles.itemContainer}>
          <Text style={styles.text}>{t("wizard.calibrate.audio.frequencies.startFrequency")}<Text style={[styles.text, { ...Fonts.style.bold }]}>{`${frequencies[0]} Hz`}</Text></Text>
          <Text style={styles.text}>{t("wizard.calibrate.audio.frequencies.endFrequency")}<Text style={[styles.text, { ...Fonts.style.bold }]}>{`${frequencies[1]} Hz`}</Text></Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginHorizontal: Metrics.baseMargin }}>
          <Text style={styles.text}>0 Hz</Text>
          <View style={styles.spacer} />
          <MultiSlider
            sliderLength={240}
            values={frequencies}
            onValuesChange={setFrequencies}
            min={0}
            max={2000}
            step={FREQUENCY_STEP}
            trackStyle={trackStyle}
            markerStyle={markerStyle}
            pressedMarkerStyle={pressedMarkerStyle}
            selectedStyle={selectedStyle}
          />
          <View style={styles.spacer} />
          <Text style={styles.text}>2 kHz</Text>
        </View>

        <View style={styles.spacerDouble} />

        <View style={styles.itemContainer}>
          <Text style={styles.text}>{t("wizard.calibrate.audio.frequencies.bins")}<Text style={[styles.text, { ...Fonts.style.bold }]}>{`${bins[0]}`}</Text></Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginHorizontal: Metrics.baseMargin }}>
          <Text style={styles.text}>1</Text>
          <View style={styles.spacer} />
          <MultiSlider
              sliderLength={240}
              values={bins}
              onValuesChange={setBins}
              min={1}
              max={12}
              enabledOne={true}
              enabledTwo={false}
              trackStyle={trackStyle}
              markerStyle={markerStyle}
              pressedMarkerStyle={pressedMarkerStyle}
              selectedStyle={trackStyle}
            />
          <View style={styles.spacer} />
          <Text style={styles.text}>12</Text>
        </View>
      </>}

    </ScrollView>

    <View style={styles.itemContainer}>
      { page == "plug" &&
        <TouchableOpacity style={styles.button} onPress={onNextPress}>
          <Text style={styles.text}>{t("common.btnNext")}</Text>
        </TouchableOpacity>
      }

      { page == "frequencies" &&
        <TouchableOpacity style={styles.button} onPress={onFinishPress}>
          <Text style={styles.text}>{t("common.btnFinish")}</Text>
        </TouchableOpacity>
      }
    </View>
  </>)
}

export default CalibrateAudioScreen