const parallax_el = document.querySelectorAll('.parallax');
let xVal = 0, yVal = 0;

window.addEventListener("mousemove", (e) => {
  xVal = e.clientX - window.innerWidth / 2;
  yVal = e.clientY - window.innerHeight / 2;

  parallax_el.forEach(el => {
    let speedX = el.dataset.speedx;
    let speedY = el.dataset.speedy;

    el.style.transform = `perspective(2300px) translateX(${xVal * speedX}px) translateY(${yVal * speedY}px)`;
  })
})
