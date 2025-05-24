// Sahne oluştur
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f662f);

// Kamera ayarla
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bilardoCanvas'), antialias: true });
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

// Topun hızı ve yönü
let velocity = 0;
let direction = 0;  // -1 sola, 0 duraklama, 1 sağa

// Güç göstergesi elemanları
const powerBar = document.getElementById('powerBar');
const powerIndicator = document.getElementById('powerIndicator');
let power = 0;   // 0 - 100 arasında
let powerIncreasing = true;

// Yön göstergesi için basit bir HTML/CSS elementi kullanacağız
const directionIndicator = document.querySelector('#directionIndicator > div');
let directionPos = 0;  // -1 ile 1 arası, ok tuşlarıyla değişecek

// Klavye olayları
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    directionPos = Math.min(directionPos + 0.1, 1);
  } else if (e.key === 'ArrowLeft') {
    directionPos = Math.max(directionPos - 0.1, -1);
  } else if (e.key === ' ') {
    // Topa vur (topun hızı ve yönü ayarlanır)
    if (velocity === 0) { // sadece duruyorsa vur
      velocity = power / 20; // Güç hızla orantılı
      direction = directionPos;
    }
  }
});

// Pencere boyutu değişince
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animasyon döngüsü
function animate() {
  requestAnimationFrame(animate);

  // Güç göstergesini animasyonla ayarla (top vurulmamışsa)
  if (velocity === 0) {
    if (powerIncreasing) {
      power += 1;
      if (power >= 100) powerIncreasing = false;
    } else {
      power -= 1;
      if (power <= 0) powerIncreasing = true;
    }
    powerIndicator.style.height = (power * 1.5) + 'px';
  }

  // Yön göstergesini güncelle
  // directionPos -1 ile 1 arası, bunu px ile ifade edelim (0-80px arası hareket)
  directionIndicator.style.left = (40 + directionPos * 40) + 'px';

  // Top hareketi
  if (velocity !== 0) {
    bilardoTopu.position.x += velocity * direction;

    // Sınırlar (masa kenarı)
    if (bilardoTopu.position.x > 9) {
      bilardoTopu.position.x = 9;
      velocity = 0;
    } else if (bilardoTopu.position.x < -9) {
      bilardoTopu.position.x = -9;
      velocity = 0;
    }

    // Hız yavaşlayacak (sürtünme)
    velocity *= 0.95;
    if (velocity < 0.01) velocity = 0;
  }

  renderer.render(scene, camera);
}
animate();
