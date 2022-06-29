import React, { FC } from "react";

export interface IExtendableIcon {
    onChange?(url: string|undefined): void
}

const ExtendIcon: FC<IExtendableIcon> = () => {
    return (
        <>
        </>
    )
}
export default ExtendIcon