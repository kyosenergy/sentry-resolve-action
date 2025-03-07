import * as core from '@actions/core'
import * as github from '@actions/github'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const sentryToken = core.getInput('token', {
      required: true
    })
    const organizationName = core.getInput('org', {
      required: true
    })

    if (!sentryToken) {
      throw new Error('Sentry token is not set as a secret.')
    }
    if (!organizationName) {
      throw new Error('Sentry organization name is not set')
    }

    const regex = new RegExp(
      `https:\\/\\/${organizationName}.sentry.io\\/issues\\/\\d+`,
      'g'
    )
    const body = github.context.payload.issue?.body || ''
    const sentryLinks = body.match(regex) || []

    if (sentryLinks.length === 0) {
      core.info('No Sentry issues found.')
      return
    }

    core.info(`Found Sentry issues: ${sentryLinks.join(', ')}`)

    for (const link of sentryLinks) {
      const issueId = extractIssueId(link)
      core.info(`Resolving Sentry issue: ${issueId}`)
      await resolveSentryIssue(organizationName, issueId, sentryToken)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

const extractIssueId = (link: string): string => {
  const match = link.match(/\d+$/) as RegExpMatchArray
  return match[0]
}
const resolveSentryIssue = async (
  organizationName: string,
  issueId: string,
  sentryToken: string
) => {
  try {
    const response = await fetch(
      `https://sentry.io/api/0/organizations/${organizationName}/issues/${issueId}/`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${sentryToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'resolved' })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Status: ${response.statusText}, Exception: ${errorText}`)
    }

    core.info(`✅ Successfully resolved Sentry issue: ${issueId}`)
  } catch (error) {
    core.error(`❌ Error resolving Sentry issue ${issueId}: ${error}`)
  }
}
