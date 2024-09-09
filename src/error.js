/**
 * Throws an error with the provided message and exits with code 1.
 * @param {string} message
 */
export const panic = (message) => {
  console.error(`❌ ${message}`)
  process.exit(1)
}
