import React from 'react'
import {ConnectingLine, Curve, HoverText, LargeHandle, SmallHandle} from "../HelperComponents";
import {
    asfBackgroundWithControlPoint,
    checkMaxYControlPointPosition,
    checkViewBoxBoundariesX,
    checkViewBoxBoundariesY,
    invertValues,
    middle,
    numberOfBins,
    viewBoxHeightWithControlPoint,
    viewBoxWidth,
    xEnd,
    xStart,
    yEndWithControl,
    yMediumEndWithControl,
    yMediumStartWithControl,
    yStartWithControl
} from "./ASFHelperFunctions";

// noinspection JSSuspiciousNameCombination
class TwoPointNonLinear extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            points: [],
            controlPoints: [],
            draggingPointId: null,
            controlPointDragged: false,
            key: 0
        };

        this.invertValues = this.invertValues.bind(this);
    }

    /**
     * Life-cycle method that initializes all axes and points in the ASF and sets them as state
     */
    componentWillMount() {
        let points;
        let controlPoints;

        //Check if some points were initialized from the options
        //If this is not the case, the points are initialized
        if (this.props.points.length === 0) {
            points = [
                {
                    x: xStart,
                    y: yMediumStartWithControl,
                    id: 'sp',
                    isControlPoint: false,
                    normalizedX: 0,
                    normalizedY: 0
                },
                {x: xEnd, y: yMediumEndWithControl, id: 'ep', isControlPoint: false, normalizedX: 0, normalizedY: 0}]
            controlPoints = [{x: 2550, y: 680, id: 'cp', isControlPoint: true, normalizedX: 0, normalizedY: 0}]
        }
        //If the points already exist, they are reloaded
        else {
            points = this.props.points;
            controlPoints = this.props.controlPoints;
        }

        this.setState({points, controlPoints}, () => this.props.handler(points, controlPoints));
    }

    /**
     * Helper method that sets the id of the point that is being dragged
     * @param {number} id The id of the point that is being dragged at the moment
     * @param {boolean} isControlPoint A Boolean stating whether the point that is currently dragged is a control point
     */
    handleMouseDown(id, isControlPoint) {
        this.setState({controlPointDragged: isControlPoint, draggingPointId: id});
        console.log("Mouse down")
    }

    /**
     * Helper method that removes the id from the state when no point is dragged
     */
    handleMouseUp() {
        this.setState({controlPointDragged: true, draggingPointId: null});
        this.props.handler(this.state.points, this.state.controlPoints) // Propogates changes so histogram can update
        console.log("Mouse up")
    }

    /**
     * Helper method that handles when mouse has left
     */
     handleMouseLeave() {
        console.log("Mouse leave")
    }

    /**
     * Handles drag and drops of points
     * @param {number} clientX The x-coordinate of the point that is being dragged
     * @param {number} clientY The y-coordinate of the point that is being dragged
     */
    handleMouseMove({clientX, clientY}) {
        // If we're not currently dragging a point, this is a no-op
        if (!this.state.draggingPointId) {
            return;
        }
        console.log("Mouse moving")
        //Identify the point that is being moved
        let pointList;
        if (!this.state.controlPointDragged) {
            pointList = this.state.points;
        } else {
            pointList = this.state.controlPoints;
        }

        let index = pointList.findIndex(element => element.id === this.state.draggingPointId);
        let point = pointList[index]

        //Calculate the position of the point in the rectangle
        const svgRect = this.node.getBoundingClientRect();

        const svgX = clientX - svgRect.left;
        const svgY = clientY - svgRect.top;

        let viewBoxX = svgX * viewBoxWidth / svgRect.width;

        let viewBoxY = svgY * viewBoxHeightWithControlPoint / svgRect.height;

        //Find out if the point being dragged is a control point or not
        //This is important for validating the position of the point and the corresponding control points
        if (!this.state.controlPointDragged) {
            //Check if the dragged point is the start point
            if (index === 0) {
                viewBoxX = xStart;
            }
            //Check if the dragged point is the end point
            else if (index === 1) {
                viewBoxX = xEnd;
            }
            let controlPoint = this.state.controlPoints[0];

            //Validate the x and y coordinates of the point
            viewBoxY = checkViewBoxBoundariesY(viewBoxY, yMediumEndWithControl, yMediumStartWithControl);

            //Validate the x and y coordinates of the control point in the middle
            controlPoint.y = checkMaxYControlPointPosition(controlPoint.y, this.state.points[0].y, this.state.points[1].y)

            //Update all points and the control point
            point = {x: viewBoxX, y: viewBoxY, id: point.id}
            pointList[index] = point;
            this.setState({key: Math.random(), points: pointList, controlPoints: [controlPoint]})

            // Makes updates to histogram at every move
            // this.setState({key: Math.random(), points: pointList, controlPoints: [controlPoint]}, () => {
            //     this.props.handler(this.state.points, this.state.controlPoints)
            // });

        }
        //If the point itself is a control point, we need to validate its position according to its neighbouring points
        else {
            viewBoxX = checkViewBoxBoundariesX(viewBoxX);
            viewBoxY = checkViewBoxBoundariesY(viewBoxY, yEndWithControl, yStartWithControl);
            viewBoxY = checkMaxYControlPointPosition(viewBoxY, this.state.points[0].y, this.state.points[1].y)

            //Update all points and the control point
            point = {x: viewBoxX, y: viewBoxY, id: point.id}
            pointList[index] = point;

            this.setState({key: Math.random(), controlPoints: pointList})
            
            // Makes updates to histogram at every move
            // this.setState({key: Math.random(), controlPoints: pointList}, () => {
            //     this.props.handler(this.state.points, this.state.controlPoints)
            // })
        }
    }

    /**
     * Inverts the complete ASF meaning that it flips the function on the y-axis
     */
    invertValues() {
        //Make a deep copy of the arrays otherwise it doesn't work
        let points = [].concat(this.state.points);
        let controlPoints = [].concat(this.state.controlPoints);

        //Invert all points and all control points
        invertValues(points, middle);
        invertValues(controlPoints, middle);

        this.setState({points: points, controlPoints: controlPoints}, () => {
            this.props.handler(points, controlPoints)
        })
    }

    /**
     * Calculates tooltip by mapping pixel to range (1, -1) input: handle coordinate object
     */
     mappingToScore(coordinate) {

        // Define scale 

        let pMax = 420
        let pMin = 1220
        let sMax = 1
        let sMin = -1
        
        // Find y coordinate in pixel scale
        let p = coordinate.y

        // Calculate mapping and round to nearest 0.05
        return (Math.round((((p - pMax) / (pMin - pMax)) * (sMin - sMax) + sMax) * 20) / 20)
    }

    render() {
        //Make a deep copy of the ASF background
        let resultValue = [].concat(asfBackgroundWithControlPoint);
        resultValue.push(<text x="110" y="880" fontSize="50px">{this.props.minValue}</text>)

        //Create all labels on the x-axis based on the data
        let i;
        for (i = 1; i < numberOfBins; i++) {
            let x = (xEnd - xStart) / (numberOfBins - 1);
            let distance = parseInt(((this.props.maxValue - this.props.minValue) / (numberOfBins - 1)) * i + this.props.minValue)

            let offset = 7;
            if (distance >= 100) {
                offset = 21;
            } else if (distance >= 10) {
                offset = 14;
            }

            resultValue.push(<line x1={xStart + x * i} y1="820" x2={xStart + x * i} y2="835" stroke="rgb(0, 0, 0)"
                                   strokeWidth={2}/>)
            resultValue.push(<text x={(xStart + x * i) - offset} y="880" fontSize="50px">{distance}</text>)
        }

        //Create all points and the control point and their corresponding SVG components
        let startPoint = this.state.points[0];
        let endPoint = this.state.points[1];
        let controlPoint = this.state.controlPoints[0]

        const instructions = `
             M ${startPoint.x},${startPoint.y}
             Q ${controlPoint.x},${controlPoint.y}
              ${endPoint.x},${endPoint.y}
           `;


        resultValue.push(<LargeHandle id={"handle" + i - 1} coordinates={startPoint}
                                      onMouseDown={() => this.handleMouseDown(startPoint.id, false)}/>)
        resultValue.push(<LargeHandle id={"handle" + i} coordinates={endPoint}
                                      onMouseDown={() => this.handleMouseDown(endPoint.id, false)}/>)
        resultValue.push(<SmallHandle id={"handleControl" + i - 1} coordinates={controlPoint}
                                      onMouseDown={() => this.handleMouseDown(controlPoint.id, true)}/>)
        resultValue.push(<ConnectingLine id={"connectingPoint" + i - 1 + 'toControlPoint' + i - 1} from={startPoint}
                                         to={controlPoint}/>)
        resultValue.push(<ConnectingLine id={"connectingControlPoint" + i - 1 + 'ToPoint' + i} from={controlPoint}
                                         to={endPoint}/>)
        resultValue.push(<Curve id={"curveFrom" + i - 1 + 'To' + i} instructions={instructions}/>)

         // Tooltip for handles 
         resultValue.push(<HoverText id={"handle" + i + 1} coordinates={startPoint} y_text={this.mappingToScore(startPoint)}
         />)
         resultValue.push(<HoverText id={"handle" + i + 1} coordinates={endPoint} y_text={this.mappingToScore(endPoint)}
         />)
         resultValue.push(<HoverText id={"handle" + i + 1} coordinates={controlPoint} y_text={this.mappingToScore(controlPoint)}
         />)

        return (
            <>
                <svg
                    key={this.state.key}
                    ref={node => (this.node = node)}
                    viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeightWithControlPoint}`}
                    onMouseMove={ev => this.handleMouseMove(ev)}
                    onMouseUp={() => this.handleMouseUp()}
                    onMouseLeave={() => this.handleMouseLeave()}
                    style={{
                        overflow: 'visible',
                        width: '80%',
                        display: 'inline',
                        paddingRight: '70px',
                        paddingLeft: '40px',
                        marginTop: '50px'
                    }}
                >

                    {resultValue.map((element) => (
                        (element)))}
                </svg>
                <div style={{paddingLeft: '40px', paddingTop: '20px', paddingBottom: '30px'}}>
                    <button className='nextButton button' key={'invert'} onClick={() => {
                        this.invertValues()
                    }}>Invert Values
                    </button>
                </div>
            </>
        );
    }
}

export default TwoPointNonLinear;
