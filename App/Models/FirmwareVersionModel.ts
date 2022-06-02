import DateTimeHelper from "../Helpers/DateTimeHelpers"

export class FirmwareVersionModel {
  major: number = 0
  minor: number = 0
  revision: number = 0
  timestamp: Date = new Date()

  constructor(props: any) {
    this.major = Number(props.major)
    this.minor = Number(props.minor)
    this.revision = Number(props.revision)
  }

  toString() {
    return `${this.major}.${this.minor}.${this.revision}`
  }
}

export class FirmwareVersionParser {
  data: Buffer;

  constructor(props: any) {
    this.data = props.data
  }

  parse(): FirmwareVersionModel {
    let major = 0
    let minor = 0
    let revision = 0
    if (this.data?.length >= 6) {
      major = this.data.readUInt16BE(0)
      minor = this.data.readUInt16BE(2)
      revision = this.data.readUInt16BE(4)
    }
    return new FirmwareVersionModel({ major, minor, revision })
  }
}