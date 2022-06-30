import { TreeExpandedKeysType, TreeSelectionParams } from "primereact/tree";
import React, { FC } from "react";

export interface IExtendableTree {
    onTreeChange?(expandedKeys: TreeExpandedKeysType): void
    onRowSelect?(e: {originalEvent: TreeSelectionParams, selectedRow: any}): void

}

const ExtendTree: FC<IExtendableTree> = () => {
    return (
        <>
        </>
    )
}
export default ExtendTree