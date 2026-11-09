import * as THREE from "three";
import {
  type ProjectLink,
  type ShippedApp,
  type SideProject,
  shippedApps,
  sideProjects,
} from "@/data/projects";
import { flat, redraw, snapVertices } from "./retro-material";
import type { ThingModel, ThingSpec } from "./things-models";

// Every app as a game cartridge: grey shell, a plate in the brand colour,
// and the app's icon drawn small enough to be pixel art. Shipped apps and
// side projects are the same object; the caption tells them apart.

export type Cartridge = {
  id: string;
  name: string;
  description: string;
  logo: string;
  brand: number;
  kind: "shipped" | "side";
  links: readonly ProjectLink[];
};

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function brandOf(hex: string | undefined, fallback: number) {
  if (!hex) return fallback;
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return Number.isNaN(n) ? fallback : n;
}

function fromShipped(app: ShippedApp): Cartridge {
  const links: ProjectLink[] = [
    {
      ariaLabel: `${app.name} on the App Store`,
      href: app.appStore,
      type: "app-store",
    },
    {
      ariaLabel: `${app.name} on Google Play`,
      href: app.playStore,
      type: "play-store",
    },
  ];
  if (app.web) {
    links.push({
      ariaLabel: `${app.name} on the web`,
      href: app.web,
      type: "web",
    });
  }
  return {
    id: slug(app.name),
    name: app.name,
    description: app.description,
    logo: app.logo,
    brand: brandOf(app.brand, 0x8e8e96),
    kind: "shipped",
    links,
  };
}

function fromSide(project: SideProject): Cartridge {
  const links: ProjectLink[] = [
    {
      ariaLabel: `${project.name}`,
      href: project.href,
      type: project.type,
    },
    ...project.links,
  ];
  return {
    id: slug(project.name),
    name: project.name,
    description: project.description,
    logo: project.logo,
    brand: brandOf(project.brand, 0x8e8e96),
    kind: "side",
    links,
  };
}

export const CARTRIDGES: readonly Cartridge[] = [
  ...shippedApps.map(fromShipped),
  ...sideProjects.map(fromSide),
];

export const CARTRIDGE_BY_ID = new Map(
  CARTRIDGES.map((cartridge) => [
    cartridge.id,
    cartridge,
  ]),
);

const LABEL_PX = 24;

/** The icon drawn at a few pixels across, so it reads as pixel art. */
function labelTexture(src: string) {
  const canvas = document.createElement("canvas");
  canvas.width = LABEL_PX;
  canvas.height = LABEL_PX;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  if (context) {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      context.imageSmoothingEnabled = true;
      context.clearRect(0, 0, LABEL_PX, LABEL_PX);
      context.drawImage(image, 0, 0, LABEL_PX, LABEL_PX);
      texture.needsUpdate = true;
      for (const fn of redraw) fn();
    };
    image.src = src;
  }
  return texture;
}

const W = 1.3;
const H = 1.45;
const D = 0.22;

function buildCartridge(cartridge: Cartridge): ThingModel {
  const group = new THREE.Group();
  const shell = flat(0x9a9aa2);
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), shell);
  body.position.y = H / 2;
  group.add(body);
  // The notch across the top and the grip ridges on the sides.
  const notch = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.6, 0.12, D + 0.02),
    flat(0x7d7d85),
  );
  notch.position.y = H - 0.06;
  group.add(notch);
  for (const side of [
    -1,
    1,
  ]) {
    for (let i = 0; i < 3; i++) {
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.08, D + 0.04),
        flat(0x7d7d85),
      );
      ridge.position.set(side * (W / 2 - 0.08), 0.3 + i * 0.16, 0);
      group.add(ridge);
    }
  }
  // The brand plate and the icon on it.
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.74, H * 0.56, 0.03),
    flat(cartridge.brand),
  );
  plate.position.set(0, H * 0.46, D / 2 + 0.01);
  group.add(plate);
  const labelMaterial = new THREE.MeshBasicMaterial({
    map: labelTexture(cartridge.logo),
    transparent: true,
    alphaTest: 0.5,
  });
  snapVertices(labelMaterial);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.46, W * 0.46),
    labelMaterial,
  );
  label.position.set(0, H * 0.46, D / 2 + 0.03);
  group.add(label);
  // Cartridges lean back a little, like on a shelf.
  group.rotation.x = -0.12;
  return {
    group,
    radius: 0.8,
    height: H,
  };
}

export const CARTRIDGE_THINGS: readonly ThingSpec[] = CARTRIDGES.map(
  (cartridge, index) => ({
    id: cartridge.id,
    name: cartridge.name,
    yaw: (index % 3) * 0.06 - 0.06,
    settle: true,
    build: () => buildCartridge(cartridge),
  }),
);
