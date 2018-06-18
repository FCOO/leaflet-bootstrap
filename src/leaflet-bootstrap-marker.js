/****************************************************************************
leaflet-bootstrap-marker.js,

Create L.bsMarker = a round marker with options for color, shadow and pulsart

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    var bsMarkerIcon = L.divIcon({
            iconSize        : [14, 14],    //Size of the icon image in pixels.
            iconAnchor      : null,        //The coordinates of the "tip" of the icon (relative to its top left corner). The icon will be aligned so that this point is at the marker's geographical location. Centered by default if size is specified, also can be set in CSS with negative margins.
            //popupAnchor     : [0,0],       //The coordinates of the point from which popups will "open", relative to the icon anchor.
            //tooltipAnchor   : [0,0],       //The coordinates of the point from which tooltips will "open", relative to the icon anchor.
            className       : 'lbm-icon',  //A custom class name to assign to both icon and shadow images. Empty by default.
    });

    //Extend L.Map with ignoreNextEvent(type) and includeNextEvent(type) to prevent the next firing of a event
    L.Map.prototype.fire = function ( fire ){
        return function ( type ) {
            return this._ignoreNextEvent[type] ? this.includeNextEvent( type ) : fire.apply(this, arguments);
        };
    } (L.Map.prototype.fire);

    L.Map.prototype.initialize = function (initialize) {
        return function () {
            this._ignoreNextEvent = {};
            return initialize.apply(this, arguments);
        };
    } (L.Map.prototype.initialize);


    L.Map.prototype.ignoreNextEvent = function( type ){
        this._ignoreNextEvent[type] = true;
        return this;
    };
    L.Map.prototype.includeNextEvent = function( type ){
        this._ignoreNextEvent[type] = false;
        return this;
    };

    var classNames = {
            transparent  : 'lbm-transparent',
            bigShadow    : 'lbm-big-shadow',
            whiteBorder  : 'lbm-border-white',
            puls         : 'lbm-puls'
        };

    L.BsMarker = L.Marker.extend({
        options: {
            draggable    : false,           //Whether the marker is draggable with mouse/touch or not.
            autoPan      : true,            //Sit to true if you want the map to do panning animation when marker hits the edges.
            tooltipAnchor: [20,20],
            icon         : bsMarkerIcon,

            transparent  : false,           //True to make the marker semi-transparent
            bigShadow    : false,           //true to add big shadow to the marker
            whiteBorder  : false,           //true to have a white border
            puls         : false,           //true to have a pulsart icon
            color        : '',              //Name of color: "primary", "secondary", "success", "info", "warning", "danger", "standard". "primary"-"danger"=Bootstrap colors. "standard" = Google Maps default iocn color
        },

        /*****************************************************
        initialize
        *****************************************************/
        initialize: function(latLng, options){
            L.Marker.prototype.initialize.call(this, latLng, options);

            //Create $icon to hold class-names
            this.$icon = $('<div/>');

            this.toggleOption('transparent', !!this.options.transparent );
            this.toggleOption('bigShadow',   !!this.options.bigShadow );
            this.toggleOption('whiteBorder', !!this.options.whiteBorder );
            this.toggleOption('puls',        !!this.options.puls );
            if (this.options.color)
                this.setColor(this.options.color);

            this.on('dragstart', this._bsMarker_onDragStart, this );
            this.on('dragend',   this._bsMarker_onDragEnd,   this );
        },

        /*****************************************************
        onAdd
        *****************************************************/
        onAdd: function( map ){
            L.Marker.prototype.onAdd.call(this, map);
            var classNames = this.$icon[0].className;
            this.$icon = $(this._icon);
            this.$icon.addClass( classNames );

            if (this.options.tooltip)
                this.bindTooltip(this.options.tooltip, {
                    sticky     : true,  //If true, the tooltip will follow the mouse instead of being fixed at the feature center.
                    interactive: false, //If true, the tooltip will listen to the feature events.
                });
        },

        /*****************************************************
        addClass, removeClass, toggleClass
        *****************************************************/
        addClass   : function(){ this.$icon.addClass.apply   ( this.$icon, arguments ); },
        removeClass: function(){ this.$icon.removeClass.apply( this.$icon, arguments ); },
        toggleClass: function(){ this.$icon.toggleClass.apply( this.$icon, arguments ); },

        /*****************************************************
        toggleOption(optionId) - Toggle the state of options[optionId]
        *****************************************************/
        toggleOption: function( optionId, state ){
            this.options[optionId] = typeof state === "boolean" ? state : !this.options[optionId];
            this.toggleClass( classNames[optionId], this.options[optionId]);
        },

        /*****************************************************
        setColor( colorName )
        *****************************************************/
        setColor: function( colorName ){
            if (this.colorName)
                this.removeClass('lbm-'+this.colorName);
            this.colorName = colorName;
            if (this.colorName)
                this.addClass('lbm-'+this.colorName);
        },

        /*****************************************************
        _bsMarker_onDragStart - Fired when the drag starts: Mark the map to ignore next click
        _bsMarker_onDragEnd - Fired when the drag ends: Mark the map to include click within 10ms
        *****************************************************/
        _bsMarker_onDragStart: function(){
            this._map.ignoreNextEvent('click');
            if (this._tooltip)
                this._tooltip.setOpacity(0);
        },

        _bsMarker_onDragEnd  : function(){
            setTimeout( $.proxy( this._map.includeNextEvent, this._map, 'click'), 100 );
            if (this._tooltip)
                this._tooltip.setOpacity(0.9);
        },

    });


    L.bsMarker = function bsMarker(latlng, options) {
        return new L.BsMarker(latlng, options);
    };

}(jQuery, L, this, document));

