import {Axis, DashedAxis} from "../HelperComponents";
import React from "react";

//This file contains constants that are used fro the drawing of the ASFs
//To read more about Bézier curves please have a look at my thesis or check out the external documentation.

//x- and y-position of the frame for ASFs without control points
export const xStart = 100;
export const xEnd = 3200;
export const yStart = 820;
export const yEnd = 20;

//x- and y-positions of the two axes for ASFs without control points
export const xAxisStart = {x: xStart, y: yStart / 2};
export const xAxisEnd = {x: xEnd, y: yStart / 2};
export const yAxisStart = {x: xStart, y: yEnd};
export const yAxisEnd = {x: xStart, y: yStart};

//x- and y-position of the frame for ASFs with control points
export const yStartWithControl = 1600;
export const yEndWithControl = 20;
export const yMediumStartWithControl = 1220;
export const yMediumEndWithControl = 420;
export const middle = (yMediumStartWithControl + yMediumEndWithControl) / 2;

//x- and -y positions of the two axes for ASFs with control points
export const xAxisStartWithControl = {x: xStart, y: (yStartWithControl / 2) + 20};
export const xAxisEndWithControl = {x: xEnd, y: (yStartWithControl /2) + 20};
export const yAxisStartWithControl = {x: xStart, y: yMediumEndWithControl};
export const yAxisEndWithControl = {x: xStart, y: yMediumStartWithControl};

//Viewbox dimensions
export const viewBoxWidth = 3200;
export const viewBoxHeight = 840;
export const viewBoxHeightWithControlPoint = 1680;

//Constants for the selectors and UI design
export const numberOfBins = 7;
export const numberOfPointsSelector = [3, 4, 5, 6, 7, 8, 9, 10];
export const numberOfPointsSelectorContinuous = [2, 3, 4, 5, 6, 7, 8, 9, 10];

//x- and y-positions of the two axes that serve as a frame for the ASF for linear ASFs
const dashedAxisTopStartLinear = {x: xStart, y: yStart}
const dashedAxisTopEndLinear = {x: xEnd, y: yStart}
const dashedAxisBottomStartLinear = {x: xStart, y: yEnd}
const dashedAxisBottomEndLinear = {x: xEnd, y: yEnd}

//x- and y-positions of the two axes that serve as a frame for the ASF for non-linear ASFs
const dashedAxisTopStart = {x: xStart, y: yEnd}
const dashedAxisTopEnd = {x: xEnd, y: yEnd}
const dashedAxisMiddle1Start = {x: xStart, y: yMediumEndWithControl}
const dashedAxisMiddle1End = {x: xEnd, y: yMediumEndWithControl}
const dashedAxisMiddle2Start = {x: xStart, y: yMediumStartWithControl}
const dashedAxisMiddle2End = {x: xEnd, y: yMediumStartWithControl}
const dashedAxisBottomStart = {x: xStart, y: yStartWithControl + 20}
const dashedAxisBottomEnd = {x: xEnd, y: yStartWithControl + 20}


//The background SVG of the ASFs without control points
export const asfBackground = [
    <Axis id={"xAxis"} from={{x: xStart, y: (yStart / 2) + 10}} to={{x: xEnd, y: (yStart / 2) + 10}}/>,
    <Axis id={"yAxis"} from={yAxisStart} to={yAxisEnd}/>,
    <text x="50" y="30" fontSize="50px">1</text>,
    <text x="50" y="440" fontSize="50px">0</text>,
    <text x="40" y="830" fontSize="50px">-1</text>,
    <line x1="85" y1="21" x2="100" y2="21" stroke="rgb(0, 0, 0)" strokeWidth={2}/>,
    <line x1="85" y1="420" x2="100" y2="420" stroke="rgb(0, 0, 0)" strokeWidth={2}/>,
    <line x1="85" y1="820" x2="100" y2="820" stroke="rgb(0, 0, 0)" strokeWidth={2}/>,

    <DashedAxis id={"xAxis"} from={dashedAxisTopStartLinear} to={dashedAxisTopEndLinear}/>,
    <DashedAxis id={"xAxis"} from={dashedAxisBottomStartLinear} to={dashedAxisBottomEndLinear}/>,
];

//The background SVG of the ASFs with control points
export const asfBackgroundWithControlPoint = [
    <Axis id={"xAxis"} from={xAxisStartWithControl} to={xAxisEndWithControl}/>,
    <Axis id={"yAxis"} from={yAxisStartWithControl} to={yAxisEndWithControl}/>,
    <text x="50" y="430" fontSize="50px">1</text>,
    <text x="50" y="830" fontSize="50px">0</text>,
    <text x="40" y="1230" fontSize="50px">-1</text>,
    <line x1="85" y1="421" x2="100" y2="421" stroke="rgb(0, 0, 0)" strokeWidth={2}/>,
    <line x1="85" y1="820" x2="100" y2="820" stroke="rgb(0, 0, 0)" strokeWidth={2}/>,
    <line x1="85" y1="1220" x2="100" y2="1220" stroke="rgb(0, 0, 0)" strokeWidth={2}/>,

    <line x1="100" y1="1220" x2="100" y2="1620" stroke="rgb(0, 0, 0)" strokeWidth={2} strokeDasharray="5,5"/>,
    <line x1="100" y1="420" x2="100" y2="20" stroke="rgb(0, 0, 0)" strokeWidth={2} strokeDasharray="5,5"/>,

    <DashedAxis id={"xAxis"} from={dashedAxisTopStart} to={dashedAxisTopEnd}/>,
    <DashedAxis id={"xAxis"} from={dashedAxisMiddle1Start} to={dashedAxisMiddle1End}/>,
    <DashedAxis id={"xAxis"} from={dashedAxisMiddle2Start} to={dashedAxisMiddle2End}/>,
    <DashedAxis id={"xAxis"} from={dashedAxisBottomStart} to={dashedAxisBottomEnd}/>,
];

//The background SVG of the tiny ASFs
export const tinyAsfBackground = [
    <Axis id={"xAxis"} from={{x: 0, y: 0}} to={{x: 0, y: 80}}/>,
    <Axis id={"yAxis"} from={{x: 0, y: 40}} to={{x: 180, y: 40}}/>,
    <line x1="0" y1="0" x2="180" y2="0" stroke="rgb(0, 0, 0)" strokeWidth={2}/>,
    <line x1="0" y1="80" x2="180" y2="80" stroke="rgb(0, 0, 0)" strokeWidth={2}/>,
    <line x1="180" y1="0" x2="180" y2="80" stroke="rgb(0, 0, 0)" strokeWidth={2}/>,
];
//---------------------------------------------------------------------

//The following functions are needed, to handle point movements in ASFs
/**
 * Check whether the x-coordinate of a point is still in the ASF frame after a movement and adjust the position if needed
 * @param {number} viewBoxX The x-coordinate value of a point.
 * @return {number} The x-coordinate position after the check.
 */
export function checkViewBoxBoundariesX(viewBoxX){
    if (viewBoxX < 100) {
        viewBoxX = 100;
    }
    if (viewBoxX > 3200) {
        viewBoxX = 3200;
    }
    return viewBoxX;
}

/**
 * Check whether the y-coordinate of a point is still in the ASF frame after a movement and adjust the position if needed
 * @param {number} viewBoxY The y-coordinate value of a point.
 * @param {number} lowerBoundary The lower bound of the ASF frame.
 * @param {number} upperBoundary The upper bound of the ASF frame.
 * @return {number} The y-coordinate position after the check.
 */
export function checkViewBoxBoundariesY(viewBoxY, lowerBoundary = yEnd, upperBoundary = yStart){
    if (viewBoxY < lowerBoundary) {
        viewBoxY = lowerBoundary;
    }
    if (viewBoxY > upperBoundary) {
        viewBoxY = upperBoundary;
    }
    return viewBoxY;
}

/**
 * Check whether the y-coordinate of a control point is valid after a movement and adjust the position if needed
 * @param {number} controlPoint The y-coordinate of the control point.
 * @param {number} leftPoint The y-coordinate of the point on the left of the control point.
 * @param {number} rightPoint The y-coordinate of the point on the right of the control point.
 * @return {number} The control point position after the check.
 */
export function checkMaxYControlPointPosition(controlPoint, leftPoint, rightPoint){

    //Check if the point lies between the left and the right point in y-direction
    if ((controlPoint >= leftPoint && controlPoint <= rightPoint) || (controlPoint <= leftPoint && controlPoint >= rightPoint)){
        return controlPoint
    }
    //If not, find the closer point in y-direction
    else if (controlPoint >= leftPoint && controlPoint >= rightPoint){
        let closerPoint = leftPoint > rightPoint ? leftPoint : rightPoint;
        //calculate the maximal possible value
        let maxValue = yMediumStartWithControl - closerPoint;
        //Check if the control point lies in the valid range
        if (controlPoint > yMediumStartWithControl + maxValue){
            return yMediumStartWithControl + maxValue
        }
    } else {
        let closerPoint = leftPoint < rightPoint ? leftPoint : rightPoint;
        //calculate the maximal possible value
        let maxValue = closerPoint - yMediumEndWithControl;
        //Check if the control point lies in the valid range
        if (controlPoint < yMediumEndWithControl - maxValue){
            return yMediumEndWithControl - maxValue
        }
    }
    return controlPoint;
}

/**
 * For a list of points, invert all y-values (mirror them at the x-axis)
 * @param {[]} points All points in an ASF.
 * @param {number} xAxisCoordinate The coordinates of the x-axis (different for ASFs with and without control points)
 * @return {[]} The points with inverted y-coordinates.
 */
export function invertValues(points, xAxisCoordinate = 420){
    points.forEach(point => {
        if(point.y > xAxisCoordinate){
            point.y = xAxisCoordinate - (point.y - xAxisCoordinate)
        } else {
            point.y = xAxisCoordinate + (xAxisCoordinate - point.y)
        }
    })
}