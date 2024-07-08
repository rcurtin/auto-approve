import * as core from '@actions/core'
import { IPRProcessorOptions, PRProcessor } from './pr-processor'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const ms: string = core.getInput('milliseconds')

    const args: IPRProcessorOptions = {
      repoToken: core.getInput('repo-token'),
      approvalMessage: core.getInput('approval-message')
    }

    const prProcessor: PRProcessor = new PRProcessor(args)
    await prProcessor.processPRs()

    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
