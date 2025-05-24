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
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Işık ekle
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 20, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040)); // ortam ışığı

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
let directionX = 0;  // -1 ile 1 arası, x ekseni için
let directionZ = 0;  // -1 ile 1 arası, z ekseni için

// Güç göstergesi elemanları
const powerBar = document.getElementById('powerBar');
const powerIndicator = document.getElementById('powerIndicator');
let power = 50;   // 0 - 100 arasında, başlangıçta yarı güç

// Yön göstergesi elemanları
const directionIndicator = document.getElementById('directionIndicator');
let directionPos = 0;  // -1 ile 1 arası, sola-sağa yön için

// Klavye olayları
window.addEventListener('keydown', (e) => {
  switch(e.key.toLowerCase()) {
    case 'a': // sola yön
      directionPos = Math.max(directionPos - 0.05, -1);
      break;
    case 'd': // sağa yön
      directionPos = Math.min(directionPos + 0.05, 1);
      break;
    case 'w': // güç artır
      power = Math.min(power + 2, 100);
      break;
    case 's': // güç azalt
      power = Math.max(power - 2, 0);
      break;
    case ' ': // space, vur
      if (velocity === 0) {
        // Yönü X ve Z ekseninde hesapla (Z'yi mesafeyi tam kullanmak için sabit yapabiliriz)
        directionX = directionPos;
        directionZ = -Math.sqrt(1 - directionX*directionX); // z ekseni ileri (masa derinliği boyunca)
        velocity = power / 10;
      }
      break;
  }
});

// Animasyon döngüsü
function animate() {
  requestAnimationFrame(animate);

  // UI güncelle
  powerIndicator.style.height = power + '%';
  directionIndicator.style.left = (50 + directionPos * 40) + '%';

  // Top hareketi
  if (velocity > 0) {
    bilardoTopu.position.x += velocity * directionX;
    bilardoTopu.position.z += velocity * directionZ;

    // Sınırlar (masa kenarı)
    if (bilardoTopu.position.x > 9) {
      bilardoTopu.position.x = 9;
      velocity = 0;
    } else if (bilardoTopu.position.x < -9) {
      bilardoTopu.position.x = -9;
      velocity = 0;
    }
    if (bilardoTopu.position.z > 4) {
      bilardoTopu.position.z = 4;
      velocity = 0;
    } else if (bilardoTopu.position.z < -4) {
      bilardoTopu.position.z = -4;
      velocity = 0;
    }

    // Sürtünme
    velocity *= 0.95;
    if (velocity < 0.01) velocity = 0;
  }

  renderer.render(scene, camera);
}
animate();
