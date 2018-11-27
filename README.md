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

### tooltip and popup

The leaflet method `bindTooltip` and `bindPopup `supports the following options in the "owner" of the tooltip/popup

    this.options: {
        tooltipPermanent        : false,    //Whether to open the tooltip permanently or only on mouseover.
        tooltipHideWhenDragging : false,    //True and tooltipPermanent: false => the tooltip is hidden when dragged
        tooltipHideWhenPopupOpen: false     //True and tooltipPermanent: false => the tooltip is hidden when popup is displayed
    }


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

