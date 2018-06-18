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



