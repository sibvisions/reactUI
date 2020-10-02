class ServerCommunicator {
    BaseUrl = "http://localhost:8080/JVx.mobile/services/mobile";
    applicationName = "";
    responseHandler = {};

    setResponseHandler(responseHandler){
        this.responseHandler = responseHandler;
    }
    
    sendRequest(endpoint, body, timeout=10000){
        const reqBody = {
            method: 'POST',
            body: JSON.stringify(body),
            credentials:"include"
        };
        let r = this.timeoutRequest(fetch(this.BaseUrl+endpoint, reqBody), timeout)
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

    startUp(username, password){
        const browserInfo = this.getBrowser()
        const reqBody = {
            layoutMode : "generic",
            appMode : "full",
            applicationName : this.applicationName,
            technology: "react",
            deviceMode: "desktop",

            userName: username,
            password: password,
            authKey: localStorage.getItem("authKey"),

            osName: browserInfo.name,
            osVersion: browserInfo.version,

            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,

            deviceType: "Browser",
            deviceTypeModel: navigator.userAgent,

            //readAheadLimit: 20
        };this.sendRequest("/api/startup", reqBody);
    }

    deviceStatus(screenHeight=600, screenWidth=800){
        const reqBody= {
            screenWidth: screenWidth,
            screenHeight: screenHeight,
            clientId: localStorage.getItem("clientId")
        }; this.sendRequest("/api/deviceStatus", reqBody);   
    }

    //---Action Requests------

    logIn(username, password){
        const reqBody = {
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
            },
            createAuthKey: true
        }; this.sendRequest("/api/login", reqBody);
    }

    logOut(){
        localStorage.removeItem("authKey")
        const reqBody = {
            "clientId": localStorage.getItem("clientId")
        }; this.sendRequest("/api/logout", reqBody);
    }

    pressButton(componentId){
        const reqBody = {
            clientId: localStorage.getItem("clientId"),
            componentId: componentId
        }; this.sendRequest("/api/v2/pressButton", reqBody);
    }

    setValue(componentId, value){
        const reqBody = {
            clientId: localStorage.getItem("clientId"),
            componentId: componentId,
            value: value
        }; this.sendRequest("/api/comp/setValue", reqBody);
    }

    setValues(componentId, dataProvider, columnName, values) {
        const reqBody = {
            clientId: localStorage.getItem("clientId"),
            componentId: componentId,
            dataProvider: dataProvider,
            columnNames: Array.isArray(columnName) ? columnName : [columnName],
            values: Array.isArray(values) ? values : [values]
        }; this.sendRequest("/api/dal/setValues", reqBody);
    }

    openScreen(componentId){
        const reqBody = {
            clientId: localStorage.getItem("clientId"),
            componentId: componentId,
        }; this.sendRequest("/api/v2/openScreen", reqBody);   
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
        };this.sendRequest("/api/dal/selectRecord", reqBody, timeout);
    }

    selectTab(componentId, index) {
        const reqBody = {
            clientId: localStorage.getItem("clientId"),
            componentId: componentId,
            index: index
        }; this.sendRequest("/api/comp/selectTab", reqBody);
    }

    closeTab(componentId, index) {
        const reqBody = {
            clientId: localStorage.getItem("clientId"),
            componentId: componentId,
            index: index
        }; this.sendRequest("/api/comp/closeTab", reqBody);
    }

    async upload(fileId, fileName, data) {
        this.getBase64(data, result => {
            const reqBody = {
                clientId: localStorage.getItem("clientId"),
                fileId: fileId,
                fileName: fileName,
                data: result.split(',')[1]
            }; this.sendRequest("/upload", reqBody);
        })
        // let formFields = {clientId: localStorage.getItem("clientId"), fileId: fileId, fileName: fileName}
        // let formData = new FormData()
        // formData.append("fields", JSON.stringify(formFields))
        // formData.append("data", data)
        // let r = await fetch(this.BaseUrl+"/upload", {method: 'POST', body: formData});
        // this.responseHandler.getResponse(r);
    }

    //---Fetch Requests------

    fetchDataFromProvider(dataProvider, from=0, rowCount, timeout=2000){
        const reqBody = {
            clientId: localStorage.getItem("clientId"),
            dataProvider: dataProvider, 
            fromRow: from,
            rowCount: rowCount
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

        // Reinfolge der Abfrage ist wichtig
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
        match = userAgent.match("(Safari)/([^ ]*)");
        if(match){
            return {name: "Safari", version: match[2]}
        }
        return {name: "unknown", Version: "unknown" }
    }

    getBase64(file, fn) {
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
          fn(reader.result);
        };
        reader.onerror = function (error) {
          console.log('Error: ', error);
        };
     }
}
 
export default ServerCommunicator;