import * as THREE from "three";
import { BookAssets, createBook, disposeModel } from "./model";
import type { BookModel } from "./types";

export function mountBookViewer(
  host: HTMLElement,
  spec: BookModel,
  frame: {
    width: number;
    height: number;
    perspective: number;
  },
) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.domElement.style.cssText =
    "display:block;width:100%;height:100%;pointer-events:none";
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 300);
  const assets = new BookAssets();
  let model: THREE.Group | null = null;
  let disposed = false;
  let pendingFrame = 0;
  let turn = 90,
    tilt = 0;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb2a38a, 0.72));
  const key = new THREE.DirectionalLight(0xfff8ef, 0.9);
  key.position.set(-25, 45, 35);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd8e9ff, 0.35);
  fill.position.set(20, 15, -5);
  scene.add(fill);

  function render() {
    if (disposed || pendingFrame || document.hidden) return;
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = 0;
      if (model) {
        model.rotation.set((-tilt * Math.PI) / 180, (turn * Math.PI) / 180, 0);
      }
      renderer.render(scene, camera);
    });
  }
  function resize() {
    const scale = frame.height / (spec.dimensionsMm.height / 10);
    const width = frame.width * 2,
      height = frame.height * 1.6;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov =
      (2 * Math.atan(height / (2 * frame.perspective)) * 180) / Math.PI;
    camera.position.z = frame.perspective / scale;
    camera.updateProjectionMatrix();
    render();
  }
  resize();
  document.addEventListener("visibilitychange", render);
  const ready = createBook(spec, assets).then((book) => {
    if (disposed) {
      disposeModel(book);
      return;
    }
    model = book;
    scene.add(book);
    render();
  });
  return {
    ready,
    pose(x: number, y: number) {
      tilt = x;
      turn = y;
      render();
    },
    resize(next: typeof frame) {
      frame = next;
      resize();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(pendingFrame);
      document.removeEventListener("visibilitychange", render);
      disposeModel(scene);
      assets.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
