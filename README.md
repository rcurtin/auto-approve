# mlpack auto-approve action

This action approves a PR if:

 * it only has one approving review from a member of the organization
 * that review is at least 24 hours old

This is used for mlpack's PR process, where an approved PR has a "waiting
period" before merge to leave time for other comments.
