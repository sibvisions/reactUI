/** Type for EditableMenuItem */
type EditableMenuItem = {
    screenName: string,
    newTitle?: string,
    newIcon?: string
    remove?: false
} | {
    screenName: string,
    remove: true
}
export default EditableMenuItem;