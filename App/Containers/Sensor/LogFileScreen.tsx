import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useTypedSelector } from 'App/Stores';
import { useNavigation } from '@react-navigation/native';

// Styles
import styles from './styles'
import { Colors } from '../../Theme';

// Utils
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';
import RNFS, { UploadBeginCallbackResult, UploadFileItem, UploadProgressCallbackResult, UploadResult } from 'react-native-fs';
import ApiService from '../../Services/ApiService';

// Data
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getLogFileSize } from 'App/Stores/BeepBase/Selectors'
import { LogFileSizeModel } from '../../Models/LogFileSizeModel';
import { getCombinedLogFileFrames } from 'App/Stores/BeepBase/Selectors'
import { getLogFileProgress } from 'App/Stores/BeepBase/Selectors'

// Components
import { Text, View, PermissionsAndroid, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader'
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScrollView } from 'react-native-gesture-handler';
import ApiService from '../../Services/ApiService';
import * as Progress from 'react-native-progress';

type STATE = 
  "idle" |
  "downloading" |
  "uploading" |
  "completed" |
  "failed"

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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [state, setState] = useState<STATE>("idle")
  const [error, setError] = useState("")
  const useProduction = useTypedSelector<boolean>(getUseProduction)
        
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
      setState("uploading")
      RNFS.uploadFiles({
        toUrl: ApiService.getLogFileUploadUrl(useProduction),
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
          setState("completed")
          setUploadProgress(1)
        } else {
          console.log('SERVER ERROR');
          setUploadProgress(0)
          setState("failed")
          setError(`${response.statusCode}: ${response.body}`)
        }
      })
      .catch((err) => {
          setUploadProgress(0)
          setError(err.description)
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
      setUploadProgress(0)
      setState("downloading")
      dispatch(BeepBaseActions.clearLogFileFrames())
      if (peripheral) {
        BleHelpers.initLogFile()
        BleHelpers.write(peripheral.id, [0x20, 0x00, 0x00, 0x00, 0x00])
      }
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

      <Text style={styles.label}>{t("logFile.logFile")}</Text>
      <View style={styles.spacer} />
      <View style={styles.itemContainer}>
        <View style={styles.itemRow}>
          <Text style={styles.label}>{t("logFile.logFileSize")}<Text style={styles.text}>{logFileSize?.toString()}</Text></Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.label}>{t("logFile.timestamp")}<Text style={styles.text}>{logFileSize?.getTimestamp()}</Text></Text>
        </View>
      </View>

      <View style={styles.spacerDouble} />

      <TouchableOpacity
        style={styles.button} 
        onPress={onDownloadLogFilePress} 
        disabled={logFileSize == undefined || logFileSize.value() == 0 || state == "downloading" || state == "uploading"}
      >
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
          <Text style={[styles.text]}>{`${Math.floor(downloadProgress * 100)} %`}</Text>
          <View style={styles.spacer} />
          <Text style={[styles.text]}>{`${Math.floor(uploadProgress * 100)} %`}</Text>
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

      { !!error && <>
        <View style={styles.spacer} />
        <Text style={[styles.error]}>{`Error: ${error}`}</Text>
      </>}

    </ScrollView>
  </>)
}

export default LogFileScreen