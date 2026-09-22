/* main.js — 渲染器、相机、灯光、主循环 */
'use strict';

(function(){
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a1020, 0.0075);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(18, 10.5, 21);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(-0.5, 2.2, 0);
  window.__cam = camera; window.__ctl = controls; window.__scene = scene; // 调试用句柄（无界面）
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 3.5;
  controls.maxDistance = 85;
  controls.maxPolarAngle = Math.PI * 0.485;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.55;
  controls.addEventListener('start', function(){ controls.autoRotate = false; });

  /* —— 灯光 —— */
  scene.add(new THREE.HemisphereLight(0x4a5a94, 0x1a2135, 0.85));

  const moon = new THREE.DirectionalLight(0x8fa8ff, 0.85);
  moon.position.set(-26, 38, -20);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.left = -26; moon.shadow.camera.right = 26;
  moon.shadow.camera.top = 26; moon.shadow.camera.bottom = -26;
  moon.shadow.camera.near = 5; moon.shadow.camera.far = 90;
  moon.shadow.bias = -0.0005;
  moon.shadow.normalBias = 0.02;
  scene.add(moon);

  // 正面冷色补光（恢复雨夜蓝调，避免暖光独占立面）
  const fill = new THREE.DirectionalLight(0x5f6fa8, 0.4);
  fill.position.set(24, 22, 32);
  scene.add(fill);

  function pLight(x, y, z, color, intensity, dist){
    const l = new THREE.PointLight(color, intensity, dist);
    l.position.set(x, y, z);
    scene.add(l);
    return l;
  }
  // 店内暖光（收窄距离，只照店内+门口微溢出）
  pLight(-8.5, 4.5, -1.8, 0xffd7a8, 3.0, 11);
  pLight(-4.6, 4.5, -1.8, 0xffd7a8, 2.8, 11);
  pLight(-7, 3.5, 1.8, 0xffe2b8, 1.8, 9);
  pLight(-7.8, 1.7, -4.4, 0xbfe0ff, 0.8, 8);   // 冷柜冷光
  // 招牌（弱化，避免红染）
  pLight(-7, 6.4, 4.2, 0xffb98a, 0.55, 8);
  // 巷内壁灯
  Life.alleyLight = pLight(-1.2, 2.6, 1.6, 0xffc9a0, 0.4, 5);
  // 对街墙灯（照亮货车与情侣）
  pLight(-11, 2.9, 14.4, 0xffd0a0, 0.6, 10);
  // 贩卖机
  pLight(-1.2, 1.6, 4.4, 0x86d9f2, 0.5, 5);
  // 路灯
  function spot(x, y, z, tx, tz){
    const s = new THREE.SpotLight(0xffd9a0, 1.9, 19, 0.62, 0.5);
    s.position.set(x, y, z);
    s.target.position.set(tx, 0, tz);
    scene.add(s); scene.add(s.target);
    return s;
  }
  spot(2.5, 5.3, 7.7, 2.5, 8.6);
  spot(9.9, 5.0, 10.6, 8.8, 10.6);
  // 信号灯
  Life.trafficLight = pLight(10.9, 3.0, 13.2, 0xff4040, 0.7, 7);

  /* —— 组装 —— */
  buildWorld(scene);
  Life.init(scene, camera);

  window.addEventListener('resize', function(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  (function loop(){
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    Life.update(dt);
    controls.update();
    renderer.render(scene, camera);
  })();
})();
