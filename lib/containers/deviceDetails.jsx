
import React from 'react';
//import PropTypes from 'prop-types';


import { bindActionCreators, getState } from 'redux';
import { connect } from 'react-redux';
import { logger } from 'nrfconnect/core';
import { Panel, Form, FormGroup, ControlLabel, FormControl, InputGroup, Checkbox } from 'react-bootstrap';

import * as DeviceDetailsActions from '../actions/deviceDetailsActions';
import * as AdapterActions from '../actions/adapterActions';

import { traverseItems, findSelectedItem } from './../common/treeViewKeyNavigation';
import { getInstanceIds } from '../utils/api';

const NOTIFY = 1;
const INDICATE = 2;
let buttonClicked = 0;
const CCCD_UUID = "2902"

export class DeviceDetailsContainer extends React.PureComponent {

    constructor(props) {
        super(props)
        this.buttonClicked = this.buttonClicked.bind(this)
        this.writeDescriptorButtonClicked = this.writeDescriptorButtonClicked.bind(this)
        this.onToggleNotify = this.onToggleNotify.bind(this)
        this.findCccdDescriptor = this.findCccdDescriptor.bind(this)
        this.isNotifying = this.isNotifying.bind(this)
        this.asyncFunction = this.asyncFunction.bind(this)
        this.toggleMotionCheckboxChange = this.toggleMotionCheckboxChange.bind(this)
        this.toggleWeatherCheckboxChange = this.toggleWeatherCheckboxChange.bind(this)

        this.state = {
            weatherIsChecked: false,
            motionIsChecked: false

        };
    }

    static contextTypes = {
        store: React.PropTypes.object
    }

    findCccdDescriptor(children) {
        if (!children) {
            return undefined;
        }

        return children.find(child => child.uuid === CCCD_UUID);
    }

    isNotifying(cccdDescriptor) {
        if (!cccdDescriptor) {
            return false;
        }

        const valueArray = cccdDescriptor.value.toArray();

        if (valueArray.length < 2) {
            return false;
        }

        return ((valueArray[0] & (NOTIFY | INDICATE)) > 0);
    }

    onToggleNotify(characteristic) {
        const cccdDescriptor = this.findCccdDescriptor(characteristic.get("children")) //fiks hardkoding
        const isDescriptorNotifying = this.isNotifying(cccdDescriptor);
        const hasNotifyProperty = characteristic.properties.notify//this.props.item.properties.notify;
        const hasIndicateProperty = characteristic.properties.indicate//this.props.item.properties.indicate;

        if (cccdDescriptor === undefined) {
            return;
        }

        if (!hasNotifyProperty && !hasIndicateProperty) {
            return;
        }

        let cccdValue;
        logger.error(cccdDescriptor.value);
        if (!isDescriptorNotifying) {
            if (hasNotifyProperty) {
                cccdValue = NOTIFY;
            } else {
                cccdValue = INDICATE;
            }
        } else {
            cccdValue = 0;
        }

        const value = [cccdValue, 0];
        //this.props.onWriteDescriptor(this.cccdDescriptor, value);
        this.context.store.dispatch(DeviceDetailsActions.writeDescriptor(cccdDescriptor, value))

    }

    writeDescriptorButtonClicked() {
        let state = this.context.store.getState()
        const deviceDetails = state.app.adapter.getIn(['adapters', state.app.adapter.selectedAdapterIndex, 'deviceDetails']);
        console.log("selectedAdapterIndex: ", state.app.adapter.selectedAdapterIndex)
        let thingy = deviceDetails.devices.get("F0:F0:E3:01:21:52.0");
        const sensorServices = thingy.get("children")


        /*
        sensorServices.forEach(service => {

            //console.log("service: ",service)
            
            //console.log("service")
            console.log(service.get("children"))
            if (service.get("children")){
                let subServices = service.get("children")
                subServices.forEach(subService => {
                    console.log("subservice: ", JSON.stringify(subService,null,2))              
                    if (subService.get("children")) {
                        let subSubServices = subService.get("children")
                        subSubServices.forEach(subSubService => {
                            console.log(JSON.stringify(subSubService,null,2))
                        })
                    }
                })
            }
        })
        */

        console.log("sensorServices:",JSON.stringify(thingy.get("children"), null, 2))
        /*
        let state = this.context.store.getState()
        console.log("App state: ",JSON.stringify(state.app,null,2))
        const deviceDetails = state.app.adapter.getIn(['adapters', state.app.adapter.selectedAdapterIndex, 'deviceDetails']);
        let deviceDetail = deviceDetails.devices.get("F0:F0:E3:01:21:52.0.0");
        */
        //const children = thingy.get("children")
        const weather = sensorServices.get("F0:F0:E3:01:21:52.0.5")
        console.log("Weather children:", JSON.stringify(weather, null, 2) )
        this.onToggleNotify(weather.get("children").get("F0:F0:E3:01:21:52.0.5.6"))
    }

    asyncFunction(item, callback) {
        setTimeout(() => {
            this.context.store.dispatch(DeviceDetailsActions.setAttributeExpanded(item, !item.expanded));
            callback();
        }, 2000)
    }

    buttonClicked() {
        if (buttonClicked === 0) {

        }
        let state = this.context.store.getState()
        const deviceDetails = state.app.adapter.getIn(['adapters', state.app.adapter.selectedAdapterIndex, 'deviceDetails']);
        let thingy = deviceDetails.devices.get("F0:F0:E3:01:21:52.0");
        //let thingy = deviceDetails.devices.forEach(device => {
        //    console.log("device: ", JSON.stringify(device.get("children"),null,2))
        //})

        const sensorServices = thingy.get("children")
        console.log("sensorservices: ", JSON.stringify(sensorServices, null, 2))
        //const weather = sensorServices.get("F8:1B:03:0B:46:5D.0.5")
        //const weather = sensorServices.get("children")

        let requests = sensorServices.map(service => {
            return new Promise(resolve => {

                this.asyncFunction(service, resolve);
                console.log("promise!")
            })
        })


        Promise.all(requests).then(() => console.log("sensorServices: ", JSON.stringify(sensorServices, null, 2)))

        //this.context.store.dispatch(DeviceDetailsActions.setAttributeExpanded(weather, !weather.expanded))
        //console.log("weather2: ",JSON.stringify(sensorServices,null,2))

    }

    toggleWeatherCheckboxChange() {
        if (!this.state.weatherIsChecked) {

            let state = this.context.store.getState()
            const deviceDetails = state.app.adapter.getIn(['adapters', state.app.adapter.selectedAdapterIndex, 'deviceDetails']);
            
            
           
            const deviceKey = state.app.adapter.connectedDevice + ".0"
            console.log("cennectedDevice: ", deviceKey)


            let thingy = deviceDetails.devices.get(deviceKey);
            const sensorServices = thingy.get("children")
            console.log(deviceKey + ".5")
            console.log("device details: ",JSON.stringify(deviceDetails, null, 2));
            const weather = sensorServices.get(deviceKey + ".5")
            this.context.store.dispatch(DeviceDetailsActions.setAttributeExpanded(weather, !weather.expanded));

            console.log("weather expanded = ",!weather.expanded)
            this.setState({ weatherIsChecked: true })
        }
        else {
            this.setState({ weatherIsChecked: false })
        }
    }

    toggleMotionCheckboxChange() {
        if (!this.state.motionIsChecked) {

            let state = this.context.store.getState()
            const deviceDetails = state.app.adapter.getIn(['adapters', state.app.adapter.selectedAdapterIndex, 'deviceDetails']);
            let thingy = deviceDetails.devices.get("F0:F0:E3:01:21:52.0");
            const sensorServices = thingy.get("children")
            const motion = sensorServices.get("F0:F0:E3:01:21:52.0.6")
            this.context.store.dispatch(DeviceDetailsActions.setAttributeExpanded(motion, !motion.expanded));

            console.log("motion expanded = ",!motion.expanded)
            this.setState({ motioIsChecked: true })
        }
        else {
            this.setState({ motionIsChecked: false })
        }
    }





    render() {

        // Styles
        const settingsPanelStyle = {
            width: "40%",
            background: "white",
        }
        const statusContainerStyle = {
        }
        const statusStyle = {
            //borderRight: "1px solid lightgrey"
        }
        const nextPublishStyle = {

        }

        return (
            <Panel style={settingsPanelStyle}>
                <h3><b> Settings </b></h3>
                <hr/>
                <div className="container-fluid">
                    <div className="row" style={statusContainerStyle}>
                        <div className="col-md-6 col-md-auto" style={statusStyle}>
                            <b>Status</b><br />
                            Not publishing
                        </div>
                        <div className="col-md-6 col-md-auto" style={nextPublishStyle}>
                            <b>Next Publish</b><br />
                            Never
                        </div>
                    </div>
                </div>
                <hr/>
                <Form>
                    
                </Form>
                <hr/>
                <button
                    title="Clear list (Alt+C)"
                    type="button"
                    className="btn btn-primary btn-lg btn-nordic padded-row"
                >Start publishing</button>
                <hr/>

                <div><button onClick={this.buttonClicked}>expand attributes</button></div>
                <div><button onClick={this.writeDescriptorButtonClicked}>write descriptor</button></div>
                <div>
                    <input
                        type="checkbox"
                        checked={this.state.WeatherIsChecked}
                        onChange={this.toggleWeatherCheckboxChange}
                    /> Weather
                    <input
                        type="checkbox"
                        checked={this.state.MotionIsChecked}
                        onChange={this.toggleMotionCheckboxChange}
                    /> Motion
                </div>
            </Panel>

        );
    }

}

/*

                    <FormGroup>
                        <ControlLabel>How often should the data be published?</ControlLabel>
                        <InputGroup class="input-group-lg">
                            <InputGroup.Addon>Every</InputGroup.Addon>
                            <FormControl type="text" value="10" />
                            <InputGroup.Addon>minutes</InputGroup.Addon>
                        </InputGroup>
                    </FormGroup>
                    <hr/>

<FormGroup>
                        <ControlLabel>Select what sensor data should be published</ControlLabel>
                        <Checkbox checked >Temperature</Checkbox>
                        <Checkbox checked >Pressure</Checkbox>
                        <Checkbox checked readOnly>Humidity</Checkbox>
                        <Checkbox checked readOnly>CO2</Checkbox>
                        <Checkbox checked readOnly>VOC</Checkbox>
                    </FormGroup>

*/




/*
const details = ({deviceDetails}) => {
    return (
        <div>
            {deviceDetails}
        </div>)
    }


function mapStateToProps(state) {
    console.log("mapStateToprops")
    const {
        adapter,
    } = state.app;

    const selectedAdapter = adapter.getIn(['adapters', adapter.selectedAdapterIndex]);

    if (!selectedAdapter) {
        return {};
    }

    return {
        deviceDetails: selectedAdapter.deviceDetails
    };
}


export default connect(
    mapStateToProps,
)(details)


*/

