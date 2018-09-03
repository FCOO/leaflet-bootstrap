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
        if (this.bsModal && this.bsModal.$container){
            this.bsModal.isPinned = pinned;
            this.bsModal.$container.modernizrToggle('modal-pinned', pinned );
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
            //Some options can be given in this._content
            if ($.isPlainObject(this._content)){
                this.options.minWidth  = this._content.minWidth  || this.options.minWidth;
                this.options.maxWidth  = this._content.maxWidth  || this.options.maxWidth;
                this.options.maxHeight = this._content.maxHeight || this.options.maxHeight;
                this.options.width     = this._content.width     || this.options.width;
            }
            //Set fixed width
            if (this.options.width){
                this.options.minWidth = this.options.width;
                this.options.maxWidth = this.options.width;
            }

            //Original function/method
            _initLayout.apply(this, arguments);

            //Set class-name for wrapper to remove margin, bg-color etc.
            $(this._wrapper).addClass('modal-wrapper');

            //Set class-name for _contentNode to make it a 'small' bsModal
            $(this._contentNode).addClass('modal-inline modal-sm');

            //Close open popup and brint to front when "touched"
            L.DomEvent.on(this._contentNode, 'mousedown', this._brintToFocus, this );

            return this;
        };
    } (L.Popup.prototype._initLayout);


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
                closeButton   : contentAsModalOptions.closeButton,
                noHeader      : !contentAsModalOptions.header,
                contentContext: this,
            },
            contentAsModalOptions );



        if (modalOptions.fixable){
            this.options.fixable = true;
            modalOptions.onPin = $.proxy( this._setPinned, this);
        }

        //Adjust options for leaflet popup
        if (modalOptions.scroll)
            this.options.maxHeight = this.options.maxHeight || 300; //maxHeight must be set if content is inside a scroll

        //Save modal-options and content
        this.modalOptions = modalOptions;

        //Get the content-node and build the content as a Bootstrap modal
        var $contentNode = $(this._contentNode);
        $contentNode
            .empty()
            ._bsModalContent( modalOptions );

        //Save the modal-object
        this.bsModal = $contentNode.bsModal;

        //Set max-height of inner modal-container
        if (this.options.maxHeight)
            $contentNode.bsModal.$container.css('max-height', this.options.maxHeight);

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
