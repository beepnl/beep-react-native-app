import React, { FunctionComponent, useEffect, useState, useCallback, useRef } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './LoginScreenStyle'
import { Colors, Images, Metrics } from '../../Theme';

// Utils
import OpenExternalHelpers from '../../Helpers/OpenExternalHelpers';

// Data
import AuthActions from 'App/Stores/Auth/Actions'
import { getError } from 'App/Stores/Auth/Selectors';
import { getUsername } from 'App/Stores/Settings/Selectors';
import { getUseProduction } from '../../Stores/User/Selectors';

// Components
import { Text, View, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Bee from '../../Components/Bee';

interface Props {
}

const BEES = [1,2,3,4,5,6].map((i, index) => <Bee key={index} style={{ position: "absolute", top: Math.random() * Metrics.screenHeight }} size={((Math.random() * 40) - 20) + 40} width={Metrics.clientWidth} />)

const LoginScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const useProduction = useTypedSelector<boolean>(getUseProduction)
  const error = useTypedSelector<string | undefined>(getError)

  const [username, setUsername] = useState(useTypedSelector<string>(getUsername))
  const [password, setPassword] = useState("")

  const inputUsernameRef = useRef<TextInput>(null)
  const inputPasswordRef = useRef<TextInput>(null)

  const onLoginPress = () => {
    if (username && password) {
      dispatch(AuthActions.login(username.trim(), password))
    }
  }

  const onForgotPasswordPress = () => {
    OpenExternalHelpers.openUrl(`https://app.beep.nl/password-forgot?email=${username}`)
  }

  const onCreateAccountPress = () => {
    OpenExternalHelpers.openUrl(`https://app.beep.nl/sign-up`)
  }

  return (
    <SafeAreaView style={styles.mainContainer}>

      { BEES }

      <ScrollView style={styles.container}>
        <View style={styles.spacerDouble} />

        <Image style={{ width: Metrics.clientWidth - Metrics.doubleBaseMargin, height: 300, margin: Metrics.baseMargin }} source={Images.beepLogo} resizeMode="contain" />

        <TextInput
          ref={inputUsernameRef}
          style={[styles.input, { backgroundColor: "#FFFFFFDD" }]}
          placeholder={t("login.username")}
          placeholderTextColor={Colors.placeholder}
          onChangeText={setUsername}
          value={username}
          maxLength={100}
          autoCapitalize={"none"}
          autoCorrect={false}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => inputPasswordRef?.current?.focus()}
        />

        <View style={styles.spacerDouble} />

        <TextInput
          ref={inputPasswordRef}
          style={[styles.input, { backgroundColor: "#FFFFFFDD" }]}
          placeholder={t("login.password")}
          placeholderTextColor={Colors.placeholder}
          onChangeText={setPassword}
          maxLength={100}
          value={password}
          secureTextEntry={true}
          onSubmitEditing={onLoginPress}
        />

        <View style={styles.spacerDouble} />

        { !useProduction && <>
          <Text style={[styles.text, { color: Colors.darkYellow, alignSelf: "center" }]}>{t("login.testEnvironmentWarning")}</Text>
          <View style={styles.spacer} />
        </>}

        { !!error && <>
          <Text style={[styles.text, styles.error, { alignSelf: "center" }]}>{t(`login.error.${error}`)}</Text>
          <View style={styles.spacerDouble} />
        </>}

        <TouchableOpacity style={styles.button} onPress={onLoginPress}>
          <Text style={styles.text}>{t("login.login")}</Text>
        </TouchableOpacity>

        <View style={styles.spacerDouble} />
        <View style={styles.spacerDouble} />

        <View style={styles.centeredContainer}>
          <TouchableOpacity onPress={onForgotPasswordPress}>
            <Text style={[styles.text, styles.link]}>{t("login.forgotPassword")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacerDouble} />

        <View style={styles.centeredContainer}>
          <TouchableOpacity onPress={onCreateAccountPress}>
            <Text style={[styles.text, styles.link]}>{t("login.signUp")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />

      </ScrollView>
    </SafeAreaView>
  )
}

export default LoginScreen