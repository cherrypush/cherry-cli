let verbose = false

export const setVerboseMode = (value: boolean) => (verbose = value)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debug = (...args: any) => verbose && console.debug('[DEBUG]', ...args)
