import React, { FunctionComponent, useEffect, useState } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import { useNavigation, usePreventRemove, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import { ApplicationStyles, Colors, Fonts } from '@/App/Theme';
import styles from './styles';

// Utils
import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';
import useInterval from '@/App/Helpers/useInterval';
import useTimeout from '@/App/Helpers/useTimeout';
import { fetch } from 'expo/fetch';

// Data
import { LogFileSizeModel } from '@/App/Models/LogFileSizeModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import { ERASE_TYPE, UploadResponseModel } from '@/App/Models/UploadResponseModel';
import BeepBaseActions from '@/App/Stores/BeepBase/Actions';
import { getEraseLogFileProgress, getError as getBleError, getLogDownloadError, getLogFileProgress, getLogFileSize, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';
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
  const route = useRoute<any>();
  const [isModalVisible, setModalVisible] = useState(false)
  const [isBackModalVisible, setBackModalVisible] = useState(false);
  const peripheral: PairedPeripheralModel | undefined = useTypedSelector<PairedPeripheralModel | undefined>(getPairedPeripheral)
  const routePeripheralId = route.params?.peripheralId as string | undefined
  const routeDeviceId = route.params?.deviceId?.toString?.() ?? route.params?.device?.id?.toString?.()
  const activePeripheralId = routePeripheralId ?? peripheral?.id
  const activeDeviceId = routeDeviceId ?? peripheral?.deviceId
  const logFileSize: LogFileSizeModel | undefined = useTypedSelector<LogFileSizeModel | undefined>((state) => getLogFileSize(state, activePeripheralId))
  const logFileProgress: number = useTypedSelector<number>((state) => getLogFileProgress(state, activePeripheralId))
  const eraseLogFileProgress: number = useTypedSelector<number>((state) => getEraseLogFileProgress(state, activePeripheralId))
  const logDownloadError: string | undefined = useTypedSelector<string | undefined>((state) => getLogDownloadError(state, activePeripheralId))
  const bleError: string | undefined = useTypedSelector<string | undefined>(getBleError)
  const [eraseType, setEraseType] = useState<ERASE_TYPE>("none")
  const [fullEraseStart, setFullEraseStart] = useState<Date>()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [state, setState] = useState<STATE>("idle")
  const [error, setError] = useState("")
  const useProduction = useTypedSelector<boolean>(getUseProduction)
  const [pendingBackAction, setPendingBackAction] = useState<any>(null);
  const autoStart = route.params?.autoStart;

  const TIMEOUT = 10000

  useEffect(() => {
    dispatch(BeepBaseActions.setLogFileSize(undefined, activePeripheralId))
    dispatch(BeepBaseActions.clearLogFileFrames(activePeripheralId))
    if (activePeripheralId) {
      BleHelpers.write(activePeripheralId, COMMANDS.SIZE_MX_FLASH)
    }  
  }, [activePeripheralId]);

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

  const doNavigateBack = () => {
    setBackModalVisible(false);
    //TODO: stop transfer?
    if (pendingBackAction) {
      navigation.dispatch(pendingBackAction);
    }
    setPendingBackAction(null);
  };

  useTimeout(() => {
    setState("failed")
    setError(t("logFile.timeout"))
    // Disable download mode on timeout
    // BleLogger.setDownloadMode(false)
  }, state == "downloading" && logFileProgress == 0 ? TIMEOUT : null)

  useInterval(() => {
    const diff = new Date().valueOf() - (fullEraseStart?.valueOf() || 0)
    // Cap simulated progress at 0.99; it reaches 1.0 only on firmware confirmation
    dispatch(BeepBaseActions.setEraseLogFileProgress(Math.min(0.99, diff / 1000 / 250), activePeripheralId))
  }, (state == "erasing" && eraseType == "full") ? (__DEV__ ? 5000 : 1000) : null)

  const uploadLogFile = async () => {
    try {
      setUploadProgress(0);

      if (!activePeripheralId || !activeDeviceId) {
        setState('failed');
        setError('Upload failed: no registered BEEP device is connected.');
        return;
      }

      const logFile = BleHelpers.getLogFile(activePeripheralId);
      if (!logFile?.exists || !logFile?.size) {
        setState('failed');
        setError('Upload failed: downloaded log file is empty or missing.');
        return;
      }

      const logSizeBytes = logFileSize?.value();
      if (!logSizeBytes) {
        setState('failed');
        setError('Upload failed: device log size is unknown.');
        return;
      }

      const token = ApiService.getToken();
      if (!token) {
        setState('failed');
        setError('Upload failed: you are not logged in.');
        return;
      }

      const uploadUrl = ApiService.getLogFileUploadUrl(
        useProduction,
        logSizeBytes
      );

      if (logFile) {
        const logFileName = BleHelpers.getLogFileName(activePeripheralId);
        const formData = new FormData();
        formData.append('id', activeDeviceId);
        formData.append('file', logFile, logFileName);

        console.log(
          `[RN] Uploading log file ${logFileName} for device ${activeDeviceId}: ` +
          `${logFile.size} encoded bytes, ${logSizeBytes} source bytes`
        );

        setUploadProgress(0.5);
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
  
        console.log('Upload response:', response);
        if (response.ok) {
          setUploadProgress(1);
  
          const parsedJson = await response.json();
          const uploadResponse = new UploadResponseModel(parsedJson);

          if (uploadResponse.shouldErase()) {
            setState('erasing');

            const eraseCode = uploadResponse.getEraseCode();
            BleHelpers.write(
              activePeripheralId,
              COMMANDS.ERASE_MX_FLASH,
              eraseCode
            );
  
            const et = uploadResponse.getEraseType();
            setEraseType(et);
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
          const responseText = await response.text().catch(() => '');
          setError(`Upload failed: server returned ${response.status}${responseText ? ` - ${responseText}` : ''}`);
        }
      }
    } catch (err: any) {
      setUploadProgress(0);
      setState('failed');
      setError(err?.message ?? 'Upload failed');
      console.log(err);
    }
  };

  useEffect(() => {
    if (state === "downloading" && logFileProgress > 0 && logFileSize && logFileProgress >= logFileSize.value()) {
      //download finished, copy to SD card
      BleHelpers.exportLogFile()   //when uncommenting, also uncomment permission request in onDownloadLogFilePress()

      //download finished, disable download mode and upload to api
      // BleLogger.setDownloadMode(false)
      setState("uploading")

      uploadLogFile()
    }    
  }, [logFileProgress, state, logFileSize, activePeripheralId, activeDeviceId]);

  useEffect(() => {
    if (autoStart && state === 'idle' && logFileSize && logFileSize.value() > 0 && uploadProgress === 0 && logFileProgress === 0) {
      onDownloadLogFilePress();
    }
  }, [autoStart, state, logFileSize, logFileProgress, uploadProgress]);

  useEffect(() => {
    if (state === "erasing" && eraseLogFileProgress >= 1) {
      setState("completed")
      setModalVisible(true)
    }
  }, [eraseLogFileProgress, state]);

  useEffect(() => {
    const activeError = logDownloadError ?? (!activePeripheralId ? bleError : undefined)
    if (activeError && (state === "downloading" || state === "erasing")) {
      setUploadProgress(0)
      setState("failed")
      setError(activeError)
    }
  }, [logDownloadError, bleError, activePeripheralId, state]);

  const onGetLogFileSizePress = () => {
    if (activePeripheralId) {
      BleHelpers.write(activePeripheralId, COMMANDS.SIZE_MX_FLASH)
    }
  }

  const onDownloadLogFilePress = async () => {
    onGetLogFileSizePress()
    if (logFileSize) {
      setUploadProgress(0)
      setState("downloading")
      setError("")
      dispatch(BeepBaseActions.clearLogFileFrames(activePeripheralId))
      dispatch(BeepBaseActions.setEraseLogFileProgress(0, activePeripheralId))
      
      // Enable download mode to optimize performance
      // BleLogger.setDownloadMode(true)
      
      if (activePeripheralId) {
        //create new log file
        BleHelpers.initLogFile(activePeripheralId, activeDeviceId)
        BleHelpers.write(activePeripheralId, [COMMANDS.READ_MX_FLASH, 0x00, 0x00, 0x00, 0x00])
      }
    }
  }

  let downloadProgress = logFileSize ? logFileProgress / logFileSize.value() : 0
  if (isNaN(downloadProgress)) {
    downloadProgress = 0
  }

  const hideModal = () => {
    setModalVisible(false)
    dispatch(BeepBaseActions.clearLogFileFrames(activePeripheralId))
    setUploadProgress(0)
    dispatch(BeepBaseActions.setEraseLogFileProgress(0, activePeripheralId))
    setState("idle")
    setError("")
    
    // Ensure download mode is disabled when resetting
    // BleLogger.setDownloadMode(false)
    
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
