/** Type for EditableMenuItem */
type EditableMenuItem = {
    title: string,
    newTitle?: string,
    newIcon?: string
    remove?: false
} | {
    title: string,
    remove: true
}
export default EditableMenuItem;