export class PairedPeripheralModel {
  id: string = "";
  name: string = "";
  isConnected: boolean = false
  deviceId: string = ""

  constructor(props: any) {
    Object.assign(this, props)
  }
}
