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
    numberOfPointsSelector,
    viewBoxHeightWithControlPoint,
    viewBoxWidth,
    xEnd,
    xStart,
    yEndWithControl,
    yMediumEndWithControl,
    yMediumStartWithControl,
    yStartWithControl
} from "./ASFHelperFunctions";

class MultiPointDiscontinuous extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            points: [],
            controlPoints: [],
            numberOfPointsSelected: 3,
            draggingPointId: null,
            controlPointDragged: false,
            key: 0,
        };
        this.onSelectChange = this.onSelectChange.bind(this);
        this.invertValues = this.invertValues.bind(this);
    }

    /**
     * Life-cycle method that initializes all axes and points in the ASF and sets them as state
     */
    componentWillMount() {
        let points;
        let controlPoints;
        let numberOfPointsSelected;

        //Check if some points were initialized from the options
        //If this is not the case, the points are initialized
        if (this.props.points.length === 0) {
            points = [{
                x: xStart,
                y: 1220,
                id: "startPoint",
                isControlPoint: false,
                normalizedX: 0,
                normalizedY: 0.5,
                isLeft: true
            },
                {
                    x: 1133.3,
                    y: 1024,
                    id: "middlePoint1",
                    isControlPoint: false,
                    normalizedX: 0.3333333333333333,
                    normalizedY: 0.595,
                    isLeft: false
                },
                {
                    x: 1133.3,
                    y: 948,
                    id: "middlePoint2",
                    isControlPoint: false,
                    normalizedX: 0.3333333333333333,
                    normalizedY: 0.69,
                    isLeft: true
                },
                {
                    x: 2166.6,
                    y: 772,
                    id: "middlePoint3",
                    isControlPoint: false,
                    normalizedX: 0.6666666666666666,
                    normalizedY: 0.785,
                    isLeft: false
                },
                {
                    x: 2166.6,
                    y: 696,
                    id: "middlePoint4",
                    isControlPoint: false,
                    normalizedX: 0.6666666666666666,
                    normalizedY: 0.88,
                    isLeft: true
                },
                {
                    x: xEnd,
                    y: 420,
                    id: "endPoint",
                    isControlPoint: false,
                    normalizedX: 1,
                    normalizedY: 0.975,
                    isLeft: false
                }]
            controlPoints = [{
                x: 875,
                y: 900,
                id: "controlPoint1",
                isControlPoint: true,
                normalizedX: 0.25,
                normalizedY: 0.5
            },
                {
                    x: 1908.3333333333333,
                    y: 648,
                    id: "controlPoint2",
                    isControlPoint: true,
                    normalizedX: 0.5833333333333333,
                    normalizedY: 0.69
                },
                {
                    x: 2941.6666666666665,
                    y: 426,
                    id: "controlPoint3",
                    isControlPoint: true,
                    normalizedX: 0.9166666666666666,
                    normalizedY: 0.88
                }]
            numberOfPointsSelected = 3
        }
        //If the points already exist, they are reloaded
        else {
            points = this.props.points;
            controlPoints = this.props.controlPoints;
            numberOfPointsSelected = this.props.numberOfPoints;
        }

        this.setState({numberOfPointsSelected: numberOfPointsSelected})
        this.setState({points, controlPoints}, () => this.props.handler(points, controlPoints, numberOfPointsSelected));
    }

    /**
     * Helper method that sets the id of the point that is being dragged
     * @param {number} id The id of the point that is being dragged at the moment
     * @param {boolean} isControlPoint A Boolean stating whether the point that is currently dragged is a control point
     */
    handleMouseDown(id, isControlPoint) {
        this.setState({draggingPointId: id, controlPointDragged: isControlPoint});
    }


    /**
     * Helper method that removes the id from the state when no point is dragged
     */
    handleMouseUp() {
        this.setState({draggingPointId: null, controlPointDragged: true});
        this.props.handler(this.state.points, this.state.controlPoints);
    }

    /**
     * Helper method that handles when mouse has left
     */
     handleMouseLeave() {
        console.log("Mouse leave")
    }


    /**
     * Handles drag and drops of points and control points
     * @param {number} clientX The x-coordinate of the point that is being dragged
     * @param {number} clientY The y-coordinate of the point that is being dragged
     */
    handleMouseMove({clientX, clientY}) {
        // If we're not currently dragging a point, this is a no-op
        if (!this.state.draggingPointId) {
            return;
        }

        //Identify the point that is being moved
        let points = this.state.points;
        let controlPoints = this.state.controlPoints;
        const isControlPoint = this.state.controlPointDragged;

        //Calculate the position of the point in the rectangle
        const svgRect = this.node.getBoundingClientRect();

        const svgX = clientX - svgRect.left;
        const svgY = clientY - svgRect.top;

        let viewBoxX = svgX * viewBoxWidth / svgRect.width;
        let viewBoxY = svgY * viewBoxHeightWithControlPoint / svgRect.height;

        let point;

        //Find out if the point being dragged is a start or end point
        //This is important for validating its position of the point and the its corresponding control points
        if (!isControlPoint) {
            let index = points.findIndex(element => element.id === this.state.draggingPointId);
            point = points[index]
            let controlPoints = this.state.controlPoints;

            //Check if the dragged point is the start point
            if (index === 0) {
                viewBoxX = xStart;

                //Find the corresponding control point and check the validity of the position
                let controlPoint = controlPoints[0];
                controlPoint.y = checkMaxYControlPointPosition(controlPoint.y, point.y, points[index + 1].y)
                controlPoints[0] = controlPoint;
            }
            //Check if the dragged point is the end point
            else if (index === points.length - 1) {
                viewBoxX = xEnd;

                //Find the corresponding control point and check the validity of the position
                let controlPoint = controlPoints[controlPoints.length - 1];
                controlPoint.y = checkMaxYControlPointPosition(controlPoint.y, point.y, points[index - 1].y)
                controlPoints[controlPoints.length - 1] = controlPoint;
            }
            //If the point is neither the start nor the end point, it is a point somewhere in the middle
            else {
                let neighbourPoint, controlPointRight, controlPointLeft;

                //Find the corresponding control points
                //depending on if the point is a left or right point on a line segment
                if (point.isLeft) {
                    neighbourPoint = points[index - 1];
                    controlPointLeft = controlPoints[(index / 2) - 1]
                    controlPointRight = controlPoints[(index / 2)]
                } else {
                    neighbourPoint = points[index + 1];
                    controlPointLeft = controlPoints[(index - 1) / 2]
                    controlPointRight = controlPoints[(index + 1) / 2]
                }

                //Validate the x-coordinate of the point
                if (viewBoxX > controlPointRight.x) {
                    viewBoxX = controlPointRight.x;
                }
                if (viewBoxX < controlPointLeft.x) {
                    viewBoxX = controlPointLeft.x;
                }
                neighbourPoint.x = viewBoxX;

                if (point.isLeft) {
                    points[index - 1] = neighbourPoint;
                    controlPointRight.y = checkMaxYControlPointPosition(controlPointRight.y, point.y, neighbourPoint.y)
                    controlPoints[(index / 2)] = controlPointRight;
                } else {
                    points[index + 1] = neighbourPoint;
                    controlPointLeft.y = checkMaxYControlPointPosition(controlPointLeft.y, neighbourPoint.y, point.y)
                    controlPoints[(index / 2)] = controlPointLeft;
                }

            }
            this.setState({controlPoints: controlPoints})

            //Validate the x and y coordinates of the point
            viewBoxX = checkViewBoxBoundariesX(viewBoxX);
            viewBoxY = checkViewBoxBoundariesY(viewBoxY, yMediumEndWithControl, yMediumStartWithControl);

            //We update the positions of the point being dragged and its neighbouring points (if necessary)
            point = {
                x: viewBoxX, y: viewBoxY, id: point.id, isLeft: point.isLeft, normalizedX: 0, normalizedY: 0,
                isControlPoint: false
            }
            points[index] = point;

            this.setState({key: Math.random(), points: points}, () => {
                this.props.handler(this.state.points, this.state.controlPoints)
            });

        }
        //If the point itself is a control point, we need to validate its position according to its neighbouring points
        else {
            let index = controlPoints.findIndex(element => element.id === this.state.draggingPointId);
            point = controlPoints[index]

            //We need to find the left and right point of the line segment
            let neighbourRight = points[(index * 2) + 1];
            let neighbourLeft = points[index * 2];

            //We validate the position of the control point based on its neighbors
            if (viewBoxX > neighbourRight.x) {
                viewBoxX = neighbourRight.x;
            }
            if (viewBoxX < neighbourLeft.x) {
                viewBoxX = neighbourLeft.x;
            }

            //We validate the coordinates of the point in relation to the rectangle and coordinate system
            viewBoxX = checkViewBoxBoundariesX(viewBoxX);
            viewBoxY = checkViewBoxBoundariesY(viewBoxY, yEndWithControl, yStartWithControl);
            viewBoxY = checkMaxYControlPointPosition(viewBoxY, neighbourLeft.y, neighbourRight.y)

            //We update the positions of the point being dragged and its neighbouring points (if necessary)
            point = {
                x: viewBoxX, y: viewBoxY, id: point.id, normalizedX: 0, normalizedY: 0,
                isControlPoint: true
            }
            controlPoints[index] = point;
            this.setState({key: Math.random(), controlPoints: controlPoints}, () => {
                this.props.handler(this.state.points, this.state.controlPoints)
            });
        }
    }

    /**
     * Inverts the complete ASF meaning that it flips the function on the y-axis
     */
    invertValues() {
        //Make a deep copy of the arrays otherwise it doesn't work
        let points = [].concat(this.state.points);
        let controlPoints = [].concat(this.state.controlPoints);

        invertValues(points, middle);
        invertValues(controlPoints, middle);

        this.setState({points: points, controlPoints: controlPoints}, () => {
            this.props.handler(this.state.points, this.state.controlPoints)
        })
    }

    /**
     * Handle selector changes (when the number of points selector is changed)
     * This means, a new ASF with the selected number of points and the default configuration is shown
     * @param {Object} event The event emitted from the selector.
     */
    onSelectChange(event) {
        let selected = parseInt(event.target.value)
        let controlPoints = [];

        let startPoint = {
            x: xStart,
            y: yMediumStartWithControl,
            id: 'startPoint',
            isControlPoint: false,
            normalizedX: 0,
            normalizedY: 0,
            isLeft: true
        }
        let endPoint = {
            x: xEnd,
            y: yMediumEndWithControl,
            id: 'endPoint',
            isControlPoint: false,
            normalizedX: 0,
            normalizedY: 0,
            isLeft: false
        }

        //Calculate how big the distance between points must be according to the number of selected points
        const xDistance = (xEnd - xStart) / (selected);
        const yDistance = 760 / ((selected * 2) - 1);

        let points = [startPoint];

        points.push({
            x: xStart + xDistance,
            y: yMediumStartWithControl - yDistance,
            id: 'middlePoint' + 1,
            isControlPoint: false,
            normalizedX: 0,
            normalizedY: 0,
            isLeft: false
        })
        controlPoints.push({
            x: xStart + (0.75 * xDistance),
            y: yMediumStartWithControl,
            id: 'controlPoint' + 1,
            isControlPoint: true,
            normalizedX: 0,
            normalizedY: 0
        })

        //Create as many points and control points as selected
        let i;
        for (i = 1; i < selected - 1; i++) {
            points.push({
                x: xStart + xDistance * (i),
                y: yMediumStartWithControl - (yDistance * i * 2),
                id: 'middlePoint' + i + 1,
                isControlPoint: false,
                normalizedX: 0,
                normalizedY: 0,
                isLeft: true
            })
            points.push({
                x: xStart + xDistance * (i + 1),
                y: yMediumStartWithControl - (yDistance * (i * 2 + 1)),
                id: 'middlePoint' + i + 11,
                isControlPoint: false,
                normalizedX: 0,
                normalizedY: 0,
                isLeft: false
            })
            controlPoints.push({
                x: xStart + ((i + 0.75) * xDistance),
                y: yMediumStartWithControl - (yDistance * i * 2),
                id: 'controlPoint' + i + 1,
                isControlPoint: true,
                normalizedX: 0,
                normalizedY: 0
            })
        }

        points.push({
            x: xStart + xDistance * (selected - 1),
            y: yMediumEndWithControl + yDistance,
            id: 'middlePointLast',
            isControlPoint: false,
            normalizedX: 0,
            normalizedY: 0,
            isLeft: true
        })
        controlPoints.push({
            x: xStart + xDistance * (selected - 0.25),
            y: yMediumEndWithControl + (yDistance),
            id: 'controlPointLast',
            isControlPoint: true,
            normalizedX: 0,
            normalizedY: 0
        })

        points.push(endPoint);

        this.setState({
            controlPoints: controlPoints,
            points: points,
            key: Math.random(),
            numberOfPointsSelected: selected
        }, () => {
            this.props.handler(this.state.points, this.state.controlPoints);
        });
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
        const {points, controlPoints} = this.state;

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

        //Create all points and control points according to the number of selected points and the point positions
        for (i = 1; i < points.length; i = i + 2) {
            let startPoint = points[i - 1];
            let endPoint = points[i];
            let controlPoint = controlPoints[(i - 1) / 2]

            //SVG instructions to display the ASF lines
            const instructions = `
             M ${startPoint.x},${startPoint.y}
             Q ${controlPoint.x},${controlPoint.y}
              ${endPoint.x},${endPoint.y}
           `;

            //Add the SVG components for each point
            resultValue.push(<ConnectingLine id={"connectingPoint" + i - 1 + 'toControlPoint' + i - 1} from={startPoint}
                                             to={controlPoint}/>)
            resultValue.push(<ConnectingLine id={"connectingControlPoint" + i - 1 + 'ToPoint' + i} from={controlPoint}
                                             to={endPoint}/>)
            resultValue.push(<Curve id={"curveFrom" + i - 1 + 'To' + i} instructions={instructions}/>)
            resultValue.push(<LargeHandle id={"handle" + i - 1} coordinates={startPoint} onMouseDown={
                () => this.handleMouseDown(startPoint.id, false)}
            />)
            if (i < points.length - 1) {
                resultValue.push(<LargeHandleVoid id={"handle" + i} coordinates={endPoint} onMouseDown={
                    () => this.handleMouseDown(endPoint.id, false)}
                />)
            } else {
                resultValue.push(<LargeHandle id={"handle" + i} coordinates={endPoint} onMouseDown={
                    () => this.handleMouseDown(endPoint.id, false)}
                />)
            }
            resultValue.push(<SmallHandle id={"handleControl" + i - 1} coordinates={controlPoint} onMouseDown={() =>
                this.handleMouseDown(controlPoint.id, true)}
            />)

            // Tooltip for handles 
            resultValue.push(<HoverText id={"handle" + i + 1} coordinates={startPoint} y_text={this.mappingToScore(startPoint)}
            />)
            resultValue.push(<HoverText id={"handle" + i + 1} coordinates={endPoint} y_text={this.mappingToScore(endPoint)}
            />)
            resultValue.push(<HoverText id={"handle" + i + 1} coordinates={controlPoint} y_text={this.mappingToScore(controlPoint)}
            />)

        }

        return (
            <>
                <div className='text'>Select number of points:
                    <select style={{marginLeft: '10px'}} id="dropdown-basic-button" onChange={this.onSelectChange}
                            value={this.state.numberOfPointsSelected}>
                        {numberOfPointsSelector.map((category) => (
                            <option key={category}>{category}</option>
                        ))}
                    </select>
                </div>
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
                <div style={{paddingLeft: '40px', paddingBottom: '30px'}}>
                    <button className='nextButton button' key={'invert'} onClick={() => {
                        this.invertValues()
                    }}>Invert Values
                    </button>
                </div>
            </>
        );
    }
}

export default MultiPointDiscontinuous;

//For the right point of a line segment, a special kind of handle is needed to symbolize the discontinuity
export const LargeHandleVoid = ({coordinates, onMouseDown}) => (
    <ellipse
        cx={coordinates.x}
        cy={coordinates.y}
        rx={15}
        ry={15}
        fill="rgb(250, 250, 250"
        stroke="#1b42f2"
        strokeWidth={3}
        onMouseDown={onMouseDown}
        style={{cursor: '-webkit-grab'}}
    />
);
