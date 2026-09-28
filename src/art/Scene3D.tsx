import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import type { ResolvedColour } from "../lib/prompt/compose";
import type { BuilderState } from "../lib/prompt/state";
import { shotCamera } from "../lib/scene/camera";
import { REAL_HEIGHT, type Actor, type Vec3 } from "../lib/scene/model";
import type { Glyph, Pose } from "../lib/sketch/parse";

/**
 * The 3D view of the scene: simple mannequins and blocks you can orbit
 * around, select, and move / rotate / scale with gizmos. The shot camera
 * is shown as a frustum and can be looked through.
 */

export type GizmoMode = "translate" | "rotate" | "scale";

interface Props {
  state: BuilderState;
  colours: ResolvedColour[];
  keepColours: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onActorChange: (id: string, patch: Partial<Actor>) => void;
  mode: GizmoMode;
  onMode: (m: GizmoMode) => void;
  /** Bumped by the parent to snap the view to the shot camera. */
  lookThroughShot: number;
}

interface Pal {
  bg: string;
  primary: string;
  secondary: string;
  accent: string;
}

const deg = THREE.MathUtils.degToRad;

// ——— Mesh building ———

function mat(color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, flatShading: true, ...extra });
}

/** A cylinder from a to b (a limb). */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material): THREE.Mesh {
  const len = a.distanceTo(b);
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(len - r * 2, 0.001), 4, 8), m);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return mesh;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Joint positions for a 1.75 m figure in each pose. Front is +z. */
function skeleton(pose: Pose) {
  switch (pose) {
    case "walk":
      return { head: V(0, 1.62, 0.02), neck: V(0, 1.45, 0), hip: V(0, 0.95, 0), hands: [V(-0.22, 0.9, -0.2), V(0.22, 0.9, 0.22)], feet: [V(-0.1, 0, 0.32), V(0.1, 0, -0.3)], knees: [V(-0.1, 0.5, 0.16), V(0.1, 0.48, -0.1)], elbows: [V(-0.23, 1.15, -0.1), V(0.23, 1.15, 0.12)] };
    case "run":
      return { head: V(0, 1.55, 0.22), neck: V(0, 1.4, 0.16), hip: V(0, 0.92, 0), hands: [V(-0.22, 1.2, 0.3), V(0.22, 1.05, -0.2)], feet: [V(-0.1, 0.25, -0.45), V(0.1, 0, 0.35)], knees: [V(-0.1, 0.5, -0.12), V(0.1, 0.55, 0.3)], elbows: [V(-0.25, 1.1, 0.05), V(0.25, 1.15, -0.15)] };
    case "dance":
      return { head: V(0, 1.62, 0), neck: V(0, 1.45, 0), hip: V(0, 0.95, 0), hands: [V(-0.42, 1.95, 0), V(0.5, 1.55, 0.1)], feet: [V(-0.15, 0, 0), V(0.18, 0.35, 0.15)], knees: [V(-0.12, 0.5, 0), V(0.22, 0.6, 0.25)], elbows: [V(-0.35, 1.7, 0), V(0.4, 1.45, 0.05)] };
    case "sit":
      return { head: V(0, 1.2, 0), neck: V(0, 1.04, 0), hip: V(0, 0.5, 0), hands: [V(-0.2, 0.6, 0.35), V(0.2, 0.6, 0.35)], feet: [V(-0.12, 0, 0.45), V(0.12, 0, 0.45)], knees: [V(-0.12, 0.5, 0.45), V(0.12, 0.5, 0.45)], elbows: [V(-0.22, 0.78, 0.12), V(0.22, 0.78, 0.12)] };
    case "lie":
      return { head: V(-0.8, 0.12, 0), neck: V(-0.63, 0.1, 0), hip: V(-0.1, 0.1, 0), hands: [V(-0.15, 0.08, -0.3), V(-0.15, 0.08, 0.3)], feet: [V(0.85, 0.08, -0.12), V(0.85, 0.08, 0.12)], knees: [V(0.38, 0.1, -0.12), V(0.38, 0.1, 0.12)], elbows: [V(-0.4, 0.08, -0.28), V(-0.4, 0.08, 0.28)] };
    default:
      return { head: V(0, 1.62, 0), neck: V(0, 1.45, 0), hip: V(0, 0.95, 0), hands: [V(-0.28, 0.85, 0.04), V(0.28, 0.85, 0.04)], feet: [V(-0.12, 0, 0), V(0.12, 0, 0)], knees: [V(-0.11, 0.5, 0.03), V(0.11, 0.5, 0.03)], elbows: [V(-0.26, 1.15, 0), V(0.26, 1.15, 0)] };
  }
}

function mannequin(pose: Pose, body: THREE.Material, head: THREE.Material, robot: boolean): THREE.Group {
  const g = new THREE.Group();
  const s = skeleton(pose);
  const shoulderW = 0.2;
  const across = pose === "lie" ? V(0, 0, 1) : V(1, 0, 0);
  const shoulders = [s.neck.clone().addScaledVector(across, -shoulderW).add(V(0, -0.04, 0)), s.neck.clone().addScaledVector(across, shoulderW).add(V(0, -0.04, 0))];
  const hips = [s.hip.clone().addScaledVector(across, -0.1), s.hip.clone().addScaledVector(across, 0.1)];
  if (robot) {
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.26), body);
    torso.position.copy(s.neck).add(s.hip).multiplyScalar(0.5);
    torso.quaternion.setFromUnitVectors(V(0, 1, 0), s.neck.clone().sub(s.hip).normalize());
    g.add(torso);
  } else {
    g.add(limb(s.hip, s.neck, 0.13, body));
  }
  g.add(limb(shoulders[0]!, shoulders[1]!, 0.05, body));
  for (let i = 0; i < 2; i++) {
    g.add(limb(shoulders[i]!, s.elbows[i]!, 0.045, body), limb(s.elbows[i]!, s.hands[i]!, 0.04, body));
    g.add(limb(hips[i]!, s.knees[i]!, 0.06, body), limb(s.knees[i]!, s.feet[i]!, 0.05, body));
  }
  const headMesh = robot ? new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), head) : new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), head);
  headMesh.position.copy(s.head);
  g.add(headMesh);
  // A nose shows which way the figure faces.
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 6), body);
  nose.position.copy(s.head).add(pose === "lie" ? V(0, 0.12, 0) : V(0, 0, 0.13));
  nose.rotation.x = pose === "lie" ? 0 : Math.PI / 2;
  g.add(nose);
  return g;
}

function box(w: number, h: number, d: number, m: THREE.Material, x = 0, y = h / 2, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  return mesh;
}
function cyl(rt: number, rb: number, h: number, m: THREE.Material, x = 0, y = h / 2, z = 0, seg = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.position.set(x, y, z);
  return mesh;
}
function cone(r: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 16) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), m);
  mesh.position.set(x, y + h / 2, z);
  return mesh;
}
function ball(r: number, m: THREE.Material, x = 0, y = r, z = 0) {
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), m);
  mesh.position.set(x, y, z);
  return mesh;
}

/** One subject, built at real size. Vehicles and animals point along +z. */
function buildOne(glyph: Glyph, pose: Pose, p: Pal, main: boolean): THREE.Object3D {
  const body = mat(p.secondary);
  const hi = mat(main ? p.accent : p.primary);
  const ink = mat("#2A2A2A");
  const glow = (c: string) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.2 });
  const g = new THREE.Group();
  switch (glyph) {
    case "person":
    case "robot":
      return mannequin(pose, body, hi, glyph === "robot");
    case "child": {
      const m = mannequin(pose, body, hi, false);
      m.scale.setScalar(1.2 / 1.75);
      return m;
    }
    case "animal":
    case "big-animal": {
      const k = glyph === "big-animal" ? 2.4 : 1;
      const legH = 0.3 * k;
      g.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.14 * k, 0.45 * k, 4, 8), hi));
      g.children[0]!.rotation.x = Math.PI / 2;
      g.children[0]!.position.set(0, legH + 0.12 * k, 0);
      for (const [x, z] of [[-0.1, 0.25], [0.1, 0.25], [-0.1, -0.25], [0.1, -0.25]] as const) g.add(cyl(0.035 * k, 0.03 * k, legH + 0.05 * k, body, x * k, (legH + 0.05 * k) / 2, z * k, 6));
      g.add(ball(0.12 * k, hi, 0, legH + 0.3 * k, 0.42 * k));
      return g;
    }
    case "bird": {
      g.add(ball(0.06, hi, 0, 0.15));
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.35, 3), body);
      wing.rotation.z = Math.PI / 2;
      wing.position.set(0.18, 0.15, 0);
      const w2 = wing.clone();
      w2.rotation.z = -Math.PI / 2;
      w2.position.x = -0.18;
      g.add(wing, w2);
      return g;
    }
    case "fish": {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), hi);
      f.scale.set(0.5, 0.8, 2.2);
      f.position.y = 0.25;
      g.add(f, cone(0.2, 0.25, body, 0, 0.12, -0.6, 3));
      return g;
    }
    case "car":
      g.add(box(1.8, 0.7, 4.2, hi, 0, 0.55), box(1.6, 0.55, 2.2, body, 0, 1.15, -0.2));
      for (const [x, z] of [[-0.85, 1.3], [0.85, 1.3], [-0.85, -1.3], [0.85, -1.3]] as const) {
        const w = cyl(0.35, 0.35, 0.25, ink, x, 0.35, z, 12);
        w.rotation.z = Math.PI / 2;
        g.add(w);
      }
      return g;
    case "bike":
      for (const z of [-0.55, 0.55]) {
        const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.03, 6, 20), ink);
        w.rotation.y = Math.PI / 2;
        w.position.set(0, 0.35, z);
        g.add(w);
      }
      g.add(limb(V(0, 0.35, -0.55), V(0, 0.9, 0.1), 0.025, hi), limb(V(0, 0.9, -0.2), V(0, 0.9, 0.45), 0.025, hi), limb(V(0, 0.9, 0.45), V(0, 0.35, 0.55), 0.025, hi));
      return g;
    case "boat":
      g.add(box(1.6, 0.8, 4.5, hi, 0, 0.4), cyl(0.05, 0.05, 3, ink, 0, 2.2, 0.2, 6));
      g.add(new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.4, 3), body));
      g.children[g.children.length - 1]!.position.set(0, 2.2, -0.4);
      return g;
    case "train":
      g.add(box(3, 3.2, 16, hi, 0, 1.9));
      for (const z of [-6, -2, 2, 6]) g.add(box(3.05, 0.8, 1.5, glow("#FFE9B0"), 0, 2.4, z));
      return g;
    case "plane":
      g.add(new THREE.Mesh(new THREE.CapsuleGeometry(1, 10, 4, 12), hi), box(24, 0.3, 3, body, 0, 0, 0));
      g.children[0]!.rotation.x = Math.PI / 2;
      return g;
    case "house":
      g.add(box(6, 4, 6, body), cone(5, 2.4, hi, 0, 4, 0, 4));
      g.children[1]!.rotation.y = Math.PI / 4;
      g.add(box(1, 2, 0.1, ink, 0, 1, 3.02));
      return g;
    case "tower":
      g.add(cyl(3, 3.4, 16, body), cone(4, 5, hi, 0, 16));
      return g;
    case "lighthouse":
      g.add(cyl(2.2, 3.6, 20, mat("#EDEDED")), cyl(2.9, 3.1, 2.5, hi, 0, 9), cyl(2, 2, 2, glow(p.accent), 0, 21), cone(2.4, 2, ink, 0, 22));
      return g;
    case "castle":
      g.add(box(18, 10, 8, body));
      for (const x of [-9, 9]) g.add(cyl(2.6, 2.6, 15, body, x), cone(3.2, 4, hi, x, 15));
      g.add(box(3, 5, 0.3, ink, 0, 2.5, 4.05));
      return g;
    case "city":
      [[-30, 18, 6], [-18, 32, -4], [-6, 24, 3], [6, 40, -6], [18, 28, 2], [30, 20, -3]].forEach(([x, h, z]) => g.add(box(9, h!, 9, x! % 12 === 0 ? hi : body, x!, h! / 2, z!)));
      return g;
    case "tree":
      g.add(cyl(0.25, 0.35, 3, mat("#6B4A2E")), ball(2.2, hi, 0, 4.2));
      return g;
    case "palm": {
      g.add(cyl(0.2, 0.3, 7.5, mat("#8A6A45")));
      for (let i = 0; i < 6; i++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.4, 3.2, 3), hi);
        leaf.position.set(Math.cos((i / 6) * Math.PI * 2) * 1.4, 7.3, Math.sin((i / 6) * Math.PI * 2) * 1.4);
        leaf.lookAt(leaf.position.x * 3, 6, leaf.position.z * 3);
        leaf.rotateX(Math.PI / 2);
        g.add(leaf);
      }
      return g;
    }
    case "flower":
      g.add(cyl(0.01, 0.01, 0.4, mat("#3C6B35"), 0, 0.2, 0, 6), ball(0.06, glow(p.accent), 0, 0.42));
      return g;
    case "mountain":
      g.add(cone(340, 300, body, 0, 0, 0, 7), cone(90, 80, mat("#F2F2F2"), 0, 220, 0, 7));
      return g;
    case "hill": {
      const h = new THREE.Mesh(new THREE.SphereGeometry(75, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), hi);
      h.scale.y = 0.4;
      g.add(h);
      return g;
    }
    case "window":
      g.add(box(0.9, 1.5, 0.08, glow("#CFE6FF")), box(1, 0.06, 0.1, ink, 0, 0.75), box(0.06, 1.5, 0.1, ink, 0, 0.75));
      return g;
    case "door":
      g.add(box(1.1, 2.2, 0.12, hi));
      return g;
    case "sun":
      g.add(ball(30, glow(p.accent), 0, 30));
      return g;
    case "moon":
      g.add(ball(25, glow("#F2EBD3"), 0, 25));
      return g;
    case "star":
      g.add(new THREE.Mesh(new THREE.OctahedronGeometry(4), glow("#FFFFFF")));
      return g;
    case "planet": {
      g.add(ball(28, hi, 0, 30));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(48, 3, 4, 40), body);
      ring.rotation.x = deg(70);
      ring.position.y = 30;
      g.add(ring);
      return g;
    }
    case "cloud":
      [[-10, 8, 0, 9], [0, 11, 2, 12], [11, 8, -1, 9]].forEach(([x, y, z, r]) => g.add(ball(r!, mat("#FFFFFF"), x!, y!, z!)));
      return g;
    case "table":
      g.add(box(1.6, 0.06, 0.9, hi, 0, 0.72));
      for (const [x, z] of [[-0.72, -0.38], [0.72, -0.38], [-0.72, 0.38], [0.72, 0.38]] as const) g.add(box(0.06, 0.72, 0.06, body, x, 0.36, z));
      return g;
    case "chair":
      g.add(box(0.48, 0.05, 0.46, hi, 0, 0.46), box(0.48, 0.5, 0.05, hi, 0, 0.72, -0.21));
      for (const [x, z] of [[-0.21, -0.2], [0.21, -0.2], [-0.21, 0.2], [0.21, 0.2]] as const) g.add(box(0.04, 0.46, 0.04, body, x, 0.23, z));
      return g;
    case "bed":
      g.add(box(1.5, 0.45, 2.1, body, 0, 0.25), box(1.5, 0.15, 0.5, mat("#FFFFFF"), 0, 0.55, -0.75), box(1.6, 1, 0.08, hi, 0, 0.5, -1.05));
      return g;
    case "lamp":
      g.add(cyl(0.02, 0.02, 1.35, ink, 0, 0.675, 0, 6), cone(0.22, 0.3, glow("#FFD98A"), 0, 1.3), cyl(0.15, 0.15, 0.03, ink, 0, 0.015));
      return g;
    case "book":
      g.add(box(0.17, 0.24, 0.04, hi));
      return g;
    case "cup":
      g.add(cyl(0.045, 0.04, 0.11, hi));
      return g;
    case "candle":
      g.add(cyl(0.03, 0.03, 0.18, mat("#F4EEDC")), cone(0.018, 0.06, glow("#FFB347"), 0, 0.19, 0, 8));
      return g;
    case "sword":
      g.add(box(0.05, 0.8, 0.01, mat("#CFD6DC"), 0, 0.6), box(0.22, 0.03, 0.04, ink, 0, 0.2), box(0.03, 0.2, 0.03, ink, 0, 0.1));
      return g;
    case "guitar":
      g.add(ball(0.2, hi, 0, 0.22), ball(0.15, hi, 0, 0.45), box(0.05, 0.5, 0.03, ink, 0, 0.8));
      return g;
    case "device":
      g.add(box(0.075, 0.155, 0.01, ink));
      return g;
    case "bottle":
      g.add(cyl(0.04, 0.04, 0.2, hi), cyl(0.015, 0.03, 0.1, hi, 0, 0.25));
      return g;
    default: {
      // Anything unknown: a translucent placeholder block with edges.
      const b = box(1, 1, 1, new THREE.MeshStandardMaterial({ color: p.accent, transparent: true, opacity: 0.45 }));
      g.add(b);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: "#222" }));
      edges.position.y = 0.5;
      g.add(edges);
      return g;
    }
  }
}

/** Default forward direction of each model: people face +z; vehicles/animals are built along +z too. */
function buildActor(a: Actor, p: Pal, main: boolean): THREE.Group {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  const width = Math.max(REAL_HEIGHT[a.glyph] * 0.6, 0.5);
  for (let k = 0; k < a.count; k++) {
    const one = buildOne(a.glyph, a.pose, p, main && k === 0);
    one.position.x = (k - (a.count - 1) / 2) * width * 1.3;
    inner.add(one);
  }
  root.add(inner);
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  // An invisible box around the subject, so a click anywhere on it selects it (limbs are thin targets).
  const bounds = new THREE.Box3().setFromObject(inner);
  const size = bounds.getSize(new THREE.Vector3()).multiplyScalar(1.15).max(new THREE.Vector3(0.3, 0.3, 0.3));
  const hit = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  bounds.getCenter(hit.position);
  root.add(hit);
  const tag = document.createElement("div");
  tag.textContent = a.label;
  tag.className = "meta pointer-events-none rounded-[2px] bg-paper/85 px-1 text-ink";
  const label = new CSS2DObject(tag);
  label.position.set(0, REAL_HEIGHT[a.glyph] * (a.pose === "lie" ? 0.3 : 1) + 0.15 * REAL_HEIGHT[a.glyph], 0);
  root.add(label);
  root.userData = { id: a.id, key: `${a.glyph}|${a.pose}|${a.count}|${a.label}|${main}` };
  return root;
}

function place(o: THREE.Object3D, a: Actor) {
  o.position.set(...a.position);
  o.rotation.set(deg(a.rotation[0]), deg(a.rotation[1]), deg(a.rotation[2]), "YXZ");
  o.scale.setScalar(a.scale);
}

function applyLighting(scene: THREE.Scene, lighting: BuilderState["lighting"], p: Pal) {
  scene.children.filter((c) => c.userData.light).forEach((c) => scene.remove(c));
  const add = (l: THREE.Light) => {
    l.userData.light = true;
    scene.add(l);
    return l;
  };
  const sun = (color: string, intensity: number, pos: Vec3) => {
    const d = add(new THREE.DirectionalLight(color, intensity)) as THREE.DirectionalLight;
    d.position.set(...pos);
    d.castShadow = true;
    d.shadow.mapSize.set(1024, 1024);
    Object.assign(d.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, far: 200 });
    return d;
  };
  switch (lighting) {
    case "golden-hour":
      add(new THREE.HemisphereLight("#FFD2A0", "#402818", 0.8));
      sun("#FFB066", 2.4, [-30, 6, -10]);
      break;
    case "night":
      add(new THREE.HemisphereLight("#2A3A7A", "#05060F", 0.35));
      sun("#9DB4FF", 0.6, [10, 30, -20]);
      break;
    case "candlelight": {
      add(new THREE.HemisphereLight("#3A2410", "#050300", 0.2));
      const c = add(new THREE.PointLight("#FFB25A", 8, 12, 1.5));
      c.position.set(0.6, 1.2, 0.8);
      break;
    }
    case "hard-flash":
      add(new THREE.AmbientLight("#FFFFFF", 0.15));
      sun("#FFFFFF", 3, [0, 3, 12]);
      break;
    case "backlit":
      add(new THREE.HemisphereLight("#FFF1C9", "#1A1512", 0.4));
      sun("#FFF1C9", 3, [0, 6, -25]);
      break;
    case "studio":
      add(new THREE.HemisphereLight("#FFFFFF", "#888888", 0.9));
      sun("#FFFFFF", 1.4, [-6, 8, 8]);
      sun("#FFFFFF", 0.8, [7, 5, 6]);
      break;
    case "overcast":
      add(new THREE.HemisphereLight("#D6DCE4", "#6B7179", 1.4));
      break;
    default:
      add(new THREE.HemisphereLight("#FFFFFF", p.secondary, 1));
      sun("#FFFFFF", 1.8, [8, 14, 10]);
  }
}

export default function Scene3D({ state, colours, keepColours, selectedId, onSelect, onActorChange, mode, onMode, lookThroughShot }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    labels: CSS2DRenderer;
    orbit: OrbitControls;
    gizmo: TransformControls;
    shotCam: THREE.PerspectiveCamera;
    shotHelper: THREE.CameraHelper;
    ground: THREE.Mesh;
    objects: Map<string, THREE.Group>;
    render: () => void;
  } | null>(null);
  const handlers = useRef({ onSelect, onActorChange, onMode });
  handlers.current = { onSelect, onActorChange, onMode };
  const [failed, setFailed] = useState(false);

  const byRole = (role: string, i: number) => (colours.find((c) => c.role === role) ?? colours[i % colours.length])!.hex;
  const pal: Pal = keepColours
    ? { bg: "#D9D6CF", primary: "#8A8780", secondary: "#B8B4AB", accent: "#5C5A55" }
    : { bg: byRole("background", 0), primary: byRole("primary", 1), secondary: byRole("secondary", 2), accent: byRole("accent", 3) };

  // Set up once.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    el.appendChild(renderer.domElement);
    const labels = new CSS2DRenderer();
    labels.domElement.style.position = "absolute";
    labels.domElement.style.inset = "0";
    labels.domElement.style.pointerEvents = "none";
    el.appendChild(labels.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 5000);
    camera.position.set(6, 4, 9);
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.target.set(0, 0.9, 0);
    orbit.enableDamping = false;

    const ground = new THREE.Mesh(new THREE.CircleGeometry(400, 64), new THREE.MeshStandardMaterial({ color: "#888", roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData.ground = true;
    scene.add(ground);
    const grid = new THREE.GridHelper(40, 40, 0x000000, 0x000000);
    (grid.material as THREE.Material).opacity = 0.12;
    (grid.material as THREE.Material).transparent = true;
    grid.position.y = 0.002;
    scene.add(grid);

    const shotCam = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
    const shotHelper = new THREE.CameraHelper(shotCam);
    scene.add(shotHelper);

    const gizmo = new TransformControls(camera, renderer.domElement);
    gizmo.setSize(0.8);
    scene.add(gizmo.getHelper());

    const objects = new Map<string, THREE.Group>();
    const render = () => {
      renderer.render(scene, camera);
      labels.render(scene, camera);
    };
    api.current = { scene, camera, renderer, labels, orbit, gizmo, shotCam, shotHelper, ground, objects, render };

    orbit.addEventListener("change", render);
    gizmo.addEventListener("change", render);
    gizmo.addEventListener("dragging-changed", (e) => {
      orbit.enabled = !e.value;
    });
    gizmo.addEventListener("objectChange", () => {
      const o = gizmo.object;
      if (!o) return;
      const r = new THREE.Euler().setFromQuaternion(o.quaternion, "YXZ");
      const round = (v: number, d = 100) => Math.round(v * d) / d;
      handlers.current.onActorChange(o.userData.id as string, {
        position: [round(o.position.x), round(Math.max(o.position.y, -50)), round(o.position.z)],
        rotation: [round(THREE.MathUtils.radToDeg(r.x), 10), round(THREE.MathUtils.radToDeg(r.y), 10), round(THREE.MathUtils.radToDeg(r.z), 10)],
        scale: round(Math.max(0.05, (o.scale.x + o.scale.y + o.scale.z) / 3)),
      });
    });

    // Click (not drag) selects; clicking empty space deselects.
    const ray = new THREE.Raycaster();
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4 || gizmo.dragging) return;
      const rect = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), camera);
      const hit = ray.intersectObjects([...objects.values()], true)[0];
      let o: THREE.Object3D | null = hit?.object ?? null;
      while (o && !o.userData.id) o = o.parent;
      handlers.current.onSelect((o?.userData.id as string) ?? null);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea, select")) return;
      const k = e.key.toLowerCase();
      if (k === "w") handlers.current.onMode("translate");
      else if (k === "e") handlers.current.onMode("rotate");
      else if (k === "r") handlers.current.onMode("scale");
    };
    window.addEventListener("keydown", onKey);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h);
      labels.setSize(w, h);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      render();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    return () => {
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
      gizmo.detach();
      gizmo.dispose();
      orbit.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mt = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mt) ? mt : mt ? [mt] : []).forEach((x) => x.dispose());
      });
      renderer.dispose();
      el.innerHTML = "";
      api.current = null;
    };
  }, []);

  // Sync the scene with the builder state.
  const shot = shotCamera(state);
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    a.scene.background = new THREE.Color(pal.bg);
    (a.ground.material as THREE.MeshStandardMaterial).color.set(pal.primary).lerp(new THREE.Color(pal.bg), 0.55);
    applyLighting(a.scene, state.lighting, pal);

    const frontId = [...state.actors].sort((x, y) => Math.hypot(...x.position.map((v, i) => v - shot.eye[i]!)) - Math.hypot(...y.position.map((v, i) => v - shot.eye[i]!)))[0]?.id;
    const seen = new Set<string>();
    state.actors.forEach((actor) => {
      seen.add(actor.id);
      const key = `${actor.glyph}|${actor.pose}|${actor.count}|${actor.label}|${actor.id === frontId}|${pal.primary}${pal.secondary}${pal.accent}`;
      let o = a.objects.get(actor.id);
      if (!o || o.userData.key !== key) {
        if (o) {
          if (a.gizmo.object === o) a.gizmo.detach();
          a.scene.remove(o);
          o.traverse((c) => c instanceof CSS2DObject && c.element.remove());
        }
        o = buildActor(actor, pal, actor.id === frontId);
        o.userData.key = key;
        a.objects.set(actor.id, o);
        a.scene.add(o);
      }
      if (a.gizmo.object !== o || !a.gizmo.dragging) place(o, actor);
    });
    for (const [id, o] of a.objects) {
      if (!seen.has(id)) {
        if (a.gizmo.object === o) a.gizmo.detach();
        a.scene.remove(o);
        o.traverse((c) => c instanceof CSS2DObject && c.element.remove());
        a.objects.delete(id);
      }
    }

    // The shot camera, drawn as a frustum.
    a.shotCam.position.set(...shot.eye);
    a.shotCam.up.set(...shot.up);
    a.shotCam.lookAt(...shot.target);
    a.shotCam.fov = shot.fov;
    a.shotCam.aspect = shot.aspect;
    // Draw the frustum just past the subject so it doesn't sweep across the view.
    a.shotCam.far = Math.hypot(...shot.eye.map((v, i) => v - shot.target[i]!)) * 1.4 + 1;
    a.shotCam.updateProjectionMatrix();
    a.shotHelper.update();

    const sel = selectedId ? a.objects.get(selectedId) : undefined;
    if (sel) {
      if (a.gizmo.object !== sel) a.gizmo.attach(sel);
    } else a.gizmo.detach();
    a.gizmo.setMode(mode);
    a.render();
  });

  // Start from a three-quarter view above and beside the shot camera, looking at the set.
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const back: Vec3 = [shot.eye[0] - shot.target[0], shot.eye[1] - shot.target[1], shot.eye[2] - shot.target[2]];
    const dist = Math.max(Math.hypot(...back), 3) * 1.6;
    const turn = deg(40);
    a.camera.position.set(shot.target[0] + Math.sin(turn) * dist, shot.target[1] + dist * 0.45, shot.target[2] + Math.cos(turn) * dist);
    a.orbit.target.set(...shot.target);
    a.orbit.update();
    a.render();
  }, []); // once, when the 3D view opens

  // Snap the viewport to the shot camera on request.
  useEffect(() => {
    const a = api.current;
    if (!a || !lookThroughShot) return;
    a.camera.position.set(...shot.eye);
    a.camera.up.set(...shot.up);
    a.camera.fov = shot.fov;
    a.camera.updateProjectionMatrix();
    a.orbit.target.set(...shot.target);
    a.orbit.update();
    a.camera.up.set(0, 1, 0);
    a.render();
  }, [lookThroughShot]); // only when asked; the shot itself is read at that moment

  if (failed) return <p className="p-6 text-center text-muted">3D preview needs WebGL, which this browser has turned off. The 2D preview still works.</p>;
  return <div ref={host} className="relative h-full w-full touch-none select-none" aria-label="3D scene preview. Drag to orbit, scroll to zoom, click a subject to select it." role="application" />;
}
