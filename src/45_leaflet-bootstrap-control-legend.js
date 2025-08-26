/****************************************************************************
leaflet-bootstrap-control-legend.js

****************************************************************************/
(function ($, L, window, document, undefined) {
    "use strict";

    var legendCounter = 0;

    L.Control.BsLegend = L.Control.BsButtonBox.extend({
        hasRelativeHeight: true,
        options: {
            position        : "topright",
            icon            : 'fa-list',
            bigIcon         : true,
            semiTransparent : false,
            content: {
                header          : {
                    icon: 'fas fa-list',
                    text: {da: 'Signaturforklaring', en:'Legend'}
                },
                icons: {
                    extend  : { onClick: function(){/*Empty*/} },
                    diminish: { onClick: function(){/*Empty*/} }
                },
                clickable           : false,
                noVerticalPadding   : false,
                noHorizontalPadding : false,
                scroll              : true,
                semiTransparent     : false,
                width               : 300,
                content             : '<div class="no-layer"/>',
            },
        },

        /*******************************************
        initialize
        *******************************************/
        initialize: function(options) {
            this.options = $.extend(true, this.options, options);
            L.Control.BsButtonBox.prototype.initialize.call(this);

            this.legends = {};
            this.list = [];
        },

        /*******************************************
        onAdd
        *******************************************/
        onAdd: function(map) {
            //Adjust options for width and height
            this.options.content.header    = this.options.header    || this.options.content.header;
            this.options.content.width     = this.options.width     || this.options.content.width;
            this.options.content.maxHeight = this.options.maxHeight || this.options.content.maxHeight;

            var result = L.Control.BsButtonBox.prototype.onAdd.call(this, map);


            this.bsModal = this.$contentContainer.bsModal;
            this.$modalContent = this.bsModal.$content;

            //Manually implement extend and diminish functionality
            var $header = this.bsModal.$header;
            this.extendIcon = $header.find('[data-header-icon-id="extend"]');
            this.extendIcon.on('click', $.proxy(this.extendAll, this) );

            this.diminishIcon = $header.find('[data-header-icon-id="diminish"]');
            this.diminishIcon.on('click', $.proxy(this.diminishAll, this) );

            //Add the 'No layer' text
            this.$noLayer = this.$modalContent.find('.no-layer')
                    .i18n({da: 'Ingen ting...', en:'Nothing...'})
                    .addClass('text-center w-100 text-secondary');

            this.update();

            return result;
        },

        diminishAll: function(){
            $.each(this.list, function(index, legend){
                if (!legend.$modalContent.hasClass('modal-normal') && legend.options.hasContent)
                    legend.$container._bsModalDiminish();
            });
        },
        extendAll: function(){
            $.each(this.list, function(index, legend){
                if (!legend.$modalContent.hasClass('modal-extended') && legend.options.hasContent)
                    legend.$container._bsModalExtend();
            });
        },

        /*******************************************
        update
        *******************************************/
        update: function() {
            this.$noLayer.toggle( !this.list.length );

            //Sort the list
            this.list.sort(function(item1,item2){ return item1.index - item2.index; });
            var $content = this.$modalContent;
            $.each(this.list, function(index, legend){
                legend.indexInList = index;
                legend.$container.detach();
                $content.append( legend.$container );
            });
        },

        /*******************************************
        addLegend
        *******************************************/
        addLegend: function(  options ) {
            var legendId = '_'+legendCounter++,
                newLegend = options instanceof L.BsLegend ? options : new L.BsLegend(options);
            newLegend.id = legendId;
            newLegend.index = newLegend.index == undefined ? this.list.length : newLegend.index;

            this.legends[legendId] = newLegend;
            this.list.push(newLegend);
            newLegend.addTo(this);

            this.legends[legendId].update();
            this.update();

           return newLegend;
        },

        /*******************************************
        removeLegend
        *******************************************/
        removeLegend: function(legend) {
            var legendId = legend instanceof L.BsLegend ? legend.id : legend;
            legend = this.legends[legendId];
            if (legend){
                legend.onRemove();
                delete this.legends[legendId];
                this.list.splice(legend.indexInList, 1);
            }
            this.update();
        },

        /*******************************************
        showLegend
        *******************************************/
        showLegend: function( legendId, extended ){
            if (this.legends[legendId])
                this.legends[legendId].show(extended);
        },

        /*******************************************
        hideLegend
        *******************************************/
        hideLegend: function( legendId ){
            if (this.legends[legendId])
                this.legends[legendId].hide();
        },

        /*******************************************
        showLegendContent
        *******************************************/
        showLegendContent: function( legendId, extended ){
            if (this.legends[legendId])
                this.legends[legendId].showContent(extended);
        },

        /*******************************************
        hideLegendContent
        *******************************************/
        hideLegendContent: function( legendId ){
            if (this.legends[legendId])
                this.legends[legendId].hideContent();
        },

        /*******************************************
        updateLegend
        *******************************************/
        updateLegend: function( legendId, options ){
            if (this.legends[legendId])
                this.legends[legendId].update( options );
        }
    }); //end of L.Control.BsLegend = L.Control.BsButtonBox.extend({

    //Install L.Control.BsLegend
    L.Map.mergeOptions({
        bsLegendControl: false,
        bsLegendOptions: {}
    });

    L.Map.addInitHook(function () {
        if (this.options.bsLegendControl){
            this.bsLegendControl = new L.Control.BsLegend( this.options.bsLegendOptions );
            this.addControl(this.bsLegendControl);
        }
    });


    /*****************************************************************
    ******************************************************************
    Legend
    options:
        normalIconClass: class-name(s) for icons when layer is normal (visible)
        hiddenIconClass: class-name(s) for icon when layer is hidden
        buttons/buttonList: []button-options.
        NOTE:

    Note: All buttons in options.buttons will have event-methods
    with arguments = (id, selected, $button, map, owner) where owner = the popup
    Eq.
    onClick : function(id, selected, $button, map, popup){...}, or
    onChange: function(id, selected, $button, map, popup){...}

    *******************************************************************
    ******************************************************************/
    L.BsLegend_close_icon  = ['fa-map fa-scale-x-08', 'fa-slash fa-scale-x-08'];
    L.BsLegend_close_title = {da:'Skjul', en:'Hide'};
    L.BsLegend_defaultOptions = function(){
        return {
            show       : true,  //Show or hide the legend at init
            showContent: true,  //Show or hide the content at init
            showIcons  : true,  //Show or hide the icon-buttons t the header at init
            isExtended : true,  //Extend/diminish the legend at init

            //closeIconOptions = options for the close-icon in the header that removes the layer
            closeIconOptions: {
                icon     : L.BsLegend_close_icon,
                className: $.BSMODAL_USE_SQUARE_ICONS ? null : 'fa-map-margin-right',
                title    : L.BsLegend_close_title
            }
        };
    };


    L.BsLegend = function( options ){
        this.options = $.extend(true, {semiTransparent: true}, L.BsLegend_defaultOptions(), options);
        this.index = options.index;
    };

    //Extend the prototype
    L.BsLegend.prototype = {
        /*******************************************
        addTo
        *******************************************/
        addTo: function( parent ){
            var _this = this,
                options = this.options,
                normalIcon = options.icon || 'fa-square-full text-white',
                normalIconIsStackedIcon = false;

            //Add class to normal-icon to make it visible when working = off
            if ($.isArray(normalIcon))
                normalIconIsStackedIcon = true;
            else
                normalIcon = normalIcon + ' hide-for-bsl-working';
            /*
            Create 2+1 icons:
            The first for layer=visible contains of two icons: normal and working
            The second for layer=hidden contains not-visible-icon
            */
            this.options.iconArray = [
                [normalIcon, 'show-for-bsl-working fa-fw fas fa-spinner fa-spin no-margin-left'],
                'fa-fw fas fa-eye-slash ' + (this.options.hiddenIconClass || '')
            ];


            this.parent = parent;
            if (!this.$container){
                //Create modal-content
                    var modalContentOptions = {
                        noShadow: true,
                        scroll  : false,
                        header: {
                            icon: options.iconArray,
                            text: options.text
                        },
                        onInfo     : options.onInfo,
                        onWarning  : options.onWarning,
                        onError    : options.onError,
                        icons      : {},
                        content    : '',
semiTransparent: true,
                        closeButton: false
                    };


                //The extended content can be 'normal' content and/or buttons/buttonList
                if (options.content || options.buttons || options.buttonList){
                    var content = [];

                    if (options.content){

                        this.$contentContainer =
                            $('<div/>')
                                .addClass('modal-body')
                                .addClass(options.contentClassName)

                                .toggleClass('no-vertical-padding',   !!options.noVerticalPadding)
                                .toggleClass('no-horizontal-padding', !!options.noHorizontalPadding);

                        this.updateContent();

                        content.push( this.$contentContainer );
                    }


                    var buttonList = L._adjustButtonList(options.buttons || options.buttonList, this );
                    if (buttonList){

                        //Buttons added inside button-bar. If button-options have first: true => new 'line' = new bsButtonGroup
                        var groupList = [],
                            currentList = [];

                        buttonList.forEach( function(buttonOptions){
                            if (buttonOptions.isFirstButton && currentList.length){
                                groupList.push( currentList );
                                currentList = [];
                            }

                            currentList.push( buttonOptions );

                            if (buttonOptions.isLastButton){
                                groupList.push( currentList );
                                currentList = [];
                            }
                        });
                        if (currentList.length)
                            groupList.push( currentList );

                        var $buttonContainer = this.$buttonContainer = $('<div/>').addClass('modal-footer d-block');
                        groupList.forEach( function( list ){
                            $.bsButtonBar({
                                small          : true,
                                buttons        : list,
                                justify        : 'center',
                                buttonFullWidth: true,
                            }).appendTo( $buttonContainer );
                        });

                        content.push( this.$buttonContainer );
                    }

                    modalContentOptions.extended = {content: content};

                    modalContentOptions.isExtended = this.options.isExtended;
                    options.hasContent = true;
                }

                options.onRemove = options.onRemove || options.onClose;
                if (options.onRemove)
                    modalContentOptions.icons.close = $.extend(
                        {onClick: $.proxy(this.remove, this)},
                        options.closeIconOptions
                    );
                this.$container    = $('<div/>')._bsModalContent(modalContentOptions);
                this.bsModal = this.$container.bsModal;
                this.$modalContent = this.bsModal.$modalContent;


                //Find all header icons
                this.stateIcons = this.bsModal.$header.children();
                var $normalIcon = $(this.stateIcons[0]);
                $normalIcon.addClass('fa-fw ' + (this.options.normalIconClass || ''));
                if (normalIconIsStackedIcon)
                    $normalIcon.children('.container-stacked-icons').addClass('hide-for-bsl-working');

                this.actionIcons = {};
                ['error', 'warning', 'info', 'help', 'close'].forEach( id => {
                    _this.actionIcons[id] = _this.$container.find('[data-header-icon-id="'+id+'"]');
                    _this.actionIcons[id].toggle(_this.options.showIcons || (id == 'close'));
                });

                this.sizeIcons = {};
                ['extend', 'diminish'].forEach( id => _this.sizeIcons[id] = _this.$container.find('[data-header-icon-id="'+id+'"]') );

                this.$header = this.$container.find('.modal-header');


                this.toggleContent( this.options.showContent );
                this.toggle( this.options.show );

                this.setStateNormal();

                this.workingOff();
            }

            this.$container.appendTo(this.parent.$modalContent);

        },

        /*******************************************
        Show or hide icons
        *******************************************/
        toggleIcon: function(id, show){
            this.actionIcons[id].toggle(!!show);
            return this;
        },
        showIcon: function(id){
            return this.toggleIcon(id, true);
        },
        hideIcon: function(id){
            return this.toggleIcon(id, false);
        },

        workingToggle: function(on){
            return this.$header.modernizrToggle('bsl-working', on);

        },
        workingOn : function(){ return this.workingToggle(true ); },
        workingOff: function(){ return this.workingToggle(false); },



        _setState: function(visible){
            $(this.stateIcons[0]).toggle(visible);
            $(this.stateIcons[1]).toggle(!visible);
            return this;
        },
        setStateNormal   : function(){ return this._setState(true); },
        setStateHidden   : function(){ return this._setState(false); },
        setStateInvisible: function(){ return this.setStateHidden(); },


        /*******************************************
        show
        *******************************************/
        show: function( extended ){
            return this.toggle(true, extended);
        },

        /*******************************************
        hide
        *******************************************/
        hide: function(extended){
            return this.toggle(false, extended);
        },

        /*******************************************
        toggle
        *******************************************/
        toggle: function(show, extended){
            this.$container.toggle(!!show);
            this.isShown = !!show;

            if (this.options.hasContent && (typeof extended == 'boolean')){
                //For unknown reasons _bsModalExtend is needed first
                this.$container._bsModalExtend();
                if (!extended)
                    this.$container._bsModalDiminish();
            }
            return this;
        },

        /*******************************************
        showContent
        *******************************************/
        showContent: function( extended ){
            return this.toggleContent(true, extended);
        },

        /*******************************************
        hideContent
        *******************************************/
        hideContent: function( extended ){
            return this.toggleContent(false, extended);
        },

        /*******************************************
        toggleContent
        *******************************************/
        toggleContent: function( show, extended ){
            show = show && this.options.hasContent;
            $.each(this.sizeIcons, function(id, $icon){
                $icon.css('visibility', show ? 'visible' : 'hidden');
            });

            if (this.options.hasContent){
                this.bsModal.extended.$body.toggleClass('modal-body-no-content', !show);

                if (typeof extended == 'boolean')
                    this.toggle(this.isShown, extended);
            }
        },

        /*******************************************
        remove
        *******************************************/
        remove: function(e){
            //Since this.parent.removeLegend removed DOM-elements the event must stop propagation
            L.DomEvent.stopPropagation(e);
            this.parent.removeLegend(this);
        },

        onRemove: function(){
            if (this.$container)
                this.$container.detach();
            this.options.onRemove(this);
        },

        /*******************************************
        update
        *******************************************/
        update: function( content, contentContext, contentArg ){
            this.updateContent(content, contentContext, contentArg);

            if (this.options.onUpdate)
                this.options.onUpdate(this);
        },

        updateContent( content, contentContext, contentArg ){
            this.options.content        = content        || this.options.content;
            this.options.contentContext = contentContext || this.options.contentContext;
            this.options.contentArg     = contentArg     || this.options.contentArg;

            if (this.$contentContainer)
                this.$contentContainer
                    .empty()
                    ._bsAppendContent( this.options.content, this.options.contentContext, this.options.contentArg );
        }

    };

}(jQuery, L, this, document));



