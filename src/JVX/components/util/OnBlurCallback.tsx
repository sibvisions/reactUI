export function onBlurCallback(props:React.PropsWithChildren<any>, value: string|number|Array<any>|null, lastValue:any, sendSetValues:Function) {
    if (props.onSubmit)
        props.onSubmit();
    if (value !== undefined && value !== lastValue) {
        sendSetValues();
    }
}