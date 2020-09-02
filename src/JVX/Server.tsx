import {browserHistory} from "../App";
import ContentStore from "./ContentStore"

import ApplicationMetaData from "./response/ApplicationMetaDataResponse";
import BaseResponse from "./response/BaseResponse";
import MenuResponse from "./response/MenuResponse";
import GenericResponse from "./response/GenericResponse";

class Server{
    BASE_URL = "http://localhost:8080/JVx.mobile/services/mobile";
    constructor(store: ContentStore) {
        this.contentStore = store
    }
    contentStore: ContentStore;

    sendRequest(request: any, endpoint: string){
        let reqOpt: RequestInit = {
            method: 'POST',
            body: JSON.stringify(request),
            credentials:"include"
        };
        this.timeoutRequest(fetch(this.BASE_URL+endpoint, reqOpt), 2000)
            .then((response: any) => response.json())
            .then(this.responseHandler.bind(this))
            .catch(error => console.error(error));
    }

    timeoutRequest(promise: Promise<any>, ms: number){
        return new Promise((resolve, reject) => {
            let timeoutId= setTimeout(() => {
                reject(new Error("timeOut"))
            }, ms);
            promise
            .then(res => {
                    clearTimeout(timeoutId);
                    resolve(res);
                },
                err => {
                    clearTimeout(timeoutId);
                    reject(err);
                });
        });
    }

    responseMap = new Map<string, Function>()
        .set("applicationMetaData", this.applicationMetaData.bind(this))
        .set("userData", this.userData.bind(this))
        .set("menu", this.menu.bind(this))
        .set("screen.generic", this.generic.bind(this))
        .set("closeScreen", this.closeScreen.bind(this));

    responseHandler(responses: Array<BaseResponse>){
        responses.forEach((responseObject: BaseResponse) => {
            const mapper = this.responseMap.get(responseObject.name);
            if(mapper){
                mapper(responseObject);
            }
        });
    }

    applicationMetaData(metaData: ApplicationMetaData){
        sessionStorage.setItem("clientId", metaData.clientId);
    }

    userData(){
        browserHistory.push("/home/s")
    }

    menu(menuData: MenuResponse){
        this.contentStore.buildMenuBar(menuData);
    }

    generic(genericData: GenericResponse){
        this.contentStore.updateContent(genericData.changedComponents);

        if(!genericData.update){
            browserHistory.push("/home/"+genericData.componentId);
        }

    }

    closeScreen(closeScreenData: any){

    }
}
export default Server