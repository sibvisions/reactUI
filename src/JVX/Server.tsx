import {ApplicationMetaData} from "../../../angularUI/src/app/jvx-angular/responses/ApplicationMetaData";
import {browserHistory} from "../App";
import ContentStore from "./ContentStore"

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

    responseMapper: Array<{name: string, method: Function}> =
    [
        {
            name: "applicationMetaData",
            method: this.applicationMetaData.bind(this)
        },
        {
            name: "userData",
            method: this.userData.bind(this)
        },
        {
            name: "menu",
            method: this.menu.bind(this)
        },
        {
            name: "screen.generic",
            method: this.generic.bind(this)
        }
    ]

    responseHandler(responses: Array<BaseResponse>){
        responses.forEach((responseObject: BaseResponse) => {
            const mapper =  this.responseMapper.find(mapper => mapper.name === responseObject.name);
            if(mapper){
                mapper.method(responseObject);
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


}
export default Server