import React, { FC } from "react";

export interface IExtendableTextEditor {
    onBlur?(e:React.FocusEvent): void,
    onInput?(e: { originalEvent: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, value: string | null }):void
    onChange?(value:string|null|undefined):void
}

const ExtendTextEditor: FC<any> = () => {
    return (
        <>
        </>
    )
}
export default ExtendTextEditor