import Phaser from 'phaser';

const FRAG = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform float uNightAmount;
uniform float uTorchActive;
uniform vec2  uTorchUV;
uniform vec2  uResolution;
uniform float uTorchRadius;
uniform float uFireCount;
uniform vec2  uFire0UV;
uniform vec2  uFire1UV;
uniform vec2  uFire2UV;
uniform vec2  uFire3UV;
uniform float uFireRadius;
varying vec2 outTexCoord;

void main () {
  vec4 c   = texture2D(uMainSampler, outTexCoord);
  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));

  float night = uNightAmount;
  vec2 pixelCoord = outTexCoord * uResolution;

  if (uTorchActive > 0.5) {
    vec2 torchPixel = uTorchUV * uResolution;
    float dist = length(pixelCoord - torchPixel);
    float halo = 1.0 - smoothstep(uTorchRadius * 0.4, uTorchRadius, dist);
    night *= 1.0 - halo * 0.92;
    c.rgb += vec3(halo * 0.18 * uNightAmount, halo * 0.07 * uNightAmount, 0.0);
  }

  if (uFireCount > 0.5) {
    vec2 fp = uFire0UV * uResolution;
    float fd = length(pixelCoord - fp);
    float fh = 1.0 - smoothstep(uFireRadius * 0.35, uFireRadius, fd);
    night *= 1.0 - fh * 0.88;
    c.rgb += vec3(fh * 0.28 * uNightAmount, fh * 0.10 * uNightAmount, 0.0);
  }
  if (uFireCount > 1.5) {
    vec2 fp = uFire1UV * uResolution;
    float fd = length(pixelCoord - fp);
    float fh = 1.0 - smoothstep(uFireRadius * 0.35, uFireRadius, fd);
    night *= 1.0 - fh * 0.88;
    c.rgb += vec3(fh * 0.28 * uNightAmount, fh * 0.10 * uNightAmount, 0.0);
  }
  if (uFireCount > 2.5) {
    vec2 fp = uFire2UV * uResolution;
    float fd = length(pixelCoord - fp);
    float fh = 1.0 - smoothstep(uFireRadius * 0.35, uFireRadius, fd);
    night *= 1.0 - fh * 0.88;
    c.rgb += vec3(fh * 0.28 * uNightAmount, fh * 0.10 * uNightAmount, 0.0);
  }
  if (uFireCount > 3.5) {
    vec2 fp = uFire3UV * uResolution;
    float fd = length(pixelCoord - fp);
    float fh = 1.0 - smoothstep(uFireRadius * 0.35, uFireRadius, fd);
    night *= 1.0 - fh * 0.88;
    c.rgb += vec3(fh * 0.28 * uNightAmount, fh * 0.10 * uNightAmount, 0.0);
  }

  vec3 col = mix(c.rgb, vec3(lum), night * 0.95);
  col     *= 1.0 - night * 0.92;
  col     += vec3(0.0, 0.005, night * 0.04);
  gl_FragColor = vec4(col, c.a);
}
`;

export class NightPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  nightAmount  = 0;
  torchActive  = false;
  torchUVx     = 0.5;
  torchUVy     = 0.5;
  torchRadius  = 220; // pixels

  /** World-space positions of active fires (up to 4, closest to player first). */
  fireUVs: { uvx: number; uvy: number }[] = [];
  fireRadius = 210;

  constructor(game: Phaser.Game) {
    super({ game, name: 'NightPipeline', fragShader: FRAG });
  }

  onPreRender(): void {
    this.set1f('uNightAmount', this.nightAmount);
    this.set1f('uTorchActive', this.torchActive ? 1 : 0);
    this.set2f('uTorchUV',     this.torchUVx, this.torchUVy);
    this.set2f('uResolution',  this.renderer.width, this.renderer.height);
    this.set1f('uTorchRadius', this.torchRadius);
    this.set1f('uFireRadius',  this.fireRadius);

    const n = this.fireUVs.length;
    this.set1f('uFireCount', n);
    this.set2f('uFire0UV', n > 0 ? this.fireUVs[0].uvx : 0, n > 0 ? this.fireUVs[0].uvy : 0);
    this.set2f('uFire1UV', n > 1 ? this.fireUVs[1].uvx : 0, n > 1 ? this.fireUVs[1].uvy : 0);
    this.set2f('uFire2UV', n > 2 ? this.fireUVs[2].uvx : 0, n > 2 ? this.fireUVs[2].uvy : 0);
    this.set2f('uFire3UV', n > 3 ? this.fireUVs[3].uvx : 0, n > 3 ? this.fireUVs[3].uvy : 0);
  }
}
