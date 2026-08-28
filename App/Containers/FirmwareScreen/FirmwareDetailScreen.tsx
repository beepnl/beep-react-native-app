import React, { FunctionComponent, useEffect, useState } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { usePreventRemove } from '@react-navigation/native';

// Styles
import { Colors, Fonts } from '@/App/Theme';
import styles from './FirmwareScreenStyle';

// Utils
import ExpoNordicDfu from '@getquip/expo-nordic-dfu';
import { File, Paths } from 'expo-file-system';

// Data
import { FirmwareModel } from '@/App/Models/FirmwareModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import BeepBaseActions from '@/App/Stores/BeepBase/Actions';
import { getFirmwareVersion, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';
import { Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import * as Progress from 'react-native-progress';
import { FirmwareVersionModel } from '@/App/Models/FirmwareVersionModel';

export type FirmwareDetailScreenNavigationParams = {
  FirmwareDetailScreen: {
    firmware: FirmwareModel,
    returnToLogDownload?: boolean,
  },
}

const getIsUpdating = (state: string) => {
  return state === "ENABLING_DFU_MODE" || 
         state === "CONNECTING" || 
         state === "CONNECTED" || 
         state === "DEVICE_DISCONNECTING" || 
         state === "DFU_PROCESS_STARTING" ||
         state === "DFU_PROCESS_STARTED" ||
         state == "DFU_UPLOADING" ||
         state === "FIRMWARE_VALIDATING"
}

type Props = any

const FirmwareDetailScreen: FunctionComponent<Props> = ({
  route,
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const peripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const firmware: FirmwareModel = route.params?.firmware
  const firmwareVersion: FirmwareVersionModel | undefined = useTypedSelector<FirmwareVersionModel | undefined>(getFirmwareVersion)
  const [dfuProgress, setDfuProgress] = useState(0)
  const [dfuState, setDfuState] = useState("")
  const [error, setError] = useState("")
  const [dfuTransferResult, setDfuTransferResult] = useState("")
  const [dfuReconnectRetry, setDfuReconnectRetry] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const progressSubscription = ExpoNordicDfu.module.addListener("DFUProgress", (params: any) => {
        const { percent, currentPart } = params
        const partsTotal = params.totalParts ?? params.partsTotal   //this can be removed once the naming is consistent across platforms
        if (percent != undefined && currentPart != undefined) {
          const maxPercent = 100 / (partsTotal ?? 1)
          const offset = (currentPart - 1) * maxPercent
          const scaledPercent = percent / (partsTotal ?? 1)
          const progress = offset + scaledPercent
          setDfuProgress(progress / 100)
        }
      }
    );
    
    const stateSubscription = ExpoNordicDfu.module.addListener("DFUStateChanged", ({ state }) => {
      console.log("DFU State:", state);
      if (state != undefined) {
        //track internal state for UI updates
        setDfuState(state)

        if (state === "DFU_FAILED" || state === "DFU_ABORTED") {
          setDfuProgress(0)
        }

        //update 'dfu is updating flag' in store for error drop down visibility logic
        const isUpdating = getIsUpdating(state)
        dispatch(BeepBaseActions.setDfuUpdating(isUpdating))
      }
    });

    return () => {
      progressSubscription?.remove()
      stateSubscription?.remove()
      dispatch(BeepBaseActions.setDfuUpdating(false))
    }
  }, [dispatch]);

  //prevent navigating away from screen while updating firmware
  usePreventRemove(getIsUpdating(dfuState), () => { });

  const delay = (ms: number) => new Promise(res=>setTimeout(res, ms));

  const onInstallFirmwarePress = async () => {
    console.log("onInstallFirmwarePress")
    setBusy(true)
    setError("")
    setDfuTransferResult("")
    setDfuProgress(0)
    setDfuReconnectRetry(0)
    const destination = new File(Paths.cache, 'firmware.zip');
    console.log("destination", destination)
    let dfuStarted = false

    try {
      if (!firmware?.url) {
        throw new Error("No firmware download URL available.")
      }
      if (!peripheral?.id) {
        throw new Error("No BEEP base is connected.")
      }

      console.log("starting download", firmware.url)
      const result = await File.downloadFileAsync(firmware.url, destination, { idempotent: true });
      // console.log(result.exists);
      const peripheralId = peripheral.id
      console.log("download successful")

      await BleHelpers.disconnectPeripheral(peripheralId).catch((disconnectError) => {
        console.log("disconnect before DFU failed; continuing", disconnectError)
      })

      console.log("disconnect successful")
      await delay(500)
      console.log("starting DFU upload")
      dfuStarted = true
      const res: any = await ExpoNordicDfu.startDfu({
        deviceAddress: peripheralId,
        fileUri: result.uri,
        android: {
          deviceName: peripheral.name,
          keepBond: true,
          numberOfRetries: 3,
        },
        ios: {
          connectionTimeout: 15000,
          disableResume: false,
        },
      })

      console.log("DFU upload successful")
      setDfuTransferResult(res.deviceAddress)

      const RETRY_COUNT = 10
      let reconnected = false
      for (let retry = 1; retry <= RETRY_COUNT; retry += 1) {
        console.log(`Reconnecting to device attempt ${retry}`)
        setDfuReconnectRetry(retry)
        try {
          const isConnected = await BleHelpers.isConnected(peripheralId)
          if (!isConnected) {
            await BleHelpers.connectPeripheral(peripheralId)
          } else {
            await BleHelpers.retrieveServices(peripheralId)
          }
          await BleHelpers.write(peripheralId, COMMANDS.READ_FIRMWARE_VERSION, undefined, { throwOnError: true })
          reconnected = true
          break
        } catch (reconnectError) {
          console.log("reconnect retry error", reconnectError)
          await delay(3000)
        }
      }

      if (!reconnected) {
        throw new Error("Firmware updated, but reconnecting to the BEEP base failed.")
      }

      dispatch(BeepBaseActions.setDfuUpdating(false))
      if (route.params?.returnToLogDownload) {
        navigation.navigate("LogFileScreen", { autoStart: true, peripheralId: route.params?.peripheralId ?? peripheral?.id, deviceId: route.params?.deviceId ?? peripheral?.deviceId })
      }
    } catch (error: any) {
      console.error("Error error in onInstallFirmwarePress", error);
      if (dfuStarted) {
        ExpoNordicDfu.abortDfu()
      }
      dispatch(BeepBaseActions.setDfuUpdating(false))
      setError(error.message ?? error.Message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.mainContainer}>
      <ScreenHeader title={t("firmware.screenTitle")} back={!getIsUpdating(dfuState)} />

      <ScrollView style={styles.container} >
        <View style={styles.spacer} />

        <Text style={[styles.text, { ...Fonts.style.bold }]}>{`BEEP base ${firmware.version}`}</Text>
        <Text style={styles.instructions}>{firmware.size}</Text>
        <View style={styles.spacerDouble} />
        <Text style={styles.text}>{firmware.releaseNotes}</Text>

        <View style={styles.spacerDouble} />

        <TouchableOpacity style={styles.button} onPress={onInstallFirmwarePress} disabled={busy} >
          <Text style={styles.text}>{t("firmware.install")}</Text>
        </TouchableOpacity>
        
        <View style={styles.spacerDouble} />

        <View style={{ flexDirection: "row", flex: 1, justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={[styles.text]}>{t("firmware.progress")}</Text>
          </View>
          <View style={styles.spacer} />
          <View>
            <Progress.Bar progress={dfuProgress} width={150} height={20} color={Colors.yellow} borderColor={Colors.black} borderRadius={8} />
          </View>
          <View style={styles.spacer} />
          <View>
            <Text style={[styles.text]}>{`${Math.floor(dfuProgress * 100)} %`}</Text>
          </View>
        </View>


        {/* { !!dfuState && <>
          <View style={styles.spacer} />
          <Text style={[styles.instructions]}>{t(`firmware.${dfuState}`)}</Text>
        </>} */}

        { firmwareVersion?.toString() == firmware.version ? <>
          <View style={styles.spacer} />
          <Text style={[styles.instructions]}>{t("firmware.success", { version: firmware.version })}</Text>
        </> :
          !!dfuState && <>
          <View style={styles.spacer} />
          <Text style={[styles.instructions]}>{t(`firmware.${dfuState}`)}</Text>
        </>}

        { !!error && <>
          <View style={styles.spacer} />
          <Text style={styles.error}>{`Error: ${error}`}</Text>
        </>}

        <View style={styles.spacer} />

        {/* <Text style={[styles.text]}>{`Progress: ${dfuProgress} %`}</Text>
        <Text style={[styles.text]}>{`State: ${dfuState}`}</Text>
        <Text style={[styles.text]}>{`Transfer result: ${dfuTransferResult}`}</Text>
        <Text style={[styles.text]}>{`Reconnect retry: ${dfuReconnectRetry}`}</Text> */}

      </ScrollView>
    </View>
  )
}

export default FirmwareDetailScreen
