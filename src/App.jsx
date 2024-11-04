import './App.scss'
import FileView from "./FileView.jsx";
import React from "react";
import {library} from '@fortawesome/fontawesome-svg-core'
import {fab} from '@fortawesome/free-brands-svg-icons'
import {far} from '@fortawesome/free-regular-svg-icons'
import {fas} from '@fortawesome/free-solid-svg-icons'

library.add(fas, far, fab)

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
