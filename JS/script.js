'use strict';
/* import * as THREE from 'three'; */

/* Base (Canvas) */

const canvas = document.querySelector('canvas.webgl');

/* Scene */

const scene = new THREE.Scene();

/* ///////////////////////////////////////////////////////////////////////////
/* Test Cube 3D Geometry

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1, 1);
const cubeMaterial = new THREE.MeshBasicMaterial({
    color: 0xFF5733,    //0x......(must have)
});
const cube = new THREE.Mesh(
    cubeGeometry, cubeMaterial
);
scene.add(cube);

*/ ///////////////////////////////////////////////////////////////////////////

/* Texture */

const textureLoader = new THREE.TextureLoader();
const alphaShadow = textureLoader.load('/asset/donut_2.0/textures/simpleShadow.jpg');

/* Shadow */

const objectGeometry = new THREE.PlaneGeometry(2, 2);
const objectMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    color: 0x000000,
    opacity: 0.1,
    alphaMap: alphaShadow,
});

const shadow = new THREE.Mesh(objectGeometry, objectMaterial);

shadow.rotation.x = -Math.PI * 0.5;
shadow.position.y = -1;
shadow.position.x = 1.5;    

scene.add(shadow);

/* Overlay */

const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
const overlayMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        void main() {
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uAlpha;
        void main(){
            gl_FragColor = vec4(0,0,0,uAlpha);
        }
    `,
    uniforms: {
        uAlpha: {
            value: 1.0
        }
    },
    transparent: true,
});

const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
scene.add(overlay);

/* Loaders */

const loadingBar = document.querySelector('.loading-bar');
const body = document.querySelector('body');
const loadingManager = new THREE.LoadingManager(
    ()=>{
        window.setTimeout(() =>{
            gsap.to(overlayMaterial.uniforms.uAlpha, {
                duration: 2.5,
                value: 0,
                delay: 0.1,
            });

            loadingBar.classList.add('ended');
            body.classList.add('loaded');
            loadingBar.style.transform = '';

        }, 500);
    },
    (itemURL, itemsLoaded, itemsTotal) => {
        console.log(itemURL, itemsLoaded, itemsTotal);
        const progressRatio = itemsLoaded / itemsTotal;
        loadingBar.style.transform = `scalex(${progressRatio})`;
    },
    () => {
        console.log('error');
    }
);

/* GLTF Loader */

let donut = null;
const gltfLoader = new THREE.GLTFLoader(loadingManager);
gltfLoader.load('./asset/donut_2.0/scene.gltf', (gltf) => {
    donut = gltf.scene;

    donut.position.x = 1.5;
    donut.rotation.x = Math.PI * 0.2;
    donut.rotation.z = Math.PI * 0.15;

    const radius = 8.5;

    donut.scale.set(radius, radius, radius);
    scene.add(donut);
});

/* Scroll */

const transformDonut = [{
    rotationZ: 0.45,
    positionX: 1.5,
}, {
    rotationZ: -0.45,
    positionX: -1.5,
}, {
    rotationZ: Math.PI * 0.01, //  Math.PI * 0.01 0.0314
    positionX: 0,
}, {
    rotationZ: Math.PI * 0.01,
    positionX: 0,
}];

let scrollY =  window.scrollY;
let currentSection = 0;
window.addEventListener('scroll', () =>{
    scrollY = window.scrollY;
    const newSection = Math.round(scrollY / sizes.height);
    console.log(newSection);

    if(currentSection != newSection){
        currentSection = newSection;

        if(!!donut){
            gsap.to(
                donut.rotation, {
                    duration: 1.5,
                    ease: 'power2.inOut',
                    z: transformDonut[currentSection].rotationZ,
                }
            );
            gsap.to(
                donut.position, {
                    duration: 1.5,
                    ease: 'power2.inOut',
                    x: transformDonut[currentSection].positionX,
                }
            );
            gsap.to(
                shadow.position, {
                    duration: 1.5,
                    ease: 'power2.inOut',
                    x: transformDonut[currentSection].positionX - 0.2,
                }
            );
        }
    }
});

/* On reload */

window.onbeforeunload = function(){
    window.scrollTo(0, 0);
};

/* Sizes */

const sizes ={
    width: window.innerWidth,
    height: window.innerHeight,
};  

/* Camera */

const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 1000);
camera.position.z = 5;
scene.add(camera);

/* Light */

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);

directionalLight.position.set(1, 2, 0);
directionalLight.castShadow = true;


scene.add(directionalLight);

/* Renderer */

const renderer = new THREE.WebGLRenderer({
    canvas: canvas, 
    antialias: true,
    alpha: true,
});

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));



/* Animate */

const clock = new THREE.Clock();
let lastElapsedTime = 0;

const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - lastElapsedTime;
    lastElapsedTime = elapsedTime;

    if (!!donut) {
        donut.position.y = Math.sin(elapsedTime * 0.5) * 0.1 - 0.1;  //frequency of motion to Y axis (static mode)
        shadow.material.opacity = (1 - Math.abs(donut.position.y)) * 0.2;
    }

    console.log('tick');
    renderer.render(scene, camera);

    window.requestAnimationFrame(tick);
};

tick();