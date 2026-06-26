import { NavigationProp } from '@react-navigation/native';
import React, { FunctionComponent } from 'react';

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import { Metrics } from '@/App/Theme';
import styles from './styles';

// Utils

// Data

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import { Image } from 'expo-image';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  navigation: NavigationProp<any>,
}

const WizardAssembleScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onNextPress = () => {
    navigation.navigate("WizardWakeUpScreen")
  }

  return (<>
    <ScreenHeader title={t("wizard.assemble.screenTitle")} back />

    <ScrollView style={styles.container}>
      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.assemble.step1")}</Text>
      </View>
      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.assemble.step2")}</Text>
      </View>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Image style={{ width: Metrics.clientWidth - Metrics.doubleBaseMargin, aspectRatio: 3840/2160, height: null, margin: Metrics.baseMargin }} source={{ uri: "beepbase" }} contentFit="contain" />
      </View>
      <View style={styles.itemContainer}>
        <Text style={styles.text}>{t("wizard.assemble.nb")}</Text>
      </View>

    </ScrollView>
    
    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.button} onPress={onNextPress}>
        <Text style={styles.text}>{t("common.btnNext")}</Text>
      </TouchableOpacity>
    </View>
  </>)
}

export default WizardAssembleScreen