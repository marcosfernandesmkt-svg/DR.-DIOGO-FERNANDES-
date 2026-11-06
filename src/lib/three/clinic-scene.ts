import * as THREE from "three";
import gsap from "gsap";
import { Reflector } from "three/addons/objects/Reflector.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { MONOGRAM } from "@/lib/monogram";

const BRASS = 0xa98a55, WARM = 0xffdfb0, BLUE = 0x347cb5;

const seeded = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* Pedra natural em placas: mosqueado, veios finos e juntas. Sem baixar textura nenhuma. */
function stoneTexture(size: number, seed: number, plates: number, base: string) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = seeded(seed);
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 420; i++) {
    g.fillStyle = r() > 0.5 ? `rgba(255,245,230,${r() * 0.012})` : `rgba(0,0,0,${r() * 0.05})`;
    const s = 8 + r() * 90;
    g.beginPath();
    g.ellipse(r() * size, r() * size, s, s * (0.3 + r()), r() * 3, 0, 7);
    g.fill();
  }
  for (let i = 0; i < 16; i++) {
    g.strokeStyle = i % 3 ? `rgba(226,214,196,${0.05 + r() * 0.08})` : `rgba(198,166,103,${0.08 + r() * 0.08})`;
    g.lineWidth = 0.4 + r() * 1.1;
    g.beginPath();
    let x = r() * size, y = r() * size;
    g.moveTo(x, y);
    for (let s = 0; s < 9; s++) g.quadraticCurveTo(x + (r() - 0.5) * 50, y + (r() - 0.5) * 50, (x += (r() - 0.25) * 120), (y += (r() - 0.5) * 80));
    g.stroke();
  }
  g.strokeStyle = "rgba(0,0,0,.6)";
  g.lineWidth = 1.5;
  const step = size / plates;
  for (let i = 0; i <= plates; i++) {
    g.beginPath();
    g.moveTo(i * step, 0);
    g.lineTo(i * step, size);
    g.moveTo(0, i * step);
    g.lineTo(size, i * step);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* Ripas verticais de nogueira, para a parede da recepção. */
function slatTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const g = c.getContext("2d")!;
  const r = seeded(91);
  for (let x = 0; x < 1024; x += 16) {
    const v = 26 + r() * 12;
    g.fillStyle = `rgb(${v * 1.5},${v},${v * 0.62})`;
    g.fillRect(x, 0, 12, 256);
    g.fillStyle = "#050403";
    g.fillRect(x + 12, 0, 4, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function monogram(height: number, material: THREE.Material) {
  const paths = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${MONOGRAM.d}"/></svg>`).paths;
  const shapes = paths.flatMap((p) => SVGLoader.createShapes(p));
  const geo = new THREE.ExtrudeGeometry(shapes, { depth: 18, bevelEnabled: false });
  const mesh = new THREE.Mesh(geo, material);
  const s = height / MONOGRAM.height;
  mesh.scale.set(s, -s, s);
  mesh.position.x = -(MONOGRAM.width * s) / 2;
  mesh.position.y = height / 2;
  const group = new THREE.Group();
  group.add(mesh);
  return group;
}

const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
};

/* Esculturas: esqueletos de anéis hexagonais fundidos, como em hormônios e na glicose. */
const RING = 0.3;
const hexCenters: [number, number][][] = [
  [[0, 0]],
  [[-0.26, 0], [0.26, 0]],
  [[-0.52, -0.15], [0, 0.15], [0.52, -0.15]],
  [[-0.52, 0.15], [0, -0.15], [0.52, 0.15], [0.86, -0.3]],
];
function skeleton(centers: [number, number][]) {
  const nodes: THREE.Vector3[] = [];
  const edges = new Set<string>();
  const index = (x: number, y: number) => {
    const found = nodes.findIndex((n) => Math.hypot(n.x - x, n.y - y) < 0.05);
    if (found >= 0) return found;
    nodes.push(new THREE.Vector3(x, y, 0));
    return nodes.length - 1;
  };
  centers.forEach(([cx, cy]) => {
    const ring = Array.from({ length: 6 }, (_, i) => index(cx + Math.cos((i * Math.PI) / 3 + Math.PI / 6) * RING, cy + Math.sin((i * Math.PI) / 3 + Math.PI / 6) * RING));
    ring.forEach((a, i) => {
      const b = ring[(i + 1) % 6];
      edges.add(a < b ? `${a}-${b}` : `${b}-${a}`);
    });
  });
  return { nodes, edges: [...edges].map((e) => e.split("-").map(Number) as [number, number]) };
}

type Sculpture = { group: THREE.Group; material: THREE.MeshStandardMaterial; home: THREE.Vector3; seed: number; spin: number; scale: number; hit: THREE.Mesh };

export type ClinicScene = NonNullable<ReturnType<typeof createClinicScene>>;

/**
 * Ambiente ilustrativo: fachada, portas, recepção e seis esculturas, em geometria própria.
 * Retorna null se o WebGL não estiver disponível; quem chama cai na lista de clínicas.
 */
export function createClinicScene(canvas: HTMLCanvasElement, options: { mobile: boolean; count: number; onHover: (i: number | null) => void; onPick: (i: number) => void; onLabels?: (points: { x: number; y: number }[]) => void }) {
  const { mobile, count } = options;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping; // sem o aspecto saturado de render de demonstração
  renderer.toneMappingExposure = 1.5;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060708);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.05).texture;
  scene.environment = envTexture;
  scene.environmentIntensity = 0.1;

  const camera = new THREE.PerspectiveCamera(mobile ? 56 : 38, 1, 0.1, 60);
  camera.position.set(0, 1.5, 11);

  /* Tudo que é arquitetura fica aqui, para sair de cena ao entrar no campo celular */
  const room = new THREE.Group();
  scene.add(room);

  /* Materiais */
  const textures: THREE.Texture[] = [];
  const tex = (t: THREE.Texture, x: number, y: number) => {
    t.repeat.set(x, y);
    textures.push(t);
    return t;
  };
  const facadeStone = new THREE.MeshStandardMaterial({ map: tex(stoneTexture(mobile ? 512 : 768, 7, 2, "#26262a"), 2.2, 1), roughness: 0.46, metalness: 0 });
  const hallStone = new THREE.MeshStandardMaterial({ map: tex(stoneTexture(mobile ? 512 : 768, 23, 2, "#2c2a29"), 3.4, 0.9), roughness: 0.52, metalness: 0 });
  const slat = new THREE.MeshStandardMaterial({ map: tex(slatTexture(), 3, 1), roughness: 0.62 });
  const ceiling = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.92 });
  const desk = new THREE.MeshStandardMaterial({ map: tex(stoneTexture(512, 41, 1, "#3a3733"), 1.4, 0.4), roughness: 0.3 });
  const bronze = new THREE.MeshStandardMaterial({ color: BRASS, metalness: 1, roughness: 0.42 });
  const signMat = new THREE.MeshStandardMaterial({ color: BRASS, metalness: 1, roughness: 0.34, emissive: WARM, emissiveIntensity: 0.02 });
  const cove = new THREE.MeshBasicMaterial({ color: new THREE.Color(WARM).multiplyScalar(0.9) });
  const blueCove = new THREE.MeshBasicMaterial({ color: new THREE.Color(BLUE).multiplyScalar(0.55) });

  /* Piso: reflexo real e controlado no desktop; no celular, só o polimento */
  let reflector: Reflector | null = null;
  if (!mobile) {
    reflector = new Reflector(new THREE.PlaneGeometry(40, 60), { textureWidth: 1024, textureHeight: 1024, color: 0x4a4c50, clipBias: 0.002 });
    reflector.rotation.x = -Math.PI / 2;
    reflector.position.set(0, -0.003, -6);
    room.add(reflector);
  }
  const floorMap = tex(stoneTexture(mobile ? 512 : 768, 59, 2, "#1d1d1f"), 9, 13);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 60), new THREE.MeshStandardMaterial({ map: floorMap, roughness: 0.36, transparent: !mobile, opacity: mobile ? 1 : 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -6);
  room.add(floor);

  /* Fachada: pé-direito alto, vão estreito e marquise baixa, como arquitetura real */
  const H = 5.4, gap = 1.1, doorH = 2.8;
  room.add(box(9, H, 0.5, facadeStone, -(gap + 4.5), H / 2, 0), box(9, H, 0.5, facadeStone, gap + 4.5, H / 2, 0), box(gap * 2, H - doorH, 0.5, facadeStone, 0, doorH + (H - doorH) / 2, 0));
  room.add(box(0.032, doorH, 0.52, bronze, -gap, doorH / 2, 0), box(0.032, doorH, 0.52, bronze, gap, doorH / 2, 0), box(gap * 2 + 0.03, 0.032, 0.52, bronze, 0, doorH, 0));
  room.add(box(5.4, 0.1, 1.5, ceiling, 0, doorH + 0.34, 0.95), box(5.4, 0.012, 0.012, cove, 0, doorH + 0.28, 1.68));
  const sign = monogram(0.6, signMat);
  sign.position.set(0, doorH + 1.12, 0.26);
  room.add(sign);

  /* Portas duplas: vidro quase invisível, perfil fino de bronze e puxador longo */
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xd8e2e6, transparent: true, opacity: 0.1, roughness: 0.02, metalness: 0, envMapIntensity: 5, side: THREE.DoubleSide });
  const door = (side: number) => {
    const g = new THREE.Group();
    g.add(box(gap - 0.02, doorH - 0.04, 0.02, glass, 0, 0, 0), box(0.022, doorH - 0.04, 0.03, bronze, (-side * (gap - 0.04)) / 2, 0, 0), box(0.016, 1.3, 0.016, bronze, (-side * (gap - 0.22)) / 2, 0, 0.07));
    g.position.set((side * gap) / 2, doorH / 2, 0);
    room.add(g);
    return g;
  };
  const doorL = door(-1), doorR = door(1);

  /* Interior */
  const iw = 7, depth = 17;
  room.add(box(0.3, H, depth, hallStone, -iw, H / 2, -depth / 2), box(0.3, H, depth, hallStone, iw, H / 2, -depth / 2), box(iw * 2, 0.2, depth, ceiling, 0, H, -depth / 2));
  room.add(box(iw * 2, H, 0.3, slat, 0, H / 2, -depth));
  // Sanca rebaixada: a luz vem de dentro do forro, nunca de uma fita à vista
  for (const x of [-iw + 0.5, iw - 0.5]) room.add(box(0.5, 0.14, depth - 1, ceiling, x, H - 0.28, -depth / 2), box(0.02, 0.02, depth - 1, cove, x + Math.sign(-x) * 0.26, H - 0.24, -depth / 2));
  room.add(box(iw * 2 - 1, 0.02, 0.02, blueCove, 0, 0.1, -depth + 0.2));
  room.add(box(4.6, 1.05, 0.85, desk, 0, 0.525, -depth + 2.4), box(4.62, 0.018, 0.87, bronze, 0, 1.06, -depth + 2.4));
  const backSign = monogram(0.7, signMat);
  backSign.position.set(0, 2.5, -depth + 0.18);
  room.add(backSign);

  /* Luz: lavagem rasante na pedra, focos no salão e só um toque de azul */
  for (const x of mobile ? [-2.6, 2.6] : [-4.6, -2.3, 2.3, 4.6]) {
    const s = new THREE.SpotLight(WARM, 34, 7, 0.62, 0.95, 1.5);
    s.position.set(x, H - 0.1, 0.75);
    s.target.position.set(x, 0, 0.22);
    scene.add(s, s.target);
  }
  const entryLight = new THREE.SpotLight(WARM, 0, 7, 0.5, 0.9, 1.4);
  entryLight.position.set(0, doorH + 0.26, 1.2);
  entryLight.target.position.set(0, 0, 0.8);
  scene.add(entryLight, entryLight.target);
  const blueFill = new THREE.PointLight(BLUE, 5, 9, 1.8);
  blueFill.position.set(-6, 0.6, 2.4);
  const hall = [new THREE.PointLight(WARM, 26, 15, 1.6), new THREE.PointLight(WARM, 18, 13, 1.6), new THREE.PointLight(BLUE, 8, 12, 1.7)];
  hall[0].position.set(0, 4.4, -6);
  hall[1].position.set(0, 3.2, -14);
  hall[2].position.set(-5, 2.2, -9);
  scene.add(blueFill, ...hall);

  /* Esculturas suspensas, uma para cada clínica. Posição estável: o rótulo não foge */
  const nodeGeo = new THREE.SphereGeometry(0.035, mobile ? 10 : 18, mobile ? 10 : 18);
  const rodGeo = new THREE.CylinderGeometry(0.009, 0.009, 1, 8);
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2c, metalness: 0.8, roughness: 0.5 });
  const cables: THREE.Mesh[] = [];
  const hitGeo = new THREE.SphereGeometry(0.72, 8, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const slots: [number, number, number][] = mobile
    ? [[-1.5, 3.5, -7], [1.45, 3.7, -8], [0, 2.85, -9], [-1.75, 2.45, -8], [1.7, 2.4, -7.5], [0, 4.1, -10]]
    : [[-2.95, 3.0, -7.6], [0, 3.2, -8.6], [2.95, 3.0, -7.6], [-2.95, 1.45, -7.6], [0, 1.55, -8.6], [2.95, 1.45, -7.6]];
  const sculptures: Sculpture[] = Array.from({ length: count }, (_, i) => {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: BRASS, metalness: 1, roughness: 0.38, emissive: WARM, emissiveIntensity: 0, transparent: true });
    const { nodes, edges } = skeleton(hexCenters[i % hexCenters.length]);
    nodes.forEach((n) => {
      const m = new THREE.Mesh(nodeGeo, material);
      m.position.copy(n);
      group.add(m);
    });
    edges.forEach(([a, b]) => {
      const dir = nodes[b].clone().sub(nodes[a]);
      const rod = new THREE.Mesh(rodGeo, material);
      rod.position.copy(nodes[a]).add(dir.clone().multiplyScalar(0.5));
      rod.scale.y = dir.length();
      rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      group.add(rod);
    });
    const home = new THREE.Vector3(...slots[i % slots.length]);
    group.position.copy(home);
    group.visible = false;
    scene.add(group);
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, H - home.y - 0.3, 5), cableMat);
    cable.position.set(home.x, (H + home.y + 0.3) / 2, home.z);
    scene.add(cable);
    const hit = new THREE.Mesh(hitGeo, hitMat);
    hit.position.copy(home);
    hit.userData.index = i;
    scene.add(hit);
    cables.push(cable);
    return { group, material, home, seed: i * 1.3, spin: 0.7 + ((i * 5) % 4) * 0.2, scale: 1, hit };
  });

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.5));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  /* Interação direta com as esculturas */
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered: number | null = null;
  let selected: number | null = null;
  let inside = false;
  const targets = sculptures.map((m) => m.hit);

  const pick = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(targets, false)[0];
    return hit ? (hit.object.userData.index as number) : null;
  };
  const onMove = (e: PointerEvent) => {
    if (!inside || mobile) return;
    const i = pick(e);
    if (i !== hovered) {
      hovered = i;
      options.onHover(i);
    }
    canvas.style.cursor = i === null ? "default" : "pointer";
  };
  const onUp = (e: PointerEvent) => {
    if (!inside) return;
    const i = pick(e);
    if (i !== null) options.onPick(i);
  };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);

  let raf = 0;
  let disposed = false;
  const clock = new THREE.Clock();
  const v = new THREE.Vector3();

  const frame = () => {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    sculptures.forEach((m, i) => {
      if (!m.group.visible) return;
      const active = hovered === i || selected === i;
      const k = Math.min(1, dt * 5);
      m.scale += ((active ? 1.1 : 1) - m.scale) * k;
      m.group.scale.setScalar(m.scale * (mobile ? 0.85 : 1.1));
      // Peça suspensa: gira devagar e cada uma em seu ritmo; ao ser escolhida, aquieta
      m.group.rotation.y += dt * 0.16 * m.spin * (active ? 0.08 : 1);
      m.group.rotation.z = Math.sin(t * 0.21 * m.spin + m.seed) * 0.05;
      m.material.emissiveIntensity += ((active ? 0.5 : 0) - m.material.emissiveIntensity) * k;
      m.material.opacity += ((selected !== null && !active ? 0.14 : 1) - m.material.opacity) * k;
    });
    if (inside && options.onLabels) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      options.onLabels(
        sculptures.map((m) => {
          v.copy(m.home).project(camera);
          return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h };
        }),
      );
    }
    renderer.render(scene, camera);
  };
  frame();

  const showInside = () => {
    inside = true;
    sculptures.forEach((m) => (m.group.visible = true));
  };

  /* Deixa só as esculturas, sobre a imagem que está atrás do canvas. */
  const isolate = () => {
    room.visible = false;
    cables.forEach((c) => (c.visible = false));
    scene.background = null;
    scene.environmentIntensity = 0.6;
    renderer.setClearAlpha(0);
  };

  const finalCamera = { x: 0, y: mobile ? 2.3 : 1.75, z: mobile ? -0.8 : -0.6 };
  let entrance: gsap.core.Timeline | null = null;

  return {
    /** Aproxima, acende, abre e atravessa. Dura cerca de 2,8 s. */
    enter(onDone: () => void) {
      entrance = gsap
        .timeline({ onComplete: onDone })
        .to(camera.position, { z: 4.4, duration: 1.1, ease: "power2.inOut" }, 0)
        .to(entryLight, { intensity: 22, duration: 0.7, ease: "power2.out" }, 0.25)
        .to(signMat, { emissiveIntensity: 0.12, duration: 0.7 }, 0.25)
        .to(doorL.position, { x: -gap * 1.5, duration: 1.05, ease: "power2.inOut" }, 0.85)
        .to(doorR.position, { x: gap * 1.5, duration: 1.05, ease: "power2.inOut" }, 0.85)
        .call(showInside, undefined, 1.5)
        .to(camera.position, { ...finalCamera, duration: 1.3, ease: "power2.inOut" }, 1.45);
    },
    /** Pula direto para o salão, de qualquer ponto. */
    skip() {
      entrance?.kill();
      doorL.position.x = -gap * 1.5;
      doorR.position.x = gap * 1.5;
      entryLight.intensity = 22;
      signMat.emissiveIntensity = 0.12;
      camera.position.set(finalCamera.x, finalCamera.y, finalCamera.z);
      showInside();
    },
    isolate,
    hover(i: number | null) {
      hovered = i;
    },
    select(i: number | null) {
      selected = i;
    },
    dispose() {
      disposed = true;
      entrance?.kill();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
      });
      reflector?.dispose();
      textures.forEach((t) => t.dispose());
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
