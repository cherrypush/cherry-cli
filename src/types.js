/**
 * @typedef {object} Occurrence
 * @property {string} metricName - The name of the metric.
 * @property {string} text - A message indicating no occurrences.
 * @property {number} value - The value, default is 0.
 */

/**
 * @typedef {object} Metric
 * @property {string} name - The name of the metric.
 * @property {string} [pattern] - The pattern to search for.
 * @property {string[]} [include] - The patterns to include.
 * @property {string[]} [exclude] - The patterns to exclude.
 * @property {boolean} [groupByFile] - Whether to group occurrences by file.
 * @property {Function} [eval] - An eval function to run.
 */

/**
 * @typedef {function} Eval
 * @param {object} codeOwners - The code owners.
 * @returns {Promise<Occurrence[]>} The occurrences.
 */

/**
 * @typedef {Object<string, object>} Plugins
 */

/**
 * @typedef {object} Configuration
 * @property {string} project_name - The name of the project.
 * @property {Plugins} [plugins] - The pattern to search for.
 * @property {Metric[]} [metrics] - The pattern to search for.
 */

/**
 * @typedef {object} File
 * @property {string} path - The path of the file.
 * @property {function(): Promise<string[]>} readLines - A function that reads the lines of the file and returns a promise resolving to an array of strings.
 */
