class ServerCommunicator {
    BaseUrl = "http://localhost:8080/JVx.mobile/services/mobile";
    responseHandler = {};

    setResponseHandler(responseHandler){
        this.responseHandler = responseHandler;
    }
    
    sendRequest(endpoint, body, timeout=2000){
        let reqOpt = {
            method: 'POST',
            body: JSON.stringify(body),
            credentials:"include"
        };
        let r = this.timeoutRequest(fetch(this.BaseUrl+endpoint, reqOpt), timeout)
        this.responseHandler.getResponse(r);
    }

    timeoutRequest(promise, ms){
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


    //---Automatic Requests------

    startUp(screenHeight=600, screenWidth=800){
        const browserInfo = this.getBrowser()

        let info = {
            layoutMode : "generic",
            appMode : "full",
            applicationName : "demo",
            technology: "react",

            osName: browserInfo.name,
            osVersion: browserInfo.version,

            screenWidth: screenWidth,
            screenHeight: screenHeight,

            deviceType: "Browser",
            deviceTypeModel: navigator.userAgent,

            readAheadLimit: 100
        }; this.sendRequest("/api/startup", info);
    }

    deviceStatus(screenHeight=600, screenWidth=800){
        let reqOpt= {
            screenWidth: screenWidth,
            screenHeight: screenHeight,
            clientId: localStorage.getItem("clientId")
        }; this.sendRequest("/api/deviceStatus", reqOpt);   
    }

    //---Action Requests------

    logIn(username, password){
        let info = {
            clientId: localStorage.getItem("clientId"),
            loginData: {
              userName: {
                componentId: "UserName",
                text: username
              },
              password: {
                componentId: "Password",
                text: password
              },
              action : {
                componentId: "OK",
                label: "Anmelden"
              }
            }
        }; this.sendRequest("/api/login",info);
    }

    logOut(){
        let info = {
            "clientId": localStorage.getItem("clientId")
        }; this.sendRequest("/api/logout", info);
    }

    pressButton(componentId){
        let body = {
            clientId: localStorage.getItem("clientId"),
            componentId: componentId
        }; this.sendRequest("/api/v2/pressButton", body);
    }

    openScreen(componentId){
        let reqOpt = {
            clientId: localStorage.getItem("clientId"),
            componentId: componentId,
        }; this.sendRequest("/api/v2/openScreen", reqOpt);   
    }

    selectRow(componentId, dataProvider, selected , timeout){
        const reqBody = {
            clientId: localStorage.getItem("clientId"),
            componentId: componentId,
            dataProvider: dataProvider,
            filter: {
                columnNames: ["ID"],
                values: [selected["ID"].toString(10)]
            }
        }; console.log(reqBody) ;this.sendRequest("/api/dal/selectRecord", reqBody, timeout)
    }

    //---Fetch Requests------

    fetchDataFromProvider(dataProvider, timeout=2000){
        const reqBody = {
            clientId: localStorage.getItem("clientId"),
            dataProvider: dataProvider, 
        }; this.sendRequest("/api/dal/fetch" , reqBody, timeout);
    }

    fetchFilterdData(dataProvider, filterString="", editorComponentId, timeout=2000){
        const reqBody = {
            clientId: localStorage.getItem("clientId"),
            dataProvider: dataProvider,
            editorComponentId: editorComponentId,
            value: filterString
        }; this.sendRequest("/api/dal/filter", reqBody, timeout)
    }

    // helper

    getBrowser(){
        const userAgent = navigator.userAgent;
        let match;

        match = userAgent.match("(Safari)/([^ ]*)");
        if(match){
            return {name: "Safari", version: match[2]}
        }
        match = userAgent.match("(Edg)/([^ ]*)");
        if(match){
            return {name: "Edge", version: match[2]};
        }
        match = userAgent.match("(Chrome)/([^ ]*)");
        if(match){
            return {name: "Chrome", version: match[2]};
        }
        match = userAgent.match("(Firefox)/([^ ]*)");
        if(match){
            return {name: "Firefox", version: match[2]};
        }
        return {name: "unknown", Version: "unknown" }
    }
}
 
export default ServerCommunicator;