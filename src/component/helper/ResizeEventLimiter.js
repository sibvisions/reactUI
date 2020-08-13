export function resizeEventLimiter(fn, ms, ref){
    let timer;
    return () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
                timer = null;
                fn.apply(ref, arguments);
        }, ms)
    };
}