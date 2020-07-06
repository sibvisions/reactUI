import { stretch } from "./Stretch";
/**
 * When in SideMenu: If the content of the page does not fill the entire height, put the footer at the end of the screen. If the content is higher than the screen,
 * put the footer at the end of the content.
 * @param {*} divToCheck the div to be checked if it is higher than the screen
 */
export function CheckFooterSide(divToCheck) {
    const computedStyle = getComputedStyle(document.getElementsByClassName(divToCheck)[0]);
    var elemHeight = document.getElementsByClassName(divToCheck)[0].clientHeight;
    elemHeight -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    const elemFooter = document.getElementsByClassName("footer-sidemenu")[0];
    console.log(window.innerHeight - elemFooter.scrollHeight)
    if(elemHeight < (window.innerHeight - elemFooter.scrollHeight)) {
        elemFooter.classList.add("fixedPos");
    }
    else if(elemHeight > window.innerHeight) {
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
    const computedStyle = getComputedStyle(document.getElementsByClassName(divToCheck)[0]);
    var elemHeight = document.getElementsByClassName(divToCheck)[0].clientHeight;
    elemHeight -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    const elemFooter = document.getElementsByClassName("footer-topmenu")[0]
    console.log(window.innerHeight - elemFooter.scrollHeight)
    if(elemHeight < (window.innerHeight - elemFooter.scrollHeight)) {
        elemFooter.classList.add("fixedPos");
    }
    else if(elemHeight > window.innerHeight) {
        elemFooter.classList.remove("fixedPos");
    }
}