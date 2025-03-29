// Utils
import { Linking } from 'react-native';

export default class OpenExternalHelpers {

  static openUrl(url) {
    Linking.canOpenURL(url).then(supported => {
      if (!supported) {
        console.log('openUrl can\'t handle url', url)
      } else {
        return Linking.openURL(url)
      }
    }).catch(err => console.error('openUrl error occurred', err))
  }

  static addHttpsScheme(url) {
    if (url && url.search(/^http[s]?\:\/\//) == -1) {
      url = "https://" + url
    }
    return url
  }

  static addMailtoScheme(url) {
    if (url && url.search(/^mailto\:/) == -1) {
      url = "mailto:" + url
    }
    return url
  }

  static addTelScheme(url) {
    if (url && url.search(/^tel\:/) == -1) {
      url = "tel:" + url
    }
    return url
  }

}