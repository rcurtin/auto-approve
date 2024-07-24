# mlpack actions repository

This repository contains GitHub Actions used by the mlpack organization.

## mlpack auto-approve action

`auto-approve/`

This action approves a PR if:

- it only has one approving review from a member of the organization
- that review is at least 24 hours old

This is used for mlpack's PR process, where an approved PR has a "waiting
period" before merge to leave time for other comments.

## mlpack sticker action

`stickers/`

This action posts a comment to an approved PR if it is the user's first
contribution to the repository.  The comment lets them know that we will mail
them stickers, and how to get some stickers.

It is based on the
[first-interaction](https://github.com/actions/first-interaction) action.
