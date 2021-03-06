/****************************************************************************
leaflet-bootstrap-popup.js

Adjust standard Leaflet popup to display as Bootstrap modal

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    /*********************************************************
    Overwrite default Popu-options:
    1: Remove default leaflet closeButton
    2: Adjust offset to match new popup-tip
    *********************************************************/
    L.Popup.prototype.options.closeButton = false;
    L.Popup.prototype.options.offset = [0, 11];

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

                if (this.showingTooltipOnPopup){
                    //Move tooltip back into the original pane
                    this.showingTooltipOnPopup = false;

//                    this._source.closeTooltip();
                    this._source.getTooltip().options.pane = 'tooltipPane';
                }
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

            //Save ref to popup in DOM-element
            $(this._container).data('popup', this);

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
            L.DomEvent.on(this._contentNode, 'click', this._brintToFocus, this );

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
        var _this = this,
            isPinned = !!this._pinned;
        this._setPinned(false);

        //Create and adjust options in this._content into options for bsModal
        //this._content can be 1: string or function, 2: object with the content, 3: Full popup-options.
        //If any of the contents are functions the functions must be function($body, popup, map)
        //Convert this._content into bsModal-options
        var contentAsModalOptions = ($.isPlainObject(this._content) && !!this._content.content) ? this._content : {content: this._content},
            contentArg = [this, this._map],
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
                contentArg    : contentArg,
                onChange      : $.proxy( this._updatePosition, this )
            },
            contentAsModalOptions );

        if (modalOptions.minimized)
            modalOptions.minimized.contentArg = contentArg;

        if (modalOptions.extended)
            modalOptions.extended.contentArg = contentArg;

        if (modalOptions.fixable){
            this.options.fixable = true;
            modalOptions.onPin = $.proxy( this._setPinned, this);
        }

        //If any of the posible contents are clickable => add hover effect to the tip
        if ( modalOptions.clickable ||
             (modalOptions.minimized && modalOptions.minimized.clickable) ||
             (modalOptions.extended && modalOptions.extended.clickable)
           )
            $(this._wrapper).addClass('clickable');

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
        this.$contentNode = $(this._contentNode);
        this.$contentNode
            .empty()
            ._bsModalContent( modalOptions );

        //Save the modal-object
        this.bsModal = this.$contentNode.bsModal;

        //If any of the contents (minimized, normal, or extended) should have the same tooltip as the source
        if (this._source && this._source.getTooltip()){
            var $list = [];
            $.each(['', 'minimized', 'extended'], function(index, id){
                var show     = id ? modalOptions[id] && modalOptions[id].showTooltip : modalOptions.showTooltip,
                    elements = id ? _this.bsModal[id] : _this.bsModal;
                if (show){
                    $list.push(elements.$body);
                    if (elements.$fixedContent)
                        $list.push(elements.$fixedContent);
                }
            });

            this.showingTooltipOnPopup = !!$list.length;

            if (this.showingTooltipOnPopup){
                //Move the tooltip from tooltip-pane to a tempory pane just above popups
                this._source.getTooltip().options.pane = this._map.getPaneAbove('popupPane');
                var this_source = this._source;

                this_source.showtooltip_mouseenter =
                    this_source.showtooltip_mouseenter ||
                    $.proxy(function(){
                        if (this._popup.showingTooltipOnPopup){
                            this.openTooltip();
                            this.showTooltip();
                        }
                    }, this_source);

                this_source.showtooltip_mouseleave =
                    this_source.showtooltip_mouseleave ||
                    $.proxy(function(){
                        if (this._popup.showingTooltipOnPopup){
                            this.closeTooltip();
                            this.hideTooltip();
                        }
                    }, this_source);

                this_source.showtooltip_mousemove =
                    this_source.showtooltip_mousemove ||
                    $.proxy(this_source._moveTooltip, this_source);

                $.each($list, function(index, $elem){
                    $elem
                        .on('mouseenter', this_source.showtooltip_mouseenter)
                        .on('mouseleave', this_source.showtooltip_mouseleave)
                        .on('mousemove',  this_source.showtooltip_mousemove);
                });
            }
        }

        this._setPinned(isPinned);

        this.fire('contentupdate');
    };

    /*********************************************************
    NEW METHOD FOR L.Popup
    *********************************************************/
    /*********************************************************
    L.Popup.changeContent - only changes the content
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


        if (this.bsModal.minimized){
            //Update extended content
            this.bsModal.minimized.$body.empty();
            this.bsModal.minimized.$body._bsAppendContent(
                this._content.minimized.content,
                this._content.minimized.contentContext
            );
        }

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

    /******************************************************
    Methods to get and set the size of the popup
    extend()
    diminish()
    getSize()
    setSize(size)
    setSizeExtended()
    setSizeNormal()
    setSizeMinimized()
    ******************************************************/
    L.Popup.prototype.extend = function(){
        this.$contentNode._bsModalExtend();
        return this;
    };

    L.Popup.prototype.diminish = function(){
        this.$contentNode._bsModalDiminish();
        return this;
    };


    L.Popup.prototype.getSize = function(){
        this.$contentNode._bsModalGetSize();
        return this;
    };

    L.Popup.prototype.setSize = function(size){
        this.$contentNode._bsModalSetSize(size);
        return this;
    };

    L.Popup.prototype.setSizeExtended  = function(){ return this.setSize($.MODAL_SIZE_EXTENDED ); };
    L.Popup.prototype.setSizeNormal    = function(){ return this.setSize($.MODAL_SIZE_NORMAL   ); };
    L.Popup.prototype.setSizeMinimized = function(){ return this.setSize($.MODAL_SIZE_MINIMIZED); };


    /*********************************************************
    L.Popup.changeContent - only changes the content
    of the "body" of the bsModal inside the popup
    *********************************************************/



    /*********************************************************
    NEW METHOD FOR L.Map
    L.Map.closeAllPopup - close all popup on the map
    *********************************************************/
    L.Map.prototype.closeAllPopup = function() {
        $(this.getPane('popupPane')).find('.leaflet-popup').each(function(){
            $(this).data('popup')._close();
        });
    };

}(jQuery, L, this, document));
