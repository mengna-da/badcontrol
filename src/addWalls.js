import {
    BoxGeometry,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Mesh,
    MeshPhysicalMaterial,
    TextureLoader,
    SphereGeometry,
    PlaneGeometry
} from 'three'
import { normalMap } from 'three/tsl'

//define texture loader
const loader = new TextureLoader()

export const addWall = ({
    texturePath,
    width = 5,
    height = 5,
    position = { x: 0, y: 0, z: 0 },
    rotation = { x: -Math.PI / 2, y: 0, z: 0 }
}) => {
    const texture = loader.load(
        texturePath,
        undefined,
        undefined,
        (error) => {
            console.error('Error loading texture:', error);
        }
    )
    const geometry = new PlaneGeometry(width, height)
    const material = new MeshBasicMaterial({
        map: texture
    })
    const wall = new Mesh(geometry, material)
    
    wall.rotation.set(rotation.x, rotation.y, rotation.z)
    wall.position.set(position.x, position.y, position.z)
    
    return wall
}

export const addPopUp = ({
    texturePath,
    width = 2,
    height = 1,
    position = { x: 0, y: 2, z: -2},
    rotation = { x: 0, y: 0, z: 0 }
}) => {
    const texture = loader.load(texturePath)
    const geometry = new PlaneGeometry(width, height)
    const material = new MeshBasicMaterial({
        map: texture
    })
    const popUp = new Mesh(geometry, material)
    popUp.userData.groupName = 'popUp'
    
    popUp.rotation.set(rotation.x, rotation.y, rotation.z)
    popUp.position.set(position.x, position.y, position.z)
    
    return popUp
}