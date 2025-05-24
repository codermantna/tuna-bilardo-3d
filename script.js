import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

let scene, camera, renderer;
let world; // fizik dünyası
let masa, masaBody;
let bilardoTopu, topBody;
let isteka, istekaBody;
let clock;

init();
animate();

function init() {
  // --- THREE.js sahne ayarları ---
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f662f);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 15, 25);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bilardoCanvas'), antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // --- Işık ---
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);

  // --- Fizik motoru (cannon-es) ---
  world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0), // yerçekimi (y ekseninde aşağı)
  });
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  // --- Masa (3D kutu) ---
  const masaGeo = new THREE.BoxGeometry(20, 1, 10);
  const masaMat = new THREE.MeshStandardMaterial({ color: 0x1c8c3a });
  masa = new THREE.Mesh(masaGeo, masaMat);
  masa.position.y = -0.5;
  scene.add(masa);

  masaBody = new CANNON.Body({
    mass: 0, // sabit nesne
    shape: new CANNON.Box(new CANNON.Vec3(10, 0.5, 5))
  });
  masaBody.position.copy(masa.position);
  world.addBody(masaBody);

  // --- Masa kenarları (engeller) ---
  const kenarKalınlık = 0.5;
  const kenarYükseklik = 2;
  const kenarlar = [];

  const positions = [
    {x: 0, y: kenarYükseklik/2, z: -5 - kenarKalınlık}, // arka kenar
    {x: 0, y: kenarYükseklik/2, z: 5 + kenarKalınlık},  // ön kenar
    {x: -10 - kenarKalınlık, y: kenarYükseklik/2, z: 0}, // sol kenar
    {x: 10 + kenarKalınlık, y: kenarYükseklik/2, z: 0},  // sağ kenar
  ];
  const kenarBoyutlar = [
    new CANNON.Vec3(10, kenarYükseklik/2, kenarKalınlık), // arka & ön kenar boyutu
    new CANNON.Vec3(kenarKalınlık, kenarYükseklik/2, 5),  // sol & sağ kenar boyutu
  ];

  positions.forEach((pos, i) => {
    let shape;
    if(i < 2) shape = new CANNON.Box(kenarBoyutlar[0]);
    else shape = new CANNON.Box(kenarBoyutlar[1]);

    const kenarBody = new CANNON.Body({ mass: 0 });
    kenarBody.addShape(shape);
    kenarBody.position.set(pos.x, pos.y, pos.z);
    world.addBody(kenarBody);

    // Görsel olarak da ekleyelim
    const geo = new THREE.BoxGeometry(
      shape.halfExtents.x*2,
      shape.halfExtents.y*2,
      shape.halfExtents.z*2
    );
    const mat = new THREE.MeshStandardMaterial({color:0x654321});
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(kenarBody.position);
    scene.add(mesh);
    kenarlar.push(mesh);
  });

  // --- Bilardo topu ---
  const topRadius = 0.5;
  const topGeo = new THREE.SphereGeometry(topRadius, 32, 32);
  const topMat = new THREE.MeshStandardMaterial({color: 0xffffff});
  bilardoTopu = new THREE.Mesh(topGeo, topMat);
  scene.add(bilardoTopu);

  topBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(topRadius),
    position: new CANNON.Vec3(0, topRadius, 0),
    linearDamping: 0.2,  // sürtünme gibi yavaşlatma
    angularDamping: 0.4
  });
  world.addBody(topBody);

  // --- İsteka ---
  const istekaGeo = new THREE.CylinderGeometry(0.05, 0.05, 7, 8);
  const istekaMat = new THREE.MeshStandardMaterial({color: 0x8b4513});
  isteka = new THREE.Mesh(istekaGeo, istekaMat);
  isteka.geometry.rotateZ(Math.PI/2); // yatay konumda
  scene.add(isteka);

  istekaBody = new CANNON.Body({ mass: 0 });
  const istekaShape = new CANNON.Cylinder(0.05, 0.05, 7, 8);
  istekaBody.addShape(istekaShape);
  istekaBody.position.set(0, topRadius, -5);
  world.addBody(istekaBody);

  // Saat
  clock = new THREE.Clock();

  // Fare hareketi ile isteka açısı kontrolü
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mousedown', onMouseDown);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// Fare pozisyonu
let mouseX = 0;
function onMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1; // -1 ile 1 arası

  // İstekayı topun etrafında döndür (y ekseni)
  const angle = mouseX * Math.PI / 2; // -90° ile 90°
  isteka.rotation.y = angle;

  // İstekanın pozisyonu topun arkasında kalmalı
  const distanceFromBall = 1.5;
  const x = topBody.position.x + Math.sin(angle) * distanceFromBall;
  const z = topBody.position.z + Math.cos(angle) * distanceFromBall;
  isteka.position.set(x, topBody.position.y, z);

  // Fizik gövdesini de aynı konuma taşı
  istekaBody.position.copy(isteka.position);
  istekaBody.quaternion.copy(isteka.quaternion);
}

// Vurma işlemi
function onMouseDown(event) {
  if(event.button !== 0) return; // sadece sol tık

  // İstekayı topa doğru ileri doğru hareket ettirip vuruyoruz
  // İsteka-top vektörü
  const dir = new CANNON.Vec3(
    topBody.position.x - isteka.position.x,
    0,
    topBody.position.z - isteka.position.z
  );
  dir.normalize();

  // Kuvvet büyüklüğü (sabitleyelim)
  const forceMagnitude = 20;

  // Kuvveti topun merkezine uygula
  topBody.applyImpulse(
    new CANNON.Vec3(dir.x * forceMagnitude, 0, dir.z * forceMagnitude),
    topBody.position
  );
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  world.step(1/60, delta);

  // Fizik pozisyonlarını THREE objelerine uygula
  bilardoTopu.position.copy(topBody.position);
  bilardoTopu.quaternion.copy(topBody.quaternion);

  // İstekanın pozisyonu ve dönüşü yukarıda mousemove ile kontrol ediliyor

  renderer.render(scene, camera);
}
