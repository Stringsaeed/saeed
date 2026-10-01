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
export function createBookLibrary(specs: readonly BookModel[]) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.domElement.style.cssText =
    "display:block;width:100%;height:100%;pointer-events:none";
  renderer.domElement.dataset.bookContext = crypto.randomUUID();
  const scene = new THREE.Scene();
  const assets = new BookAssets();
  const models = new Map<string, Promise<THREE.Group>>();
  const previews = new Map<string, string>();
  let disposed = false;
  let active: {
    draw: () => void;
    release: () => void;
  } | null = null;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb2a38a, 0.72));
  const key = new THREE.DirectionalLight(0xfff8ef, 0.9);
  key.position.set(-25, 45, 35);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd8e9ff, 0.35);
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

  function drawPreview(spec: BookModel, model: THREE.Group) {
    const height = spec.dimensionsMm.height / 10;
    const depth = spec.dimensionsMm.depth / 10;
    const padding = 0.015;
    const camera = new THREE.OrthographicCamera(
      -depth / 2 - padding,
      depth / 2 + padding,
      height / 2 + padding,
      -height / 2 - padding,
      0.1,
      200,
    );
    camera.position.z = 80;
    renderer.setPixelRatio(1);
    renderer.setSize(
      Math.ceil((1024 * (depth + 2 * padding)) / (height + 2 * padding)),
      1024,
      false,
    );
    const visible: THREE.Object3D[] = [];
    for (const child of scene.children)
      if (child instanceof THREE.Group && child.visible) {
        visible.push(child);
        child.visible = false;
      }
    const rotation = model.rotation.clone();
    model.visible = true;
    model.rotation.set(0, Math.PI / 2, 0);
    // A real render uploads textures and compiles the same materials used on opening.
    renderer.render(scene, camera);
    const preview = renderer.domElement.toDataURL("image/png");
    model.rotation.copy(rotation);
    model.visible = false;
    for (const child of visible) child.visible = true;
    active?.draw();
    previews.set(spec.id, preview);
    return preview;
  }

  async function warm(onPreview: (id: string, preview: string) => void) {
    for (const spec of specs) {
      if (disposed) return;
      try {
        const model = await load(spec);
        if (disposed) return;
        const preview = previews.get(spec.id) ?? drawPreview(spec, model);
        onPreview(spec.id, preview);
      } catch {
        if (disposed) return;
        // A failed title keeps its fallback; other books can still warm successfully.
      }
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    }
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
    warm,
    attach,
    dispose() {
      if (disposed) return;
      active?.release();
      disposed = true;
      disposeModel(scene);
      assets.dispose();
      renderer.dispose();
      previews.clear();
      models.clear();
    },
  };
}
