import React, { useEffect, Fragment } from 'react';
import { withRouter } from 'react-router-dom';

//This functions scrolls automatically to the top when a new page is loaded
//Copied from Stackoverflow https://stackoverflow.com/questions/36904185/react-router-scroll-to-top-on-every-transition
function ScrollToTop({ history, children }) {
    useEffect(() => {
        const unlisten = history.listen(() => {
            window.scrollTo(0, 0);
        });
        return () => {
            unlisten();
        }
    }, []);

    return <Fragment>{children}</Fragment>;
}

export default withRouter(ScrollToTop);