import { useEffect, useRef } from 'react'
import { COMPANION_EVENTS, isValidEmail } from './companionMurmurs'

const EMAIL_INVALID_DEBOUNCE_MS = 700
const IDLE_MS = 45000
const FIELD_LOST_DELAY_MS = 4200

export default function useLoginCompanionEvents(
  form,
  focusedField,
  emitCompanionEvent,
  lastActivity,
  emailFocusedRef,
) {
  const mounted = useRef(false)
  const startedEmail = useRef(false)
  const startedPassword = useRef(false)
  const prevEmailValid = useRef(false)
  const prevFormReady = useRef(false)
  const prevEmailInvalid = useRef(false)
  const fieldLostFired = useRef(false)
  const invalidTimer = useRef(null)

  const email = form.email.trim()
  const emailValid = isValidEmail(email)
  const hasEmail = email.length > 0
  const hasPassword = form.password.length > 0
  const formReady = emailValid && hasPassword

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      emitCompanionEvent(COMPANION_EVENTS.PAGE_LOAD)
    }
  }, [emitCompanionEvent])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!emailFocusedRef.current && !fieldLostFired.current) {
        fieldLostFired.current = true
        emitCompanionEvent(COMPANION_EVENTS.FIELD_LOST)
      }
    }, FIELD_LOST_DELAY_MS)
    return () => clearTimeout(timer)
  }, [emitCompanionEvent, emailFocusedRef])

  useEffect(() => {
    if (!hasEmail || startedEmail.current) return
    startedEmail.current = true
    emitCompanionEvent(COMPANION_EVENTS.STARTED_EMAIL)
  }, [hasEmail, emitCompanionEvent])

  useEffect(() => {
    if (!hasPassword || startedPassword.current) return
    startedPassword.current = true
    emitCompanionEvent(COMPANION_EVENTS.STARTED_PASSWORD)
  }, [hasPassword, emitCompanionEvent])

  useEffect(() => {
    if (emailValid && !prevEmailValid.current) {
      emitCompanionEvent(COMPANION_EVENTS.EMAIL_VALID)
    }
    prevEmailValid.current = emailValid
  }, [emailValid, emitCompanionEvent])

  useEffect(() => {
    const isInvalid = hasEmail && !emailValid
    if (isInvalid && !prevEmailInvalid.current) {
      clearTimeout(invalidTimer.current)
      invalidTimer.current = setTimeout(() => {
        emitCompanionEvent(COMPANION_EVENTS.EMAIL_INVALID)
      }, EMAIL_INVALID_DEBOUNCE_MS)
    }
    if (!isInvalid) {
      clearTimeout(invalidTimer.current)
    }
    prevEmailInvalid.current = isInvalid
    return () => clearTimeout(invalidTimer.current)
  }, [hasEmail, emailValid, emitCompanionEvent])

  useEffect(() => {
    if (formReady && !prevFormReady.current) {
      emitCompanionEvent(COMPANION_EVENTS.FORM_READY)
    }
    prevFormReady.current = formReady
  }, [formReady, emitCompanionEvent])

  useEffect(() => {
    const timer = setTimeout(() => {
      emitCompanionEvent(COMPANION_EVENTS.LONG_IDLE)
    }, IDLE_MS)
    return () => clearTimeout(timer)
  }, [lastActivity, emitCompanionEvent])
}
