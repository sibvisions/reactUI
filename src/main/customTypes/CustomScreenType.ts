/** Interface for CustomScreens */
type CustomScreenType = {
    id: string,
    text: string,
    menuGroup: string,
    icon?: string,
    replace?: false,
} | {
    id: string,
    replace: true,
}
export default CustomScreenType;