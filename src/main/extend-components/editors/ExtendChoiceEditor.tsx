import React, { FC, SyntheticEvent } from "react";

export interface IExtendableChoiceEditor {
    onClick?(e: SyntheticEvent|React.KeyboardEvent<HTMLSpanElement>): void,
    onChange?(e: {
        value: any,
        allowedValues: any[]
    }): void
}

const ExtendChoiceEditor: FC<IExtendableChoiceEditor> = () => {
    return (
        <>
        </>
    )
}
export default ExtendChoiceEditor