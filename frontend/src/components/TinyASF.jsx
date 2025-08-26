import React from 'react'
import {TinyCurve} from "./HelperComponents";
import {tinyAsfBackground} from "./ASF/ASFHelperFunctions";

//This plot is shown in the Attribute Overview
//It shows a tiny version of the created ASF for a numerical attribute
class TinyASF extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            options: JSON.parse(JSON.stringify(this.props.options)),
            viewBoxWidth: 180,
            viewBoxHeight: 80,
            key: 0,
            points: [],
            controlPoints: [],
            svgElements: []
        };
    }

    componentWillMount() {
        let pointsTranformed, controlPointsTranformed;
        if (this.state.options.controlPoints.length === 0) {
            pointsTranformed = [].concat(this.state.options.points.map(element => this.transformToTiny(element)));
            controlPointsTranformed = [];
        } else {
            pointsTranformed = [].concat(this.state.options.points.map(element => this.transformToTiny(element)));
            controlPointsTranformed = [].concat(this.state.options.controlPoints.map(element => this.transformToTiny(element)));
        }

        this.setState({points: pointsTranformed, controlPoints: controlPointsTranformed}, () => {
        });
    }

    transformToTiny(point) {
        return {x: point.normalizedX * 180, y: point.y = (1 - point.normalizedY) * 80};
    }


    render() {
        if (this.state.options.radioButton === 'quantile'){
            return (
            <>
                <svg
                    key={this.state.key}
                    ref={node => (this.node = node)}
                    style={{
                        display: 'inline',
                        width: '180',
                        height: '80',
                        marginBottom: '10'
                    }}
                >
                </svg>
            </>)
        }
        let points = this.state.points;
        let controlPoints = this.state.controlPoints;

        //Make a deep copy of the ASF background
        let resultValue = [].concat(tinyAsfBackground);

        //Create the tiny ASF containing only the lines of the ASF
        let i;
        //Check if the function has control points
        //If not, the function is just a two point linear function
        if (controlPoints.length === 0) {
            for (i = 1; i < points.length; i++) {
                let startPoint = points[i - 1]
                let endPoint = points[i]

                const instructions = `
             M ${startPoint.x},${startPoint.y}
              ${endPoint.x},${endPoint.y}
           `;
                resultValue.push(<TinyCurve id={"curveFrom" + i - 1 + 'To' + i} instructions={instructions}/>)
            }

        }
        //If the function does have control points, it is either continuous or discontinuous
        else {
            //Check if the function is discontinuous and create the line segments accordingly
            if (this.state.options.radioButton === 'discontinuous') {
                for (i = 1; i < points.length; i = i + 2) {

                    let startPoint = points[i - 1]
                    let endPoint = points[i]
                    let controlPoint = controlPoints[(i - 1) / 2]

                    const instructions = `
             M ${startPoint.x},${startPoint.y}
             Q ${controlPoint.x},${controlPoint.y}
              ${endPoint.x},${endPoint.y}
           `;
                    resultValue.push(<TinyCurve id={"curveFrom" + i - 1 + 'To' + i} instructions={instructions}/>)
                }
            }
            //If the function is continuous, create the line segments accordingly
            else {
                for (i = 1; i < points.length; i++) {

                    let startPoint = points[i - 1]
                    let endPoint = points[i]
                    let controlPoint = controlPoints[i - 1]

                    const instructions = `
             M ${startPoint.x},${startPoint.y}
             Q ${controlPoint.x},${controlPoint.y}
              ${endPoint.x},${endPoint.y}
           `;
                    resultValue.push(<TinyCurve id={"curveFrom" + i - 1 + 'To' + i} instructions={instructions}/>)
                }
            }
        }

        return (
            <>
                <svg
                    key={this.state.key}
                    ref={node => (this.node = node)}
                    style={{
                        display: 'inline',
                        width: '180',
                        height: '80',
                        marginBottom: '5',
                        marginTop: '5',
                        marginLeft: '2',
                        marginRight: '2'
                    }}
                >
                    {resultValue.map((element) => (
                        (element)))}
                </svg>
            </>
        );
    }
}

export default TinyASF;
