import { Occurrence } from '../types.js'

export const buildSonarGenericImportPayload = (occurrences: Occurrence[]) => ({
  issues: occurrences.map((occurrence) => ({
    engineId: 'cherry',
    ruleId: occurrence.metricName,
    type: 'CODE_SMELL',
    severity: 'INFO',
    primaryLocation: {
      message: `${occurrence.metricName} at ${occurrence.text}`,
      filePath: occurrence.text.split(':')[0],
      textRange: {
        startLine: parseInt(occurrence.text.split(':')[1]) || 1,
      },
    },
  })),
})
