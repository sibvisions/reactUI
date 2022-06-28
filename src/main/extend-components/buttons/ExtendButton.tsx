import React, { FC, MouseEventHandler } from "react";

interface ExtendableButton {
    onClick?: MouseEventHandler
}

const ExtendButton: FC<ExtendableButton> = () => {
    return (
        <>
        </>
    )
}
export default ExtendButton