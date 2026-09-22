/* life.js — 动效系统：降雨、滴水、波纹、招牌闪烁、自动门、信号灯等 */
'use strict';

const Life = (function(){
  let scene, camera;
  let rainMesh, rainData = [];
  let rings = [];
  let drips = [];
  let glassStreaks = [];
  let clouds = [];
  let rippleIdx = 0;
  let splashAcc = 0, rippleAcc = 0;
  let flick = { active: false, t: 2 }, badgeFlick = { active: false, t: 5 };
  let alleyFlick = { active: false, t: 8 };
  let doorT = Math.random() * 9;
  let elapsed = 0;

  const RAIN_N = 850;
  const RAIN_AREA = 24;

  /* —— 降雨 —— */
  function initRain(){
    const geo = new THREE.BoxGeometry(0.035, 1, 0.035);
    const mat = new THREE.MeshBasicMaterial({ color: 0x9db8e8, transparent: true, opacity: 0.32, depthWrite: false });
    rainMesh = new THREE.InstancedMesh(geo, mat, RAIN_N);
    rainMesh.frustumCulled = false;
    const rand = rng(99);
    for (let i = 0; i < RAIN_N; i++){
      rainData.push({
        x: (rand() - 0.5) * 2 * RAIN_AREA,
        y: rand() * 26,
        z: (rand() - 0.5) * 2 * RAIN_AREA,
        v: 13 + rand() * 8,
        len: 0.55 + rand() * 0.35
      });
    }
    scene.add(rainMesh);
  }
  const rainM = new THREE.Matrix4();
  const rainQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.1);
  function updateRain(dt){
    for (let i = 0; i < RAIN_N; i++){
      const d = rainData[i];
      d.y -= d.v * dt;
      d.x -= d.v * dt * 0.1;
      if (d.y < 0){ d.y = 24 + Math.random() * 4; d.x = (Math.random() - 0.5) * 2 * RAIN_AREA; d.z = (Math.random() - 0.5) * 2 * RAIN_AREA; }
      rainM.makeRotationZ(0.1);
      rainM.scale(new THREE.Vector3(1, d.len, 1));
      rainM.setPosition(d.x, d.y, d.z);
      rainMesh.setMatrixAt(i, rainM);
    }
    rainMesh.instanceMatrix.needsUpdate = true;
  }

  /* —— 涟漪（共享 uniforms） —— */
  function pushRipple(x, z, strength){
    const v = sharedRip.value[rippleIdx];
    v.set(x, z, sharedTime.value, strength);
    rippleIdx = (rippleIdx + 1) % RIP_N;
  }
  function updateAmbientRipples(dt){
    rippleAcc += dt * 7;
    while (rippleAcc > 1){
      rippleAcc -= 1;
      const p = S.puddles[Math.floor(Math.random() * S.puddles.length)];
      if (!p) break;
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random());
      pushRipple(p.x + Math.cos(a) * p.rx * r * 0.8, p.z + Math.sin(a) * p.rz * r * 0.8, 0.45 + Math.random() * 0.5);
    }
  }

  /* —— 落地水花圈 —— */
  const RING_N = 26;
  function initRings(){
    for (let i = 0; i < RING_N; i++){
      const m = new THREE.Mesh(
        new THREE.RingGeometry(0.42, 0.5, 20),
        new THREE.MeshBasicMaterial({ color: 0xaac4ee, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      scene.add(m);
      rings.push({ mesh: m, t: -1, x: 0, z: 0, y: ROAD_Y + 0.03 });
    }
  }
  const SPLASH_ZONES = [
    { x0: 4, x1: 10, z0: -20, z1: 7 }, { x0: -20, x1: 4, z0: 7, z1: 13 },
    { x0: 10, x1: 14, z0: 7, z1: 13 }, { x0: 4, x1: 10, z0: 7, z1: 13 },
    { x0: -20, x1: 4, z0: 3, z1: 7 }, { x0: 10, x1: 12, z0: -20, z1: 7 },
    { x0: -20, x1: 14, z0: 13, z1: 15 }, { x0: -2, x1: -0.4, z0: -6, z1: 3 }
  ];
  function spawnRing(x, z, y){
    for (let i = 0; i < RING_N; i++){
      const r = rings[i];
      if (r.t < 0){
        r.t = 0; r.x = x; r.z = z; r.y = (y === undefined) ? ROAD_Y + 0.03 : y;
        r.mesh.position.set(x, r.y, z);
        r.mesh.visible = true;
        return;
      }
    }
  }
  function randomSplash(){
    const zone = SPLASH_ZONES[Math.floor(Math.random() * SPLASH_ZONES.length)];
    spawnRing(zone.x0 + Math.random() * (zone.x1 - zone.x0), zone.z0 + Math.random() * (zone.z1 - zone.z0));
  }
  function updateRings(dt){
    rings.forEach(function(r){
      if (r.t < 0) return;
      r.t += dt;
      const p = r.t / 0.55;
      if (p >= 1){ r.t = -1; r.mesh.visible = false; return; }
      const s = 0.3 + p * 1.5;
      r.mesh.scale.set(s, s, 1);
      r.mesh.material.opacity = 0.42 * (1 - p);
    });
  }

  /* —— 屋檐 / 空调滴水 —— */
  function initDrips(){
    const mat = new THREE.MeshBasicMaterial({ color: 0x9db8e8, transparent: true, opacity: 0.55, depthWrite: false });
    S.dripEmitters.forEach(function(e){
      e.timer = Math.random() * 1.2;
      for (let k = 0; k < 2; k++){
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.22, 0.025), mat);
        m.visible = false;
        scene.add(m);
        drips.push({ mesh: m, e: e, active: false, y: 0 });
      }
    });
  }
  function updateDrips(dt){
    S.dripEmitters.forEach(function(e){
      e.timer -= dt;
      if (e.timer <= 0){
        e.timer = 0.5 + Math.random() * 1.1;
        for (let i = 0; i < drips.length; i++){
          const d = drips[i];
          if (!d.active && d.e === e){
            d.active = true; d.y = e.y;
            d.mesh.visible = true;
            d.mesh.position.set(e.x, d.y, e.z);
            break;
          }
        }
      }
    });
    drips.forEach(function(d){
      if (!d.active) return;
      d.y -= 9 * dt;
      if (d.y <= 0.1){
        d.active = false; d.mesh.visible = false;
        spawnRing(d.e.x, d.e.z, WALK_Y + 0.05);
        pushRipple(d.e.x, d.e.z, 0.9);
        return;
      }
      d.mesh.position.y = d.y;
    });
  }

  /* —— 玻璃雨水滑落 —— */
  function initGlassStreaks(){
    const mat = new THREE.MeshBasicMaterial({ color: 0xd8e8ff, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    S.glassPanes.forEach(function(p){
      if (p.side) return;
      for (let i = 0; i < 4; i++){
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.45), mat);
        m.renderOrder = 9;
        scene.add(m);
        glassStreaks.push({
          mesh: m, pane: p,
          x: p.x0 + Math.random() * (p.x1 - p.x0),
          y: p.y0 + Math.random() * (p.y1 - p.y0),
          v: 0.25 + Math.random() * 0.35
        });
      }
    });
  }
  function updateGlassStreaks(dt){
    glassStreaks.forEach(function(s){
      s.y -= s.v * dt;
      if (s.y < s.pane.y0){ s.y = s.pane.y1; s.x = s.pane.x0 + Math.random() * (s.pane.x1 - s.pane.x0); s.v = 0.25 + Math.random() * 0.35; }
      s.mesh.position.set(s.x, s.y, s.pane.z + 0.015);
    });
  }

  /* —— 自动门 —— */
  function updateDoor(dt){
    doorT += dt;
    const T = 8.5, p = doorT % T;
    let amt = 0;
    if (p < 0.7) amt = p / 0.7;
    else if (p < 3.4) amt = 1;
    else if (p < 4.1) amt = 1 - (p - 3.4) / 0.7;
    amt = amt * amt * (3 - 2 * amt); // smoothstep
    S.r.doorL.position.x = -7.62 - 0.62 * amt;
    S.r.doorR.position.x = -6.38 + 0.62 * amt;
    S.r.doorShaft.material.opacity = 0.15 * amt;
    S.r.doorPool.material.opacity = 0.13 * amt;
  }

  /* —— 招牌闪烁 —— */
  function updateSign(dt){
    flick.t -= dt;
    if (flick.t <= 0){
      flick.active = !flick.active;
      flick.t = flick.active ? (0.04 + Math.random() * 0.09) : (2.5 + Math.random() * 5.5);
    }
    let v = flick.active ? (0.25 + Math.random() * 0.4) : (1 + Math.sin(elapsed * 31) * 0.018);
    S.r.signMat.color.setScalar(v);
    S.r.stripMats.forEach(function(m){ m.color.setScalar(Math.max(0.4, v)); });
    S.r.signGlow.material.opacity = 0.17 * v;

    badgeFlick.t -= dt;
    if (badgeFlick.t <= 0){
      badgeFlick.active = !badgeFlick.active;
      badgeFlick.t = badgeFlick.active ? 0.09 : (4 + Math.random() * 7);
    }
    // 灯箱呼吸
    const br = 0.93 + Math.sin(elapsed * 1.7) * 0.05;
    (S.r.lightboxes || []).forEach(function(m){ m.color.setScalar(br); });
    // 贩卖机窗闪
    if (Math.random() < dt * 0.12) S.r.vendMat.color.setScalar(0.55 + Math.random() * 0.45);
    else S.r.vendMat.color.lerp(new THREE.Color(1, 1, 1), dt * 6);
    // 面馆招牌微光呼吸
    S.r.nbSignMat.color.setScalar(0.9 + Math.sin(elapsed * 2.3) * 0.06);
    // 巷内壁灯偶尔闪
    alleyFlick.t -= dt;
    if (alleyFlick.t <= 0){
      alleyFlick.active = !alleyFlick.active;
      alleyFlick.t = alleyFlick.active ? 0.06 : (6 + Math.random() * 9);
    }
    S.r.alleyBulbMat.color.setScalar(alleyFlick.active ? 0.2 : 1);
    if (Life.alleyLight) Life.alleyLight.intensity = alleyFlick.active ? 0.08 : 0.4;
  }

  /* —— 远处交通信号灯 —— */
  function updateTraffic(){
    const T = 7.6, p = elapsed % T;
    let idx; // 0红 1黄 2绿
    if (p < 3.6) idx = 0;
    else if (p < 6.8) idx = 2;
    else idx = 1;
    const off = [0x3a1216, 0x3a2e12, 0x12321e];
    S.r.trafficMats.forEach(function(m, i){
      m.color.setHex(i === idx ? S.r.trafficOn[i] : off[i]);
    });
    S.r.trafficGlows.forEach(function(g, i){
      g.material.opacity = (i === idx) ? 0.55 : 0;
    });
    const cols = [0xff4040, 0xffc23e, 0x37d97a];
    WET_LIGHTS[5].col.setHex(cols[idx]);
    if (Life.trafficLight) Life.trafficLight.color.setHex(cols[idx]);
  }

  /* —— 关东煮蒸汽 —— */
  function updateSteam(){
    (S.r.steam || []).forEach(function(sp, i){
      const p = (elapsed * 0.42 + i / 3) % 1;
      sp.position.y = 1.52 + p * 0.95;
      sp.position.x = -2.72 + Math.sin(elapsed * 1.4 + i * 2.1) * 0.06;
      const s = 0.32 + p * 0.8;
      sp.scale.set(s, s, 1);
      sp.material.opacity = Math.sin(p * Math.PI) * 0.3;
    });
  }

  /* —— 情侣头顶的小心心 —— */
  function updateHearts(){
    (S.r.hearts || []).forEach(function(h, i){
      const p = (elapsed * 0.4 + i * 0.5) % 1;
      h.position.set(-13.6 + Math.sin(elapsed * 2.2 + i * 3.1) * 0.07, 1.12 + p * 0.5, 13.35);
      const s = 0.2 + p * 0.12;
      h.scale.set(s, s, 1);
      h.material.opacity = Math.sin(p * Math.PI) * 0.9;
    });
  }

  /* —— 云 —— */
  function initClouds(){
    for (let i = 0; i < 4; i++){
      const c = sprite(scene, 0x1c2440, 26 + Math.random() * 14, 9, (Math.random() - 0.5) * 70, 26 + Math.random() * 8, -40 - Math.random() * 30, 0.4);
      c.material.rotation = 0;
      clouds.push(c);
    }
  }
  function updateClouds(dt){
    clouds.forEach(function(c){
      c.position.x += dt * 0.5;
      if (c.position.x > 55) c.position.x = -55;
    });
  }

  return {
    init: function(sc, cam){
      scene = sc; camera = cam;
      initRain();
      initRings();
      initDrips();
      initGlassStreaks();
      initClouds();
    },
    update: function(dt){
      elapsed += dt;
      sharedTime.value = elapsed;
      updateRain(dt);
      updateRings(dt);
      updateAmbientRipples(dt);
      updateDrips(dt);
      updateGlassStreaks(dt);
      updateDoor(dt);
      updateSign(dt);
      updateTraffic();
      updateSteam();
      updateHearts();
      updateClouds(dt);
      splashAcc += dt * 11;
      while (splashAcc > 1){ splashAcc -= 1; randomSplash(); }
    }
  };
})();
