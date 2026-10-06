import test from 'node:test'
import assert from 'node:assert/strict'
import { extractExpiryDateFromText, validDateString } from './expiry-detection.js'

test('prefers an expiry-labeled date over a manufacturing date', () => {
  assert.equal(
    extractExpiryDateFromText('MFD 04/07/26 11:07 EXPIRY: 31/03/27'),
    '2027-03-31'
  )
})

test('uses the later of two unlabeled package dates', () => {
  assert.equal(extractExpiryDateFromText('12/04/26 11/10/26'), '2026-10-11')
  assert.equal(extractExpiryDateFromText('02/02/2026 01/02/2027'), '2027-02-01')
})

test('supports month/year expiry labels and paired month/year dates', () => {
  assert.equal(extractExpiryDateFromText('EXP MAY/27'), '2027-05-31')
  assert.equal(extractExpiryDateFromText('BEST BEFORE May 2027'), '2027-05-31')
  assert.equal(extractExpiryDateFromText('MAY/26 - MAY/27'), '2027-05-31')
})

test('calculates a best-before period from the manufacture date', () => {
  assert.equal(extractExpiryDateFromText('MFD 01/03/26 BEST BEFORE 6 MONTHS'), '2026-09-01')
})

test('normalizes common OCR substitutions in labeled expiry dates', () => {
  assert.equal(extractExpiryDateFromText('EXP[RY: 31/03/27'), '2027-03-31')
})

test('rejects invalid calendar dates', () => {
  assert.equal(extractExpiryDateFromText('EXPIRY: 31/02/27'), '')
  assert.equal(extractExpiryDateFromText('MFD 12/04/26'), '')
  assert.equal(extractExpiryDateFromText('12/04/26'), '')
  assert.equal(extractExpiryDateFromText('5.89 - MAY/26 - Mek/07'), '')
  assert.equal(extractExpiryDateFromText('EXPIRY: 1/03727'), '')
  assert.equal(validDateString('2027-02-29'), false)
  assert.equal(validDateString('2028-02-29'), true)
})
