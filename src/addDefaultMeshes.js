import {
    BoxGeometry,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Mesh,
    MeshPhysicalMaterial,
    TextureLoader,
    SphereGeometry
} from 'three'
import { normalMap } from 'three/tsl'

//define texture loader
const loader = new TextureLoader()

//example function using textures and mesh physical material
export const addTextureMesh = () => {
    const color = loader.load('textures/Ice_001_COLOR.jpg')
    const normal = loader.load('textures/Ice_001_NRM.jpg')
    const displace = loader.load('textures/Ice_001_DISP.png')
    const ambientOcclusion = loader.load('textures/Ice_001_OCC.jpg')
    const sphere = new SphereGeometry(0.5, 100, 100)
    const sphereMaterial = new MeshPhysicalMaterial ({
        map: color,
        normalMap: normal,
        displacementMap: displace,
        displacementScale: 0.5,
        aoMap: ambientOcclusion, 
        //MeshPhysicalMaterial features
        metalness: 2,
        roughness: 0,
        transmission: 1.5, //how much light comes through
        ior: 2.33 //reflectivity (2.33 is a common number)
    })
    const sphereMesh = new Mesh(sphere, sphereMaterial)
    // sphereMesh.position.set(0, -2, 0)
    return sphereMesh
}

export const addMetalMesh = () => {
    const color = loader.load('metal-mesh/Metal_Mesh_009_basecolor.png')
    const normal = loader.load('metal-mesh/Metal_Mesh_009_normal.png')
    const displace = loader.load('metal-mesh/Metal_Mesh_009_height.png')
    const ambientOcclusion = loader.load('metal-mesh/Metal_Mesh_009_ambientOcclusion.png')
    const sphere = new SphereGeometry(.8, 100, 100)
    const sphereMaterial = new MeshPhysicalMaterial ({
        map: color,
        normalMap: normal,
        displacementMap: displace,
        // displacementScale: 2,
        aoMap: ambientOcclusion,
        metalness: 5,
        transmission: 3,
        ior: 4
    })
    const sphereMesh = new Mesh(sphere, sphereMaterial)
    sphereMesh.position.set(0, 2, 0)
    return sphereMesh
}

//two different types of boxes
export const addBoilerPlateMeshes = () => {
    const box = new BoxGeometry(1, 1, 1)
    const boxMaterial = new MeshBasicMaterial({color: 0xff0000})
    const boxMesh = new Mesh(box, boxMaterial)
    boxMesh.position.set(-2, 0, 0)
    return boxMesh
}

export const addStandardMesh = () => {
    const box = new BoxGeometry(1, 1, 1)
    const boxMaterial = new MeshStandardMaterial({color: 0x00ff00})
    const boxMesh = new Mesh(box, boxMaterial)
    boxMesh.position.set(2, 0, 0)
    return boxMesh
}

