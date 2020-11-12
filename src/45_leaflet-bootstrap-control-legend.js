/****************************************************************************
leaflet-bootstrap-control-legend.js

****************************************************************************/
(function ($, L, window, document, undefined) {
    "use strict";

    var legendCounter = 0;

    L.Control.BsLegend = L.Control.BsButtonBox.extend({
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
            this.$modalBody       = this.$contentContainer.bsModal.$body;

            //Manually implement extend and diminish functionality
            var $header = this.$contentContainer.bsModal.$header;
            this.extendIcon = $header.find('[data-header-icon-id="extend"]');
            this.extendIcon.on('click', $.proxy(this.extendAll, this) );

            this.diminishIcon = $header.find('[data-header-icon-id="diminish"]');
            this.diminishIcon.on('click', $.proxy(this.diminishAll, this) );

            //Add the 'No layer' text
            this.$noLayer = this.$modalBody.find('.no-layer')
                    .i18n({da: 'Ingen ting...', en:'Nothing...'})
                    .addClass('text-center w-100 text-secondary');

            this.update();

            return result;
        },

        diminishAll: function(){
            $.each(this.list, function(index, legend){
                if (!legend.$modalContent.hasClass('modal-normal') && legend.options.content)
                    legend.$container._bsModalDiminish();
            });
        },
        extendAll: function(){
            $.each(this.list, function(index, legend){
                if (!legend.$modalContent.hasClass('modal-extended') && legend.options.content)
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
            var $body = this.$modalBody;
            $.each(this.list, function(index, legend){
                legend.indexInList = index;
                legend.$container.detach();
                $body.append( legend.$container );
            });
        },

        /*******************************************
        addLegend
        *******************************************/
        addLegend: function(  options ) {
            var legendId = '_'+legendCounter++,
                newLegend = options instanceof BsLegend ? options : new BsLegend(options);
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
            var legendId = legend instanceof BsLegend ? legend.id : legend;
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


            this.bsLegendControl2 = new L.Control.BsLegend( this.options.bsLegendOptions );
            this.addControl(this.bsLegendControl2);


        }
    });


    /*****************************************************************
    ******************************************************************
    Legend
    options:
        normalIconClass: class-name(s) for icons when layer is normal (visible)
        hiddenIconClass: class-name(s) for icon when layer is hidden
    *******************************************************************
    ******************************************************************/
    function BsLegend( options ){
        this.options = options;
        this.index = options.index;
    }

    L.BsLegend = BsLegend;
    //Extend the prototype
    BsLegend.prototype = {
        //addTo
        addTo: function( parent ){
            var _this = this,
                options = this.options,
                normalIcon = options.icon || 'fa-square text-white',
                normalIconContainerClass = '';

            //Add class to normal-icon to make it visible when working = off
            if ($.isArray(normalIcon))
                normalIconContainerClass = ' hide-for-bsl-working';
            else
                normalIcon = normalIcon + ' hide-for-bsl-working';
            /*
            Create 2+1 icons:
            The first for layer=visible contains of two icons: normal and working
            The second for layer=hidden contains not-visible-icon
            */
            var icon = [
                    [normalIcon, 'show-for-bsl-working fa-fw fas fa-spinner fa-spin no-margin-left'],
                    'fa-fw fas fa-eye-slash ' + (this.options.hiddenIconClass || '')
                ];


            this.parent = parent;
            if (!this.$container){
                //Create modal-content
                var modalContentOptions = {

                    //noVerticalPadding: true,
                    //noHorizontalPadding: true,
                    noShadow: true,
                    header: {
                        icon: icon,
                        text: options.text
                    },
                    onInfo   : options.onInfo,
                    onWarning: options.onWarning,
                    icons: {
                    },
                    content    : '',
                    closeButton: false
                };

                if (options.content){
                    modalContentOptions.extended   = {content: options.content};
                    modalContentOptions.isExtended = true;
                }

                options.onRemove = options.onRemove || options.onClose;
                if (options.onRemove)
                    modalContentOptions.icons.close = {
                        title  : {da:'Skjul', en:'Hide'},
                        onClick: $.proxy(this.remove, this)
                    };
                this.$container    = $('<div/>')._bsModalContent(modalContentOptions);
                this.$modalContent = this.$container.bsModal.$modalContent;


                //Find all header icons
                this.stateIcons = this.$container.bsModal.$header.children();
                $(this.stateIcons[0]).addClass('fa-fw ' + (this.options.normalIconClass || '') + normalIconContainerClass);


                this.actionIcons = {};
                $.each(['warning', 'info', 'help', 'close'], function(index, id){
                    _this.actionIcons[id] = _this.$container.find('[data-header-icon-id="'+id+'"]');
                });

                this.$header = this.$container.find('.modal-header');

                this.setStateNormal();
                this.workingOff();
            }

            this.$container.appendTo(this.parent.$modalBody);

        },

        //Show or hide icons
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


        //Remove legend
        remove: function(){
            this.parent.removeLegend(this);
        },
        onRemove: function(){
            if (this.$container)
                this.$container.detach();
            this.options.onRemove(this);
        },

        //update
        update: function(){
            if (this.options.onUpdate)
                this.options.onUpdate(this);
        },



    };


}(jQuery, L, this, document));



