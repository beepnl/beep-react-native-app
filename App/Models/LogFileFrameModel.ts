import { Buffer } from 'buffer'

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
    const buffer = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData || [])
    let data, frame
    if (buffer?.length > 1) {
      frame = buffer.readInt16BE()
      if (buffer.length > 2) {
        data = buffer.subarray(2)
        return new LogFileFrameModel({ frame, data })
      }
    }
    return null
  }
}