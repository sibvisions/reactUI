function createRipple(event:any, menuCollapsed:boolean) {
    const elem = event.currentTarget;
    const circle:HTMLSpanElement = document.createElement("span");
    const diameter = Math.max(elem.clientWidth, elem.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = diameter + 'px';
    circle.style.left = (event.clientX - (elem.offsetLeft + radius + (menuCollapsed ? 80 : 240))) + 'px';
    circle.style.top = (event.clientY - (elem.offsetTop + radius + 70)) + 'px';
    console.log(elem.offsetLeft+radius, event.clientX, elem.getBoundingClientRect().left)
    circle.classList.add('ripple');
    const ripple = elem.getElementsByClassName('ripple')[0];
    if (ripple)
        ripple.remove();
    elem.appendChild(circle);
}

export function addRippleEffect(className:string|undefined, ref:Element|undefined, menuCollapsed:boolean) {
    if (className) {
        const elems = document.getElementsByClassName(className);
        for (const elem of elems)
            elem.addEventListener('click', (e) => createRipple(e, menuCollapsed));
    }
    else if (ref)
        ref.addEventListener('click', (e) => createRipple(e, menuCollapsed));
}

export function removeRippleEffect(className:string|undefined, ref:Element|undefined) {
    if (className) {
        const elems = document.getElementsByClassName(className);
        for (const elem of elems) {
            //@ts-ignore
            elem.removeEventListener('click', createRipple);
        }
    }
    else if (ref) {
        //@ts-ignore
        ref.removeEventListener('click', createRipple)
    }
}