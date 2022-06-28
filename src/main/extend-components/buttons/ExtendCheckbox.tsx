import React, { FC, SyntheticEvent } from "react";

interface ExtendableCheckbox {
    onChange?: (selected:boolean, originalEvent: SyntheticEvent) => void;
}

const ExtendCheckbox: FC<ExtendableCheckbox> = () => {
    return (
        <>
        </>
    )
}
export default ExtendCheckbox