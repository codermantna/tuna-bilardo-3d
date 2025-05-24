// Global Değişkenler
let scene, camera, renderer;
let world; // Cannon.js fizik dünyası
let bilardoTopuBody, bilardoTopuMesh;
let masaMesh;

let power = 0;
let powerIncreasing = true;

const powerIndicator = document.getElementById('powerIndicator');
const canvas = document.getElementById('bilardoCanvas');

// Topa vurma için açıyı fare ile seçeceğiz
let vurusAci = 0; // radyan cinsinden
let vurusHazir = false;

init();
animate();

function init() {
  // Three.js sahnesi
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f662f);

  // Kamera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 15, 20);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Işık
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 5);
  scene.add(light);

  // Masa (düz bir kutu)
  const masaGeo = new THREE.BoxGeometry(20, 1, 10);
  const masaMat = new THREE.MeshStandardMaterial({ color: 0x1c8c3a });
  masaMesh = new THREE.Mesh(masaGeo, masaMat);
  masaMesh.position.y = -0.5;
  scene.add(masaMesh);

  // Fizik dünyası (Cannon.js)
  world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  // Masa için fizik gövdesi (statik)
  const masaShape = new CANNON.Box(new CANNON.Vec3(10, 0.5, 5));
  const masaBody = new CANNON.Body({ mass: 0 });
  masaBody.addShape(masaShape);
  masaBody.position.set(0, -0.5, 0);
  world.addBody(masaBody);

  // Top (küre)
  const topRadius = 0.5;
  const topGeo = new THREE.SphereGeometry(topRadius, 32, 32);
  const topMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  bilardoTopuMesh = new THREE.Mesh(topGeo, topMat);
  scene.add(bilardoTopuMesh);

  // Top fizik gövdesi
  const topShape = new CANNON.Sphere(topRadius);
  bilardoTopuBody = new CANNON.Body({ mass: 1, material: new CANNON.Material({friction: 0.2, restitution: 0.3}) });
  bilardoTopuBody.addShape(topShape);
  bilardoTopuBody.position.set(0, topRadius, 0);
  bilardoTopuBody.linearDamping = 0.4; // sürtünme etkisi
  world.addBody(bilardoTopuBody);

  // Olaylar
  window.addEventListener('resize', onWindowResize);

  // Fare ile açı belirleme
  canvas.addEventListener('mousemove', onMouseMove);

  // Space ile vurma
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && vurusHazir) {
      vurTop();
    }
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const centerX = rect.width / 2;

  // mouse x pozisyonu ile açı -45° ile +45° arası
  const maxAngle = Math.PI / 4; // 45 derece
  let relativeX = (mouseX - centerX) / (rect.width / 2);
  relativeX = Math.min(Math.max(relativeX, -1), 1);
  vurusAci = relativeX * maxAngle;

  vurusHazir = true;
}

function vurTop() {
  // Güç 0 - 100 arası
  const guc = power / 100 * 15; // kuvvet

  // Kuvvet vektörü: z ekseni boyunca (masa ileri doğrultusu)
  const forceX = Math.sin(vurusAci) * guc;
  const forceZ = -Math.cos(vurusAci) * guc; // negatif z yönü ileri

  bilardoTopuBody.velocity.set(forceX, 0, forceZ);

  vurusHazir = false; // tekrar açı seç
}

function animate() {
  requestAnimationFrame(animate);

  // Fizik simülasyonu (60fps)
  world.step(1/60);

  // Three.js nesneleri fizik pozisyonlarına göre güncelle
  bilardoTopuMesh.position.copy(bilardoTopuBody.position);
  bilardoTopuMesh.quaternion.copy(bilardoTopuBody.quaternion);

  // Güç göstergesi animasyonu
  if (powerIncreasing) {
    power += 1;
    if (power >= 100) powerIncreasing = false;
  } else {
    power -= 1;
    if (power <= 0) powerIncreasing = true;
  }
  powerIndicator.style.height = power + '%';

  renderer.render(scene, camera);
}
