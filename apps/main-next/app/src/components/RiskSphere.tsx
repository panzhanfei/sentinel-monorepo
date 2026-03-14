"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RiskLevel } from "@/app/context";

const COLOR_MAP = {
  low: new THREE.Color("#00ff88"), // 绿色
  medium: new THREE.Color("#ffcc00"), // 黄色
  high: new THREE.Color("#ff0044"), // 红色
};

export const RiskSphere: React.FC<{ riskLevel: RiskLevel }> = ({
  riskLevel,
}) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const particlesCount = 2500;

  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const phi = THREE.MathUtils.randFloat(0, Math.PI);
      pos[i * 3] = 2 * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = 2 * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = 2 * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    const isHigh = riskLevel === "high";
    const material = pointsRef.current.material as THREE.PointsMaterial;

    // 1. 旋转逻辑：高危时疯狂旋转
    const rotSpeed = isHigh ? 0.05 : 0.005;
    pointsRef.current.rotation.y += rotSpeed;
    pointsRef.current.rotation.x += rotSpeed / 2;

    // 2. 颜色平滑过渡
    material.color.lerp(COLOR_MAP[riskLevel], 0.08);

    // 3. 高危震动与大小缩放
    if (isHigh) {
      pointsRef.current.position.x = (Math.random() - 0.5) * 0.15;
      pointsRef.current.position.y = (Math.random() - 0.5) * 0.15;
      material.size = THREE.MathUtils.lerp(material.size, 0.04, 0.1);
    } else {
      pointsRef.current.position.set(0, 0, 0);
      material.size = THREE.MathUtils.lerp(material.size, 0.02, 0.1);
    }

    // 4. 呼吸脉冲
    const pulse =
      1 + Math.sin(state.clock.elapsedTime * (isHigh ? 15 : 2)) * 0.05;
    pointsRef.current.scale.set(pulse, pulse, pulse);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]} // 解决 TS args 报错
          count={particlesCount}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
