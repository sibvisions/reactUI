import {ReactElement, useContext, useMemo, useState} from "react";
import {jvxContext} from "../../jvxProvider";
import {componentHandler} from "../../factories/UIFactory";
export type size = {
    id: string
    width: number,
    height: number
}


const useChildren = (id: string): [Array<ReactElement>, Map<string,size>| undefined] => {
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

    const componentHasLoaded = (id: string, height: number, width:number)=> {
        tempSizes.set(id, {id: id, width: width, height: height});
        sizeCounter++;
        if(sizeCounter === reactChildren.length){
            setPreferredSizes(tempSizes);
        }
    }


    const [preferredSizes, setPreferredSizes] = useState<Map<string, size>| undefined>(undefined);
    const reactChildren = useMemo<Array<ReactElement>>(buildChildren, [id])

    let tempSizes = new Map<string, size>();
    let sizeCounter = 0;




    return [reactChildren, preferredSizes];
}
export default useChildren