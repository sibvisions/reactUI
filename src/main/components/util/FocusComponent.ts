import _ from "underscore";

/**
 * Focuses the next or previous element based on tabindex.
 * @param id - the id of the currently focused element
 * @param next - true if the next element should be focused false if the previous
 */
export function focusComponent(id:string, next:boolean) {
    //get all focusable elements, filter out negativ tabindex/disabled/td's sort by tabindex
    let focusable = Array.from(document.getElementById("reactUI-main")!.querySelectorAll("a, button, input, select, textarea, [tabindex], [contenteditable], #" + id)).filter((e: any) => {
        if (e.disabled || (e.getAttribute("tabindex") && parseInt(e.getAttribute("tabindex")) < 0) || e.tagName === "TD") return false
        return true;
    }).sort((a: any, b: any) => {
        return (parseFloat(a.getAttribute("tabindex") || 99999) || 99999) - (parseFloat(b.getAttribute("tabindex") || 99999) || 99999);
    })
    const elemIndex = focusable.findIndex(e => e.id === id);
    const currElemIsFirst = elemIndex === 0;
    const currElemIsLast = elemIndex === focusable.length - 1;
    //if next and elem last focus first elem, if prev and elem first focus last elem
    let indexToFocus = next ? (currElemIsLast ? 0 : elemIndex + 1) : (currElemIsFirst ? focusable.length - 1 : elemIndex - 1);
    //loop if the next focusable element is a child of the current element skip it. eg. datepicker/linked overlay
    while (focusable[elemIndex].contains(focusable[indexToFocus])) {
        indexToFocus++
    }
    if (focusable[indexToFocus]) (focusable[indexToFocus] as HTMLElement).focus();
}