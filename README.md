# leaflet-bootstrap
>


## Description
Applying Bootstrap style and component to leaflet maps using [FCOO/jquery-bootstrap](https://github.com/FCOO/jquery-bootstrap)  

## Installation
### bower
`bower install https://github.com/FCOO/leaflet-bootstrap.git --save`

## Demo
http://FCOO.github.io/leaflet-bootstrap/demo/ 

## Usage
### L.bsMarker


    options: {
        useBigIcon      : false     //True to make the ico    var myMarker = L.bsMarker(latLng, options).addTo( map );n big
        bigIcon         : object    //L.DivIcon to be used if useBigIcon: true
        bigIconWhenTouch: false     //True to make big icon when window.bsIsTouch == true and options.draggable == true
        draggable       : false, 	//Whether the marker is draggable with mouse/touch or not.
        transparent     : false, 	//True to make the marker semi-transparent
        hover           : false,    //True to show big-shadow and 0.9 opacuity for lbm-transparent when hover
        bigShadow       : false, 	//true to add big shadow to the marker
        puls            : false, 	//true to have a pulsart icon
        color           : '',    	//Name of color
        borderColor     : ''        //Name of border-color. Same as color. "" => black border
        tooltip         : null,	    //Automatic adds a tooltip to the marker. The tooltip is hidden when the marker is dragged. See below on content
        tooltipPermanent: false     //Whether to open the tooltip permanently or only on mouseover.
    }

    /*
    color and border-color:
    "blue"
    "indigo"
    "purple"
    "pink"
    "green"
    "teal"
    "cyan"
    "white"
    "gray"
    "darkgray"
    "primary"
    "secondary"
    "success"
    "info"
    "warning"
    "danger"
    "light"
    "dark"        
    "standard" = rgba(66, 133, 244) = google maps color for location icon
    */
    
    //Methods
    .toggleOption(optionId) //Toggle the state of options[optionId]
    .setColor( colorName )  //Set the color
    .setBorderColor( borderColorName )  //Set the border-color


### L.Control.bsButton
Create leaflet control a la `$.bsButton`, `$.bsButtonGroup`, and `$.bsRadioButtonGroup`: See [FCOO/jquery-bootstrap](https://github.com/FCOO/jquery-bootstrap#button)

    L.control.bsButton( options )
    L.control.bsButtonGroup( options )
    L.control.bsRadioButtonGroup( options )


### L.popup
Extended to take same options as bsModal (see details [here](https://github.com/FCOO/jquery-bootstrap#modal))
    
    options: {
        maxWidth,
        maxHeight,
        scroll,
        header,
        closeButton     : true,
        buttons,
        verticalButtons : false,
        content

        fixable: false, //if true the popup can be pinned/fixed and only closes on the close-button
    }

    //Methods
    .changeContent(content, contentContext) //Only changes the content of the "body" of the bsModal inside the popup



### L.tooltip

Accepts common content a la [FCOO/jquery-bootstrap](https://github.com/FCOO/jquery-bootstrap#common) 

### L.control.bsModal
Create control a la `$.bsModal`

### L.control.bsModalForm
Create control a la `$.bsModalForm`

<!-- 
### options
| Id | Type | Default | Description |
| :--: | :--: | :-----: | --- |
| options1 | boolean | true | If <code>true</code> the ... |
| options2 | string | null | Contain the ... |

### Methods

    .methods1( arg1, arg2,...): Do something
    .methods2( arg1, arg2,...): Do something else
 -->


## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/FCOO/leaflet-bootstrap/LICENSE).

Copyright (c) 2017 [FCOO](https://github.com/FCOO)

