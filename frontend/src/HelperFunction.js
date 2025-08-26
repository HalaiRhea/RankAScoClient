//This file contains all helper functions that are needed for the calculations of the ASFs and the ranking

//--------------------ASF Calculation--------------------
/**
 * Calculate the position of an attribute value on the Bézier Curve.
 * To read more about Bézier curves please have a look at my thesis or check out the external documentation.
 * @param {Object} leftPoint The point on the left of a line segment.
 * @param {Object} rightPoint The point on the right of a line segment.
 * @param {Object} controlPoint The control point of the line segment.
 * @param {number} value The attribute value.
 * @return {number} The position of the attribute value on the bezier curve.
 */
export function bezierCurve(leftPoint, rightPoint, controlPoint, value) {
    let t = findT(leftPoint, rightPoint, controlPoint, value);
    let normalizedYLeft = leftPoint.normalizedY, normalizedYRight = rightPoint.normalizedY;
    return calculateBezierValue(normalizedYLeft, normalizedYRight, controlPoint.normalizedY, t);
}

/**
 * Find the t value for an attribute value.
 * @param {Object} leftPoint The point on the left of a line segment.
 * @param {Object} rightPoint The point on the right of a line segment.
 * @param {Object} controlPoint The control point of the line segment.
 * @param {number} value The attribute value.
 * @return {number} The t value of the attribute value.
 */
function findT(leftPoint, rightPoint, controlPoint, value) {
    let a = leftPoint.normalizedX - 2 * controlPoint.normalizedX + rightPoint.normalizedX;
    let b = 2 * (controlPoint.normalizedX - leftPoint.normalizedX);
    let c = leftPoint.normalizedX - value;

    //The a value cannot be zero
    if (a === 0) {
        a = 0.0000001;
    }

    if (b * b - 4 * a * c >= 0) {
        //Find the right version of the MNF value
        let positiveMNF = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
        let negativeMNF = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);

        if (positiveMNF > 1 || positiveMNF < 0) {
            return negativeMNF;
        }
        if (negativeMNF > 1 || negativeMNF < 0) {
            return positiveMNF;
        }
        return 0;
    } else {
        return 0;
    }
}

/**
 * Calculate the position of an attribute value based on the t value.
 * @param {Object} leftPoint The point on the left of a line segment.
 * @param {Object} rightPoint The point on the right of a line segment.
 * @param {Object} controlPoint The control point of the line segment.
 * @param {number} t The t value.
 * @return {number} The function value of the attribute value.
 */
function calculateBezierValue(leftPoint, rightPoint, controlPoint, t) {
    let firstTerm = (leftPoint - (2 * controlPoint) + rightPoint) * Math.pow(t, 2);
    let secondTerm = ((2 * controlPoint) - (2 * leftPoint)) * t;
    return firstTerm + secondTerm + leftPoint;
}

/**
 * Calculate the y-value of a point on a line when the slope and x-value are given
 * @param {number} x_value The x-value of a point.
 * @param {number} slope The slope of the line.
 * @param {number} constant The constant in the mathematical line equation.
 * @return {number} The y-value of a point.
 */
export function transformLinear(x_value, slope, constant) {
    return x_value * slope + constant;
}

/**
 * Calculate the slope of a line when two points are given
 * @param {number} x_old The x-value of the first point.
 * @param {number} x_new The x-value of the second point.
 * @param {number} y_old The y-value of the first point.
 * @param {number} y_new The y-value of the second point.
 * @return {number} The slope of the line.
 */
export function findSlope(x_old, x_new, y_old, y_new) {
    return (y_new - y_old) / (x_new - x_old);
}

/**
 * Calculate the y-value of a function when x is zero.
 * @param {number} x_old The x-value of the point.
 * @param {number} y_old The y-value of the point.
 * @param {number} slope The slope of the line segment.
 * @return {number} The constant of the function.
 */
export function findConstant(x_old, y_old, slope) {
    return y_old - x_old * slope;
}

//--------------------Data preparation--------------------
/**
 * Returns all attribute values as a list for a given attribute name
 * @param {number} columnName The name of an attribute.
 * @param {[]} dataSet The complete data set.
 * @return {[]} The list containing all attribute values.
 */
export function filterNumerical(columnName, dataSet) {
    let attributeValues = dataSet.map(object => object[columnName]).map(value => parseInt(value, 10));
    //Filter out all falsy attributes
    attributeValues = attributeValues.filter(Boolean);
    return attributeValues;
}

/**
 * Returns all attribute values as a list for a given attribute name
 * @param {number} columnName The name of an attribute.
 * @param {[]} dataSet The complete data set.
 * @return {[]} The list containing all attribute values.
 */
export function filterCategorical(columnName, dataSet) {
    let attributeValues = dataSet.map(object => object[columnName])
    //Find all unique categories and exclude null 
    const uniqueCategories = [];
    attributeValues.forEach(category => {
        if(category !== null){
            if (uniqueCategories.indexOf(category) === -1) {
                uniqueCategories.push(category)
            }
        }
    });
    //For each unique category, count how many items have this value
    let uniqueCategoriesCounted = []
    uniqueCategories.forEach(function (category) {
        let numberOfValues = [];
        numberOfValues.push(attributeValues.filter(object => object === category).length);
        if (category === undefined || category === '') {
            uniqueCategoriesCounted.push({'name': 'Undefined', data: numberOfValues})
        } else {
            uniqueCategoriesCounted.push({'name': category, data: numberOfValues})
        }
    });
    return uniqueCategoriesCounted;
}

/**
 * Normalizes a value with a min max normalization
 * @param {number} value The value that must be normalized.
 * @param {number} min The minimal value of the normalization.
 * @param {number} max The maximal value of the normalization.
 * @return {number} The normalized value.
 */
export function minMaxNormalization(value, min, max) {
    return ((value - min) / (max - min));
}
/**
 * Normalizes a value with a min max normalization where negative minimal values are accepted
 * @param {number} value The value that must be normalized.
 * @param {number} min The minimal value of the normalization.
 * @param {number} max The maximal value of the normalization.
 * @return {number} The normalized value.
 */
export function minMaxNormalizationMinus(value, min, max) {
    return (2 * ((value - min) / (max - min))) - 1;
}
