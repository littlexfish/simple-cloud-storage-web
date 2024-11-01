import React from "react";
import {Bullseye} from "@patternfly/react-core";
import {getUrl} from "../file.service.js";

export default class ImageView extends React.Component {
    render() {
        return (
            <Bullseye>
                <img src={getUrl('/api/file/download?path=' + (this.props.path || ''))} />
            </Bullseye>
        );
    }
}