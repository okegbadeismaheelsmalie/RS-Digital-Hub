const menuBtn = document.querySelector(".menu-btn");
const navMenu = document.querySelector(".nav-menu");


menuBtn.addEventListener("click",()=>{

    navMenu.classList.toggle("active");

});

const reveals = 
document.querySelectorAll(".reveal");
function revealSections(){
    reveals.forEach((element)=>{
        const widowHeight =
        window.innerHeight;
        const elementTop =
        element.getBoundingClientRect().top;
        if (elementTop <windowHeight - 100){
            element.classList.add("active");
        }
    })
}
window.addEventListener("scroll",()=>{
    reveals.forEach((element)=>{

        const windowHeight = 
        window.innerHeight;
        
        const elementTop =
        element.getBoundingClientRect().top;

        if(elementTop < windowHeight -
            100){
                element.classList.add("active");
            }
    });
});