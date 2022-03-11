/** React imports */
import { ReactElement, useCallback, useContext, useEffect, useRef, useState } from "react";

/** 3rd Party imports */
import _ from "underscore";

/** Other imports */
import { appContext } from "../../AppProvider";
import { componentHandler, createCustomComponentWrapper } from "../../factories/UIFactory";
import BaseComponent from "../BaseComponent";
import { Dimension } from "../util";

export type ComponentSizes = {
    preferredSize: Dimension,
    minimumSize: Dimension,
    maximumSize: Dimension
}

/**
 * A hook which returns the state of a parents rendered Childcomponents and their preferred size 
 * @param id - the id of the component
 * @returns a layouts rendered Childcomponents and their preferred size
 */
const useComponents = (id: string, className:string): [Array<ReactElement>, Map<string,ComponentSizes>| undefined] => {
    /** Current state of the preferredSizes of a parents Childcomponents */
    const [preferredSizes, setPreferredSizes] = useState<Map<string, ComponentSizes>>();

    const tempSizes = useRef<Map<string, ComponentSizes>>(new Map<string, ComponentSizes>())

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const componentsChildren = useRef<Map<string, Array<string>>>(new Map<string, Array<string>>());
    
    const compLoadedCache = useRef<Array<string>>(new Array<string>());
    
    /** Builds the Childcomponents of a parent and sets/updates their preferred size */
    const buildComponents = useCallback((): Array<ReactElement> => {
        //let tempSizes = new Map<string, ComponentSizes>();
        let componentsChanged = false
        const children = context.contentStore.getChildren(id, className);

        tempSizes.current.forEach((val, key) => {
            if (!children.has(key)) {
                tempSizes.current.delete(key)
                componentsChanged = true;
            }
        });

        if (componentsChanged) {
            setPreferredSizes(new Map(tempSizes.current));
        }
        
        const reactChildrenArray: Array<ReactElement> = [];
        /**
         * This function gets called when onLoadcallback of a component is called, if all components of a parents are loaded,
         * set the preferredSizes, if the components change update the current preferredSizes.
         * @param compId - the component id
         * @param newPref - the preferred size of the component
         * @param newMin - the minimum size of the component
         * @param newMax - the maximum size of the component
         */

        const sizesChanged = (compSizes:ComponentSizes|undefined, newPref:Dimension, newMin:Dimension, newMax:Dimension) => {
            if (compSizes) {
                if (_.isEqual(compSizes.preferredSize, newPref) && _.isEqual(compSizes.minimumSize, newMin) && _.isEqual(compSizes.maximumSize, newMax)) {
                    return false;
                }
            }
            return true;
        }

        const childrenChanged = (compId:string) => {
            const arraysEqual = (a:string[], b:string[]) => {
                let aClone = [...a];
                let bClone = [...b];
                if (aClone === bClone) return true;
                if (aClone === null || bClone === null) return false;
                if (aClone.length !== bClone.length) return false;
                
                aClone.sort();
                bClone.sort();
              
                for (var i = 0; i < aClone.length; ++i) {
                  if (aClone[i] !== bClone[i]) return false;
                }
                return true;
              }

            if (componentsChildren.current.has(compId)) {
                return !arraysEqual(componentsChildren.current.get(compId) as string[], Array.from(context.contentStore.getChildren(compId).keys()));
            }
            else {
                return true;
            }
        }

        const componentHasLoaded = (compId: string, prefSize:Dimension, minSize:Dimension, maxSize:Dimension) => {
            tempSizes.current.forEach((val, key) => {
                if (!children.has(key)) {
                    tempSizes.current.delete(key);
                }
            });
            const preferredComp = tempSizes.current.get(compId);
            tempSizes.current.set(compId, {preferredSize: prefSize, minimumSize: minSize, maximumSize: maxSize});
            
            /** If all components are loaded or it is a tabsetpanel and the size changed, set the sizes */
            if(context.contentStore.getComponentById(compId) && (tempSizes.current.size === children.size || id.includes('TP')) && (sizesChanged(preferredComp, prefSize, minSize, maxSize) || childrenChanged(compId))) {
                setPreferredSizes(new Map(tempSizes.current));
            }
                
            //Set Preferred Sizes of changed Components
            if(preferredSizes && preferredSizes.has(compId)){
                const preferredComp = preferredSizes.get(compId);
                if(preferredComp && (sizesChanged(preferredComp, prefSize, minSize, maxSize) || childrenChanged(compId))){
                    preferredComp.preferredSize = prefSize;
                    preferredComp.minimumSize = minSize;
                    preferredComp.maximumSize = maxSize
                    setPreferredSizes(new Map(preferredSizes));
                }
            }
            componentsChildren.current.set(compId, Array.from(context.contentStore.getChildren(compId).keys()));
        }

        /** If there are no children set an empty map */
        if(children.size === 0 && !preferredSizes) {
            setPreferredSizes(new Map<string, ComponentSizes>());
        }

        /** Create the reactchildren */
        children.forEach(child => {
            let reactChild;
            // if (!compLoadedCache.current.includes(child.name)) {
            //     child.onLoadCallback = componentHasLoaded;
            //     compLoadedCache.current.push(child.name)
            // }
            if (!context.contentStore.customComponents.has(child.name)) {
                //Hack: at first only when compLoadedChache hasn't had the childrens name it god added, now everytime a NON custom component
                //gets a componentHasLoaded. When not using this it could be that some components aren't shown...
                child.onLoadCallback = componentHasLoaded;
                reactChild = componentHandler(child, context.contentStore);
            }
            /** If it is a custom component, put the custom component in the CustomComponentWrapper */
            else {
                let customComp = context.contentStore.customComponents.get(child.name)?.apply(undefined, []);
                reactChild = createCustomComponentWrapper({...child, component: customComp, isGlobal: false});
            }
                
            if(reactChild){
                reactChildrenArray.push(reactChild);
            }
        });
        return reactChildrenArray;
        
    },[context.contentStore, id, preferredSizes, className, tempSizes.current]);
    
    /** Current state of a parents Childcomponents as reactchildren */
    const [components, setComponents] = useState<Array<ReactElement>>(buildComponents());

    /**
     * Subscribes the parent to childcomponent changes
     * @returns unsubscribes from childcomponent changes
     */
    useEffect(() => {
        context.subscriptions.subscribeToParentChange(id, () => {
            /** New Components when component changes */
            const newComponents = buildComponents();
            /** Contains the components */
            const cl = new Array<ReactElement>();
            newComponents.forEach(nc => {
                let alreadyAdded = false
                /** Checks if the new component is already added in the current components if yes add the old component else the new one */
                components.forEach(oc => {
                    if(nc.props.id === oc.props.id && !context.contentStore.customComponents.has(nc.props.name)){
                        alreadyAdded = true
                        cl.push(oc);
                    }
                });
                if(!alreadyAdded && !context.contentStore.removedCustomComponents.has(nc.props.name)) {
                    cl.push(nc);
                }
            });
            setComponents(cl);
        });

        return () => {
            context.subscriptions.unsubscribeFromParentChange(id);
        }
    }, [context.subscriptions, id, components, buildComponents, context.contentStore.customComponents]);

    return [components, preferredSizes];
}
export default useComponents;