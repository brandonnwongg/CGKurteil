import * as THREE from "three";
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
  new THREE.SphereGeometry(5, 50, 50),
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

scene.add(sphere)

// Creating a atmosphere
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(6, 50, 50),
  new THREE.ShaderMaterial({
    //Loads Texture on Sphere
    vertexShader: vertexShaderAtmosphere,
    fragmentShader: fragmentShaderAtmosphere,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  })
)

atmosphere.scale.set(1.1, 1.1, 1.1)

scene.add(atmosphere)

camera.position.z = 15

function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
  sphere.rotation.y += 0.001
}
animate()

