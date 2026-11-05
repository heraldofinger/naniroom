/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WallSide = 'north' | 'south' | 'east' | 'west';

export type FloorFinish = 
  | 'light-oak'
  | 'dark-walnut'
  | 'herringbone'
  | 'beige-travertine'
  | 'concrete-gray'
  | 'cozy-carpet';

export type FurnitureCategory = 
  | 'beds'
  | 'wardrobes'
  | 'desks'
  | 'nightstands'
  | 'seating'
  | 'storage'
  | 'decor'
  | 'lighting';

export interface RoomDimensions {
  width: number;    // meters (X axis, West to East)
  length: number;   // meters (Z axis, North to South)
  height: number;   // meters (Y axis, Floor to Ceiling)
}

export interface WallOpening {
  id: string;
  type: 'door' | 'window';
  wall: WallSide;
  offset: number;   // distance from left edge of that wall (meters)
  width: number;    // width of the door/window (meters)
  height: number;   // height of opening (meters)
  sillHeight?: number; // window sill height above floor (meters)
  swing?: 'inward-left' | 'inward-right' | 'outward-left' | 'outward-right';
}

export interface RoomFinishes {
  wallColor: string;
  accentWallSide?: WallSide;
  accentWallColor?: string;
  floorType: FloorFinish;
  baseboardColor: string;
}

export interface FurnitureItem {
  id: string;
  catalogId: string;
  name: string;
  category: FurnitureCategory;
  x: number;         // X coordinate in meters (relative to room center, where 0,0 is center)
  z: number;         // Z coordinate in meters
  y: number;         // Y elevation from floor in meters (usually 0)
  width: number;     // Width (meters) along local X before rotation
  depth: number;     // Depth (meters) along local Z before rotation
  height: number;    // Height (meters)
  rotation: number;  // Rotation in degrees (0, 90, 180, 270 or arbitrary)
  color: string;     // Primary color/finish
  secondaryColor?: string; // Secondary color (e.g. bedding/cushion/metal)
  materialType?: string;
  locked?: boolean;
}

export interface CatalogItem {
  id: string;
  name: string;
  namePt: string;
  category: FurnitureCategory;
  defaultDimensions: {
    width: number;
    depth: number;
    height: number;
  };
  defaultColor: string;
  defaultSecondaryColor?: string;
  availableColors: { label: string; hex: string }[];
  descriptionPt: string;
  priceEstimate: number;
  clearanceNote: string;
  minClearanceFront?: number; // meters required in front (e.g. 0.8 for wardrobe)
  minClearanceSides?: number; // meters required on sides (e.g. 0.6 for bed)
}

export interface ErgonomicIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  itemId?: string;
}

export interface RoomPreset {
  id: string;
  name: string;
  subtitle: string;
  roomDimensions: RoomDimensions;
  finishes: RoomFinishes;
  openings: WallOpening[];
  furniture: FurnitureItem[];
}
