import React, { FC } from "react";

export interface IExtendableSplitPanel {
    onResize?(e: MouseEvent): void
    onResizeEnd?(): void
}

const ExtendSplitPanel: FC<IExtendableSplitPanel> = () => {
    return (
        <>
        </>
    )
}
export default ExtendSplitPanel