import { stretch } from "./Stretch";
export function CheckFooterSide(divToCheck) {
    const elemContent = document.getElementsByClassName(divToCheck)[0];
    const elemFooter = document.getElementsByClassName("footer-sidemenu")[0]
    if(elemContent.clientHeight < window.innerHeight) {
        elemFooter.classList.add("fixedPos");
    }
    else if(elemContent.clientHeight > window.innerHeight && elemFooter.classList.contains("fixedPos")) {
        elemFooter.classList.remove("fixedPos");
    }
    stretch('footer-sidemenu');
}

export function CheckFooterTop(divToCheck) {
    const elemContent = document.getElementsByClassName(divToCheck)[0];
    const elemFooter = document.getElementsByClassName("footer-topmenu")[0]
    if(elemContent.clientHeight < window.innerHeight) {
        elemFooter.classList.add("fixedPos");
    }
    else if(elemContent.clientHeight > window.innerHeight && elemFooter.classList.contains("fixedPos")) {
        elemFooter.classList.remove("fixedPos");
    }
}
        