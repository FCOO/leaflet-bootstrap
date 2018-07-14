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
        this.options._pinned = pinned;
        this.options.closeOnEscapeKey = !pinned;
        this.options.autoClose        = !pinned;
    };

    /*********************************************************
    popup._brintToFocus: Close the open popup (if any and not fixed) and bring this to front
    *********************************************************/
    L.Popup.prototype._brintToFocus = function() {
        this.bringToFront();
        if (this._map && this._map._popup && this._map._popup !== this && !this._map._popup.options._pinned)
            this._map.closePopup(this._map._popup);
    };

    function popup_getEvents_preclick(){
        if (!this.options._pinned)
            this._close();
    }

    /*********************************************************
    Adjust Popup.getEvents to adjust preclick
    *********************************************************/
    L.Popup.prototype.getEvents = function (getEvents) {
        return function() {
            var events = getEvents.apply(this, arguments);
            if (this.options.fixable)
                events.preclick = events.preclick ? popup_getEvents_preclick : null;
            return events;
        };
    } (L.Popup.prototype.getEvents);

    /*********************************************************
    Adjust Popup.initialize
    *********************************************************/
    L.Popup.prototype.initialize = function (initialize) {
        return function (options) {
            if (options && options.fixable)
                this.onPin = $.proxy( this._setPinned, this);
            return initialize.apply(this, arguments);
        };
    } (L.Popup.prototype.initialize);


    /*********************************************************
    Extend L.Popup._initLayout to create popup with Bootstrap-components
    *********************************************************/
    L.Popup.prototype._initLayout = function (_initLayout) {
        return function (options, source) {
            options = options || {};
            options.closeButton = false; //No default leaflet close - close-button part of content

            //Original function/method
            _initLayout.call(this, options, source);

            //Set class-name for wrapper to remove margin, bg-color etc.
            $(this._wrapper).addClass('modal-wrapper');

            //Set class-name for _contentNode to make it a 'small' bsModal
            $(this._contentNode).addClass('modal-inline modal-sm');

            //Close open popup and brint to front when "touched"
            L.DomEvent.on(this._contentNode, 'mousedown', this._brintToFocus, this );
        };
    } (L.Popup.prototype._initLayout);


    /*********************************************************
    Overwrite L.Popup._updateContent to create popup with Bootstrap-components
    *********************************************************/
    L.Popup.prototype._updateContent = function(){
		if (!this._content) { return; }

        //this._content can be 1: string or function, 2: object with the content, 3: Full popup-options
        //Convert this._content into bsModal-options
        var contentAsModalOptions = ($.isPlainObject(this._content) && !!this._content.content) ? this._content : {content: this._content, closeButton: false},
            modalOptions = $.extend(true, {
                small         : true,
                smallButtons  : true,
                icons         : {
                    close: {
                        onClick: $.proxy(this._onCloseButtonClick, this)
                    }
                },
                onPin         : this.onPin,
                noHeader      : !contentAsModalOptions.header,
                contentContext: this,
            },
            contentAsModalOptions );

        //Adjust options for leaflet popup
        if (modalOptions.scroll)
            this.options.maxHeight = this.options.maxHeight || 300; //maxHeight must be set if content is inside a scroll

        //Get the content-node and build the content as a Bootstrap modal
        var $contentNode = $(this._contentNode);
        $contentNode
            .empty()
            ._bsModalContent( modalOptions );

        //Set max-height of inner modal-container
        if (this.options.maxHeight)
            $contentNode.bsModal.$container.css('max-height', this.options.maxHeight);
    };

}(jQuery, L, this, document));
