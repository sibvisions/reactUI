import React, { FC, SyntheticEvent } from "react";

export interface IExtendableTextEditor {
    onBlur?(e:React.FocusEvent): void,
    onInput?(e: { originalEvent: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, value: string | null }):void
    onChange?(value:number|null|undefined):void
}

const ExtendTextEditor: FC<any> = () => {
    return (
        <>
        </>
    )
}
export default ExtendTextEditor