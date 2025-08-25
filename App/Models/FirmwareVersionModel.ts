import { SemVer } from "semver"

export type FEATURE = "tilt" | "clock" | "logDownload"

export class FirmwareVersionModel {
  major: number = 0
  minor: number = 0
  revision: number = 0
  version: SemVer

  constructor(props: any) {
    this.major = Number(props.major)
    this.minor = Number(props.minor)
    this.revision = Number(props.revision)
    this.version = new SemVer(`${props.major}.${props.minor}.${props.revision}`)
  }

  toString() {
    return `${this.major}.${this.minor}.${this.revision}`
  }

  supportsFeature(feature: FEATURE) {
    switch (feature) {
      case "tilt":
        return this.version.compare("1.4.0") >= 0

      case "clock":
        return this.version.compare("1.5.0") >= 0

      case "logDownload":
        return this.version.compare("1.5.9") >= 0
    }
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