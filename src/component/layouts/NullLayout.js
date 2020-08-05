import React, { Component } from 'react';

class NullLayout extends Component {

    state = {
        content: [this.props.subjects]
    }

    components = this.props.subjects

    componentDidMount() {
        this.fillContent(this.components)
    }

    fillContent(components) {
        let tempContent = [];
        components.forEach(component => {
            console.log(component)
            let element = 
            <div style={{
                position: "absolute",
                left: component.left,
                top: component.top}}>
                    {component.text}
            </div>
            tempContent.push(element)
        })
        this.setState({content: tempContent})
    }

    render() {
        return (
            <div className="nulllayout" style={{position: "relative", height: this.props.getPreferredSize(this.props.component), overflow: 'hidden'}}>
                {this.state.content}
            </div>
        )
    }
}
export default NullLayout