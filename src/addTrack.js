import {Curves} from 'three/examples/jsm/Addons.js'
import {
	TubeGeometry,
	MeshBasicMaterial,
	DoubleSide,
	Mesh,
	Group,
	Vector3,
	CatmullRomCurve3,
	SphereGeometry,
	PlaneGeometry,
    TextureLoader
} from 'three'

const loader = new TextureLoader()

export const addTrack = () => {
    //to use existing curve geometry
    // const curver = new Curves.GrannyKnot()
    
    //to custom a curve
    const group = new Group() 
	const points = [
        new Vector3(-1, -1, -1),          
        new Vector3(4, -2, -4),   
        new Vector3(6, -3, -6), 
        new Vector3(3, 1, -8), 
        new Vector3(-4, -5, -10),
        new Vector3(-8, 5, -12),
        new Vector3(-10, 0, -5),  
        new Vector3(0, -10, 5), 
	]
    const curver = new CatmullRomCurve3(points)
    
    // //Debug: create visual markers (red spheres) for each control point
    // const sphereGeometry = new SphereGeometry(0.2)
	// const sphereMaterial = new MeshBasicMaterial({
	// 	color: 'red',
	// })
	// points.forEach((point) => {
	// 	const sphere = new Mesh(sphereGeometry, sphereMaterial)
	// 	sphere.position.copy(point)
	// 	group.add(sphere)
	// })

    //create a tube based on the curver
    const geomotry = new TubeGeometry(curver, 100, 2, 8, true)
    const material = new MeshBasicMaterial({
		wireframe: true,
		side: DoubleSide,
		color: 0xffffff, //white
		visible: false,
	})
    const tube = new Mesh(geomotry, material)
    
    addEmptyWindows()
    addWindows()
    

function addEmptyWindows () {
// add empty windows along the track
const planeGeometry = new PlaneGeometry(2, 1.5)
const texture = loader.load('empty_window_1.png')
const planeMaterial = new MeshBasicMaterial({
    // color: 0x444444,  
    map: texture,
    side: DoubleSide,
    transparent: true,
    // opacity: 0.8, 
})

// create planes at regular intervals
const numPlanes = 70  
for (let i = 0; i < numPlanes; i++) {
    const plane = new Mesh(planeGeometry, planeMaterial)
    
    const progress = i / (numPlanes - 1) 
    const point = curver.getPointAt(progress)
    plane.position.copy(point)

    // orient the plane perpendicular to the curve
    const tangent = curver.getTangentAt(progress)
    plane.lookAt(point.clone().add(tangent))
    plane.scale.x = -1
    
    group.add(plane)
}
}

function addWindows () {
    const planeGeometry = new PlaneGeometry(2, 1)
    const texturePaths = [
        'SEE.png',
        'POWER.png',
        'SELF.png',
        'OUTLIERS.png',
        'AGENCY.png'
    ]
    const textures = texturePaths.map(path => loader.load(path))
    const planeMaterial = new MeshBasicMaterial({
        map: textures[0],
        side: DoubleSide,
        // transparent: true,
    })

    const numPlanes = 8
    for (let i = 0; i < numPlanes; i++) {
        const plane = new Mesh(planeGeometry, planeMaterial.clone())

        //loop through the textures array
        plane.material.map = textures[i % textures.length]
        
        const progress = i / numPlanes 
        const point = curver.getPointAt(progress)
        plane.position.copy(point)
  
        // orient the plane perpendicular to the curve
        const tangent = curver.getTangentAt(progress)
        plane.lookAt(point.clone().add(tangent))
        plane.scale.x = -1
        
        group.add(plane)
    }
}
    // return tube
    
    // return both the debug points group and the track tube
	return { debugPoints: group, track: tube }
}