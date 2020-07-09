/**
 * When this function gets called, a Mutationobserver is added to the menu-container div of the sidemenu.
 * It checks, if the classList of the menu-container changes and if it changes, 
 * class stretched gets added or removed based on if the menu contains hideor show to the div of the parameter
 * then the div will stretch with an animation.
 * @param {string} divToStretch the div which is able to stretch when the menu gets minimized
 */
export function stretch(divToStretch) {
    var elem = document.getElementsByClassName(divToStretch)[0];
    if(document.getElementsByClassName('menu-container')[0].classList.contains("hide")) {
        elem.classList.add("stretched")
    }
    const mutationObserver = new MutationObserver((mutationsList) => {
        mutationsList.forEach(mutation => {
            if (mutation.attributeName === 'class') {
                if(mutation.target.classList.contains("hide")) {
                    elem.classList.add("stretched");
                }
                else if(mutation.target.classList.contains("show") && elem.classList.contains("stretched")) {
                    elem.classList.remove("stretched");
                }
            }
        })
    })
    mutationObserver.observe(
        document.getElementsByClassName('menu-container')[0],
        { attributes: true }
    )
}