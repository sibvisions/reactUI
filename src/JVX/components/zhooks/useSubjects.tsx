import BaseComponent from "../BaseComponent";
import {ReactElement, useContext} from "react";
import {jvxContext} from "../../jvxProvider";
import {componentHandler} from "../../factories/UIFactory";


const useSubjects = (id: string, onLoadCallback: Function): Array<ReactElement> => {
    const context = useContext(jvxContext)
    const children = context.contentStore.flatContent.filter((component) => component.parent === id)

    const buildSubjects = (subjcets: Array<BaseComponent>): Array<ReactElement> => {
        const elements = subjcets.map(value => {
            value.onLoadCallback = onLoadCallback;
            return componentHandler(value);
        });
        return elements;
    }

    return buildSubjects(children);
}
export default useSubjects