import React, { FC, SyntheticEvent } from "react";

export interface IExtendableToggleButton {
    onClick?(e: SyntheticEvent): void
    onChange?(selected: boolean|undefined): void
}

const ExtendToggleButton: FC<IExtendableToggleButton> = () => {
    return (
        <>
        </>
    )
}
export default ExtendToggleButton