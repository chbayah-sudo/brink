'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Brynk — two-model scroll explode  (premium pass)
//
//  • Damped scroll: scroll sets a target, the value chases it each frame
//    (THREE.MathUtils.damp) → buttery motion, no jank.
//  • Image-based lighting via Lightformers → real reflections on metal/plastic.
//  • Composed to sit right-of-center so the section's text/stepper stays clear.
//  • Neutral product tone mapping + a soft vignette for depth.
//
// Install:  npm i three @react-three/fiber @react-three/drei
// Files:    public/models/one.glb  and  public/models/two.glb
//
// Exports:
//   BrynkExplodeScene({ progressRef })  — the pinned visual (canvas + vignette),
//     driven by an external 0→1 progress ref. No <section>/scroll of its own;
//     the host section owns pinning + scroll. This is what the HOW BRINK WORKS
//     section embeds as its visual.
//   default BrynkHeadband3D()  — standalone self-contained section (kept intact).
// ─────────────────────────────────────────────────────────────────────────────

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Environment, Lightformer, Html } from '@react-three/drei'
import * as THREE from 'three'

const ONE = '/models/one.glb'
const TWO = '/models/two.glb'
const INK = '#0A0E14'

// ── tweaks ──
const EXPLODE_DIST = 0.25   // max spread at end of scroll
const STAGGER = 0.5         // cascade amount
const TURNS = 1.4           // rotations across the scroll
const FADE_A = 0.42         // crossfade window start
const FADE_B = 0.60         // crossfade window end
const MODEL_X = 0.9         // push model right so the left stays clear for text (0 = centered)
const SCROLL_VH = 340       // scroll length of the section
const DAMP = 4              // motion smoothing (lower = smoother + more lag)

const smooth = (x) => { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x) }

function prep(scene, group) {
  // Idempotent: reset any transform left by a prior prep() run — React
  // StrictMode double-invokes effects in dev, and without this the second run
  // measures the already-scaled scene and computes a ~1.0 scale, silently
  // cancelling the constant below (making size tweaks no-ops).
  scene.scale.setScalar(1)
  scene.position.set(0, 0, 0)
  scene.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(scene)
  const size = box.getSize(new THREE.Vector3())
  scene.scale.setScalar(2.3 / Math.max(size.x, size.y, size.z))
  scene.updateMatrixWorld(true)
  const c = new THREE.Box3().setFromObject(scene).getCenter(new THREE.Vector3())
  scene.position.sub(c)
  group.add(scene)
  group.rotation.set(0, 0, 0)
  group.updateMatrixWorld(true)

  let layer = scene
  while (layer.children.length === 1 && !layer.children[0].isMesh) layer = layer.children[0]
  const center = new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3())

  const parts = layer.children.map((ch) => {
    const b = new THREE.Box3().setFromObject(ch)
    if (b.isEmpty()) return null
    const cc = b.getCenter(new THREE.Vector3())
    const dir = cc.clone().sub(center)
    const d = dir.length()
    if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0)
    dir.normalize()
    return { node: ch, orig: ch.position.clone(), dir, d }
  }).filter(Boolean)
  parts.sort((a, b) => b.d - a.d)
  parts.forEach((p, i) => (p.order = parts.length > 1 ? i / (parts.length - 1) : 0))

  const mats = []
  scene.traverse((o) => {
    if (!o.isMesh) return
    ;(Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
      if (!m) return
      if ('emissive' in m) m.emissive = new THREE.Color(0x000000)
      m.emissiveIntensity = 0
      if ('transmission' in m) m.transmission = 0
      if ('thickness' in m) m.thickness = 0
      m.envMapIntensity = 1.1
      m.transparent = true
      m.depthWrite = true
      m.needsUpdate = true
      mats.push(m)
    })
  })
  return { root: scene, parts, mats }
}

function explode(model, local) {
  model.parts.forEach((pt) => {
    const start = pt.order * STAGGER
    const l = smooth((local - start) / (1 - STAGGER))
    pt.node.position.copy(pt.orig).addScaledVector(pt.dir, l * EXPLODE_DIST)
  })
}
function setOp(model, o) {
  model.root.visible = o > 0.001
  model.mats.forEach((m) => { m.opacity = o })
}

function DualModel({ progressRef, partsRef }) {
  // Models are Draco-compressed (14MB -> 5MB); drei fetches the decoder from
  // its CDN on first use.
  const g1 = useGLTF(ONE, true, true)
  const g2 = useGLTF(TWO, true, true)
  const groupRef = useRef()
  const A = useRef(null)
  const B = useRef(null)
  const damped = useRef(0)

  useEffect(() => {
    if (!groupRef.current) return
    groupRef.current.updateWorldMatrix(true, true)
    A.current = prep(g1.scene, groupRef.current)
    B.current = prep(g2.scene, groupRef.current)
    if (partsRef) partsRef.current = B.current // TEMP: expose end-model parts for the id overlay
    return () => {
      if (groupRef.current) { groupRef.current.remove(g1.scene); groupRef.current.remove(g2.scene) }
    }
  }, [g1.scene, g2.scene])

  useFrame((_, delta) => {
    if (!A.current || !B.current) return
    const dt = Math.min(delta, 0.05)
    damped.current = THREE.MathUtils.damp(damped.current, progressRef.current, DAMP, dt)
    const p = damped.current
    const fade = smooth((p - FADE_A) / (FADE_B - FADE_A))
    explode(A.current, smooth(p / 0.5)); setOp(A.current, 1 - fade)
    explode(B.current, smooth((p - 0.5) / 0.5)); setOp(B.current, fade)
    if (groupRef.current) groupRef.current.rotation.set(-0.22, p * Math.PI * 2 * TURNS, 0)
  })

  return <group ref={groupRef} position={[MODEL_X, 0, 0]} />
}

// No module-level useGLTF.preload here: it fired ~14MB of GLB downloads the
// moment the page loaded. The host section lazy-mounts the scene as the
// visitor approaches, and Suspense loads the models then.

function CameraRig({ progressRef }) {
  const { camera } = useThree()
  const damped = useRef(0)
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    damped.current = THREE.MathUtils.damp(damped.current, progressRef.current, DAMP, dt)
    const e = smooth(damped.current)
    camera.position.set(0, 0.95 - e * 0.5, 6.4 - e * 0.85)
    camera.lookAt(0, 0, 0)
  })
  return null
}

// The pinned visual: fills its (positioned) parent, driven by an external
// progress ref. Canvas + IBL + vignette travel together so the premium look is
// identical whether standalone or embedded in the HOW BRINK WORKS section.
// ── Part labels ────────────────────────────────────────────────────────────
// Friendly names per GLB id (two.glb), from a read of the exploded model.
// A few small/clustered parts are best-guess "Module" — easy to rename here.
const PART_NAMES = {
  tripo_part_16: 'Top band',
  tripo_part_0: 'Bottom band',
  tripo_part_6: 'Sensor strip',
  tripo_part_8: 'Contact strip',
  tripo_part_9: 'Flex cable',
  tripo_part_11: 'Flex cable',
  tripo_part_7: 'Side arm',
  tripo_part_10: 'Side arm',
  tripo_part_1: 'End cap',
  tripo_part_14: 'End cap',
  tripo_part_2: 'Board',
  tripo_part_12: 'Battery',
  tripo_part_3: 'Module',
  tripo_part_4: 'Module',
  tripo_part_5: 'Module',
  tripo_part_13: 'Module',
  tripo_part_15: 'Module',
  tripo_part_17: 'Module',
  tripo_part_18: 'Module',
}

// Floating callout per part: a cyan anchor dot on the piece + its name, in the
// Brink palette. Live-tracks the part so labels stay glued as the model settles;
// only shown near full explode.
function PartIdLabels({ partsRef, progressRef }) {
  const [labels, setLabels] = useState([])
  const wp = useRef(new THREE.Vector3())
  const lastT = useRef(0)
  useFrame(() => {
    const model = partsRef.current
    if (!model || progressRef.current < 0.8) {
      if (labels.length) setLabels([])
      return
    }
    // 12Hz is plenty for labels gliding with a damped, settling model — a
    // per-frame setState here re-created 19 <Html> portals 60x/s (measured as
    // a page-wide React churn once scrolled past the section).
    const now = performance.now()
    if (now - lastT.current < 80) return
    lastT.current = now
    setLabels(model.parts.map((pt) => {
      pt.node.getWorldPosition(wp.current)
      const id = pt.node.name || 'part'
      return { name: PART_NAMES[id] || id, x: wp.current.x, y: wp.current.y, z: wp.current.z }
    }))
  })
  return labels.map((l, i) => (
    <Html key={i} position={[l.x, l.y, l.z]} center zIndexRange={[200, 0]}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', pointerEvents: 'none',
        background: 'rgba(10,14,20,0.82)', backdropFilter: 'blur(4px)',
        border: '1px solid rgba(61,225,255,0.4)', borderRadius: 999,
        padding: '3px 10px 3px 7px', boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: '#3DE1FF', boxShadow: '0 0 8px #3DE1FF' }} />
        <span style={{ color: '#E8E4D8', font: '600 11px/1 ui-monospace,monospace', letterSpacing: '0.02em' }}>{l.name}</span>
      </div>
    </Html>
  ))
}
// ───────────────────────────────────────────────────────────────────────────

// Mounts once every Suspense promise in its boundary resolves (models decoded).
function SceneReadySignal({ onReady }) {
  useEffect(() => {
    onReady()
  }, [onReady])
  return null
}

export function BrynkExplodeScene({ progressRef }) {
  const partsRef = useRef(null)
  const wrapRef = useRef(null)
  // Warm-up: once the models resolve, run the frameloop briefly even while
  // offscreen so shaders compile + geometry uploads happen ahead of arrival.
  // Without this, that one-time GPU work fired the moment the section came
  // into view — the "band takes a second to appear" delay.
  const [warming, setWarming] = useState(false)
  const warmTimer = useRef(0)
  const onSceneReady = useCallback(() => {
    setWarming(true)
    clearTimeout(warmTimer.current)
    warmTimer.current = setTimeout(() => setWarming(false), 1500)
  }, [])
  useEffect(() => () => clearTimeout(warmTimer.current), [])
  // Only run the WebGL frameloop while the section is actually on screen.
  // Default 'always' rendered the scene at 60fps for the entire page session
  // (measured: three.js + label portals taxing every section below this one).
  const [onScreen, setOnScreen] = useState(true)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => setOnScreen(e.isIntersecting),
      { rootMargin: '10%' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        frameloop={onScreen || warming ? 'always' : 'never'}
        dpr={[1, 1.5]}
        gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.05 }}
        camera={{ position: [0, 0.95, 6.4], fov: 42 }}
      >
        <color attach="background" args={[INK]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 6, 4]} intensity={2.6} />

        {/* image-based lighting — real reflections, no HDRI download */}
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={4.5} position={[4, 5, 5]} scale={[9, 9, 1]} color="#ffffff" />
          <Lightformer form="rect" intensity={1.0} position={[-6, 1, 2]} scale={[7, 7, 1]} color="#bcd3ff" />
          <Lightformer form="rect" intensity={1.6} position={[-4, -2, -3]} scale={[6, 6, 1]} color="#3DE1FF" />
          <Lightformer form="rect" intensity={1.2} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[9, 9, 1]} color="#ffffff" />
        </Environment>

        <Suspense fallback={null}>
          <DualModel progressRef={progressRef} partsRef={partsRef} />
          <CameraRig progressRef={progressRef} />
          <PartIdLabels partsRef={partsRef} progressRef={progressRef} />
          <SceneReadySignal onReady={onSceneReady} />
        </Suspense>
      </Canvas>

      {/* soft vignette to focus the model and add depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 65% at 62% 46%, rgba(10,14,20,0) 45%, rgba(10,14,20,0.6) 100%)',
        }}
      />
    </div>
  )
}

// Standalone self-contained section — kept intact and working, but no longer
// rendered in the page now that BrynkExplodeScene is embedded in the HOW BRINK
// WORKS section (which owns the 340vh sticky section + scroll progress).
export default function BrynkHeadband3D() {
  const progressRef = useRef(0)
  const sectionRef = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const scrolled = Math.min(Math.max(-rect.top, 0), total)
      progressRef.current = total > 0 ? scrolled / total : 0
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section ref={sectionRef} style={{ height: `${SCROLL_VH}vh`, background: INK }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <BrynkExplodeScene progressRef={progressRef} />
      </div>
    </section>
  )
}
