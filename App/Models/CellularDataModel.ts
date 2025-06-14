export class CellularDataModel {
  length: number
  data: Buffer
  includeAudio: boolean

  constructor(props: any) {
    this.length = props.length || 0
    this.data = props.data || Buffer.alloc(0)
    this.includeAudio = !!props.includeAudio
  }

  getMaxLength(): number {
    // Return larger buffer size if audio is included (10 second raw audio sample)
    // Assuming 16kHz, 16-bit mono: 16000 * 2 * 10 = 320,000 bytes for 10 seconds
    return this.includeAudio ? 320512 : 512  // Add 512 bytes for metadata
  }

  isValidLength(): boolean {
    return this.length <= this.getMaxLength()
  }

  toString(): string {
    const audioSuffix = this.includeAudio ? ' (with audio)' : ''
    return `${this.length} bytes${audioSuffix}`
  }
}

export class CellularDataParser {
  data: Buffer

  constructor(props: any) {
    this.data = props.data || Buffer.alloc(0)
  }

  parse(): CellularDataModel | undefined {
    const len = this.data?.length
    if (len >= 4) {
      // First 2 bytes: length, next 1 byte: includeAudio flag, rest: data
      const length = this.data.readUInt16LE(0)
      const includeAudio = !!this.data.readUInt8(2)
      
      // Bounds check to prevent buffer overflow
      const endPos = 3 + length
      if (endPos > len) {
        console.warn(`CellularDataParser: Requested data length ${length} exceeds buffer size ${len - 3}`)
        return undefined
      }
      
      const data = this.data.subarray(3, endPos)
      
      return new CellularDataModel({ length, data, includeAudio })
    }
    return undefined
  }

  static serialize(model: CellularDataModel): Buffer {
    const headerSize = 3
    const buffer = Buffer.alloc(headerSize + model.data.length)
    buffer.writeUInt16LE(model.length, 0)
    buffer.writeUInt8(model.includeAudio ? 1 : 0, 2)
    model.data.copy(buffer, headerSize)
    return buffer
  }
}