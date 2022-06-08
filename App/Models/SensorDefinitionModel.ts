/*
  {
    "id":6510,
    "created_at":"2022-04-20 12:17:45",
    "updated_at":"2022-04-20 12:21:30",
    "name":"Sensor 1 test Marten",
    "inside":true,
    "offset":null,
    "multiplier":null,
    "input_measurement_id":77,
    "output_measurement_id":77,
    "device_id":3672,
    "input_abbr":"t_0",
    "output_abbr":"t_0"
  },
  {
    "id":6511,
    "created_at":"2022-04-20 12:17:45",
    "updated_at":"2022-04-20 12:23:33",
    "name":"Weight sensor",
    "inside":null,
    "offset":167641,
    "multiplier":0.000035541544288985,
    "input_measurement_id":7,
    "output_measurement_id":20,
    "device_id":3672,
    "input_abbr":"w_v",
    "output_abbr":"weight_kg"
  }
*/
export class SensorDefinitionModel {
  id: string
  deviceId: string
  name: string
  isInside: boolean | null

  constructor(props: any) {
    this.id = props.id.toString()
    this.name = props.name
    this.deviceId = props.device_id
    this.isInside = !!props.inside
  }

}
