import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './FirmwareScreenStyle'
import { Colors, Fonts, Metrics } from '../../Theme';

// Utils
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';
import { NordicDFU, DFUEmitter } from "react-native-nordic-dfu";
import RNFS from 'react-native-fs'
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Data
import ApiActions from 'App/Stores/Api/Actions'
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'
import { getFirmwareVersion } from 'App/Stores/BeepBase/Selectors'
import { FirmwareVersionModel } from '../../Models/FirmwareVersionModel';
import { FirmwareModel } from '../../Models/FirmwareModel';

// Components
import { Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScrollView } from 'react-native-gesture-handler';
import * as Progress from 'react-native-progress';

export type FirmwareDetailScreenNavigationParams = {
  firmware: FirmwareModel,
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
  const [dfuProgress, setDfuProgress] = useState(0)
  const [dfuState, setDfuState] = useState("")
  const [dfuTransferResult, setDfuTransferResult] = useState("")
  const [dfuReconnectRetry, setDfuReconnectRetry] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    DFUEmitter.addListener(
      "DFUProgress",
      ({ percent, currentPart, partsTotal, avgSpeed, speed }) => {
        if (percent != undefined && currentPart != undefined) {
          const maxPercent = 100 / (partsTotal ?? 1)
          const offset = (currentPart - 1) * maxPercent
          const scaledPercent = percent / (partsTotal ?? 1)
          const progress = offset + scaledPercent
          setDfuProgress(progress / 100)
        }
      }
    );
    
    DFUEmitter.addListener("DFUStateChanged", ({ state }) => {
      // console.log("DFU State:", state);
      if (state != undefined) {
        //track internal state for UI updates
        setDfuState(state)

        //update 'dfu is updating flag' in store for error drop down visibility logic
        let isUpdating
        switch (state) {
          case "ENABLING_DFU_MODE":
          case "CONNECTING":
          case "DEVICE_DISCONNECTING":
          case "DFU_PROCESS_STARTING":
          case "DFU_COMPLETED":
            isUpdating = true
            break;

          case "DFU_FAILED":
            isUpdating = false
            break;
        }
        dispatch(BeepBaseActions.setDfuUpdating(isUpdating))
      }
    });
  }, []);

  const delay = (ms: number) => new Promise(res=>setTimeout(res, ms));

  const onInstallFirmwarePress = async () => {
    console.log("onInstallFirmwarePress")
    setBusy(true)
    setDfuTransferResult("")
    setDfuProgress(0)
    setDfuReconnectRetry(0)
    const destination = RNFS.CachesDirectoryPath + "/firmware.zip"
    console.log("destination", destination)
    RNFS.downloadFile({ 
      fromUrl: firmware.url,
      toFile: destination
    }).promise.then(result => {
      const peripheralId = peripheral.id
      console.log("download successful")
      BleHelpers.disconnectPeripheral(peripheral)?.then(() => {
        console.log("disconnect successful")
        delay(500).then(() => {
          NordicDFU.startDFU({
            deviceAddress: peripheral.id,
            filePath: destination,
            options: {
              retries: 3,
              mtu: 247
            }
          })
          .then(async (res: any) => {
            console.log("upload successful")
            //upload successful
            setDfuTransferResult(res.deviceAddress)
            const RETRY_COUNT = 10
            let retry = 1
            while (retry < RETRY_COUNT) {
              setDfuReconnectRetry(retry)
              const isConnected = await BleHelpers.isConnected(peripheralId)
              if (isConnected) {
                //reconnect successful
                retry = RETRY_COUNT
                BleHelpers.write(peripheral.id, COMMANDS.READ_FIRMWARE_VERSION)
                dispatch(BeepBaseActions.setDfuUpdating(false))
              } else {
                await BleHelpers.connectPeripheral(peripheralId)
              }
              retry += 1
              await delay(1000)
            }
          })
          .catch((error) => {
            console.log("error in startDFU", error)
            dispatch(BeepBaseActions.setDfuUpdating(false))
            setDfuTransferResult(error)
          })
          .finally(() => {
            setBusy(false)
          })
        })
      })
    }).catch((error) => {
      console.log("error in downloadFile", error)
    })
  }

  return (
    <View style={styles.mainContainer}>
      <ScreenHeader title={t("firmware.screenTitle")} back />

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

        <View style={styles.spacer} />

        { !!dfuState &&
          <Text style={[styles.instructions]}>{t(`firmware.${dfuState}`)}</Text>
        }

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