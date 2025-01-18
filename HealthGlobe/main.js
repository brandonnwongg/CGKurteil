import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { drawThreeGeo, container } from "./src/threeGeoJSON.js";

const w = window.innerWidth;
const h = window.innerHeight;

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 1, 100);
camera.position.z = 6;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Vertex Shader for Earth
const vertexShader = `
    varying vec2 vertexUV;
    varying vec3 vertexNormal;

    void main() {
      vertexUV = uv;
      vertexNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix
        * vec4(position, 1.0);
    }
`;

// Fragment Shader for Earth
const fragmentShader = `
    uniform sampler2D globeTexture;
    varying vec2 vertexUV;
    varying vec3 vertexNormal;

    void main() {
        float intensity = 1.05 - dot(vertexNormal, vec3(0.0, 0.0, 1.0));
        vec3 atmosphere = vec3(0.3, 0.6, 1.0) * pow(intensity, 1.5);

        gl_FragColor = vec4(atmosphere + texture2D(globeTexture, vertexUV).xyz, 1.0);
    }
`;


// Vertex Shader for Atmosphere
const vertexShaderAtmosphere = `
    varying vec3 vertexNormal;

    void main() {
      vertexNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix
        * vec4(position, 1.0);
    }
`;

// Fragment Shader for Atmospshere
const fragmentShaderAtmosphere = `
    varying vec3 vertexNormal;

    void main() {
        float intensity = pow(0.55 - dot(vertexNormal, vec3(0.0, 0.0, 1.0)), 2.0);

        gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
    }
`;


////----------Creating an earth globe using custom shaders-----------/////
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(2.5, 50, 50),
  new THREE.ShaderMaterial({
    //Loads Texture on Sphere
    vertexShader,
    fragmentShader,
    uniforms: {
      globeTexture: {
        value: new THREE.TextureLoader().load("./src/globe.jpg")
      }
    }
  })
)

////----------Creating an atmosphere using custom shaders-----------/////
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(3.5, 50, 50),
  new THREE.ShaderMaterial({
    //Loads Texture on Sphere
    vertexShader: vertexShaderAtmosphere,
    fragmentShader: fragmentShaderAtmosphere,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  })
)

scene.add(atmosphere)

// Globe Geometry
const geometry = new THREE.SphereGeometry(2.5, 64, 64);
const lineMat = new THREE.LineBasicMaterial({
  color: 0xffffff,
  opacity: 0.5,
  transparent: true,
});
const edges = new THREE.EdgesGeometry(geometry);
const line = new THREE.LineSegments(edges, lineMat);

// Group for rotating globe
const globe = new THREE.Group();
//globe.add(line);
scene.add(globe);
globe.add(sphere);
// // Halo (Glowing Effect Around Globe)
// function createHalo() {
//   const haloGeometry = new THREE.SphereGeometry(2.6, 64, 64);
//   const haloMaterial = new THREE.MeshBasicMaterial({
//     color: 0x00aaff,
//     transparent: true,
//     opacity: 0.15,
//   });
//   const halo = new THREE.Mesh(haloGeometry, haloMaterial);
//   scene.add(halo);
// }
// createHalo();

// Background: Space Texture
const loader = new THREE.TextureLoader();
const dayTexture = loader.load('./src/space1.png'); // Texture pour le mode clair
const nightTexture = loader.load('./src/star1.jpg'); // Texture pour le mode nuit

scene.background = dayTexture; 

// Mode Button
const toggleButton = document.getElementById('toggleMode');
let isNightMode = false; // default mode day mode

toggleButton.addEventListener('click', () => {
 
  if (isNightMode) {
    scene.background = dayTexture;
    toggleButton.innerText = 'Night Mode';
  } else {
    scene.background = nightTexture;
    toggleButton.innerText = 'Day Mode';
  }
  isNightMode = !isNightMode; // change Mode
});

// Adding Stars
function addStars() {
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.02,
    transparent: true,
    opacity: 0.8,
  });

  const starCount = 2000;
  const starPositions = new Float32Array(starCount * 3); // 3 coordinates per star (x, y, z)

  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 50; // x
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 50; // y
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 50; // z
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}
addStars();

// Raycaster and mouse for interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const interactiveObjects = [];  // Store piquets for interaction

// Function to convert lat/lon to 3D position
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180); // Convert latitude to polar angle
  const theta = (lon + 180) * (Math.PI / 180); // Convert longitude to azimuthal angle

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

// Function to add a green pole at a given position
function addPole(lat, lon, radius, countryCode) {
  const poleHeight = 0.5; // Length of the pole
  const poleRadius = 0.02; // Thickness of the pole

  const start = latLonToVector3(lat, lon, radius); // Start position on the surface
  const end = latLonToVector3(lat, lon, radius + poleHeight); // End position above the surface

  const poleGeometry = new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 8);
  const poleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green color

  const pole = new THREE.Mesh(poleGeometry, poleMaterial);

  // Position the pole at the midpoint between start and end
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  pole.position.copy(midpoint);

  // Align the pole with the vector pointing out of the globe
  pole.lookAt(end);
  pole.rotateX(Math.PI / 2); // Rotate to align with the globe's surface normal

  // Add userData for interaction
  pole.userData = { isoCode: countryCode };
  interactiveObjects.push(pole);

  globe.add(pole);
}

// Fetch GeoJSON Data
fetch('./geojson/countries.json')
  .then(response => response.text())
  .then(text => {
    const data = JSON.parse(text);

    // Draw the GeoJSON countries on the globe
    const countries = drawThreeGeo({
      json: data,
      radius: 2.5,
      materialOptions: {
        color: 0xffffff,
      },
    });
    //globe.add(countries); ////////////////////////

   // Loop through the GeoJSON features and add poles
    data.features.forEach(feature => {
      const { iso_a3 } = feature.properties;

      // Calculate centroid for each country
      if (feature.geometry.type === "Polygon") {
        const centroid = feature.geometry.coordinates[0].reduce((acc, coord) => {
          acc[0] += coord[0];
          acc[1] += coord[1];
          return acc;
        }, [0, 0]).map(c => c / feature.geometry.coordinates[0].length);

        addPole(centroid[1], centroid[0], 2.5, iso_a3);
      }

      if (feature.geometry.type === "MultiPolygon") {
        feature.geometry.coordinates.forEach(polygon => {
          const centroid = polygon[0].reduce((acc, coord) => {
            acc[0] += coord[0];
            acc[1] += coord[1];
            return acc;
          }, [0, 0]).map(c => c / polygon[0].length);

          addPole(centroid[1], centroid[0], 2.5, iso_a3);
        });
      }
    });
  });

// Fetch COVID-19 data for a specific country
function fetchCovidData(isoCode) {
  return fetch(`https://disease.sh/v3/covid-19/countries/${isoCode}`)
    .then(response => response.json())
    .catch(error => console.error(`Error fetching data for ${isoCode}:`, error));
}

// Display COVID data in an info box
const infoBox = document.createElement('div');
infoBox.style.position = 'absolute';
infoBox.style.top = '10px';
infoBox.style.right = '10px';
infoBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
infoBox.style.color = 'white';
infoBox.style.padding = '10px';
infoBox.style.borderRadius = '5px';
infoBox.style.display = 'none';
document.body.appendChild(infoBox);

// Mouse move handler for raycasting
window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects);

  interactiveObjects.forEach(pole => {
    pole.material.color.set(0x00ff00); // Reset color to green
  });

  if (intersects.length > 0) {
    const intersectedPole = intersects[0].object;
    intersectedPole.material.color.set(0xff0000); // Highlight pole in red

    // Fetch and display COVID data
    const { isoCode } = intersectedPole.userData;
    fetchCovidData(isoCode).then(data => {
      infoBox.style.display = 'block';
      infoBox.innerHTML = `
        <div>
          <img src="${data.countryInfo.flag}" alt="Flag of ${data.country}">
          <h3>${data.country}</h3>
        </div>
        <p><strong>Population:</strong> ${data.population.toLocaleString()}</p>
        <p><strong>Cases:</strong> ${data.cases.toLocaleString()}</p>
        <p><strong>Deaths:</strong> ${data.deaths.toLocaleString()}</p>
        <p><strong>Recovered:</strong> ${data.recovered.toLocaleString()}</p>
        <p><strong>Active:</strong> ${data.active.toLocaleString()}</p>
        <p><strong>Critical:</strong> ${data.critical.toLocaleString()}</p>
      `;
    });
  } else {
    infoBox.style.display = 'none';
  }
});

// Rotation and Animation Variables
let rotationSpeed = 0.0005; // Default rotation speed
let isPaused = false; // Rotation paused or not

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  if (!isPaused) {
    globe.rotation.y += rotationSpeed;
  }

  // Rotate stars for a dynamic background
  scene.children.forEach((child) => {
    if (child.isPoints) {
      child.rotation.y += 0.0005;
    }
  });

  renderer.render(scene, camera);
  controls.update();
}
animate();


// Handle Window Resize
function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);

// UI: Pause/Play and Speed Controls
const controlsDiv = document.createElement('div');
controlsDiv.style.position = 'absolute';
controlsDiv.style.top = '10px';
controlsDiv.style.left = '10px';
controlsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
controlsDiv.style.padding = '10px';
controlsDiv.style.borderRadius = '5px';
controlsDiv.style.color = 'white';
document.body.appendChild(controlsDiv);

// Pause/Play Button
const pausePlayButton = document.createElement('button');
pausePlayButton.innerText = 'Pause';
pausePlayButton.style.marginRight = '10px';
pausePlayButton.onclick = () => {
  isPaused = !isPaused;
  pausePlayButton.innerText = isPaused ? 'Play' : 'Pause';
};
controlsDiv.appendChild(pausePlayButton);

// Speed Slider
const speedLabel = document.createElement('label');
speedLabel.innerText = 'Speed: ';
controlsDiv.appendChild(speedLabel);

const speedSlider = document.createElement('input');
speedSlider.type = 'range';
speedSlider.min = '0.001';
speedSlider.max = '0.08';
speedSlider.step = '0.003';
speedSlider.value = rotationSpeed;
speedSlider.oninput = (e) => {
  rotationSpeed = parseFloat(e.target.value);
};
controlsDiv.appendChild(speedSlider);
