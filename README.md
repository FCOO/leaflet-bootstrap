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
        iconSize        : 0,                //0: normal, 1. larger with icon or umber, 2: Very large (touch-mode)
        iconClass       : '',               //Fontawesome Font class-name ("fa-home") for icon inside the marker
        number          : undefined,        //Number inside the marker

        draggable       : false,           //Whether the marker is draggable with mouse/touch or not.
        autoPan         : true,            //Sit to true if you want the map to do panning animation when marker hits the edges.

        useBigIcon      : false,            //True to make the icon big
        bigIconWhenTouch: false,            //True to make big icon when window.bsIsTouch == true and options.draggable == true
        transparent     : false,            //True to make the marker semi-transparent
        hover           : false,            //True to show shadow and 0.9 opacuity for lbm-transparent when hover
        shadow          : false,            //true to add a shadow to the marker
        puls            : false,            //true to have a pulsart icon
        colorName       : '',    	        //Class-name to give the color of the marker
        borderColorName : '',               //Class-name to give the border-color
        tooltip                 : null,     //Content of tooltip
        tooltipPermanent        : false,    //Whether to open the tooltip permanently or only on mouseover.
        tooltipHideWhenDragging : false,    //True and tooltipPermanent: false => the tooltip is hidden when dragged
        tooltipHideWhenPopupOpen: false     //True and tooltipPermanent: false => the tooltip is hidden when popup is displayed
        shadowWhenPopupOpen     : true      //When true a shadow is shown when the popup for the marker is open
    }

    
    color and border-color:
    "pink"
    "purple"
    "red"
    "orange"
    "yellow"
    "green"
    "cyan"
    "blue"
    "brown"
    "white"
    "grey"
    "black"
    "indigo"
    "teal"
    "darkgray"
    "black"
    "primary"
    "secondary"
    "success"
    "info"
    "warning"
    "danger"
    "light"
    "dark"
    "standard" = rgba(66, 133, 244) = google maps color for location icon

    
    //Methods
    .toggleOption(optionId)             //Toggle the state of options[optionId]
    .setColor( colorName )              //Set the color
    .setBorderColor( borderColorName )  //Set the border-color
    .setSize(sizeIndex)                 //Set the size of the marker (0-2)
    .setIconClass( iconClass, minSize ) //Set the classname for the icon inside the marker
    .setNumber( number, minSize )       //Set a number inside the marker
    .asIcon()                           //Return options for this as icon in bsHeader etc.



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


### leaflet-polyline
Including [fcoo/leaflet-polyline](https://github.com/FCOO/leaflet-polyline) and create extra colors for line- and fill-color

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

