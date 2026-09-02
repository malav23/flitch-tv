import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import gsap from 'gsap'
import { useWorld } from '../store/world'

/** First thing after the set switches on: who is watching? */
export function Name() {
  const setName = useWorld((s) => s.setName)
  const [value, setValue] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (root.current) gsap.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 0.4 })
    input.current?.focus()
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const n = value.trim().replace(/\s+/g, '_').slice(0, 20)
    if (n.length < 2) return
    setName(n)
  }

  return (
    <div className="namegate" ref={root} role="dialog" aria-label="Enter your name">
      <form className="namecard" onSubmit={submit}>
        <span className="k">Who is watching</span>
        <input ref={input} value={value} onChange={(e) => setValue(e.target.value)} placeholder="your name" maxLength={20} autoComplete="off" spellCheck={false} />
        <div className="row">
          <span className="faint">2–20 characters · shown in the room</span>
          <button type="submit" className="enter" disabled={value.trim().length < 2}>Enter <kbd>↵</kbd></button>
        </div>
      </form>
    </div>
  )
}
