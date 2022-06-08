import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useTypedSelector } from 'App/Stores';
import { useNavigation } from '@react-navigation/native';

// Styles
import styles from './LogFileScreenStyle'
import { Colors } from '../../Theme';
import Images from 'App/Assets/Images'

// Utils
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';
import RNFS, { UploadBeginCallbackResult, UploadFileItem, UploadProgressCallbackResult, UploadResult } from 'react-native-fs';

// Data
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getLogFileSize } from 'App/Stores/BeepBase/Selectors'
import { LogFileSizeModel } from '../../Models/LogFileSizeModel';
import { getCombinedLogFileFrames } from 'App/Stores/BeepBase/Selectors'
import { getLogFileProgress } from 'App/Stores/BeepBase/Selectors'

// Components
import { Text, View, TextInput, PermissionsAndroid, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader'
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScrollView } from 'react-native-gesture-handler';
import ApiService from '../../Services/ApiService';
import * as Progress from 'react-native-progress';

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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState("")
        
  useEffect(() => {
    dispatch(BeepBaseActions.setLogFileProgress(0))
    if (peripheral) {
      BleHelpers.write(peripheral.id, COMMANDS.SIZE_MX_FLASH)
    }  
  }, []);

  useEffect(() => {
    if (logFileProgress > 0 && logFileProgress === logFileSize?.value()) {
      //download finished, copy to SD card
      // BleHelpers.exportLogFile()   //when uncommenting, also uncomment permission request in onDownloadLogFilePress()

      // dispatch(BeepBaseActions.setLogFileProgress(0))
      //download finished, upload to api
      RNFS.uploadFiles({
        toUrl: ApiService.LOG_FILE_UPLOAD_URL,
        files: [{ 
          name: "file", 
          filename: BleHelpers.LOG_FILE_NAME,
          filepath: BleHelpers.LOG_FILE_PATH,
          filetype: "text/plain"
        } as UploadFileItem],
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${ApiService.getToken()}`
        },
        fields: {
          "id": peripheral.deviceId,
        },
        begin: (response: UploadBeginCallbackResult) => setUploadProgress(0),
        progress: (response: UploadProgressCallbackResult) => setUploadProgress(response.totalBytesSent / response.totalBytesExpectedToSend)
      }).promise.then((response: UploadResult) => {
        if (response.statusCode == 200) {
          console.log('FILES UPLOADED!'); // response.statusCode, response.headers, response.body
          setUploadProgress(1)
        } else {
          setUploadProgress(0)
          console.log('SERVER ERROR');
          setUploadStatus(`${response.statusCode}: ${response.body}`)
        }
      })
      .catch((err) => {
          setUploadProgress(0)
          setUploadStatus(err.description)
          if (err.description === "cancelled") {
            // cancelled by user
          }
          console.log(err);
        });
    }    
  }, [logFileProgress]);

  const onGetLogFileSizePress = () => {
    if (peripheral) {
      BleHelpers.write(peripheral.id, COMMANDS.SIZE_MX_FLASH)
    }
  }

  const onDownloadLogFilePress = async () => {
    if (logFileSize) {
      // PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE).then(async (granted: boolean) => {
      //   let requested
      //   if (!granted) {
      //     requested = await PermissionsAndroid.request(
      //       PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      //       {
      //         title: "BEEP Base",
      //         message: "Please grant access to write to storage",
      //         buttonNegative: "Cancel",
      //         buttonPositive: "OK"
      //       }
      //     );
      //   }
      //   if (granted || requested === PermissionsAndroid.RESULTS.GRANTED) {
          setUploadProgress(0)
          setUploadStatus("")
          dispatch(BeepBaseActions.clearLogFileFrames())
          if (peripheral) {
            BleHelpers.initLogFile()
            BleHelpers.write(peripheral.id, [0x20, 0x00, 0x00, 0x00, 0x00])
          }
        // }
      // })
    }
  }

  let downloadProgress = logFileProgress / logFileSize?.value()
  if (isNaN(downloadProgress)) {
    downloadProgress = 0
  }

  return (<>
    <ScreenHeader title={t("logFile.screenTitle")} back />

    <ScrollView style={styles.container} >
      <View style={styles.spacer} />

      <Text style={styles.label}>{t("logFile.logFileSize")}<Text style={styles.text}>{logFileSize?.toString()}</Text></Text>

      <View style={styles.spacerDouble} />

      <TouchableOpacity style={styles.button} onPress={onDownloadLogFilePress} disabled={logFileSize == undefined || logFileSize.value() == 0} >
        <Text style={styles.text}>{t("logFile.downloadLogFile")}</Text>
      </TouchableOpacity>
      
      <View style={styles.spacerDouble} />
      <Text style={styles.label}>{t("logFile.progress")}</Text>
      <View style={styles.spacer} />

      <View style={{ flexDirection: "row", flex: 1, justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={[styles.text]}>{t("logFile.download")}</Text>
          <View style={styles.spacer} />
          <Text style={[styles.text]}>{t("logFile.upload")}</Text>
        </View>
        <View style={styles.spacer} />
        <View>
          <Progress.Bar progress={downloadProgress} width={150} height={20} color={Colors.yellow} borderColor={Colors.black} borderRadius={8} />
          <View style={styles.spacer} />
          <Progress.Bar progress={uploadProgress} width={150} height={20} color={Colors.yellow} borderColor={Colors.black} borderRadius={8} />
        </View>
        <View style={styles.spacer} />
        <View>
          <Text style={[styles.text]}>{`${Math.round(downloadProgress * 100)} %`}</Text>
          <View style={styles.spacer} />
          <Text style={[styles.text]}>{`${Math.round(uploadProgress * 100)} %`}</Text>
        </View>
      </View>

      <View style={styles.spacer} />

      {/* <TextInput 
        style={[styles.text, { height: 300, borderWidth: 1, borderColor: Colors.yellow }]} 
        multiline={true} 
        editable={false}
        scrollEnabled={true}
        value={combinedLogFileFrames.toString("hex")}
      />
      <Text style={[styles.text]}>{`Upload progress: ${uploadProgress} %`}</Text>
      */}

      <View style={styles.spacer} />
      <Text style={[styles.text]}>{`Upload status: ${uploadStatus}`}</Text>

    </ScrollView>
  </>)
}

export default LogFileScreen