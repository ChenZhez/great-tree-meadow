/* =================== renderer, sky, water, post-processing and shared helpers =================== */
const $ = (s) => document.querySelector(s);
if (!window.THREE) {
  $('#err').style.display = 'grid';
  return;
}
const V3 = THREE.Vector3,
  V2 = THREE.Vector2,
  TAU = Math.PI * 2;
let _s = 7;
const R = () => {
  _s = (_s * 16807) % 2147483647;
  return (_s - 1) / 2147483646;
};
const seedR = (n) => {
  _s = (n * 48271 + 13) % 2147483647 || 1;
};
const rr = (a, b) => a + R() * (b - a),
  pick = (a) => a[Math.floor(R() * a.length)];
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v),
  damp = (k, dt) => 1 - Math.exp(-k * dt);
const lerpAngle = (a, b, t) => {
  const d = ((((b - a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
  return a + d * t;
};

/* ---------- renderer ---------- */
const canvas = $('#c');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  $('#err').style.display = 'grid';
  return;
}
const isTouch =
  (window.matchMedia && matchMedia('(pointer: coarse)').matches) ||
  'ontouchstart' in window ||
  (navigator.maxTouchPoints > 0 && window.matchMedia && matchMedia('(hover: none)').matches);
document.body.classList.toggle('touch', isTouch);
document.body.classList.toggle('no-touch', !isTouch);
let PR = Math.min(window.devicePixelRatio || 1, 1.5),
  REFLQ = 0.5,
  FLORA_ON = true,
  REFL_EVERY = 1;
renderer.setPixelRatio(PR);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 2600);
let world = new THREE.Group();
scene.add(world);

/* ---------- textures ---------- */
function ctex(size, draw, w) {
  const c = document.createElement('canvas');
  c.width = w || size;
  c.height = size;
  const g = c.getContext('2d');
  draw(g, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.userData = { keep: true };
  return t;
}
const TEX = {
  glow: ctex(128, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.2, 'rgba(255,255,255,.6)');
    r.addColorStop(0.5, 'rgba(255,255,255,.14)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
  }),
  dot: ctex(64, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.35, 'rgba(255,255,255,.9)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
  }),
  petal: ctex(64, (g, s) => {
    g.translate(s / 2, s / 2);
    g.rotate(0.5);
    const r = g.createRadialGradient(0, -4, 2, 0, 0, s * 0.4);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(1, 'rgba(255,255,255,.75)');
    g.fillStyle = r;
    g.beginPath();
    g.ellipse(0, 0, s * 0.2, s * 0.34, 0, 0, TAU);
    g.fill();
  }),
  heart: ctex(64, (g, s) => {
    g.fillStyle = '#fff';
    g.translate(s / 2, s / 2 + 2);
    g.beginPath();
    g.moveTo(0, s * 0.3);
    g.bezierCurveTo(-s * 0.52, -s * 0.02, -s * 0.26, -s * 0.46, 0, -s * 0.17);
    g.bezierCurveTo(s * 0.26, -s * 0.46, s * 0.52, -s * 0.02, 0, s * 0.3);
    g.fill();
  }),
  seed: ctex(64, (g, s) => {
    g.strokeStyle = 'rgba(255,255,255,.95)';
    g.lineWidth = 1.5;
    g.translate(s / 2, s / 2);
    for (let i = 0; i < 14; i++) {
      g.rotate(TAU / 14);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(0, -s * 0.42);
      g.stroke();
    }
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(0, 0, 3, 0, TAU);
    g.fill();
  }),
};
const toonGrad = (() => {
  const d = new Uint8Array([70, 70, 70, 150, 150, 150, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  t.userData = { keep: true };
  return t;
})();

/* ---------- sky ---------- */
const skyU = {
  top: { value: new THREE.Color() },
  hor: { value: new THREE.Color() },
  band: { value: new THREE.Color() },
  bandAmt: { value: 0 },
  expo: { value: 0.6 },
  sunDir: { value: new V3(0, 0.1, -1) },
  sunCol: { value: new THREE.Color() },
  glowCol: { value: new THREE.Color() },
  sunSize: { value: 0.9993 },
  glowAmt: { value: 1 },
  flip: { value: 0 },
};
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(1300, 48, 24),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    uniforms: skyU,
    vertexShader:
      'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform vec3 top,hor,band,sunCol,glowCol,sunDir;uniform float bandAmt,expo,sunSize,glowAmt,flip;varying vec3 vP;
  void main(){vec3 d=normalize(vP);if(flip>.5)d.y=-d.y;float h=max(d.y,0.);
  vec3 c=mix(hor,top,pow(h,expo));c=mix(c,band,exp(-h*9.)*bandAmt);
  float s=max(dot(d,normalize(sunDir)),0.);
  c+=glowCol*(pow(s,10.)*.22+pow(s,90.)*.45)*glowAmt*(flip>.5?.6:1.);c=min(c,vec3(1.));
  c=mix(c,sunCol*(flip>.5?.62:1.),smoothstep(sunSize-.0012,sunSize+.0004,s)*(flip>.5?.7:1.));
  gl_FragColor=vec4(c,1.);}`,
  }),
);
sky.renderOrder = -100;
sky.frustumCulled = false;
scene.add(sky);

/* ---------- reflective water ---------- */
const reflRT = new THREE.WebGLRenderTarget(4, 4, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});
const ripples = [];
for (let i = 0; i < 10; i++) ripples.push(new THREE.Vector4(0, 0, 99, 0));
const waterU = {
  tRef: { value: reflRT.texture },
  res: { value: new V2(1, 1) },
  time: { value: 0 },
  tint: { value: new THREE.Color() },
  tintAmt: { value: 0.2 },
  refl: { value: 1 },
  distort: { value: 0.006 },
  camPos: { value: camera.position },
  ripples: { value: ripples },
  sparkle: { value: 0 },
  sparkCol: { value: new THREE.Color(1, 1, 1) },
  edge: { value: new THREE.Color() },
  fogFar: { value: 600 },
};
const water = new THREE.Mesh(
  new THREE.PlaneGeometry(4000, 4000),
  new THREE.ShaderMaterial({
    uniforms: waterU,
    vertexShader:
      'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader: `uniform sampler2D tRef;uniform vec2 res;uniform float time,tintAmt,refl,distort,sparkle,fogFar;uniform vec3 tint,camPos,sparkCol,edge;uniform vec4 ripples[10];varying vec3 vW;
  void main(){vec2 uv=gl_FragCoord.xy/res;float dist=length(vW.xz-camPos.xz);
   vec2 w=vec2(sin(vW.x*.9+time*1.1)+sin(vW.z*1.7-time*.8)*.6,cos(vW.z*1.1+time*.9)+sin(vW.x*1.3+time*.7)*.6);
   float rip=0.;
   for(int i=0;i<10;i++){vec4 r=ripples[i];if(r.w<=0.)continue;float d=length(vW.xz-r.xy);float k=d-r.z*1.5;rip+=sin(k*10.)*exp(-k*k*5.)*r.w*exp(-r.z*1.2);}
   vec2 off=w*distort/(1.+dist*.06)+vec2(rip*.01,rip*.014);
   vec3 rc=texture2D(tRef,clamp(uv+off,.001,.999)).rgb;
   vec3 v=normalize(camPos-vW);float fr=pow(1.-clamp(v.y,0.,1.),5.);
   vec3 c=mix(rc*refl,tint,tintAmt*(1.-fr*.7));
   c+=vec3(max(rip,0.)*.1);
   float g=pow(max(0.,sin(vW.x*7.3+time*1.7+sin(vW.z*1.9)*2.)*sin(vW.z*6.7-time*1.3+sin(vW.x*1.5)*2.)),60.);
   c+=sparkCol*g*sparkle*.7*smoothstep(4.,12.,dist)*(1.-smoothstep(20.,70.,dist));
   c=mix(c,edge,smoothstep(fogFar*.35,fogFar,dist)*.6);
   gl_FragColor=vec4(c,1.);}`,
  }),
);
water.geometry.rotateX(-Math.PI / 2);
water.frustumCulled = false;
scene.add(water);
let ripIdx = 0;
function addRipple(x, z, s = 1) {
  const r = ripples[ripIdx];
  r.set(x, z, 0, s);
  ripIdx = (ripIdx + 1) % ripples.length;
}

/* ---------- post ---------- */
let composer = null,
  bloom = null;
const hasPost =
  !/nopost/.test(location.search) && !!(THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass);
if (hasPost) {
  let rt;
  if (!/noms/.test(location.search) && renderer.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget) {
    rt = new THREE.WebGLMultisampleRenderTarget(4, 4, { format: THREE.RGBAFormat });
    rt.samples = 4;
  }
  composer = new THREE.EffectComposer(renderer, rt);
  composer.addPass(new THREE.RenderPass(scene, camera));
  bloom = new THREE.UnrealBloomPass(new V2(256, 256), 0.6, 0.6, 0.8);
  composer.addPass(bloom);
}
const clipBelow = [new THREE.Plane(new V3(0, -1, 0), 0.03)];
function render() {
  world.scale.y = -1;
  skyU.flip.value = 1;
  water.visible = false;
  renderer.clippingPlanes = clipBelow;
  renderer.setRenderTarget(reflRT);
  renderer.clear();
  renderer.render(scene, camera);
  world.scale.y = 1;
  skyU.flip.value = 0;
  water.visible = true;
  renderer.clippingPlanes = [];
  renderer.setRenderTarget(null);
  if (composer) composer.render();
  else renderer.render(scene, camera);
}
function resize() {
  const w = innerWidth,
    h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const fv = typeof SET !== 'undefined' ? (SET.nausea ? Math.max(SET.fov, 56) : SET.fov) : 42;
  camera.fov = w < h ? fv + 16 : fv;
  camera.updateProjectionMatrix();
  const q = REFLQ;
  reflRT.setSize(Math.max(4, Math.floor(w * PR * q)), Math.max(4, Math.floor(h * PR * q)));
  waterU.res.value.set(w * PR, h * PR);
  if (composer) {
    composer.setPixelRatio(PR);
    composer.setSize(w, h);
    bloom.resolution.set(w, h);
  }
}

/* ---------- shared helpers ---------- */
function glow(color, size, op = 0.8, fog = true) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: TEX.glow,
      color,
      transparent: true,
      opacity: op,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog,
    }),
  );
  s.scale.set(size, size, 1);
  return s;
}
const P = (o, x, y, z) => {
  o.position.set(x, y, z);
  return o;
};
function capsule(r, len, rs = 20, cs = 6) {
  const pts = [];
  for (let i = 0; i <= cs; i++) {
    const a = -Math.PI / 2 + ((i / cs) * Math.PI) / 2;
    pts.push(new V2(Math.max(1e-4, Math.cos(a) * r), Math.sin(a) * r - len / 2));
  }
  for (let i = 0; i <= cs; i++) {
    const a = ((i / cs) * Math.PI) / 2;
    pts.push(new V2(Math.max(1e-4, Math.cos(a) * r), Math.sin(a) * r + len / 2));
  }
  return new THREE.LatheGeometry(pts, rs);
}
function lathe(prof, seg = 28) {
  return new THREE.LatheGeometry(
    prof.map((p) => new V2(Math.max(1e-4, p[0]), p[1])),
    seg,
  );
}
function onSurface(m, n, dist) {
  n = n.clone().normalize();
  m.position.copy(n).multiplyScalar(dist);
  m.quaternion.setFromUnitVectors(new V3(0, 0, 1), n);
  return m;
}
function starShape(ro, ri, n = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? ri : ro,
      a = (i / (n * 2)) * TAU + Math.PI / 2;
    const x = Math.cos(a) * r,
      y = Math.sin(a) * r;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  s.closePath();
  return s;
}

/* frees geometry only; materials and textures from the kit caches are shared and stay alive */
function disposeGeometry(o) {
  o.traverse((n) => {
    if (n.geometry && !n.isSprite && !(n.geometry.userData && n.geometry.userData.keep)) n.geometry.dispose();
  });
}
function disposeTree(o) {
  o.traverse((n) => {
    if (n.geometry && !n.isSprite && !(n.geometry.userData && n.geometry.userData.keep)) n.geometry.dispose();
    const ms = Array.isArray(n.material) ? n.material : n.material ? [n.material] : [];
    ms.forEach((m) => {
      if (m.map && !(m.map.userData && m.map.userData.keep)) m.map.dispose();
      if (!(m.userData && m.userData.keep)) m.dispose();
    });
  });
}

/* particles: petals / rise / drift / stars / band / fall */
function particles(o) {
  const n = o.n,
    pos = new Float32Array(n * 3),
    base = new Float32Array(n * 3),
    sd = new Float32Array(n),
    col = o.colors ? new Float32Array(n * 3) : null;
  const sky_ = o.type === 'stars' || o.type === 'band';
  for (let i = 0; i < n; i++) {
    let x, y, z;
    if (o.type === 'stars') {
      const th = Math.random() * TAU,
        ph = Math.asin(rnd(o.minY || 0.02, 1)),
        r = 900;
      x = Math.cos(th) * Math.cos(ph) * r;
      y = Math.sin(ph) * r;
      z = Math.sin(th) * Math.cos(ph) * r;
    } else if (o.type === 'band') {
      const a = Math.random() * Math.PI,
        sp = (Math.random() + Math.random() + Math.random() - 1.5) * 0.13;
      const d = new V3(Math.cos(a), Math.sin(a) * 0.8 + sp, Math.sin(a) * 0.25 - 0.55 + sp).normalize();
      if (d.y < 0.02) d.y = Math.abs(d.y) + 0.02;
      d.normalize().multiplyScalar(880);
      x = d.x;
      y = d.y;
      z = d.z;
    } else {
      const a = Math.random() * TAU,
        d = Math.sqrt(Math.random()) * o.r;
      x = Math.cos(a) * d + (o.cx || 0);
      z = Math.sin(a) * d + (o.cz || 0);
      y = rnd(o.y0, o.y1);
    }
    pos[i * 3] = base[i * 3] = x;
    pos[i * 3 + 1] = base[i * 3 + 1] = y;
    pos[i * 3 + 2] = base[i * 3 + 2] = z;
    sd[i] = Math.random();
    if (col) {
      const c = new THREE.Color(o.colors[Math.floor(Math.random() * o.colors.length)]);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  if (col) geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({
    size: o.size,
    map: o.tex || TEX.dot,
    color: col ? 0xffffff : o.color,
    vertexColors: !!col,
    transparent: true,
    opacity: o.op == null ? 0.9 : o.op,
    depthWrite: false,
    blending: o.normal ? THREE.NormalBlending : THREE.AdditiveBlending,
    sizeAttenuation: !sky_,
    fog: !sky_,
  });
  const pts = new THREE.Points(geo, m);
  pts.frustumCulled = false;
  const op = m.opacity;
  pts.userData.update = (t, dt) => {
    if (sky_) {
      m.opacity = op * (0.82 + 0.18 * Math.sin(t * 1.3));
      return;
    }
    for (let i = 0; i < n; i++) {
      const j = i * 3,
        s = sd[i];
      if (o.type === 'fall') {
        pos[j + 1] -= (0.25 + s * 0.35) * dt;
        pos[j] += (Math.sin(t * 0.9 + s * 20) * 0.5 + 0.25) * dt;
        pos[j + 2] += Math.cos(t * 0.7 + s * 13) * 0.35 * dt;
        if (pos[j + 1] < 0.02) {
          pos[j + 1] = o.y1;
          pos[j] = base[j];
          pos[j + 2] = base[j + 2];
        }
      } else if (o.type === 'rise') {
        pos[j + 1] += (0.15 + s * 0.3) * dt;
        pos[j] = base[j] + Math.sin(t * 0.6 + s * 30) * 0.6;
        if (pos[j + 1] > o.y1) pos[j + 1] = o.y0;
      } else {
        pos[j] = base[j] + Math.sin(t * 0.35 * (o.speed || 1) + s * 9) * 1.3;
        pos[j + 1] = base[j + 1] + Math.sin(t * 0.5 * (o.speed || 1) + s * 7) * 0.5;
        pos[j + 2] = base[j + 2] + Math.cos(t * 0.3 * (o.speed || 1) + s * 5) * 1.3;
      }
    }
    geo.attributes.position.needsUpdate = true;
    if (o.twinkle) m.opacity = op * (0.7 + 0.3 * Math.sin(t * 2.1));
  };
  return pts;
}

/* outline (inverted hull, screen-steady width, optional wind sway) */
const WIND = { value: 0 };
function outlineMat(color, w, amp = 0) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    fog: true,
    clipping: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      { color: { value: new THREE.Color(color) }, w: { value: w }, uAmp: { value: amp }, uTime: { value: 0 } },
    ]),
    vertexShader: `uniform float w;uniform float uAmp;uniform float uTime;
  #include <fog_pars_vertex>
  #include <clipping_planes_pars_vertex>
  void main(){vec3 p0=position;vec3 n0=normal;vec3 ip=vec3(0.);
  #ifdef USE_INSTANCING
  ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);
  #endif
  float hw=max(position.y,0.);p0.x+=sin(uTime*1.7+ip.x*.35+ip.z*.25)*hw*hw*uAmp;p0.z+=cos(uTime*1.3+ip.x*.2-ip.z*.3)*hw*hw*uAmp*.6;
  #ifdef USE_INSTANCING
  p0=(instanceMatrix*vec4(p0,1.)).xyz;n0=mat3(instanceMatrix)*n0;
  #endif
  vec4 mvPosition=modelViewMatrix*vec4(p0,1.);vec3 n=normalize(normalMatrix*n0);mvPosition.xyz+=n*w*min(-mvPosition.z,22.)*.1;gl_Position=projectionMatrix*mvPosition;
  #include <clipping_planes_vertex>
  #include <fog_vertex>
  }`,
    fragmentShader: `uniform vec3 color;
  #include <fog_pars_fragment>
  #include <clipping_planes_pars_fragment>
  void main(){
  #include <clipping_planes_fragment>
  gl_FragColor=vec4(color,1.);
  #include <fog_fragment>
  }`,
  });
  m.uniforms.uTime = WIND;
  return m;
}
function windMat(mat, amp) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = WIND;
    sh.vertexShader =
      'uniform float uTime;\n' +
      sh.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
  vec3 ip=vec3(0.);
  #ifdef USE_INSTANCING
  ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);
  #endif
  float hw=max(position.y,0.);
  transformed.x+=sin(uTime*1.7+ip.x*.35+ip.z*.25)*hw*hw*${amp.toFixed(3)};
  transformed.z+=cos(uTime*1.3+ip.x*.2-ip.z*.3)*hw*hw*${amp.toFixed(3)}*.6;`,
      );
  };
  mat.customProgramCacheKey = () => 'wind' + amp;
  return mat;
}
/* build one geometry from colored parts: [geo,color,[x,y,z],[rx,ry,rz],[sx,sy,sz]] */
function partsGeo(parts) {
  const pos = [],
    nor = [],
    col = [];
  const m = new THREE.Matrix4(),
    q = new THREE.Quaternion(),
    e = new THREE.Euler();
  for (const [g0, c, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]] of parts) {
    const g = g0.index ? g0.toNonIndexed() : g0.clone();
    m.compose(new V3(p[0], p[1], p[2]), q.setFromEuler(e.set(r[0], r[1], r[2])), new V3(s[0], s[1], s[2]));
    g.applyMatrix4(m);
    const A = g.attributes.position.array,
      N = g.attributes.normal.array,
      cc = new THREE.Color(c);
    for (let i = 0; i < A.length; i++) {
      pos.push(A[i]);
      nor.push(N[i]);
    }
    for (let i = 0; i < A.length / 3; i++) col.push(cc.r, cc.g, cc.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}
/* instanced plants with wind sway and outlines. list: [x,y,z,rotY,scale] */
function flora(geo, list, amp, ink = true, inkW = 0.011) {
  const mat = windMat(new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: toonGrad }), amp);
  const im = new THREE.InstancedMesh(geo, mat, list.length),
    d = new THREE.Object3D();
  list.forEach((a, i) => {
    d.position.set(a[0], a[1], a[2]);
    d.rotation.set(0, a[3], 0);
    d.scale.setScalar(a[4]);
    d.updateMatrix();
    im.setMatrixAt(i, d.matrix);
  });
  im.instanceMatrix.needsUpdate = true;
  im.receiveShadow = true;
  im.userData.noInk = true;
  im.layers.set(1);
  {
    let mx = 1e9,
      Mx = -1e9,
      mz = 1e9,
      Mz = -1e9,
      my = 1e9,
      My = -1e9;
    list.forEach((a) => {
      mx = Math.min(mx, a[0]);
      Mx = Math.max(Mx, a[0]);
      mz = Math.min(mz, a[2]);
      Mz = Math.max(Mz, a[2]);
      my = Math.min(my, a[1]);
      My = Math.max(My, a[1]);
    });
    const c = new V3((mx + Mx) / 2, (my + My) / 2 + 0.5, (mz + Mz) / 2);
    geo.boundingSphere = new THREE.Sphere(c, Math.hypot(Mx - mx, Mz - mz) / 2 + 2);
    W.lod.push({ g: im, x: c.x, z: c.z, far: 90 + geo.boundingSphere.radius });
  }
  if (ink) {
    const h = new THREE.InstancedMesh(geo, outlineMat(0x2e3a59, inkW, amp), list.length);
    h.instanceMatrix = im.instanceMatrix;
    h.userData.isInk = true;
    h.layers.set(1);
    im.add(h);
  }
  return im;
}
/* merge static meshes inside a group by material (skips userData.dynamic subtrees) */
function mergeGroup(group) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const buckets = new Map(),
    victims = [];
  const sol = group.userData.solids || (group.userData.solids = []);
  group.traverse((n) => {
    if (!n.isMesh || n.isInstancedMesh || n.userData.isInk || n.userData.keepAlone) return;
    let p = n,
      dyn = false,
      walk = !!n.userData.walk;
    while (p && p !== group) {
      if (p.userData.dynamic) {
        dyn = true;
        break;
      }
      if (p.userData.walk) walk = true;
      p = p.parent;
    }
    if (dyn) return;
    if (n.children.length) return;
    if (!walk && !n.userData.merged && !(n.material.transparent && n.material.opacity < 0.9)) {
      const g = n.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      const bb = g.boundingBox,
        m = new THREE.Matrix4().multiplyMatrices(inv, n.matrixWorld),
        a = new Float32Array(24);
      let i = 0;
      for (const x of [bb.min.x, bb.max.x])
        for (const y of [bb.min.y, bb.max.y])
          for (const z of [bb.min.z, bb.max.z]) {
            const v = new THREE.Vector3(x, y, z).applyMatrix4(m);
            a[i++] = v.x;
            a[i++] = v.y;
            a[i++] = v.z;
          }
      sol.push(a);
    }
    const key = n.material.uuid + (n.castShadow ? 'c' : '');
    if (!buckets.has(key)) buckets.set(key, { mat: n.material, cast: n.castShadow, noInk: false, items: [] });
    const b = buckets.get(key);
    if (n.userData.noInk) b.noInk = true;
    b.items.push({ geo: n.geometry, m: new THREE.Matrix4().multiplyMatrices(inv, n.matrixWorld) });
    victims.push(n);
  });
  victims.forEach((n) => n.parent.remove(n));
  for (const b of buckets.values()) {
    let total = 0;
    const gs = b.items.map((it) => {
      const g = it.geo.index ? it.geo.toNonIndexed() : it.geo.clone();
      g.applyMatrix4(it.m);
      total += g.attributes.position.count;
      return g;
    });
    const vc = !!b.mat.vertexColors,
      pos = new Float32Array(total * 3),
      nor = new Float32Array(total * 3),
      col = vc ? new Float32Array(total * 3) : null;
    let o = 0;
    gs.forEach((g) => {
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      if (vc) {
        if (g.attributes.color) col.set(g.attributes.color.array, o * 3);
        else col.fill(1, o * 3, (o + g.attributes.position.count) * 3);
      }
      o += g.attributes.position.count;
      g.dispose();
    });
    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    mg.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    if (vc) mg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    mg.computeBoundingSphere();
    const mm = new THREE.Mesh(mg, b.mat);
    mm.userData.merged = true;
    mm.castShadow = b.cast;
    mm.receiveShadow = true;
    if (b.noInk) mm.userData.noInk = true;
    group.add(mm);
  }
  return group;
}
function jitterGeo(geo, amt) {
  const p = geo.attributes.position,
    m = {};
  for (let i = 0; i < p.count; i++) {
    const k = Math.round(p.getX(i) * 300) + '_' + Math.round(p.getY(i) * 300) + '_' + Math.round(p.getZ(i) * 300);
    let o = m[k];
    if (!o) o = m[k] = [(R() - 0.5) * amt, (R() - 0.5) * amt, (R() - 0.5) * amt];
    p.setXYZ(i, p.getX(i) + o[0], p.getY(i) + o[1], p.getZ(i) + o[2]);
  }
  geo.computeVertexNormals();
  return geo;
}
