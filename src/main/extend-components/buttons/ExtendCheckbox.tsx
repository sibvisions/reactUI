import React, { FC, SyntheticEvent } from "react";

export interface IExtendableSelectable {
    onClick?(e: SyntheticEvent): void
    onChange?(checked: boolean): void;
}

const ExtendCheckbox: FC<IExtendableSelectable> = () => {
    return (
        <>
        </>
    )
}
export default ExtendCheckbox