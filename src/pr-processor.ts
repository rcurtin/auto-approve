import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'
import { components } from '@octokit/openapi-types'

export interface IPRProcessorOptions {
  repoToken: string
  approvalMessage: string
}

export type OctokitPR = components['schemas']['pull-request-simple']
export type OctokitPRReview = components['schemas']['pull-request-review']

export class PRProcessor {
  readonly client: InstanceType<typeof GitHub>
  readonly options: IPRProcessorOptions

  constructor(options: IPRProcessorOptions) {
    this.options = options
    this.client = getOctokit(this.options.repoToken)
    this.client.log.debug = console.log
  }

  /**
   * Process all PRs, auto-approving if they have already been approved once (but
   * not twice) by an author that has permissions in the repository.
   */
  async processPRs(page: Readonly<number> = 1): Promise<number> {
    // Get the next batch of PRs.
    const prs: OctokitPR[] = await this.getPRs(page)

    if (prs.length <= 0) {
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
    } catch (error: any) {
      throw Error(`Getting PRs failed: ${error.message}.`)
    }
  }

  async processPR(pr: OctokitPR): Promise<void> {
    // First rule out some situations where we don't need to auto-approve.
    if (pr.state !== 'open') {
      console.log(`PR ${pr.number} is not open, skipping.`)
      return
    }

    if (pr.locked === true) {
      console.log(`PR ${pr.number} is locked, skipping.`)
      return
    }

    if (pr.draft !== false) {
      console.log(`PR ${pr.number} is a draft, skipping.`)
      return
    }

    // Now get all the reviews associated with this PR, so we can see how many
    // approvals we already have.
    const approvals: string[] = await this.processPRReviews(pr)
    console.log(`Got approvals for PR ${pr.number}: ${approvals}`)
    if (approvals.length === 1) {
      // We need to auto-approve!
      const submitReviewResult = await this.client.rest.pulls.createReview({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: pr.number,
        event: 'APPROVE',
        body: this.options.approvalMessage
      })
      console.log(
        `Submitted approval for PR ${pr.number}: ${submitReviewResult}.`
      )
    } else if (approvals.length > 1) {
      console.log(
        `No need to auto-approve PR ${pr.number}; it already has ${approvals} approvals.`
      )
    } else {
      console.log(`Not auto-approving PR ${pr.number}; it has 0 approvals.`)
    }
  }

  isValidDate(date: Readonly<Date>): boolean {
    if (Object.prototype.toString.call(date) === '[object Date]') {
      return !isNaN(date.getTime())
    }

    return false
  }

  async processPRReviews(
    pr: OctokitPR,
    page: Readonly<number> = 1
  ): Promise<string[]> {
    // Get the next batch of PR comments.
    const prReviews: OctokitPRReview[] = await this.getPRReviews(pr, page)

    if (prReviews.length <= 0) {
      return [] as string[]
    }

    let approvalAuthors: Set<string> = new Set<string>()
    for (const review of prReviews.values()) {
      // If the review is not at least 24 hours old, we don't care.
      let submittedAtString: string = <string>review.submitted_at
      const reviewDate: Date = new Date(submittedAtString)
      if (!this.isValidDate(reviewDate)) {
        console.log(
          `Failed to parse PR ${pr.number} review submission date: ${review.submitted_at}; skipping!`
        )
        continue
      }

      const millisSinceReview = new Date().getTime() - reviewDate.getTime()
      const dayInMillis = 1000 * 60 * 60 * 24

      if (millisSinceReview <= dayInMillis) {
        console.log(
          `PR review on ${pr.number} (${review.html_url}) is too new (${millisSinceReview} ms vs. required ${dayInMillis} ms), skipping.`
        )
        continue
      }

      // Check to see if this is an approval.
      if (review.state !== 'APPROVED') {
        console.log(
          `PR review on ${pr.number} (${review.html_url}) is not an approval, skipping.`
        )
        continue
      }

      if (review.user == null) {
        console.log(
          `PR review on ${pr.number} (${review.html_url}) has no user, skipping.`
        )
        continue
      }

      // Check to see if the author is a maintainer.  (Don't apply this check to
      // github-actions[bot].)
      if (
        review.user.login !== 'github-actions[bot]' &&
        review.author_association !== 'MEMBER' &&
        review.author_association !== 'OWNER'
      ) {
        console.log(
          `PR review on ${pr.number} (${review.html_url}) from user ${review.user.login} skipped because of association ${review.author_association}.`
        )
        continue
      }

      // Add to the list of review authors we have seen.
      approvalAuthors.add(review.user.login)
    }

    console.log(
      `PR ${pr.number} has sufficiently old approvals from: ${Array.from(approvalAuthors)}.`
    )

    const result = new Set<string>([
      ...approvalAuthors,
      ...(await this.processPRReviews(pr, page + 1))
    ])

    return Array.from(result)
  }

  async getPRReviews(pr: OctokitPR, page: number): Promise<OctokitPRReview[]> {
    try {
      const reviewsResult = await this.client.rest.pulls.listReviews({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: pr.number,
        per_page: 100,
        page
      })

      return reviewsResult.data
    } catch (error: any) {
      throw Error(
        `Getting reviews for PR ${pr.number}, page ${page} failed: ${error.message}.`
      )
    }
  }
}
