import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useTypedSelector } from 'App/Stores';
import { useNavigation } from '@react-navigation/native';

// Styles
import styles from './styles'
import { ApplicationStyles, Colors, Fonts } from '../../Theme';

// Utils
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';
import RNFS, { UploadBeginCallbackResult, UploadFileItem, UploadProgressCallbackResult, UploadResult } from 'react-native-fs';
import ApiService from '../../Services/ApiService';
import useTimeout from '../../Helpers/useTimeout';
import useInterval from '../../Helpers/useInterval';

import { LogFileInfo, LogFileModel } from '../../Models/LogFileModel';
import FormatHelpers from '../../Helpers/FormatHelpers';
import DateTimeHelper from '../../Helpers/DateTimeHelpers';
// Data
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getLogFileSize } from 'App/Stores/BeepBase/Selectors'
import { LogFileSizeModel } from '../../Models/LogFileSizeModel';
import { getLogFileProgress } from 'App/Stores/BeepBase/Selectors'
import { getEraseLogFileProgress } from 'App/Stores/BeepBase/Selectors'
import { getUseProduction } from '../../Stores/User/Selectors';
import { ERASE_TYPE, UploadResponseModel } from '../../Models/UploadResponseModel';

// Components
import { Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader'
import { ScrollView } from 'react-native-gesture-handler';
import * as Progress from 'react-native-progress';
import Modal from 'react-native-modal';

type STATE = 
  "idle" |
  "downloading" |
  "uploading" |
  "completed" |
  "erasing" |
  "failed"

interface Props {
}

const LogFileScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [isModalVisible, setModalVisible] = useState(false)
  const peripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const logFileSize: LogFileSizeModel = useTypedSelector<LogFileSizeModel>(getLogFileSize)
  const logFileProgress: number = useTypedSelector<number>(getLogFileProgress)
  const eraseLogFileProgress: number = useTypedSelector<number>(getEraseLogFileProgress)
  const [eraseType, setEraseType] = useState<ERASE_TYPE>("none")
  const [fullEraseStart, setFullEraseStart] = useState<Date>()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [state, setState] = useState<STATE>("idle")
  const [error, setError] = useState("")
  const useProduction = useTypedSelector<boolean>(getUseProduction)
        
  const TIMEOUT = 10000

  useEffect(() => {
    dispatch(BeepBaseActions.setLogFileSize(undefined))
    dispatch(BeepBaseActions.clearLogFileFrames())
    if (peripheral) {
      BleHelpers.write(peripheral.id, COMMANDS.SIZE_MX_FLASH)
    }  
  }, []);

  useTimeout(() => {
    setState("failed")
    setError(t("logFile.timeout"))
  }, state == "downloading" && logFileProgress == 0 ? TIMEOUT : null)

  useInterval(() => {
    const diff = new Date().valueOf() - fullEraseStart?.valueOf()
    dispatch(BeepBaseActions.setEraseLogFileProgress(diff / 1000 / 250))
  }, (state == "erasing" && eraseType == "full") ? (__DEV__ ? 5000 : 1000) : null)

  useEffect(() => {
    if (logFileProgress > 0 && logFileProgress === logFileSize?.value()) {
      //download finished, copy to SD card
      // BleHelpers.exportLogFile()   //when uncommenting, also uncomment permission request in onDownloadLogFilePress()

      //download finished, upload to api
      setState("uploading")
      RNFS.uploadFiles({
        toUrl: ApiService.getLogFileUploadUrl(useProduction, logFileSize?.value()),
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
          console.log('FILES UPLOADED!', response); // response.statusCode, response.headers, response.body
          setUploadProgress(1)
          const parsedJson = JSON.parse(response.body)
          const uploadResponse = new UploadResponseModel(parsedJson)
          if (uploadResponse.shouldErase()) {
            setState("erasing")
            const eraseCode = uploadResponse.getEraseCode()
            BleHelpers.write(peripheral.id, COMMANDS.ERASE_MX_FLASH, eraseCode)
            const et = uploadResponse.getEraseType()
            setEraseType(et)
            if (et == "full") {
              setFullEraseStart(new Date())
            }
          } else {
            setState("completed")
            setModalVisible(true)
          }
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

  useEffect(() => {
    if (eraseLogFileProgress == 1) {
      setState("completed")
      setModalVisible(true)
    }
  }, [eraseLogFileProgress]);

  const onGetLogFileSizePress = () => {
    if (peripheral) {
      BleHelpers.write(peripheral.id, COMMANDS.SIZE_MX_FLASH)
    }
  }

  const onDownloadLogFilePress = async () => {
    onGetLogFileSizePress()
    if (logFileSize) {
      setUploadProgress(0)
      setState("downloading")
      setError("")
      dispatch(BeepBaseActions.clearLogFileFrames())
      dispatch(BeepBaseActions.setEraseLogFileProgress(0))
      if (peripheral) {
        BleHelpers.initLogFile().then(() => {
          BleHelpers.write(peripheral.id, [0x20, 0x00, 0x00, 0x00, 0x00])
        })
      }
    }
  }

  let downloadProgress = logFileProgress / logFileSize?.value()
  if (isNaN(downloadProgress)) {
    downloadProgress = 0
  }

  const hideModal = () => {
    setModalVisible(false)
    dispatch(BeepBaseActions.clearLogFileFrames())
    setUploadProgress(0)
    dispatch(BeepBaseActions.setEraseLogFileProgress(0))
    setState("idle")
    setError("")
    onGetLogFileSizePress()
  }

  const [storedLogFiles, setStoredLogFiles] = useState<LogFileInfo[]>([]);
  const [selectedLogFile, setSelectedLogFile] = useState<LogFileInfo | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    dispatch(BeepBaseActions.setLogFileSize(undefined))
    dispatch(BeepBaseActions.clearLogFileFrames())
    loadStoredLogFiles() // Add this
    if (peripheral) {
      BleHelpers.write(peripheral.id, COMMANDS.SIZE_MX_FLASH)
    }  
  }, []);

  const loadStoredLogFiles = async () => {
    try {
      const files = await LogFileModel.getStoredLogFiles();
      setStoredLogFiles(files);
    } catch (error) {
      setError(`Failed to load stored files: ${error.message}`);
    }
  };

  const uploadStoredLogFile = async (logFile: LogFileInfo) => {
    setUploadProgress(0);
    setState("uploading");
    setError("");

    try {
      const response = await RNFS.uploadFiles({
        toUrl: ApiService.getLogFileUploadUrl(useProduction, logFile.size),
        files: [{ 
          name: "file", 
          filename: logFile.name,
          filepath: logFile.path,
          filetype: "text/plain"
        }],
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${ApiService.getToken()}`
        },
        fields: {
          "id": peripheral.deviceId,
        },
        begin: () => setUploadProgress(0),
        progress: (response) => setUploadProgress(response.totalBytesSent / response.totalBytesExpectedToSend)
      }).promise;

      if (response.statusCode === 200) {
        const parsedJson = JSON.parse(response.body);
        const uploadResponse = new UploadResponseModel(parsedJson);
        
        if (uploadResponse.shouldErase()) {
          setState("erasing");
          const eraseCode = uploadResponse.getEraseCode();
          BleHelpers.write(peripheral.id, COMMANDS.ERASE_MX_FLASH, eraseCode);
          const et = uploadResponse.getEraseType();
          setEraseType(et);
          if (et === "full") {
            setFullEraseStart(new Date());
          }
        } else {
          setState("completed");
          setModalVisible(true);
        }
      } else {
        setUploadProgress(0);
        setState("failed");
        setError(`${response.statusCode}: ${response.body}`);
      }
    } catch (error) {
      setUploadProgress(0);
      setError(error.message);
      setState("failed");
    }
  };

  const confirmDelete = (logFile: LogFileInfo) => {
    setSelectedLogFile(logFile);
    setShowDeleteConfirm(true);
  };

  const deleteStoredLogFile = async () => {
    if (!selectedLogFile) return;
    
    try {
      await LogFileModel.deleteLogFile(selectedLogFile.path);
      await loadStoredLogFiles();
      setShowDeleteConfirm(false);
      setSelectedLogFile(null);
    } catch (error) {
      setError(`Failed to delete file: ${error.message}`);
    }
  };


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
        disabled={
          logFileSize == undefined || 
          logFileSize.value() == 0 || 
          state == "downloading" || 
          state == "uploading" ||
          state == "erasing"
        }
      >
        <Text style={styles.text}>{t("logFile.downloadLogFile")}</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />

      <Text style={styles.instructions}>{t(`logFile.instructions${ state == "downloading" || state == "uploading" || state == "erasing" ? "InProgress" : "" }`)}</Text>
      
    {/* Add stored files section */}
      <View style={styles.spacerDouble} />
      <Text style={styles.label}>{t("logFile.storedFiles")}</Text>
      <View style={styles.spacer} />
      
      {storedLogFiles.map(logFile => (
        <TouchableOpacity
          key={logFile.path}
          style={[
            styles.storedFileRow,
            selectedLogFile?.path === logFile.path && styles.selectedFile
          ]}
          onPress={() => setSelectedLogFile(logFile)}
        >
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{logFile.name}</Text>
            <Text style={styles.fileDetails}>
              {DateTimeHelper.formatDateTime(logFile.created)} - {FormatHelpers.formatSizeAsHumanReadable(logFile.size)}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
      
      {selectedLogFile && (
        <View style={styles.selectedFileActions}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => uploadStoredLogFile(selectedLogFile)}
            disabled={state === "uploading"}
          >
            <Text style={styles.text}>{t("logFile.upload")}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={() => confirmDelete(selectedLogFile)}
          >
            <Text style={styles.text}>{t("logFile.delete")}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.spacerDouble} />
      <Text style={styles.label}>{t("logFile.progress")}</Text>
      <View style={styles.spacer} />

      <View style={{ flexDirection: "row", flex: 1, justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={[styles.text]}>{t("logFile.download")}</Text>
          <View style={styles.spacer} />
          <Text style={[styles.text]}>{t("logFile.upload")}</Text>
          <View style={styles.spacer} />
          <Text style={[styles.text]}>{t("logFile.erase")}</Text>
        </View>
        <View style={styles.spacer} />
        <View>
          <Progress.Bar progress={downloadProgress} width={150} height={20} color={Colors.yellow} borderColor={Colors.black} borderRadius={8} />
          <View style={styles.spacer} />
          <Progress.Bar progress={uploadProgress} width={150} height={20} color={Colors.yellow} borderColor={Colors.black} borderRadius={8} />
          <View style={styles.spacer} />
          <Progress.Bar progress={eraseLogFileProgress} width={150} height={20} color={Colors.yellow} borderColor={Colors.black} borderRadius={8} />
        </View>
        <View style={styles.spacer} />
        <View>
          <Text style={[styles.text]}>{`${Math.floor(downloadProgress * 100)} %`}</Text>
          <View style={styles.spacer} />
          <Text style={[styles.text]}>{`${Math.floor(uploadProgress * 100)} %`}</Text>
          <View style={styles.spacer} />
          <Text style={[styles.text]}>{`${Math.floor(eraseLogFileProgress * 100)} %`}</Text>
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
    <Modal
      isVisible={showDeleteConfirm}
      onBackdropPress={() => setShowDeleteConfirm(false)}
      onBackButtonPress={() => setShowDeleteConfirm(false)}
      useNativeDriver={true}
      backdropOpacity={0.3}
    >
      <View style={ApplicationStyles.modalContainer}>
        <Text style={[styles.itemText, { ...Fonts.style.bold }]}>{t("logFile.deleteConfirm")}</Text>
        <View style={styles.spacer} />
        <View style={styles.itemContainer}>
          <Text style={styles.itemText}>{t("logFile.deleteConfirmMessage")}</Text>
          <View style={styles.spacerDouble} />
          <View style={ApplicationStyles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.deleteButton]}
              onPress={deleteStoredLogFile}
            >
              <Text style={styles.text}>{t("common.btnDelete")}</Text>
            </TouchableOpacity>
            <View style={styles.spacer} />
            <TouchableOpacity 
              style={styles.button}
              onPress={() => setShowDeleteConfirm(false)}
            >
              <Text style={styles.text}>{t("common.btnCancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    <Modal
      isVisible={isModalVisible}
      onBackdropPress={hideModal}
      onBackButtonPress={hideModal}
      useNativeDriver={true}
      backdropOpacity={0.3}
    >
      <View style={ApplicationStyles.modalContainer}>
        <Text style={[styles.itemText, { ...Fonts.style.bold }]}>{t("logFile.screenTitle")}</Text>
        <View style={styles.spacer} />
        <View style={styles.itemContianer}>
          <Text style={styles.itemText}>{t("logFile.uploadedMessage")}</Text>
          { eraseLogFileProgress == 1 && <>
            <View style={styles.spacer} />
            <Text style={styles.itemText}>{t("logFile.erasedMessage")}</Text>
          </>}
          <View style={styles.spacerDouble} />
          <View style={ApplicationStyles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={hideModal}>
              <Text style={styles.text}>{t("common.btnOk")}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.spacerHalf} />
        </View>
      </View>
    </Modal>

  </>)
}

const additionalStyles = StyleSheet.create({
  storedFileRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },
  selectedFile: {
    backgroundColor: Colors.lightYellow,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    ...Fonts.style.normal,
    fontSize: 16,
  },
  fileDetails: {
    ...Fonts.style.normal,
    fontSize: 14,
    color: Colors.grey,
  },
  selectedFileActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  deleteButton: {
    backgroundColor: Colors.error,
  },
});

export default LogFileScreen