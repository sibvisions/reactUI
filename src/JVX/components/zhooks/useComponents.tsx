import {ReactElement, useContext, useEffect, useState} from "react";
import {jvxContext} from "../../jvxProvider";
import {componentHandler} from "../../factories/UIFactory";
type ComponentSize = {
    id: string
    width: number,
    height: number
}


const useComponents = (id: string): [Array<ReactElement>, Map<string,ComponentSize>| undefined] => {

    let tempSizes = new Map<string, ComponentSize>();

    const buildComponents = (): Array<ReactElement> => {
        const children = context.contentStore.getChildren(id);
        const reactChildrenArray: Array<ReactElement> = [];
        const componentHasLoaded = (compId: string, height: number, width: number)=> {
            tempSizes.set(compId, {id: compId, width: width, height: height});
            if(tempSizes.size === components.length){
                setPreferredSizes(tempSizes);
            }

            //Set Preferred Sizes of changed Components
            if(preferredSizes && preferredSizes.has(compId)){
                const preferredComp = preferredSizes.get(compId);
                if(preferredComp && (preferredComp.height !== height || preferredComp.width !== width)){
                    preferredComp.height = height;
                    preferredComp.width = width;
                    setPreferredSizes(new Map(preferredSizes));
                }
            }
        }
        children.forEach(child => {
            child.onLoadCallback = componentHasLoaded;
            const reactChild = componentHandler(child);
            if(reactChild){
                reactChildrenArray.push(reactChild);
            }
        });
        return reactChildrenArray;
    }
    const context = useContext(jvxContext);
    const [components, setComponents] = useState<Array<ReactElement>>(buildComponents());
    const [preferredSizes, setPreferredSizes] = useState<Map<string, ComponentSize>>();


    useEffect(() => {
       context.contentStore.subscribeToParentChange(id, () => {
           const newComponents = buildComponents();

           const cl = new Array<ReactElement>();
           newComponents.forEach(nc => {
               let alreadyAdded = false
               components.forEach(oc => {
                   if(nc.props.id === oc.props.id){
                       alreadyAdded = true
                       cl.push(oc);
                   }
               });
               if(!alreadyAdded){
                   cl.push(nc);
               }
           });
           setComponents(cl);
       });

       return () => {
           context.contentStore.unsubscribeFromParentChange(id);
       }
    }, [context.contentStore, id, components]);



    return [components, preferredSizes];
}
export default useComponents;