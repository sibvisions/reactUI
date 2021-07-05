/** Interface for CustomScreenParameter */
interface CustomScreenParameter {
    name: string|string[],
    parameter: {
        [key:string]: any
    }
}
export default CustomScreenParameter