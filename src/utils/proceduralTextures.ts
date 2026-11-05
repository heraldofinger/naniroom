/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { FloorFinish } from '../types/bedroom';

// Cache generated textures to avoid regenerating identical canvases
const textureCache = new Map<string, THREE.CanvasTexture>();

export function getProceduralFloorTexture(type: FloorFinish, maxAnisotropy = 4): THREE.CanvasTexture {
  if (textureCache.has(type)) {
    return textureCache.get(type)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (type === 'light-oak' || type === 'dark-walnut') {
    const isDark = type === 'dark-walnut';
    const baseColor = isDark ? '#4A3428' : '#D6C0A6';
    const plankColors = isDark 
      ? ['#4A3428', '#3F2C21', '#533B2E', '#463125'] 
      : ['#D9C3A9', '#CEB79B', '#DFCAB2', '#C6AF93'];
    
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    const plankCount = 8;
    const plankHeight = 512 / plankCount;
    const segments = 4;
    const segmentWidth = 512 / segments;

    for (let i = 0; i < plankCount; i++) {
      const y = i * plankHeight;
      const xOffset = (i % 2) * (segmentWidth / 2);

      for (let j = -1; j <= segments; j++) {
        const x = j * segmentWidth + xOffset;
        const color = plankColors[(i * 3 + j + 10) % plankColors.length];
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, segmentWidth - 2, plankHeight - 2);

        // Wood grain lines
        ctx.strokeStyle = isDark ? 'rgba(30, 20, 15, 0.25)' : 'rgba(150, 120, 90, 0.2)';
        ctx.lineWidth = 1;
        for (let g = 0; g < 4; g++) {
          const gy = y + 4 + g * (plankHeight / 4.5);
          ctx.beginPath();
          ctx.moveTo(x, gy);
          ctx.bezierCurveTo(
            x + segmentWidth * 0.3, gy + (Math.sin(i + g) * 3),
            x + segmentWidth * 0.7, gy - (Math.cos(j + g) * 3),
            x + segmentWidth, gy
          );
          ctx.stroke();
        }

        // Plank joint line
        ctx.strokeStyle = isDark ? '#261B14' : '#9E8870';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + segmentWidth, y);
        ctx.lineTo(x + segmentWidth, y + plankHeight);
        ctx.stroke();
      }

      // Horizontal groove between planks
      ctx.strokeStyle = isDark ? '#261B14' : '#9E8870';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y + plankHeight);
      ctx.lineTo(512, y + plankHeight);
      ctx.stroke();
    }
  } else if (type === 'herringbone') {
    ctx.fillStyle = '#C8B092';
    ctx.fillRect(0, 0, 512, 512);

    const stripWidth = 32;
    const stripLength = 128;
    const colors = ['#D4BEA2', '#C6AE90', '#DCBA9E', '#BDA385'];

    for (let y = -stripLength; y < 512 + stripLength; y += stripWidth * 2) {
      for (let x = -stripLength; x < 512 + stripLength; x += stripWidth * 2) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);

        ctx.fillStyle = colors[Math.abs(Math.floor((x + y) / 50)) % colors.length];
        ctx.fillRect(0, 0, stripWidth - 1, stripLength - 1);
        ctx.strokeStyle = '#8E7356';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, stripWidth, stripLength);

        ctx.restore();
      }
    }
  } else if (type === 'beige-travertine') {
    ctx.fillStyle = '#E6E0D4';
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 128;
    for (let y = 0; y < 512; y += tileSize) {
      for (let x = 0; x < 512; x += tileSize) {
        const shade = (Math.sin(x * 12 + y * 7) * 4);
        ctx.fillStyle = `rgb(${230 + shade}, ${224 + shade}, ${212 + shade})`;
        ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

        // Subtle limestone speckles
        for (let s = 0; s < 15; s++) {
          ctx.fillStyle = 'rgba(180, 170, 155, 0.15)';
          ctx.beginPath();
          ctx.arc(
            x + ((s * 23) % tileSize),
            y + ((s * 37) % tileSize),
            (s % 3) + 1,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Grout line
        ctx.strokeStyle = '#C9C2B4';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, tileSize, tileSize);
      }
    }
  } else if (type === 'concrete-gray') {
    ctx.fillStyle = '#D6D8DC';
    ctx.fillRect(0, 0, 512, 512);

    // Micro-mottling
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 20 + 5;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(140, 145, 155, 0.08)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // cozy-carpet
    ctx.fillStyle = '#E8E5DF';
    ctx.fillRect(0, 0, 512, 512);

    for (let y = 0; y < 512; y += 4) {
      for (let x = 0; x < 512; x += 4) {
        const noise = (Math.sin(x * 0.8) + Math.cos(y * 0.8)) * 8;
        ctx.fillStyle = `rgb(${232 + noise}, ${229 + noise}, ${223 + noise})`;
        ctx.fillRect(x, y, 3, 3);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;

  textureCache.set(type, texture);
  return texture;
}

export function createProceduralRugTexture(primaryHex: string, secondaryHex: string): THREE.CanvasTexture {
  const cacheKey = `rug-${primaryHex}-${secondaryHex}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = primaryHex;
  ctx.fillRect(0, 0, 512, 512);

  // Modern Scandinavian geometric lines
  ctx.strokeStyle = secondaryHex;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';

  const margin = 32;
  ctx.strokeRect(margin, margin, 512 - margin * 2, 512 - margin * 2);

  // Cross arches / diagonals
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(margin, margin);
  ctx.lineTo(256, 256);
  ctx.lineTo(512 - margin, margin);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(margin, 512 - margin);
  ctx.lineTo(256, 256);
  ctx.lineTo(512 - margin, 512 - margin);
  ctx.stroke();

  // Subtle woven fiber texture
  for (let i = 0; i < 512; i += 8) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    ctx.fillRect(0, i, 512, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

export function createWallArtTexture(primaryHex: string, secondaryHex: string): THREE.CanvasTexture {
  const cacheKey = `art-${primaryHex}-${secondaryHex}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  // Warm off-white canvas paper
  ctx.fillStyle = '#F4EFEB';
  ctx.fillRect(0, 0, 512, 360);

  // Abstract minimalist composition
  ctx.fillStyle = primaryHex;
  ctx.beginPath();
  ctx.arc(180, 180, 110, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = secondaryHex;
  ctx.beginPath();
  ctx.arc(320, 210, 85, 0, Math.PI * 2);
  ctx.fill();

  // Modern organic arch
  ctx.fillStyle = 'rgba(40, 40, 40, 0.85)';
  ctx.beginPath();
  ctx.moveTo(250, 360);
  ctx.lineTo(250, 140);
  ctx.arc(280, 140, 30, Math.PI, 0, false);
  ctx.lineTo(310, 360);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}
