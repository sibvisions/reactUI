import React, { FC, SyntheticEvent } from "react";

export interface IExtendablePopup {
    onDragStart?(e: React.DragEvent): void
    onDrag?(e: React.DragEvent): void
    onDragEnd?(e: React.DragEvent): void
    onClose?(): void
}

const ExtendPopupWrapper: FC<IExtendablePopup> = () => {
    return (
        <>
        </>
    )
}
export default ExtendPopupWrapper