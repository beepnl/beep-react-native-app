# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains the Android application module.
- `app/src/main/java/appinventor/ai_app_beep_nl/BEEP_commissioning_V06/` holds Java sources and generated App Inventor classes.
- `app/src/main/res/` stores Android resources (layouts, drawables, strings).
- `app/src/main/assets/` contains bundled assets used at runtime.
- `app/src/debug/` contains debug-only manifest/resources.
- `gradle/`, `gradlew`, `build.gradle`, and `settings.gradle` define the Gradle build.
- `keystores/` is for local signing keys; `app/build/` and `build-logs/` are generated.

## Build, Test, and Development Commands
Run commands from this `android/` directory:
- `./gradlew assembleDebug` – build a debug APK.
- `./gradlew assembleDebugOffline` – build the offline debug variant (if enabled).
- `./gradlew assembleRelease` – build a release APK/AAB.
- `./gradlew installDebug` – install the debug build on a connected device.
- `./gradlew clean` – clear build outputs.
- `./gradlew lint` – run Android lint checks.
- `./gradlew test` or `./gradlew connectedAndroidTest` – run unit/instrumented tests when present.

## Coding Style & Naming Conventions
- Use Android Studio defaults: 4‑space indentation, braces on the same line, and alphabetical imports.
- Keep package names lowercase; this module’s namespace is `appinventor.ai_app_beep_nl.BEEP_commissioning_V06`.
- Resource names should be `lowercase_underscores` (e.g., `ic_ble_status`, `activity_main`).
- No custom formatter is configured; use IDE formatting and verify with `./gradlew lint`.

## Testing Guidelines
- There are no dedicated test directories yet. Add unit tests under `app/src/test` and instrumented tests under `app/src/androidTest`.
- Prefer JUnit4 for unit tests and Espresso for UI/instrumented tests.
- Keep test names descriptive: `ClassNameTest`, `FeatureFlowTest`.

## Commit & Pull Request Guidelines
- Recent history uses short, imperative subjects and occasional prefixes (e.g., `Android: ...`) or release tags like `v2.2.2`.
- Follow the same pattern: concise subject line, add a scope prefix when helpful, and keep release commits to `vX.Y.Z`.
- PRs should include: a brief summary, testing steps (device/OS + build variant such as `Debug` or `DebugOffline`), and screenshots for UI changes.

## Security & Configuration Tips
- Treat `keystores/` and signing properties as sensitive; avoid committing private keys.
- `app/google-services.json` must match the Firebase project; update carefully and avoid sharing outside the team.
