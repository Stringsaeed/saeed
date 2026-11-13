import * as THREE from "three";
import { INK_KEY, lowRes } from "./retro-material";

// The part every retro scene shares: a renderer that draws into a small
// buffer, and the pass that turns that buffer into a 1997 picture. Colours
// are quantised with a 4×4 Bayer dither, half-transparent pixels become a
// stipple, and a line is inked wherever the depth jumps.

const DITHER_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const DITHER_FRAG = /* glsl */ `
precision highp float;
#include <packing>
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform vec2 texel;
uniform float levels;
uniform float cameraNear;
uniform float cameraFar;
uniform vec3 ink;
uniform vec3 inkKey;
varying vec2 vUv;

float viewDepth(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  return -perspectiveDepthToViewZ(d, cameraNear, cameraFar);
}

float bayer(vec2 p) {
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  int i = x + y * 4;
  // The 4×4 ordered-dither matrix, flattened.
  float m[16];
  m[0] = 0.0; m[1] = 8.0; m[2] = 2.0; m[3] = 10.0;
  m[4] = 12.0; m[5] = 4.0; m[6] = 14.0; m[7] = 6.0;
  m[8] = 3.0; m[9] = 11.0; m[10] = 1.0; m[11] = 9.0;
  m[12] = 15.0; m[13] = 7.0; m[14] = 13.0; m[15] = 5.0;
  for (int k = 0; k < 16; k++) if (k == i) return (m[k] + 0.5) / 16.0;
  return 0.5;
}

void main() {
  vec4 c = texture2D(tDiffuse, vUv);
  float t = bayer(gl_FragCoord.xy);
  // A drawn line where the depth jumps: the edge of a thing against the
  // desk, or the desk against the page.
  float here = viewDepth(vUv);
  float dl = viewDepth(vUv - vec2(texel.x, 0.0));
  float dr = viewDepth(vUv + vec2(texel.x, 0.0));
  float dd = viewDepth(vUv - vec2(0.0, texel.y));
  float du = viewDepth(vUv + vec2(0.0, texel.y));
  float jump = max(max(dl - here, dr - here), max(dd - here, du - here));
  bool edge = jump > 0.45 + here * 0.012;
  // Lines a scene drew itself arrive in a key colour and leave as ink.
  bool keyed = c.a > 0.99 && distance(c.rgb, inkKey) < 0.02;
  // Coverage is dithered too: a half-transparent shadow becomes a stipple.
  if (c.a <= t && !edge) discard;
  vec3 rgb = c.a > 0.0 ? c.rgb / c.a : c.rgb;
  vec3 srgb = pow(clamp(rgb, 0.0, 1.0), vec3(1.0 / 2.2));
  float steps = levels - 1.0;
  vec3 q = floor(srgb * steps + t) / steps;
  if (edge || keyed) q = ink;
  gl_FragColor = vec4(q, 1.0);
}
`;

export function createRetroPass(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    premultipliedAlpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);

  const depthTexture = new THREE.DepthTexture(2, 2);
  depthTexture.minFilter = THREE.NearestFilter;
  depthTexture.magFilter = THREE.NearestFilter;
  const target = new THREE.WebGLRenderTarget(2, 2, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: true,
    stencilBuffer: false,
    depthTexture,
  });
  const postScene = new THREE.Scene();
  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMaterial = new THREE.ShaderMaterial({
    vertexShader: DITHER_VERT,
    fragmentShader: DITHER_FRAG,
    uniforms: {
      tDiffuse: {
        value: target.texture,
      },
      tDepth: {
        value: depthTexture,
      },
      texel: {
        value: new THREE.Vector2(1 / 2, 1 / 2),
      },
      levels: {
        value: 5,
      },
      cameraNear: {
        value: 1,
      },
      cameraFar: {
        value: 200,
      },
      ink: {
        value: new THREE.Color(0x1c1c1f),
      },
      inkKey: {
        value: new THREE.Color(INK_KEY),
      },
    },
    depthTest: false,
    depthWrite: false,
    transparent: true,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial);
  postScene.add(quad);

  const size = new THREE.Vector2(2, 2);

  return {
    /** The buffer size in texels. */
    setSize(width: number, height: number) {
      size.set(width, height);
      renderer.setSize(width, height, false);
      target.setSize(width, height);
      postMaterial.uniforms.texel.value.set(1 / width, 1 / height);
    },
    setInk(color: THREE.ColorRepresentation) {
      postMaterial.uniforms.ink.value.set(color);
    },
    render(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
      // Two stages can share a page at different sizes; each snaps its
      // vertices to its own grid.
      lowRes.value.copy(size);
      postMaterial.uniforms.cameraNear.value = camera.near;
      postMaterial.uniforms.cameraFar.value = camera.far;
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(postScene, postCamera);
    },
    dispose() {
      quad.geometry.dispose();
      depthTexture.dispose();
      postMaterial.dispose();
      target.dispose();
      // Leave the context as it was found. If this canvas is given a new
      // renderer later, texture uploads must not start out flipped.
      const gl = renderer.getContext();
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      renderer.dispose();
    },
  };
}

export type RetroPass = ReturnType<typeof createRetroPass>;
