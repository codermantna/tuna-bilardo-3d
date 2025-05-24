// Sahne oluştur
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f662f);

// Kamera ayarla
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 25);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bilardoCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

// Işık ekle
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

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

// Topun hızı ve yönü (şimdi 2D vektör)
let velocity = new THREE.Vector2(0, 0);
let power = 0;
let powerIncreasing = true;

// Güç göstergesi
const powerBar = document.getElementById('powerBar');
const powerIndicator = document.getElementById('powerIndicator');

// Yön göstergesi
const directionIndicator = document.getElementById('directionIndicator');
let directionAngle = 0; // radyan cinsinden

// Klavye ile yön ayarı (sağ/sol ok tuşları ile açı değiştir)
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    directionAngle -= Math.PI / 36; // 5 derece sağa dön
  } else if (e.key === 'ArrowLeft') {
    directionAngle += Math.PI / 36; // 5 derece sola dön
  } else if (e.key === ' ') {
    // Topa vur
    velocity.x = power * Math.cos(directionAngle) / 10;
    velocity.y = power * Math.sin(directionAngle) / 10;
    power = 0;
  }
});

// Animasyon döngüsü
function animate() {
  requestAnimationFrame(animate);

  // Güç göstergesini güncelle
  if (powerIncreasing) {
    power += 1;
    if (power >= 100) powerIncreasing = false;
  } else {
    power -= 1;
    if (power <= 0) powerIncreasing = true;
  }
  powerIndicator.style.bottom = (power * 0.8) + '%';

  // Yön göstergesini güncelle (örneğin 0-360 derece arası 0-100% scale ile)
  let deg = directionAngle * (180 / Math.PI);
  if (deg < 0) deg += 360;
  directionIndicator.style.left = (deg / 360 * 100) + '%';

  // Top hareketi
  if (velocity.length() > 0.001) {
    bilardoTopu.position.x += velocity.x;
    bilardoTopu.position.z += velocity.y;

    // Masanın sınırları: x [-9.5,9.5], z [-4.5,4.5]
    if (bilardoTopu.position.x > 9.5) {
      bilardoTopu.position.x = 9.5;
      velocity.x = -velocity.x * 0.6; // çarpma sonrası yön değiştir, biraz yavaşla
    }
    if (bilardoTopu.position.x < -9.5) {
      bilardoTopu.position.x = -9.5;
      velocity.x = -velocity.x * 0.6;
    }
    if (bilardoTopu.position.z > 4.5) {
      bilardoTopu.position.z = 4.5;
      velocity.y = -velocity.y * 0.6;
    }
    if (bilardoTopu.position.z < -4.5) {
      bilardoTopu.position.z = -4.5;
      velocity.y = -velocity.y * 0.6;
    }

    // Sürtünme kuvveti ile yavaşlama
    velocity.multiplyScalar(0.95);
  } else {
    velocity.set(0, 0);
  }

  renderer.render(scene, camera);
}
animate();
