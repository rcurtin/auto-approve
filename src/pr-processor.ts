import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'
import { components } from '@octokit/openapi-types'

export interface IPRProcessorOptions {
  repoToken: string
  approveMessage: string
}

export type OctokitPR = components['schemas']['pull-request-simple']

export class PRProcessor {
  readonly client: InstanceType<typeof GitHub>
  readonly options: IPRProcessorOptions

  constructor(options: IPRProcessorOptions) {
    this.options = options
    this.client = getOctokit(this.options.repoToken)

    core.debug('Created PRProcessor object.')
  }

  /**
   * Process all PRs, auto-approving if they have already been approved once (but
   * not twice) by an author that has permissions in the repository.
   */
  async processPRs(page: Readonly<number> = 1): Promise<number> {
    // Get the next batch of PRs.
    const prs: OctokitPR[] = await this.getPRs(page)

    if (prs.length <= 0) {
      core.debug('No more PRs to process.')
      return 0
    }

    // Now iterate over the PRs we got and see their status.
    for (const pr of prs.values()) {
      await this.processPR(pr)
    }

    return this.processPRs(page + 1)
  }

  async getPRs(page: number): Promise<OctokitPR[]> {
    try {
      const prResult = await this.client.rest.pulls.list({
        owner: context.repo.owner,
        repo: context.repo.repo,
        state: 'open',
        per_page: 100,
        page
      })

      return prResult.data

      //      return prResult.data.map(
      //        (pr): Issue => new Issue(pr as Readonly<OctokitIssue>)
      //      )
    } catch (error: any) {
      throw Error(`Getting PRs was blocked by the error: ${error.message}.`)
    }
  }

  async processPR(pr: OctokitPR): Promise<void> {
    console.log(
      `Processing PR! ${pr.id}, ${pr.number}, ${pr.state}, ${pr.locked}, ${pr.review_comments_url}`
    )
  }
}
