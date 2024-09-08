import { panic } from '../error.js'
import sh from '../sh.js'

const run = async () => {
  let files

  try {
    const { stdout } = await sh(
      './node_modules/eslint/bin/eslint.js . --format=json --ext .js,.jsx,.ts,.tsx,.cjs,.mjs --no-inline-config --ignore-path .gitignore',
      {
        throwOnError: false,
      }
    )
    files = JSON.parse(stdout)
  } catch (error) {
    panic('An error happened while executing eslint\n- Make sure eslint is properly installed')
  }

  return files
    .filter((file) => file.errorCount > 0)
    .flatMap((file) => {
      // File path is in the form: /Users/fwuensche/projects/cherry-cli/src/plugins/eslint.js:4
      // We only want it relative to the project root: src/plugins/eslint.js
      const filePath = file.filePath.replace(`${process.cwd()}/`, '')

      return file.messages.map((message) => ({
        text: `${filePath}:${message.line}`,
        filePath: filePath,
        metricName: `[eslint] ${message.ruleId}`,
        lineNumber: message.line,
      }))
    })
}

export default { run }
