// Sahne oluştur
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f662f);

// Kamera ayarla
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 30);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bilardoCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Işık ekle
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);
scene.add(new THREE.AmbientLight(0x404040));

// Bilardo masası
const masaGeo = new THREE.BoxGeometry(20, 1, 10);
const masaMat = new THREE.MeshStandardMaterial({ color: 0x1c8c3a });
const masa = new THREE.Mesh(masaGeo, masaMat);
masa.position.y = -0.5;
scene.add(masa);

// Top
const topGeo = new THREE.SphereGeometry(0.5, 32, 32);
const topMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
const bilardoTopu = new THREE.Mesh(topGeo, topMat);
bilardoTopu.position.set(0, 0.5, 0);
scene.add(bilardoTopu);

// Hız ve yön
let velocity = 0;
let direction = 0; // -1 sol, 1 sağ

// Güç ve yön göstergeleri elemanları
const powerIndicator = document.getElementById('powerIndicator');
const directionIndicator = document.getElementById('directionIndicator');

let power = 0;  // 0-100 arası
let powerIncreasing = true;
let directionPos = 0;  // -1 ile 1 arası

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    directionPos = Math.min(directionPos + 0.1, 1);
  } else if (e.key === 'ArrowLeft') {
    directionPos = Math.max(directionPos - 0.1, -1);
  } else if (e.key === ' ') {
    // Topa vur
    velocity = power / 10;
    direction = directionPos;
  }
});

function animate() {
  requestAnimationFrame(animate);

  // Güç animasyonu
  if (powerIncreasing) {
    power += 1;
    if (power >= 100) powerIncreasing = false;
  } else {
    power -= 1;
    if (power <= 0) powerIncreasing = true;
  }
  powerIndicator.style.height = (power * 1.5) + 'px';

  // Yön göstergesi güncelle
  directionIndicator.style.setProperty('--pos', 50 + directionPos * 40 + '%');
  directionIndicator.style.background = `linear-gradient(to right, #444 0%, #444 100%)`;
  directionIndicator.style.position = 'fixed';

  // Top hareketi
  if (velocity > 0) {
    bilardoTopu.position.x += velocity * direction;
    velocity *= 0.95;  // sürtünme
    if (velocity < 0.01) velocity = 0;
  }

  renderer.render(scene, camera);
}

animate();
