import React from 'react'

class ScoreAssignment extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            points: [],
            error: false,
            key: 0,

        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleLeaveField = this.handleLeaveField.bind(this);
    }

    /**
     * Life-cycle method that initializes all categories and sets them as state
     */
    componentWillMount() {
        let i;
        let points = [];

        //Check if some points were loaded from the options
        //If this is not the case, the points are initialized
        // Also convert all the categories into Strings (as some can be numbers and cause errors)
        if (this.props.points.length === 0) {
            for (i = 0; i < this.props.categories.length; i++) {
                let point = {value: "", error: "", touched: false, category: String(this.props.categories[i])}
                points.push(point);
            }
        }
        //If the points already exist, they are reloaded
        else {
            points = this.props.points;
        }
        this.setState({points: points, key: Math.random()}, () => {
            this.checkErrors();
            this.props.handler(points)
        })
    }

    /**
     * Helper method that handles a change in one input field (e.g. addition or deletion of one character)
     * @param {Object} event The event of the changed input field
     */
    handleInputChange(event) {
        let points = this.state.points;

        let index = points.findIndex(element => element.category === event.currentTarget.id);
        let point = points[index]

        points[index] = {value: event.target.value, error: "", touched: true, category: point.category};
        this.setState({points: points, key: Math.random()})
    }

    /**
     * Handle a leave-field event (when a user exits the focus of an input field)
     * @param {Object} event The event of the changed input field
     */
    handleLeaveField(event) {
        let points = this.state.points;

        let index = points.findIndex(element => element.category === event.currentTarget.id);
        let point = points[index]
        let error = "";
        let valueAsNumber = "";

        //Convert the value into a number
        if (!(event.target.value === "")) {
            valueAsNumber = Number(event.target.value)
        }

        //Check if the new value is valid
        if (valueAsNumber > 1 || valueAsNumber < -1) {
            error = "The neutral value must be between -1 and +1";
        }
        //Check if the new value is a number
        if (isNaN(valueAsNumber)) {
            error = "Only numeric values between +1 and -1 are accepted."
        }

        //Update the point and state
        points[index] = {value: valueAsNumber, error: error, touched: true, category: point.category};
        this.setState({points: points, key: Math.random()}, () => {
            this.checkErrors();
            this.props.handler(points)
        })
    }

    handleonSubmit(event){
        event.preventDefault();
        return false
    }

    /**
     * Helper method that checks if there exists errors in one of the input fields
     */
    checkErrors() {
        let points = this.state.points;
        let overallError = false;

        //Loop through all points and check the error messages
        points.forEach(point => {
            if (point.error !== '') {
                overallError = true;
            }
        })
        this.setState({error: overallError})
    }

    render() {
        let elements = [];
        let points = this.state.points;
        const self = this;

        //Create input boxes for all categories
        points.forEach(point => {
            elements.push(<>
                    <form onSubmit={self.handleonSubmit} style={{width: '400px'}}>
                        <div>
                            <label className='text'>
                                {point.category === '' ? 'Missing' : point.category}:

                            </label>
                            <input type="text" id={point.category} value={point.value} onChange={self.handleInputChange}
                                   className='scoreAssignment'
                                   style={point.error ? {color: "red"} : {color: "black"}} onBlur={self.handleLeaveField}/>
                        </div>
                    </form>
                </>
            )
        })

        return (
            <>
                <p className='text'>Please assign a score between -1 (less preferred) and +1 (more preferred) to every
                    category.</p>
                <div style={{paddingBottom: '20px'}}>{elements}</div>
                {this.state.error ?
                    <p className='text' style={{paddingTop: '0px', color: "red"}}>There are some errors present in the
                        individual scores</p> : <></>}
            </>
        );
    }
}

export default ScoreAssignment;
