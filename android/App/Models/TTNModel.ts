export const APP_EUI = "70b3d57ed0028d38"

export class TTNModel {
  deviceId: string
  devEUI: string
  appKey: string

  constructor(props: any) {
    this.deviceId = props.ids?.device_id
    this.devEUI = props.ids?.dev_eui
    this.appKey = props.root_keys?.app_key?.key
  }
}
