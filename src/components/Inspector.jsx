import * as THREE from 'three';
import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useDrag } from "react-use-gesture";
import { a, useSpring } from '@react-spring/three'

function Inspector({ responsiveness = 20, children }) {
  const { size } = useThree()
  const euler = useMemo(() => new THREE.Euler(), [])
  const [spring, set] = useSpring(() => ({
    rotation: [0, 0, 0],
  }))
  const bind = useDrag(({ delta: [dx, dy] }) => {
    euler.y += (dx / size.width) * responsiveness
    euler.x += (dy / size.width) * responsiveness
    euler.x = THREE.MathUtils.clamp(euler.x, -Math.PI / 2, Math.PI / 2)
    set({ rotation: euler.toArray().slice(0, 3) })
  })
  return (
    <a.group {...bind()} {...spring}>
      {children}
    </a.group>
  )
}

export default Inspector;
