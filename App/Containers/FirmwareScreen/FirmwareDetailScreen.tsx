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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
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
  firmware: FirmwareModel,
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

type Props = NativeStackScreenProps<FirmwareDetailScreenNavigationParams>

const FirmwareDetailScreen: FunctionComponent<Props> = ({
  route,
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const peripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const firmware: FirmwareModel = route.params?.firmware
  const firmwareVersion: FirmwareVersionModel = useTypedSelector<FirmwareVersionModel>(getFirmwareVersion)
  const [dfuProgress, setDfuProgress] = useState(0)
  const [dfuState, setDfuState] = useState("")
  const [error, setError] = useState("")
  const [dfuTransferResult, setDfuTransferResult] = useState("")
  const [dfuReconnectRetry, setDfuReconnectRetry] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ExpoNordicDfu.module.addListener("DFUProgress", (params) => {
        const { percent, currentPart, avgSpeed, speed } = params
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
    
    ExpoNordicDfu.module.addListener("DFUStateChanged", ({ state }) => {
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
  }, []);

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

    try {
      console.log("starting download", firmware.url)
      const result = await File.downloadFileAsync(firmware.url, destination, { idempotent: true });
      // console.log(result.exists);
      const peripheralId = peripheral.id
      console.log("download successful")
      BleHelpers.disconnectPeripheral(peripheral.id)?.then(() => {
        console.log("disconnect successful")
        return delay(500).then(() => {
          console.log("starting DFU upload")
          return ExpoNordicDfu.startDfu({
            deviceAddress: peripheral.id,
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
            // options: {
            //   retries: 3,
            //   mtu: 247
            // }
          })
          .then(async (res: any) => {
            //upload successful
            console.log("DFU upload successful")
            setDfuTransferResult(res.deviceAddress)
            const RETRY_COUNT = 10
            let retry = 1
            while (retry < RETRY_COUNT) {
              console.log(`Reconnecting to device attempt ${retry}`)
              try {
                setDfuReconnectRetry(retry)
                const isConnected = await BleHelpers.isConnected(peripheralId)
                if (isConnected) {
                  //reconnect successful
                  retry = RETRY_COUNT //exit loop
                  BleHelpers.write(peripheral.id, COMMANDS.READ_FIRMWARE_VERSION)
                  dispatch(BeepBaseActions.setDfuUpdating(false))
                } else {
                  await BleHelpers.connectPeripheral(peripheral.id)
                }
                retry += 1
                await delay(1000)
              } catch (error) {
                console.log("reconnect retry error", error)
              }
            }
          })
          .catch((error) => {
            console.log("error in startDFU", error)
            dispatch(BeepBaseActions.setDfuUpdating(false))
            setDfuTransferResult(error)
            ExpoNordicDfu.abortDfu()
            setError(error.message ?? error.Message)
          })
        })
      })
    } catch (error: any) {
      console.error("Error error in onInstallFirmwarePress", error);
      ExpoNordicDfu.abortDfu()
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