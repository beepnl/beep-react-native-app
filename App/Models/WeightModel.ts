import { Buffer } from 'buffer'

type ChannelName = "A_GAIN128" | "B_GAIN32" | "A_GAIN64"

type Channel = {
  name: ChannelName,
  bitmask: number,
  value: number
}

export const CHANNELS: Array<Channel> = [
  {
    name: "A_GAIN128",
    bitmask: 1,
    value: 0,
  },
  {
    name: "B_GAIN32",
    bitmask: 2,
    value: 0,
  },
  {
    name: "A_GAIN64",
    bitmask: 4,
    value: 0,
  },
]

export class WeightModel {
  channels: Array<Channel> = []

  constructor(props: any) {
    this.channels = props.data
  }

  toString() {
    return `${(this.channels.map(channel => `${channel.name}: ${channel.value}`).join(", "))}`
  }

}

export class WeightParser {
  data: Buffer;

  constructor(props: any) {
    // Ensure data is a proper Buffer instance
    this.data = Buffer.isBuffer(props.data) ? props.data : Buffer.from(props.data || [])
  }

  parse(): WeightModel | undefined {
    const data = []
    const len = this.data?.length
    if (len >= 4) {
      let i = 0
      while (i < len) {
        const channelByte = this.data.readUInt8(i++)
        const channel = CHANNELS.find(ch => ch.bitmask == channelByte)
        if (!channel) {
          i += 3
          continue
        }
  
        //read 24bit signed value
        let byte1 = this.data.readUInt8(i++)
        const signed = byte1 & 0b10000000
        if (signed) {
          byte1 &= 0b01111111
        }
        const byte2 = this.data.readUInt8(i++)
        const byte3 = this.data.readUInt8(i++)
        let combined = (byte1<<16) | (byte2<<8) | (byte3)
        if (signed) {
          combined = -combined
        }
        channel.value = combined
  
        data.push(channel)
      }
    }

    return new WeightModel({ data })
  }
}