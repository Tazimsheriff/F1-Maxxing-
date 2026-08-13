'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  Play,
  Pause,
  Eye,
  Zap,
  Flame,
  Maximize2,
  Minimize2,
  Box,
  Sun,
  Moon,
  Compass,
  Sparkles,
  Layers,
  Palette
} from 'lucide-react'
import { AnalysisResult } from '@/app/page'
import { useLanguage } from './LanguageContext'

interface F1CarViewer3DProps {
  result?: AnalysisResult | null
  loading?: boolean
}

type ModelType = 'redbull' | 'compressed'
type LiveryType = 'redbull' | 'ferrari' | 'stealth' | 'cyber'
type ViewPreset = 'orbit' | 'cockpit' | 'front_wing' | 'drs_rear' | 'side'

export default function F1CarViewer3D({ result, loading }: F1CarViewer3DProps) {
  const { t } = useLanguage()
  const containerRef = useRef<HTMLDivElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const modelGroupRef = useRef<THREE.Group | null>(null)
  const groundGlowLightRef = useRef<THREE.PointLight | null>(null)
  const groundGridRef = useRef<THREE.GridHelper | null>(null)
  const animationFrameId = useRef<number | null>(null)

  const [activeModel, setActiveModel] = useState<ModelType>('redbull')
  const [activeLivery, setActiveLivery] = useState<LiveryType>('redbull')
  const [activeView, setActiveView] = useState<ViewPreset>('orbit')
  const [autoRotate, setAutoRotate] = useState(true)
  const [wireframe, setWireframe] = useState(false)
  const [nightMode, setNightMode] = useState(true)
  const [modelLoading, setModelLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Use a Ref for autoRotate to avoid re-initializing the Three.js scene when autoRotate changes!
  const autoRotateRef = useRef(autoRotate)
  useEffect(() => {
    autoRotateRef.current = autoRotate
  }, [autoRotate])

  // Driver stress & mood calculation for reactive lighting
  const stress = result?.driver_state?.stress ?? 25
  const isAlert = result?.reasoning?.alert ?? false
  const alertLevel = result?.driver_state?.alert_level ?? 'NOMINAL'

  const stressRef = useRef(stress)
  useEffect(() => {
    stressRef.current = stress
  }, [stress])

  // Reactive color calculation
  const getThemeColor = useCallback(() => {
    if (isAlert || stress > 70) return '#ff003c' // Crimson Red
    if (stress > 45) return '#ffb700' // Gold/Amber
    return '#00f0ff' // Electric Cyan
  }, [stress, isAlert])

  const themeColor = getThemeColor()

  // Apply rich F1 racing materials to mesh parts based on livery selection
  const applyF1Materials = useCallback((model: THREE.Object3D, livery: LiveryType, isWireframe: boolean) => {
    let bodyColor = new THREE.Color(0x0b162a) // Red Bull Matte Navy
    let wingColor = new THREE.Color(0xd00000) // Red Bull Wing Red
    let trimColor = new THREE.Color(0xf5b000) // Gold accents

    if (livery === 'ferrari') {
      bodyColor = new THREE.Color(0xc92d2b) // Ferrari Rosso Corsa
      wingColor = new THREE.Color(0x18181b) // Black Aero Wings
      trimColor = new THREE.Color(0xfacc15) // Yellow highlights
    } else if (livery === 'stealth') {
      bodyColor = new THREE.Color(0x12141a) // Stealth Carbon Matte
      wingColor = new THREE.Color(0x27272a) // Dark Carbon
      trimColor = new THREE.Color(0x00f0ff) // Cyan Trim
    } else if (livery === 'cyber') {
      bodyColor = new THREE.Color(0x0d0f1d) // Cyber Dark Metallic
      wingColor = new THREE.Color(0xff003c) // Neon Crimson
      trimColor = new THREE.Color(0x00f0ff) // Electric Cyan
    }

    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true

        const name = (mesh.material && (mesh.material as THREE.Material).name)
          ? (mesh.material as THREE.Material).name.toLowerCase()
          : mesh.name.toLowerCase()

        let mat: THREE.MeshStandardMaterial

        if (
          name.includes('govde') ||
          name.includes('kabin') ||
          name.includes('sasi') ||
          name.includes('şasi') ||
          name.includes('material.001') ||
          name.includes('cube')
        ) {
          // Main Body Shell
          mat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.25,
            metalness: 0.55,
            wireframe: isWireframe
          })
        } else if (name.includes('lastik') || name.includes('tire') || name.includes('tire_lid')) {
          // Pirelli Tyres Rubber
          mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0x1e1e24),
            roughness: 0.85,
            metalness: 0.1,
            wireframe: isWireframe
          })
        } else if (name.includes('jant') || name.includes('rim') || name.includes('bujon')) {
          // Wheel Rims
          mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0x111318),
            roughness: 0.2,
            metalness: 0.85,
            wireframe: isWireframe
          })
        } else if (
          name.includes('spoiler') ||
          name.includes('kanat') ||
          name.includes('kanard') ||
          name.includes('karbon')
        ) {
          // Aerodynamic Wings & Spoilers
          mat = new THREE.MeshStandardMaterial({
            color: wingColor,
            roughness: 0.3,
            metalness: 0.5,
            wireframe: isWireframe
          })
        } else if (name.includes('ayna_cam') || name.includes('mirror_glass')) {
          // Rearview Mirror Glass
          mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0xe2e8f0),
            roughness: 0.05,
            metalness: 0.95,
            wireframe: isWireframe
          })
        } else if (name.includes('egzos') || name.includes('piston') || name.includes('çubuk')) {
          // Metallic Engine Exhaust & Hydraulic Pistons
          mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0x718096),
            roughness: 0.2,
            metalness: 0.85,
            wireframe: isWireframe
          })
        } else if (name.includes('light')) {
          // Rear Rain Safety Light
          mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0xff003c),
            emissive: new THREE.Color(0xff003c),
            emissiveIntensity: 3.5,
            wireframe: isWireframe
          })
        } else {
          // Accent Trims & Cockpit Detailing
          mat = new THREE.MeshStandardMaterial({
            color: trimColor,
            roughness: 0.3,
            metalness: 0.4,
            wireframe: isWireframe
          })
        }

        mesh.material = mat
      }
    })
  }, [])

  // 1. Initialize Scene, Camera, Renderer, Controls (Runs ONLY ONCE on mount)
  useEffect(() => {
    if (!mountRef.current || !containerRef.current) return

    const container = mountRef.current
    const width = containerRef.current.clientWidth || container.clientWidth || 800
    const height = containerRef.current.clientHeight || container.clientHeight || 800

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0c14)
    scene.fog = new THREE.FogExp2(0x0a0c14, 0.015)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000)
    camera.position.set(4.5, 1.8, 5.5)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3

    // Clear old canvas safely inside dedicated mountRef container
    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2 + 0.05 // Don't go far below ground
    controls.minDistance = 1.2
    controls.maxDistance = 18
    controls.target.set(0, 0.4, 0)
    controlsRef.current = controls

    // Ambient & Studio Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8)
    keyLight.position.set(6, 9, 6)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x3b82f6, 1.2)
    fillLight.position.set(-6, 4, -6)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xe8002d, 2.0)
    rimLight.position.set(0, 6, -8)
    scene.add(rimLight)

    // Dynamic Ground Glow Light (Under Car)
    const groundLight = new THREE.PointLight(new THREE.Color(themeColor), 4.5, 10)
    groundLight.position.set(0, 0.2, 0)
    scene.add(groundLight)
    groundGlowLightRef.current = groundLight

    // Cyber Grid Floor
    const grid = new THREE.GridHelper(24, 48, new THREE.Color('#ff003c'), new THREE.Color('#1e293b'))
    grid.position.y = 0
    scene.add(grid)
    groundGridRef.current = grid

    // Animation Loop
    let clock = new THREE.Clock()
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate)

      const elapsedTime = clock.getElapsedTime()

      if (controlsRef.current) {
        if (autoRotateRef.current && modelGroupRef.current) {
          modelGroupRef.current.rotation.y += 0.005 * (1 + stressRef.current / 100)
        }
        controlsRef.current.update()
      }

      // Pulse ground glow light slightly
      if (groundGlowLightRef.current) {
        groundGlowLightRef.current.intensity = 4.0 + Math.sin(elapsedTime * 4) * 1.5
      }

      renderer.render(scene, camera)
    }

    animate()

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight || 800
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, []) // Empty dependency array: NEVER unmount scene on state toggles!

  // 2. Load 3D Model whenever activeModel changes
  useEffect(() => {
    if (!sceneRef.current) return

    setModelLoading(true)
    setLoadProgress(0)

    const modelPath =
      activeModel === 'redbull' ? '/models/f1_car_redbull_opt.glb' : '/models/f1_car_compressed.glb'

    const loader = new GLTFLoader()

    loader.load(
      modelPath,
      (gltf) => {
        // Remove existing model if any
        if (modelGroupRef.current && sceneRef.current) {
          sceneRef.current.remove(modelGroupRef.current)
        }

        const model = gltf.scene

        // Center and compute bounding box to scale normalized
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())

        const maxDim = Math.max(size.x, size.y, size.z)
        const scaleFactor = 6.8 / maxDim

        model.scale.setScalar(scaleFactor)
        model.position.x = -center.x * scaleFactor
        model.position.y = -box.min.y * scaleFactor
        model.position.z = -center.z * scaleFactor

        // Apply realistic multi-colored F1 materials
        applyF1Materials(model, activeLivery, wireframe)

        const group = new THREE.Group()
        group.add(model)
        sceneRef.current?.add(group)
        modelGroupRef.current = group

        setModelLoading(false)
        setLoadProgress(100)
      },
      (xhr) => {
        if (xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100)
          setLoadProgress(percent)
        } else {
          setLoadProgress(50)
        }
      },
      (error) => {
        console.error('Error loading 3D F1 car model:', error)
        setModelLoading(false)
      }
    )
  }, [activeModel])

  // 3. Update Wireframe & Livery on current loaded model
  useEffect(() => {
    if (!modelGroupRef.current) return
    applyF1Materials(modelGroupRef.current, activeLivery, wireframe)
  }, [wireframe, activeLivery, applyF1Materials])

  // 4. Update Night / Day scene environment lighting
  useEffect(() => {
    if (!sceneRef.current) return
    const scene = sceneRef.current
    if (nightMode) {
      scene.background = new THREE.Color(0x0a0c14)
      scene.fog = new THREE.FogExp2(0x0a0c14, 0.015)
    } else {
      scene.background = new THREE.Color(0x1a202c)
      scene.fog = new THREE.FogExp2(0x1a202c, 0.01)
    }
  }, [nightMode])

  // 5. Update Reactive Ground Light Color on Driver Stress Change
  useEffect(() => {
    if (groundGlowLightRef.current) {
      groundGlowLightRef.current.color.set(themeColor)
    }
    if (groundGridRef.current) {
      groundGridRef.current.material = new THREE.LineBasicMaterial({
        color: new THREE.Color(themeColor),
        transparent: true,
        opacity: 0.3
      })
    }
  }, [themeColor])

  // 6. Camera View Preset Switcher with smooth animation
  const handleViewPreset = (preset: ViewPreset) => {
    setActiveView(preset)
    if (!cameraRef.current || !controlsRef.current) return

    const camera = cameraRef.current
    const controls = controlsRef.current

    let targetPos = new THREE.Vector3(4.5, 1.8, 5.5)
    let lookTarget = new THREE.Vector3(0, 0.4, 0)

    switch (preset) {
      case 'cockpit':
        targetPos = new THREE.Vector3(0, 0.8, 0.1)
        lookTarget = new THREE.Vector3(0, 0.7, -2.5)
        setAutoRotate(false)
        break
      case 'front_wing':
        targetPos = new THREE.Vector3(0.4, 0.5, 2.8)
        lookTarget = new THREE.Vector3(0, 0.3, 1)
        setAutoRotate(false)
        break
      case 'drs_rear':
        targetPos = new THREE.Vector3(-0.5, 0.9, -3.2)
        lookTarget = new THREE.Vector3(0, 0.5, -1)
        setAutoRotate(false)
        break
      case 'side':
        targetPos = new THREE.Vector3(5.2, 0.7, 0)
        lookTarget = new THREE.Vector3(0, 0.4, 0)
        setAutoRotate(false)
        break
      case 'orbit':
      default:
        targetPos = new THREE.Vector3(4.5, 1.8, 5.5)
        lookTarget = new THREE.Vector3(0, 0.4, 0)
        setAutoRotate(true)
        break
    }

    // Animate camera to new target smoothly
    const startPos = camera.position.clone()
    const startTarget = controls.target.clone()
    let progress = 0

    const animCamera = () => {
      progress += 0.05
      if (progress <= 1) {
        camera.position.lerpVectors(startPos, targetPos, progress)
        controls.target.lerpVectors(startTarget, lookTarget, progress)
        controls.update()
        requestAnimationFrame(animCamera)
      } else {
        camera.position.copy(targetPos)
        controls.target.copy(lookTarget)
        controls.update()
      }
    }
    animCamera()
  }

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error)
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`card relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[800px] w-full min-h-[680px]'
      }`}
      style={{
        backgroundColor: '#0a0c14',
        background: nightMode
          ? 'radial-gradient(ellipse at center, #111827 0%, #0a0c14 100%)'
          : 'radial-gradient(ellipse at center, #1f2937 0%, #111827 100%)',
        borderColor: `${themeColor}60`,
        boxShadow: `0 0 45px ${themeColor}20`,
        color: '#ffffff'
      }}
    >
      {/* WebGL Canvas dedicated container ref */}
      <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-auto" />

      {/* TOP OVERLAY HEADER */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between flex-wrap gap-3 pointer-events-none">
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-xl pointer-events-auto"
          style={{
            backgroundColor: 'rgba(10, 12, 20, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff'
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-mono text-base font-bold text-black shadow-lg"
            style={{ backgroundColor: themeColor }}
          >
            🏎️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wider font-mono" style={{ color: '#ffffff' }}>
                {t('viewer3d.title')}
              </span>
              <span
                className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border uppercase"
                style={{
                  color: themeColor,
                  borderColor: `${themeColor}90`,
                  backgroundColor: `${themeColor}25`
                }}
              >
                {alertLevel === 'NOMINAL' ? t('driverState.nominal') : alertLevel}
              </span>
            </div>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: '#94a3b8' }}>
              {t('viewer3d.subtitle')}
            </p>
          </div>
        </div>

        {/* TOP RIGHT CONTROLS */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          {/* Livery Color Switcher */}
          <div
            className="p-1.5 rounded-2xl flex items-center gap-1 font-mono text-xs shadow-xl"
            style={{
              backgroundColor: 'rgba(10, 12, 20, 0.92)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff'
            }}
          >
            <span className="text-[10px] font-bold uppercase px-2 flex items-center gap-1" style={{ color: '#94a3b8' }}>
              <Palette size={12} /> {t('viewer3d.livery')}
            </span>
            <button
              onClick={() => setActiveLivery('redbull')}
              className="px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer"
              style={{
                backgroundColor: activeLivery === 'redbull' ? '#2563eb' : 'transparent',
                color: activeLivery === 'redbull' ? '#ffffff' : '#cbd5e1',
                border: activeLivery === 'redbull' ? '1px solid #60a5fa' : '1px solid transparent'
              }}
            >
              Red Bull
            </button>
            <button
              onClick={() => setActiveLivery('ferrari')}
              className="px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer"
              style={{
                backgroundColor: activeLivery === 'ferrari' ? '#dc2626' : 'transparent',
                color: activeLivery === 'ferrari' ? '#ffffff' : '#cbd5e1',
                border: activeLivery === 'ferrari' ? '1px solid #f87171' : '1px solid transparent'
              }}
            >
              Ferrari Red
            </button>
            <button
              onClick={() => setActiveLivery('stealth')}
              className="px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer"
              style={{
                backgroundColor: activeLivery === 'stealth' ? '#334155' : 'transparent',
                color: activeLivery === 'stealth' ? '#00f0ff' : '#cbd5e1',
                border: activeLivery === 'stealth' ? '1px solid #00f0ff' : '1px solid transparent'
              }}
            >
              Stealth
            </button>
            <button
              onClick={() => setActiveLivery('cyber')}
              className="px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer"
              style={{
                backgroundColor: activeLivery === 'cyber' ? '#e11d48' : 'transparent',
                color: activeLivery === 'cyber' ? '#ffffff' : '#cbd5e1',
                border: activeLivery === 'cyber' ? '1px solid #fda4af' : '1px solid transparent'
              }}
            >
              Cyber Pulse
            </button>
          </div>

          {/* Model Selector Toggle */}
          <div
            className="p-1.5 rounded-2xl flex items-center gap-1 font-mono text-xs shadow-xl"
            style={{
              backgroundColor: 'rgba(10, 12, 20, 0.92)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff'
            }}
          >
            <button
              onClick={() => setActiveModel('redbull')}
              className="px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer"
              style={{
                backgroundColor: activeModel === 'redbull' ? '#334155' : 'transparent',
                color: activeModel === 'redbull' ? '#ffffff' : '#94a3b8',
                border: activeModel === 'redbull' ? '1px solid #64748b' : '1px solid transparent'
              }}
            >
              RB18 HQ
            </button>
            <button
              onClick={() => setActiveModel('compressed')}
              className="px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer"
              style={{
                backgroundColor: activeModel === 'compressed' ? '#334155' : 'transparent',
                color: activeModel === 'compressed' ? '#ffffff' : '#94a3b8',
                border: activeModel === 'compressed' ? '1px solid #64748b' : '1px solid transparent'
              }}
            >
              Fast GLB
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-2xl transition-all cursor-pointer shadow-xl"
            style={{
              backgroundColor: 'rgba(10, 12, 20, 0.92)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff'
            }}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* LOADING OVERLAY */}
      {modelLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3" style={{ backgroundColor: 'rgba(10, 12, 20, 0.95)', color: '#ffffff' }}>
          <div className="relative flex items-center justify-center">
            <div
              className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: `${themeColor} transparent ${themeColor} ${themeColor}` }}
            />
            <Sparkles
              className="absolute animate-pulse"
              size={24}
              style={{ color: themeColor }}
            />
          </div>
          <div className="text-center font-mono">
            <p className="text-sm font-bold tracking-wide" style={{ color: '#ffffff' }}>
              {t('viewer3d.loading')}
            </p>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{loadProgress}% Downloaded</p>
          </div>
        </div>
      )}

      {/* BOTTOM CONTROL DOCK */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between flex-wrap gap-3 pointer-events-none">
        {/* CAMERA PRESETS */}
        <div
          className="flex items-center gap-1.5 p-2 rounded-2xl overflow-x-auto no-scrollbar font-mono text-xs shadow-2xl pointer-events-auto"
          style={{
            backgroundColor: 'rgba(10, 12, 20, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff'
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 shrink-0" style={{ color: '#94a3b8' }}>
            {t('viewer3d.cameraView')}
          </span>
          <button
            onClick={() => handleViewPreset('orbit')}
            className="px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            style={{
              backgroundColor: activeView === 'orbit' ? '#334155' : 'transparent',
              color: activeView === 'orbit' ? '#ffffff' : '#cbd5e1',
              border: activeView === 'orbit' ? '1px solid #64748b' : '1px solid transparent'
            }}
          >
            <Compass size={14} />
            <span>{t('viewer3d.orbit')}</span>
          </button>
          <button
            onClick={() => handleViewPreset('cockpit')}
            className="px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            style={{
              backgroundColor: activeView === 'cockpit' ? '#334155' : 'transparent',
              color: activeView === 'cockpit' ? '#ffffff' : '#cbd5e1',
              border: activeView === 'cockpit' ? '1px solid #64748b' : '1px solid transparent'
            }}
          >
            <Eye size={14} />
            <span>{t('viewer3d.cockpit')}</span>
          </button>
          <button
            onClick={() => handleViewPreset('front_wing')}
            className="px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            style={{
              backgroundColor: activeView === 'front_wing' ? '#334155' : 'transparent',
              color: activeView === 'front_wing' ? '#ffffff' : '#cbd5e1',
              border: activeView === 'front_wing' ? '1px solid #64748b' : '1px solid transparent'
            }}
          >
            <Zap size={14} />
            <span>{t('viewer3d.frontAero')}</span>
          </button>
          <button
            onClick={() => handleViewPreset('drs_rear')}
            className="px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            style={{
              backgroundColor: activeView === 'drs_rear' ? '#334155' : 'transparent',
              color: activeView === 'drs_rear' ? '#ffffff' : '#cbd5e1',
              border: activeView === 'drs_rear' ? '1px solid #64748b' : '1px solid transparent'
            }}
          >
            <Flame size={14} />
            <span>{t('viewer3d.rearDrs')}</span>
          </button>
          <button
            onClick={() => handleViewPreset('side')}
            className="px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            style={{
              backgroundColor: activeView === 'side' ? '#334155' : 'transparent',
              color: activeView === 'side' ? '#ffffff' : '#cbd5e1',
              border: activeView === 'side' ? '1px solid #64748b' : '1px solid transparent'
            }}
          >
            <Layers size={14} />
            <span>{t('viewer3d.sideAero')}</span>
          </button>
        </div>

        {/* TOGGLE BUTTONS */}
        <div
          className="flex items-center gap-2 p-2 rounded-2xl font-mono text-xs shadow-2xl pointer-events-auto"
          style={{
            backgroundColor: 'rgba(10, 12, 20, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff'
          }}
        >
          {/* Explicit Pause / Play Rotation Button */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className="px-4 py-1.5 rounded-xl font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-lg"
            style={{
              backgroundColor: autoRotate ? '#16a34a' : '#d97706',
              color: '#ffffff',
              border: autoRotate ? '1px solid #4ade80' : '1px solid #fcd34d'
            }}
            title={autoRotate ? t('viewer3d.pauseRotation') : t('viewer3d.playRotation')}
          >
            {autoRotate ? (
              <>
                <Pause size={14} />
                <span>{t('viewer3d.pauseRotation')}</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>{t('viewer3d.playRotation')}</span>
              </>
            )}
          </button>

          {/* Wireframe Mode */}
          <button
            onClick={() => setWireframe(!wireframe)}
            className="px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            style={{
              backgroundColor: wireframe ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
              color: wireframe ? '#00f0ff' : '#cbd5e1',
              border: wireframe ? '1px solid #00f0ff' : '1px solid transparent'
            }}
            title={t('viewer3d.wireframe')}
          >
            <Box size={14} />
            <span>{t('viewer3d.wireframe')}</span>
          </button>

          {/* Night / Track Lighting */}
          <button
            onClick={() => setNightMode(!nightMode)}
            className="p-2 rounded-xl transition-all cursor-pointer"
            style={{ color: '#cbd5e1' }}
            title="Toggle Lighting Atmosphere"
          >
            {nightMode ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}
