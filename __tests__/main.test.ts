/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as github from '@actions/github'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)
const fetchMock = jest.spyOn(global, 'fetch')

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

const organizationName = 'test-organization-name'

describe('Resolve Sentry Issues Action', () => {
  beforeEach(() => jest.clearAllMocks())

  it("should log 'No Sentry issues found' when no issues are present", async () => {
    core.getInput.mockReturnValue('valid-inputs')

    github.context.payload = {
      issue: {
        number: 42,
        body: 'No relevant content'
      }
    }

    await run()

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith('No Sentry issues found.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should throw an error if Sentry token is missing', async () => {
    core.getInput.mockReturnValueOnce('')

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Sentry token is not set as a secret.'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should log Sentry organization name is not set', async () => {
    core.getInput.mockReturnValueOnce('SENTRY_ISSUE_RESOLVER_TOKEN')
    core.getInput.mockReturnValueOnce('')

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Sentry organization name is not set'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should log Found Sentry issues: {issueLink}', async () => {
    core.getInput.mockReturnValueOnce('valid-token')
    core.getInput.mockReturnValueOnce(organizationName)

    github.context.payload = {
      issue: {
        number: 42,
        body: `relevant https://${organizationName}.sentry.io/issues/42`
      }
    }
    await run()

    expect(core.info).toHaveBeenCalledWith(
      `Found Sentry issues: https://${organizationName}.sentry.io/issues/42`
    )
  })

  it('should log Resolving Sentry issue: 42', async () => {
    core.getInput.mockReturnValueOnce('valid-token')
    core.getInput.mockReturnValueOnce(organizationName)

    github.context.payload = {
      issue: {
        number: 42,
        body: `relevant https://${organizationName}.sentry.io/issues/42`
      }
    }
    await run()

    expect(core.info).toHaveBeenCalledWith(
      `Found Sentry issues: https://${organizationName}.sentry.io/issues/42`
    )
    expect(core.info).toHaveBeenCalledWith('Resolving Sentry issue: 42')
  })

  it('should perform a PUT request against sentry service', async () => {
    core.getInput.mockReturnValueOnce('valid-token')
    core.getInput.mockReturnValueOnce(organizationName)

    github.context.payload = {
      issue: {
        number: 42,
        body: `relevant https://${organizationName}.sentry.io/issues/42`
      }
    }
    await run()

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith('Resolving Sentry issue: 42')
    expect(fetchMock).toHaveBeenCalledWith(
      `https://sentry.io/api/0/organizations/${organizationName}/issues/42/`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer valid-token`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'resolved' })
      }
    )
  })

  it('should perform multiple PUT requests against sentry service', async () => {
    core.getInput.mockReturnValueOnce('valid-token')
    core.getInput.mockReturnValueOnce(organizationName)

    github.context.payload = {
      issue: {
        number: 42,
        body: `relevant https://${organizationName}.sentry.io/issues/42 relevant https://${organizationName}.sentry.io/issues/43`
      }
    }
    await run()

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith('Resolving Sentry issue: 42')
    expect(core.info).toHaveBeenCalledWith('Resolving Sentry issue: 43')
    expect(fetchMock).toHaveBeenCalledWith(
      `https://sentry.io/api/0/organizations/${organizationName}/issues/42/`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer valid-token`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'resolved' })
      }
    )
    expect(fetchMock).toHaveBeenCalledWith(
      `https://sentry.io/api/0/organizations/${organizationName}/issues/43/`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer valid-token`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'resolved' })
      }
    )
  })

  it('should allow multi-line github issue content to be processed normally', async () => {
    core.getInput.mockReturnValueOnce('valid-token')
    core.getInput.mockReturnValueOnce(organizationName)
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    } as Response)

    github.context.payload = {
      issue: {
        number: 42,
        body: `
        Sentry Issue: [TEST-4F](https://${organizationName}.sentry.io/issues/31887428/)

\`\`\`
Job timeout (test): Error or timeout while preparing the job.
\`\`\`
This issue was automatically created by Sentry via [New issues to GitHub](https://sentry.io/organizations/${organizationName}/alerts/rules/test/42/)
        `
      }
    }
    await run()

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith('Resolving Sentry issue: 31887428')
    expect(fetchMock).toHaveBeenCalledWith(
      `https://sentry.io/api/0/organizations/${organizationName}/issues/31887428/`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer valid-token`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'resolved' })
      }
    )
    expect(core.info).toHaveBeenCalledWith(
      '✅ Successfully resolved Sentry issue: 31887428'
    )
  })

  it('should handle Sentry error 500 properly', async () => {
    core.getInput.mockReturnValueOnce('valid-token')
    core.getInput.mockReturnValueOnce(organizationName)
    fetchMock.mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
      text: async () => 'Server Error'
    } as Response)

    await run()

    expect(core.error).toHaveBeenCalledWith(
      '❌ Error resolving Sentry issue 31887428: Error: Status: Internal Server Error, Exception: Server Error'
    )
  })
})
