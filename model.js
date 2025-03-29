import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';
import { GLTFLoader } from 'GLTFLoader';
import { RectAreaLightUniformsLib } from 'RectAreaLightUniformsLib';

document.addEventListener('DOMContentLoaded', () => {
  initThree();
  initNameInput();
});

let r;
let total = 600;
let mu = 6;
let points = [];
let nameInput = '';
let sketchInstance;

// Функция для генерации числа на основе имени
function nameToNumber(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Функция для обновления параметров p5
function updateParams() {
  const nameNumber = nameToNumber(nameInput);
  total = 200 + (nameNumber % 300);
  mu = 1 + (nameNumber % 10);
}

// Функция для инициализации p5
const sketch = (p) => {
  p.setup = function () {
    const container = document.querySelector('.sign');
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    r = Math.min(w, h) * 0.5; // радиус будет 35% от меньшей стороны
    const canvas = p.createCanvas(w, h);
    canvas.parent(container);

    updateParams();
    p.noLoop(); // Чтобы не рисовать снова, только по клику
  };

  p.draw = function () {
    p.clear(); // очищаем холст
    p.translate(p.width / 2, p.height / 2); // центрируем
    p.stroke(0);
    p.noFill();
    p.strokeWeight(0.35);

    p.ellipse(0, 0, 2 * r, 2 * r);

    points = [];
    for (let i = 0; i < total; i++) {
      let angle = p.map(i, 0, total, 0, p.TWO_PI);
      let x = r * Math.cos(angle);
      let y = r * Math.sin(angle);
      points.push([x, y]);
    }

    for (let i = 0; i < total; i++) {
      let currentx = points[i][0];
      let currenty = points[i][1];
      let nextx = points[(i * mu) % total][0];
      let nexty = points[(i * mu) % total][1];
      p.line(currentx, currenty, nextx, nexty);
    }
  };
};

// Инициализация Three.js
function initThree() {
  const model = document.querySelector('.model');

  // Сцена
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e1e1df');
  scene.position.set(0, 0, 0);

  // Камера
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    3000
  );
  camera.position.set(0, 0, 50);

  // Рендер
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  model.appendChild(renderer.domElement);

  // Загрузка модели
  const loader = new GLTFLoader();
  loader.load(
    './model/iwanttodie.glb',
    function (gltf) {
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          console.log(child.name, child.material);
        }
      });
      scene.add(gltf.scene);
    },
    undefined,
    function (error) {
      console.log('Error:', error);
    }
  );

  // Свет
  const light1 = new THREE.DirectionalLight(0xeeece9, 1);
  light1.position.set(-80, 100, 0);
  light1.lookAt(0, 20, 0);
  scene.add(light1);

  const light2 = new THREE.DirectionalLight(0xeeece9, 1);
  light2.position.set(50, 100, 0);
  light2.lookAt(0, 20, 0);
  scene.add(light2);

  // Управление камерой
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 30;
  controls.maxDistance = 70;
  controls.maxPolarAngle = Math.PI / 2.3;

  // Анимация
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', onWindowResize);

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Обработчик скролла
  let isScrolling = false;
  window.addEventListener('wheel', handleScroll);

  function handleScroll(event) {
    if (isScrolling) return;
    isScrolling = true;

    if (camera.position.z >= controls.maxDistance) {
      document
        .querySelector('.secondscreen')
        .scrollIntoView({ behavior: 'smooth' });
    }

    setTimeout(() => {
      isScrolling = false;
    }, 800);
  }
}

// Инициализация поля ввода имени
function initNameInput() {
  // Запуск p5
  sketchInstance = new p5(sketch, 'sign');

  // Обработчик кнопки
  document.querySelector('.btn').addEventListener('click', () => {
    const input = document.querySelector('#username').value.trim();
    if (input.length > 0) {
      nameInput = input; // обновляем имя
      updateParams(); // обновляем параметры для p5
      sketchInstance.redraw(); // перерисовываем с новым именем
    }
  });
}
