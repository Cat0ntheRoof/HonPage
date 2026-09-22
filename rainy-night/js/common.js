/* common.js — 共享工具、材质助手、全局状态 */
'use strict';

const S = { r: {}, puddles: [], glassPanes: [], dripEmitters: [] };

/* —— 稳定伪随机 —— */
function rng(seed){ let s = seed >>> 0; return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* —— 卡通渐变贴图（备用；当前环境 Toon+平行光存在驱动兼容问题，材质走 Lambert + 描边方案） —— */
function toon(color, opt){
  const p = Object.assign({ color: color }, opt || {});
  return new THREE.MeshLambertMaterial(p);
}

/* —— Canvas 贴图 —— */
function makeTex(w, h, draw){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}
function fontOf(px, w){ return (w || 'bold') + ' ' + px + 'px "Microsoft YaHei","PingFang SC","SimHei",sans-serif'; }
function rr(g, x, y, w, h, r){
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/* —— 轮廓线（反向外扩壳，三渲二描边） —— */
function outline(mesh, t, color){
  t = t || 0.045; color = (color === undefined) ? 0x0a0f1c : color;
  const g = mesh.geometry.clone();
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++){
    p.setXYZ(i, p.getX(i) + n.getX(i) * t, p.getY(i) + n.getY(i) * t, p.getZ(i) + n.getZ(i) * t);
  }
  p.needsUpdate = true;
  const o = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: color, side: THREE.BackSide }));
  o.castShadow = false; o.receiveShadow = false;
  mesh.add(o);
  return o;
}

/* —— 几何助手 —— */
function box(parent, w, h, d, mat, x, y, z, opt){
  opt = opt || {};
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (opt.rx) m.rotation.x = opt.rx;
  if (opt.ry) m.rotation.y = opt.ry;
  if (opt.rz) m.rotation.z = opt.rz;
  m.castShadow = opt.cast !== false;
  m.receiveShadow = opt.recv !== false;
  if (opt.outline) outline(m, opt.outline, opt.oColor);
  parent.add(m);
  return m;
}
function cyl(parent, rt, rb, h, mat, x, y, z, opt){
  opt = opt || {};
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, opt.seg || 14, 1, !!opt.open), mat);
  m.position.set(x, y, z);
  if (opt.rx) m.rotation.x = opt.rx;
  if (opt.ry) m.rotation.y = opt.ry;
  if (opt.rz) m.rotation.z = opt.rz;
  m.castShadow = opt.cast !== false;
  m.receiveShadow = opt.recv !== false;
  if (opt.outline) outline(m, opt.outline, opt.oColor);
  parent.add(m);
  return m;
}
function plane(parent, w, h, mat, x, y, z, opt){
  opt = opt || {};
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z);
  if (opt.rx) m.rotation.x = opt.rx;
  if (opt.ry) m.rotation.y = opt.ry;
  if (opt.rz) m.rotation.z = opt.rz;
  m.castShadow = false;
  m.receiveShadow = !!opt.recv;
  if (opt.renderOrder !== undefined) m.renderOrder = opt.renderOrder;
  parent.add(m);
  return m;
}
const UPV = new THREE.Vector3(0, 1, 0);
function tube(parent, a, b, r, mat){
  const d = b.clone().sub(a);
  const len = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), mat);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UPV, d.normalize());
  m.castShadow = true;
  parent.add(m);
  return m;
}
/* 悬链线电线 */
function wire(parent, a, b, sag, r, mat){
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y -= sag;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const g = new THREE.TubeGeometry(curve, 22, r || 0.02, 5, false);
  const m = new THREE.Mesh(g, mat || new THREE.MeshBasicMaterial({ color: 0x0b0f16 }));
  parent.add(m);
  return m;
}

/* —— 光晕贴图 / 光晕精灵 / 地面光池 —— */
function glowTexture(){
  if (S.texGlow) return S.texGlow;
  S.texGlow = makeTex(128, 128, function(g){
    const r = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.35, 'rgba(255,255,255,0.42)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  });
  return S.texGlow;
}
function sprite(parent, color, sx, sy, x, y, z, opacity){
  const m = new THREE.SpriteMaterial({
    map: glowTexture(), color: color, transparent: true,
    opacity: (opacity === undefined ? 0.3 : opacity),
    depthWrite: false, blending: THREE.AdditiveBlending
  });
  const s = new THREE.Sprite(m);
  s.scale.set(sx, sy, 1);
  s.position.set(x, y, z);
  parent.add(s);
  return s;
}
function pool(parent, color, r, x, y, z, opacity){
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(r, 24),
    new THREE.MeshBasicMaterial({ map: glowTexture(), color: color, transparent: true, opacity: opacity, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/* —— 湿地反射的灯光表（世界坐标，路面着色器用） —— */
const WET_LIGHTS = [
  { pos: new THREE.Vector3(-7.0, 6.3, 3.8),  col: new THREE.Color(0xff9a5c), str: 1.0  }, // 招牌
  { pos: new THREE.Vector3(-7.0, 2.0, 3.6),  col: new THREE.Color(0xffce8e), str: 0.9  }, // 门口内透
  { pos: new THREE.Vector3(2.5, 5.3, 7.7),   col: new THREE.Color(0xffc97a), str: 1.05 }, // 路灯1
  { pos: new THREE.Vector3(9.9, 5.0, 10.6),  col: new THREE.Color(0xffc97a), str: 0.85 }, // 路灯2
  { pos: new THREE.Vector3(-1.2, 1.6, 4.0),  col: new THREE.Color(0x7ad7f0), str: 0.6  }, // 贩卖机
  { pos: new THREE.Vector3(10.9, 3.0, 13.4), col: new THREE.Color(0xff4040), str: 0.85 }  // 信号灯（动态）
];
