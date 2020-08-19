import React from 'react';


const withRowSelection = (WrappedC, context) => {
    class RowSelectionWrapper extends React.Component {

        state= {}
        componentDidMount() {
            this.sub = this.context.contentStore.selectedDataRowChange.subscribe(x =>  this.setContent.bind(this)(x))
        }
    
        componentWillUnmount() {
            this.sub.unsubscribe();
        }
    
        setContent(content){
            if(content[this.props.columnName]){
                this.setState({selection: content});
            }
        }

        render() {
            return (
                <WrappedC  {...this.props} selection={this.state.selection}/>
            )
        }
    }
    RowSelectionWrapper.contextType = context;
    return RowSelectionWrapper
}
export default withRowSelection