export class TiltModel {
  sqMinState: number | undefined

  constructor(props: any) {
    this.sqMinState = props.data
  }

  isSensorEnabled() {
    if (this.sqMinState != undefined) {
      return (this.sqMinState & 1) == 0
    }
  }

  static parse(rawData: any) {
    let data = 0
    if (rawData?.length >= 1) {
      data = rawData.readUInt8()
    }
    return new TiltModel({ data })
  }
}
