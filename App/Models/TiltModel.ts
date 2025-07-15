import { Buffer } from 'buffer'

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
    // Ensure rawData is a proper Buffer instance
    const buffer = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData || [])
    if (buffer?.length >= 1) {
      data = buffer.readUInt8()
    }
    return new TiltModel({ data })
  }
}
