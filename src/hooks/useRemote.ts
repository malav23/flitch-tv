import { useEffect } from 'react'
import { useWorld, currentLoop } from '../store/world'
import { audio } from '../engine/audio'

/**
 * TV remote semantics on a keyboard:
 *  ← →  turn the dial        ENTER select / activate     ⌫ ESC back
 *  1 2 3 predict             R reinforce   K clue        P profile  H history  M mute  C studio  ? help
 */
export function useRemote() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useWorld.getState()
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
        if (e.key === 'Escape') { target.blur(); e.preventDefault() }
        return
      }
      audio.unlock()

      if (s.screen === 'boot') {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') s.finishBoot()
        return
      }

      // Global
      if (e.key === 'Escape') {
        if (s.panel !== 'none') return s.setPanel('none')
        if (s.screen === 'world') return s.leaveWorld()
        if (s.screen === 'studio') return s.openGuide()
        return
      }
      if (e.key === '?' ) return s.togglePanel('help')
      if (e.key.toLowerCase() === 'p') return s.togglePanel('profile')
      if (e.key.toLowerCase() === 'h') return s.togglePanel('history')
      if (e.key.toLowerCase() === 'm') { s.toggleMute(); audio.setMuted(!s.muted); return }

      if (s.screen === 'guide') {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { s.moveGuide(1); audio.tick(0.6) }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { s.moveGuide(-1); audio.tick(0.6) }
        else if (e.key === 'Enter') { s.enterWorld(); audio.select() }
        else if (e.key.toLowerCase() === 'c') s.openStudio()
        return
      }

      if (s.screen === 'world') {
        if (e.key === 'Backspace') return s.leaveWorld()
        const loop = currentLoop(s)
        if (!loop) return
        if (/^[1-3]$/.test(e.key)) {
          const opt = loop.options[Number(e.key) - 1]
          if (opt) { s.predict(opt.id); audio.select() }
          return
        }
        if (e.key.toLowerCase() === 'r') return s.reinforce()
        if (e.key.toLowerCase() === 'k') return s.buyClue()
        if (e.key === 'Enter' || e.key === ' ') {
          if (s.interruptAvailable) { s.activateInterrupt(); audio.lock() }
          e.preventDefault()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    const unlock = () => audio.unlock()
    window.addEventListener('pointerdown', unlock)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', unlock)
    }
  }, [])
}
