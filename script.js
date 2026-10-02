const scene=document.getElementById("scene");const cube=document.getElementById("cubeWrap");let tx=0,ty=0;
scene.addEventListener("pointermove",e=>{const x=e.clientX/window.innerWidth-.5;const y=e.clientY/window.innerHeight-.5;tx=x*22;ty=y*18});
function animate(){cube.style.transform="rotateX("+(-ty)+"deg) rotateY("+tx+"deg)";requestAnimationFrame(animate)}animate();