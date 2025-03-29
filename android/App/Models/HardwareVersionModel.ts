export class HardwareVersionModel {
  major: number = 0
  minor: number = 0
  id: number = 0

  constructor(props: any) {
    this.major = Number(props.major)
    this.minor = Number(props.minor)
    this.id = Number(props.id)
  }

  toString() {
    return `${this.major}.${this.minor}`
  }
}

export class HardwareVersionParser {
  data: Buffer;

  constructor(props: any) {
    this.data = props.data
  }

  parse(): HardwareVersionModel {
    let major = 0
    let minor = 0
    let id = 0
    if (this.data?.length >= 8) {
      major = this.data.readUInt16BE(0)
      minor = this.data.readUInt16BE(2)
      id = this.data.readUInt32BE(4)
    }
    return new HardwareVersionModel({ major, minor, id })
  }
}