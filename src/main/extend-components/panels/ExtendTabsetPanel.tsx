import React, { FC } from "react";

export interface IExtendableTabsetPanel {
    onTabChange?(selectedIndex: number): void
    onTabClose?(closedIndex: number): void
}

const ExtendTabsetPanel: FC<IExtendableTabsetPanel> = () => {
    return (
        <>
        </>
    )
}
export default ExtendTabsetPanel