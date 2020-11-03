export function swapProps(elem:HTMLElement, swap1:string, swap2:string) {
    const oldSwap1 = window.getComputedStyle(elem).getPropertyValue(swap1);
    const oldSwap2 = window.getComputedStyle(elem).getPropertyValue(swap2)
    elem.style.setProperty(swap1, oldSwap2);
    elem.style.setProperty(swap2, oldSwap1);
}