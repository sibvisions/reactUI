import {browserHistory} from "../App";
import ContentStore from "./ContentStore"

import ApplicationMetaData from "./response/ApplicationMetaDataResponse";
import BaseResponse from "./response/BaseResponse";
import MenuResponse from "./response/MenuResponse";
import GenericResponse from "./response/GenericResponse";
import CloseScreenResponse from "./response/CloseScreenResponse";
import RESPONSE_NAMES from "./response/RESPONSE_NAMES";
import AuthenticationDataResponse from "./response/AuthenticationDataResponse";
import UserDataResponse from "./response/UserDataResponse";
import FetchResponse from "./response/FetchResponse";
import MetaDataResponse from "./response/MetaDataResponse";

class Server{
    constructor(store: ContentStore) {
        this.contentStore = store
    }

    BASE_URL = "http://localhost:8080/JVx.mobile/services/mobile";
    contentStore: ContentStore;
    activeScreen = "";

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
        .set(RESPONSE_NAMES.APPLICATION_META_DATA, this.applicationMetaData.bind(this))
        .set(RESPONSE_NAMES.USER_DATA, this.userData.bind(this))
        .set(RESPONSE_NAMES.MENU, this.menu.bind(this))
        .set(RESPONSE_NAMES.SCREEN_GENERIC, this.generic.bind(this))
        .set(RESPONSE_NAMES.CLOSE_SCREEN, this.closeScreen.bind(this))
        .set(RESPONSE_NAMES.AUTHENTICATION_DATA, this.authenticationData.bind(this))
        .set(RESPONSE_NAMES.DAL_FETCH, this.processFetch.bind(this))
        .set(RESPONSE_NAMES.DAL_META_DATA, this.processMetaData.bind(this));


    responseHandler(responses: Array<BaseResponse>){
        responses.forEach((responseObject: BaseResponse) => {
            const mapper = this.responseMap.get(responseObject.name);
            if(mapper){
                mapper(responseObject);
            }
        });

        this.routingDecider(responses);
    }

    //Application MetaData
    applicationMetaData(metaData: ApplicationMetaData){
        sessionStorage.setItem("clientId", metaData.clientId);
    }

    userData(userData: UserDataResponse){
        this.contentStore.currentUser = userData;
    }

    authenticationData(authData: AuthenticationDataResponse){
        localStorage.setItem("authKey", authData.authKey);
    }



    //Content Responses
    generic(genericData: GenericResponse){
        this.contentStore.updateContent(genericData.changedComponents);
    }

    closeScreen(closeScreenData: CloseScreenResponse){
        this.contentStore.closeScreen(closeScreenData.componentId);
    }

    menu(menuData: MenuResponse){
        this.contentStore.buildMenuBar(menuData);
    }

    //Dal
    processFetch(fetchData: FetchResponse){
        const builtData = fetchData.records.map(record => {
            const data : any = {}
            fetchData.columnNames.forEach((columnName, index) => {
                data[columnName] = record[index];
            });
            return data;
        });
        this.contentStore.updateDataProvider(fetchData.dataProvider, builtData, fetchData.to, fetchData.from);
    }

    processMetaData(metaData: MetaDataResponse){
        this.contentStore.dataProviderMetaMap.set(metaData.dataProvider, metaData);
    }


    //Decides if and where to the user should be routed based on all responses
    routingDecider(responses: Array<BaseResponse>){
        let routeTo: string | undefined;
        let highestPriority = 0;

        responses.forEach(response => {
           if(response.name === RESPONSE_NAMES.USER_DATA){
               if(highestPriority < 1){
                   highestPriority = 1;
                   routeTo="home";
               }
           }
           else if(response.name === RESPONSE_NAMES.SCREEN_GENERIC){
                const GResponse = (response as GenericResponse);
                if(!GResponse.update){
                    if(highestPriority < 2){
                        highestPriority = 2;
                        routeTo = "home/"+GResponse.componentId;
                    }
                }
           }
           else if(response.name === RESPONSE_NAMES.CLOSE_SCREEN){
               if(highestPriority < 1){
                   highestPriority = 1;
                   routeTo = "home";
               }
           }
           else if(response.name === RESPONSE_NAMES.LOGIN){
               if(highestPriority < 1){
                   highestPriority = 1;
                   routeTo = "login"
               }
           }
        });


        if(routeTo){
            browserHistory.push("/"+routeTo);
        }
    }
}
export default Server