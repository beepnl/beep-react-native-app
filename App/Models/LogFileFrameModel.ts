export class LogFileFrameModel {
  frame: number
  data: Buffer
  size: number

  constructor(props: any) {
    this.frame = props.frame
    this.data = props.data
    this.size = props.data?.length
  }

  static parse(rawData: any) {
    let data, frame
    if (rawData?.length > 1) {
      frame = rawData.readInt16BE()
      if (rawData.length > 2) {
        data = rawData.subarray(2)
        return new LogFileFrameModel({ frame, data })
      }
    }
    return null
  }
}

// export class LogFileParser {
//   frame: number
//   data: Buffer;

//   constructor(props: any) {
//     this.frame = props.frame
//     this.data = props.data
//   }

//   parse(value: any): LogFileFrameModel {
//     let data, frame
//     if (this.data?.length > 0) {
//       frame = this.data.readInt16BE()
//       data = this.data.subarray(2)
//     }
//     return new LogFileFrameModel({ frame, data })
//   }
// }