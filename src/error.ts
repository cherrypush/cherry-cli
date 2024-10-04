export const panic = (error: unknown): never => {
  if (typeof error === 'string') {
    console.error(error)
  } else if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error('An unknown error occurred')
  }

  process.exit(1)
}
