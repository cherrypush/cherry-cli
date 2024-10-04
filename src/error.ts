export const panic = (error: unknown): never => {
  if (typeof error === 'string') {
    console.log(error)
  } else if (error instanceof Error) {
    console.log(error.message)
  } else {
    console.log('An unknown error occurred')
  }

  process.exit(1)
}
