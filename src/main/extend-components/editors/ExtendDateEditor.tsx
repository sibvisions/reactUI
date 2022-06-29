import React, { FC, SyntheticEvent } from "react";

export interface IExtendableDateEditor {
    onBlur?(e:React.FocusEvent): void,
    onInput?(e:KeyboardEvent): void,
    onChange?(value: Date | undefined): void
}

const ExtendDateEditor: FC<IExtendableDateEditor> = () => {
    return (
        <>
        </>
    )
}
export default ExtendDateEditor