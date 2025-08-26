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
    numberOfPointsSelectorContinuous,
    viewBoxHeightWithControlPoint,
    viewBoxWidth,
    xEnd,
    xStart,
    yEndWithControl,
    yMediumEndWithControl,
    yMediumStartWithControl,
    yStartWithControl
} from "./ASFHelperFunctions";

class MultiPointContinuous extends React.PureComponent {
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
            points = [
                {x: xStart, y: 1220, id: "startPoint", isControlPoint: false, normalizedX: 0, normalizedY: 0.5},
                {x: 1650, y: 820, id: "middlePoint2", isControlPoint: false, normalizedX: 0.5, normalizedY: 0.75},
                {x: xEnd, y: 420, id: "endPoint", isControlPoint: false, normalizedX: 1, normalizedY: 0.975}
            ]
            controlPoints =
                [
                    {
                        x: 1262.5,
                        y: 1020,
                        id: "controlPoint1",
                        isControlPoint: true,
                        normalizedX: 0.375,
                        normalizedY: 0.4375
                    },
                    {
                        x: 2812.5,
                        y: 620,
                        id: "controlPoint2",
                        isControlPoint: true,
                        normalizedX: 0.875,
                        normalizedY: 0.6875
                    }
                ]
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
        this.setState({draggingPointId: id});
        this.setState({controlPointDragged: isControlPoint});
    }

    /**
     * Helper method that removes the id from the state when no point is dragged
     */
    handleMouseUp() {
        this.setState({draggingPointId: null});
        this.setState({controlPointDragged: true});
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
        let pointList;
        const isControlPoint = this.state.controlPointDragged;
        if (!isControlPoint) {
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

        let controlPoints = this.state.controlPoints;

        //Find out if the point being dragged is a start or end point
        //This is important for validating the position of the point and the corresponding control points
        if (!isControlPoint) {
            //Check if the dragged point is the start point
            if (index === 0) {
                viewBoxX = xStart;

                //Find the corresponding control point and check the validity of the position
                let controlPoint = controlPoints[0];
                controlPoint.y = checkMaxYControlPointPosition(controlPoint.y, point.y, pointList[index + 1].y)
                controlPoints[0] = controlPoint;

            }
            //Check if the dragged point is the end point
            else if (index === pointList.length - 1) {
                viewBoxX = xEnd;

                //Find the corresponding control point and check the validity of the position
                let controlPoint = controlPoints[controlPoints.length - 1];
                controlPoint.y = checkMaxYControlPointPosition(controlPoint.y, point.y, pointList[index - 1].y)
                controlPoints[controlPoints.length - 1] = controlPoint;

            }
            //If the point is neither the start nor the end point, it is a point somewhere in the middle
            else {

                //Find the corresponding control points and check the validity of the positions
                let controlPointLeft = controlPoints[index - 1];
                let controlPointRight = controlPoints[index];

                if (viewBoxX < controlPointLeft.x) {
                    viewBoxX = controlPointLeft.x;
                }
                if (viewBoxX > controlPointRight.x) {
                    viewBoxX = controlPointRight.x;
                }
                controlPointLeft.y = checkMaxYControlPointPosition(controlPointLeft.y, pointList[index - 1].y, point.y)
                controlPointRight.y = checkMaxYControlPointPosition(controlPointRight.y, point.y, pointList[index + 1].y)

                controlPoints[index - 1] = controlPointLeft;
                controlPoints[index] = controlPointRight;
            }

            this.setState({controlPoints: controlPoints})

            //Validate the x and y coordinates of the point
            viewBoxX = checkViewBoxBoundariesX(viewBoxX);
            viewBoxY = checkViewBoxBoundariesY(viewBoxY, yMediumEndWithControl, yMediumStartWithControl);


        }
        //If the point itself is a control point, we need to validate its position according to its neighbouring points
        else {
            let startPoint = this.state.points[index];
            let endPoint = this.state.points[index + 1];

            //We validate the position of the control point depending on the point to its left and right
            if (startPoint.x > viewBoxX) {
                viewBoxX = startPoint.x
            }
            if (endPoint.x < viewBoxX) {
                viewBoxX = endPoint.x
            }

            viewBoxX = checkViewBoxBoundariesX(viewBoxX);
            viewBoxY = checkViewBoxBoundariesY(viewBoxY, yEndWithControl, yStartWithControl);
            viewBoxY = checkMaxYControlPointPosition(viewBoxY, startPoint.y, endPoint.y)
        }

        //We update the positions of the point being dragged and its neighbouring points (if necessary)
        point = {x: viewBoxX, y: viewBoxY, id: point.id, isControlPoint: point.isControlPoint}
        pointList[index] = point;

        this.setState({key: Math.random()});

        if (isControlPoint) {
            this.setState({controlPoints: pointList}, () => {
                this.props.handler(this.state.points, this.state.controlPoints)
            });
        } else {
            this.setState({points: pointList}, () => {
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

        //Invert all points and all control points
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

        //Define the start and end point
        let startPoint = {
            x: xStart,
            y: yMediumStartWithControl,
            id: 'startPoint',
            isControlPoint: false,
            normalizedX: 0,
            normalizedY: 0
        }
        let endPoint = {
            x: xEnd,
            y: yMediumEndWithControl,
            id: 'endPoint',
            isControlPoint: false,
            normalizedX: 0,
            normalizedY: 0
        }

        let points = [startPoint];
        let controlPoints = [];

        //Calculate how big the distance between points must be according to the number of selected points
        const xDistance = (xEnd - xStart) / (selected - 1);
        const yDistance = middle / (selected - 1);
        controlPoints.push({
            x: xStart + (0.75 * xDistance),
            y: yMediumStartWithControl,
            id: 'controlPoint1',
            isControlPoint: true,
            normalizedX: 0,
            normalizedY: 0
        })

        //Create as many points and control points as selected
        let i;
        for (i = 2; i < selected; i++) {
            points.push({
                x: xStart + xDistance * (i - 1),
                y: yMediumStartWithControl - (yDistance * (i - 1)),
                id: 'middlePoint' + i,
                isControlPoint: false,
                normalizedX: 0,
                normalizedY: 0
            })
            controlPoints.push({
                x: xStart + xDistance * (i - 1) + (0.75 * xDistance),
                y: yMediumStartWithControl - (yDistance * (i - 1)) + (0.25 * yDistance),
                id: 'controlPoint' + i,

                isControlPoint: true,
                normalizedX: 0,
                normalizedY: 0
            })
        }
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
        for (i = 1; i < points.length; i++) {
            let startPoint = points[i - 1];
            let endPoint = points[i];
            let controlPoint = controlPoints[i - 1]

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
            resultValue.push(<LargeHandle id={"handle" + i} coordinates={endPoint} onMouseDown={
                () => this.handleMouseDown(endPoint.id, false)}
            />)
            resultValue.push(<SmallHandle id={"handleControl" + i - 1} coordinates={controlPoint} onMouseDown={() =>
                this.handleMouseDown(controlPoint.id, true)}
            />)
            resultValue.push(<ConnectingLine id={"connectingPoint" + i - 1 + 'toControlPoint' + i - 1} from={startPoint}
                                             to={controlPoint}/>)

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
                        {numberOfPointsSelectorContinuous.map((category) => (
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

export default MultiPointContinuous;