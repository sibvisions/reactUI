import React, { FC } from "react";

export interface IExtendableButton {
    onClick?(e: MouseEvent): void
}

const ExtendButton: FC<IExtendableButton> = () => {
    return (
        <>
        </>
    )
}
export default ExtendButton