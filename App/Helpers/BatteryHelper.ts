export default class BatterHelper {
  static usableBatteryCapacityModifier = 0.9
  static batteryVoltage = 3.0
  static systemOffCurrentMilliAmps = 0.0013
  static sleepCurrentMilliAmps = 0.0054
  static measurementConversionCurrentMilliAmps = 9.3
  static measurementTransmissionCurrentMilliAmps = 9.07
  static bluetoothCurrentMilliAmps = 0.108
  static measurementConversionDurationSeconds = 1.0
  static measurementTransmissionDurationSeconds = 4.2
  static numberOfConversionsPerWake = 3.0
  static numberOfMinutesPerHour = 60.0
  static numberOfSecondsPerHour = 3600.0
  static numberOfHoursPerDay = 24.0
  static numberOfDaysPerYear = 365.0
              
  static energyConsumptionMilliWattPerHour(measureToSendRatio: number, measurementInterval: number): number {
    let energySpentSleeping = this.sleepCurrentMilliAmps
    let numberOfWakesPerHour = this.numberOfMinutesPerHour / measurementInterval
    let energySpentConvertingMeasurements =  numberOfWakesPerHour * this.numberOfConversionsPerWake * this.measurementConversionDurationSeconds / this.numberOfSecondsPerHour * this.measurementConversionCurrentMilliAmps
    let energySpentTransmittingMeasurements = numberOfWakesPerHour / measureToSendRatio * this.measurementTransmissionDurationSeconds / this.numberOfSecondsPerHour * this.measurementTransmissionCurrentMilliAmps
    return this.batteryVoltage * (energySpentSleeping + energySpentConvertingMeasurements + energySpentTransmittingMeasurements)
  }
  
  static estimatedBatteryLifeHours(batteryCapacity: number, measureToSendRatio: number, measurementInterval: number): number  {
    let usableEnergy = this.batteryVoltage * this.usableBatteryCapacityMilliAmps(batteryCapacity)
    let energyConsumptionMilliAmpsPerHour = this.energyConsumptionMilliWattPerHour(measureToSendRatio, measurementInterval)
    return usableEnergy / energyConsumptionMilliAmpsPerHour
  }
  
  static estimatedBatteryLifeDays(batteryCapacity: number, measureToSendRatio: number, measurementInterval: number): number {
    return this.estimatedBatteryLifeHours(batteryCapacity, measureToSendRatio, measurementInterval) / this.numberOfHoursPerDay
  }
  
  static estimatedBatteryLifeYears(batteryCapacity: number, measureToSendRatio: number, measurementInterval: number): number {
    return this.estimatedBatteryLifeDays(batteryCapacity, measureToSendRatio, measurementInterval) / this.numberOfDaysPerYear
  }
  
  static usableBatteryCapacityMilliAmps(batteryCapacity: number): number {
    return this.usableBatteryCapacityModifier * batteryCapacity
  }  
}