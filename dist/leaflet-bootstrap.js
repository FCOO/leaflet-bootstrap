/****************************************************************************
leaflet-bootstrap-control-button.js

Create leaflet-control for jquery-bootstrap button-classes:
    L.control.bsButton( options )
    L.control.bsButtonGroup( options )
    L.control.bsRadioButtonGroup( options )



****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    var defaultButtonOptions = {
            center: true,
            square: true
        },

        _bsButtons = L.Control.extend({
            options: {
                position: 'topleft',
            },

            _createContent: function(){},

            onAdd: function() {
                var _this = this;
                this.options = $._bsAdjustOptions( this.options, defaultButtonOptions);
                if (this.options.list)
                    $.each(this.options.list, function(index, opt){
                        _this.options.list[index] = $._bsAdjustOptions( opt, defaultButtonOptions);
                });

                var container = this._createContent().get(0);

                L.DomEvent.disableClickPropagation( container );
                L.DomEvent.on(container, 'click', L.DomEvent.stop);
                L.DomEvent.on(container, 'click', this._refocusOnMap, this);

                return container;
            },
        });

        L.control.BsButton = _bsButtons.extend({
            _createContent: function(){ return $.bsButton(this.options); }
        });

        L.control.BsButtonGroup = _bsButtons.extend({
            options       : { vertical: true },
            _createContent: function(){ return $.bsButtonGroup(this.options); }
        });

        L.control.BsRadioButtonGroup = L.control.BsButtonGroup.extend({
//            options       : { vertical: true },
            _createContent: function(){ return $.bsRadioButtonGroup(this.options); }
        });


        L.control.bsButton           = function(options){ return new  L.control.BsButton(options);           };
        L.control.bsButtonGroup      = function(options){ return new  L.control.BsButtonGroup(options);      };
        L.control.bsRadioButtonGroup = function(options){ return new  L.control.BsRadioButtonGroup(options); };

}(jQuery, L, this, document));


;
/****************************************************************************
leaflet-bootstrap-control-modal.js

Create leaflet-control for jquery-bootstrap modal-content:
    L.control.bsModal( options )

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

        /***************************************************
        _bsModal = common constructor for bsModal and bsFoam as Leaflet controls
        ***************************************************/
        var _bsModal = L.Control.extend({
            options: {
                position: 'topcenter',
            },

            show: function() { this.$outerContainer.show(); },
            hide: function() { this.$outerContainer.hide(); },

            //_createModal
            _createModal: function(){
                //this.bsModal = ...;
            },

            //onAdd
            onAdd: function() {
                this.options = $._bsAdjustOptions(
                    this.options,
                    this._defaultOptions,
                    {
                        small       : true,
                        smallButtons: true,
                    }
                );

                //Craete the this.bsModal and this.$container
                var show = this.options.show;
                this.options.show = false;
                this._createModal();
                this.$container  = this.bsModal.bsModal.$container;
                this.$container.detach();

                //Adjust this.bsModal
                this.bsModal.show   = $.proxy(this.show, this);
                this.bsModal._close = $.proxy(this.hide, this);


                //Create the element
                var $result = $('<div/>').addClass('leaflet-control');
                $('<div/>')
                    .addClass('modal-dialog modal-inline modal-sm')
                    .append( this.$container )
                    .appendTo( $result );

                if (this.options.maxHeight)
                    this.$container.css('max-height', this.options.maxHeight);
                if (this.options.minWidth)
                    this.$container.css('min-width', this.options.minWidth);
                if (this.options.width)
                    this.$container.css('width', this.options.width);

                var result = $result.get(0);
                L.DomEvent.disableClickPropagation( result );

                this.$outerContainer = $result;
                this.options.show = show;
                this.options.show ? this.show() : this.hide();
                return result;
            },
        });

        /***************************************************
        L.control.BsModal
        ***************************************************/
        L.control.BsModal = _bsModal.extend({
            _defaultOptions : {
                show               : true,
                closeButton        : false,
                noCloseIconOnHeader: true
            },

            _createModal: function(){
                this.bsModal = $.bsModal( this.options );
            }
        });


        /***************************************************
        L.control.BsModalForm
        ***************************************************/
        L.control.BsModalForm = _bsModal.extend({
            _defaultOptions : {
                show               : false,
//                noCloseIconOnHeader: true
            },

            _createModal: function(){
                this.bsModalForm = $.bsModalForm( this.options );
                this.bsModal = this.bsModalForm.$bsModal;
            },

            //edit
            edit: function(  values, tabIndexOrId ){
                this.bsModalForm.edit(  values, tabIndexOrId );
            }

        });


        //*************************************
        L.control.bsModal     = function(options){ return new L.control.BsModal(options); };
        L.control.bsModalForm = function(options){ return new L.control.BsModalForm(options); };

}(jQuery, L, this, document));


;
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
        },

        _bsMarker_onDragEnd  : function(){
            setTimeout( $.proxy( this._map.includeNextEvent, this._map, 'click'), 100 );
        },

    });


    L.bsMarker = function bsMarker(latlng, options) {
        return new L.BsMarker(latlng, options);
    };

}(jQuery, L, this, document));


;
/****************************************************************************
leaflet-bootstrap-popup.js

Adjust standard Leaflet popup to display as Bootstrap modal

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    //Overwrite default Popu-options: Remove default leaflet closeButton
    L.Popup.prototype.options.closeButton = false;


    //Add methods to pin or unpin popup
    L.Popup.prototype._setPinned = function(pinned) {
        this.options._pinned = pinned;
        this.options.closeOnEscapeKey = !pinned;
        this.options.autoClose        = !pinned;
    };

    //popup._brintToFocus: Close the open popup (if any and not fixed) and bring this to front
    L.Popup.prototype._brintToFocus = function() {
        this.bringToFront();
        if (this._map && this._map._popup && this._map._popup !== this && !this._map._popup.options._pinned)
            this._map.closePopup(this._map._popup);
    };

    function popup_getEvents_preclick(){
        if (!this.options._pinned)
            this._close();
    }

    //Adjust Popup.getEvents to adjust preclick
    L.Popup.prototype.getEvents = function (getEvents) {
        return function() {
            var events = getEvents.apply(this, arguments);
            if (this.options.fixable)
                events.preclick = events.preclick ? popup_getEvents_preclick : null;
            return events;
        };
    } (L.Popup.prototype.getEvents);

    //Adjust Popup.initialize
    L.Popup.prototype.initialize = function (initialize) {
        return function (options) {
            if (options && options.fixable)
                this.onPin = $.proxy( this._setPinned, this);


            return initialize.apply(this, arguments);
        };
    } (L.Popup.prototype.initialize);


    //Overwrite L.Layer.bindPopup to create popup with Bootstrap-components
    L.Layer.prototype.bindPopup = function (bindPopup) {
        return function (content/*, options*/) {
            //content can be 1: string or function, 2: object with the content, 3: Full popup-options
            return bindPopup.call(this, L.popup( ($.isPlainObject(content) && !!content.content) ? content : {content: content} ));
        };
    } (L.Layer.prototype.bindPopup);

    //Overwrite L.Popup._initLayout to create popup with Bootstrap-components
    L.Popup.prototype._initLayout = function (_initLayout) {
        return function () {

            var addCloseButton = this.options.closeButton; //Save options for modal-content

            //Adjust options for leaflet popup
            this.options.closeButton = false; //No default leaflet close
            if (this.options.scroll)
                this.options.maxHeight = this.options.maxHeight || 300; //maxHeight must be set if content is inside a scroll

            //Original function/method
            _initLayout.apply(this, arguments);

            //Set class-name for wrapper to remove margin, bg-color etc.
            $(this._wrapper).addClass('modal-wrapper');

            //Get the content-node
            var $contentNode = $(this._contentNode),
                modalOptions = $.extend(true, {
                    small         : true,
                    smallButtons  : true,
                    icons         : {
                        close: {
                            onClick: $.proxy(this._onCloseButtonClick, this)
                        }
                    },
                    onPin         : this.onPin,
                    noHeader      : !this.options.header,
                    contentContext: this,
                },
                this.options );

            modalOptions.closeButton = addCloseButton;

            //Build the content as a Bootstrap modal
            $contentNode
                .addClass('modal-inline modal-sm')
                ._bsModalContent( modalOptions );


            //Set max-height of inner modal-container
            if (this.options.maxHeight)
                $contentNode.bsModal.$container.css('max-height', this.options.maxHeight);

            //Close open popup and brint to front when "touched"
            L.DomEvent.on(this._contentNode, 'mousedown', this._brintToFocus, this );


        };
    } (L.Popup.prototype._initLayout);

}(jQuery, L, this, document));




;
/****************************************************************************
    leaflet-bootstrap.js,

    (c) 2017, FCOO

    https://github.com/FCOO/leaflet-bootstrap
    https://github.com/FCOO

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";


    //Override L.DivOverlay._updateContent to also accept content-object from jquery-bootstrap
    L.DivOverlay.prototype._updateContent = function (_updateContent) {
        return function () {
            if (!this._content) { return; }

            var $node = $(this._contentNode);
            var content = $.isFunction(this._content) ? this._content(this._source || this) : this._content;

            $node.empty();

            if ((typeof content === 'string') || (content instanceof HTMLElement))
                //Use original function/method
                _updateContent.apply(this, arguments);
            else {
                $node._bsAddHtml( content );
                this.fire('contentupdate');
            }
        };
    } (L.DivOverlay.prototype._updateContent);

/*
Map.mergeOptions({
    zoomControl: true
});
Map.addInitHook(function () {
    if (this.options.zoomControl) {
        this.zoomControl = new Zoom();
        this.addControl(this.zoomControl);
    }
});

*/


/*
    //Extend base leaflet class
    L.LeafletBootstrap = L.Class.extend({
        includes: L.Mixin.Events,

    //or extend eq. L.Control
    //L.Control.LeafletBootstrap = L.Control.extend({

    //Default options
        options: {
            VERSION: "1.2.0"

        },

        //initialize
        initialize: function(options) {
            L.setOptions(this, options);

        },

        //addTo
        addTo: function (map) {
            L.Control.prototype.addTo.call(this, map); //Extend eq. L.Control

            return this;
        },


        //onAdd
        onAdd: function (map) {
            this._map = map;
            var result = L.Control.Box.prototype.onAdd.call(this, map );

            //Create the object/control


            return result;
        },

        //myMethod
        myMethod: function () {

        }
    });
*/

    //OR/AND extend a prototype-method (METHOD) of a leaflet {CLASS}

    /***********************************************************
    Extend the L.{CLASS}.{METHOD} to do something more
    ***********************************************************/
/*
    L.{CLASS}.prototype.{METHOD} = function ({METHOD}) {
        return function () {
    //Original function/method
    {METHOD}.apply(this, arguments);

    //New extended code
    ......extra code

        }
    } (L.{CLASS}.prototype.{METHOD});
*/


}(jQuery, L, this, document));



