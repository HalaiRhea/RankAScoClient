import {Link} from 'react-router-dom'
import {numericalRome, categoricalRome } from "./HelperComponents";

// Check which browser user has
var Chrome = window.navigator.userAgent.indexOf('Chrome') !== -1
var browser_info = null

console.log((window.navigator.userAgent))
// if (window.navigator.userAgent.indexOf('Chrome') !== -1) { Chrome = true; }

// Give warning to user if browser is not chrome
if (Chrome){
browser_info = null
}
else {
browser_info = "Note: We strongly recommend using Chrome for the best user experience"
}


//This is the first page that is displayed to the user
//Every button loads a different data set
//More data sets can be added by adding more buttons
const Home = () => {
    return (
        <>
            <div>
                <h1 className='largeHeader'>RankASco</h1>
            </div>
            {/* Check browser and add warning */}
            <div><p className='text' style={{color:"red"}}>{browser_info}</p></div>
            <div><p className='text'>
                Please choose a data set to start.
            </p></div>
            <div className="contentpage" style={{paddingTop: '2%', paddingBottom: '5%', paddingLeft: '2%'}}>
                <div style={{paddingBottom: '2%', paddingLeft: '2%'}}>
                    <Link
                        to={{
                            pathname: '/dataLoading',
                            state: {
                                result: [],
                                selectedAttributes: [],
                                options: {},
                                categorical: categoricalRome,
                                numerical: numericalRome,
                                filename: 'data/rome-aribnb-data_small_noHostSince.csv'
                            }
                        }}>
                        <button className='button button-home'>Rome Dataset</button>
                    </Link>
                </div>
            </div>
            <div style={{paddingBottom: '17.5%'}}>
            </div>
        </>
    )
}

export default Home;
