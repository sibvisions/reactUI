import React, {FC, ReactElement, useCallback, useContext, useMemo} from "react";
import SplitPanel from "./SplitPanel";
import useChildren from "../../zhooks/useChildren";
import {connectableObservableDescriptor} from "rxjs/internal/observable/ConnectableObservable";
import {jvxContext} from "../../../jvxProvider";

export type UISplitPanelProps ={
    className: string,
    constraints: string,
    dividerAlignment: number,
    dividerPosition: number,
    id: string,
    indexOf: number,
    orientation: number,
    parent: string,
    isVisible: boolean
}

type childProps = {
    props: {
        constraints: string
        id: string
    }
}

const UISplitPanel: FC<UISplitPanelProps> = (props) => {

    const getChildByConstraint = (constraint: string): ReactElement | undefined => {
        return children.find(child => {
            const childWithProps = (child as childProps)
            return childWithProps.props.constraints === constraint;
        });
    }

    const [children] = useChildren(props.id);
    const firstChild = getChildByConstraint("FIRST_COMPONENT");
    const secondChild = getChildByConstraint("SECOND_COMPONENT");


    return(
        <SplitPanel
            leftComponent={firstChild}
            rightComponent={secondChild}
        />
    )
}
export default UISplitPanel