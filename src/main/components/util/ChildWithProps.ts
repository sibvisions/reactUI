/** Interface for rendered components with properties */
interface ChildWithProps {
    props: {
        id: string,
        constraints: string,
        isVisible?: boolean
        screen_modal_?:boolean
        screen_title_?:string
    }
}
export default ChildWithProps