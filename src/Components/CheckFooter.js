import { stretch } from "./Stretch";
/**
 * When in SideMenu: If the content of the page does not fill the entire height, put the footer at the end of the screen. If the content is higher than the screen,
 * put the footer at the end of the content.
 * @param {*} divToCheck the div to be checked if it is higher than the screen
 */
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

/**
 * When in SideMenu: If the content of the page does not fill the entire height, put the footer at the end of the screen. If the content is higher than the screen,
 * put the footer at the end of the content.
 * @param divToCheck the div to be checked if it is higher than the screen.
 */
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
        