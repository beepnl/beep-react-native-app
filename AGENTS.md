## Build, Lint, and Test

- **Build:** This is a React Native project. No explicit build command is defined; use `npm run android` or `npm run ios`.
- **Lint:** Run `npm run lint` to check for linting errors.
- **Test:** Run `npm test` to run all tests. To run a single test file, use `npm test -- <test_file_name>`.

## Code Style

- **Imports:** Group imports by type (hooks, styles, utils, data, components). Use absolute paths for modules within the `App` directory (e.g., `App/Stores/Api/Actions`).
- **Formatting:** Use Prettier for automated formatting. Adhere to existing formatting, including indentation and spacing.
- **Types:** Use TypeScript. Define types for component props and other complex objects. Use `FunctionComponent` for React components.
- **Naming Conventions:**
  - Components: PascalCase (e.g., `HomeScreen`).
  - Functions/Variables: camelCase (e.g., `onRefresh`).
  - Styles: camelCase (e.g., `styles.container`).
- **Error Handling:** Use `try...catch` blocks for asynchronous operations that may fail, and use `Alert.alert` to display errors to the user.
- **State Management:** Use Redux for global state management. Use `useSelector` to access state and `useDispatch` to dispatch actions.
- **Asynchronous Operations:** Use Redux Saga for managing side effects. For direct API calls, use the `apisauce` library.
- **Logging:** Use `BleLogger` for logging BLE-related events.
