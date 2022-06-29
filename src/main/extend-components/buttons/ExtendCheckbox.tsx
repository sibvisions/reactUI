import React, { FC } from "react";

export interface IExtendableSelectable {
    onChange?(checked:boolean, originalEvent: React.SyntheticEvent): void;
}

const ExtendCheckbox: FC<IExtendableSelectable> = () => {
    return (
        <>
        </>
    )
}
export default ExtendCheckbox