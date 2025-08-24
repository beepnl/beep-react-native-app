package appinventor.ai_app_beep_nl.BEEP_commissioning_V06;

import com.facebook.react.ReactActivity;
import android.os.Bundle;

public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "app";
  }

  /*
   * react-native-screens package requires one additional configuration step to properly work on Android devices.
   * This change is required to avoid crashes related to View state being not persisted consistently across Activity restarts.
   */
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(null);
  }
}
