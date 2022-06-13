import { SensorDefinitionModel } from "./SensorDefinitionModel"

/*
    // 01233cd10043454bee  new
    // 0123451539076025ee  old
    // 0123451539076025ee

{
        "id": 1,
        "hive_id": 2,
        "name": "BEEPBASE-0000",
        "key": "000000000000000",
        "created_at": "2020-01-22 09:43:03",
        "last_message_received": null,
        "hardware_id": null,
        "firmware_version": null,
        "hardware_version": null,
        "boot_count": null,
        "measurement_interval_min": null,
        "measurement_transmission_ratio": null,
        "ble_pin": null,
        "battery_voltage": null,
        "next_downlink_message": null,
        "last_downlink_result": null,
        "type": "beep",
        "hive_name": "Hive 2",
        "location_name": "Test stand 1",
        "owner": true,
        "sensor_definitions": [
            {
                "id": 7,
                "name": null,
                "inside": null,
                "offset": 8131,
                "multiplier": null,
                "input_measurement_id": 7,
                "output_measurement_id": 20,
                "device_id": 1,
                "input_abbr": "w_v",
                "output_abbr": "weight_kg"
            }
        ]
    }
*/
export class DeviceModel {
  id: string
  name: string
  hardwareId: string
  devEUI: string
  sensorDefinitions: Array<SensorDefinitionModel>

  constructor(props: any) {
    this.id = props.id.toString() || ""
    this.name = props.name
    this.hardwareId = props.hardware_id
    this.devEUI = props.key

    this.sensorDefinitions = []
    if (Array.isArray(props.sensor_definitions)) {
      props.sensor_definitions.forEach((item: any) => this.sensorDefinitions.push(new SensorDefinitionModel(item)))
    }
  }

}
