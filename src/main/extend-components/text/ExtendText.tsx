import React, { FC } from "react";

export interface IExtendableText {
    onBlur?(e:React.FocusEvent): void,
    onChange?(e: { originalEvent: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, value: string | null }):void
}

const ExtendText: FC<IExtendableText> = () => {
    return (
        <>
        </>
    )
}
export default ExtendText