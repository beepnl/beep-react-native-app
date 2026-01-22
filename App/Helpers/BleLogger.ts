export const BleLogger = {
  log: (message: string) => {
    console.log(message);
   },
  logPeripheral: (peripheral: any) => {
    console.log('[BLE] Peripheral:', JSON.stringify(peripheral));
  },
  setDownloadMode: (isDownloadMode: boolean) => { }
}