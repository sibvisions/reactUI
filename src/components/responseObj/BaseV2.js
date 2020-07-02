import { Component } from 'react';
import { registerContainer, handler, unRegisterContainer } from '../../handling/TowerV4';


class BaseV2 extends Component {

    state = {content: []}
    tempChanges = []
    constructor(props) {
        super(props); 
        this.addContent= this.addContent.bind(this);
        this.removeContent= this.removeContent.bind(this);
    }

    /**
     * Calls {registerContainer}
     * and calls {handler} with its child components if they are any
     */
    componentDidMount() {
        this.tempChanges.length=0
        registerContainer(this);
        if(this.props.children !== undefined){
            handler(this.props.children);
            this.commitChanges()
        }
    }

    /**
     * Adds (toAdd) to {tempChanges} array
     * @param {any} toAdd initalised react element
     */
    addContent(toAdd){
        this.tempChanges.push(toAdd);
    }

    /**
     * transfers all elements from {tempChanges} to 
     * {state.content}, calls {setState} with updated
     * content
     */
    commitChanges(){
        let con = [...this.state.content];
        this.tempChanges.forEach(e => {
            con.push(e)
        });
        this.tempChanges.length=0;
        this.setState({ content: con});
    }

    /**
     * Unregister Container to avoid duplication
     */
    componentWillUnmount(){
        unRegisterContainer(this);
    }

    /**
     * Removes element of {state.content} by its id
     * calls {setState} with updated content
     * @param {string} removeId componentId of 
     */
    removeContent(removeId){
        let con = [...this.state.content];
        let toDelete = con.find(e => e.props.componentid === removeId);
        let indexToDelete = con.indexOf(toDelete);

        con.splice(indexToDelete,1);
        this.setState({content: con})
    }

    updateContent(){
        console.log("hey")
    }

    
}
export default BaseV2;