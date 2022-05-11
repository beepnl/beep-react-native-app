export class PairedPeripheralModel {
  id: string = "";
  name: string = "";
  isConnected: boolean = false

  constructor(props: any) {
    Object.assign(this, props)
  }
}
