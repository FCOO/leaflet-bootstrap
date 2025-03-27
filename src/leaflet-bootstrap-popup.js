/****************************************************************************
leaflet-bootstrap-popup.js

Adjust standard Leaflet popup to display as Bootstrap modal

Note: All buttons in options.buttons will have event-methods
with arguments = (id, selected, $button, map, owner) where owner = the popup
Eq., onClick: function(id, selected, $button, map, popup){...}

The options for the content also allows options onResize: function(size, popup, $body, options, map) that is called when the body are resized



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
    //L.Popup.prototype.options.autoPan = false;  //Set it to false if you don't want the map to do panning animation to fit the opened popup.


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
    L.Popup.prototype.close = function (close) {
        return function () {
            if (!this._pinned || this._closeViaCloseButton){
                this._closeViaCloseButton = false;

                if (this.showingTooltipOnPopup){
                    //Move tooltip back into the original pane
                    this.showingTooltipOnPopup = false;

//                    this._source.closeTooltip();
                    this._source.getTooltip().options.pane = 'tooltipPane';
                }
                close.apply(this, arguments);
            }
        };
    } (L.Popup.prototype.close);

    L.Popup.prototype._onCloseButtonClick = function() {
        this._closeViaCloseButton = true;
        this.close();
    };


    /*********************************************************
    Extend L.Popup._initLayout to create popup with Bootstrap-components
    and add event onOpen and onClose
    *********************************************************/
    function popup_onOpenOrClose(event, methodName){
        var popup   = event.target,
            options = popup.options[methodName] ? popup.options : popup._content[methodName] ? popup._content : null;

        if (!options)
            return;

        var arg = options.onOpenArg ? options.onOpenArg.slice() : [];
        arg.unshift(popup);

        options[methodName].apply(options[methodName+'Context'], arg);
    }

    function popup_onOpen(event){
        popup_onOpenOrClose(event, 'onOpen');
    }

    function popup_onClose(event){
        popup_onOpenOrClose(event, 'onClose');
    }

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

            //Add onOpen and onClose events from options or content (if any)
            if (this.options.onOpen || this._content.onOpen)
                this.on('add', popup_onOpen);
            if (this.options.onClose || this._content.onClose)
                this.on('remove', popup_onClose);

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

        //Save current popup that are updated
        L.currentPopup_map = this._map;

        this._setPinned(false);

        //Create and adjust options in this._content into options for bsModal
        //this._content can be 1: string or function, 2: object with the content, 3: Full popup-options.
        //If any of the contents are functions the functions must be function($body, popup, map)
        //Convert this._content into bsModal-options

        var contentAsModalOptions = $.isPlainObject(this._content) ? this._content : {content: this._content},
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


        function adjustButtons( opt, owner ){

            if ( $.isPlainObject(opt) &&
                 ( opt.onClick ||    //Default button without type
                   (opt.type && ['button', 'checkboxbutton', 'standardcheckboxbutton', 'iconcheckboxbutton', 'checkbox'].includes(opt.type))
                 )
               )
                return L._adjustButton(opt, owner);

            if ($.isPlainObject(opt) || $.isArray(opt))
                $.each(opt, function(idOrIndex, subOpt){
                    opt[idOrIndex] = adjustButtons(subOpt, owner);
                });
            return opt;
        }

        //Adjust buttons in content(s) and buttons to include map in arguments for onClick/onChange
        ['content', 'extended.content', 'minimized.content', 'buttons'].forEach( idStr => {
            var idList = idStr.split('.'),
                lastId = idList.pop(),
                parent = modalOptions,
                exists = true;

            idList.forEach(id => {
                if (parent[id])
                    parent = parent[id];
                else
                    exists = false;
            });

            if (exists && parent[lastId])
                parent[lastId] = adjustButtons( parent[lastId], _this );
        });


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
            //If no scroll-options is given => default = true
            if (typeof modalOptions.extended.scroll !== 'boolean')
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

        //Add onResize to the different "body"
        [$.MODAL_SIZE_NORMAL, $.MODAL_SIZE_MINIMIZED, $.MODAL_SIZE_EXTENDED].forEach( function(size){
            let id = '';
            switch (size){
                case $.MODAL_SIZE_NORMAL    : id = '';          break;
                case $.MODAL_SIZE_MINIMIZED : id = 'minimized'; break;
                case $.MODAL_SIZE_EXTENDED  : id = 'extended';  break;
            }

            let opt     = id ? this.modalOptions[id] : this.modalOptions,
                bsModal = id ? this.bsModal[id]      : this.bsModal,
                $body   = bsModal ? bsModal.$body : null;

            if ($body && opt.onResize){
                $body.resize( function(size, popup, $body, options, map){
                    if ($body._callingOnResize || !options.onResize)
                        return;

                    $body._callingOnResize = true;

                    options.onResize(size, popup, $body, options, map);

                    //Delay the allowing of new onResize to allow onResize to also resize
                    window.setTimeout(function(){ this._callingOnResize = false; }.bind($body), 200);

                }.bind(null, size, this, $body, opt, this._map));
            }

        }.bind(this));

        //If any of the contents (minimized, normal, or extended) should have the same tooltip as the source
        if (this._source && this._source.getTooltip()){
            var $list = [];
            ['', 'minimized', 'extended'].forEach(id => {
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

        L.currentPopup_map = null;

    };

    /*********************************************************
    NEW METHOD FOR L.Popup
    *********************************************************/
    /*********************************************************
    L.Popup.changeContent - only changes the content
    of the "body" of the bsModal inside the popup
    *********************************************************/
    L.Popup.prototype.changeContent = function(content, contentContext) {
        var size = null,
            _contentContent = ($.isPlainObject(content) && !!content.content) ? content : {content: content, contentContext: contentContext};

        $.extend(this._content, _contentContent );

        if (this.isOpen()){
            size = this.getSize();

            //Update normal content
            this.bsModal.$body.empty();
            this.bsModal.$body._bsAppendContent(
                this._content.content,
                this._content.contentContext,
                this._content.contentArg
            );

            if (this.bsModal.minimized){
                //Update extended content
                this.bsModal.minimized.$body.empty();
                this.bsModal.minimized.$body._bsAppendContent(
                    this._content.minimized.content,
                    this._content.minimized.contentContext,
                    this._content.minimized.contentArg
                );
            }

            if (this.bsModal.extended){
                //Update extended content
                this.bsModal.extended.$body.empty();
                this.bsModal.extended.$body._bsAppendContent(
                    this._content.extended.content,
                    this._content.extended.contentContext,
                    this._content.extended.contentArg
                );
            }

        }

        this.update();

        if (size)
            this.setSize(size);

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
        return this.$contentNode._bsModalGetSize();
    };

    L.Popup.prototype.setSize = function(size){
        this.$contentNode._bsModalSetSize(size);
        return this;
    };

    L.Popup.prototype.setSizeExtended  = function(){ return this.setSize($.MODAL_SIZE_EXTENDED ); };
    L.Popup.prototype.setSizeNormal    = function(){ return this.setSize($.MODAL_SIZE_NORMAL   ); };
    L.Popup.prototype.setSizeMinimized = function(){ return this.setSize($.MODAL_SIZE_MINIMIZED); };


    /*********************************************************
    L.Popup.setWidth( width )
    Set new width of the popup
    width = NUMBER or {width: NUMBER, minimized: NUMBER, extended: NUMBER}
    *********************************************************/
    L.Popup.prototype.setWidth = function(width){
        if (typeof width == 'number')
            width = {width: width};

        const allNewWidth = {};
        allNewWidth[$.MODAL_SIZE_NORMAL]    = width.width || width.normal;
        allNewWidth[$.MODAL_SIZE_MINIMIZED] = width.minimized;
        allNewWidth[$.MODAL_SIZE_EXTENDED]  = width.extended;

        const setWidth = function(size, id){
            let options = this.modalOptions || this._content;
            if (id)
                options = options[id];
            if (!options) return;

            let newWidth = allNewWidth[size];
            if (newWidth)
                options.width = newWidth;

            if (this.bsModal && this.bsModal.cssWidth && (typeof newWidth == 'number'))
                this.bsModal.cssWidth[size].width = newWidth+'px';
        }.bind(this);


        setWidth($.MODAL_SIZE_NORMAL);
        setWidth($.MODAL_SIZE_MINIMIZED, 'minimized');
        setWidth($.MODAL_SIZE_EXTENDED,  'extended');

        if (this.$contentNode)
            this.$contentNode._bsModalSetHeightAndWidth();
    };



    /*********************************************************
    NEW METHOD FOR L.Map
    L.Map.closeAllPopup - close all popup on the map
    *********************************************************/
    L.Map.prototype.closeAllPopup = function() {
        $(this.getPane('popupPane')).find('.leaflet-popup').each(function(){
            $(this).data('popup').close();
        });
    };

}(jQuery, L, this, document));
