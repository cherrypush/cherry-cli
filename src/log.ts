let verbose = false

export const setVerboseMode = (value: boolean) => (verbose = value)

export const debug = (...args: any) => verbose && console.debug('[DEBUG]', ...args)
