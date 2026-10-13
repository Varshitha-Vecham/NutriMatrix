import test from 'node:test'
import assert from 'node:assert/strict'
import { EmailVerificationError, verifyEmailDeliverability } from './email-verification.js'

function fakeResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

test('accepts a deliverable Email Reputation response', async () => {
  let requestedUrl
  const result = await verifyEmailDeliverability('person@example.com', {
    apiKey: 'test-key',
    fetchImpl: async (url) => {
      requestedUrl = new URL(url)
      return fakeResponse({
        email_deliverability: { status: 'deliverable', is_format_valid: true },
        email_quality: { is_catchall: true }
      })
    }
  })
  assert.equal(result.outcome, 'deliverable')
  assert.equal(requestedUrl.origin, 'https://emailreputation.abstractapi.com')
  assert.equal(requestedUrl.pathname, '/v1/')
  assert.equal(requestedUrl.searchParams.get('api_key'), 'test-key')
  assert.equal(requestedUrl.searchParams.get('email'), 'person@example.com')
})

test('rejects a confirmed undeliverable address', async () => {
  const result = await verifyEmailDeliverability('missing@example.com', {
    apiKey: 'test-key',
    fetchImpl: async () => fakeResponse({
      email_deliverability: { status: 'undeliverable', is_format_valid: true, status_detail: 'invalid_email' }
    })
  })
  assert.equal(result.outcome, 'invalid')
  assert.equal(result.subStatus, 'invalid_email')
})

test('rejects an address Abstract marks as invalid format', async () => {
  const result = await verifyEmailDeliverability('invalid-address', {
    apiKey: 'test-key',
    fetchImpl: async () => fakeResponse({
      email_deliverability: { status: 'unknown', is_format_valid: false, status_detail: 'invalid_format' }
    })
  })
  assert.equal(result.outcome, 'invalid')
})

test('holds unknown or incomplete Email Reputation responses as inconclusive', async () => {
  for (const body of [
    { email_deliverability: { status: 'unknown' } },
    { email_quality: { score: 0.8 } }
  ]) {
    const result = await verifyEmailDeliverability('person@example.com', { apiKey: 'test-key', fetchImpl: async () => fakeResponse(body) })
    assert.equal(result.outcome, 'inconclusive')
  }
})

test('does not bypass a missing key or provider failure', async () => {
  await assert.rejects(
    verifyEmailDeliverability('person@example.com', { apiKey: '', fetchImpl: async () => fakeResponse({}) }),
    (error) => error instanceof EmailVerificationError && error.code === 'CONFIGURATION'
  )
  await assert.rejects(
    verifyEmailDeliverability('person@example.com', { apiKey: 'test-key', fetchImpl: async () => fakeResponse({ error: 'out of credits' }) }),
    (error) => error instanceof EmailVerificationError && error.code === 'UNAVAILABLE'
  )
  await assert.rejects(
    verifyEmailDeliverability('person@example.com', { apiKey: 'test-key', fetchImpl: async () => fakeResponse({}, 429) }),
    (error) => error instanceof EmailVerificationError && error.code === 'UNAVAILABLE'
  )
})

test('does not bypass a timed-out provider request', async () => {
  const fetchImpl = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))
  })
  await assert.rejects(
    verifyEmailDeliverability('person@example.com', { apiKey: 'test-key', fetchImpl, requestTimeoutMs: 5 }),
    (error) => error instanceof EmailVerificationError && error.code === 'UNAVAILABLE'
  )
})
