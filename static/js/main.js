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

function popUpOpen(item){
  document.getElementById("mainPopup").classList.remove('animate-fade-out');
  document.getElementById("mainPopup").style.display="block";
  if(item == "guitar"){
    document.getElementById("guitarPopup").style.display="block";
  }else if(item == "computer"){
    document.getElementById("computerPopup").style.display="block";
  }
  document.getElementById("mainPopup").classList.add('animate-fade-in');
}

function closePopup(){
  document.getElementById("mainPopup").classList.remove('animate-fade-in');
  document.getElementById("guitarPopup").style.display="none";
  document.getElementById("computerPopup").style.display="none";
  document.getElementById("mainPopup").classList.add('animate-fade-out');
}

function closePopupFromBack(event) {
  if (event.target === event.currentTarget) {
    closePopup(); // Call your close logic here
  }
}

function getNextIndex(arr, index, operation){
  if(operation == "next"){
    if(index == arr.length - 1){
      return 0;
    }else{
      return index + 1;
    }
  }else if(operation == "prev"){
    if(index == 0){
      return arr.length - 1;
    }else{
      return index - 1;
    }
  }
}
