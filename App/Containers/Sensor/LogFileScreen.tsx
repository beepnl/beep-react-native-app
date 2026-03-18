import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import { ApplicationStyles, Colors, Fonts } from '@/App/Theme';
import styles from './styles';

// Utils
import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';
import { BleLogger } from '@/App/Helpers/BleLogger';
import useInterval from '@/App/Helpers/useInterval';
import { fetch } from 'expo/fetch';

// Data
import { LogFileSizeModel } from '@/App/Models/LogFileSizeModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import { ERASE_TYPE, UploadResponseModel } from '@/App/Models/UploadResponseModel';
import BeepBaseActions from '@/App/Stores/BeepBase/Actions';
import { getEraseLogFileProgress, getLogFileProgress, getLogFileSize, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';
import { getUseProduction } from '@/App/Stores/User/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import ApiService from '@/App/Services/ApiService';
import { Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';
import * as Progress from 'react-native-progress';

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
  const [isBackModalVisible, setBackModalVisible] = useState(false);
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
  const [pendingBackAction, setPendingBackAction] = useState<any>(null);
  const [lastDownloadActivityAt, setLastDownloadActivityAt] = useState<number>()
  const uploadStartedRef = useRef(false)
        
  const TIMEOUT = 10000

  const resetTransferState = () => {
    uploadStartedRef.current = false
    setLastDownloadActivityAt(undefined)
    setUploadProgress(0)
    dispatch(BeepBaseActions.setEraseLogFileProgress(0))
    BleLogger.setDownloadMode(false)
    if (peripheral?.id) {
      BleHelpers.stopLogFileNotification(peripheral.id).catch(() => undefined)
    }
  }

  useEffect(() => {
    dispatch(BeepBaseActions.setLogFileSize(undefined))
    dispatch(BeepBaseActions.clearLogFileFrames())
    if (peripheral?.id) {
      BleHelpers.write(peripheral.id, COMMANDS.SIZE_MX_FLASH)
    }

    return () => {
      BleLogger.setDownloadMode(false)
      if (peripheral?.id) {
        BleHelpers.stopLogFileNotification(peripheral.id).catch(() => undefined)
      }
    }
  }, [dispatch, peripheral?.id]);

  usePreventRemove(
    state === "downloading" || state === "uploading" || state === "erasing",
    ({ data }) => {
      setPendingBackAction(data.action);
      setBackModalVisible(true);
    }
  );

  const hideBackModal = () => {
    setBackModalVisible(false);
    setPendingBackAction(null);
  };

  const doNavigateBack = async () => {
    setBackModalVisible(false);
    resetTransferState()
    dispatch(BeepBaseActions.clearLogFileFrames())
    setState("idle")
    //TODO: stop transfer?
    if (pendingBackAction) {
      navigation.dispatch(pendingBackAction);
    }
    setPendingBackAction(null);
  };

  useEffect(() => {
    if (state === "downloading") {
      setLastDownloadActivityAt(Date.now())
    } else {
      setLastDownloadActivityAt(undefined)
    }
  }, [state])

  useEffect(() => {
    if (state === "downloading" && logFileProgress > 0) {
      setLastDownloadActivityAt(Date.now())
    }
  }, [logFileProgress, state])

  useInterval(() => {
    if (lastDownloadActivityAt && (Date.now() - lastDownloadActivityAt) >= TIMEOUT) {
      resetTransferState()
      dispatch(BeepBaseActions.clearLogFileFrames())
      setState("failed")
      setError(t("logFile.timeout"))
    }
  }, state === "downloading" && lastDownloadActivityAt ? 1000 : null)

  useInterval(() => {
    const diff = new Date().valueOf() - fullEraseStart?.valueOf()
    dispatch(BeepBaseActions.setEraseLogFileProgress(diff / 1000 / 250))
  }, (state == "erasing" && eraseType == "full") ? (__DEV__ ? 5000 : 1000) : null)

  const uploadLogFile = async () => {
    try {
      setUploadProgress(0);

      const uploadUrl = ApiService.getLogFileUploadUrl(
        useProduction,
        logFileSize?.value()
      );

      if (BleHelpers.LOG_FILE) {
        if ((BleHelpers.LOG_FILE.size ?? 0) <= 0) {
          throw new Error('Log download completed, but the file is empty.')
        }
        if (!peripheral?.id) {
          throw new Error('No connected BEEP base available for log upload.')
        }
        const formData = new FormData();
        if (!peripheral?.deviceId) {
          throw new Error('No linked BEEP base id found for upload.')
        }
        formData.append('id', peripheral.deviceId);
        formData.append('file', BleHelpers.LOG_FILE, BleHelpers.LOG_FILE_NAME)
        setUploadProgress(0.5);
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${ApiService.getToken()}`,
          },
          body: formData,
          // not supported in expo fetch
          // onUploadProgress({ loaded, total }) {
          //   if (total) {
          //     setUploadProgress(loaded / total);
          //   }
          // },
        });
  
        console.log('Upload response:', response);
        if (response.ok) {
          setUploadProgress(1);
  
          const parsedJson = await response.json();
          const uploadResponse = new UploadResponseModel(parsedJson);

          if (uploadResponse.shouldErase()) {
            const eraseCode = uploadResponse.getEraseCode();
            await BleHelpers.write(
              peripheral.id,
              COMMANDS.ERASE_MX_FLASH,
              eraseCode,
              { throwOnError: true }
            );
  
            const et = uploadResponse.getEraseType();
            setEraseType(et);
            setState('erasing');
            if (et === 'full') {
              setFullEraseStart(new Date());
            }
          } else {
            setState('completed');
            setModalVisible(true);
          }
        } else {
          console.log('SERVER ERROR', response);
          setUploadProgress(0);
          setState('failed');
          setError(
            `Upload failed: log file saved locally as ${BleHelpers.LOG_FILE.uri}`
          );
          BleLogger.setDownloadMode(false);
        }
      } else {
        BleLogger.log('No log file to upload');
        setState('failed')
        setError('Log download did not produce a file.')
      }
    } catch (err: any) {
      setUploadProgress(0);
      setState('failed');
      setError(err?.message ?? 'Upload failed');
      console.log(err);
      BleLogger.setDownloadMode(false);
    }
  };

  useEffect(() => {
    if (state !== "downloading" || uploadStartedRef.current) {
      return
    }

    if (logFileProgress > 0 && logFileSize?.value() && logFileProgress >= logFileSize.value()) {
      uploadStartedRef.current = true
      //download finished, copy to SD card
      BleHelpers.exportLogFile()   //when uncommenting, also uncomment permission request in onDownloadLogFilePress()

      //download finished, disable download mode and upload to api
      BleLogger.setDownloadMode(false)
      if (peripheral?.id) {
        BleHelpers.stopLogFileNotification(peripheral.id).catch(() => undefined)
      }
      setLastDownloadActivityAt(undefined)
      setState("uploading")

      uploadLogFile()
    }
  }, [logFileProgress, logFileSize, state]);

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
    if (!peripheral?.id || !peripheral?.isConnected) {
      setError('Connect to a BEEP base before downloading logs.')
      return
    }

    if (!logFileSize) {
      onGetLogFileSizePress()
      setError('Log size is still loading. Please try again in a moment.')
      return
    }

    if (logFileSize.value() <= 0) {
      setError('No log file data available to download.')
      return
    }

    resetTransferState()
    setState("downloading")
    setError("")
    dispatch(BeepBaseActions.clearLogFileFrames())
    
    // Enable download mode to optimize performance
    BleLogger.setDownloadMode(true)
    
    try {
      await BleHelpers.ensureLogFileNotification(peripheral.id)
    } catch (notificationError: any) {
      resetTransferState()
      setState("failed")
      setError(notificationError?.message ?? 'Failed to prepare log transfer.')
      return
    }

    //create new log file
    BleHelpers.initLogFile()
    try {
      await BleHelpers.write(peripheral.id, [COMMANDS.READ_MX_FLASH, 0x00, 0x00, 0x00, 0x00], undefined, { throwOnError: true })
    } catch (downloadError: any) {
      resetTransferState()
      setState("failed")
      setError(downloadError?.message ?? 'Failed to start log download.')
    }
  }

  let downloadProgress = logFileProgress / logFileSize?.value()
  if (isNaN(downloadProgress)) {
    downloadProgress = 0
  }

  const hideModal = () => {
    setModalVisible(false)
    dispatch(BeepBaseActions.clearLogFileFrames())
    resetTransferState()
    setEraseType("none")
    setFullEraseStart(undefined)
    setState("idle")
    setError("")

    onGetLogFileSizePress()
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
        <Text style={styles.error}>{`Error: ${error}`}</Text>
      </>}

    </ScrollView>

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
        <View style={styles.itemContainer}>
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

    <Modal
      isVisible={isBackModalVisible}
      onBackdropPress={hideBackModal}
      onBackButtonPress={hideBackModal}
      useNativeDriver={true}
      backdropOpacity={0.3}
    >
      <View style={ApplicationStyles.modalContainer}>
        <Text style={[styles.itemText, { ...Fonts.style.bold }]}>{t("logFile.screenTitle")}</Text>
        <View style={styles.spacer} />
        <View style={styles.itemContainer}>
          <Text style={styles.itemText}>{t("logFile.backMessage")}</Text>
          <View style={styles.spacerDouble} />
          <View style={ApplicationStyles.buttonsContainer}>
            <TouchableOpacity style={[styles.button, { width: "40%" }]} onPress={doNavigateBack}>
              <Text style={styles.text}>{t("logFile.btnStop")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { width: "40%" }]} onPress={hideBackModal}>
              <Text style={styles.text}>{t("logFile.btnContinue")}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.spacerHalf} />
        </View>
      </View>
    </Modal>

  </>)
}

export default LogFileScreen
