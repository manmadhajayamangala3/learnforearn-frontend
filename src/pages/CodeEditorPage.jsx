import { useState, useRef, useEffect, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Loader2, Trash2, Terminal } from 'lucide-react'
import Navbar from '../components/navbars/Navbar'
import { useTheme } from '../context/ThemeContext'
import { executeCode } from '../api/api'
import getApiError from '../utils/apiError'
import '../styles/pages/code-editor.css'

const LANGUAGES = [
  { id: 'python', label: 'Python', monaco: 'python' },
  { id: 'java', label: 'Java', monaco: 'java' },
  { id: 'c', label: 'C', monaco: 'c' },
  { id: 'cpp', label: 'C++', monaco: 'cpp' },
]

const TEMPLATES = {
  python: 'print("Hello, World!")\n',
  java: `public class Solution {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
  c: `#include <stdio.h>
int main() {
    printf("Hello, World!\\n");
    return 0;
}
`,
  cpp: `#include <iostream>
using namespace std;
int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`,
}

// status → output text colour class
const STATUS_CLASS = {
  SUCCESS: 'ce-out--success',
  ERROR: 'ce-out--error',
  TIMEOUT: 'ce-out--timeout',
  BLOCKED: 'ce-out--blocked',
}

const EDITOR_OPTIONS = {
  fontSize: 14,
  lineNumbers: 'on',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 4,
  padding: { top: 12, bottom: 12 },
  fontFamily: "'Share Tech Mono', ui-monospace, monospace",
  smoothScrolling: true,
  renderLineHighlight: 'line',
}

export default function CodeEditorPage() {
  const { theme } = useTheme()
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(TEMPLATES.python)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)   // { output, error, status, executionTime }
  const [netError, setNetError] = useState('')

  const abortRef = useRef(null)

  // Cancel any in-flight run when the user navigates away.
  useEffect(() => () => abortRef.current?.abort(), [])

  const changeLanguage = (id) => {
    setLanguage(id)
    setCode(TEMPLATES[id] ?? '')
  }

  const clearOutput = () => {
    setResult(null)
    setNetError('')
  }

  const run = useCallback(async () => {
    if (running) return
    setRunning(true)
    setResult(null)
    setNetError('')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const { data } = await executeCode(code, language, controller.signal)
      setResult(data)
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return // navigated away
      // A BLOCKED run comes back as 400 but with the full result shape — show it.
      const body = err?.response?.data
      if (body && body.status) setResult(body)
      else setNetError(getApiError(err, 'Could not reach the code runner. Please try again.'))
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setRunning(false)
      }
    }
  }, [code, language, running])

  const activeMonaco = LANGUAGES.find(l => l.id === language)?.monaco || 'plaintext'
  const editorTheme = theme === 'light' ? 'light' : 'vs-dark'

  const outText = result
    ? (result.status === 'SUCCESS'
        ? (result.output && result.output.length ? result.output : '(no output)')
        : (result.error || result.output || 'Something went wrong.'))
    : ''
  const outClass = result ? (STATUS_CLASS[result.status] || 'ce-out--error') : ''
  const showTime = result && result.status !== 'BLOCKED' && typeof result.executionTime === 'number'

  return (
    <div className="ce-page">
      <Navbar sticky />

      <div className="ce-body">
        <div className="ce-toolbar">
          <label className="ce-lang">
            <span className="ce-lang__label">Language</span>
            <select
              className="ce-select"
              value={language}
              onChange={e => changeLanguage(e.target.value)}
              disabled={running}
              aria-label="Programming language"
            >
              {LANGUAGES.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </label>

          <button type="button" className="ce-run" onClick={run} disabled={running}>
            {running
              ? <><Loader2 size={16} className="ce-spin" /> Running…</>
              : <><Play size={16} /> Run</>}
          </button>
        </div>

        <div className="ce-editor-wrap">
          <Editor
            height="100%"
            language={activeMonaco}
            theme={editorTheme}
            value={code}
            onChange={v => setCode(v ?? '')}
            options={EDITOR_OPTIONS}
            loading={<div className="ce-editor-loading">Loading editor…</div>}
          />
        </div>

        <section className="ce-output" aria-live="polite">
          <div className="ce-output__head">
            <span className="ce-output__title"><Terminal size={14} /> Output</span>
            <button
              type="button"
              className="ce-clear"
              onClick={clearOutput}
              disabled={running || (!result && !netError)}
            >
              <Trash2 size={13} /> Clear
            </button>
          </div>

          <div className="ce-output__body">
            {running ? (
              <div className="ce-output__running">
                <Loader2 size={15} className="ce-spin" /> Running your code…
              </div>
            ) : netError ? (
              <pre className="ce-out-text ce-out--error">{netError}</pre>
            ) : result ? (
              <pre className={`ce-out-text ${outClass}`}>{outText}</pre>
            ) : (
              <div className="ce-output__empty">Run your code to see the output here.</div>
            )}
          </div>

          <div className="ce-output__foot">
            {showTime ? `${result.executionTime} ms` : ''}
          </div>
        </section>
      </div>
    </div>
  )
}
