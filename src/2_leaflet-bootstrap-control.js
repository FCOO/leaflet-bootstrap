/****************************************************************************
leaflet-bootstrap-control.js

L.BsControl = extention of L.Control with


****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

/*


    L.A = L.Control.extend({
        options: {
            a: 1
        },

        initialize: function(options){
            L.Util.setOptions(this, options);
            console.log('initialize A', options, this.options);
        },
    })

    L.B = L.A.extend({
        options: {
            b: 2
        },

        initialize: function(options){
            L.Util.setOptions(this, options);
            console.log('initialize B', options, this.options);
        },
    })

    var b = new L.B({c:3});
    console.log('b.a',b.options.a, b.options);
    console.log('b.b',b.options.b, b.options);
b.options.a = 'NIELS';
var b2 = new L.B({c:4});
    console.log('b.a',b.options.a, b2.options);
*/
//******************************************************************************************
/*
var MyBoxClass = L.Class.extend({

    options: {
        width: 1,
        height: 1
    },

    initialize: function(name, options) {
        this.name = name;
        L.setOptions(this, options);
    }

});

var instance = new MyBoxClass('Red', {width: 10});

console.log(instance.name); // Outputs "Red"
console.log(instance.options.width); // Outputs "10"
console.log(instance.options.height); // Outputs "1", the default

var MyCubeClass = MyBoxClass.extend({
    options: {
        depth: 1
    }
});

var instance = new MyCubeClass('Blue');

console.log(instance.options.width); // Outputs "1", parent class default
console.log(instance.options.height); // Outputs "1", parent class default
console.log(instance.options.depth); // Outputs "1"
console.log(instance.options);

*/


//******************************************************************************************



    var controlTooltipPane = 'controlTooltipPane';

    L.BsControl = L.Control.extend({
        options: {
            settings        : null,     //Default settings
          //onClick                     //function when click on element with tooltip = this._getTooltipElements()
            tooltip         : null,     //Individuel tooltip
            tooltipDirection: null,     //Default = auto detection from control's position

            leftClickIcon   : null, //Icon used for left-click
            rightClickIcon  : null, //Icon used for right-click
            closeText       : {da:'Luk', en:'Close'},
            settingText     : {da:'Indstillinger', en:'Settings'},
            popupTrigger    : null, //Default: contextmenu and click for touch, contextmenu for no-touch
            popupList       : null, //[] of items for bsPopoverMenu
        },

        initialize: function ( options ) {
            L.Util.setOptions(this, options);
        },

        _getTooltipElements: function( container ){
            return this.options.getTooltipElements ? this.options.getTooltipElements(container) : $(container);
        },

        _getPopupElements: function( container ){
            return this._getTooltipElements(container);
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

                var controlContainer = map._controlContainer;

                //Prevent event on control-container from map
                L.DomEvent.on(controlContainer, 'contextmenu dblclick', L.DomEvent.stop);

                //Close all popup on the map when contextmenu on any control
                $(controlContainer).on('touchstart mousedown', $.proxy(map.closeAllPopup, map));

                $(controlContainer).on('touchstart mousedown', $.proxy(map.closeAllPopup, map));
            }


            //Create and add popup
            var $popupElements = this._getPopupElements(this.getContainer()),
                hasPopup = $popupElements && $popupElements.length && this.options.popupList,
                $tooltipElements = this._getTooltipElements(this.getContainer()),
                hasTooltip = hasPopup && $tooltipElements && $tooltipElements.length && !window.bsIsTouch;

            if (hasPopup){
                $popupElements.on( 'click', function(){ $popupElements.popover('hide'); });

                if (hasTooltip)
                    $popupElements
                        .on( 'show.bs.popover',   $.proxy(this.tooltip_mouseleave, this))
                        .on( 'hidden.bs.popover', $.proxy(this.tooltip_popover_hide, this));


                var popupTrigger = this.options.popupTrigger ?
                                   this.options.popupTrigger :
                                   window.bsIsTouch ? 'click contextmenu' : 'contextmenu';
//                                   'contextmenu';

                $popupElements.bsMenuPopover({
                    trigger     : popupTrigger,
                    delay       : popupTrigger == 'hover' ? 1000 : 0,
                    closeOnClick: true,
                    small       : true,
                    placement   : 'top',
                    list        : this.options.popupList
                });
            }


            function includes(substring){
                return pos.indexOf(substring) !== -1;
            }


            if (hasTooltip){

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
                $tooltipElements
                    .on( 'mouseenter',  $.proxy(this.tooltip_mouseenter, this))
                    .on( 'mousemove',   $.proxy(this.tooltip_mousemove,  this))
                    .on( 'mouseleave',  $.proxy(this.tooltip_mouseleave, this));


                //Set tooltip content
                this._controlTooltipContent = [


                ];

            }


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

