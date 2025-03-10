import './style.css'
import * as THREE from 'three'
import { addWall, addPopUp } from './addWalls.js'
import {addLight} from './addDefaultLight'
import Model from './Model'
import { HDRI } from './environment'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import { addTrack } from './addTrack.js'

const renderer = new THREE.WebGLRenderer({antialias: true})

const clock = new THREE.Clock()

const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000)

const meshes = {}

const lights = {}

const mixers = [] //animation storage

//add two scenes: one for the main room, one for the tube with fog
const mainScene = new THREE.Scene()
const tubeScene = new THREE.Scene()
tubeScene.fog = new THREE.Fog(0x000000, 0.1, 5)

// orbit control
let controls = new OrbitControls(camera, renderer.domElement)
controls.enabled = true

// camera track
let scrollProgress = 0 //between 0 and 1
let targetProgress = 0 //between 0 and 1
let scrollVelocity = 0 //scroll speed
const friction = 0.95 //how fast scroll velocity drops back down to 0
const acceleration = 0.00007
const maxVelocity = 0.05
const debug = document.querySelector('.scrollProgress')
// automatic camera movement in the tube
let autoCameraMovement = false 
const fallSpeed = 0.0007

// raycast
const pointer = new THREE.Vector2()
const raycaster = new THREE.Raycaster()

init()
function init(){
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  meshes.floor = addWall({
    texturePath: 'POWER.png',
    width: 5,
    height: 5,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 }
  })

  meshes.frontWall = addWall({
    texturePath: 'AGENCY.png',
    width: 5,
    height: 3.5,
    position: { x: 0, y: 1.75, z: -2.5 },
    rotation: { x: 0, y: 0, z: 0 }
  })

  meshes.backWall = addWall({
    texturePath: 'AGENCY.png',
    width: 5,
    height: 3.5,
    position: { x: 0, y: 1.75, z: 2.5 },
    rotation: { x: Math.PI, y: 0, z: Math.PI }
  })

  meshes.ceiling = addWall({
    texturePath: 'OUTLIERS.png',
    width: 5,
    height: 5,
    position: { x: 0, y: 3.5, z: 0 },
    rotation: { x: Math.PI / 2, y: 0, z: 0 }
  })

  meshes.leftWall = addWall({
    texturePath: 'SEE.png',
    width: 5,
    height: 3.5,
    position: { x: -2.5, y: 1.75, z: 0 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 }
  })

  meshes.rightWall = addWall({
    texturePath: 'SELF.png',
    width: 5,
    height: 3.5,
    position: { x: 2.5, y: 1.75, z: 0 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 }
  })

  meshes.popUp = addPopUp({
    texturePath: 'popup.png',
    position: { x: 0.3, y: 1, z: -0.5}
  })
  meshes.popUp.visible = false

  //add the tube
  meshes.track = addTrack().track
  meshes.debugPoints = addTrack().debugPoints

  lights.default = addLight()

  // main room scene
  mainScene.add(lights.default)
  mainScene.add(meshes.floor)
  mainScene.add(meshes.ceiling)
  mainScene.add(meshes.frontWall)
  mainScene.add(meshes.backWall)
  mainScene.add(meshes.leftWall)
  mainScene.add(meshes.rightWall)
  mainScene.add(meshes.popUp)

  // tube scene
  tubeScene.add(meshes.track)
  tubeScene.add(meshes.debugPoints)

  //initial camera position: looking at the room
  camera.position.set(-0.2, 1.1, 3)
  camera.lookAt(new THREE.Vector3(-0.2, -0.3, -5.15))
  controls.target = new THREE.Vector3(-0.2, -0.3, -5.15)

  // instances()
  resize()
  animate()
  raycast()
  handleScroll()
}

function handleScroll() {
	// convert wheel events into camera movement
	window.addEventListener('wheel', (event) => {
		const scrollDelta = event.deltaY
		scrollVelocity += scrollDelta * acceleration
		// clamp velocity to maximum speed
		scrollVelocity = Math.max(
			Math.min(scrollVelocity, maxVelocity),
			-maxVelocity
		)
	})
}

function updateCamera(scrollProgress) {
	// get current position on the track
	const position =
		meshes.track.geometry.parameters.path.getPointAt(scrollProgress)

	// look slightly ahead on the track
	const lookAtPosition = meshes.track.geometry.parameters.path.getPointAt(
		Math.min(scrollProgress + 0.01, 1)
	)
	camera.position.copy(position)
	camera.lookAt(lookAtPosition)

	// update debug display if available
	if (debug) {
		debug.innerHTML = `Progress: ${scrollProgress.toFixed(
			3
		)} || Velocity: ${scrollVelocity.toFixed(5)}`
	}
}

function updateCameraOnFall() {
  if (!autoCameraMovement) return

  if(scrollProgress <0.98) {
    scrollProgress += fallSpeed
    scrollProgress = Math.min(scrollProgress, 0.98) // clamp between 0 and 0.98

    const position = meshes.track.geometry.parameters.path.getPointAt(scrollProgress)
    const lookAtPosition = meshes.track.geometry.parameters.path.getPointAt(
        Math.min(scrollProgress + 0.01, 0.99) //limit the lookat camera to 0.99 instead of 1
    )

    gsap.to(camera.position, {
        x: position.x,
        y: position.y,
        z: position.z,
        duration: 0.5,
        overwrite: true,
        onUpdate: () => {
            camera.lookAt(lookAtPosition)  // Update look-at during movement
        }
    })

    camera.lookAt(lookAtPosition)
  } 
}

function raycast(){
  window.addEventListener('click', (event)=>{ 
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1
    // console.log(pointer)
    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(mainScene.children)
    // console.log(intersects)
    
    for (let i = 0; i < intersects.length; i++) {
      let object = intersects[i].object
      while (object) {
        if (object.userData.groupName === 'popUp') {
          // console.log("popup window clicked")
          // meshes.popUp.visible = false
          explodeWalls()
          startTrackFollow()  // start to fall
          break
        }
        object = object.parent
      }
    }
  })
}

function explodeWalls() {
  const timeline = gsap.timeline()

  const positions = {
    popUp: {x: -2, y: 4, z: -12 },
    frontWall: { x:5, y: 0, z: -10 },
    backWall: { x: -8, y: 3, z: -5 },
    leftWall: { x: -10, y: -1, z: -5 },
    rightWall: { x: -4, y: -5, z: -10 },
    floor: { x: 0, y: -8, z: 4 }, 
    ceiling: {x: -7, y: -10, z: -14}
  }

	// const points = [
  //   new Vector3(-1, -1, -1),          
  //   new Vector3(4, -2, -4),   
  //   new Vector3(6, -3, -6), 
  //   new Vector3(3, 1, -8), 
  //   new Vector3(-4, -5, -10),
  //   new Vector3(-8, 5, -12),
  //   new Vector3(-10, 0, -5),  
  //   new Vector3(0, -10, 5), 

  const rotations = {
    popUp: { x: Math.PI * 3, y: Math.PI * 5, z: Math.PI},
    frontWall: { x: Math.PI * 5, y: Math.PI, z: Math.PI * 3 },
    backWall: { x: -Math.PI * 3, y: Math.PI * 5, z: -Math.PI },
    leftWall: { x: Math.PI, y: -Math.PI * 5, z: Math.PI * 3 },
    rightWall: { x: -Math.PI * 3, y: Math.PI, z: -Math.PI * 5 },
    floor: { x: Math.PI * 5, y: -Math.PI, z: Math.PI * 3 },
    ceiling: { x: -Math.PI * 3, y: Math.PI * 5, z: -Math.PI }
  }

  // animate positions
  Object.entries(positions).forEach(([wall, position]) => {
    timeline.to(meshes[wall].position, {
      ...position,
      duration: 27,
      ease: "power2.out"
    }, "<")
  })

  // animate rotations
  Object.entries(rotations).forEach(([wall, rotation]) => {
    timeline.to(meshes[wall].rotation, {
      ...rotation,
      duration: 27,
      ease: "power2.out"
    }, "<")
  })  

  // timeline.to(meshes.popUp.position, {
  //   x: 10,
  //   z: 10,
  //   y: -10,
  //   duration: 10,
  //   ease: "power2.out"
  // })
  
  // timeline.to(meshes.frontWall.position, {
  //   z: -10,
  //   duration: 10,
  //   ease: "power2.out"
  // }, "<")

  // // Back wall
  // timeline.to(meshes.backWall.position, {
  //   z: 10,
  //   duration: 10,
  //   ease: "power2.out"
  // }, "<")

  // // Left wall
  // timeline.to(meshes.leftWall.position, {
  //   x: -10,
  //   duration: 10,
  //   ease: "power2.out"
  // }, "<")

  // // Right wall
  // timeline.to(meshes.rightWall.position, {
  //   x: 10,
  //   duration: 10,
  //   ease: "power2.out"
  // }, "<")

  // // Floor
  // timeline.to(meshes.floor.position, {
  //   y: -10,
  //   duration: 10,
  //   ease: "power2.out"
  // }, "<")

  // // Ceiling
  // timeline.to(meshes.ceiling.position, {
  //   y: 10,
  //   duration: 10,
  //   ease: "power2.out"
  // }, "<")

  // timeline.to(meshes.frontWall.rotation, {
  //   x: Math.PI * 2,
  //   y: Math.PI,
  //   z: Math.PI * 1.5,
  //   duration: 10,
  //   ease: "power2.out"
  // }, "<")

  // timeline.to(meshes.backWall.rotation, {
  //   x: -Math.PI * 1.5,
  //   y: Math.PI * 2,
  //   z: -Math.PI,
  //   duration: 10,
  //   ease: "power2.out"
  // }, "<")

  // timeline.to(meshes.leftWall.rotation, {
  //   x: Math.PI,
  //   y: -Math.PI * 2,
  //   z: Math.PI * 1.5,
  //   duration: 10,
  //   ease: "power2.out"
  // }, "<")

  // timeline.to(meshes.rightWall.rotation, {
  //   x: -Math.PI * 1.5,
  //   y: Math.PI,
  //   z: -Math.PI * 2,
  //   duration: 10,
  //   ease: "power2.out"
  // }, "<")

  // timeline.to(meshes.floor.rotation, {
  //   x: Math.PI * 2,
  //   y: -Math.PI,
  //   z: Math.PI * 1.5,
  //   duration: 10,
  //   ease: "power2.out"
  // }, "<")

  // timeline.to(meshes.ceiling.rotation, {
  //   x: -Math.PI * 1.5,
  //   y: Math.PI * 2,
  //   z: -Math.PI,
  //   duration: 10,
  //   ease: "power2.out"
  // }, "<")
}

function startTrackFollow() {
  autoCameraMovement = true
  controls.enabled = false

  const startPoint = meshes.track.geometry.parameters.path.getPointAt(0)
  const startLookAt = meshes.track.geometry.parameters.path.getPointAt(0.01)

  const tl = gsap.timeline()
  
  tl.to(camera.position, {
      x: startPoint.x,
      y: startPoint.y,
      z: startPoint.z,
      duration: 3,
      ease: "power2.inOut",
      onComplete: () => scrollProgress = 0
  })

  tl.to(controls.target, {
      x: startLookAt.x,
      y: startLookAt.y,
      z: startLookAt.z,
      duration: 3,
      ease: "power2.inOut"
  }, "<") 

}

function resize(){
  window.addEventListener('resize', ()=>{
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  })
}

function animate(){
  if (controls) controls.update()

  // console.log('Camera Position:', {
  //   x: camera.position.x.toFixed(2),
  //   y: camera.position.y.toFixed(2),
  //   z: camera.position.z.toFixed(2)
  // });
  // console.log('Controls Target:', {
  //   x: controls.target.x.toFixed(2),
  //   y: controls.target.y.toFixed(2),
  //   z: controls.target.z.toFixed(2)
  // });

  //floating pop up window
  const elapsedTime = clock.getElapsedTime()
  const distanceToCenter = new THREE.Vector2(camera.position.x, camera.position.z).length()
  const threshold = 1.5
  
  // console.log('distance to center:', distanceToCenter)
  // console.log('popup visibility:', meshes.popUp.visible)
  
  // show/hide popup based on camera position
  if (distanceToCenter < threshold){
    meshes.popUp.visible = true
    const floatingAmplitude = 0.1
    const floatingSpeed = 1.5
    
    meshes.popUp.position.y = 1 + Math.sin(elapsedTime * floatingSpeed) * floatingAmplitude
  }

  // // Update scroll-based camera movement
  //   targetProgress += scrollVelocity
  //   scrollVelocity *= friction
  //   if (Math.abs(scrollVelocity < 0.0001)) {
  //     scrollVelocity = 0 // stop completely at very low speeds
  //   }

  //   // clamp progress to valid range
  //   targetProgress = Math.max(0, Math.min(targetProgress, 1))

  //   // smoothly move toward target position
  //   scrollProgress += (targetProgress - scrollProgress) * 0.1
  //   // console.log(scrollProgress)
  //   updateCamera(scrollProgress) //camera for scroll movement

  //Update automatic camera movement
    updateCameraOnFall()
    

  renderer.autoClear = true  
  // render main scene 
  renderer.render(mainScene, camera)
  // render fog scene on top with transparency
  if (autoCameraMovement) {
      renderer.autoClear = false
      renderer.render(tubeScene, camera)
  }

  requestAnimationFrame(animate)
  // renderer.render(scene, camera)

}

