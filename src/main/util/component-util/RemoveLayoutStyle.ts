export function removeLayoutStyle(ref:any) {
    ref.style.removeProperty("top");
    ref.style.removeProperty("left");
    ref.style.removeProperty("width");
    ref.style.removeProperty("height");
}