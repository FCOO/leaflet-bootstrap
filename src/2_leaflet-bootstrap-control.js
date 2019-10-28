/****************************************************************************
leaflet-bootstrap-control.js

L.BsControl = extention of L.Control with


****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var controlTooltipPane = 'controlTooltipPane';

    L.BsControl = L.Control.extend({
        options: {
            settings        : null,     //Default settings
          //onClick                     //function when click on element with tooltip = this._getTooltipElements()
            tooltip         : null,     //Individuel tooltip
            tooltipDirection: null,     //Default = auto detection from control's position
        },

        initialize: function ( options ) {
            L.Util.setOptions(this, options);
            this.hasSettings = !!this.options.settings;
        },

        //getSettings - return the current settings. Can be overwriten to get settings from some storages
        getSettings: function(){
            return this.options.settings;
        },

        //setSettings - To be overwriten - save the settings after change
        setSettings: function(/*settings*/){
            return true;
        },

        _getTooltipElements: function( container ){
            return $(container);
        },

        addTo: function(map) {
            var result = L.Control.prototype.addTo.apply(this, arguments);

            //Create pane to contain tooltip for control inside the map's control-container
            if (!map.getPane(controlTooltipPane))
                map.createPane(controlTooltipPane, map._controlContainer);

            //Create common tooltip for all controls on the map
            if (!map._controlTooltip){
                map._controlTooltip = L.tooltip({
                    pane        : controlTooltipPane,   //Map pane where the tooltip will be added.
                    offset	    : L.point(1, 1),        //Optional offset of the tooltip position.
                    direction   : 'auto',               //Direction where to open the tooltip. Possible values are: right, left, top, bottom, center, auto. auto will dynamically switch between right and left according to the tooltip position on the map.
                    permanent   : true,                //Whether to open the tooltip permanently or only on mouseover.
                    sticky      : true,                 //If true, the tooltip will follow the mouse instead of being fixed at the feature center.
                    interactive	: false,                //If true, the tooltip will listen to the feature events.
                    //opacity     : 	Number	0.9	Tooltip container opacity.
                    noWrap   : true
                })
                .setLatLng([0,0])
                .addTo(map);

                map.openTooltip(map._controlTooltip);
                map._controlTooltip.options.saveOpacity = map._controlTooltip.options.opacity;
                map._controlTooltip.setOpacity(0);

                //Prevent all event on control-container from map
                var controlContainer = map._controlContainer;
                L.DomEvent.disableClickPropagation( controlContainer );
                L.DomEvent.on(controlContainer, 'contextmenu', L.DomEvent.stop);
                L.DomEvent.on(controlContainer, 'click', this._refocusOnMap, this);


//HER                console.log(map._controlContainer);
/*
                $(map._controlContainer)
                    .on('click', function(event){
                        console.log('Click '+Math.random(), event);
                    })
                    .on('contextmenu', function(event){
                        console.log('contextmenu '+Math.random(), event);
                    })
*/
            }

            var $elements = this._getTooltipElements(this.getContainer());
            function includes(substring){
                return pos.indexOf(substring) !== -1;
            }

            if ($elements.length && !window.bsIsTouch){

                if (!this.options.tooltipDirection){
                    var pos = this.options.position.toUpperCase(),
                        dir = '';

                     if (pos == "TOPCENTER") dir = 'bottom';
                     else if (pos == "BOTTOMCENTER") dir = 'top';
                     else if (includes('LEFT')) dir = 'right';
                     else if (includes('RIGHT')) dir = 'left';

                    this.options.tooltipDirection = dir;
                }

                this._controlTooltip = this._map._controlTooltip;
                $elements
                    .on( 'mouseenter',                  $.proxy(this.tooltip_mouseenter, this))
                    .on( 'mousemove',                   $.proxy(this.tooltip_mousemove,  this))
                    .on( 'mouseleave show.bs.popover',  $.proxy(this.tooltip_mouseleave, this))
                    .on( 'hidden.bs.popover',           $.proxy(this.tooltip_popover_hide, this));
            }


    var list = [
            {type:'content', content: $('<div class="w-100">Davs</div>'), closeOnClick: false },
            {text:{da:'En overskrift', en:'A header'}},
            {id: 'button1', icon: 'fa-home', text:{da:'En knap', en:'A button'}, onClick: function(){
//HER                console.log('onClick button1', arguments)
            }},
            {id: 'checkbox1', type:'checkbox', selected: true,  _icon: ['far fa-square', 'far fa-check-square'], text:{da:'En checkbox#1', en:'A checkbox#1'}},
            {id: 'checkbox2', type:'checkbox', selected: false, _icon: ['far fa-square', 'far fa-check-square'], text:{da:'En checkbox#2', en:'A checkbox#2'}},
            {radioGroupId: 'radio1', type:'radio', lineBefore: true, lineAfter: true, _hidden: true, list: [
                    {id:'slow',   icon: 'fa-bicycle',   text:'Cykel', closeOnClick: false},
                    {id:'medium', icon: 'fa-car', text:'Bil', selected: true},
                    {id:'fast',   icon: 'fa-fighter-jet',   text:'Jetjaver'}
            ]}
        ];

if ($elements)
    $elements
    .bsMenuPopover({
        trigger: 'contextmenu',
        delay: 1000,
        closeOnClick: false,
        small: true,
        placement: 'top',
        list: list
    })
    .on('show.bs.popover', function(event){
        $elements.parent().trigger('contextmenu', event);
        return true;
    });




            return result;
        },

        tooltip_mouseenter: function(event){
            if (this._controlTooltipOff)
                return;
            this._controlTooltip.setContent({icon:'fa-home', text: Math.random()}/*MANGLER*/);
            this._controlTooltip.options.direction = this.options.tooltipDirection;
            this._setTooltipTimeOut(event, 400);
        },

        _setTooltipTimeOut: function(event, delay){
            if (this._tooltipTimeout)
                window.clearTimeout(this._tooltipTimeout);
            this._tooltipTimeout = window.setTimeout( $.proxy(this._showTooltip, this, event), delay || 200);
        },

        tooltip_mousemove: function(event){
            if (this._controlTooltipOff)
                return;
            if (this._controlTooltipVisible)
                this.hideTooltip();
            this._setTooltipTimeOut(event);
        },

        tooltip_mouseleave: function(event){
            this.hideTooltip();
            if (this._tooltipTimeout){
                window.clearTimeout(this._tooltipTimeout);
                this._tooltipTimeout = null;
            }
            if (event.type == 'show')
                //popover.show
                this._controlTooltipOff = true;
        },

        tooltip_popover_hide: function(){
            this._controlTooltipOff = false;
        },

        _showTooltip: function(event){
            if (event){
                this._tooltipTimeout = null;
                this._controlTooltipVisible = true;

                this._controlTooltip._setPosition( this._map.mouseEventToContainerPoint(event) );

                this._controlTooltip.setOpacity(this._controlTooltip.options.saveOpacity);
            }
        },

        hideTooltip: function(){
            if (this._controlTooltipVisible){
                this._controlTooltip.setOpacity(0);
                this._controlTooltipVisible = false;
            }
        },



    });

//HER    L.extend(L.BsControl.prototype, L.Evented.prototype);

}(jQuery, L, this, document));

