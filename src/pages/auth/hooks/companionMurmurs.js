export const COMPANION_EVENTS = {
  PAGE_LOAD: 'PAGE_LOAD',
  FIELD_LOST: 'FIELD_LOST',
  FOCUS_EMAIL: 'FOCUS_EMAIL',
  FOCUS_EMAIL_RETURN: 'FOCUS_EMAIL_RETURN',
  STARTED_EMAIL: 'STARTED_EMAIL',
  EMAIL_INVALID: 'EMAIL_INVALID',
  EMAIL_VALID: 'EMAIL_VALID',
  FOCUS_PASSWORD: 'FOCUS_PASSWORD',
  STARTED_PASSWORD: 'STARTED_PASSWORD',
  FORM_READY: 'FORM_READY',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  PASSWORD_HIDDEN: 'PASSWORD_HIDDEN',
  PASSWORD_VISIBLE: 'PASSWORD_VISIBLE',
  SUBMIT_EMPTY: 'SUBMIT_EMPTY',
  LONG_IDLE: 'LONG_IDLE',
  GUEST_CLICK: 'GUEST_CLICK',
}

export const SPEAKER_LABELS = {
  prime: 'Unit-01',
  byte: 'Byte',
  glitch: 'Glitch',
}

const DIALOGUES = {
  [COMPANION_EVENTS.PAGE_LOAD]: [
    {
      mood: 'calm',
      lines: [
        { speaker: 'byte', text: 'Oh look. Someone found the login page. Progress.' },
        { speaker: 'prime', text: 'Welcome only. Now show us credentials.' },
        { speaker: 'glitch', text: 'Let\'s see how long this takes, no?' },
      ],
    },
  ],
  [COMPANION_EVENTS.FIELD_LOST]: [
    {
      mood: 'calm',
      lines: [{ speaker: 'glitch', text: 'Can he find the email field… or do we send a map?' }],
    },
  ],
  [COMPANION_EVENTS.FOCUS_EMAIL]: [
    {
      mood: 'calm',
      lines: [{ speaker: 'byte', text: 'Finally! Field located. Very impressive.' }],
    },
  ],
  [COMPANION_EVENTS.FOCUS_EMAIL_RETURN]: [
    {
      mood: 'calm',
      lines: [{ speaker: 'glitch', text: 'Back to email? Password can wait, no?' }],
    },
  ],
  [COMPANION_EVENTS.STARTED_EMAIL]: [
    {
      mood: 'calm',
      lines: [{ speaker: 'prime', text: 'Typing has started… spelling also known, hopefully?' }],
    },
  ],
  [COMPANION_EVENTS.EMAIL_INVALID]: [
    {
      mood: 'concerned',
      lines: [
        { speaker: 'glitch', text: 'What is this email, no? Where did @ run off to?' },
        { speaker: 'byte', text: 'Even basics are too much, it seems.' },
      ],
    },
  ],
  [COMPANION_EVENTS.EMAIL_VALID]: [
    {
      mood: 'calm',
      lines: [{ speaker: 'prime', text: 'Email is fine. Minimum effort achieved only.' }],
    },
  ],
  [COMPANION_EVENTS.FOCUS_PASSWORD]: [
    {
      mood: 'nudge',
      lines: [
        { speaker: 'byte', text: 'Password time. We\'ll close our eyes, don\'t worry.' },
        { speaker: 'glitch', text: 'Same here. Privacy is a thing, apparently.' },
        { speaker: 'prime', text: 'I\'ll peek with one eye only. Just one.' },
      ],
    },
  ],
  [COMPANION_EVENTS.STARTED_PASSWORD]: [
    {
      mood: 'calm',
      lines: [{ speaker: 'glitch', text: 'Dots appearing… wrong password, full guarantee.' }],
    },
  ],
  [COMPANION_EVENTS.FORM_READY]: [
    {
      mood: 'happy',
      lines: [
        { speaker: 'byte', text: 'Both fields done. Looks like a miracle, no?' },
        { speaker: 'glitch', text: 'Will he press sign in… or just enjoy the confidence?' },
      ],
    },
  ],
  [COMPANION_EVENTS.LOGIN_SUCCESS]: [
    {
      mood: 'celebrate',
      lines: [
        { speaker: 'prime', text: 'He\'s in. Not bad, actually.' },
        { speaker: 'byte', text: 'Actual login? Didn\'t see that one coming, no?' },
      ],
    },
  ],
  [COMPANION_EVENTS.LOGIN_FAILURE]: [
    {
      mood: 'concerned',
      lines: [
        { speaker: 'glitch', text: 'Wrong password. Fully predictable, only.' },
        { speaker: 'byte', text: 'One more try… or shall we wait for memory?' },
      ],
    },
  ],
  [COMPANION_EVENTS.PASSWORD_HIDDEN]: [
    {
      mood: 'calm',
      lines: [{ speaker: 'prime', text: 'Hidden now. Bit late, but okay only.' }],
    },
  ],
  [COMPANION_EVENTS.PASSWORD_VISIBLE]: [
    {
      mood: 'nudge',
      lines: [
        { speaker: 'glitch', text: 'Showing password on screen? Very bold.' },
        { speaker: 'byte', text: 'We are all watching, FYI.' },
      ],
    },
  ],
  [COMPANION_EVENTS.SUBMIT_EMPTY]: [
    {
      mood: 'concerned',
      lines: [
        { speaker: 'byte', text: 'Sign in on empty form? Confidence level maximum.' },
        { speaker: 'glitch', text: 'Type something first, boss. Please only.' },
      ],
    },
  ],
  [COMPANION_EVENTS.LONG_IDLE]: [
    {
      mood: 'sleepy',
      lines: [
        { speaker: 'byte', text: 'So much time, zero action… fell asleep, no?' },
        { speaker: 'prime', text: 'We are also bored, honestly.' },
      ],
    },
  ],
  [COMPANION_EVENTS.GUEST_CLICK]: [
    {
      mood: 'calm',
      lines: [
        { speaker: 'glitch', text: 'Guest mode? Zero commitment, full choice.' },
        { speaker: 'byte', text: 'Skipped login entirely. Typical only.' },
      ],
    },
  ],
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function resolveMurmur(event) {
  if (!event?.type) return null
  const pool = DIALOGUES[event.type]
  if (!pool?.length) return null

  const dialogue = pool[(event.count || 0) % pool.length]
  const speakers = [...new Set(dialogue.lines.map(l => l.speaker))]

  const bySpeaker = {}
  dialogue.lines.forEach(line => {
    bySpeaker[line.speaker] = line.text
  })

  return {
    key: `${event.type}-${event.id}`,
    mood: dialogue.mood,
    lines: dialogue.lines,
    bySpeaker,
    speakers,
    isGroup: speakers.length >= 2,
  }
}

export function getMurmurHideMs(event) {
  const murmur = resolveMurmur(event)
  if (!murmur) return 7000
  return 5500 + murmur.lines.length * 2400
}

export function getSpeechForBot(murmur, speaker) {
  if (!murmur?.bySpeaker) return null
  return murmur.bySpeaker[speaker] ?? null
}
