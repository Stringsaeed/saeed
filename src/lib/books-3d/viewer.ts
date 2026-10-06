import * as THREE from "three";
import { BookAssets, createBook, disposeModel } from "./model";
import type { BookModel } from "./types";

export type BookFrame = {
  width: number;
  height: number;
  perspective: number;
};
export type BookLibrary = ReturnType<typeof createBookLibrary>;

/** One library owns the models and GPU context for the shelf's lifetime. */
export function createBookLibrary() {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cssText =
    "display:block;width:100%;height:100%;pointer-events:none";
  renderer.domElement.dataset.bookContext = crypto.randomUUID();
  const scene = new THREE.Scene();
  const assets = new BookAssets();
  const models = new Map<string, Promise<THREE.Group>>();
  let disposed = false;
  let active: {
    draw: () => void;
    release: () => void;
  } | null = null;
  // three r155+ dropped legacy light units; scale by PI to keep the r151 look.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb2a38a, 0.72 * Math.PI));
  const key = new THREE.DirectionalLight(0xfff8ef, 0.9 * Math.PI);
  key.position.set(-25, 45, 35);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd8e9ff, 0.35 * Math.PI);
  fill.position.set(20, 15, -5);
  scene.add(fill);

  function load(spec: BookModel) {
    const existing = models.get(spec.id);
    if (existing) return existing;
    const request = createBook(spec, assets)
      .then((model) => {
        if (disposed) {
          disposeModel(model);
          throw new Error("Book library disposed");
        }
        model.visible = false;
        scene.add(model);
        return model;
      })
      .catch((error: unknown) => {
        models.delete(spec.id);
        throw error;
      });
    models.set(spec.id, request);
    return request;
  }

  function attach(host: HTMLElement, spec: BookModel, initialFrame: BookFrame) {
    if (disposed) throw new Error("Book library disposed");
    active?.release();
    host.append(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 300);
    let model: THREE.Group | null = null;
    let released = false,
      pendingFrame = 0;
    let frame = initialFrame;
    let turn = 90,
      tilt = 0;
    function draw() {
      if (released || disposed) return;
      const scale = frame.height / (spec.dimensionsMm.height / 10);
      const width = frame.width * 2,
        height = frame.height * 1.6;
      const pixelRatio = Math.min(devicePixelRatio, 2);
      if (renderer.getPixelRatio() !== pixelRatio)
        renderer.setPixelRatio(pixelRatio);
      const size = renderer.getSize(new THREE.Vector2());
      if (size.x !== width || size.y !== height)
        renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov =
        (2 * Math.atan(height / (2 * frame.perspective)) * 180) / Math.PI;
      camera.position.z = frame.perspective / scale;
      camera.updateProjectionMatrix();
      model?.rotation.set((-tilt * Math.PI) / 180, (turn * Math.PI) / 180, 0);
      renderer.render(scene, camera);
    }
    function render() {
      if (released || disposed || pendingFrame || document.hidden) return;
      pendingFrame = requestAnimationFrame(() => {
        pendingFrame = 0;
        draw();
      });
    }
    const view = {
      draw,
      release() {
        if (released) return;
        released = true;
        cancelAnimationFrame(pendingFrame);
        document.removeEventListener("visibilitychange", render);
        if (model) model.visible = false;
        if (active === view) {
          active = null;
          renderer.domElement.remove();
        }
      },
    };
    active = view;
    document.addEventListener("visibilitychange", render);
    const ready = load(spec).then((loaded) => {
      if (released || disposed) return;
      model = loaded;
      model.visible = true;
      draw();
    });
    return {
      ready,
      pose(x: number, y: number) {
        tilt = x;
        turn = y;
        render();
      },
      resize(next: BookFrame) {
        frame = next;
        render();
      },
      dispose: view.release,
    };
  }

  return {
    attach,
    dispose() {
      if (disposed) return;
      active?.release();
      disposed = true;
      disposeModel(scene);
      assets.dispose();
      renderer.dispose();
      models.clear();
    },
  };
}
