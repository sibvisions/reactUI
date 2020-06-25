import React, { Component } from 'react';
import { setSuperParent, registerToContentChange, startUp } from '../handling/TowerV3';


class Test extends Component {
    state = { 
        content: []
    }

    currentContent= [];

    constructor(props){
        super(props)
        this.updateContent = this.updateContent.bind(this)
    }

    updateContent(toUpdate){
        if(Array.isArray(toUpdate)){ this.setState({content: toUpdate}); this.currentContent=toUpdate; console.log("Array Update")}
        else {
            console.log("Single Update")
            this.currentContent.push(toUpdate)
            this.setState({content: this.currentContent})
        }
    }
    
    componentDidMount(){
        setSuperParent(this);
        registerToContentChange(this.updateContent)
        if(localStorage.getItem("content") !== null) startUp();
    }

    render(){ 
        return ( 
            <div>
                {this.state.content}
            </div>
         );
    }
}
 
export default Test;