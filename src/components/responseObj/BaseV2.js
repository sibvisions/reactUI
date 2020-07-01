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

    componentDidMount() {
        this.tempChanges.length=0
        registerContainer(this);
        if(this.props.children !== undefined){
            handler(this.props.children);
            this.commitChanges()
        }
    }

    addContent(toAdd){
        this.tempChanges.push(toAdd);
    }

    commitChanges(){
        let con = [...this.state.content];
        this.tempChanges.forEach(e => {
            con.push(e)
        });
        this.tempChanges.length=0;
        this.setState({ content: con});
    }

    componentWillUnmount(){
        unRegisterContainer(this);
    }

    removeContent(removeId){
        let con = [...this.state.content];
        let toDelete = con.find(e => e.props.name === removeId);
        let indexToDelete = con.indexOf(toDelete);

        con.splice(indexToDelete,1);
        this.setState({content: con})
    }

    updateContent(){
        console.log("hey")
    }

    
}
export default BaseV2;