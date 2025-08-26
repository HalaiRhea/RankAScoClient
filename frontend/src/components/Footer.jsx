import React from "react";

//This component contains the footer that is used for pages that span more than one page
//It is added at the end of all UI elements
//It contains links to the UZH and IVDA group
function Footer() {
    return (
        <div style={{
            paddingLeft: '10px',
            paddingBottom: '10px',
            paddingTop: '10px',
        }} className='footer'>
            <div style={{display: 'inline'}}>
                <a href="https://www.uzh.ch/" target="_blank">
                    <img src={process.env.PUBLIC_URL + 'images/UZHLogoWhite.png'} width={'180px'}/></a>
            </div>
            <div style={{display: 'inline', float: 'right', paddingRight: '20px'}}>
                <a href="https://www.ifi.uzh.ch/en/ivda.html" target="_blank">
                    <img src={process.env.PUBLIC_URL + 'images/ivda.png'} width={'150px'}/>
                </a>
            </div>
        </div>
    );
}

export default Footer;