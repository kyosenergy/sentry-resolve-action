import * as core from '@actions/core'
import * as github from '@actions/github'
import { SentryIssue } from './types/SentryIssue.js'

/**
 * The main function for the action.
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

    const issueNumber = github.context.payload.issue?.number
    if (!issueNumber) {
      core.info(
        '❌ No GitHub issue number found in the context; nothing to do.'
      )
      return
    }
    core.info(`Fetching Sentries linked to GitHub id: #${issueNumber}`)

    const linkedIssues = await getLinkedSentryIssues(
      organizationName,
      sentryToken
    )

    const linkedGithubIssues = linkedIssues.filter((issue) =>
      issue.annotations.some((annotation) =>
        annotation.url.includes(`/issues/${issueNumber}`)
      )
    )

    if (linkedGithubIssues.length === 0) {
      core.info(`No Sentry issues reference Github issue #${issueNumber}.`)
      return
    }

    for (const issue of linkedGithubIssues) {
      core.info(`Resolving Sentry issue: ${issue.id}`)
      await resolveSentryIssue(organizationName, issue.id, sentryToken)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
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
    core.error(
      `❌ Error resolving Sentry issue ${issueId}: ${
        error instanceof Error ? error.message : error
      }`
    )
  }
}

const getLinkedSentryIssues = async (
  organizationName: string,
  sentryToken: string
): Promise<SentryIssue[]> => {
  const url = `https://${organizationName}.sentry.io/api/0/organizations/${organizationName}/issues/?query=is:linked`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${sentryToken}`,
      'Content-Type': 'application/json'
    }
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to fetch linked issues: ${response.status} ${response.statusText} — ${errorText}`
    )
  }

  return (await response.json()) as SentryIssue[]
}
