import { ButtonFactory } from "./ButtonFactory";
let registeredObjFactories = {};
registeredObjFactories['button'] = ButtonFactory

export class ObjFactory {
    constructor(type, props) {
        return new registeredObjFactories[type](props);
    }
};