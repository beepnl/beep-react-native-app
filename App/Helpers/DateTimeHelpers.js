// Utils
import moment from 'moment'
import _ from 'lodash'

export default class DateTimeHelper {

  static formatDateLong(date) {
    return date ? _.capitalize(moment(date).format('dddd D MMMM YYYY')) : ""
  }

  static formatDate(date) {
    return date ? _.capitalize(moment(date).format('D MMMM YYYY')) : ""
  }

  static formatEventDateDay(date) {
    return date ? moment(date).format('D') : ""
  }

  static formatEventDateMonth(date) {
    return date ? moment.monthsShort("-MMM-")[date.get("month")] : ""
  }

  static formatMonth(date) {
    return date ? _.capitalize(moment(date).format('MMM YYYY')) : ""
  }

  static formatDateISO(date) {
    return moment(date).format("YYYY-MM-DD")
  }

  static formatDateTime(date) {
    return moment(date).format("D MMM YYYY [om] H:mm:ss")
  }

  static formatDateTimeISO(date) {
    return moment(date).format("YYYY-MM-DDTHH:mm:ssZ")
  }

  static formatDateTimeUTC(date) {
    return moment.utc(date).format()
  }

  static formatTime(date) {
    return date ? moment(date).format("H:mm:ss", { trim: false }) : ""
  }

  // static formatDuration(duration: moment.Duration) {
  //   return duration.format("H:mm", { trim: false })
  // }

}