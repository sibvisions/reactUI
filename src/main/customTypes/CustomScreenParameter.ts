/** Interface for CustomScreenParameter */
interface CustomScreenParameter {
    name: string|string[],
    parameter: { [key:string]: any }
    onClose?:boolean
}
export default CustomScreenParameter