import { Buffer } from 'buffer'

export type ChannelName = "IN3LM" | "IN2RP" | "IN2LP" | "OFF"

export type Channel = {
  name: ChannelName,
  bitmask: number,
}

export const CHANNELS: Array<Channel> = [
  {
    name: "IN3LM",
    bitmask: 0,
  },
  {
    name: "IN2LP",
    bitmask: 1,
  },
  {
    name: "IN2RP",
    bitmask: 2,
  },
  {
    name: "OFF",
    bitmask: 3,
  },
]

export class AudioModel {
  channel: Channel
  gain: number
  min6dB: boolean
  volume: number
  bins: number
  startBin: number
  stopBin : number

  constructor(props: any) {
    this.channel = props.channel
    this.gain = props.gain
    this.min6dB = !!props.min6dB
    this.volume = props.volume
    this.bins = props.bins
    this.startBin = props.startBin
    this.stopBin = props.stopBin
  }

  toString() {
    return this.channel?.name
  }

}

export class AudioParser {
  data: Buffer;

  constructor(props: any) {
    const rawData = props.data
    this.data = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData || [])
  }

  parse(): AudioModel | undefined {
    const len = this.data?.length
    if (len >= 6) {
      let i = 0
      const channelByte = this.data.readUInt8(i++)
      const channel = CHANNELS.find(ch => ch.bitmask == channelByte)
      const reg = this.data.readUInt8(i++)
      const gain = reg & 0x7F
      const min6dB = (reg & 0x80) !== 0
      const volume = this.data.readInt8(i++)
      const bins = this.data.readUInt8(i++)
      const startBin = this.data.readUInt8(i++)
      const stopBin = this.data.readUInt8(i++)
      return new AudioModel({ channel, gain, min6dB, volume, bins, startBin, stopBin })
    }
  }
}