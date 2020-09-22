function Throttle(func: Function, wait: number, options: {leading: boolean; trailing: boolean} = {leading: false, trailing:true}) {
    let context: any, args: IArguments | undefined, result:any;
    let timeout: NodeJS.Timeout | undefined = undefined;
    let previous = 0;
    let later = function() {
        previous = !options.leading ? 0 : Date.now();
        timeout = undefined;
        result = func.apply(context, args);
        if (!timeout) context = args = undefined;
    };
    return function() {
        let now = Date.now();
        if (!previous && !options.leading) previous = now;
        let remaining = wait - (now - previous);
        // @ts-ignore
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = undefined;
            }
            previous = now;
            result = func.apply(context, args);
            if (!timeout) context = args = undefined;
        } else if (!timeout && options.trailing) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };
}
export default Throttle

