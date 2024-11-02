import './App.scss'
import FileView from "./FileView.jsx";
import React from "react";

// https://staging-v6.patternfly.org/

class App extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        document.body.oncontextmenu = (evt) => {
            evt.preventDefault();
        }
    }

    render() {
        return <>
            <FileView />
        </>
    }
}

export default App;
