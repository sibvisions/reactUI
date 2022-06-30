import React, { FC, SyntheticEvent } from "react";

export interface IExtendableImageEditor {
    onClick?(e: SyntheticEvent): void
    onChange?(): void
}

const ExtendImageEditor: FC<IExtendableImageEditor> = () => {
    return (
        <>
        </>
    )
}
export default ExtendImageEditor