import React, { FC, SyntheticEvent } from "react";

export interface IExtendableLinkedEditor {
    onBlur?(e:React.FocusEvent): void,
    onChange?(value: any): void,
    onFilter?(filterValue: string): void,
    onSelect?(e: { originalEvent: SyntheticEvent, value: any }): void,
    onLazyLoadFetch?(records: any[]):void
}

const ExtendLinkedEditor: FC<IExtendableLinkedEditor> = () => {
    return (
        <>
        </>
    )
}
export default ExtendLinkedEditor