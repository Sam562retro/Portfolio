const parallax_el = document.querySelectorAll('.parallax');
let xVal = 0, yVal = 0;

window.addEventListener("mousemove", (e) => {
  xVal = e.clientX - window.innerWidth / 2;
  yVal = e.clientY - window.innerHeight / 2;
  console.log(parallax_el);
  parallax_el.forEach(el => {
    let speedX = el.dataset.speedx;
    let speedY = el.dataset.speedy;
    console.log(el);

    el.style.transform = `perspective(2300px) translateX(${xVal * speedX}px) translateY(${yVal * speedY}px)`;
  })
})

function popUpOpen(item){
  document.getElementById("mainPopup").classList.remove('animate-fade-out');
  document.getElementById("mainPopup").style.display="block";
  document.getElementById("mainPopup").classList.add('animate-fade-in');
}

function closePopup(){
  document.getElementById("mainPopup").classList.remove('animate-fade-in');
  document.getElementById("mainPopup").classList.add('animate-fade-out');
}
