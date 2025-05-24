// Temel değişkenler
let scene, camera, renderer;
let world;
let masaMesh, masaBody;
let kenarlar = []; // cushion mesh ve body
let bilardoTopuMesh, bilardoTopuBody;

const topRadius = 0.5;

let power = 0;
let powerIncreasing = true;
let vurusHazir = false;

let vurusAci = 0; // topa vurma açısı 0-2PI arası (tam daire)

const powerIndicator = document.getElementById('powerIndicator');
const canvas = document.getElementById('bilardoCanvas');

init();
animate();

function init() {
  // Three.js setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f662f);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 20, 25);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Işık
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 20, 10);
  scene.add(light);

  // Masa - taban
  const masaWidth = 20;
  const masaHeight = 1;
  const masaDepth = 10;

  const masaGeo = new THREE.BoxGeometry(masaWidth, masaHeight, masaDepth);
  const masaMat = new THREE.MeshStandardMaterial({ color: 0x1c8c3a });
  masaMesh = new THREE.Mesh(masaGeo, masaMat);
  masaMesh.position.y = -masaHeight/2;
  scene.add(masaMesh);

  // Masa kenarları (cushions) - üstte koyu kahverengi silindir benzeri
  // Masa kenarlarını 4 tane uzun kutu olarak koyacağız

  const kenarKalınlık = 0.5;
  const kenarYukseklik = 1;

  const kenarMat = new THREE.MeshStandardMaterial({ color: 0x654321 });

  // Ön ve arka kenar (x yönünde)
  const kenarGeoX = new THREE.BoxGeometry(masaWidth, kenarYukseklik, kenarKalınlık);
  const önKenarMesh = new THREE.Mesh(kenarGeoX, kenarMat);
  önKenarMesh.position.set(0, kenarYukseklik/2 - masaHeight/2, masaDepth/2 + kenarKalınlık/2);
  scene.add(önKenarMesh);

  const arkaKenarMesh = önKenarMesh.clone();
  arkaKenarMesh.position.set(0, kenarYukseklik/2 - masaHeight/2, -masaDepth/2 - kenarKalınlık/2);
  scene.add(arkaKenarMesh);

  // Sağ ve sol kenar (z yönünde)
  const kenarGeoZ = new THREE.BoxGeometry(kenarKalınlık, kenarYukseklik, masaDepth + kenarKalınlık*2);
  const sagKenarMesh = new THREE.Mesh(kenarGeoZ, kenarMat);
  sagKenarMesh.position.set(masaWidth/2 + kenarKalınlık/2, kenarYukseklik/2 - masaHeight/2, 0);
  scene.add(sagKenarMesh);

  const solKenarMesh = sagKenarMesh.clone();
  solKenarMesh.position.set(-masaWidth/2 - kenarKalınlık/2, kenarYukseklik/2 - masaHeight/2, 0);
  scene.add(solKenarMesh);

  kenarlar.push(önKenarMesh, arkaKenarMesh, sagKenarMesh, solKenarMesh);

  // Cannon.js dünya
  world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  // Masa tabanı fizik (statik)
  const masaShape = new CANNON.Box(new CANNON.Vec3(masaWidth/2, masaHeight/2, masaDepth/2));
  masaBody = new CANNON.Body({ mass: 0 });
  masaBody.addShape(masaShape);
  masaBody.position.set(0, -masaHeight/2, 0);
  world.addBody(masaBody);

  // Masa kenarları fizik
  const kenarShapeX = new CANNON.Box(new CANNON.Vec3(masaWidth/2, kenarYukseklik/2, kenarKalınlık/2));
  const kenarShapeZ = new CANNON.Box(new CANNON.Vec3(kenarKalınlık/2, kenarYukseklik/2, masaDepth/2 + kenarKalınlık));

  // Ön kenar
  let önKenarBody = new CANNON.Body({ mass: 0 });
  önKenarBody.addShape(kenarShapeX);
  önKenarBody.position.set(0, kenarYukseklik/2 - masaHeight/2, masaDepth/2 + kenarKalınlık/2);
  world.addBody(önKenarBody);

  // Arka kenar
  let arkaKenarBody = new CANNON.Body({ mass: 0 });
  arkaKenarBody.addShape(kenarShapeX);
  arkaKenarBody.position.set(0, kenarYukseklik/2 - masaHeight/2, -masaDepth/2 - kenarKalınlık/2);
  world.addBody(arkaKenarBody);

  // Sağ kenar
  let sagKenarBody = new CANNON.Body({ mass: 0 });
  sagKenarBody.addShape(kenarShapeZ);
  sagKenarBody.position.set(masaWidth/2 + kenarKalınlık/2, kenarYukseklik/2 - masaHeight/2, 0);
  world.addBody(sagKenarBody);

  // Sol kenar
  let solKenarBody = new CANNON.Body({ mass: 0 });
  solKenarBody.addShape(kenarShapeZ);
  solKenarBody.position.set(-masaWidth/2 - kenarKalınlık/2, kenarYukseklik/2 - masaHeight/2, 0);
  world.addBody(solKenarBody);

  // Top mesh ve fizik
  const topGeo = new THREE.SphereGeometry(topRadius, 32, 32);
  const topMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  bilardoTopuMesh = new THREE.Mesh(topGeo, topMat);
  scene.add(bilardoTopuMesh);

  const topShape = new CANNON.Sphere(topRadius);
  bilardoTopuBody = new CANNON.Body({ mass: 1, material: new CANNON.Material({ friction: 0.1, restitution: 0.7 }) });
  bilardoTopuBody.addShape(topShape);
  bilardoTopuBody.position.set(0, topRadius, 0);
  bilardoTopuBody.linearDamping = 0.4; // sürtünme

  world.addBody(bilardoTopuBody);

  // Eventler
  window.addEventListener('resize', onWindowResize);
  canvas.addEventListener('mousemove', onMouseMove);
  window.addEventListener('keydown', onKeyDown);
}

function onWindowResize() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Fare ile açıyı 360° (0-2PI) arası ayarlama
function onMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left - rect.width/2;
  const mouseY = e.clientY - rect.top - rect.height/2;

  // Kamera yukarıdan bakıyor, +Z ileri, +X sağ
  vurusAci = Math.atan2(mouseX, -mouseY);
  vurusHazir = true;
}

// Space ile vurma
function onKeyDown(e) {
  if (e.code === 'Space' && vurusHazir) {
    vurTop();
  }
}

// Topa vurma fonksiyonu
function vurTop() {
  const guc = power / 100 * 20; // kuvvet

  const forceX = Math.sin(vurusAci) * guc;
  const forceZ = Math.cos(vurusAci) * guc;

  bilardoTopuBody.velocity.set(forceX, 0, forceZ);
  vurusHazir = false;
}

// Animasyon döngüsü
function animate() {
  requestAnimationFrame(animate);

  world.step(1/60);

  // Top pozisyon ve rotasyonunu güncelle
  bilardoTopuMesh.position.copy(bilardoTopuBody.position);
  bilardoTopuMesh.quaternion.copy(bilardoTopuBody.quaternion);

  // Güç göstergesini ayarla
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
