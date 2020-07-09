

class ServerCommunicator {
    constructor(responseHandler) {
        this.responseHandler = responseHandler;
    }
    BaseUrl = "http://localhost:8080/JVx.mobile/services/mobile";
    sendRequest(endpoint, body){
        let reqOpt = {
            method: 'POST',
            body: JSON.stringify(body),
            credentials:"include"
        };
        this.responseHandler.getResponse(fetch(this.BaseUrl+endpoint, reqOpt));
    }

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

    startUp(){
        let info = {
            "layoutMode" : "generic",
            "appMode" : "full",
            "applicationName" : "demo"
          }; this.sendRequest("/api/startup", info, this);
    }




}
 
export default ServerCommunicator;