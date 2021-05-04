import Size from "./Size"

/** Type for the LoadCallBack function */
type LoadCallBack = (id: string, prefSize:Size, minSize:Size, maxSize:Size) => void

export default LoadCallBack