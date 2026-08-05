import Lenis from 'lenis';
import * as THREE from 'three';

const lenis = new Lenis();

const coverVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const coverFragmentShader = `
  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec2 uImageResolution;
  uniform float uDissolve;
  uniform vec2 uCenter;
  uniform float uTime;
  uniform float uGrayscale;
  uniform float uEdgeIntensity;
  uniform float uEdgeBrightness;
  varying vec2 vUv;

  // Sobel operator kernels
  mat3 sobelX = mat3(
    -1.0, 0.0, 1.0,
    -2.0, 0.0, 2.0,
    -1.0, 0.0, 1.0
  );

  mat3 sobelY = mat3(
    -1.0, -2.0, -1.0,
     0.0,  0.0,  0.0,
     1.0,  2.0,  1.0
  );

  float getLuminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
  }

  float sobel(sampler2D tex, vec2 uv, vec2 texelSize) {
    float gx = 0.0;
    float gy = 0.0;

    for (int i = -1; i <= 1; i++) {
      for (int j = -1; j <= 1; j++) {
        vec2 offset = vec2(float(i), float(j)) * texelSize;
        float lum = getLuminance(texture2D(tex, uv + offset).rgb);
        gx += lum * sobelX[i + 1][j + 1];
        gy += lum * sobelY[i + 1][j + 1];
      }
    }

    return sqrt(gx * gx + gy * gy);
  }

  // Noise functions for noisy circle edge
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    
    return value;
  }

  void main() {
    vec2 ratio = vec2(
      min((uResolution.x / uResolution.y) / (uImageResolution.x / uImageResolution.y), 1.0),
      min((uResolution.y / uResolution.x) / (uImageResolution.y / uImageResolution.x), 1.0)
    );

    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    vec4 texColor = texture2D(uTexture, uv);
    
    // Apply grayscale effect based on uGrayscale uniform
    float gray = getLuminance(texColor.rgb);
    vec3 grayscaleColor = vec3(gray);
    texColor.rgb = mix(texColor.rgb, grayscaleColor, uGrayscale);
    
    // Calculate distance from center for radial dissolve
    // Correct for aspect ratio to make a perfect circle
    vec2 centeredUv = vUv - uCenter;
    float aspect = uResolution.x / uResolution.y;
    centeredUv.x *= aspect;
    float dist = length(centeredUv);
    
    // Add noise to the distance for noisy/pixelated circle edge
    float angle = atan(centeredUv.y, centeredUv.x);
    
    // Create blocky/pixelated noise effect - static (no time-based movement)
    float noiseScale = 6.0;
    vec2 pixelatedUv = floor(vUv * uResolution / noiseScale) * noiseScale / uResolution;
    float blockNoise = fbm(pixelatedUv * 100.0) * 0.15;
    
    // Add angular noise for jagged edge - static (no time-based movement)
    float angularNoise = fbm(vec2(angle * 5.0, 0.0)) * 0.15;
    
    // Combine noises for pixelated/scattered edge effect
    float totalNoise = blockNoise + angularNoise;
    float noisyDist = dist + totalNoise;
    
    // Normalize distance (max distance from center, accounting for aspect ratio)
    float maxDist = length(vec2(aspect * 0.5, 0.5));
    float normalizedDist = noisyDist / maxDist;
    
    // Calculate dissolve threshold - starts from center, revealing outward
    float dissolveThreshold = uDissolve * 1.5; // Multiply to extend range
    
    // Sobel edge detection
    vec2 texelSize = 1.0 / uResolution;
    float edge = sobel(uTexture, uv, texelSize);
    
    // Enhance edge detection for more visible edges
    edge = pow(edge, 0.7) * 2.0;
    edge = clamp(edge, 0.0, 1.0);
    
    // Create dissolve mask - pixels closer to center dissolve first (reveal from center)
    // Thinner edge with tighter smoothstep range
    float dissolveMask = smoothstep(dissolveThreshold - 0.03, dissolveThreshold, normalizedDist);
    
    // Bright edge color (white/golden glow) - modulated by uEdgeBrightness
    vec3 edgeColor = vec3(1.0, 1.0, 1.0);
    
    // Start with the base image color or black when grayscaled
    vec3 baseColor = mix(texColor.rgb, vec3(0.0), uGrayscale);
    vec3 finalColor = baseColor;
    
    // Add edge glow effect - scale up when grayscaled to make edges glow more
    float edgeGlowIntensity = uEdgeIntensity * 2.0;
    float edgeGlow = edge * edgeGlowIntensity * (1.0 + uGrayscale * 3.0);
    finalColor += edgeColor * edgeGlow * uEdgeBrightness;
    
    // Add sparkle/bright pixels at the dissolve edge - thinner zone, static
    // Increase the edge zone width and intensity for initial bright effect
    float edgeZoneWidth = 0.15 * (1.0 - uDissolve) + 0.02;
    float edgeZone = smoothstep(dissolveThreshold - edgeZoneWidth, dissolveThreshold - edgeZoneWidth + 0.04, normalizedDist) * 
                     smoothstep(dissolveThreshold + 0.02, dissolveThreshold - 0.02, normalizedDist);
    float sparkle = hash(floor(vUv * uResolution / 4.0)) * edgeZone;
    
    // Noisy bright glow that fades as uDissolve increases - now also scaled by grayscale
    float edgeBrightness = (1.0 - uDissolve) * uEdgeBrightness * (1.0 + uGrayscale * 2.0);
    finalColor += vec3(sparkle * 3.0 * edgeBrightness);
    
    // Apply dissolve with alpha
    float alpha = dissolveMask * texColor.a;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const coverFragmentShaderReverse = `
  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec2 uImageResolution;
  uniform float uDissolve;
  uniform vec2 uCenter;
  uniform float uTime;
  uniform float uBrightness;
  uniform float uEdgeIntensity;
  uniform float uDarkness;
  uniform float uGrayscale;
  varying vec2 vUv;

  // Sobel operator kernels
  mat3 sobelX = mat3(
    -1.0, 0.0, 1.0,
    -2.0, 0.0, 2.0,
    -1.0, 0.0, 1.0
  );

  mat3 sobelY = mat3(
    -1.0, -2.0, -1.0,
     0.0,  0.0,  0.0,
     1.0,  2.0,  1.0
  );

  float getLuminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
  }

  float sobel(sampler2D tex, vec2 uv, vec2 texelSize) {
    float gx = 0.0;
    float gy = 0.0;

    for (int i = -1; i <= 1; i++) {
      for (int j = -1; j <= 1; j++) {
        vec2 offset = vec2(float(i), float(j)) * texelSize;
        float lum = getLuminance(texture2D(tex, uv + offset).rgb);
        gx += lum * sobelX[i + 1][j + 1];
        gy += lum * sobelY[i + 1][j + 1];
      }
    }

    return sqrt(gx * gx + gy * gy);
  }

  void main() {
    vec2 ratio = vec2(
      min((uResolution.x / uResolution.y) / (uImageResolution.x / uImageResolution.y), 1.0),
      min((uResolution.y / uResolution.x) / (uImageResolution.y / uImageResolution.x), 1.0)
    );

    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    vec4 texColor = texture2D(uTexture, uv);
    
    // Apply grayscale effect based on uGrayscale uniform
    float gray = getLuminance(texColor.rgb);
    vec3 grayscaleColor = vec3(gray);
    texColor.rgb = mix(texColor.rgb, grayscaleColor, uGrayscale);
    
    // Sobel edge detection
    vec2 texelSize = 1.0 / uResolution;
    float edge = sobel(uTexture, uv, texelSize);
    
    // Enhance edge detection for more visible edges
    edge = pow(edge, 0.7) * 2.0;
    edge = clamp(edge, 0.0, 1.0);
    
    // Bright edge color (white/golden glow)
    vec3 edgeColor = vec3(1.0, 1.0, 1.0);
    
    // Start with dark/black background, only edges visible
    // uDarkness: 1.0 = fully dark (only edges), 0.0 = normal image
    vec3 darkBase = vec3(0.0);
    vec3 baseColor = mix(texColor.rgb, darkBase, uDarkness);
    
    // Add edge glow effect only (no overall brightness boost)
    float edgeGlow = edge * uEdgeIntensity * 2.0;
    baseColor += edgeColor * edgeGlow;
    
    // Clamp to valid color range
    vec3 finalColor = clamp(baseColor, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, texColor.a);
  }
`;

const container1 = document.querySelector('.canvas1');
const scene1 = new THREE.Scene();
const camera1 = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10);
camera1.position.z = 1;


const renderer1 = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer1.setSize(window.innerWidth, window.innerHeight);
container1.appendChild(renderer1.domElement);


const container2 = document.querySelector('.canvas2');
const scene2 = new THREE.Scene();
const camera2 = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10);
camera2.position.z = 1;

const renderer2 = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer2.setSize(window.innerWidth, window.innerHeight);
container2.appendChild(renderer2.domElement)


container1.style.zIndex = '2'
container2.style.zIndex = '1'


const geometry = new THREE.PlaneGeometry(2, 2);

const textureLoader = new THREE.TextureLoader();

let material1, material2;

textureLoader.load("https://images.unsplash.com/photo-1577081395884-e70fc91645ad?q=80&w=1134&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", (texture) => {
  material1 = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uImageResolution: { value: new THREE.Vector2(texture.image.width, texture.image.height) },
      uDissolve: { value: 0.0 },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0.0 },
      uGrayscale: { value: 0.0 },
      uEdgeIntensity: { value: 0.0 },
      uEdgeBrightness: { value: 1.0 }

    },
    vertexShader: coverVertexShader,
    fragmentShader: coverFragmentShader,
    transparent: true
  })

  const mesh1 = new THREE.Mesh(geometry, material1);
  scene1.add(mesh1);
})

textureLoader.load("https://images.unsplash.com/photo-1705167110557-a16203e0fe24?q=80&w=1274&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", (texture) => {
  material2 = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uImageResolution: { value: new THREE.Vector2(texture.image.width, texture.image.height) },
      uDissolve: { value: 0.0 },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0.0 },
      uBrightness: { value: 0.0 },
      uEdgeIntensity: { value: 0.6 },
      uDarkness: { value: 1.0 },
      uGrayscale: { value: 1.0 }
    },
    vertexShader: coverVertexShader,
    fragmentShader: coverFragmentShaderReverse,
    transparent: true
  })
  const mesh2 = new THREE.Mesh(geometry, material2);
  scene2.add(mesh2)
})


window.addEventListener('resize', ()=>{
  renderer1.setSize(window.innerWidth, window.innerHeight);
  renderer2.setSize(window.innerWidth, window.innerHeight);

  if (material1) {
    material1.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  }
  if (material2) {
    material2.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  }
})


lenis.on('scroll', ({progress})=>{
  const dissolveAmount = progress

  if (material1){
    material1.uniforms.uDissolve.value = dissolveAmount;
    const grayscaleProgress = Math.min(1.0, progress/.4);
    material1.uniforms.uGrayscale.value = grayscaleProgress
    material1.uniforms.uEdgeIntensity.value = progress * .5
    material1.uniforms.uEdgeBrightness.value = 1.0 - progress
  }

  if (material2){
    const acceleratedProgress = Math.min(1.0, progress* 1.1);
    material2.uniforms.uEdgeIntensity.value = .6 * (1.0 - acceleratedProgress);
    material2.uniforms.uDarkness.value = 1.0 - acceleratedProgress;
    material2.uniforms.uGrayscale.value = 1.0 - acceleratedProgress;
  }
})


function raf(time) {
  lenis.raf(time);

  const timeInSeconds = time * 0.001;
  if (material1){
    material1.uniforms.uTime.value = timeInSeconds;
  }
  if (material2){
    material2.uniforms.uTime.value = timeInSeconds;
  }

  renderer1.render(scene1, camera1);
  renderer2.render(scene2, camera2);


  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);