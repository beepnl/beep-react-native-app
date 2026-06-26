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

  /**
   * Converts a 24-bit value to a 32-bit signed integer
   * @param bytes - Array of 3 bytes representing 24-bit value
   * @returns number - 32-bit signed integer
   */
  private convert24BitToSigned(byte1: number, byte2: number, byte3: number): number {
    // Combine to 24-bit unsigned value
    let v = ((byte1 & 0xFF) << 16) | ((byte2 & 0xFF) << 8) | (byte3 & 0xFF);
    // Sign-extend 24 -> 32 bits
    if (v & 0x800000) v -= 0x1000000; // 2^24
    return v;
  }

  parse(): WeightModel | undefined {
    const data = []
    const len = this.data?.length
    if (len >= 1) {
      const channelMask = this.data.readUInt8(0)
      let offset = 1
      for (const channel of CHANNELS) {
        if ((channelMask & channel.bitmask) !== 0) {
          if (offset + 3 <= len) {
            const byte1 = this.data.readUInt8(offset++)
            const byte2 = this.data.readUInt8(offset++)
            const byte3 = this.data.readUInt8(offset++)
            
            // Create a copy of the channel object to avoid modifying the global constant template values directly
            const parsedChannel = {
              name: channel.name,
              bitmask: channel.bitmask,
              value: this.convert24BitToSigned(byte1, byte2, byte3)
            }
            data.push(parsedChannel)
          }
        }
      }
    }

    return new WeightModel({ data });
  }
}