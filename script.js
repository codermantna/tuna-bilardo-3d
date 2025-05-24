// Sahne oluştur
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f662f);

// Kamera ayarla
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20);
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

// Animasyon döngüsü
function animate() {
  requestAnimationFrame(animate);

  // Topu sağa doğru hareket ettir
  bilardoTopu.position.x += 0.05;
  if (bilardoTopu.position.x > 9) bilardoTopu.position.x = -9;

  renderer.render(scene, camera);
}
animate();


