import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useTypedSelector } from 'App/Stores';
import { useNavigation } from 'react-navigation-hooks';
import { useInterval } from '../../Helpers/useInterval';

// Styles
import styles from './PeripheralDetailScreenStyle'

// Utils
import Images from 'App/Assets/Images'
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';

// Data
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getLogFileSize } from 'App/Stores/BeepBase/Selectors'
import { LogFileSizeModel } from '../../Models/LogFileSizeModel';
import { getCombinedLogFileFrames } from 'App/Stores/BeepBase/Selectors'
import { getLogFileProgress } from 'App/Stores/BeepBase/Selectors'
import { getFirmwareVersion } from 'App/Stores/BeepBase/Selectors'
import { FirmwareVersionModel } from '../../Models/FirmwareVersionModel';

// Components
import { Text, View, Button, TextInput } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader'
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScrollView } from 'react-native-gesture-handler';
import { Colors } from '../../Theme';

interface Props {
}

const PeripheralDetailScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  // const [peripheral, setPeripheral] = useState<PairedPeripheralModel>(navigation.state.params?.peripheral)
  const peripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const firmwareVersion: FirmwareVersionModel = useTypedSelector<FirmwareVersionModel>(getFirmwareVersion)
  const logFileSize: LogFileSizeModel = useTypedSelector<LogFileSizeModel>(getLogFileSize)
  const logFileProgress: number = useTypedSelector<number>(getLogFileProgress)
  const [rssi, setRssi] = useState(0)
  const combinedLogFileFrames: Buffer = useTypedSelector<Buffer>(getCombinedLogFileFrames)

  
  // useInterval(() => {
  //   BleHelpers.readRSSI(peripheral.id).then(rssi => {
  //     rssi && setRssi(rssi);
  //   })
  // }, 5000);
      
  useEffect(() => {
    BleHelpers.write(peripheral.id, COMMANDS.READ_FIRMWARE_VERSION)
    // BleHelpers.write(peripheral.id, COMMANDS.READ_HARDWARE_VERSION)
  }, []);

  const onInstallFirmwarePress = () => {
  }

  const onGetLogFileSizePress = () => {
    if (peripheral) {
      BleHelpers.write(peripheral.id, COMMANDS.SIZE_MX_FLASH)
    }
  }

  const onDownloadLogFilePress = () => {
    dispatch(BeepBaseActions.clearLogFileFrames())
    if (peripheral) {
      BleHelpers.write(peripheral.id, [0x20, 0x00, 0x00, 0x00, 0x00])
    }
  }

  return (
    <View style={styles.mainContainer}>
      <ScreenHeader title={t("peripheralDetail.screenTitle")} back />

      <ScrollView style={styles.container} >
        <View style={styles.spacer} />

        <Text style={[styles.centeredText, styles.text]}>{t("peripheralDetail.bleName", { name: peripheral.name })}</Text>
        <Text style={[styles.centeredText, styles.text]}>{t("peripheralDetail.bleStatus", { status: t(`peripheralDetail.bleConnection.${peripheral.isConnected}`)})}</Text>
        {/* <Text style={[styles.centeredText, styles.text]}>{t("peripheralDetail.bleRSSI", { rssi })}</Text> */}
        <View style={[styles.spacer, styles.separator]} />

        <View style={styles.spacerDouble} />

        <Button title={"Install firmware"} onPress={onInstallFirmwarePress}></Button>
        <View style={styles.spacer} />
        <Text style={[styles.text]}>{`Firmware version: ${firmwareVersion?.toString()}`}</Text>
        <View style={styles.spacerDouble} />

        <Button title={"Get log file size"} onPress={onGetLogFileSizePress}></Button>
        <View style={styles.spacer} />
        <Text style={[styles.text]}>{`Log file size: ${logFileSize.toString()}`}</Text>

        <View style={styles.spacerDouble} />

        <Button title={"Download log file"} onPress={onDownloadLogFilePress}></Button>
        <View style={styles.spacer} />
        <Text style={[styles.text]}>{`Progress: ${Math.round(logFileProgress * 100)} %`}</Text>
        <View style={styles.spacer} />
        <TextInput 
          style={[styles.text, { height: 300, borderWidth: 1, borderColor: Colors.yellow }]} 
          multiline={true} 
          editable={false}
          scrollEnabled={true}
          value={combinedLogFileFrames.toString("hex")}
        />

        <View style={styles.spacer} />

      </ScrollView>
    </View>
  )
}

export default PeripheralDetailScreen