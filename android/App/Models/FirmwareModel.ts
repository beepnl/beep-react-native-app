import FormatHelpers from "../Helpers/FormatHelpers"

/*
{
    "version": "1.5.11",
    "release_date": "2021-08-10T13:19:00Z",
    "release_notes": "BEEP base 1.5.11 offers log file rotation...",
    "stability": "stable",
    "size": 348200,
    "download_url": "https://assets.beep.nl/firmware/basev3/1.5.11/Beepbase_sd_boot_app.zip"
}
*/
export class FirmwareModel {
  version: string
  releaseNotes: string
  stability: "stable" | "test"
  size: string
  url: string

  constructor(props: any) {
    this.version = props.version
    this.releaseNotes = props.release_notes
    this.stability = props.stability
    this.size = `${FormatHelpers.formatSizeAsHumanReadable(props.size)}`
    this.url = props.download_url
  }

}
