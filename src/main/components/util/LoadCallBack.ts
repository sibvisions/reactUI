import { Dimension } from "."

/** Type for the LoadCallBack function */
type LoadCallBack = (id: string, prefSize:Dimension, minSize:Dimension, maxSize:Dimension) => void

export default LoadCallBack