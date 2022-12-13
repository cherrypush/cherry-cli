export const toISODate = (date) => date.toISOString().split('T')[0]
export const substractDays = (date, count) => {
  date.setDate(date.getDate() - count)
  return date
}
