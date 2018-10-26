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
        _bsModal = common constructor for bsModal and bsForm as Leaflet controls
        ***************************************************/
        var _bsModal = L.Control.extend({
            options: {
                position: 'topcenter',
            },

            show: function() { this.$outerContainer.show(); },
            hide: function() { this.$outerContainer.hide(); },

            /********************************************************
            _createModal
            ********************************************************/
            _createModal: function(){
                //this.bsModal = ...;
            },

            /********************************************************
            onAdd
            ********************************************************/
            onAdd: function() {
                this.options = $._bsAdjustOptions(
                    this.options,
                    this._defaultOptions,
                    {
                        small       : true,
                        smallButtons: true,
                    }
                );
                var show = this.options.show;
                this.options.show = false;

                //Create the element
                var $result =
                        $('<div/>')
                            .addClass('leaflet-control'),
                    $modalContainer =
                        $('<div/>')
                            ._bsAddBaseClassAndSize({
                                baseClass   : 'modal-dialog',
                                class       : 'modal-dialog-inline',
                                useTouchSize: true,
                                small       : false
                            })
                            .append( this.$modalContent )
                            .appendTo( $result );


                //Prevent different events from propagating to the map
                $modalContainer.on('contextmenu mousewheel', function( event ) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                });

                //Add copy of _attachCloseHandler from select2 to close dropdown on mousedown on control
                $result.on('mousedown', function( event ) {
                    var $select = $(event.target).closest('.select2');

                    $('.select2.select2-container--open').each(function () {
                        if (this == $select[0])
                            return;
                        $(this).data('element').select2('close');
                    });
                });

                //Create this.bsModal and this.$modalContent
                this._createModal();

                this.$modalContent = this.bsModal.bsModal.$modalContent;

                $modalContainer.bsModal = this.bsModal.bsModal;

                //'Move the container into the control
                this.$modalContent.detach();
                $modalContainer.append( this.$modalContent );

                //Adjust this.bsModal
                this.bsModal.show   = $.proxy(this.show, this);
                this.bsModal._close = $.proxy(this.hide, this);

                //ASdjust width and height
                $modalContainer._bsModalSetHeightAndWidth();

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
                this.bsModalForm.edit( values, tabIndexOrId );
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
(function ($, L, window, document, undefined) {
    "use strict";

    var markerSizeList = [14, 20, 24], //MUST match $markerSizeList in _leaflet-bootstrap-marker.scss AND _leaflet-bootstrap-tooltip.scss
        iconList = [];
    $.each( markerSizeList, function( index, size ){
        iconList.push( L.divIcon({iconSize: [size, size], className: 'lbm-icon lbm-icon-'+index }) );
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
            hover        : 'lbm-hover',
            puls         : 'lbm-puls'
        };

    L.BsMarker = L.Marker.extend({
        options: {
            icon            : iconList[0],

            iconSize        : 0,                //0: normal, 1. larger with icon or umber, 2: Very large (touch-mode)
            iconClass       : '',               //Fontawesome Font class-name ("fa-home") for icon inside the marker
            number          : undefined,        //Number inside the marker

            draggable       : false,            //Whether the marker is draggable with mouse/touch or not.
            autoPan         : true,             //Set to true if you want the map to do panning animation when marker hits the edges.

            useBigIcon      : false,            //True to make the icon big
            bigIconWhenTouch: false,            //True to make big icon when window.bsIsTouch == true and options.draggable == true
            transparent     : false,            //True to make the marker semi-transparent
            hover           : false,            //True to show big-shadow and 0.9 opacuity for lbm-transparent when hover
            bigShadow       : false,            //true to add big shadow to the marker
            puls            : false,            //true to have a pulsart icon
            color           : '',    	        //Name of color
            borderColor     : '',               //Name of border-color. Same as color
            tooltip                 : null,     //Content of tooltip
            tooltipPermanent        : false,    //Whether to open the tooltip permanently or only on mouseover.
            tooltipHideWhenDragging : false,    //True and tooltipPermanent: false => the tooltip is hidden when dragged
            tooltipHideWhenPopupOpen: false,    //True and tooltipPermanent: false => the tooltip is hidden when popup is displayed
            bigShadowWhenPopupOpen  : true      //When true a big-sdhadow is shown when the popup for the marker is open
        },

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
        "orange"
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


        /*****************************************************
        initialize
        *****************************************************/
        initialize: function(latLng, options){
            L.Marker.prototype.initialize.call(this, latLng, options);

            if (this.options.useBigIcon)
                this.iconSizeIndex = 2;
            else
                //Change to big icon if bigIconWhenTouch == false and window.bsIsTouch == true and options.draggable == true
                if (this.options.bigIconWhenTouch && this.options.draggable && window.bsIsTouch)
                    this.iconSizeIndex = 2;
                else
                    this.iconSizeIndex = options.iconSize || 0;

            //Create $icon to hold class-names
            this.$icon = $('<div/>');

            this.toggleOption('transparent', !!this.options.transparent );
            this.toggleOption('bigShadow',   !!this.options.bigShadow );
            this.toggleOption('hover',       !!this.options.hover );
            this.toggleOption('puls',        !!this.options.puls );
            if (this.options.color)
                this.setColor(this.options.color);
            if (this.options.borderColor)
                this.setBorderColor(this.options.borderColor);

            //this.setSize(this.iconSizeIndex);

            this.on('dragstart', this._bsMarker_onDragStart, this );
            this.on('dragend',   this._bsMarker_onDragEnd,   this );

            this.on('popupopen',  this._popupopen, this);
            this.on('popupclose', this._popupclose, this);
        },

        /*****************************************************
        setSize
        *****************************************************/
        setSize: function(sizeIndex){

            this.$icon.removeClass('lbm-icon-'+this.iconSizeIndex);
            var className = this.$icon.get(0).className,
                tooltip = this.getTooltip();
            if (tooltip)
                $(tooltip._container).removeClass('leaflet-tooltip-icon-'+this.iconSizeIndex);

            this.iconSizeIndex = sizeIndex;

            this.setIcon( iconList[sizeIndex] );
            this.$icon = $(this._icon);
            this.$icon.addClass(className+' lbm-icon-'+sizeIndex);
            if (tooltip)
                $(tooltip._container).addClass('leaflet-tooltip-icon-'+this.iconSizeIndex);
        },


        /*****************************************************
        onAdd
        *****************************************************/
        onAdd: function( map ){
            L.Marker.prototype.onAdd.call(this, map);


            this.$content = null;

            if (this.options.tooltip)
                this.bindTooltip(this.options.tooltip, {
                    sticky          : !this.options.tooltipPermanent,       //If true, the tooltip will follow the mouse instead of being fixed at the feature center.
                    interactive     : false,                                //If true, the tooltip will listen to the feature events.
                    permanent       : this.options.tooltipPermanent,        //Whether to open the tooltip permanently or only on mouseover.
                    hideWhenDragging: this.options.tooltipHideWhenDragging  //True and tooltipPermanent: false => the tooltip is hidden when dragged
                });

            this.setSize(this.iconSizeIndex);
            if (this.options.number !== undefined)
                this.setNumber(this.options.number);
            if (this.options.iconClass)
                this.setIconClass(this.options.iconClass);

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
        setBorderColor( borderColorName )
        *****************************************************/
        setBorderColor: function( borderColorName ){
            if (this.borderColorName)
                this.removeClass('lbm-border-'+this.colorName);
            this.borderColorName = borderColorName;
            if (this.borderColorName)
                this.addClass('lbm-border-'+this.borderColorName);
        },

        /*****************************************************
        setIconClass( icon )
        *****************************************************/
        setIconClass: function( icon, minSize ){
            if (minSize && (minSize > this.iconSizeIndex))
                this.setSize( minSize );
            this.$icon.empty();
            $._bsCreateIcon('fa-home', this.$icon);
        },
        /*****************************************************
        setNumber( number )
        *****************************************************/
        setNumber: function( number, minSize ){
            if (minSize && (minSize > this.iconSizeIndex))
                this.setSize( minSize );
            this.$icon.empty();
            this.$icon.text(number);
        },


        /*****************************************************

        *****************************************************/
        _popupopen: function(){
            if (this.options.tooltipHideWhenPopupOpen && !this.options.tooltipPermanent)
                this.hideTooltip();
            if (this.options.bigShadowWhenPopupOpen && !this.options.bigShadow)
                this.addClass( classNames['bigShadow'] );

        },
        _popupclose: function(){
            if (this.options.tooltipHideWhenPopupOpen && !this.options.tooltipPermanent)
                this.showTooltip();
            if (this.options.bigShadowWhenPopupOpen && !this.options.bigShadow)
                this.removeClass( classNames['bigShadow'] );
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

    /*********************************************************
    Overwrite default Popu-options: Remove default leaflet closeButton
    *********************************************************/
    L.Popup.prototype.options.closeButton = false;

    //Add methods to pin or unpin popup
    L.Popup.prototype._setPinned = function(pinned) {
        this._pinned = pinned = !!pinned;

        //Update pin-icon (if avaiable)
        if (this.bsModal && this.bsModal.$modalContent){
            this.bsModal.isPinned = pinned;
            this.bsModal.$modalContent.modernizrToggle('modal-pinned', pinned );
        }

        //Update related options
        this.options.closeOnEscapeKey = !pinned;
        this.options.autoClose        = !pinned;
    };

    /*********************************************************
    popup._brintToFocus: Close the open popup (if any and not fixed) and bring this to front
    *********************************************************/
    L.Popup.prototype._brintToFocus = function() {
        this.bringToFront();
        if (this._map && this._map._popup && this._map._popup !== this && !this._map._popup._pinned)
            this._map.closePopup(this._map._popup);
    };

    /*********************************************************
    Adjust Popup._close and Popup._onCloseButtonClick
    to only close popup if it isn't pinned or it is closed from close-button
    *********************************************************/
    L.Popup.prototype._close = function (_close) {
        return function () {
            if (!this._pinned || this._closeViaCloseButton){
                this._closeViaCloseButton = false;
                _close.apply(this, arguments);
            }
        };
    } (L.Popup.prototype._close);

    L.Popup.prototype._onCloseButtonClick = function (_onCloseButtonClick) {
        return function () {
            this._closeViaCloseButton = true;
            _onCloseButtonClick.apply(this, arguments);
        };
    } (L.Popup.prototype._onCloseButtonClick);

    /*********************************************************
    Extend L.Popup._initLayout to create popup with Bootstrap-components
    *********************************************************/
    L.Popup.prototype._initLayout = function (_initLayout) {
        return function () {
            //Original function/method
            _initLayout.apply(this, arguments);

            //Set class-name for wrapper to remove margin, bg-color etc.
            $(this._wrapper).addClass('modal-wrapper');

            //Set class-name for _contentNode to make it a 'small' bsModal
            $(this._contentNode)._bsAddBaseClassAndSize({
                baseClass   : 'modal-dialog',
                class       : 'modal-dialog-inline',
                useTouchSize: true,
                small       : true
            });

            //Close open popup and brint to front when "touched"
            L.DomEvent.on(this._contentNode, 'mousedown', this._brintToFocus, this );

            return this;
        };
    } (L.Popup.prototype._initLayout);


    /*********************************************************
    Overwrite L.Popup._updateLayout to simple get _containerWidth
    as the width of the container
    *********************************************************/
    L.Popup.prototype._updateLayout = function(){
        this._containerWidth = $(this._container).width();
    };

    /*********************************************************
    Overwrite L.Popup._updatePosition to get correct width every time
    *********************************************************/
    L.Popup.prototype._updatePosition = function(_updatePosition){
        return function () {
            this._updateLayout();
            _updatePosition.apply(this, arguments);
        };
    } (L.Popup.prototype._updatePosition);



    /*********************************************************
    Overwrite L.Popup._updateContent to update inside bsModal-body
    *********************************************************/
    L.Popup.prototype._updateContent = function(){
        //Reset pinned-status
        var isPinned = !!this._pinned;
        this._setPinned(false);

        //Create and adjust options in this._content into options for bsModal
        //this._content can be 1: string or function, 2: object with the content, 3: Full popup-options
        //Convert this._content into bsModal-options
        var contentAsModalOptions = ($.isPlainObject(this._content) && !!this._content.content) ? this._content : {content: this._content},
            modalOptions = $.extend(true, {
                small         : true,
                smallButtons  : true,
                icons         : {
                    close: {
                        onClick: $.proxy(this._onCloseButtonClick, this)
                    }
                },
                closeButton   : contentAsModalOptions.closeButton === true, //Change default to false
                noHeader      : !contentAsModalOptions.header,
                contentContext: this,

                onChange: $.proxy( this._updatePosition, this )
            },
            contentAsModalOptions );

        if (modalOptions.fixable){
            this.options.fixable = true;
            modalOptions.onPin = $.proxy( this._setPinned, this);
        }

        //Adjust options for bsModal
        if (modalOptions.extended){
            modalOptions.extended.scroll = true;
            //If no extended height or width is given => use same as not-extended
            if (!modalOptions.extended.height && !modalOptions.extended.maxHeight)
                modalOptions.extended.height = true;

            if (!modalOptions.extended.width && !modalOptions.extended.maxWidth)
                modalOptions.extended.width = true;
        }

        //Save modal-options and content
        this.modalOptions = modalOptions;

        //Get the content-node and build the content as a Bootstrap modal
        var $contentNode = $(this._contentNode);
        $contentNode
            .empty()
            ._bsModalContent( modalOptions );

        //Save the modal-object
        this.bsModal = $contentNode.bsModal;

        this._setPinned(isPinned);

        this.fire('contentupdate');
    };

    /*********************************************************
    NEW METHOD L.Popup.changeContent - only changes the content
    of the "body" of the bsModal inside the popup
    *********************************************************/
    L.Popup.prototype.changeContent = function(content, contentContext) {
        var _contentContent = ($.isPlainObject(content) && !!content.content) ? content : {content: content, contentContext: contentContext};

        $.extend(this._content, _contentContent );

        //Update normal content
        this.bsModal.$body.empty();
        this.bsModal.$body._bsAppendContent(
            this._content.content,
            this._content.contentContext
        );


        if (this.bsModal.extended){
            //Update extended content
            this.bsModal.extended.$body.empty();
            this.bsModal.extended.$body._bsAppendContent(
                this._content.extended.content,
                this._content.extended.contentContext
            );
        }

        this.update();
		return this;
	};


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

    /*********************************************************
    Overwrite L.Tooltip._initLayout to add
    leaflet-tooltip-permanent and leaflet-tooltip-big-icon and leaflet-tooltip-hide-when-dragging
    to class-name (when needed)
    *********************************************************/
    L.Tooltip.prototype._initLayout = function( _initLayout ){
        return function(){
            this.options.className = this.options.className || '';
            if (this.options.permanent)
                this.options.className +=  ' leaflet-tooltip-permanent';

            if (this.options.hideWhenDragging)
                this.options.className +=  ' leaflet-tooltip-hide-when-dragging';


            if (this._source && this._source.$icon){
                if (this._source.$icon.hasClass('lbm-number'))
                    this.options.className += ' leaflet-tooltip-number-icon';
                if (this._source.$icon.hasClass('lbm-big'))
                    this.options.className += ' leaflet-tooltip-big-icon';
            }

            _initLayout.apply( this, arguments );
        };
    }( L.Tooltip.prototype._initLayout );


    /*********************************************************
    Overwrite L.Tooltip._updateContent to update tooltip with Bootstrap-content
    *********************************************************/
    L.Tooltip.prototype._updateContent = function () {
        $(this._contentNode)
            .empty()
            ._bsAddHtml( this._content, true );

		this.fire('contentupdate');
    };


}(jQuery, L, this, document));




;
/****************************************************************************
    leaflet-bootstrap.js,

    (c) 2017, FCOO

    https://github.com/FCOO/leaflet-bootstrap
    https://github.com/FCOO

****************************************************************************/
(function (/*$, L/*, window, document, undefined*/) {
    "use strict";


    /*********************************************************
    Extend XX with methods to show and hide tooltip
    *********************************************************/
    L.Layer.prototype.showTooltip = function() {
        var tooltip = this.getTooltip();
        if (tooltip)
            tooltip.setOpacity(this._saveTooltipOpacity);
        return this;
    };

    L.Layer.prototype.hideTooltip = function() {
        var tooltip = this.getTooltip();
        if (tooltip){
            this._saveTooltipOpacity = tooltip.options.opacity;
            tooltip.setOpacity(0);
        }
        return this;
    };



}(jQuery, L, this, document));



