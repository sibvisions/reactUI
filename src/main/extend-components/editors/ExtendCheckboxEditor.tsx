import React, { FC, SyntheticEvent } from "react";

export interface IExtendableCheckboxEditor {
    onClick?(e: SyntheticEvent|React.KeyboardEvent<HTMLSpanElement>): void
    onChange?(e: {
        value: string | number | boolean | undefined,
        selectedValue: string | number | boolean | undefined,
        deselectedValue: string | number | boolean | undefined
    }): void
}

const ExtendCheckboxEditor: FC<IExtendableCheckboxEditor> = () => {
    return (
        <>
        </>
    )
}
export default ExtendCheckboxEditor