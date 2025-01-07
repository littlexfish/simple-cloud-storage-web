import './App.scss'
import FileView from "./FileView.jsx";
import {library} from '@fortawesome/fontawesome-svg-core'
import {fab} from '@fortawesome/free-brands-svg-icons'
import {far} from '@fortawesome/free-regular-svg-icons'
import {fas} from '@fortawesome/free-solid-svg-icons'
import {useComponentDidMount} from "./helper.jsx";

library.add(fas, far, fab)

// https://staging-v6.patternfly.org/

function App() {
    useComponentDidMount(() => {
        document.body.oncontextmenu = (evt) => {
            evt.preventDefault();
        }
    })

    return <>
        <FileView />
    </>
}

export default App;
