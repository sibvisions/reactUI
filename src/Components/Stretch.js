export function stretch(divToStretch) {
    var elem = document.getElementsByClassName(divToStretch)[0];
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