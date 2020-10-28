/****************************************************************************
leaflet-bootstrap-control-legend.js

****************************************************************************/
(function ($, L, window, document, undefined) {
    "use strict";

//HER ns.mapLegendIcon = 'fa-list';  //TODO fa-th-list when forecast@mouse-position is implemented
/*
    var buttonBox = L.control.bsButtonBox({
        position: 'bottomright',
        icon: 'icon-leaflet-position-marker',
        square: true,

        content: {
            _noVerticalPadding: true,
            noHorizontalPadding: true,
            _noHeader: true,
            header: {
                text: 'The long header'
            },
            content: [
                {type:'button', semiTransparent: true, text:'Davs', small: true},
                {type:'button', text:'Davs2', small: true}
            ],
            width: 'auto',
            clickable: false,
            buttons:[{text:'klik'}],
            footer: { text: {da: 'Klik på signaturfork. for info', en:'Click on legend for info' }}


        }
    });
*/
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
        }
    });


    /*****************************************************************
    ******************************************************************
    Legend
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
                icon    = options.icon || 'fa-square text-white',
                extraIconClass = ['','',''];
            //Adjust icon to make it 1.25em width
            if ($.isArray(icon))
                extraIconClass[0] = 'fa-fw';
            else
                icon = icon + ' fa-fw';
            this.parent = parent;
            if (!this.$container){
                //Craete to modal-content
                var modalContentOptions = {

                    //noVerticalPadding: true,
                    //noHorizontalPadding: true,
                    noShadow: true,
                    header: {
                        icon: [icon, 'fa-fw fas fa-spinner fa-spin', 'fa-fw fas fa-eye-slash'],
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
                        onClick: $.proxy(this.remove, this)
                    };
                this.$container    = $('<div/>')._bsModalContent(modalContentOptions);
                this.$modalContent = this.$container.bsModal.$modalContent;


                //Find all header icons

                //First find the tree icons before header-text used to set state
                this.stateIcons = {};
                var iconList = this.$container.bsModal.$header.children();
                $.each(['normal', 'loading', 'hidden'], function(index, id){
                    _this.stateIcons[id] = $(iconList[index]).addClass(extraIconClass[index]);
                });


                this.actionIcons = {};
                $.each(['warning', 'info', 'help', 'close'], function(index, id){
                    _this.actionIcons[id] = _this.$container.find('[data-header-icon-id="'+id+'"]');
                });


                this.setStateNormal();
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

        setState: function(id){
            $.each(this.stateIcons, function(iconId, $icon){
                $icon.toggle(iconId == id);
            });
            return this;
        },

        setStateNormal   : function(){ return this.setState('normal'); },
        setStateLoading  : function(){ return this.setState('loading'); },
        setStateWorking  : function(){ return this.setStateLoading(); },
        setStateHidden   : function(){ return this.setState('hidden'); },
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



