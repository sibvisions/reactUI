/** Helper method to concatenate class names and filter out falsy values */
export function concatClassnames(...classNames: (string | null | undefined)[]) {
    return classNames.filter(Boolean).join(' ');
}