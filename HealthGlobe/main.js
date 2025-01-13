import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { drawThreeGeo, container } from "./src/threeGeoJSON.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 1, 100);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// Added raycaster for interatctivity
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const geometry = new THREE.SphereGeometry(2);
const lineMat = new THREE.LineBasicMaterial({ 
  color: 0xffffff,
  opacity: 0.5,
  transparent: true
});
const edges = new THREE.EdgesGeometry(geometry, 1);
const line = new THREE.LineSegments(edges, lineMat);
scene.add(line);

// Creating Group so that the countries can rotate together at the same time
const globe = new THREE.Group();
globe.add(line);
scene.add(globe);

fetch('./geojson/countries.json')
  .then(response => response.text())
  .then(text => {
    const data = JSON.parse(text);
    const countries = drawThreeGeo({
      json: data,
      radius: 2,
      materialOptions: {
        color: 0xffffff,
      },
    });
    globe.add(countries);
  });


function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += 0.001;
  renderer.render(scene, camera);
  controls.update();
}

animate();

window.addEventListener('mousemove', (event) => {
  // Convert mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Perform raycasting
  raycaster.setFromCamera(mouse, camera);

  // Test against all children in the container
  const intersects = raycaster.intersectObjects(container.children, true);

  // Handle interactions
  container.children.forEach(child => {
    if (child.userData.isInteractive) {
      child.material.color.set(0xffffff); // Reset color
    }
  });

  if (intersects.length > 0) {
    const intersected = intersects[0].object;
    if (intersected.userData.isInteractive) {
      intersected.material.color.set(0xff0000); // Highlight intersected line
    }
  }
});

function handleWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);