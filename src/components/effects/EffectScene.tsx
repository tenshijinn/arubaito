import { useState, useEffect, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { EffectComposer } from "@react-three/postprocessing"
import { OrbitControls } from "@react-three/drei"
import { Vector2 } from "three"
import { AsciiEffect } from "./AsciiEffect"

export function EffectScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState(new Vector2(0, 0))
  const [resolution, setResolution] = useState(new Vector2(1920, 1080))

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = rect.height - (e.clientY - rect.top)
        setMousePos(new Vector2(x, y))
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("mousemove", handleMouseMove)

      const rect = container.getBoundingClientRect()
      setResolution(new Vector2(rect.width, rect.height))

      const handleResize = () => {
        const rect = container.getBoundingClientRect()
        setResolution(new Vector2(rect.width, rect.height))
      }
      window.addEventListener("resize", handleResize)

      return () => {
        container.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[1, 1, 1]} intensity={1} />

        {/* Rotating Torus */}
        <mesh rotation={[0.5, 0.5, 0]}>
          <torusGeometry args={[1.5, 0.5, 16, 100]} />
          <meshPhongMaterial color="#ed565a" />
        </mesh>

        {/* Rotating Cube */}
        <mesh position={[0, 0, -1]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhongMaterial color="#00ff00" />
        </mesh>

        <OrbitControls enableZoom={true} enablePan={false} autoRotate autoRotateSpeed={1} />

        {/* ASCII Effect with PostFX */}
        <EffectComposer>
          <AsciiEffect
            style="standard"
            cellSize={5}
            color={true}
            invert={false}
            resolution={resolution}
            mousePos={mousePos}
            postfx={{
              colorPalette: 1, // Green terminal style
              scanlineIntensity: 0.1,
              scanlineCount: 200,
              vignetteIntensity: 0.3,
              vignetteRadius: 0.8,
              mouseGlowEnabled: true,
              mouseGlowRadius: 200,
              mouseGlowIntensity: 0.5,
            }}
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
