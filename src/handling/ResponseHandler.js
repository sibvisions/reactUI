

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
            toExecute ? toExecute.methodToExecute(res, this) : console.log("no mapping found")
        });
    }

    applicationMetaData(metaData){
        localStorage.setItem("clientId", metaData.clientId);
    }

    menu(menuItems, thisRef){
        thisRef.uiBuilder.buildMenu(menuItems);
    }

    userData(userData, thisRef){
        thisRef.uiBuilder.loggedInUser(userData);
    }
}

export default ResponseHandler