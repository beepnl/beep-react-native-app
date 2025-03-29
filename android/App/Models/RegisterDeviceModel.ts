/*
  {
    "id":787,
    "hive_id":null,
    "name":"BEEPBASE-ACF5",
    "key":"0a3beb15e5c9fa6a",
    "created_at":"2022-06-02 12:32:25",
    "last_message_received":null,
    "hardware_id":"01233cd10043454bee",
    "firmware_version":"1.5.9",
    "hardware_version":"50000.49034",
    "boot_count":null,
    "measurement_interval_min":null,
    "measurement_transmission_ratio":null,
    "ble_pin":null,
    "battery_voltage":null,
    "next_downlink_message":null,
    "last_downlink_result":null,
    "datetime":null,
    "datetime_offset_sec":null,
    "app_key":"0c4dbd68ec1616766f54fdeecf50d7b2",
    "app_eui":"70b3d57ed0028d38",
    "type":"beep",
    "hive_name":"",
    "location_name":"",
    "owner":true,
    "online":false
  }
*/
export class RegisterDeviceModel {
  id: string
  name: string
  hardwareId: string

  constructor(props: any) {
    this.id = props.id.toString() || ""
    this.name = props.name
    this.hardwareId = props.hardware_id
  }

}
