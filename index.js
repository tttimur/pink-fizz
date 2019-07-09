import * as THREE from 'three'
import { clothFunction, cloth, windForce, simulate } from './cloth'

//var textureImg = require('./tile3x.jpg')
//var OrbitControls = require('three-orbit-controls')(THREE)
const container = document.getElementById('moon')

class Moon {
  constructor() {
    this.bum = 'yo'
    this.mousex = 0
    this.mousey = 0
    this.running = true
  }

  init() {
    try {
      this.setupRenderer()
    } catch (err) {
      throw err
    }
    this.setupScene()
    this.setupCamera()
    this.setupLight()
    this.setupCloth()
    this.setupEventListeners()

  }



  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      preserveDrawingBuffer: false,
      alpha: false,
      powerPreference: 'low-power',
      failIfMajorPerformanceCaveat: true
    })
    //    this.renderer.setPixelRatio(window.devicePixelRatio / 3)
    const minPixelRatio = 1.75
    const pixelRatio = Math.min(minPixelRatio, window.devicePixelRatio)

    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    container.appendChild(this.renderer.domElement)

    this.renderer.gammaInput = true
 //   this.renderer.gammaFactor = 2.4
    this.renderer.gammaOutput = true
 //   this.renderer.shadowMap.enabled = true
  }

  setupScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xF8F6F1)
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 5000)
    this.camera.position.set(0, -300, 2000)
  }

  setupLight() {
    //    this.scene.add( new THREE.AmbientLight(0x706c60, 1))
    let distance = 300
     this.light0 = new THREE.DirectionalLight(0xe6e2dc, 1)
//   this.light0 = new THREE.SpotLight(0xffffff, 1)
    this.light0.position.set(0, 0, 800)
    this.light0.position.multiplyScalar(1.7)
    this.light0.castShadow = true
    var light = new THREE.HemisphereLight( 0xffffff, 0x000000, 1 )

//    this.scene.add(light)
var helper = new THREE.HemisphereLightHelper( light, 5 );

//this.scene.add( helper );

    this.light1 = new THREE.SpotLight(0xff0000, 1)
    this.light1.position.set(-30, -700, 900)
    this.light1.castShadow = true

//    this.scene.add(this.light1)
    this.scene.add(this.light0)
  }

  setupCloth() {
    this.pinsFormation = []
    this.pins = [1]

    this.pinsFormation.push(this.pins)

    this.clothMaterial = new THREE.MeshStandardMaterial({
      color: 0xf18fca,
      //roughness: 0.5, 
      //metalness: 0.1,
      side: THREE.BackSide
    })
    

 //   this.clothMaterial.color.convertSRGBToLinear()

    this.clothGeometry = new THREE.ParametricBufferGeometry(clothFunction, cloth.w, cloth.h)

    this.clothMesh = new THREE.Mesh(this.clothGeometry, this.clothMaterial)
    this.clothMesh.position.set(20, 0, 0)
    //    this.clothMesh.ex = 0.8
    // this.clothMesh.rotation.x = 2
    // this.clothMesh.rotation.y = 1.6

    // this.camera.lookAt(this.clothMesh.position)

    //    this.clothMesh.castShadow = true
    //    this.clothMesh.receiveShadow = true
    this.scene.add(this.clothMesh)

    // this.clothMesh.customDepthMaterial = new THREE.MeshDepthMaterial({
    //   depthPacking: THREE.RGBADepthPacking,
    //   map: this.clothTexture,
    //   alphaTest: 0.5
    // })

  }

  setupSphere() {
    let geo = new THREE.SphereBufferGeometry(10, 100, 100)
    let mat = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    let sphere = new THREE.Mesh(geo, mat)
    this.sphere = sphere
    this.scene.add(this.sphere)
  }

  setupEventListeners() {
    let that = this


    window.addEventListener('resize', e => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })

    window.addEventListener('mousemove', e => {
      const mousePos = this.onMouseMove(e)
      that.mousex = mousePos.x
      that.mousey = mousePos.y
    })
  }

  onMousePress(e) {
    this.mousePressed = true
  }

  onMouseRelease(e) {

  }

  onMouseMove(e) {
    let mousex = (e.clientX / window.innerWidth * 2 - 1)
    let mousey = (e.clientY / window.innerHeight * -2 + 1)
    return {
      x: mousex,
      y: mousey
    }
  }

  update() {
    let time = Date.now()
    let windStrength = Math.cos(time / 10000) * 10 + 60

    //////// adjust wind force, 4 Chris
    // windowForce.set(x, y, z) -> these affect the wind direction in their coordinates
    // mousex is normalized, the left part of the screen = -1, center = 0, right side = 1
    // x and z are affected by mouse position
    // Increase (x) multiplier (example * 0.3) to have more drastic wind adjustment on x axis
    //
    // Also look for DAMPING variable which affects how light the fabric is and how much movement.
    // Lower number = lighter,
    // Higher number = heavier
    //
    // windForce.multiplyScalar(windStrength) below
    // This function multiplies the windForce(x, y, z) by cosine function that
    // changes from -1 to 1 to simulate movement.
    /////////
//    windForce.set((-this.mousex + 2) * 0.3, Math.cos(time / 3000), (this.mousey) * 0.1)

    windForce.set(Math.cos(time / 10000), Math.cos(time / 1000), Math.cos(time / 3000))

    windForce.normalize()
    windForce.multiplyScalar(windStrength)
    simulate(time, this.clothGeometry, this.pins, windForce, this.mousey, this.mousex, windStrength)

    this.render()
  }

  render() {
    let p = cloth.particles

    let il = p.length
    for (let i = 0; i < il; i++) {
      let v = p[i].position
      this.clothGeometry.attributes.position.setXYZ(i, v.x, v.y, v.z)
    }

    this.clothGeometry.attributes.position.needsUpdate = true

    this.clothGeometry.verticesNeedUpdate = true
    //    this.clothGeometry.computeFaceNormals()
    this.clothGeometry.computeVertexNormals()


    //   this.clothMesh.rotation.y = this.mousex * 2 


    // this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }
}

function setupMoon() {
  const x = new Moon()
  x.init()
  render()

  setTimeout(() => {
    document.querySelector('canvas').classList.add('active')
  }, 1100)

  function render() {
    window.requestAnimationFrame(render)
    x.update()
  }

  window.stopRendering = function () {
    window.cancelAnimationFrame(render)
  }
}

setupMoon()


