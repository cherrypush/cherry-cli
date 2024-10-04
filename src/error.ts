export const panic = (error: unknown): never => {
  if (typeof error === 'string') {
    panic(error)
  } else if (error instanceof Error) {
    panic(error.message)
  } else {
    panic('An unknown error occurred')
  }

  process.exit(1)
}
