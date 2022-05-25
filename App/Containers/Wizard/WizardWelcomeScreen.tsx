import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './styles'
import { ApplicationStyles, Colors, Metrics } from '../../Theme';

// Utils
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';

// Redux
import SettingsActions from 'App/Stores/Settings/Actions'
import { getPairedPeripherals } from 'App/Stores/Settings/Selectors'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getLanguageCode } from '../../Stores/Settings/Selectors';
import { LanguageModel } from '../../Models/LanguageModel';

// Components
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import * as Progress from 'react-native-progress';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LanguagePicker, { LanguageItem } from '../../Components/LanguagePicker';
import Modal from 'react-native-modal';
import IconMaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  navigation: StackNavigationProp,
}

const WizardWelcomeScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const pairedPeripherals: Array<PairedPeripheralModel> = useTypedSelector<Array<PairedPeripheralModel>>(getPairedPeripherals)
  const [isLanguagePickerVisible, setLanguagePickerVisible] = useState<boolean>(false)
  const [languageCode, setLanguageCode] = useState(useTypedSelector<string>(getLanguageCode))

  // useEffect(() => {
  //   if (pairedPeripherals && pairedPeripherals.length > 0) {
  //     //previously paired peripherals available
  //     if (pairedPeripherals.every(p => p.isConnected)) {
  //       //show home screen
  //       navigation.navigate("App")
  //     }
  //   }
  // }, [pairedPeripherals])

  const onNextPress = () => {
    navigation.navigate("WizardBluetoothScreen")
  }

  const showLanguagePicker = () => {
    setLanguagePickerVisible(true)
  }

  const hideLanguagePicker = () => {
    setLanguagePickerVisible(false)
  }

  const onLanguageSelect = (language: LanguageModel) => {
    setLanguageCode(language.code)
    dispatch(SettingsActions.setLanguageCode(language.code))
    hideLanguagePicker()
  }

  return (<>
    <ScrollView>

      <View style={styles.itemContainer}>
        { pairedPeripherals?.length == 0 && <Text style={styles.itemText}>{t("wizard.welcome.welcome") + t("wizard.welcome.description") + t("wizard.welcome.start")}</Text> }
        { pairedPeripherals?.length > 0 && <Text style={styles.itemText}>{t("wizard.welcome.restoringConnections")}</Text> }
      </View>

      <View style={styles.spacerDouble} />

      { !!pairedPeripherals && pairedPeripherals.length > 0 &&
        <Progress.CircleSnail style={{alignSelf: "center"}} color={Colors.yellow} />
      }

      {/* { (!pairedPeripherals || pairedPeripherals.length == 0) &&
        <Button 
          size="small" 
          shadow={false}
          title={t("common.btnStart")}
          onPress={onNextPress} 
        />
      } */}

      <View style={styles.spacerDouble} />

      {/* Language button */}
      <TouchableOpacity onPress={showLanguagePicker} style={{ position: "absolute", top: -10, left: Metrics.baseMargin, flexDirection: "row", alignItems: "center" }}>
        <LanguageItem languageCode={languageCode} onSelect={showLanguagePicker} showIcon={false} showLabel={true} color={Colors.green} />
        <IconMaterialCommunityIcons name={"chevron-down"} size={30} color={Colors.green} />
      </TouchableOpacity>

      {/* Close wizard button */}
      <TouchableOpacity
        style={[styles.text, { 
          position: "absolute",
          top: 0,
          right: Metrics.baseMargin,
          padding: 2,
        }]}
        onPress={() => navigation.navigate("App")}
      >
        <Icon 
          name="close-thick"
          size={30} 
          style={{ color: Colors.green }}
        />
      </TouchableOpacity>

    </ScrollView>

    <Modal
      isVisible={isLanguagePickerVisible}
      onBackdropPress={hideLanguagePicker}
      onBackButtonPress={hideLanguagePicker}
      useNativeDriver={true}
      backdropOpacity={0.3}
    >
      <View style={ApplicationStyles.modalContainer}>
        <LanguagePicker onSelect={onLanguageSelect} showIcon={false} showLabel={true} />
      </View>
    </Modal>
  </>)
}

export default WizardWelcomeScreen