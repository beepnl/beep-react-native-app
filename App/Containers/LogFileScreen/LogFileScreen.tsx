import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useTypedSelector } from 'App/Stores';
import { useNavigation } from 'react-navigation-hooks';
import { useInterval } from '../../Helpers/useInterval';

// Styles
import styles from './LogFileScreenStyle'
import { Colors } from '../../Theme';
import Images from 'App/Assets/Images'

// Utils
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';

// Data
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getLogFileSize } from 'App/Stores/BeepBase/Selectors'
import { LogFileSizeModel } from '../../Models/LogFileSizeModel';
import { getCombinedLogFileFrames } from 'App/Stores/BeepBase/Selectors'
import { getLogFileProgress } from 'App/Stores/BeepBase/Selectors'

// Components
import { Text, View, Button, TextInput } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader'
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScrollView } from 'react-native-gesture-handler';

interface Props {
}

const LogFileScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const peripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const logFileSize: LogFileSizeModel = useTypedSelector<LogFileSizeModel>(getLogFileSize)
  const logFileProgress: number = useTypedSelector<number>(getLogFileProgress)
  const combinedLogFileFrames: Buffer = useTypedSelector<Buffer>(getCombinedLogFileFrames)
        
  useEffect(() => {
    if (peripheral) {
      BleHelpers.write(peripheral.id, COMMANDS.SIZE_MX_FLASH)
    }  
  }, []);

  // const requestExternalStoreageRead = async() => {
  //   try {
  //     const granted = await PermissionsAndroid.request(
  //     PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
  //       {
  //         'title': 'Cool App ...',
  //         'message': 'App needs access to external storage',
  //         buttonPositive: "ok"
  //       }
  //     );
  //     return granted == PermissionsAndroid.RESULTS.GRANTED
  //   } 
  //   catch (err) {
  //     return false;
  //   }
  // }

  const onGetLogFileSizePress = () => {
    if (peripheral) {
      BleHelpers.write(peripheral.id, COMMANDS.SIZE_MX_FLASH)
    }
  }

  const onDownloadLogFilePress = () => {
    if (logFileSize) {
      dispatch(BeepBaseActions.clearLogFileFrames())
      if (peripheral) {
        BleHelpers.write(peripheral.id, [0x20, 0x00, 0x00, 0x00, 0x00])
      }
    }
  }

  return (
    <View style={styles.mainContainer}>
      <ScreenHeader title={t("peripheralDetail.screenTitle")} back />

      <ScrollView style={styles.container} >
        <View style={styles.spacer} />

        <Button title={"Get log file size"} onPress={onGetLogFileSizePress}></Button>
        <View style={styles.spacer} />
        <Text style={[styles.text]}>{`Log file size: ${logFileSize?.toString()}`}</Text>

        <View style={styles.spacerDouble} />

        <Button title={"Download log file"} onPress={onDownloadLogFilePress} disabled={logFileSize == undefined}></Button>
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

export default LogFileScreen