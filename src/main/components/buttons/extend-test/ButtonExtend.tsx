import React, { FC, MouseEventHandler } from "react";

interface ExtendableComponent {
    onClick?: MouseEventHandler
}

const ButtonExtend: FC<ExtendableComponent> = (props) => {
    return (
        <>
        </>
    )
}
export default ButtonExtend