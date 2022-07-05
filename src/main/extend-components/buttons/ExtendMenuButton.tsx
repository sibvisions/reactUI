import React, { FC, SyntheticEvent } from "react";

export interface IExtendableMenuButton {
    onDefaultBtnClick?(e: MouseEvent): void,
    onMenuBtnClick?(e: MouseEvent): void,
    onMenuItemClick?(e: { clickedItem: string|undefined, originalEvent: SyntheticEvent }): any
}

const ExtendMenuButton: FC<IExtendableMenuButton> = () => {
    return (
        <>
        </>
    )
}
export default ExtendMenuButton