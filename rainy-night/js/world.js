/* world.js — 静态场景：天空、底座、道路、便利店、街角道具 */
'use strict';

const GROUND_Y = 0.0;      // 底座顶面
const ROAD_Y = 0.06;       // 路面顶
const WALK_Y = 0.16;       // 人行道顶

/* ============================================================ 天空 + 底座 */
function buildBaseAndSky(scene){
  // 夜空穹顶
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: [
      'varying vec3 vP;',
      'void main(){',
      '  float h = normalize(vP).y;',
      '  vec3 top = vec3(0.008,0.016,0.052);',
      '  vec3 mid = vec3(0.032,0.052,0.125);',
      '  vec3 hor = vec3(0.085,0.110,0.215);',
      '  vec3 col = mix(hor, mid, smoothstep(0.0,0.30,h));',
      '  col = mix(col, top, smoothstep(0.24,0.75,h));',
      '  col = mix(vec3(0.015,0.020,0.050), col, smoothstep(-0.3,0.02,h));',
      '  col += vec3(0.06,0.045,0.07) * exp(-abs(h-0.02)*9.0);', // 城市微光
      '  gl_FragColor = vec4(col,1.0);',
      '}'
    ].join('\n')
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 24, 16), skyMat);
  sky.renderOrder = -2;
  scene.add(sky);

  // 月亮
  sprite(scene, 0xcfdcff, 5, 5, -34, 44, -52, 0.85);
  sprite(scene, 0x9db4ff, 17, 17, -34, 44, -52, 0.2);
  S.r.moonSprite = S.r.moonSprite;

  // 底座（展示台）
  const slabMat = toon(0x232c42);
  const slab = box(scene, 41, 1.5, 41, slabMat, 0, -0.75, 0, { outline: 0.06, cast: false });
  slab.receiveShadow = false;
  box(scene, 42.4, 0.6, 42.4, toon(0x141a2b), 0, -1.8, 0, { outline: 0.06, cast: false, recv: false });
  // 底座投影（悬浮感）
  const sh = new THREE.Mesh(
    new THREE.CircleGeometry(24, 32),
    new THREE.MeshBasicMaterial({ map: glowTexture(), color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false })
  );
  sh.rotation.x = -Math.PI / 2; sh.position.y = -3.4;
  scene.add(sh);

  // 底座铭牌
  const plateTex = makeTex(768, 128, function(g, w, h){
    g.fillStyle = '#10141f'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#3d4a66'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#c9d4e8'; g.font = fontOf(64, 'bold'); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('一休仓买 · 雨夜街角', w / 2, h / 2 + 2);
  });
  box(scene, 3.2, 0.5, 0.1, new THREE.MeshBasicMaterial({ map: plateTex }), 0, -0.5, 20.53, { cast: false, recv: false });
}

/* ============================================================ 湿地 / 路面着色器 */
const RIP_N = 14;
const sharedRip = { value: [] };
for (let i = 0; i < RIP_N; i++) sharedRip.value.push(new THREE.Vector4(0, 0, -100, 0));
const sharedTime = { value: 0 };

const WET_VERT = [
  'varying vec3 vW; varying vec2 vUv;',
  'void main(){',
  '  vec4 wp = modelMatrix * vec4(position,1.0);',
  '  vW = wp.xyz; vUv = uv;',
  '  gl_Position = projectionMatrix * viewMatrix * wp;',
  '}'
].join('\n');

const WET_FRAG = [
  'uniform float uTime; uniform vec4 uRip[' + RIP_N + '];',
  'uniform float uMode; uniform float uBoost; uniform float uAlpha;',
  'uniform vec3 uBase1; uniform vec3 uBase2;',
  'uniform vec3 uLPos[6]; uniform vec3 uLCol[6]; uniform float uLStr[6];',
  'varying vec3 vW; varying vec2 vUv;',
  'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }',
  'float vnoise(vec2 p){',
  '  vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);',
  '  float a = hash(i); float b = hash(i+vec2(1.0,0.0));',
  '  float c = hash(i+vec2(0.0,1.0)); float d = hash(i+vec2(1.0,1.0));',
  '  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);',
  '}',
  'void main(){',
  '  vec2 f = vW.xz;',
  '  float n = vnoise(f*1.4)*0.65 + vnoise(f*5.5)*0.35;',
  '  vec3 col = mix(uBase1, uBase2, n);',
  '  col *= 0.88 + 0.24*vnoise(f*0.33);',
  '  float streakAll = 0.0;',
  '  for(int i=0;i<6;i++){',
  '    vec2 L = uLPos[i].xz;',
  '    vec2 toL = L - f; vec2 toC = cameraPosition.xz - f;',
  '    float dl = max(length(toL), 0.001); float dc = max(length(toC), 0.001);',
  '    float between = clamp(-dot(toL/dl, toC/dc), 0.0, 1.0);',
  '    float fall = exp(-dl*0.14);',
  '    float streak = pow(between, 55.0) * fall * uLStr[i] * uBoost;',
  '    float sheen = pow(between, 7.0) * fall * uLStr[i] * 0.12 * uBoost;',
  '    streakAll += streak;',
  '    col += uLCol[i] * (streak * (0.6 + 0.4*vnoise(f*3.1 + uTime*0.8)) + sheen);',
  '  }',
  '  float rip = 0.0;',
  '  for(int i=0;i<' + RIP_N + ';i++){',
  '    vec4 R = uRip[i]; float age = uTime - R.z;',
  '    if(R.w > 0.0 && age > 0.0 && age < 2.0){',
  '      float d = distance(f, R.xy);',
  '      rip += sin(d*26.0 - age*12.0) * exp(-d*2.6) * exp(-age*2.8) * R.w;',
  '    }',
  '  }',
  '  col += vec3(0.55,0.68,0.95) * rip * 0.30 * uBoost;',
  '  float paint = 0.0;',
  '  if(uMode < 0.5){', // 纵向路：斑马线 / 停止线 / 中线虚线 / 边线
  '    if(f.x>4.05 && f.x<9.95 && abs(f.y)<1.5 && fract((f.x-4.0)/0.9)<0.52) paint = 1.0;',
  '    if(f.x>4.05 && f.x<9.95 && f.y>1.9 && f.y<2.25) paint = max(paint, 0.9);',
  '    if(abs(f.x-7.0)<0.07 && fract(f.y/2.6)<0.55) paint = max(paint, 0.7);',
  '    if((abs(f.x-4.45)<0.05 || abs(f.x-9.55)<0.05) && f.y>-20.0 && f.y<7.0) paint = max(paint, 0.55);',
  '  } else if(uMode < 1.5){', // 横向路：中线虚线 / 停车位框
  '    if(abs(f.y-10.0)<0.07 && fract(f.x/2.6)<0.55) paint = max(paint, 0.7);',
  '    if(f.x>-14.05 && f.x<-8.95 && f.y>7.65 && f.y<10.55){',
  '      float b = step(abs(f.x+14.0),0.09) + step(abs(f.x+9.0),0.09) + step(abs(f.y-7.7),0.09) + step(abs(f.y-10.5),0.09);',
  '      paint = max(paint, min(b,1.0)*0.8);',
  '    }',
  '  }',
  '  col = mix(col, vec3(0.58,0.64,0.74), paint*0.8);',
  '  col += vec3(0.75,0.82,1.0) * paint * (streakAll*0.9 + rip*0.6 + 0.05);',
  '  float a = uAlpha;',
  '  if(uAlpha < 1.0){ a *= smoothstep(0.5, 0.36, length(vUv-0.5)); }',
  '  gl_FragColor = vec4(col, a);',
  '}'
].join('\n');

function wetMat(base1, base2, mode, opt){
  opt = opt || {};
  return new THREE.ShaderMaterial({
    transparent: !!opt.transparent,
    depthWrite: opt.transparent ? false : true,
    uniforms: {
      uTime: sharedTime, uRip: sharedRip,
      uMode: { value: mode },
      uBoost: { value: opt.boost || 1 },
      uAlpha: { value: opt.alpha === undefined ? 1 : opt.alpha },
      uBase1: { value: new THREE.Color(base1) },
      uBase2: { value: new THREE.Color(base2) },
      uLPos: { value: WET_LIGHTS.map(function(l){ return l.pos; }) },
      uLCol: { value: WET_LIGHTS.map(function(l){ return l.col; }) },
      uLStr: { value: WET_LIGHTS.map(function(l){ return l.str; }) }
    },
    vertexShader: WET_VERT,
    fragmentShader: WET_FRAG
  });
}

/* ============================================================ 地面系统 */
function buildGround(scene){
  const roadMatA = wetMat(0x1c2436, 0x28324a, 0);
  const roadMatB = wetMat(0x1c2436, 0x28324a, 1);
  const roadMatC = wetMat(0x1c2436, 0x28324a, 2);
  const sideMat = wetMat(0x1c2436, 0x28324a, 2);

  // 路面
  box(scene, 6, ROAD_Y, 27, roadMatA, 7, ROAD_Y / 2, -6.5, { cast: false });          // 纵向路
  box(scene, 24, ROAD_Y, 6, roadMatB, -8, ROAD_Y / 2, 10, { cast: false });           // 横向路左
  box(scene, 4, ROAD_Y, 6, roadMatB, 12, ROAD_Y / 2, 10, { cast: false });            // 横向路右
  box(scene, 6, ROAD_Y, 6, roadMatC, 7, ROAD_Y / 2, 10, { cast: false });             // 路口

  // 人行道（主街区整片）
  const walkTex = makeTex(256, 256, function(g){
    g.fillStyle = '#66718a'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#565f76'; g.lineWidth = 4;
    for (let i = 0; i <= 2; i++){
      g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 256); g.stroke();
      g.beginPath(); g.moveTo(0, i * 128); g.lineTo(256, i * 128); g.stroke();
    }
    g.fillStyle = 'rgba(30,38,58,0.15)';
    for (let i = 0; i < 26; i++){ g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 6 + Math.random() * 16, 0, 7); g.fill(); }
  });
  walkTex.wrapS = walkTex.wrapT = THREE.RepeatWrapping;
  walkTex.repeat.set(12, 13.5);
  const walkMat = new THREE.MeshPhongMaterial({ map: walkTex, shininess: 22, specular: 0x1c2436 });

  box(scene, 24, WALK_Y, 27, walkMat, -8, WALK_Y / 2, -6.5, { cast: false });   // 主街区
  box(scene, 2, WALK_Y, 27, walkMat, 11, WALK_Y / 2, -6.5, { cast: false });    // 对街人行道
  box(scene, 34, WALK_Y, 2, walkMat, -3, WALK_Y / 2, 14, { cast: false });      // 对街人行道(横)
  // 对街建筑基座
  const bgBase = toon(0x2a3143);
  box(scene, 8, WALK_Y, 27, bgBase, 16, WALK_Y / 2, -6.5, { cast: false });
  box(scene, 6, WALK_Y, 13, bgBase, 17, WALK_Y / 2, 13.5, { cast: false });
  box(scene, 32, WALK_Y, 5, bgBase, -4, WALK_Y / 2, 17.5, { cast: false });

  // 路缘石
  const curbMat = toon(0x8b94a8);
  box(scene, 0.3, 0.22, 27, curbMat, 4.05, 0.11, -6.5);
  box(scene, 0.3, 0.22, 27, curbMat, 9.95, 0.11, -6.5);
  box(scene, 24, 0.22, 0.3, curbMat, -8, 0.11, 7.05);
  box(scene, 4, 0.22, 0.3, curbMat, 12, 0.11, 7.05);
  box(scene, 34, 0.22, 0.3, curbMat, -3, 0.11, 12.95);

  // 排水沟（贴路缘的暗槽）+ 雨水篦
  const gutMat = toon(0x0d1220);
  box(scene, 0.22, 0.02, 26.6, gutMat, 4.3, ROAD_Y + 0.01, -6.6, { cast: false });
  box(scene, 0.22, 0.02, 26.6, gutMat, 9.7, ROAD_Y + 0.01, -6.6, { cast: false });
  box(scene, 23.6, 0.02, 0.22, gutMat, -8.2, ROAD_Y + 0.01, 7.3, { cast: false });
  box(scene, 33.6, 0.02, 0.22, gutMat, -3, ROAD_Y + 0.01, 12.7, { cast: false });
  const grate = new THREE.Group(); scene.add(grate);
  box(grate, 0.55, 0.03, 0.4, toon(0x39414f), 4.62, ROAD_Y + 0.02, 6.2, { cast: false });
  for (let i = 0; i < 6; i++) box(grate, 0.55, 0.045, 0.035, toon(0x11161f), 4.62, ROAD_Y + 0.03, 6.05 + i * 0.062, { cast: false });

  // 积水坑（镜面着色器）
  const puddles = [
    { x: -13, z: 9.6, rx: 2.6, rz: 1.2 }, { x: -5, z: 11.5, rx: 2.1, rz: 0.9 },
    { x: 1.5, z: 12.2, rx: 1.5, rz: 0.7 }, { x: 12, z: 10, rx: 1.8, rz: 0.8 },
    { x: 7, z: 0.5, rx: 2.2, rz: 1.0 }, { x: 7, z: -12, rx: 1.9, rz: 0.8 },
    { x: 5.5, z: -5.5, rx: 1.3, rz: 0.6 }, { x: 6.5, z: 10.8, rx: 1.2, rz: 0.6 },
    { x: -10.8, z: 5.15, rx: 0.8, rz: 0.45 }, { x: -5.4, z: 5.2, rx: 0.8, rz: 0.45 },
    { x: -1.2, z: 0.4, rx: 1.3, rz: 0.7 }, { x: 11, z: 4.5, rx: 0.9, rz: 0.5 }
  ];
  const pudMat = wetMat(0x0c1220, 0x161e32, 2, { transparent: true, alpha: 0.92, boost: 2.3 });
  puddles.forEach(function(p){
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 28), pudMat);
    m.rotation.x = -Math.PI / 2;
    m.scale.set(p.rx, p.rz, 1);
    m.position.set(p.x, ROAD_Y + 0.018, p.z);
    m.renderOrder = 2;
    scene.add(m);
    S.puddles.push(p);
  });

  // 非机动车停放区地标（人行道贴地）
  const bikeZoneTex = makeTex(512, 224, function(g, w, h){
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(235,240,248,0.9)'; g.lineWidth = 8; g.setLineDash([34, 22]);
    g.strokeRect(10, 10, w - 20, h - 20);
    g.setLineDash([]);
    g.fillStyle = 'rgba(235,240,248,0.92)';
    g.font = fontOf(34, 'bold'); g.textAlign = 'center';
    g.fillText('非机动车停放区', w / 2, 52);
    // 简笔自行车
    g.lineWidth = 7; g.strokeStyle = 'rgba(235,240,248,0.9)';
    g.beginPath(); g.arc(190, 150, 34, 0, 7); g.stroke();
    g.beginPath(); g.arc(310, 150, 34, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(190, 150); g.lineTo(232, 96); g.lineTo(292, 96); g.lineTo(310, 150);
    g.lineTo(232, 96); g.lineTo(218, 150); g.lineTo(190, 150); g.stroke();
    g.beginPath(); g.moveTo(282, 88); g.lineTo(298, 74); g.lineTo(312, 82); g.stroke();
  });
  plane(scene, 3.5, 1.5, new THREE.MeshBasicMaterial({ map: bikeZoneTex, transparent: true, depthWrite: false }), -3.4, WALK_Y + 0.012, 6.15, { rx: -Math.PI / 2, renderOrder: 3 });
}

/* ============================================================ 便利店外观 */
function buildStoreExterior(scene){
  const g = new THREE.Group(); scene.add(g);
  const wallMat = toon(0xf0e7d3);
  const bandMat = toon(0x39435a);
  const frameMat = toon(0x2b3244);
  const roofMat = toon(0x2b3346);
  const glassMat = new THREE.MeshPhongMaterial({ color: 0x9db8d8, transparent: true, opacity: 0.1, shininess: 90, specular: 0xaaccee, depthWrite: false });
  const H = 5.2, y0 = WALK_Y;

  // 墙体
  box(g, 10.5, H - y0, 0.25, wallMat, -7, (y0 + H) / 2, -5.875, { outline: 0.045 });            // 后墙
  box(g, 0.25, H - y0, 9.5, wallMat, -11.875, (y0 + H) / 2, -1.5, { outline: 0.045 });          // 左墙
  // 右墙（带侧窗）
  box(g, 0.25, H - y0, 5.6, wallMat, -2.125, (y0 + H) / 2, -3.2, { outline: 0.045 });
  box(g, 0.25, 0.74, 3.0, wallMat, -2.125, y0 + 0.37, 1.1);
  box(g, 0.25, 1.8, 3.0, wallMat, -2.125, H - 0.9, 1.1);
  S.glassPanes.push({ x0: -0.4 + 0, x1: 0, y0: 0, y1: 0 }); // 占位防误用
  S.glassPanes.pop();
  const sideGlass = plane(g, 2.9, 2.5, glassMat, -2.125, 2.15, 1.1, { ry: Math.PI / 2, renderOrder: 6 });
  sideGlass.rotation.y = Math.PI / 2;

  // 前墙分段（左窗 / 自动门 / 右窗）
  box(g, 0.4, H - y0, 0.25, wallMat, -11.8, (y0 + H) / 2, 2.875, { outline: 0.04 });
  box(g, 9.2, 0.59, 0.25, bandMat, -7, y0 + 0.295, 2.875, { outline: 0.03 });                    // 踢脚带
  box(g, 9.2, 0.65, 0.25, wallMat, -7, H - 0.325, 2.875, { outline: 0.03 });                     // 门头带
  box(g, 0.25, 3.8, 0.25, wallMat, -8.375, y0 + 0.59 + 1.9, 2.875, { outline: 0.03 });
  box(g, 0.25, 3.8, 0.25, wallMat, -5.625, y0 + 0.59 + 1.9, 2.875, { outline: 0.03 });
  box(g, 0.4, 3.8, 0.25, wallMat, -2.2, y0 + 0.59 + 1.9, 2.875, { outline: 0.03 });

  // 玻璃橱窗
  const winY = y0 + 0.59 + 1.9;
  plane(g, 3.1, 3.8, glassMat, -10.05, winY, 2.878, { renderOrder: 6 });
  plane(g, 3.1, 3.8, glassMat, -3.95, winY, 2.878, { renderOrder: 6 });
  box(g, 0.06, 3.8, 0.09, frameMat, -10.05, winY, 2.885);
  box(g, 0.06, 3.8, 0.09, frameMat, -3.95, winY, 2.885);
  box(g, 3.1, 0.06, 0.09, frameMat, -10.05, winY + 1.9, 2.885);
  box(g, 3.1, 0.06, 0.09, frameMat, -3.95, winY + 1.9, 2.885);
  S.glassPanes.push({ x0: -11.55, x1: -8.55, y0: y0 + 0.7, y1: H - 0.62, z: 2.9 });
  S.glassPanes.push({ x0: -5.45, x1: -2.45, y0: y0 + 0.7, y1: H - 0.62, z: 2.9 });
  S.glassPanes.push({ x0: 1.1 - 1.35, x1: 1.1 + 1.35 - 2.4, y0: y0 + 0.8, y1: 3.3, z: -2.1, side: true });

  // 屋顶 + 女儿墙
  box(g, 10.9, 0.38, 9.9, roofMat, -7, H + 0.19, -1.5, { outline: 0.05 });
  box(g, 10.9, 0.5, 0.18, roofMat, -7, H + 0.6, 3.32);
  box(g, 0.18, 0.5, 9.9, roofMat, -12.28, H + 0.6, -1.5);
  box(g, 0.18, 0.5, 9.9, roofMat, -1.72, H + 0.6, -1.5);

  // —— 主招牌「一休仓买」 ——
  const signTex = makeTex(1536, 288, function(g2, w, h){
    g2.fillStyle = '#fbf3e2'; g2.fillRect(0, 0, w, h);
    g2.strokeStyle = '#22283a'; g2.lineWidth = 16; g2.strokeRect(8, 8, w - 16, h - 16);
    g2.fillStyle = '#ff8a3d'; g2.beginPath(); g2.arc(160, 144, 98, 0, 7); g2.fill();
    g2.fillStyle = '#ffffff'; g2.font = fontOf(112, '900'); g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.fillText('休', 160, 154);
    g2.fillStyle = '#e2482f'; g2.textAlign = 'left';
    g2.font = fontOf(196, '900'); g2.fillText('一休仓买', 310, 150);
    rr(g2, 1290, 58, 190, 124, 22); g2.fill();
    g2.fillStyle = '#ffffff'; g2.font = fontOf(70, '900'); g2.textAlign = 'center';
    g2.fillText('24H', 1385, 116);
    g2.font = fontOf(46, 'bold'); g2.fillText('便利店', 1385, 164);
  });
  const signMat = new THREE.MeshBasicMaterial({ map: signTex });
  const darkMat = toon(0x232a3a);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(10.4, 1.15, 0.55),
    [darkMat, darkMat, darkMat, darkMat, signMat, darkMat]);
  sign.position.set(-7, H + 1.15, 3.25);
  sign.castShadow = true;
  outline(sign, 0.05);
  g.add(sign);
  S.r.signMat = signMat;

  // 招牌下沿灯带 + 光晕
  const stripMat = new THREE.MeshBasicMaterial({ color: 0xffe2b0 });
  box(g, 9.6, 0.1, 0.14, stripMat, -7, H + 0.52, 3.42, { cast: false, recv: false });
  S.r.stripMats = [stripMat];
  S.r.signGlow = sprite(g, 0xffa96b, 10, 4.4, -7, H + 1.1, 4.0, 0.17);
  sprite(g, 0xff9a5c, 5, 3, -7, H + 1.0, 4.4, 0.2);

  // —— 雨棚（通长条纹） ——
  const awnTex = makeTex(512, 512, function(g2){
    g2.fillStyle = '#2f6f66'; g2.fillRect(0, 0, 512, 512);
    g2.fillStyle = '#e8e2cf';
    for (let i = 0; i < 8; i += 2) g2.fillRect(i * 64, 0, 64, 512);
  });
  awnTex.wrapS = THREE.RepeatWrapping; awnTex.repeat.set(2.2, 1);
  const awnMat = toon(0xffffff, { map: awnTex });
  const awn = box(g, 10.7, 0.1, 2.1, awnMat, -7, 4.32, 4.05, { rx: -0.13, outline: 0.035, cast: true });
  const valTex = makeTex(2048, 128, function(g2, w, h){
    g2.fillStyle = '#2a5f57'; g2.fillRect(0, 0, w, h);
    g2.fillStyle = '#f3ecd8'; g2.font = fontOf(78, 'bold'); g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.fillText('一休仓买 · 24H 便利店 · 一休仓买 · 24H 便利店 ·', w / 2, h / 2 + 2);
  });
  valTex.wrapS = THREE.RepeatWrapping; valTex.repeat.set(1.1, 1);
  box(g, 10.7, 0.42, 0.07, toon(0xffffff, { map: valTex }), -7, 4.0, 5.05, { outline: 0.03 });
  tube(g, new THREE.Vector3(-12.25, 4.3, 5.0), new THREE.Vector3(-12.25, 0.6, 5.0), 0.03, frameMat);
  tube(g, new THREE.Vector3(-1.75, 4.3, 5.0), new THREE.Vector3(-1.75, 0.6, 5.0), 0.03, frameMat);
  // 檐口滴水点
  [[-10.8, 3.94, 5.02], [-8.9, 3.97, 5.02], [-5.4, 4.02, 5.02], [-2.6, 4.06, 5.02]].forEach(function(p){
    S.dripEmitters.push({ x: p[0], y: p[1], z: p[2] });
  });

  // —— 自动门 ——
  const doorGlass = new THREE.MeshPhongMaterial({ color: 0xa8c4e0, transparent: true, opacity: 0.16, shininess: 90, specular: 0xbbd4ee, depthWrite: false });
  const doorFrame = toon(0x39435a);
  function doorPanel(cx){
    const p = new THREE.Group();
    const gl = plane(p, 1.16, 3.55, doorGlass, 0, 0, 0, { renderOrder: 7 });
    box(p, 1.2, 0.28, 0.07, doorFrame, 0, -1.85, 0, { cast: false });
    box(p, 1.2, 0.16, 0.07, doorFrame, 0, 1.85, 0, { cast: false });
    box(p, 0.07, 3.6, 0.07, doorFrame, -0.58, 0, 0, { cast: false });
    box(p, 0.07, 3.6, 0.07, doorFrame, 0.58, 0, 0, { cast: false });
    p.position.set(cx, y0 + 0.59 + 1.9, 2.86);
    g.add(p);
    return p;
  }
  S.r.doorL = doorPanel(-7.62);
  S.r.doorR = doorPanel(-6.38);
  box(g, 2.8, 0.14, 0.22, doorFrame, -7, H - 0.52, 2.87, { cast: false }); // 门机
  const welcomeTex = makeTex(512, 96, function(g2, w, h){
    g2.clearRect(0, 0, w, h);
    g2.fillStyle = '#d8352a'; g2.font = fontOf(58, 'bold'); g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.fillText('欢 迎 光 临', w / 2, h / 2);
  });
  plane(g, 2.3, 0.4, new THREE.MeshBasicMaterial({ map: welcomeTex, transparent: true }), -7, H - 0.12, 3.015, { renderOrder: 5 });
  // 门内透光地垫
  const matTex = makeTex(256, 128, function(g2, w, h){
    g2.fillStyle = '#2f4a3e'; g2.fillRect(0, 0, w, h);
    g2.strokeStyle = '#243b31'; g2.lineWidth = 6; g2.strokeRect(8, 8, w - 16, h - 16);
    // Box顶面UV相对+z视角水平镜像，预先翻转
    g2.save(); g2.translate(w, 0); g2.scale(-1, 1);
    g2.fillStyle = '#cfe0c8'; g2.font = fontOf(34, 'bold'); g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.fillText('欢迎光临', w / 2, h / 2 + 2);
    g2.restore();
  });
  box(g, 2.3, 0.035, 0.85, toon(0xffffff, { map: matTex }), -7, WALK_Y + 0.02, 4.1, { cast: false });
  // 开门光幕
  S.r.doorShaft = plane(g, 2.35, 3.9, new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), -7, y0 + 2.1, 3.05, { renderOrder: 8 });
  S.r.doorPool = pool(g, 0xffd9a0, 1.9, -7, ROAD_Y + 0.03, 4.6, 0);

  // 橱窗海报
  function posterTex(title, sub, bg, fg){
    return makeTex(256, 352, function(g2, w, h){
      g2.fillStyle = bg; g2.fillRect(0, 0, w, h);
      g2.strokeStyle = 'rgba(255,255,255,0.75)'; g2.lineWidth = 6; g2.strokeRect(10, 10, w - 20, h - 20);
      g2.fillStyle = fg; g2.textAlign = 'center';
      g2.font = fontOf(64, '900'); g2.fillText(title, w / 2, 120);
      g2.font = fontOf(40, 'bold');
      const lines = sub.split('\n');
      lines.forEach(function(t, i){ g2.fillText(t, w / 2, 200 + i * 52); });
      g2.fillStyle = 'rgba(255,255,255,0.35)';
      g2.fillRect(40, h - 80, w - 80, 8);
    });
  }
  const pMat1 = new THREE.MeshBasicMaterial({ map: posterTex('关东煮', '热卖中\n暖冬限定', '#d8543c', '#fff4e0') });
  const pMat2 = new THREE.MeshBasicMaterial({ map: posterTex('新品', '饭团上新\n第二件半价', '#2e6da8', '#fdf6e8') });
  const pMat3 = new THREE.MeshBasicMaterial({ map: posterTex('咖啡', '现磨美式\n买一送一', '#6b4a34', '#ffeeda') });
  plane(g, 0.85, 1.15, pMat1, -10.6, 3.6, 2.95, { renderOrder: 5 });
  plane(g, 0.85, 1.15, pMat2, -3.5, 3.6, 2.95, { renderOrder: 5 });
  plane(g, 0.85, 1.15, pMat3, -4.4, 2.0, 2.95, { renderOrder: 5 });

  // 外墙空调外机（左侧）+ 落水管
  const acMat = toon(0xd8dde6);
  function acUnit(parent, x, y, z, ry, s){
    s = s || 1;
    const u = new THREE.Group(); parent.add(u);
    u.position.set(x, y, z); u.rotation.y = ry || 0;
    box(u, 0.8 * s, 0.62 * s, 0.34 * s, acMat, 0, 0, 0, { outline: 0.03 });
    box(u, 0.7 * s, 0.5 * s, 0.03, toon(0x4a5468), 0, 0.02, 0.18 * s, { cast: false });
    cyl(u, 0.16 * s, 0.16 * s, 0.03, toon(0x2b3244), 0, 0.02, 0.2 * s, { rx: Math.PI / 2, cast: false });
    box(u, 0.82 * s, 0.05, 0.4 * s, toon(0x39435a), 0, -0.34 * s, 0, { cast: false });
    return u;
  }
  acUnit(g, -12.35, 3.2, -2.2, Math.PI / 2);
  S.dripEmitters.push({ x: -12.6, y: 2.85, z: -1.95 });
  tube(g, new THREE.Vector3(-11.83, 5.3, 2.72), new THREE.Vector3(-11.83, 0.2, 2.72), 0.055, toon(0x9aa2b2));
  tube(g, new THREE.Vector3(-11.83, 5.3, 2.72), new THREE.Vector3(-11.2, 5.6, 2.5), 0.055, toon(0x9aa2b2));

  // 屋顶设备 + 天线
  box(g, 0.9, 0.55, 0.7, acMat, -9.6, H + 0.66, -3.6, { outline: 0.03 });
  cyl(g, 0.2, 0.2, 0.05, toon(0x2b3244), -9.6, H + 0.96, -3.6, { cast: false });
  box(g, 0.8, 0.5, 0.6, acMat, -4.6, H + 0.63, -1.2, { outline: 0.03 });
  cyl(g, 0.09, 0.09, 1.1, toon(0x8f96a4), -2.6, H + 1.0, -4.5);
  tube(g, new THREE.Vector3(-9, H + 0.38, -2), new THREE.Vector3(-9, H + 1.75, -2), 0.022, toon(0x39435a));
  S.r.antennaTop = new THREE.Vector3(-9, H + 1.75, -2);
}

/* ============================================================ 便利店内部 */
function buildStoreInterior(scene){
  const g = new THREE.Group(); scene.add(g);
  const F = WALK_Y + 0.06; // 店内地坪
  const tileTex = makeTex(256, 256, function(g2){
    g2.fillStyle = '#d8c9a8'; g2.fillRect(0, 0, 256, 256);
    g2.strokeStyle = '#c2b28e'; g2.lineWidth = 3;
    for (let i = 0; i <= 4; i++){
      g2.beginPath(); g2.moveTo(i * 64, 0); g2.lineTo(i * 64, 256); g2.stroke();
      g2.beginPath(); g2.moveTo(0, i * 64); g2.lineTo(256, i * 64); g2.stroke();
    }
  });
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping; tileTex.repeat.set(5, 4.5);
  const floorMat = new THREE.MeshPhongMaterial({ map: tileTex, shininess: 34, specular: 0x2a2a22, emissive: 0x241c12 });
  box(g, 9.4, 0.06, 8.4, floorMat, -7, WALK_Y + 0.03, -1.6, { cast: false });
  // 地面导视条
  const guideMat = new THREE.MeshBasicMaterial({ color: 0xffe9c4 });
  plane(g, 0.14, 2.1, guideMat, -6.55, F + 0.006, 1.5, { rx: -Math.PI / 2, renderOrder: 4 });
  plane(g, 0.14, 2.1, guideMat, -7.45, F + 0.006, 1.5, { rx: -Math.PI / 2, renderOrder: 4 });

  // 天花 + 灯盘
  box(g, 9.4, 0.1, 8.4, new THREE.MeshLambertMaterial({ color: 0xe6dec8, emissive: 0x353026 }), -7, 5.1, -1.6, { cast: false });
  // 背墙内衬（自发光暖色，保证室内通透温暖）
  plane(g, 9.3, 4.3, new THREE.MeshLambertMaterial({ color: 0xe9ddc2, emissive: 0x5c4c38 }), -7, 2.55, -5.71, { renderOrder: 1 });
  // 窗后暖光晕（动画式 bloom 溢出）
  sprite(g, 0xffd9a0, 4.6, 3.2, -10.05, 2.7, 1.6, 0.2);
  sprite(g, 0xffd9a0, 4.6, 3.2, -3.95, 2.7, 1.6, 0.2);
  sprite(g, 0xffe2b8, 3.2, 2.6, -7, 2.5, 1.4, 0.16);
  const panelMat = new THREE.MeshBasicMaterial({ color: 0xfff6e2 });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++){
    plane(g, 1.7, 0.85, panelMat, -9.2 + i * 2.2, 5.04, -3.2 + j * 3.2, { rx: Math.PI / 2, renderOrder: 3 });
  }
  S.r.interiorPanelMat = panelMat;

  // 悬挂灯箱
  function lightbox(x, z, text, ry){
    const tex = makeTex(384, 144, function(g2, w, h){
      g2.fillStyle = '#fdf4de'; g2.fillRect(0, 0, w, h);
      g2.strokeStyle = '#e2482f'; g2.lineWidth = 10; g2.strokeRect(5, 5, w - 10, h - 10);
      g2.fillStyle = '#e2482f'; g2.font = fontOf(84, '900'); g2.textAlign = 'center'; g2.textBaseline = 'middle';
      g2.fillText(text, w / 2, h / 2 + 4);
    });
    const m = new THREE.MeshBasicMaterial({ map: tex });
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.52, 0.07), [toon(0x39435a), toon(0x39435a), toon(0x39435a), toon(0x39435a), m, m]);
    b.position.set(x, 3.75, z); b.rotation.y = ry || 0;
    g.add(b);
    tube(g, new THREE.Vector3(x, 5.05, z), new THREE.Vector3(x, 4.01, z), 0.015, toon(0x39435a));
    S.r.lightboxes = S.r.lightboxes || [];
    S.r.lightboxes.push(m);
  }
  lightbox(-7.7, -4.5, '冷饮乳品', 0);
  lightbox(-10.6, -2.9, '便当饭团', Math.PI / 2);
  lightbox(-7, -0.9, '促销中', 0);

  // —— 货架 + 商品 ——
  const prodColors = [0xe8604c, 0xf2a03d, 0xf4d35e, 0x7cb56b, 0x5aa9d6, 0x8f7bd8, 0xe88bb1, 0xf2efe4];
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  function productsRow(x0, x1, y, z, depth, seed, big){
    const rand = rng(seed);
    const items = [];
    let cx = x0 + 0.1;
    while (cx < x1 - 0.15){
      const w = 0.13 + rand() * 0.09;
      const h = (big ? 0.3 : 0.2) + rand() * 0.1;
      items.push({ x: cx + w / 2, w: w, h: h, d: depth * (0.6 + rand() * 0.3), c: prodColors[Math.floor(rand() * prodColors.length)] });
      cx += w + 0.035 + rand() * 0.05;
    }
    const byColor = {};
    items.forEach(function(it){ (byColor[it.c] = byColor[it.c] || []).push(it); });
    Object.keys(byColor).forEach(function(c){
      const arr = byColor[c];
      const im = new THREE.InstancedMesh(boxGeo, toon(parseInt(c)), arr.length);
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3();
      arr.forEach(function(it, i){
        Q.setFromAxisAngle(UPV, (rand() - 0.5) * 0.25);
        V.set(it.x, y + it.h / 2, z);
        SC.set(it.w, it.h, it.d);
        M.compose(V, Q, SC);
        im.setMatrixAt(i, M);
      });
      im.castShadow = true;
      g.add(im);
    });
  }
  function makeShelf(cx, z, len, seed){
    const frameMat = toon(0x39465e);
    const boardMat = toon(0xd9d2c0);
    box(g, len, 0.22, 0.95, frameMat, cx, F + 0.11, z, { outline: 0.03 });
    box(g, len, 1.75, 0.06, frameMat, cx, F + 1.1, z - 0.42);
    const levels = [0.72, 1.18, 1.64];
    levels.forEach(function(dy, li){
      box(g, len, 0.045, 0.82, boardMat, cx, F + dy, z, { cast: false });
      productsRow(cx - len / 2 + 0.15, cx + len / 2 - 0.15, F + dy + 0.025, z, 0.6, seed + li * 7, li === 2);
    });
    box(g, len, 0.045, 0.86, boardMat, cx, F + 1.92, z, { cast: false });
    productsRow(cx - len / 2 + 0.15, cx + len / 2 - 0.15, F + 1.945, z, 0.6, seed + 30, false);
    [cx - len / 2 + 0.3, cx - len / 6, cx + len / 6, cx + len / 2 - 0.3].forEach(function(px){
      box(g, 0.05, 1.75, 0.85, frameMat, px, F + 1.1, z, { cast: false });
    });
    box(g, 0.06, 1.9, 0.95, frameMat, cx - len / 2, F + 1.15, z, { cast: false });
    box(g, 0.06, 1.9, 0.95, frameMat, cx + len / 2, F + 1.15, z, { cast: false });
  }
  makeShelf(-7.5, 0.1, 5.8, 11);
  makeShelf(-7.5, -2.5, 5.8, 77);

  // —— 背墙饮料柜 ——
  const frBody = toon(0x232c3c);
  const frInner = new THREE.MeshBasicMaterial({ color: 0xd6ecff });
  function makeFridge(cx, w, label){
    box(g, w, 2.45, 0.75, frBody, cx, F + 1.225, -5.35, { outline: 0.04 });
    plane(g, w - 0.35, 2.0, frInner, cx, F + 1.3, -5.12, { renderOrder: 2 });
    [0.62, 1.22, 1.82].forEach(function(dy, li){
      box(g, w - 0.3, 0.035, 0.5, toon(0xcfd6e2), cx, F + dy, -5.15, { cast: false });
      const rand = rng(100 + Math.floor(cx) + li);
      const n = Math.floor((w - 0.5) / 0.17);
      const byC = {};
      for (let i = 0; i < n; i++){
        const c = prodColors[Math.floor(rand() * prodColors.length)];
        (byC[c] = byC[c] || []).push(cx - (w - 0.5) / 2 + 0.12 + i * 0.17);
      }
      Object.keys(byC).forEach(function(c){
        const xs = byC[c];
        const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.045, 0.05, 0.22, 8), toon(parseInt(c)), xs.length);
        const M = new THREE.Matrix4();
        xs.forEach(function(x, i){ M.makeTranslation(x, F + dy + 0.13, -5.15); im.setMatrixAt(i, M); });
        g.add(im);
      });
    });
    plane(g, w - 0.15, 2.05, new THREE.MeshPhongMaterial({ color: 0xa8c4e0, transparent: true, opacity: 0.14, shininess: 90, depthWrite: false }), cx, F + 1.3, -5.0, { renderOrder: 6 });
    const labTex = makeTex(512, 96, function(g2, w2, h2){
      g2.fillStyle = '#e2482f'; g2.fillRect(0, 0, w2, h2);
      g2.fillStyle = '#fff'; g2.font = fontOf(56, 'bold'); g2.textAlign = 'center'; g2.textBaseline = 'middle';
      g2.fillText(label, w2 / 2, h2 / 2 + 2);
    });
    box(g, w * 0.55, 0.28, 0.06, new THREE.MeshBasicMaterial({ map: labTex }), cx, F + 2.32, -4.96, { cast: false });
  }
  makeFridge(-9.4, 2.9, '冷饮');
  makeFridge(-6.3, 2.9, '牛乳');
  S.r.fridgeInner = frInner;

  // 卧式冰柜
  box(g, 1.9, 0.95, 0.78, toon(0xe8ecf2), -3.35, F + 0.475, -5.3, { outline: 0.04 });
  plane(g, 1.6, 0.6, new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.55 }), -3.35, F + 0.96, -5.3, { rx: Math.PI / 2, renderOrder: 5 });
  for (let i = 0; i < 5; i++) box(g, 0.1, 0.24, 0.1, toon(prodColors[i % 6]), -4 + i * 0.32, F + 0.75, -5.3, { cast: false });
  const iceTex = makeTex(256, 128, function(g2, w, h){
    g2.fillStyle = '#5aa9d6'; g2.fillRect(0, 0, w, h);
    g2.fillStyle = '#fff'; g2.font = fontOf(52, '900'); g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.fillText('冰淇淋', w / 2, h / 2 + 2);
  });
  plane(g, 1.5, 0.55, new THREE.MeshBasicMaterial({ map: iceTex }), -3.35, F + 0.5, -4.9, { renderOrder: 3 });

  // —— 左墙便当柜 / 饭团 ——
  box(g, 0.78, 1.35, 3.1, frBody, -11.3, F + 0.675, -3.0, { outline: 0.04 });
  plane(g, 3.0, 1.1, new THREE.MeshBasicMaterial({ color: 0xffe4c2 }), -10.93, F + 0.75, -3.0, { ry: Math.PI / 2, renderOrder: 2 });
  const bentoColors = [0xe8604c, 0xf2a03d, 0x7cb56b, 0xf4d35e, 0xe88bb1];
  [0.62, 1.12].forEach(function(dy, li){
    box(g, 0.55, 0.035, 2.95, toon(0xcfd6e2), -11.2, F + dy, -3.0, { cast: false });
    const rand = rng(300 + li);
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.1, 0.22), toon(0xf6f1e4), 11);
    const M = new THREE.Matrix4();
    for (let i = 0; i < 11; i++){
      M.makeTranslation(-11.2, F + dy + 0.07, -4.3 + i * 0.26);
      im.setMatrixAt(i, M);
    }
    g.add(im);
  });
  // 饭团（三角饭团）
  const oniGeo = new THREE.ConeGeometry(0.07, 0.1, 3);
  const oniWhite = toon(0xfafaf2);
  const oniNavy = toon(0x2e4a7a);
  for (let i = 0; i < 8; i++){
    const x = -11.2, z = -1.62 + i * 0.2;
    const o = new THREE.Mesh(oniGeo, oniWhite);
    o.position.set(x, F + 1.42, z); o.rotation.y = Math.PI / 3; o.castShadow = true;
    g.add(o);
    box(g, 0.062, 0.05, 0.055, oniNavy, x, F + 1.4, z, { cast: false });
  }
  // 上层零食架
  [1.9, 2.4].forEach(function(dy, li){
    box(g, 0.5, 0.035, 2.8, toon(0xd9d2c0), -11.45, F + dy, -3.0, { cast: false });
    productsRowX(-11.45, F + dy + 0.02, -4.25, -1.75, 400 + li);
  });
  function productsRowX(x, y, z0, z1, seed){
    const rand = rng(seed);
    const byC = {};
    let cz = z0 + 0.1;
    while (cz < z1 - 0.1){
      const w = 0.14 + rand() * 0.08;
      const c = prodColors[Math.floor(rand() * prodColors.length)];
      (byC[c] = byC[c] || []).push({ z: cz + w / 2, w: w });
      cz += w + 0.04;
    }
    Object.keys(byC).forEach(function(c){
      const arr = byC[c];
      const im = new THREE.InstancedMesh(boxGeo, toon(parseInt(c)), arr.length);
      const M = new THREE.Matrix4(), SC = new THREE.Vector3();
      arr.forEach(function(it, i){
        M.makeScale(0.2, 0.26, it.w);
        M.setPosition(x, y + 0.13, it.z);
        im.setMatrixAt(i, M);
      });
      g.add(im);
    });
  }

  // 杂志架（左前窗边）
  const magGroup = new THREE.Group(); g.add(magGroup);
  magGroup.position.set(-11.1, F, 1.7); magGroup.rotation.y = Math.PI / 2.4;
  box(magGroup, 1.0, 1.35, 0.5, toon(0x39465e), 0, 0.675, 0, { outline: 0.03 });
  const magCols = [0xe2482f, 0x2e6da8, 0xf2a03d, 0x7cb56b, 0x8f7bd8];
  for (let i = 0; i < 5; i++){
    plane(magGroup, 0.3, 0.42, new THREE.MeshBasicMaterial({ color: magCols[i] }), -0.36 + i * 0.18, 1.05, 0.26, { rx: -0.25, renderOrder: 3 });
    plane(magGroup, 0.3, 0.42, new THREE.MeshBasicMaterial({ color: magCols[(i + 2) % 5] }), -0.36 + i * 0.18, 0.55, 0.26, { rx: -0.25, renderOrder: 3 });
  }

  // —— 收银区（右前） ——
  const counterMat = toon(0xd8d0be);
  const counterTop = toon(0x3a4254);
  box(g, 0.8, 0.95, 2.3, counterMat, -2.72, F + 0.475, 0.6, { outline: 0.035 });
  box(g, 0.95, 0.06, 2.45, counterTop, -2.72, F + 0.98, 0.6, { cast: false });
  box(g, 0.82, 0.08, 2.32, toon(0xe2482f), -2.72, F + 0.52, 0.6, { cast: false });
  // 收银机
  box(g, 0.38, 0.3, 0.34, toon(0x2b3244), -2.75, F + 1.16, 1.35, { outline: 0.025 });
  plane(g, 0.3, 0.22, new THREE.MeshBasicMaterial({ color: 0xaee6ff }), -2.75, F + 1.35, 1.32, { rx: -0.3, renderOrder: 3 });
  box(g, 0.14, 0.1, 0.2, toon(0x39435a), -2.7, F + 1.06, 0.95, { cast: false });
  // 咖啡机
  const cofGroup = new THREE.Group(); g.add(cofGroup);
  cofGroup.position.set(-2.72, F + 1.01, -0.15);
  box(cofGroup, 0.44, 0.5, 0.36, toon(0x833b32), 0, 0.25, 0, { outline: 0.025 });
  box(cofGroup, 0.4, 0.12, 0.3, toon(0x2b3244), 0, 0.42, 0.02, { cast: false });
  box(cofGroup, 0.3, 0.1, 0.2, toon(0x39435a), 0, 0.06, 0.1, { cast: false });
  cyl(cofGroup, 0.035, 0.03, 0.07, toon(0xf2efe4), -0.07, 0.14, 0.14, { cast: false });
  cyl(cofGroup, 0.035, 0.03, 0.07, toon(0xf2efe4), 0.07, 0.14, 0.14, { cast: false });
  // 香烟柜（墙上）
  [1.55, 1.95, 2.35].forEach(function(dy, li){
    box(g, 0.04, 0.32, 1.5, toon(0x39465e), -2.26, F + dy, 0.6, { cast: false });
    const rand = rng(500 + li);
    const byC = {};
    for (let i = 0; i < 9; i++){
      const c = [0xd8cba8, 0xc4544a, 0x6a89a8, 0xe8e2cf, 0x8a9a6a][Math.floor(rand() * 5)];
      (byC[c] = byC[c] || []).push(-0.1 + i * 0.16);
    }
    Object.keys(byC).forEach(function(c){
      const arr = byC[c];
      const im = new THREE.InstancedMesh(boxGeo, toon(parseInt(c)), arr.length);
      const M = new THREE.Matrix4();
      arr.forEach(function(zz, i){
        M.makeScale(0.06, 0.24, 0.1);
        M.setPosition(-2.32, F + dy + 0.13, zz + 0.6);
        im.setMatrixAt(i, M);
      });
      g.add(im);
    });
  });
  // —— 关东煮 ——
  const odenX = -2.72, odenZ = -0.85;
  cyl(g, 0.25, 0.22, 0.34, toon(0x9aa2b2), odenX, F + 1.15, odenZ, { outline: 0.025 });
  cyl(g, 0.21, 0.21, 0.03, new THREE.MeshBasicMaterial({ color: 0xd8a86a }), odenX, F + 1.3, odenZ, { cast: false });
  for (let i = 0; i < 4; i++){
    const a = i * 1.57 + 0.4;
    cyl(g, 0.05, 0.045, 0.1, toon(0xf2efe4), odenX + Math.cos(a) * 0.1, F + 1.32, odenZ + Math.sin(a) * 0.1, { cast: false });
  }
  S.r.steam = [];
  const steamMatBase = { map: glowTexture(), color: 0xffe8d0, transparent: true, opacity: 0, depthWrite: false };
  for (let i = 0; i < 3; i++){
    const sp = new THREE.Sprite(new THREE.SpriteMaterial(steamMatBase));
    sp.position.set(odenX, F + 1.5, odenZ);
    g.add(sp);
    S.r.steam.push(sp);
  }

  // 后场门 + 纸箱
  box(g, 1.0, 2.0, 0.07, toon(0x5f6a78), -3.2, F + 1.0, -5.68, { outline: 0.03 });  box(g, 0.5, 0.06, 0.05, toon(0x39435a), -3.2, F + 1.05, -5.62, { cast: false });
  const empTex = makeTex(256, 96, function(g2, w, h){
    g2.fillStyle = '#d8d0be'; g2.fillRect(0, 0, w, h);
    g2.fillStyle = '#39435a'; g2.font = fontOf(48, 'bold'); g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.fillText('员工专用', w / 2, h / 2 + 2);
  });
  plane(g, 0.72, 0.24, new THREE.MeshBasicMaterial({ map: empTex }), -3.2, F + 2.2, -5.62, { renderOrder: 3 });
  box(g, 0.55, 0.4, 0.5, toon(0xc9a86f), -4.3, F + 0.2, -5.35, { outline: 0.025 });
  box(g, 0.45, 0.35, 0.45, toon(0xbf9c62), -4.3, F + 0.58, -5.35, { outline: 0.025 });

  // 收银台后背景墙 + 海报
  const poster1 = makeTex(256, 320, function(g2, w, h){
    g2.fillStyle = '#f2a03d'; g2.fillRect(0, 0, w, h);
    g2.fillStyle = '#d8543c'; g2.beginPath(); g2.arc(w / 2, 110, 66, 0, 7); g2.fill();
    g2.fillStyle = '#fff'; g2.font = fontOf(56, '900'); g2.textAlign = 'center';
    g2.fillText('飯团', w / 2, 126);
    g2.fillStyle = '#5a3a1a'; g2.font = fontOf(40, 'bold');
    g2.fillText('早餐搭配更划算', w / 2, 230);
    g2.fillRect(30, 270, w - 60, 10);
  });
  plane(g, 0.85, 1.1, new THREE.MeshBasicMaterial({ map: poster1 }), -4.0, F + 2.6, -5.6, { renderOrder: 2 });
  const poster2 = makeTex(256, 320, function(g2, w, h){
    g2.fillStyle = '#2e6da8'; g2.fillRect(0, 0, w, h);
    g2.fillStyle = '#fdf6e8'; g2.font = fontOf(56, '900'); g2.textAlign = 'center';
    g2.fillText('会员日', w / 2, 100);
    g2.fillText('每周三', w / 2, 170);
    g2.fillStyle = '#f4d35e'; g2.font = fontOf(44, 'bold');
    g2.fillText('全场 95 折', w / 2, 250);
  });
  plane(g, 0.85, 1.1, new THREE.MeshBasicMaterial({ map: poster2 }), -9.5, F + 2.6, -5.6, { renderOrder: 2 });

  // 雨伞架（门内右侧）
  const umGroup = new THREE.Group(); g.add(umGroup);
  umGroup.position.set(-2.85, F, 2.35);
  cyl(umGroup, 0.17, 0.15, 0.5, toon(0x3a4454), 0, 0.25, 0, { outline: 0.025 });
  const umCols = [0xc34a4a, 0x4a7ac3, 0xd8c34a];
  for (let i = 0; i < 3; i++){
    const a = i * 2.1;
    const ux = Math.cos(a) * 0.07, uz = Math.sin(a) * 0.07;
    tube(umGroup, new THREE.Vector3(ux, 0.05, uz), new THREE.Vector3(ux * 2.2, 0.95, uz * 2.2), 0.018, toon(0x2b3244));
    cyl(umGroup, 0.045, 0.005, 0.16, toon(umCols[i]), ux * 2.2, 1.0, uz * 2.2, { cast: false });
  }
}

/* ============================================================ 邻铺 / 小巷 */
function buildNeighbors(scene){
  const g = new THREE.Group(); scene.add(g);

  // —— 小巷（店与邻铺之间） ——
  box(g, 1.55, 0.04, 8.8, toon(0x1d2436), -1.22, WALK_Y + 0.02, -1.6, { cast: false });
  // 巷内管道、电表箱、海报
  tube(g, new THREE.Vector3(-0.52, 0.3, -4.6), new THREE.Vector3(-0.52, 4.2, -4.6), 0.04, toon(0x6a7488));
  tube(g, new THREE.Vector3(-1.9, 0.3, -1.0), new THREE.Vector3(-1.9, 4.4, -1.0), 0.035, toon(0x7a8498));
  box(g, 0.1, 0.42, 0.3, toon(0x8b94a8), -1.94, 1.4, -2.6);
  const alleyPoster = makeTex(256, 340, function(g2, w, h){
    g2.fillStyle = '#c8bfa8'; g2.fillRect(0, 0, w, h);
    g2.fillStyle = '#5a6a8a'; g2.font = fontOf(60, '900'); g2.textAlign = 'center';
    g2.fillText('巷', w / 2, 90);
    g2.fillStyle = '#4a5468'; g2.font = fontOf(34, 'bold');
    g2.fillText('减速慢行', w / 2, 170);
    g2.fillText('注意行人', w / 2, 220);
    g2.fillStyle = 'rgba(90,84,60,0.4)'; g2.fillRect(20, 270, 90, 40);
  });
  plane(g, 0.7, 0.95, new THREE.MeshBasicMaterial({ map: alleyPoster }), -1.98, 1.7, -3.2, { ry: Math.PI / 2, renderOrder: 2 });
  // 垃圾袋
  const bagMat = toon(0x23282f);
  [[-1.5, -5.2, 0.24], [-0.85, -5.0, 0.19], [-1.2, -4.85, 0.16]].forEach(function(p){
    const b = new THREE.Mesh(new THREE.SphereGeometry(p[2], 10, 8), bagMat);
    b.position.set(p[0], WALK_Y + p[2] * 0.7, p[1]);
    b.scale.y = 0.75; b.castShadow = true;
    g.add(b);
  });
  // 巷口壁灯
  box(g, 0.12, 0.16, 0.12, toon(0x2b3244), -0.52, 2.62, 1.8);
  S.r.alleyBulbMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
  box(g, 0.08, 0.08, 0.02, S.r.alleyBulbMat, -0.55, 2.55, 1.8, { cast: false });

  // —— 邻铺A：洗衣店（巷子右侧） ——
  const nA = new THREE.Group(); g.add(nA);
  box(nA, 1.9, 4.24, 9, toon(0xa8a091), 0.55, WALK_Y + 2.12, -1.5, { outline: 0.05 });
  box(nA, 2.1, 0.3, 9.4, toon(0x39435a), 0.55, WALK_Y + 4.39, -1.5, { outline: 0.04 });
  // 楼顶水塔（中国街景标志）
  cyl(nA, 0.52, 0.52, 0.85, toon(0x5a6474), 0.55, WALK_Y + 4.97, -3.6, { outline: 0.04 });
  cyl(nA, 0.06, 0.3, 0.28, toon(0x39435a), 0.55, WALK_Y + 5.5, -3.6);
  // 卷帘门
  const shutterTex = makeTex(256, 256, function(g2, w, h){
    g2.fillStyle = '#5d6472'; g2.fillRect(0, 0, w, h);
    for (let i = 0; i < 16; i++){
      g2.fillStyle = i % 2 ? '#565d6a' : '#636b7a';
      g2.fillRect(0, i * 16, w, 9);
    }
    g2.fillStyle = '#49505c'; g2.fillRect(w / 2 - 30, h / 2 - 8, 60, 16);
  });
  const shutterMat = toon(0xffffff, { map: shutterTex });
  box(nA, 1.45, 2.5, 0.08, shutterMat, 0.55, WALK_Y + 1.25, 3.02, { outline: 0.03 });
  box(nA, 1.6, 0.12, 0.12, toon(0x39435a), 0.55, WALK_Y + 2.56, 3.05);
  const nASignTex = makeTex(512, 128, function(g2, w, h){
    g2.fillStyle = '#d8dde6'; g2.fillRect(0, 0, w, h);
    g2.strokeStyle = '#8b94a8'; g2.lineWidth = 6; g2.strokeRect(3, 3, w - 6, h - 6);
    g2.fillStyle = '#39435a'; g2.font = fontOf(72, '900'); g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.fillText('自助洗衣', w / 2, h / 2 + 4);
  });
  box(nA, 1.7, 0.5, 0.16, new THREE.MeshBasicMaterial({ map: nASignTex }), 0.55, WALK_Y + 3.25, 3.14, { outline: 0.03 });
  // 外墙空调
  box(nA, 0.42, 0.55, 0.75, toon(0xd8dde6), 1.15, WALK_Y + 3.95, 2.3, { outline: 0.03 });
  S.dripEmitters.push({ x: 1.15, y: WALK_Y + 3.62, z: 2.05 });

  // —— 邻铺B：面馆（店左侧，两层） ——
  const nB = new THREE.Group(); g.add(nB);
  box(nB, 7.4, 4.64, 9, toon(0xb3a08a), -16.3, WALK_Y + 2.32, -1.5, { outline: 0.05 });
  box(nB, 7.7, 0.32, 9.3, toon(0x5a5348), -16.3, WALK_Y + 4.8, -1.5, { outline: 0.04 });
  cyl(nB, 0.5, 0.5, 0.8, toon(0x5a6474), -14.6, WALK_Y + 5.36, -3.8, { outline: 0.04 });
  cyl(nB, 0.05, 0.28, 0.26, toon(0x39435a), -14.6, WALK_Y + 5.88, -3.8);
  // 底部踢脚 + 一层门窗
  box(nB, 7.4, 0.5, 0.06, toon(0x6a5a48), -16.3, WALK_Y + 0.25, 3.02);
  box(nB, 1.0, 2.1, 0.1, toon(0x4a3f34), -14.2, WALK_Y + 1.05, 3.0, { outline: 0.03 }); // 木门
  const darkGlass = new THREE.MeshBasicMaterial({ color: 0x1a2233 });
  [[-16.8], [-18.6]].forEach(function(p, i){
    box(nB, 1.35, 1.5, 0.08, darkGlass, p[0], WALK_Y + 1.55, 3.0);
    box(nB, 1.5, 0.09, 0.12, toon(0x5a5348), p[0], WALK_Y + 2.35, 3.0);
    box(nB, 1.5, 0.09, 0.12, toon(0x5a5348), p[0], WALK_Y + 0.78, 3.0);
  });
  // 二层窗
  for (let i = 0; i < 3; i++){
    const wx = -18.9 + i * 2.1;
    box(nB, 0.95, 1.1, 0.08, i === 1 ? new THREE.MeshBasicMaterial({ color: 0x8a7a58 }) : darkGlass, wx, WALK_Y + 3.55, 3.0);
    box(nB, 1.08, 0.08, 0.12, toon(0x5a5348), wx, WALK_Y + 4.14, 3.0);
  }
  // 招牌（暗红 + 暖字）
  const nBSignTex = makeTex(1024, 192, function(g2, w, h){
    g2.fillStyle = '#6e2a22'; g2.fillRect(0, 0, w, h);
    g2.strokeStyle = '#8f4636'; g2.lineWidth = 8; g2.strokeRect(4, 4, w - 8, h - 8);
    g2.fillStyle = '#ffd9a0'; g2.font = fontOf(110, '900'); g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.fillText('老 陈 面 馆', w / 2, h / 2 + 4);
  });
  const nBSignMat = new THREE.MeshBasicMaterial({ map: nBSignTex });
  S.r.nbSignMat = nBSignMat;
  box(nB, 4.6, 0.85, 0.3, nBSignMat, -16.3, WALK_Y + 4.35, 3.18, { outline: 0.04 });
  sprite(nB, 0xffb066, 5.4, 2.4, -16.3, WALK_Y + 4.4, 3.7, 0.14);
  // 灯笼（已熄）
  [[-14.9], [-17.7]].forEach(function(p){
    tube(nB, new THREE.Vector3(p[0], WALK_Y + 3.9, 3.32), new THREE.Vector3(p[0], WALK_Y + 3.62, 3.32), 0.015, toon(0x39435a));
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), toon(0x8f2f26));
    l.position.set(p[0], WALK_Y + 3.42, 3.32); l.scale.y = 1.15; l.castShadow = true;
    nB.add(l);
    tube(nB, new THREE.Vector3(p[0], WALK_Y + 3.2, 3.32), new THREE.Vector3(p[0], WALK_Y + 3.05, 3.32), 0.02, toon(0xb3a08a));
  });
  // 菜牌小黑板
  const menuTex = makeTex(192, 256, function(g2, w, h){
    g2.fillStyle = '#2a2f38'; g2.fillRect(0, 0, w, h);
    g2.strokeStyle = '#5a5348'; g2.lineWidth = 6; g2.strokeRect(4, 4, w - 8, h - 8);
    g2.fillStyle = '#cfd6e2'; g2.font = fontOf(30, 'bold'); g2.textAlign = 'center';
    g2.fillText('今日', w / 2, 56);
    g2.fillText('牛肉面', w / 2, 108);
    g2.fillText('馄饨', w / 2, 156);
    g2.fillText('豆浆', w / 2, 204);
  });
  const menu = plane(nB, 0.72, 0.96, new THREE.MeshBasicMaterial({ map: menuTex }), -13.5, WALK_Y + 0.62, 3.42, { rx: -0.16, renderOrder: 2 });
  // 外墙空调
  box(nB, 0.5, 0.6, 0.8, toon(0xd8dde6), -19.0, WALK_Y + 3.0, 3.15, { outline: 0.03 });
  S.dripEmitters.push({ x: -19.0, y: WALK_Y + 2.65, z: 2.9 });
  // 门口雨棚（小）
  box(nB, 1.5, 0.07, 0.8, toon(0x39435a), -14.2, WALK_Y + 2.42, 3.4, { rx: -0.15, outline: 0.03 });
  S.dripEmitters.push({ x: -14.2, y: WALK_Y + 2.28, z: 3.8 });
}

/* ============================================================ 背景建筑 */
function windowsTex(cols, rows, base, litRatio, seed){
  return makeTex(256, 256, function(g, w, h){
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const rand = rng(seed);
    const cw = w / cols, ch = h / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++){
      const lit = rand() < litRatio;
      const warm = lit ? (180 + Math.floor(rand() * 60)) : 0;
      g.fillStyle = lit ? 'rgb(' + warm + ',' + Math.floor(warm * 0.82) + ',' + Math.floor(warm * 0.55) + ')' : 'rgba(14,20,34,0.9)';
      g.fillRect(i * cw + cw * 0.22, j * ch + ch * 0.24, cw * 0.56, ch * 0.5);
    }
  });
}
function bgBuilding(parent, x0, x1, z0, z1, h, color, face, seed, litRatio){
  const w = x1 - x0, d = z1 - z0;
  const sideMat = toon(color);
  const darkMat = toon(new THREE.Color(color).multiplyScalar(0.55).getHex());
  const frontMat = new THREE.MeshBasicMaterial({ map: windowsTex(Math.max(2, Math.round(w / 1.4)), Math.max(2, Math.round(h / 1.6)), '#333a4c', litRatio === undefined ? 0.22 : litRatio, seed) });
  const mats = [sideMat, sideMat, darkMat, darkMat, sideMat, sideMat];
  mats[face] = frontMat;
  if (face === 1) mats[0] = frontMat; // ±x 双面同贴图
  if (face === 5) mats[4] = frontMat;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  m.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2);
  m.castShadow = true; m.receiveShadow = false;
  outline(m, 0.05, 0x080c16);
  parent.add(m);
  // 屋顶设备剪影
  const rand = rng(seed + 5);
  const n = 1 + Math.floor(rand() * 2);
  for (let i = 0; i < n; i++){
    box(parent, 0.9, 0.5, 0.7, toon(0x39404f), (x0 + x1) / 2 + (rand() - 0.5) * w * 0.5, h + 0.25, (z0 + z1) / 2 + (rand() - 0.5) * d * 0.5);
  }
  if (rand() < 0.6){
    cyl(parent, 0.45, 0.45, 0.75, toon(0x4a5262), x0 + w * 0.3, h + 0.38, z0 + d * 0.3, { outline: 0.035 });
    cyl(parent, 0.04, 0.26, 0.24, toon(0x39435a), x0 + w * 0.3, h + 0.88, z0 + d * 0.3);
  }
  return m;
}
function buildBackground(scene){
  // 后排
  bgBuilding(scene, -20, -13, -20, -6.3, 5.6, 0x6d7890, 4, 21, 0.28);
  bgBuilding(scene, -13, -7.5, -20, -6.3, 4.8, 0x7d8698, 4, 22, 0.2);
  bgBuilding(scene, -7.5, -1.5, -20, -6.3, 6.0, 0x67718a, 4, 23, 0.3);
  bgBuilding(scene, -1.5, 4, -20, -6.3, 5.2, 0x757d8f, 4, 24, 0.22);
  // 对街（纵向路对面，面朝 -x）
  bgBuilding(scene, 12, 20, -20, -8, 5.8, 0x71809a, 1, 31, 0.3);
  bgBuilding(scene, 12, 20, -8, 0, 4.5, 0x7c86a0, 1, 32, 0.22);
  bgBuilding(scene, 12, 20, 0, 7, 5.2, 0x68738c, 1, 33, 0.26);
  // 对街（横向路对面，面朝 -z）
  bgBuilding(scene, -20, -8, 15, 20, 4.4, 0x75808f, 5, 41, 0.25);
  bgBuilding(scene, -8, 2, 15, 20, 5.4, 0x6a7590, 5, 42, 0.3);
  bgBuilding(scene, 2, 12, 15, 20, 4.2, 0x808a9a, 5, 43, 0.2);
  // 路口对面转角楼
  bgBuilding(scene, 14, 20, 7, 13.02, 4.4, 0x6f7992, 5, 44, 0.24);

  // 对街招牌：药房（绿十字）
  const phTex = makeTex(512, 160, function(g, w, h){
    g.fillStyle = '#1f4d3a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#4ade80'; g.fillRect(w * 0.09, h * 0.2, w * 0.09, h * 0.6);
    g.fillRect(w * 0.055, h * 0.32, w * 0.17, h * 0.36);
    g.fillStyle = '#d9ffe8'; g.font = fontOf(64, '900'); g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('康民大药房', w * 0.22, h / 2 + 2);
  });
  const phSign = plane(scene, 2.7, 0.85, new THREE.MeshBasicMaterial({ map: phTex }), 11.96, 4.6, -4, { ry: -Math.PI / 2, renderOrder: 2 });
  sprite(scene, 0x4ade80, 3.2, 2.2, 11.7, 4.6, -4, 0.12);
  // 客栈招牌
  const inTex = makeTex(512, 160, function(g, w, h){
    g.fillStyle = '#4a3a5a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffd9a0'; g.font = fontOf(68, '900'); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('悦 来 客 栈', w / 2, h / 2 + 2);
  });
  plane(scene, 3.0, 0.95, new THREE.MeshBasicMaterial({ map: inTex }), -3, 4.9, 14.96, { renderOrder: 2 });
  sprite(scene, 0xffb066, 3.4, 2.4, -3, 4.9, 14.6, 0.1);

  // 树（雨夜剪影感）
  function tree(x, z, s){
    const t = new THREE.Group(); scene.add(t);
    t.position.set(x, WALK_Y, z);
    const s2 = s || 1;
    cyl(t, 0.08 * s2, 0.12 * s2, 2.2 * s2, toon(0x4a3b2e), 0, 1.1 * s2, 0, { outline: 0.035 });
    const c1 = toon(0x24422e), c2 = toon(0x2c4f36);
    [[0, 2.6, 0, 0.85], [-0.5, 2.25, 0.25, 0.6], [0.45, 2.3, -0.3, 0.65]].forEach(function(p, i){
      const b = new THREE.Mesh(new THREE.SphereGeometry(p[3] * s2, 10, 8), i % 2 ? c2 : c1);
      b.position.set(p[0] * s2, p[1] * s2, p[2] * s2);
      b.castShadow = true;
      outline(b, 0.05 * s2);
      t.add(b);
    });
  }
  tree(-18.5, 5.4, 1.0);
  tree(11.0, -12.5, 0.9);
  tree(11.0, 2.0, 0.85);
  tree(-14, 14.1, 0.9);
  tree(4.5, 14.1, 0.8);
}

/* ============================================================ 街道道具 */
function buildStreetProps(scene){
  const g = new THREE.Group(); scene.add(g);
  const metalMat = toon(0x39414f);
  const whiteMat = toon(0xdfe6f0);

  // —— 路灯 ×2 ——
  function lamp(x, z, hx, hz){
    const t = new THREE.Group(); scene.add(t);
    cyl(t, 0.075, 0.1, 5.6, metalMat, x, WALK_Y + 2.8, z, { outline: 0.035 });
    cyl(t, 0.16, 0.2, 0.4, metalMat, x, WALK_Y + 0.2, z);
    tube(t, new THREE.Vector3(x, WALK_Y + 5.55, z), new THREE.Vector3(hx, WALK_Y + 5.35, hz), 0.05, metalMat);
    const head = box(t, 0.6, 0.17, 0.26, metalMat, hx, WALK_Y + 5.28, hz, { outline: 0.03 });
    plane(t, 0.5, 0.2, new THREE.MeshBasicMaterial({ color: 0xffd9a0 }), hx, WALK_Y + 5.19, hz, { rx: Math.PI / 2, renderOrder: 3 });
    sprite(t, 0xffc97a, 2.4, 1.6, hx, WALK_Y + 5.1, hz, 0.28);
    pool(scene, 0xffc97a, 3.2, hx, ROAD_Y + 0.025, hz + 0.6, 0.16);
    return t;
  }
  lamp(2.5, 5.8, 2.5, 7.7);
  lamp(11.0, 10.6, 9.9, 10.6);

  // —— 电线杆 + 电线 ——
  const pX = 2.6, pZ = -1.5;
  const pole = new THREE.Group(); scene.add(pole);
  cyl(pole, 0.1, 0.13, 7.4, toon(0x72798a), pX, 3.7, pZ, { outline: 0.04 });
  box(pole, 1.7, 0.09, 0.09, toon(0x6a7488), pX, 6.62, pZ);
  box(pole, 0.09, 0.09, 1.4, toon(0x6a7488), pX, 6.05, pZ);
  for (let i = -1; i <= 1; i++){
    cyl(pole, 0.035, 0.05, 0.14, toon(0x2b3244), pX + i * 0.6, 6.73, pZ, { cast: false });
  }
  cyl(pole, 0.26, 0.26, 0.6, toon(0x4a5260), pX + 0.3, 5.35, pZ, { outline: 0.035 });
  tube(pole, new THREE.Vector3(pX + 0.3, 5.65, pZ), new THREE.Vector3(pX + 0.02, 6.0, pZ), 0.018, toon(0x2b3244));
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x0b0f16 });
  const V3 = function(x, y, z){ return new THREE.Vector3(x, y, z); };
  wire(scene, V3(pX, 6.72, pZ), V3(-9, 6.95, -2), 0.55, 0.02, wireMat);
  wire(scene, V3(pX, 6.72, pZ), V3(0.55, 5.85, -3.6), 0.35, 0.02, wireMat);
  wire(scene, V3(pX, 6.72, pZ), V3(12.05, 6.5, -1.5), 0.85, 0.02, wireMat);
  wire(scene, V3(pX, 6.72, pZ), V3(-16.3, 5.6, -1.5), 0.6, 0.02, wireMat);
  wire(scene, V3(pX, 6.1, pZ), V3(-2.2, 6.5, -6.6), 0.4, 0.018, wireMat);
  wire(scene, V3(pX - 0.6, 6.72, pZ), V3(-16.3, 5.35, -4.5), 0.7, 0.018, wireMat);
  // 电线最低点滴水（弧垂中点附近）
  S.dripEmitters.push({ x: 5.5, y: 5.9, z: -1.5, thin: true });

  // —— 路牌 ——
  const sp = new THREE.Group(); scene.add(sp);
  cyl(sp, 0.045, 0.055, 2.9, metalMat, 3.1, WALK_Y + 1.45, 6.4, { outline: 0.03 });
  const stTex = makeTex(512, 160, function(g2, w, h){
    g2.fillStyle = '#2b5bb8'; g2.fillRect(0, 0, w, h);
    g2.strokeStyle = '#ffffff'; g2.lineWidth = 6; g2.strokeRect(5, 5, w - 10, h - 10);
    g2.fillStyle = '#ffffff'; g2.font = fontOf(84, '900'); g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.fillText('民 生 路', w / 2 - 40, h / 2 + 2);
    g2.beginPath(); g2.moveTo(w - 70, h * 0.3); g2.lineTo(w - 40, h * 0.5); g2.lineTo(w - 70, h * 0.7); g2.fill();
  });
  plane(sp, 1.35, 0.42, new THREE.MeshBasicMaterial({ map: stTex }), 3.1, WALK_Y + 2.55, 6.4, { ry: 0.35, renderOrder: 2 });
  const slowTex = makeTex(128, 128, function(g2, w, h){
    g2.fillStyle = '#f4d35e'; g2.beginPath(); g2.arc(w / 2, h / 2, w / 2 - 4, 0, 7); g2.fill();
    g2.fillStyle = '#d8352a'; g2.font = fontOf(72, '900'); g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.fillText('慢', w / 2, h / 2 + 4);
  });
  plane(sp, 0.42, 0.42, new THREE.MeshBasicMaterial({ map: slowTex }), 3.1, WALK_Y + 1.95, 6.4, { ry: 0.35, renderOrder: 2 });

  // —— 交通信号灯（远处路口） ——
  const tl = new THREE.Group(); scene.add(tl);
  cyl(tl, 0.06, 0.08, 3.7, metalMat, 10.9, WALK_Y + 1.85, 13.9, { outline: 0.03 });
  const tlHead = box(tl, 0.36, 1.0, 0.24, toon(0x2b3244), 10.9, WALK_Y + 3.15, 13.62, { ry: -0.3, outline: 0.03 });
  const lampOff = [0x3a1216, 0x3a2e12, 0x12321e];
  const lampOn = [0xff4545, 0xffc23e, 0x37d97a];
  S.r.trafficMats = []; S.r.trafficGlows = [];
  for (let i = 0; i < 3; i++){
    const m = new THREE.MeshBasicMaterial({ color: lampOff[i] });
    const lp = new THREE.Mesh(new THREE.CircleGeometry(0.095, 16), m);
    lp.position.set(10.9 + Math.sin(-0.3) * 0.13, WALK_Y + 3.15 + 0.3 - i * 0.3, 13.62 + Math.cos(-0.3) * 0.13 - 0.005);
    lp.rotation.y = -0.3;
    tl.add(lp);
    S.r.trafficMats.push(m);
    const gl = sprite(tl, lampOn[i], 0.85, 0.85, lp.position.x, lp.position.y, lp.position.z + 0.1, 0);
    gl.material.rotation = 0;
    S.r.trafficGlows.push(gl);
  }
  S.r.trafficOn = lampOn;
  // 横臂
  tube(tl, new THREE.Vector3(10.9, WALK_Y + 3.6, 13.9), new THREE.Vector3(10.9, WALK_Y + 3.55, 13.65), 0.035, metalMat);

  // —— 护栏 ——
  function railing(x0, z0, x1, z1){
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(2, Math.round(len / 1.5));
    for (let i = 0; i <= n; i++){
      const t = i / n;
      cyl(g, 0.032, 0.032, 0.95, whiteMat, x0 + (x1 - x0) * t, WALK_Y + 0.48, z0 + (z1 - z0) * t, { cast: false });
    }
    const mid = { x: (x0 + x1) / 2, z: (z0 + z1) / 2 };
    const ry = Math.atan2(x1 - x0, z1 - z0);
    [0.62, 0.9].forEach(function(y){
      const r = box(g, 0.05, 0.05, len, whiteMat, mid.x, WALK_Y + y, mid.z, { ry: ry, outline: 0.02, cast: false });
    });
  }
  railing(-16, 6.62, -7, 6.62);
  railing(2.05, -10, 2.05, -4);

  // —— 消防栓 ——
  const hy = new THREE.Group(); scene.add(hy);
  hy.position.set(1.9, WALK_Y, 0.2);
  cyl(hy, 0.13, 0.16, 0.55, toon(0xc23b2e), 0, 0.28, 0, { outline: 0.025 });
  cyl(hy, 0.09, 0.09, 0.14, toon(0xc23b2e), 0, 0.62, 0, { cast: false });
  cyl(hy, 0.05, 0.05, 0.34, toon(0xc23b2e), 0, 0.72, 0, { cast: false });
  box(hy, 0.4, 0.09, 0.09, toon(0xa83026), 0, 0.42, 0, { cast: false });

  // —— 垃圾桶 ×2 ——
  function bin(x, z, color, label, ry){
    const b = new THREE.Group(); scene.add(b);
    b.position.set(x, WALK_Y, z); b.rotation.y = ry || 0;
    cyl(b, 0.26, 0.22, 0.75, toon(color), 0, 0.375, 0, { outline: 0.03 });
    cyl(b, 0.28, 0.28, 0.07, toon(0x2b3244), 0, 0.78, 0);
    box(b, 0.2, 0.03, 0.12, toon(0x39435a), 0, 0.4, 0.27, { cast: false });
    const labTex = makeTex(256, 128, function(g2, w, h){
      g2.fillStyle = 'rgba(0,0,0,0)'; g2.clearRect(0, 0, w, h);
      g2.fillStyle = '#fff'; g2.font = fontOf(52, 'bold'); g2.textAlign = 'center'; g2.textBaseline = 'middle';
      g2.fillText(label, w / 2, h / 2);
    });
    plane(b, 0.36, 0.18, new THREE.MeshBasicMaterial({ map: labTex, transparent: true }), 0, 0.5, 0.255, { renderOrder: 3 });
  }
  bin(-4.7, 3.6, 0x3f7d4e, '可回收物', 0.15);
  bin(-4.05, 3.62, 0x5a6270, '其他垃圾', -0.1);

  // —— 自动贩卖机 ——
  const vm = new THREE.Group(); scene.add(vm);
  vm.position.set(-1.2, WALK_Y, 3.55);
  box(vm, 1.15, 1.85, 0.72, toon(0xdde2ea), 0, 0.925, 0, { outline: 0.05 });
  const vendTex = makeTex(256, 192, function(g2, w, h){
    g2.fillStyle = '#101828'; g2.fillRect(0, 0, w, h);
    const cols = ['#e8604c', '#f2a03d', '#7cb56b', '#5aa9d6', '#f4d35e', '#e88bb1', '#d8dde6', '#8f7bd8'];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++){
      g2.fillStyle = cols[(r * 5 + c) % 8];
      g2.fillRect(14 + c * 47, 12 + r * 52, 34, 40);
      g2.fillStyle = 'rgba(255,255,255,0.35)';
      g2.fillRect(14 + c * 47, 12 + r * 52, 34, 10);
    }
  });
  const vendMat = new THREE.MeshBasicMaterial({ map: vendTex });
  S.r.vendMat = vendMat;
  plane(vm, 0.95, 0.72, vendMat, -0.02, 1.32, 0.365, { renderOrder: 3 });
  box(vm, 0.95, 0.5, 0.03, toon(0x27303f), -0.02, 0.52, 0.365, { cast: false });
  for (let i = 0; i < 6; i++){
    cyl(vm, 0.022, 0.022, 0.02, toon(0x9fe8ff), -0.36 + (i % 3) * 0.14, 0.66 - Math.floor(i / 3) * 0.12, 0.385, { rx: Math.PI / 2, cast: false });
  }
  box(vm, 0.3, 0.05, 0.02, toon(0x11161f), -0.02, 0.36, 0.382, { cast: false });
  const qrTex = makeTex(64, 64, function(g2, w, h){
    g2.fillStyle = '#fff'; g2.fillRect(0, 0, w, h);
    g2.fillStyle = '#111';
    [[8, 8], [40, 8], [8, 40]].forEach(function(p){
      g2.fillRect(p[0], p[1], 16, 16);
      g2.fillStyle = '#111';
    });
    g2.fillRect(30, 30, 8, 8); g2.fillRect(44, 34, 10, 6); g2.fillRect(30, 44, 6, 10);
  });
  plane(vm, 0.16, 0.16, new THREE.MeshBasicMaterial({ map: qrTex }), 0.32, 0.6, 0.382, { renderOrder: 3 });
  box(vm, 1.05, 0.07, 0.1, new THREE.MeshBasicMaterial({ color: 0x9fe8ff }), 0, 1.9, 0.05, { cast: false });
  sprite(vm, 0x7ad7f0, 2.6, 2.6, 0, 1.2, 0.8, 0.18);
  plane(vm, 0.72, 1.7, toon(0xe2482f), -0.6, 0.925, 0.02, { ry: Math.PI / 2, renderOrder: 2 });

  // —— 公告栏 ——
  const bb = new THREE.Group(); scene.add(bb);
  bb.position.set(-15.5, WALK_Y, 5.9);
  cyl(bb, 0.045, 0.055, 1.75, toon(0x6a5a48), -0.75, 0.875, 0, { outline: 0.025 });
  cyl(bb, 0.045, 0.055, 1.75, toon(0x6a5a48), 0.75, 0.875, 0, { outline: 0.025 });
  box(bb, 1.85, 0.09, 0.34, toon(0x5a4a3a), 0, 1.82, 0, { outline: 0.025 });
  box(bb, 1.7, 1.15, 0.09, toon(0x8a6f4e), 0, 1.18, 0, { outline: 0.03 });
  function bbPoster(x, w, h, drawFn){
    const tex = makeTex(192, 232, drawFn);
    plane(bb, w, h, new THREE.MeshBasicMaterial({ map: tex }), x, 1.2, 0.055, { renderOrder: 3 });
  }
  bbPoster(-0.52, 0.42, 0.5, function(g2, w, h){
    g2.fillStyle = '#f2ead8'; g2.fillRect(0, 0, w, h);
    g2.fillStyle = '#d8352a'; g2.font = fontOf(40, '900'); g2.textAlign = 'center';
    g2.fillText('社区公告', w / 2, 56);
    g2.fillStyle = '#5a6270'; g2.font = fontOf(24, 'bold');
    g2.fillText('雨季注意', w / 2, 110);
    g2.fillText('关好门窗', w / 2, 148);
    g2.fillText('防汛防滑', w / 2, 186);
  });
  bbPoster(0.02, 0.42, 0.5, function(g2, w, h){
    g2.fillStyle = '#d8e2ee'; g2.fillRect(0, 0, w, h);
    g2.fillStyle = '#2e6da8'; g2.font = fontOf(40, '900'); g2.textAlign = 'center';
    g2.fillText('招租', w / 2, 66);
    g2.fillStyle = '#39435a'; g2.font = fontOf(26, 'bold');
    g2.fillText('临街铺面', w / 2, 130);
    g2.fillText('138××××', w / 2, 172);
  });
  bbPoster(0.55, 0.36, 0.62, function(g2, w, h){
    g2.fillStyle = '#f4d35e'; g2.fillRect(0, 0, w, h);
    g2.fillStyle = '#b3541e'; g2.font = fontOf(36, '900'); g2.textAlign = 'center';
    g2.fillText('温馨提示', w / 2, 60);
    g2.fillStyle = '#5a4a1a'; g2.font = fontOf(24, 'bold');
    g2.fillText('路滑慢行', w / 2, 120);
    g2.fillText('小心水坑', w / 2, 158);
  });

  // —— 自行车 ×3 ——
  function makeBike(color, x, z, ry, basket){
    const b = new THREE.Group(); scene.add(b);
    b.position.set(x, WALK_Y, z); b.rotation.y = ry;
    const tireMat = toon(0x22293a);
    const frameMat = toon(color);
    const metalMat2 = toon(0x8b95a6);
    [[-0.45], [0.45]].forEach(function(p){
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 22), tireMat);
      w.position.set(p[0], 0.32, 0);
      w.castShadow = true;
      outline(w, 0.018);
      b.add(w);
      cyl(b, 0.045, 0.045, 0.06, metalMat2, p[0], 0.32, 0, { rx: Math.PI / 2, cast: false });
    });
    tube(b, new THREE.Vector3(-0.45, 0.32, 0), new THREE.Vector3(-0.12, 0.72, 0), 0.025, frameMat);
    tube(b, new THREE.Vector3(-0.12, 0.72, 0), new THREE.Vector3(0.3, 0.7, 0), 0.025, frameMat);
    tube(b, new THREE.Vector3(0.3, 0.7, 0), new THREE.Vector3(0.45, 0.32, 0), 0.025, frameMat);
    tube(b, new THREE.Vector3(-0.12, 0.72, 0), new THREE.Vector3(0.08, 0.34, 0), 0.022, frameMat);
    tube(b, new THREE.Vector3(-0.45, 0.32, 0), new THREE.Vector3(0.08, 0.34, 0), 0.022, frameMat);
    tube(b, new THREE.Vector3(0.3, 0.7, 0), new THREE.Vector3(0.38, 0.95, 0), 0.022, metalMat2);
    tube(b, new THREE.Vector3(0.3, 0.95, 0), new THREE.Vector3(0.5, 0.95, 0), 0.02, metalMat2);
    box(b, 0.2, 0.05, 0.08, toon(0x2b3244), -0.18, 0.78, 0, { cast: false });
    tube(b, new THREE.Vector3(-0.12, 0.72, 0), new THREE.Vector3(-0.3, 0.98, 0), 0.02, metalMat2);
    if (basket) box(b, 0.26, 0.18, 0.22, toon(0xcfd6e0), 0.48, 0.82, 0, { outline: 0.015 });
    return b;
  }
  makeBike(0x3f8f8a, -11.35, 3.75, 1.35, false).rotation.z = 0.1;
  makeBike(0xd07840, -3.3, 6.15, -0.3, true);
  makeBike(0x8a93a4, 11.2, 8.6, 1.9, false);
}
/* ============================================================ 对街小货车 + 车后亲吻的Q版情侣 */
function heartTexture(){
  if (S.texHeart) return S.texHeart;
  S.texHeart = makeTex(64, 64, function(g){
    g.fillStyle = '#ff7a9e';
    g.beginPath();
    g.moveTo(32, 56);
    g.bezierCurveTo(6, 38, 8, 14, 24, 14);
    g.bezierCurveTo(30, 14, 32, 20, 32, 23);
    g.bezierCurveTo(32, 20, 34, 14, 40, 14);
    g.bezierCurveTo(56, 14, 58, 38, 32, 56);
    g.fill();
  });
  return S.texHeart;
}
function buildVanCouple(scene){
  const g = new THREE.Group(); scene.add(g);

  /* —— 厢式小货车（停便利店对面，车头朝 +x） —— */
  const van = new THREE.Group(); g.add(van);
  van.position.set(-9.5, 0, 11.6);
  const whiteMat = toon(0xeef0f2);
  const cabMat = toon(0xd8604a);
  const darkMat2 = toon(0x2b3244);
  const glassDark = new THREE.MeshPhongMaterial({ color: 0x1a2436, shininess: 100 });
  // 底盘
  box(van, 5.0, 0.3, 1.86, darkMat2, 0, 0.6, 0, { outline: 0.04 });
  // 货厢（侧面喷“一休仓买 货运配送”；两侧贴图方向相反保证都可读）
  function drawVanSide(g2, w, h){
    g2.fillStyle = '#eef0f2'; g2.fillRect(0, 0, w, h);
    g2.fillStyle = '#e2482f'; g2.fillRect(0, 56, w, 14); g2.fillRect(0, h - 78, w, 24);
    g2.fillStyle = '#e2482f'; g2.font = fontOf(170, '900'); g2.textAlign = 'left'; g2.textBaseline = 'middle';
    g2.fillText('一休仓买', 66, 205);
    g2.fillStyle = '#8b94a8'; g2.font = fontOf(46, 'bold');
    g2.fillText('136 5465 5438', 70, 322);
    g2.fillStyle = '#39435a'; g2.font = fontOf(74, 'bold');
    g2.fillText('货运配送 · 24H', 66, 392);
  }
  // 货厢（侧面喷“一休仓买 货运配送”；Box 各面 UV 自外侧看均不镜像，共用一张贴图）
  const sideMat = new THREE.MeshBasicMaterial({ map: makeTex(1024, 512, drawVanSide) });
  const cargo = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.2, 2.05), [whiteMat, whiteMat, whiteMat, whiteMat, sideMat, sideMat]);
  cargo.position.set(-0.75, 2.0, 0);
  cargo.castShadow = true;
  outline(cargo, 0.05);
  van.add(cargo);
  // 后门缝 + 把手 + 尾灯
  box(van, 0.04, 1.9, 0.05, toon(0x9aa2b2), -2.52, 2.0, -0.38, { cast: false });
  box(van, 0.04, 1.9, 0.05, toon(0x9aa2b2), -2.52, 2.0, 0.38, { cast: false });
  box(van, 0.06, 0.06, 0.26, toon(0x6a7488), -2.56, 1.35, 0, { cast: false });
  [[-0.78], [0.78]].forEach(function(p){
    box(van, 0.05, 0.16, 0.2, toon(0x8f2f26), -2.56, 1.1, p[0], { cast: false });
  });
  // 驾驶室
  box(van, 1.5, 1.25, 1.9, cabMat, 2.05, 1.5, 0, { outline: 0.045 });
  // 风挡：嵌在驾驶室前脸内、顶部后仰（父组做世界轴后仰角）
  const wsGroup = new THREE.Group();
  wsGroup.position.set(2.86, 1.72, 0);
  wsGroup.rotation.z = 0.1;
  van.add(wsGroup);
  plane(wsGroup, 1.6, 0.68, glassDark, 0, 0, 0, { ry: Math.PI / 2, renderOrder: 5 });
  // 侧窗
  plane(van, 0.74, 0.5, glassDark, 2.18, 1.78, 0.962, { renderOrder: 5 });
  plane(van, 0.74, 0.5, glassDark, 2.18, 1.78, -0.962, { ry: Math.PI, renderOrder: 5 });
  box(van, 0.28, 0.36, 1.95, toon(0x39435a), 2.92, 0.68, 0, { outline: 0.03 });
  box(van, 0.1, 0.15, 0.34, new THREE.MeshBasicMaterial({ color: 0x9aa4b2 }), 2.96, 1.0, 0.6, { cast: false });
  box(van, 0.1, 0.15, 0.34, new THREE.MeshBasicMaterial({ color: 0x9aa4b2 }), 2.96, 1.0, -0.6, { cast: false });
  // 后视镜
  tube(van, new THREE.Vector3(2.55, 1.95, 0.95), new THREE.Vector3(2.5, 1.98, 1.2), 0.02, darkMat2);
  box(van, 0.06, 0.16, 0.1, cabMat, 2.48, 1.98, 1.24, { cast: false });
  tube(van, new THREE.Vector3(2.55, 1.95, -0.95), new THREE.Vector3(2.5, 1.98, -1.2), 0.02, darkMat2);
  box(van, 0.06, 0.16, 0.1, cabMat, 2.48, 1.98, -1.24, { cast: false });
  // 车轮
  const tireMat = toon(0x1c222f);
  [[1.55, 0.85], [1.55, -0.85], [-1.7, 0.85], [-1.7, -0.85]].forEach(function(p){
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.115, 10, 20), tireMat);
    w.position.set(p[0], 0.47, p[1]);
    w.castShadow = true;
    van.add(w);
    cyl(van, 0.13, 0.13, 0.12, toon(0x8b94a8), p[0], 0.47, p[1] * 1.05, { rx: Math.PI / 2, cast: false });
  });
  // 车牌
  const plateTex = makeTex(128, 44, function(g2, w, h){
    g2.fillStyle = '#2b5bb8'; g2.fillRect(0, 0, w, h);
    g2.strokeStyle = '#ffffff'; g2.lineWidth = 3; g2.strokeRect(2, 2, w - 4, h - 4);
    g2.fillStyle = '#ffffff'; g2.font = fontOf(26, 'bold'); g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.fillText('A·1024', w / 2, h / 2 + 2);
  });
  const plateMat = new THREE.MeshBasicMaterial({ map: plateTex });
  plane(van, 0.5, 0.17, plateMat, 3.06, 0.7, 0, { ry: Math.PI / 2, renderOrder: 4 });
  plane(van, 0.5, 0.17, plateMat, -2.58, 0.72, 0, { ry: -Math.PI / 2, renderOrder: 4 });

  /* —— 货车北侧、与便利店门口隔着车身的Q版情侣（精细版） —— */
  const SKIN = 0xf3d2bc;
  const COUPLE_Z = 13.35; // 对街人行道，货车正好挡住便利店门口的视线
  function chibi(cx, f, opt){
    const c = new THREE.Group();
    c.position.set(cx, WALK_Y, COUPLE_Z);
    g.add(c);
    const topMat = toon(opt.top);

    // —— 躯干（外套，微微前倾向对方） ——
    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 14), topMat);
    torso.scale.set(0.82, 1.08, 0.7);
    torso.position.set(0, 0.4, 0);
    torso.rotation.z = -f * 0.3;
    torso.castShadow = true;
    c.add(torso);
    // 兜帽/后领
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), topMat);
    hood.scale.set(0.95, 0.68, 1.05);
    hood.position.set(-f * 0.17, 0.6, 0);
    c.add(hood);
    if (opt.skirt){
      // 女生：裙摆
      const skirt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.31, 0.24, 14, 1, true),
        new THREE.MeshLambertMaterial({ color: opt.skirt, side: THREE.DoubleSide })
      );
      skirt.position.set(f * 0.04, 0.29, 0);
      skirt.rotation.z = -f * 0.22;
      c.add(skirt);
    } else {
      // 男生：外套下摆
      const hem = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.045, 8, 16), topMat);
      hem.rotation.x = Math.PI / 2 - f * 0.22;
      hem.position.set(f * 0.03, 0.23, 0);
      hem.scale.set(1, 1, 0.78);
      c.add(hem);
    }

    // —— 蹲姿双腿：大腿朝对方、膝盖、小腿折收、鞋 ——
    [0.13, -0.13].forEach(function(zz){
      tube(c, new THREE.Vector3(f * 0.02, 0.27, zz), new THREE.Vector3(f * 0.3, 0.25, zz * 1.3), 0.082, toon(opt.leg));
      const knee = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), toon(opt.leg));
      knee.position.set(f * 0.31, 0.25, zz * 1.3);
      knee.castShadow = true;
      c.add(knee);
      tube(c, new THREE.Vector3(f * 0.31, 0.25, zz * 1.3), new THREE.Vector3(f * 0.13, 0.075, zz * 1.5), 0.055, toon(opt.leg));
      box(c, 0.21, 0.085, 0.11, toon(opt.shoe), f * 0.07, 0.05, zz * 1.5, { cast: false });
    });

    // —— 手臂（上臂 + 前臂 + 手）：环腰与搭肩 ——
    function arm(a, b, elbow, r){
      tube(c, a, elbow, r, topMat);
      tube(c, elbow, b, r * 0.85, topMat);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 8), toon(SKIN));
      hand.position.copy(b);
      c.add(hand);
    }
    // 环腰
    arm(
      new THREE.Vector3(f * 0.1, 0.52, -0.16),
      new THREE.Vector3(f * 0.55, 0.33, -0.08),
      new THREE.Vector3(f * 0.28, 0.36, -0.22), 0.05
    );
    // 搭肩
    arm(
      new THREE.Vector3(f * 0.08, 0.56, 0.15),
      new THREE.Vector3(f * 0.56, 0.74, 0.03),
      new THREE.Vector3(f * 0.3, 0.7, 0.12), 0.05
    );

    // —— 头（向对方倾，脸颊相贴） ——
    const head = new THREE.Group();
    head.position.set(f * 0.24, 0.95, 0);
    head.rotation.z = -f * 0.36;
    c.add(head);
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 16), toon(SKIN));
    face.castShadow = true;
    head.add(face);
    // 耳朵
    [0.27, -0.27].forEach(function(z){
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), toon(SKIN));
      ear.position.set(-f * 0.02, -0.03, z);
      head.add(ear);
    });
    // 头发：主发帽（男生贴头短发 / 女生后脑收拢扎马尾）
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.325, 16, 14), toon(opt.hair));
    hair.position.set(-f * 0.04, 0.06, 0);
    hair.scale.set(1, 0.97, 1.02);
    head.add(hair);
    if (opt.ponytail){
      const nape = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), toon(opt.hair));
      nape.position.set(-f * 0.14, -0.08, 0);
      nape.scale.set(0.9, 0.85, 0.95);
      head.add(nape);
    } else {
      const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), toon(opt.hair));
      hairBack.position.set(-f * 0.08, -0.01, 0);
      head.add(hairBack);
      // 鬓角
      [0.26, -0.26].forEach(function(z){
        const sb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), toon(opt.hair));
        sb.scale.set(0.6, 1.4, 0.8);
        sb.position.set(f * 0.02, -0.12, z);
        head.add(sb);
      });
    }
    // 刘海
    if (opt.sweptBangs){
      // 斜刘海：一条长刘海斜扫过一侧额头
      const sweep = new THREE.Mesh(new THREE.SphereGeometry(0.095, 8, 8), toon(opt.hair));
      sweep.scale.set(0.45, 2.1, 0.9);
      sweep.position.set(f * 0.2, 0.07, 0.09);
      sweep.rotation.x = 0.55;
      head.add(sweep);
      [-0.05, -0.16].forEach(function(zz, i){
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), toon(opt.hair));
        b.scale.set(0.5, 1.3, 0.85);
        b.position.set(f * 0.2, 0.18 - i * 0.015, zz);
        b.rotation.x = -zz * 1.4;
        head.add(b);
      });
    } else {
      [-0.19, -0.065, 0.065, 0.19].forEach(function(zz, i){
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), toon(opt.hair));
        b.scale.set(0.5, 1.15, 0.85);
        b.position.set(f * 0.2, 0.15 + (i % 2) * 0.02, zz);
        b.rotation.x = -zz * 1.6;
        head.add(b);
      });
    }
    // 单马尾：发绳 + 垂在脑后的发束
    if (opt.ponytail){
      const tie = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff8aa0 }));
      tie.position.set(-f * 0.26, 0.15, 0);
      head.add(tie);
      [[0.32, 0.07, 0.015, 0.095], [0.38, -0.13, 0.035, 0.082], [0.39, -0.33, 0.05, 0.068], [0.36, -0.51, 0.065, 0.05]].forEach(function(p){
        const t = new THREE.Mesh(new THREE.SphereGeometry(p[3], 8, 8), toon(opt.hair));
        t.position.set(-f * p[0], p[1], p[2]);
        head.add(t);
      });
    }
    // 弯弯的闭眼（∩形）+ 腮红
    [0.115, -0.115].forEach(function(e){
      const eye = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 12, Math.PI), new THREE.MeshBasicMaterial({ color: 0x33283c }));
      eye.position.set(f * 0.262, 0.015, e);
      eye.rotation.y = f * Math.PI / 2;
      head.add(eye);
      const bl = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf2a0aa }));
      bl.scale.set(0.3, 0.9, 1);
      bl.position.set(f * 0.245, -0.095, e * 1.35);
      head.add(bl);
    });
    // 围巾 + 垂尾
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.062, 8, 14), toon(opt.scarf));
    scarf.rotation.x = Math.PI / 2 - f * 0.22;
    scarf.position.set(f * 0.06, 0.63, 0);
    c.add(scarf);
    box(c, 0.09, 0.21, 0.07, toon(opt.scarf), -f * 0.05, 0.45, 0.14, { cast: false });
    return head;
  }
  // 男生（深蓝夹克 + 深色长裤，呆毛）
  const boyHead = chibi(-14.05, 1, {
    hair: 0x2a3242, top: 0x46648a, leg: 0x39435a, shoe: 0xd8dde6, scarf: 0x4a8a8a
  });
  const ahoge = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.18, 6), toon(0x2a3242));
  ahoge.position.set(-0.05, 0.38, 0.01);
  ahoge.rotation.z = 0.55;
  boyHead.add(ahoge);
  // 女生（奶油色大衣 + 粉裙，单马尾 + 斜刘海，蝴蝶结扎在发绳处）
  const girlHead = chibi(-13.15, -1, {
    hair: 0x7a4a30, top: 0xf2e0d0, skirt: 0xc2586e, leg: SKIN, shoe: 0xb45a68, scarf: 0xe8756e,
    ponytail: true, sweptBangs: true
  });
  const bowMat = new THREE.MeshBasicMaterial({ color: 0xff8aa0 });
  [-0.06, 0.06].forEach(function(dz){
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), bowMat);
    petal.scale.set(1.2, 0.75, 0.7);
    petal.position.set(0.27, 0.19, dz);
    girlHead.add(petal);
  });
  // 相贴的唇
  const lips = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: 0xe8756e }));
  lips.position.set(-13.6, 0.9, COUPLE_Z);
  lips.scale.set(1.2, 0.7, 0.9);
  g.add(lips);

  // 头顶飘出的小心心（life.js 驱动）
  S.r.hearts = [];
  for (let i = 0; i < 2; i++){
    const h = new THREE.Sprite(new THREE.SpriteMaterial({
      map: heartTexture(), color: 0xff8aa6, transparent: true, opacity: 0,
      depthWrite: false
    }));
    h.scale.set(0.24, 0.24, 1);
    h.position.set(-13.6, 1.15, COUPLE_Z);
    g.add(h);
    S.r.hearts.push(h);
  }

  // 对街建筑墙灯（照亮货车与两人）
  const wl = new THREE.Group(); g.add(wl);
  box(wl, 0.08, 0.08, 0.34, toon(0x39435a), -11, 3.14, 14.86, { cast: false });
  box(wl, 0.26, 0.14, 0.26, toon(0x2b3244), -11, 3.02, 14.72, { cast: false });
  S.r.wallBulbMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
  box(wl, 0.16, 0.08, 0.16, S.r.wallBulbMat, -11, 2.93, 14.72, { cast: false });
  sprite(wl, 0xffc97a, 1.6, 1.2, -11, 2.85, 14.6, 0.2);
}
/* ============================================================ 总装 */
function buildWorld(scene){
  buildBaseAndSky(scene);
  buildGround(scene);
  buildStoreExterior(scene);
  buildStoreInterior(scene);
  buildNeighbors(scene);
  buildBackground(scene);
  buildStreetProps(scene);
  buildVanCouple(scene);
}
