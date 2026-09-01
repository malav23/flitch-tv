import { useWorld } from '../store/world'

/** Runs the loop clock. One instance per app. */
export function startDirector() {
  let last = performance.now()
  let raf = 0
  const step = (now: number) => {
    const dt = Math.min(0.25, (now - last) / 1000)
    last = now
    useWorld.getState().tick(dt)
    raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
  return () => cancelAnimationFrame(raf)
}
