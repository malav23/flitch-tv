import * as THREE from 'three'

/** Procedural PBR surfaces. No asset downloads: colour, normal and roughness maps from value noise. */

function lattice(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function valueNoise(size: number, cells: number, seed: number): Float32Array {
  const rnd = lattice(seed)
  const g = new Float32Array((cells + 1) * (cells + 1))
  for (let i = 0; i < g.length; i++) g[i] = rnd()
  const out = new Float32Array(size * size)
  const smooth = (t: number) => t * t * (3 - 2 * t)
  for (let y = 0; y < size; y++) {
    const fy = (y / size) * cells
    const y0 = Math.floor(fy), ty = smooth(fy - y0)
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * cells
      const x0 = Math.floor(fx), tx = smooth(fx - x0)
      const a = g[y0 * (cells + 1) + x0], b = g[y0 * (cells + 1) + x0 + 1]
      const c = g[(y0 + 1) * (cells + 1) + x0], d = g[(y0 + 1) * (cells + 1) + x0 + 1]
      out[y * size + x] = (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
    }
  }
  return out
}

function fbm(size: number, seed: number, octaves = 5, base = 4): Float32Array {
  const out = new Float32Array(size * size)
  let amp = 1, sum = 0
  for (let o = 0; o < octaves; o++) {
    const n = valueNoise(size, base * 2 ** o, seed + o * 31)
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp
    sum += amp
    amp *= 0.5
  }
  for (let i = 0; i < out.length; i++) out[i] /= sum
  return out
}

export interface Surface {
  map: THREE.CanvasTexture
  normalMap: THREE.CanvasTexture
  roughnessMap: THREE.CanvasTexture
}

interface SurfaceOpts {
  size?: number
  seed?: number
  /** base colour */
  color: string
  /** how much the noise modulates the colour, 0..1 */
  variation?: number
  /** dark grime blotches, 0..1 */
  grime?: number
  /** tile grid: number of columns and rows; lines are recessed */
  grid?: { cols: number; rows: number }
  /** normal strength */
  bump?: number
  /** base roughness and how much puddles/noise lower it */
  roughness?: number
  wet?: number
  repeat?: [number, number]
}

export function makeSurface(o: SurfaceOpts): Surface {
  const size = o.size ?? 256
  const seed = o.seed ?? 7
  const h = fbm(size, seed)
  const grimeN = fbm(size, seed + 101, 3, 2)
  const fine = valueNoise(size, 64, seed + 7)

  // height field with recessed grout lines
  const H = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = h[y * size + x] * 0.8 + fine[y * size + x] * 0.2
      if (o.grid) {
        const gx = (x / size) * o.grid.cols, gy = (y / size) * o.grid.rows
        const dx = Math.abs(gx - Math.round(gx)), dy = Math.abs(gy - Math.round(gy))
        const line = Math.min(dx * o.grid.cols, dy * o.grid.rows) // 0 at line
        if (line < 0.06) v -= 0.5 * (1 - line / 0.06)
      }
      H[y * size + x] = v
    }
  }

  const base = new THREE.Color(o.color)
  const variation = o.variation ?? 0.35
  const grime = o.grime ?? 0.4
  const bump = o.bump ?? 2.5
  const rough = o.roughness ?? 0.85
  const wet = o.wet ?? 0

  const cMap = document.createElement('canvas'); cMap.width = cMap.height = size
  const cNor = document.createElement('canvas'); cNor.width = cNor.height = size
  const cRou = document.createElement('canvas'); cRou.width = cRou.height = size
  const dMap = cMap.getContext('2d')!.createImageData(size, size)
  const dNor = cNor.getContext('2d')!.createImageData(size, size)
  const dRou = cRou.getContext('2d')!.createImageData(size, size)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x
      const v = H[i]
      const g = grimeN[i]
      const shade = 1 - variation / 2 + variation * v
      const dirt = 1 - grime * Math.max(0, g - 0.45) * 2
      const lineDark = v < 0.15 ? 0.55 : 1
      const r = base.r * shade * dirt * lineDark, gg = base.g * shade * dirt * lineDark, b = base.b * shade * dirt * lineDark
      dMap.data[i * 4] = Math.min(255, r * 255)
      dMap.data[i * 4 + 1] = Math.min(255, gg * 255)
      dMap.data[i * 4 + 2] = Math.min(255, b * 255)
      dMap.data[i * 4 + 3] = 255

      const l = H[y * size + ((x - 1 + size) % size)], rr = H[y * size + ((x + 1) % size)]
      const u = H[((y - 1 + size) % size) * size + x], d = H[((y + 1) % size) * size + x]
      const nx = (l - rr) * bump, ny = (u - d) * bump
      const len = Math.hypot(nx, ny, 1)
      dNor.data[i * 4] = ((nx / len) * 0.5 + 0.5) * 255
      dNor.data[i * 4 + 1] = ((ny / len) * 0.5 + 0.5) * 255
      dNor.data[i * 4 + 2] = ((1 / len) * 0.5 + 0.5) * 255
      dNor.data[i * 4 + 3] = 255

      // puddles: low points get glossy when wet
      const puddle = wet > 0 ? Math.max(0, 0.45 - h[i]) / 0.45 : 0
      const ro = THREE.MathUtils.clamp(rough - puddle * wet - (1 - dirt) * 0.15 + (v - 0.5) * 0.1, 0.05, 1)
      dRou.data[i * 4] = dRou.data[i * 4 + 1] = dRou.data[i * 4 + 2] = ro * 255
      dRou.data[i * 4 + 3] = 255
    }
  }
  cMap.getContext('2d')!.putImageData(dMap, 0, 0)
  cNor.getContext('2d')!.putImageData(dNor, 0, 0)
  cRou.getContext('2d')!.putImageData(dRou, 0, 0)

  const tex = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(o.repeat?.[0] ?? 1, o.repeat?.[1] ?? 1)
    if (srgb) t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  }
  return { map: tex(cMap, true), normalMap: tex(cNor, false), roughnessMap: tex(cRou, false) }
}
