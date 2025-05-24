// Sahne oluştur
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f662f);

// Kamera ayarla
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 25);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bilardoCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Işık ekle
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 15, 10);
scene.add(light);

// Masa
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

// Güç ve yön göstergeleri
const powerIndicator = document.getElementById('powerIndicator');
const directionIndicator = document.getElementById('directionIndicator');

let power = 0;
let powerIncreasing = true;

let directionPos = 0;  // -1 ile 1 arası

let velocity = 0;
let direction = 0;

// Klavye kontrolleri
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    directionPos = Math.min(directionPos + 0.1, 1);
  } else if (e.key === 'ArrowLeft') {
    directionPos = Math.max(directionPos - 0.1, -1);
  } else if (e.key === ' ') {
    if (velocity === 0) { // Sadece top dururken vurulabilir
      velocity = power / 20;
      direction = directionPos;
    }
  }
});

// Animasyon döngüsü
function animate() {
  requestAnimationFrame(animate);

  // Güç salınımı
  if (powerIncreasing) {
    power += 1;
    if (power >= 100) powerIncreasing = false;
  } else {
    power -= 1;
    if (power <= 0) powerIncreasing = true;
  }
  powerIndicator.style.height = power + '%';

  // Yön göstergesi
  // Bar genişliği = 200px, indicator genişliği = 20px
  // left aralığı 0..180px, ortası 90px
  directionIndicator.style.left = (90 + directionPos * 90) + 'px';

  // Top hareketi
  if (velocity > 0) {
    bilardoTopu.position.x += velocity * direction;
    velocity *= 0.95; // sürtünme
    if (velocity < 0.01) velocity = 0;
  }

  renderer.render(scene, camera);
}
animate();

// Pencere yeniden boyutlandırma
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
