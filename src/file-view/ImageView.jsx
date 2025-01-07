import {Bullseye} from "@patternfly/react-core";
import {getUrl} from "../file.service.js";

export default function ImageView(props) {
    return <Bullseye>
        <img src={getUrl('/api/file/download?path=' + (props.path || ''))} />
    </Bullseye>;
}