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

interface RiskSphereProps {
  riskLevel: RiskLevel;
  // 允许从外部传入位置，默认值设为右下角建议坐标 [1.5, -1.2, 0]
  position?: [number, number, number];
}

export const RiskSphere: React.FC<RiskSphereProps> = ({
  riskLevel,
  position = [0.5, -0.2, 0], // 默认向右偏移 1.5，向下偏移 1.2
}) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const particlesCount = 2500;

  // 初始化粒子位置
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const phi = THREE.MathUtils.randFloat(0, Math.PI);
      // 球体半径设为 1.8，稍微收敛一点
      pos[i * 3] = 1.8 * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = 1.8 * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = 1.8 * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const isHigh = riskLevel === "high";
    const material = pointsRef.current.material as THREE.PointsMaterial;

    // 1. 基础位置同步：确保球体处于传入的 position
    // 不再使用 set(0,0,0)，而是使用解构后的坐标
    const [targetX, targetY, targetZ] = position;

    // 2. 旋转逻辑：高危时加速
    const rotSpeed = isHigh ? 0.05 : 0.005;
    pointsRef.current.rotation.y += rotSpeed;
    pointsRef.current.rotation.x += rotSpeed / 2;

    // 3. 颜色平滑过渡
    material.color.lerp(COLOR_MAP[riskLevel], 0.08);

    // 4. 震动逻辑改进：在 target 坐标基础上震动
    if (isHigh) {
      pointsRef.current.position.x = targetX + (Math.random() - 0.5) * 0.15;
      pointsRef.current.position.y = targetY + (Math.random() - 0.5) * 0.15;
      pointsRef.current.position.z = targetZ + (Math.random() - 0.5) * 0.1;
      material.size = THREE.MathUtils.lerp(material.size, 0.04, 0.1);
    } else {
      // 非高危状态，平滑回归目标位置
      pointsRef.current.position.x = THREE.MathUtils.lerp(
        pointsRef.current.position.x,
        targetX,
        0.1,
      );
      pointsRef.current.position.y = THREE.MathUtils.lerp(
        pointsRef.current.position.y,
        targetY,
        0.1,
      );
      pointsRef.current.position.z = THREE.MathUtils.lerp(
        pointsRef.current.position.z,
        targetZ,
        0.1,
      );
      material.size = THREE.MathUtils.lerp(material.size, 0.02, 0.1);
    }

    // 5. 呼吸脉冲
    const pulse =
      1 + Math.sin(state.clock.elapsedTime * (isHigh ? 15 : 2)) * 0.05;
    pointsRef.current.scale.set(pulse, pulse, pulse);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={particlesCount}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        transparent
        opacity={0.6} // 稍微降低透明度，增加幽灵感
        blending={THREE.AdditiveBlending}
        depthWrite={false} // 优化渲染性能，避免粒子遮挡闪烁
      />
    </points>
  );
};
