import './style.css'
import * as THREE from '../build/three.js'
import { OrbitControls } from '../jsm/OrbitControls.js'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')
canvas.width = window.innerWidth
canvas.height = window.innerHeight
/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMapSoft = true
renderer.setClearColor(0xffffff, 0)

// Scene
const scene = new THREE.Scene()
// Textures
const textureLoader = new THREE.TextureLoader()

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 1, 3000)
const localPosition = { x: -200, y: 50, z: 0 } //存储初始化位置
camera.position.set(localPosition.x, localPosition.y, localPosition.z)
scene.add(camera)

// OrbitControls
const Controls = new OrbitControls(camera, renderer.domElement)
Controls.minDistance = 20
Controls.maxDistance = 1000
Controls.enableDamping = true
// Controls.autoRotate = true

/**
 * Raycaster
 */
const raycaster = new THREE.Raycaster()
let currentIntersect = null
/**
 * Balls
 */
//太阳系
const SunSystem = new THREE.Object3D()
scene.add(SunSystem)

const stars = []
//添加太阳
loadPlanet('sun', 14, 0, 0.001, 0);
//添加水星
loadPlanet('mercury', 2, 20, 0.05, 2.5);
//添加金星
loadPlanet('venus', 4, 30, 0.05, 2.3);
//添加地球
loadPlanet('earth', 5, 50, 0.05, 2.1);
//添加火星
loadPlanet('mars', 6, 75, 0.05, 1.9);
//添加木星
loadPlanet('jupiter', 13, 100, 0.05, 1.7);
//添加土星
loadPlanet('saturn', 11, 140, 0.05, 1.5);
//添加天王星
loadPlanet('uranus', 9, 170, 0.05, 1.3);
//添加海王星
loadPlanet('neptune', 7, 190, 0.05, 1);
//添加星星
const particles = Particles();
scene.add(particles);

//创建球体需要给予一些属性 //名字 自身半径 轨道半径 自转速度 公转速度
function loadPlanet(name, radius, Radius, V_Self, V_Sun) {
  //新建基础球
  const planetSystem = new THREE.Mesh(
    new THREE.SphereGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial()
  )
  const material = new THREE.MeshBasicMaterial({
    map: textureLoader.load(`/img/${name}.jpg`)
  })
  //创建完整球形态
  const planet = new THREE.Mesh(new THREE.SphereGeometry(radius, 30, 30), material)
  //赋值属性
  planet.V_Self = V_Self
  planet.V_Sun = V_Sun
  planet.Radius = Radius
  planet.name = name
  stars.push(planet)
  planetSystem.add(planet)
  // if ('地球') 
  if (name === 'earth') {
    const moonMaterial = new THREE.MeshBasicMaterial({
      map: textureLoader.load(`/img/moon.jpg`)
    })
    //创建月球
    const moon = new THREE.Mesh(new THREE.SphereGeometry(2, 30, 30), moonMaterial)
    moon.radius = 1
    planet.add(moon)
  }
  // if ('土星') 
  if (name === 'saturn') {
    const ringMaterial = new THREE.MeshBasicMaterial({
      map: textureLoader.load(`/img/${name}_rings.jpg`),
      side: THREE.DoubleSide
    })
    //创建圆环
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.2, radius * 1.5, 64, 1),
      ringMaterial)
    ring.rotation.x = -Math.PI / 2
    planet.add(ring)
  }
  //创建轨道
  const track = new THREE.Mesh(
    new THREE.RingGeometry(Radius, Radius + 0.05, 64, 1),
    new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide
    }))
  track.rotation.x = -Math.PI / 2
  scene.add(track)
  SunSystem.add(planetSystem)
  return planetSystem
}
//星空粒子创建
function Particles() {
  const particles = 20000
  let bufferGeometry = new THREE.BufferGeometry()
  let positions = new Float32Array(particles * 3)
  let colors = new Float32Array(particles * 3)

  let color = new THREE.Color()
  const gap = 1000

  for (let i = 0; i < positions.length; i += 3) {
    let x = (Math.random() * gap * 2) * (Math.random() < .5 ? -1 : 1)
    let y = (Math.random() * gap * 2) * (Math.random() < .5 ? -1 : 1)
    let z = (Math.random() * gap * 2) * (Math.random() < .5 ? -1 : 1)

    let biggest = Math.abs(x) > Math.abs(y) ? (Math.abs(x) > Math.abs(z) ? 'x' : 'z') : (Math.abs(y) > Math.abs(z) ? 'y' : 'z')

    let pos = { x, y, z }

    if (Math.abs(pos[biggest]) < gap) pos[biggest] = pos[biggest] < 0 ? -gap : gap

    x = pos['x']
    y = pos['y']
    z = pos['z']

    positions[i] = x
    positions[i + 1] = y
    positions[i + 2] = z

    colors[i] = color.r
    colors[i + 1] = color.g
    colors[i + 2] = color.b
  }

  bufferGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  bufferGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  // 计算当前几何体的的边界球形
  bufferGeometry.computeBoundingSphere()

  let material = new THREE.PointsMaterial({
    size: 6,
    vertexColors: THREE.VertexColors
  })
  const particleSystem = new THREE.Points(bufferGeometry, material)

  return particleSystem
}
// 鼠标移动获取物体对象
const mouse = new THREE.Vector2()
function rayCatch() {
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(stars)
  if (intersects.length) {
    if (!currentIntersect) {
      document.querySelector("body").style.cursor = "pointer";
    }
    currentIntersect = intersects[0]
  }
  else {
    if (currentIntersect) {
      document.querySelector("body").style.cursor = "default";
    }
    currentIntersect = null
  }
}
/**
 * Mouse
 */
window.addEventListener('mousemove', (event) => {
  mouse.x = event.clientX / sizes.width * 2 - 1
  mouse.y = - (event.clientY / sizes.height) * 2 + 1
  rayCatch()
})

const btn = document.querySelector('#btn')
const title = document.querySelector('.title')
let targetStar;
let S_title

btn.onclick = function () {
  currentIntersect = null
  targetStar = null
  Controls.target = SunSystem.position
  Controls.object.position.set(localPosition.x, localPosition.y, localPosition.z)
  title.innerHTML = '太阳系'
}
window.addEventListener('click', () => {
  if (currentIntersect) {
    targetStar = scene.getObjectByName(currentIntersect.object.name);
    Controls.target = targetStar.position
    switch (currentIntersect.object.name) {
      case 'sun':
        S_title = '太阳'
        break;
      case 'mercury':
        S_title = '水星'
        break;
      case 'venus':
        S_title = '金星'
        break;
      case 'earth':
        S_title = '地球'
        break;
      case 'mars':
        S_title = '火星'
        break;
      case 'jupiter':
        S_title = '木星'
        break;
      case 'saturn':
        S_title = '土星'
        break;
      case 'uranus':
        S_title = '天王星'
        break;
        case 'neptune':
        S_title = '海王星'
        break;
    }
    title.innerHTML = S_title
  }
})

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Animate
 */

const clock = new THREE.Clock()
const random = Math.random() * 10

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  //考虑到自转和公转，所以通过两层来控制物体的运动
  for (var i = 0; i < stars.length; i++) {
    const planet = stars[i]
    planet.position.set(
      Math.sin(elapsedTime * planet.V_Sun * 0.1) * planet.Radius,
      0,
      Math.cos(elapsedTime * planet.V_Sun * 0.1) * planet.Radius,
    );
    if (targetStar) {
      if (targetStar.name === planet.name) {
        camera.position.set(
          Math.sin(elapsedTime * 0.1) * 40 + planet.position.x * 0.3,
          20,
          Math.cos(elapsedTime * 0.1) * 40 + planet.position.z * 0.3,
        );
      }
    }
    if (planet.name === 'earth') {
      planet.children[0].position.set(
        Math.sin(elapsedTime * 0.1) * planet.children[0].radius + planet.position.x * 0.2,
        0,
        Math.cos(elapsedTime * 0.1) * planet.children[0].radius + planet.position.z * 0.2,
      );
    }
    planet.rotation.y += planet.V_Self
  }
  // Update controls
  Controls.update()
  // Render
  renderer.render(scene, camera)
  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()