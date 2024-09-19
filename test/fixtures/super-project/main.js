// eslint-disable-next-line @typescript-eslint/no-unused-vars
function testEslint() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  var unusedVar = 42
  console.log('ESLint test')
  let obj = { key: 'value' }
  // TODO: This is a comment that should be picked up by the metrics
  return obj
}
