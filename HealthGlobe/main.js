import * as THREE from "three";

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth/ innerHeight,
  0.1,
  1000
)

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
  new THREE.SphereGeometry(5, 50, 50),
  new THREE.MeshBasicMaterial({
    //Loads Texture on Sphere
    map: new THREE.TextureLoader().load('./src/globe.jpg')
  })
)

scene.add(sphere)

camera.position.z = 10

function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
animate()

