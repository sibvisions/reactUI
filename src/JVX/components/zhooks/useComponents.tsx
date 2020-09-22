import {ReactElement, useContext, useMemo, useState} from "react";
import {jvxContext} from "../../jvxProvider";
import {componentHandler} from "../../factories/UIFactory";
type ComponentSize = {
    id: string
    width: number,
    height: number
}


const useComponents = (id: string): [Array<ReactElement>, Map<string,ComponentSize>| undefined] => {
    const context = useContext(jvxContext)


    const buildComponents = (): Array<ReactElement> => {
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
        if(sizeCounter === reactChildren.length && !preferredSizes){
            setPreferredSizes(tempSizes);
        }
    }

    const [preferredSizes, setPreferredSizes] = useState<Map<string, ComponentSize>| undefined>(undefined);
    const reactChildren = useMemo<Array<ReactElement>>(buildComponents, [id])

    let tempSizes = new Map<string, ComponentSize>();
    let sizeCounter = 0;

    return [reactChildren, preferredSizes];
}
export default useComponents;