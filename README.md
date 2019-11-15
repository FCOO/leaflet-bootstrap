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

### L.control.bsButton
Create leaflet control a la `$.bsButton`, `$.bsButtonGroup`, and `$.bsRadioButtonGroup`: See [FCOO/jquery-bootstrap](https://github.com/FCOO/jquery-bootstrap#button)

    L.control.bsButton( options )
    L.control.bsButtonGroup( options )
    L.control.bsRadioButtonGroup( options )

### L.control.bsButtonBox(options)
Create a `L.Control.bsButton`. When clicked it opens a box with content

#### `options` 
    {
        //Default options for buton
        icon: ...
        text:.... 

        content: ...
    }


`options.content` is either [bsModal-options](https://github.com/FCOO/jquery-bootstrap#modal) OR a `function($container, options, onToggle)` creating the content inside `$container` 

    //Default bsModal-options
    {
        closeButton     : false,
        clickable       : true,
        semiTransparent : true,
        extended        : null,
        minimized       : null,
        isExtended      : false,
        isMinimized     : false,
        width           : 100,
    }


### L.control.bsScale(options)
Create a `bsButtonBox` with graphic scale with metric and/or nautical scale(s)
Based on [leaflet-graphicscale](https://github.com/nerik/leaflet-graphicscale) by [Erik Escoffier](https://github.com/nerik) 

#### `options` 
    {
        icon                : 'fa-ruler-horizontal',//Icon for bsButton
        mode                : 'both',               //'metric', 'nautical', or 'both'
        position            : 'bottomleft',
        maxUnitsWidth       : 200,                  //Max width
        maxUnitsWidthPercent: 90,                   //Max width as percent of map wisth
    }

See `src/5_leaflet-bootstrap-control-scale.js` for more details


### L.control.bsZoom(options)
Create a extended zoom-control with history of previous {zoom,center} on the map
	
	L.control.bsZoom({position: 'topleft'}).addTo(map)
	//OR
	var map = L.map('map',{
		          bsZoomControl: true,
        	      bsZoomOptions: {position: 'topleft'}
			  });

See `src/6_leaflet-bootstrap-control-zoom.js` for more details

### L.popup
Extended to take same options as bsModal (see details [here](https://github.com/FCOO/jquery-bootstrap#modal))
    
#### `options` 
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

#### Methods
        setMode( mode )

 
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

