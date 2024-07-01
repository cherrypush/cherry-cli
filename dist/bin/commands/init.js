#! /usr/bin/env node
'use strict'
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        var desc = Object.getOwnPropertyDescriptor(m, k)
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k]
            },
          }
        }
        Object.defineProperty(o, k2, desc)
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        o[k2] = m[k]
      })
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v })
      }
    : function (o, v) {
        o['default'] = v
      })
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod
    var result = {}
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k)
    __setModuleDefault(result, mod)
    return result
  }
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const prompt_1 = __importDefault(require('prompt'))
const configuration_js_1 = require('../../src/configuration.js')
const git = __importStar(require('../../src/git.js'))
function default_1(program) {
  program.command('init').action(() =>
    __awaiter(this, void 0, void 0, function* () {
      const configurationFile = (0, configuration_js_1.getConfigurationFile)()
      if (configurationFile) {
        console.error(`${configurationFile} already exists.`)
        process.exit(1)
      }
      prompt_1.default.message = ''
      prompt_1.default.start()
      let projectName = yield git.guessProjectName()
      if (!projectName) {
        projectName = yield prompt_1.default.get({
          properties: {
            repo: { message: 'Enter your project name', required: true },
          },
        }).repo
      }
      ;(0, configuration_js_1.createConfigurationFile)(projectName)
      if (!(0, configuration_js_1.workflowExists)()) (0, configuration_js_1.createWorkflowFile)()
      console.log('Your initial setup is done! Now try the command `cherry run` to see your first metrics.')
    })
  )
}
exports.default = default_1
