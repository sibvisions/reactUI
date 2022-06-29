import React, { FC, SyntheticEvent } from "react";

export interface IExtendableNumberEditor {
    onBlur?(e:React.FocusEvent): void,
    onInput?(e: { originalEvent: SyntheticEvent, value: number | null }):void
    onChange?(value:number|null|undefined):void
}

const ExtendNumberEditor: FC<IExtendableNumberEditor> = () => {
    return (
        <>
        </>
    )
}
export default ExtendNumberEditor