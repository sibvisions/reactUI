import {ReactElement, useContext, useMemo, useState} from "react";
import {jvxContext} from "../../jvxProvider";
import {componentHandler} from "../../factories/UIFactory";
import ChildWithProps from "../util/ChildWithProps";
type ComponentSize = {
    id: string
    width: number,
    height: number
}


const useChildren = (id: string): [Array<ReactElement>, Map<string,ComponentSize>| undefined] => {
    const context = useContext(jvxContext)

    const buildChildren = (): Array<ReactElement> => {
        const children = context.contentStore.getChildren(id);
        const reactChildrenArray: Array<ReactElement> = []
        children.forEach(child => {
            child.onLoadCallback = componentHasLoaded;
            const reactChild = componentHandler(child);
            if(reactChild){
                reactChildrenArray.push(reactChild);
            }
        });
        return reactChildrenArray;
    }

    const componentHasLoaded = (compId: string, height: number, width:number)=> {
        tempSizes.set(compId, {id: compId, width: width, height: height});
        sizeCounter++;
        //
        // const missing = reactChildren.filter(child => {
        //     const cwp = (child as ChildWithProps);
        //     return !tempSizes.has(cwp.props.id);
        // });
        // console.log(missing, id)
        if(sizeCounter === reactChildren.length && !preferredSizes){
            setPreferredSizes(tempSizes);
        }
    }


    const [preferredSizes, setPreferredSizes] = useState<Map<string, ComponentSize>| undefined>(undefined);
    const reactChildren = useMemo<Array<ReactElement>>(buildChildren, [id])

    let tempSizes = new Map<string, ComponentSize>();
    let sizeCounter = 0;




    return [reactChildren, preferredSizes];
}
export default useChildren