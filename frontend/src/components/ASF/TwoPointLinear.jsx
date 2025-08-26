import React from 'react'
import {Curve, HoverText, LargeHandle} from "../HelperComponents";
import {
    asfBackground,
    checkViewBoxBoundariesY,
    invertValues,
    numberOfBins,
    viewBoxHeight,
    viewBoxWidth,
    xEnd,
    xStart,
    yEnd,
    yStart
} from "./ASFHelperFunctions";

class TwoPointLinear extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            points: [],
            draggingPointId: null,
            key: 0,
        };
        this.invertValues = this.invertValues.bind(this);
    }

    /**
     * Life-cycle method that initializes all axes and points in the ASF and sets them as state
     */
    componentWillMount() {
        let points;

        //Check if some points were initialized from the options
        //If this is not the case, the points are initialized
        if (this.props.points.length === 0) {
            points = [
                {x: xStart, y: yStart, id: 'startPoint', normalizedX: 0, normalizedY: 0},
                {x: xEnd, y: yEnd, id: 'endPoint', normalizedX: 0, normalizedY: 0}
            ]
        }
        //If the points already exist, they are reloaded
        else {
            points = this.props.points;
        }

        this.setState({points}, () => this.props.handler(points, []));
    }

    /**
     * Helper method that sets the id of the point that is being dragged
     * @param {number} id The id of the point that is being dragged at the moment
     */
    handleMouseDown(id) {
        this.setState({draggingPointId: id});
    }

    /**
     * Helper method that removes the id from the state when no point is dragged
     */
    handleMouseUp() {
        this.setState({draggingPointId: null});
        this.props.handler(this.state.points, []);
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
        // If we're not currently dragging a point, this is a no-op.
        if (!this.state.draggingPointId) {
            return;
        }

        //Identify the point that is being moved
        let pointList = this.state.points;

        let index = pointList.findIndex(element => element.id === this.state.draggingPointId);
        let point = pointList[index]

        //Calculate the position of the point in the rectangle
        const svgRect = this.node.getBoundingClientRect();

        const svgX = clientX - svgRect.left;
        const svgY = clientY - svgRect.top;

        let viewBoxX = svgX * viewBoxWidth / svgRect.width;

        let viewBoxY = svgY * viewBoxHeight / svgRect.height;

        //Check if the dragged point is the start point
        if (index === 0) {
            //Set the x-value such that the point sticks to the y-axis
            viewBoxX = xStart;
        }
        //Check if the dragged point is the end point
        else if (index === 1) {
            //Set the x-value such that the point sticks to the y-axis at the end
            viewBoxX = xEnd;
        }

        //Check the validity of the position
        viewBoxY = checkViewBoxBoundariesY(viewBoxY);

        //We update the positions of the point being dragged
        point = {x: viewBoxX, y: viewBoxY, id: point.id}
        pointList[index] = point;

        //Only change the position of the circle, do not update the histogram while moving
        this.setState({key: Math.random(), points: pointList})

        //Changes position of circle and updates histogram while moving
        // this.setState({key: Math.random(), points: pointList}, () => {
        //     this.props.handler(this.state.points, [])
        // });

    }

    /**
     * Inverts the complete ASF meaning that it flips the function on the y-axis
     */
    invertValues() {
        //Make a deep copy of the arrays otherwise it doesn't work
        let points = [].concat(this.state.points);

        //Invert all points
        invertValues(points);

        this.setState({points: points}, () => {
            this.props.handler(this.state.points, this.state.controlPoints)
        })
    }

    /**
     * Calculates tooltip by mapping pixel to range (1, -1) input: handle coordinate object
     */
     mappingToScore(coordinate) {

        // Define scale 

        let pMax = 20
        let pMin = 820
        let sMax = 1
        let sMin = -1
        
        // Find y coordinate in pixel scale
        let p = coordinate.y

        // Calculate mapping and round to nearest 0.05
        return Math.round((((p - pMax) / (pMin - pMax)) * (sMin - sMax) + sMax) * 20) / 20
    }

    render() {
        const {points} = this.state;

        //Make a deep copy of the ASF background
        let resultValue = [].concat(asfBackground);
        resultValue.push(<text x="110" y="490" fontSize="50px">{this.props.minValue}</text>);

        //Create all labels on the x-axis based on the data
        let i;
        for (i = 1; i < numberOfBins; i++) {
            let x = (xEnd - xStart) / (numberOfBins - 1);
            let distance = parseInt(((this.props.maxValue - this.props.minValue) / (numberOfBins - 1)) * i + this.props.minValue)

            let offset = 7;
            if (distance >= 1000) {
                offset = 80;
            } else if (distance >= 10) {
                offset = 30;
            }

            resultValue.push(<line x1={xStart + x * i} y1="420" x2={xStart + x * i} y2="435" stroke="rgb(0, 0, 0)"
                                   strokeWidth={2}/>)
            resultValue.push(<text x={(xStart + x * i) - offset} y="490" fontSize="50px">{distance}</text>)
        }

        //Create all points, their labels and SVG components
        let startPoint = points[0];
        let endPoint = points[1];

        const instructions = `
             M ${startPoint.x},${startPoint.y}
              ${endPoint.x},${endPoint.y}
           `;

        resultValue.push(<Curve id={"curveFrom" + i - 1 + 'To' + i} instructions={instructions}/>)
        resultValue.push(<LargeHandle id={"handle" + i - 1} coordinates={startPoint} onMouseDown={
            () => this.handleMouseDown(startPoint.id, false)}
        />)
        resultValue.push(<LargeHandle id={"handle" + i} coordinates={endPoint} onMouseDown={
            () => this.handleMouseDown(endPoint.id, false)}
        />)

        // Tooltip for handles 
        resultValue.push(<HoverText id={"handle" + i + 1} coordinates={startPoint} y_text={this.mappingToScore(startPoint)}
        />)
        resultValue.push(<HoverText id={"handle" + i + 1} coordinates={endPoint} y_text={this.mappingToScore(endPoint)}
        />)

        return (
            <>
                <svg
                    key={this.state.key}
                    ref={node => (this.node = node)}
                    viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
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

export default TwoPointLinear;
