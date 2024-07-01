'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.nextMonth = exports.firstDayOfMonth = exports.addDays = exports.substractDays = exports.toISODate = void 0
const toISODate = (date) => date.toISOString().split('T')[0]
exports.toISODate = toISODate
const substractDays = (date, count) => {
  date.setDate(date.getDate() - count)
  return date
}
exports.substractDays = substractDays
const addDays = (date, count) => {
  date.setDate(date.getDate() + count)
  return date
}
exports.addDays = addDays
const firstDayOfMonth = (date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1))
exports.firstDayOfMonth = firstDayOfMonth
const nextMonth = (originalDate) => {
  const date = (0, exports.firstDayOfMonth)(originalDate) // Avoid returning 1 for getMonth() when day is 31
  const [year, month] = date.getMonth() < 11 ? [date.getFullYear(), date.getMonth() + 1] : [date.getFullYear() + 1, 0]
  return new Date(Date.UTC(year, month, 1))
}
exports.nextMonth = nextMonth
