

class ResponseHandler{

    constructor(uiBuilder){
        this.uiBuilder = uiBuilder;
    }

    responseMapper= 
    [
        {
            name:"applicationMetaData",
            methodToExecute: this.applicationMetaData
        },
        {
            name:"menu",
            methodToExecute: this.menu
        },
        {
            name: "userData",
            methodToExecute: this.userData
        },
        {
            name: "screen.generic",
            methodToExecute: this.generic
        }
    ]

    getResponse(requestPromise){
        requestPromise
            .then(response => response.json())
            .then(jResponse => this.handler(jResponse))
            .catch(error => console.log(error))
    }

    handler(responseArray){
        responseArray.forEach(res => {
            let toExecute = this.responseMapper.find(toExecute => toExecute.name === res.name)
            toExecute ? toExecute.methodToExecute(res, this) : toExecute = "yikes"
        });
    }

    applicationMetaData(metaData){
        localStorage.setItem("clientId", metaData.clientId);
    }

    menu(menuItems, thisRef){
        thisRef.uiBuilder.buildMenu(menuItems);
    }

    userData(userData, thisRef){
        thisRef.uiBuilder.routeFromActiveScreen("/main")
        thisRef.uiBuilder.loggedInUser(userData);
    }

    generic(screenData, thisRef){
        thisRef.uiBuilder.genericHandler(screenData)
    }
}

export default ResponseHandler