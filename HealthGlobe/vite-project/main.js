import * as THREE from "three";
import gsap from "./node_modules/gsap/index.js";
import pullRequestData from './src/lines.js';
import maps from "./src/map.js";
import ThreeGlobe from 'https://esm.sh/three-globe?external=three';


const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth/ innerHeight,
  0.1,
  1000
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

// Creating a sphere
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


// Creating a atmosphere
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


const starGeometry = new THREE.BufferGeometry()
const starMaterial = new THREE.PointsMaterial(
  {
    color: 0xffffff
  })

// spawn random stars
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
camera.position.z = 300

const mouse = {
  x: undefined,
  y: undefined
}

function animate() {
  // requestAnimationFrame(animate)
  renderer.render(scene, camera)
  sphere.rotation.y += 0.001
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

