import React, { createContext, FC } from "react";

/** Interface for the ResizeContext. Contains information for the Resizehandler to calculate the screen-sizes */
export interface IResizeContext {
    menuSize?:number,
    menuRef?: any,
    login?:boolean,
    menuCollapsed?:boolean,
    mobileStandard?:boolean,
    setMobileStandard?: Function
}

export const ResizeContext = createContext<IResizeContext>({});

const ResizeProvider: FC<IResizeContext> = (props) => {
    return (
        <ResizeContext.Provider value={{ login: props.login, menuRef: props.menuRef, menuSize: props.menuSize, menuCollapsed: props.menuCollapsed, mobileStandard: props.mobileStandard, setMobileStandard: props.setMobileStandard }}>
            {props.children}
        </ResizeContext.Provider>
    )
}
export default ResizeProvider