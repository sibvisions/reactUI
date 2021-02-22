/** React imports */
import {createContext, CSSProperties} from "react";

/** The context which contains style properties for children of a layout */
export const LayoutContext = createContext(new Map<string, CSSProperties>());