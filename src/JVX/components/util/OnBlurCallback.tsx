/**
 * When the component gets blurred, submit if possible and if the value changed, call the setValues function given.
 * @param props - properties of component
 * @param value - current value of component
 * @param lastValue - previous value that was entered in the component
 * @param sendSetValues - function to setValues
 */
export function onBlurCallback(props:React.PropsWithChildren<any>, value: string|number|Array<any>|null, lastValue:any, sendSetValues:Function) {
    if (props.onSubmit)
        props.onSubmit();
    if (value !== undefined && value !== lastValue)
        sendSetValues();
}