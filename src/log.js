let verbose = false

/**
 * Sets the verbose mode for logging.
 * @param {boolean} value - Whether to enable or disable verbose mode.
 */
export const setVerboseMode = (value) => (verbose = value)

/**
 * Logs debug messages to the console if verbose mode is enabled.
 * @param {...any} args - The values to log.
 */
export const debug = (...args) => verbose && console.debug('[DEBUG]', ...args)
