export const toISODate = (date: Date) => date.toISOString().split('T')[0]

export const substractDays = (date: Date, count: number) => {
  date.setDate(date.getDate() - count)
  return date
}

export const addDays = (date: Date, count: number) => {
  date.setDate(date.getDate() + count)
  return date
}

export const firstDayOfMonth = (date: Date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1))

export const nextMonth = (originalDate: Date) => {
  const date = firstDayOfMonth(originalDate) // Avoid returning 1 for getMonth() when day is 31
  const [year, month] = date.getMonth() < 11 ? [date.getFullYear(), date.getMonth() + 1] : [date.getFullYear() + 1, 0]

  return new Date(Date.UTC(year, month, 1))
}
