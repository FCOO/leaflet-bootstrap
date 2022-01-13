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
            semiTransparent : true,
            content: {
                header          : {
                    icon: 'fa-list',
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
                semiTransparent     : true,
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
            //Adjust options for width and heigth
            this.options.content.header    = this.options.header    || this.options.content.header;
            this.options.content.width     = this.options.width     || this.options.content.width;
            this.options.content.maxHeight = this.options.maxHeight || this.options.content.maxHeight;

            var result = L.Control.BsButtonBox.prototype.onAdd.call(this, map);
            this.$modalContent = this.$contentContainer.bsModal.$content;

            //Manually implement extend and diminish functionality
            var $header = this.$contentContainer.bsModal.$header;
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
    L.BsLegend = function( options ){
        this.options = options;
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
                normalIcon = options.icon || 'fa-square text-white',
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
                        icons      : {},
                        content    : '',
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

                        this.updateContent( options.content );

                        content.push( this.$contentContainer );
                    }

                    if (options.buttons || options.buttonList){
                        //Convert button-list to content
                        var $buttonList = L._adjustButtonList(options.buttons || options.buttonList, this );

                        this.$buttonContainer =
                            $('<div/>')
                                .addClass('text-right modal-footer')
                                .css('padding', 0)
                                ._bsAppendContent( $buttonList );

                        content.push( this.$buttonContainer );
                    }

                    modalContentOptions.extended = {content: content};

                    modalContentOptions.isExtended = true;
                    options.hasContent = true;
                }

                options.onRemove = options.onRemove || options.onClose;
                if (options.onRemove)
                    modalContentOptions.icons.close = {
                        //icon   : ['fas fa-home _back', 'far fa-home _middle', 'far fa-home _front'],
                        icon   : ['fa-map fa-scale-x-08', 'fa-slash fa-scale-x-08'],
                        className: 'fa-map-margin-right',
                        title  : {da:'Skjul', en:'Hide'},
                        onClick: $.proxy(this.remove, this)
                    };
                this.$container    = $('<div/>')._bsModalContent(modalContentOptions);
                this.$modalContent = this.$container.bsModal.$modalContent;


                //Find all header icons
                this.stateIcons = this.$container.bsModal.$header.children();
                var $normalIcon = $(this.stateIcons[0]);
                $normalIcon.addClass('fa-fw ' + (this.options.normalIconClass || ''));
                if (normalIconIsStackedIcon)
                    $normalIcon.children('.container-stacked-icons').addClass('hide-for-bsl-working');

                this.actionIcons = {};
                $.each(['warning', 'info', 'help', 'close'], function(index, id){
                    _this.actionIcons[id] = _this.$container.find('[data-header-icon-id="'+id+'"]');
                });

                this.$header = this.$container.find('.modal-header');

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
        Remove legend
        *******************************************/
        remove: function(){
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
        update: function( content ){
            if (content){
                this.options.content = content;
                this.updateContent( content );
            }
            if (this.options.onUpdate)
                this.options.onUpdate(this);
        },

        updateContent( content ){
            this.$contentContainer
                .empty()
                ._bsAppendContent( content );
        }


    };


}(jQuery, L, this, document));



