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
Create leaflet control a la `$.bsButton`, `$.bsCheckboxButton`, `$.bsButtonGroup`, and `$.bsRadioButtonGroup`: See [FCOO/jquery-bootstrap](https://github.com/FCOO/jquery-bootstrap#button)

    L.control.bsButton( options )
    L.control.bsCheckboxButton( options )
    L.control.bsButtonGroup( options )
    L.control.bsRadioButtonGroup( options )

### L.control.bsButtonBox(options)
Create a `L.Control.bsButton`. When clicked it opens a box with content

#### `options` 
    //Default options for buton
    icon: ...
    text:.... 

    content: ...


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

	L.control.bsScale({position: 'topleft'}).addTo(map)
	//OR
	var map = L.map('map',{
		          bsScaleControl: true,
        	      bsScaleOptions: {position: 'topleft'}
			  });


#### `options` 
    icon                : 'fa-ruler-horizontal',//Icon for bsButton
    mode                : 'both',               //'metric', 'nautical', or 'both'
    position            : 'bottomleft',
    maxUnitsWidth       : 200,                  //Max width
    maxUnitsWidthPercent: 90,                   //Max width as percent of map width

See `src/25_leaflet-bootstrap-control-scale.js` for more details



### L.control.bsPosition(options)
Create a control with cursor or map center position. When map center is selected it is is possible to activate contextmenu for the center position.
Also possible to include/exclude other maps to show cursor-position from the other map or to show center position of original map in the other map(s)
	
	L.control.bsPosition({position: 'topleft'}).addTo(map)
	//OR
	var map = L.map('map',{
		          bsPositionControl: true,
        	      bsPositionOptions: {position: 'topleft'}
			  });

    var map2 = L.map('map2', {bsPositionControl: false });

    map.bsPositionControl.addOther(map2, true/false); //true: Only show cursor-position from the other map. false: Also show map-venter in the other map
    //OR
    map.bsPositionControl.removeOther(map2);


#### `options` 
    selectFormat: null    //function() to select format for position using latlng-format (fcoo/latlng-format)

See `src/35_leaflet-bootstrap-control-position.js` for more details

### L.control.bsZoom(options)
Create a extended zoom-control with history of previous {zoom,center} on the map
	
	L.control.bsZoom({position: 'topleft'}).addTo(map)
	//OR
	var map = L.map('map',{
		          bsZoomControl: true,
        	      bsZoomOptions: {position: 'topleft'}
			  });

See `src/40_leaflet-bootstrap-control-zoom.js` for more details

### L.control.bsLegend(options)
Create a `bsButtonBox ` with legends for different layers
	
	L.control.bsLegend().addTo(map);
	map.bsLegend.addLegend(...)
	map.bsLegend.addLegend(...)

See `src/45_leaflet-bootstrap-control-legend.js` for more details


### Contextmenu on the map and on elements

It is possible to add contextmenu to the map and elements on the map (marker, polygon etc.) using the following methods on the map or element-object.

All `items` are menu-items used by `$.bsMenu` . See [FCOO/jquery-bootstrap](https://github.com/FCOO/jquery-bootstrap#menu)  

#### `setContextmenuHeader: function(header)`

Set a header for the element. Used when the element is included in another elements contextmenu. See `setContextmenuParent` below


#### `addContextmenuItems: function ( items, prepend )
Append or prepend items to the contextmenu for the element

#### `appendContextmenuItems : function( items )`
Append items to the contextmenu for the element

#### `prependContextmenuItems: function( items )`
Prepend items to the contextmenu for the element


#### `setContextmenuWidth: function(width)`
Set the width of all the items

#### `setContextmenuParent: function(parent)`
Set another element as the "parent" of the element

#### `excludeMapContextmenu: function()`
Default include all contextmenu items from the map. 
Call the method to exclude the map-items


See `src/30_leaflet-bootstrap-contextmenu.js` for more details

#### Example
    var map = L.map('map', {...});
    
    map
        .addContextmenuItems([
            {icon:'fa-home', text:'1. map button', onClick: function(latlng){...} },
            {icon:'fa-map',  text:'2. map button', onClick: function(latlng){...} }
        ])
        .setContextmenuHeader('The map!');

    L.marker)( latLng, {...})
        .addTp(map)
        .addContextmenuItems([
            {text:'1. marker button', onClick: function(latlng){...} },
            {text:'2. marker button', onClick: function(latlng){...} },
            {text:'3. marker button', onClick: function(latlng){...} },
        ]);

Right-click on the marker will show a contextmenu with five buttons (tree from the marker, a header, and two from the map)    

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
        content, minimized, extended 



        fixable: false, //if true the popup can be pinned/fixed and only closes on the close-button
    }

    options.showTooltip: BOOLEAN, 
    options.minimized.showTooltip: BOOLEAN,
    options.extended.showTooltip: BOOLEAN    If true the tooltip of the source is shown in the popup.
    *** NOTE ***: showTooltip is only working on markers if the marker has tooltipHideWhenPopupOpen = true         

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

