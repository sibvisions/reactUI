const defaultTransforms = {
    'csv': (v:string) => v.split(',').map(v => v.trim()),
    'float': (v:string) => parseFloat(v),
};

interface CSSMapping { 
    cssVar: string, 
    transform?: Function | keyof typeof defaultTransforms, 
    defaultValue?: any 
}

/**
 * Fetches settings from css variables
 * @param mapping - An object specifying the mapping from css to resulting object
 * @param elem - Optional reference element to use for css variable fetching
 * @returns An Object with the mapped values
 */
export default function getSettingsFromCSSVar(mapping: Record<string, string | CSSMapping>, elem?: HTMLElement | null) {
    const style = getComputedStyle(elem || document.body);

    const out:any = {}
    Object.keys(mapping).forEach(k => {
        const m = mapping[k];
        var cssVar:string, transform: CSSMapping["transform"], defaultValue;
        if(typeof m === "string") {
            cssVar = m;
        } else {
            var { cssVar, transform, defaultValue } = m;
        }
        const v = style.getPropertyValue(cssVar).trim();
        if (transform) {
            const t = typeof transform === 'function' ? transform : defaultTransforms[transform];
            out[k] = t(v) || defaultValue;
        } else {
            out[k] = v || defaultValue;
        }
    })
    return out
}