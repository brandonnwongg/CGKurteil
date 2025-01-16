import * as THREE from "three";
import gsap from "./node_modules/gsap/index.js";
import pullRequestData from './src/lines.js';
import maps from "./src/map.js";
import ThreeGlobe from 'https://esm.sh/three-globe?external=three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth/ innerHeight,
  0.1,
  1000
)

const boxGeometry = new THREE.BoxGeometry(16,16,16);
const boxMaterial = new THREE.MeshNormalMaterial();
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);

////---- Logo design ----////
const fontLoader = new FontLoader();
fontLoader.load(
  './node_modules/three/examples/fonts/droid/droid_serif_regular.typeface.json',
  (droidFont) => {
    const textGeometry = new TextGeometry('Wonders of the World', {
      height: 8,
      size: 25,
      font: droidFont,
    });
  const textMaterial = new THREE.MeshNormalMaterial();
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.position.x = -180;
  textMesh.position.y = 150;
  scene.add(textMesh);
  }
) 
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


const renderer = new THREE.WebGLRenderer(
  {
    antialias: true //helps sharpen or smoothen edges of earth
  }
)
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(window.devicePixelRatio) //higher resolution
document.body.appendChild(renderer.
  domElement)

////----------Creating an earth globe using custom shaders-----------/////
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(101, 50, 50),
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
  new THREE.SphereGeometry(125, 50, 50),
  new THREE.ShaderMaterial({
    //Loads Texture on Sphere
    vertexShader: vertexShaderAtmosphere,
    fragmentShader: fragmentShaderAtmosphere,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  })
)

scene.add(atmosphere)

const group = new THREE.Group()
group.add(sphere)
scene.add(group)



////----------- Spawns Random Stars in the Background -----------/////
const starGeometry = new THREE.BufferGeometry()
const starMaterial = new THREE.PointsMaterial(
  {
    color: 0xffffff
  })

const starVertices = []
for (let i = 0; i < 10000; i++) {
  const x = (Math.random() - 0.5) * 2000
  const y = (Math.random() - 0.5) * 2000
  const z = -Math.random() * 3000
  starVertices.push(x,y,z)
}

starGeometry.setAttribute('position', 
new THREE.Float32BufferAttribute(
  starVertices, 3
))

const stars = new THREE.Points(
  starGeometry, starMaterial)
scene.add(stars)


////--------- Arc Linking random points of the globe --------////
const N = 30;

const arcsData = [...Array(N).keys()].map(() => ({
  startLat: (Math.random() - 0.5) * 180,
  startLng: (Math.random() - 0.5) * 360,
  endLat: (Math.random() - 0.5) * 180,
  endLng: (Math.random() - 0.5) * 360,
  color: ['brown', 'white', 'blue', 'green'][Math.round(Math.random() * 3)]
}));

const Globe = new ThreeGlobe()
  .showGlobe(false)
  .showAtmosphere(false)
  .arcsData(arcsData)
  .arcColor('color')
  .arcDashLength(1.5)
  .arcDashGap(4)
  .arcDashInitialGap(() => Math.random() * 5)
  .arcDashAnimateTime(1000);

sphere.add(Globe)

var amb,textureLoader,textu,Earthmat,Earthgeo,icosaedron,markerInfo,gMarker,mMarker,markers;
var dummy=[];
var alvos=[];
icosaedron=new THREE.Mesh(new THREE.IcosahedronGeometry(102,5),new THREE.MeshStandardMaterial({color:'#08b',wireframe:true}));
sphere.add(icosaedron)

///--------- Loading a texture for glowing effect and attaching it to markers for glowing effect -------////
// Create a texture loader instance
var textureLoader = new THREE.TextureLoader();

// Load a texture
var texture = textureLoader.load('./src/glow.png');

// Create the sprite material with the loaded texture
var spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    color: 0x11eeff,
    transparent: false,
    blending: THREE.AdditiveBlending
});

var sprite = new THREE.Sprite( spriteMaterial );

const markerCount = maps["Co-ordinates"].length;  

// Define the degrees to radians conversion function
function degToRad(deg) {
  return deg * Math.PI / 180;
}

////---------- This goes through the map.js file and adds markers based on the lat and long --------////
if (markerCount > 0) {
  const markers = new THREE.InstancedMesh(gMarker, mMarker, markerCount);

  maps["Co-ordinates"].forEach((location, i) => {
      const lat = degToRad(parseFloat(location.lat));
      const lng = degToRad(parseFloat(location.lng));

      const x = 101 * Math.cos(lat) * Math.cos(lng);
      const y = 101 * Math.cos(lat) * Math.sin(lng);
      const z = 101 * Math.sin(lat);

      const dummyGeometry = new THREE.SphereGeometry(4, 4, 4); // Adjust radius and segments as needed
      const dummyMaterial = new THREE.MeshLambertMaterial({ color: 0xADD8E6 }); // Light blue color
      const dummy = new THREE.Mesh(dummyGeometry, dummyMaterial);
      dummy.position.set(x, y, z);

      const localSprite = sprite.clone();  // Clone the sprite for each dummy
      localSprite.scale.set(11, 11, 11); // Adjust the scale based on your visual needs
      localSprite.position.set(0, 0, 0);  // Center the sprite on the dummy
      dummy.add(localSprite);

      dummy.updateMatrix();
      markers.setMatrixAt(i, dummy.matrix);
      dummy.name = `Id: ${i}, ${location.text}`;
      dummy.add(sprite);
      sphere.add(dummy);    
  });

} else {
  console.error('Marker count is zero or undefined');
}


//position camera away from center of sphere
camera.position.z = 300


const mouse = {
  x: undefined,
  y: undefined
}

function animate() {
  renderer.render(scene, camera)
  sphere.rotation.y += 0.01
  gsap.to(group.rotation, {
    x: -mouse.y * 0.5,
    y: mouse.x * 0.5,
    duration: 2
  })
  gsap.to(stars.rotation, {
    x: -mouse.y * 0.2,
    y: mouse.x * 0.2,
    duration: 2
  })
  requestAnimationFrame(animate)
}
animate()


addEventListener('mousemove', () => {
  mouse.x = (event.clientX / innerWidth) * 2 - 1
  mouse.y = -(event.clientY / innerHeight) * 2 + 1
})
