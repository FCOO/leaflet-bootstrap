/****************************************************************************
leaflet-bootstrap-control-button-box.js

Create a bsButton that opens a box with some content

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    /********************************************************************************
    L.control.bsButtonBox
    Create a bsButton that opens a box with bs-content given by options.content
    ********************************************************************************/
    L.control.BsButtonBox = L.control.BsButton.extend({
        options: {

        },
        _createContent: function(){
            //Create container
            var $container =
                    $('<div/>')
                        .addClass('leaflet-button-box')
                        .addClass(this.options.className)
                        .modernizrToggle('extended', !!this.options.extended),
                onToggle = $.proxy(this.toggle, this);

            //Adjust options for the button and create it
            var buttonOptions = $.extend(true, {}, {
                        onClick        : onToggle,
                        semiTransparent: true,
                        square         : true
                    },
                    this.options
                );

            this.bsButton =
                $.bsButton(buttonOptions)
                .addClass('hide-for-extended')
                .appendTo($container);

            //Create container for extended content
            var $contentContainer = this.$contentContainer =
                $('<div/>')
                    ._bsAddBaseClassAndSize({
                        baseClass   : 'modal-dialog',
                        class       : 'modal-dialog-inline',
                        useTouchSize: true,
                        small       : true
                    })
                    .width('auto')
                    .addClass('show-for-extended')
                    .appendTo($container);

            //this.options = bsModal-options OR function($container, options, onToggle)
            if ($.isFunction(this.options.content))
                this.options.content($contentContainer, this.options, onToggle);
            else {
                //Adjust options for the content (modal) and create the it
                var modalOptions = $.extend(true, {},
                    //Default options
                    {
                        closeButton     : false,
                        clickable       : true,
                        semiTransparent : true,
                        extended        : null,
                        minimized       : null,
                        isExtended      : false,
                        isMinimized     : false,
                        width           : this.options.width || 100,
                    },
                    this.options.content,
                    //Forced options
                    {
                        show: false,

                    }
                );

                //Add close icon to header (if any)
                if (!modalOptions.noHeader && modalOptions.header && !(modalOptions.icons && modalOptions.icons.close)){
                    modalOptions.icons = modalOptions.icons || {};
                    modalOptions.icons.close = { onClick: onToggle };
                }

                //Add default onClick
                if (modalOptions.clickable && !modalOptions.onClick)
                    modalOptions.onClick = onToggle;

                $contentContainer._bsModalContent(modalOptions);
            }
            return $container;
        },


        //toggle : change between button-state and extended
        toggle: function(){
            $(this.getContainer()).modernizrToggle('extended');
            return false;
        }
    });




    L.control.bsButtonBox = function(options){ return new  L.control.BsButtonBox(options); };
}(jQuery, L, this, document));


;
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
//        options       : { vertical: true },
        _createContent: function(){ return $.bsRadioButtonGroup(this.options); }
    });

    L.control.bsButton           = function(options){ return new L.control.BsButton(options);           };
    L.control.bsButtonGroup      = function(options){ return new L.control.BsButtonGroup(options);      };
    L.control.bsRadioButtonGroup = function(options){ return new L.control.BsRadioButtonGroup(options); };


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
leaflet-bootstrap-control-scale.js

Create a scale inside a buttonBox
Imported from fcoo/leaflet-double-scale witch is based on
leaflet-graphicscale by Erik Escoffier
https://github.com/nerik/leaflet-graphicscale

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    /********************************************************************************
    L.control.bsScale
    Create a bsButtonBox with the scale
    ********************************************************************************/
    L.control.BsScale = L.control.BsButtonBox.extend({
        options: {
            icon                : 'fa-ruler-horizontal',//Icon for bsButton
            mode                : 'both',               //'metric', 'nautical', or 'both'
            position            : 'bottomleft',
            minUnitWidth        : 40,
            maxUnitsWidth       : 200,                  //Max width
            maxUnitsWidthPercent: 90,                   //Max width as percent of map wisth
            width               : 'auto',
            content: {
                modalContentClassName: 'leaflet-bootstrap-control-scale',
                semiTransparent      : true,
                clickable            : true,
                noHeader             : true,
                content              : '&nbsp;'
            },
            numeralFormat: '0,0[.]0', //String or function
        },

		onAdd: function (map) {
			this._map = map;
			var result = L.control.BsButtonBox.prototype.onAdd.call(this, map ),
                $body = this.$contentContainer.bsModal.$body;

            $body.empty();

            //Create and add nautical-scale
            this.naticalScale = new L.Control.SingleScale( L.extend({type:'nautical', labelPlacement:'top', parent:this}, this.options ) );
            this.$naticalScaleContainer = $(this.naticalScale.onAdd( this._map )).appendTo( $body );

            //Create and add metric-scale
            this.metricScale = new L.Control.SingleScale( L.extend({type:'metric', labelPlacement:'bottom', parent:this}, this.options ) );
            this.$metricScaleContainer = $(this.metricScale.onAdd( this._map )).appendTo( $body );

            this.setMode( this.options.mode, result );

			return result;
		},

        onRemove: function (map) {
            this.metricScale.onRemove(map);
            this.nauticalScale.onRemove(map);
        },

        setMode: function( mode, container ){
            this.options.mode = mode;

            $(this.getContainer() || container).toggleClass('both', mode == 'both');

            //naticalScale
            this.$naticalScaleContainer.toggleClass('hidden', (mode == 'metric'));
            if ((mode == 'both') || (mode == 'nautical'))
                this.naticalScale._setLabelPlacement( mode == 'both' ? 'top' : 'bottom' );

            //metricScale
            this.$metricScaleContainer.toggleClass('hidden', mode == 'nautical');
        }
    });


    /********************************************************************************
    L.Control.SingleScale
    Leaflet control representning a simgle scale
    ********************************************************************************/
    function $div( className ){ return $('<div/>').addClass(className); }

    L.Control.SingleScale = L.Control.extend({
        options: {
            type: 'nautical',//'metric', or 'nautical'
        },

        onAdd: function(map) {
            this._map = map;

            //number of units on the scale, by order of preference
            this._possibleUnitsNum = [3, 5, 2, 4, 1];
            this._possibleUnitsNumLen = this._possibleUnitsNum.length;

            //how to divide a full unit, by order of preference
            this._possibleDivisions = [1, 0.5, 0.25, 0.2];
            this._possibleDivisionsLen = this._possibleDivisions.length;

            this._possibleDivisionsSub = {
                1   : { num: 2, division: 0.5  },
                0.5 : { num: 5, division: 0.1  },
                0.25: { num: 5, division: 0.05 },
                0.2 : { num: 2, division: 0.1  }
            };

            //Build the scale
            var $result = $div('leaflet-control-singlescale');
            this.$scaleInner = $div('leaflet-control-singlescale-inner').appendTo($result);
            var $units = $div('units').appendTo(this.$scaleInner);

            this.$units = [];
            this.$unitsLbls = [];

            for (var i=0; i<5; i++) {
                var fill = (i%2 === 0),
                    $unit = $div('division').append([
                                $div('line' ).append( $div(fill ? 'fill'  : 'fill2') ),
                                $div('line2').append( $div(fill ? 'fill2' : 'fill' ) )
                            ]).appendTo($units);

                this.$units.push($unit);
                this.$unitsLbls.push( $div('label divisionLabel').appendTo($unit) );
            }

            this.$zeroLbl =
                $div('label zeroLabel')
                    .text('0')
                    .appendTo(this.$units[0]);

            this._setLabelPlacement( this.options.labelPlacement );

            map.on('move', this._update, this);
            map.on('resize', this._resize, this);
            map.whenReady(this._resize, this);

            return $result[0];
        },

        onRemove: function (map) {
            map.off('move', this._update, this);
            map.off('resize', this._resize, this);
        },

        _setLabelPlacement: function( labelPlacement ){
            this.$scaleInner
                .removeClass('labelPlacement-top labelPlacement-bottom' )
                .addClass   ('labelPlacement-' + labelPlacement);
        },

        _resize: function(){
            if (!this.options.original_maxUnitsWidth){
                //Save original maxUnitsWidth and force _update
                this.options.original_maxUnitsWidth = this.options.maxUnitsWidth;
                this.options.maxUnitsWidth = 0;
            }

            var new_maxUnitsWidth = Math.max(
                                        this.options.minUnitWidth,
                                        Math.min(
                                            this.options.original_maxUnitsWidth,
                                            this._map.getSize().x * this.options.maxUnitsWidthPercent / 100
                                        )
                                    );
            if (new_maxUnitsWidth != this.options.maxUnitsWidth){
                this.options.maxUnitsWidth = new_maxUnitsWidth;
                this._update();
            }
        },

        _update: function () {
            var bounds = this._map.getBounds(),
                centerLat = bounds.getCenter().lat,
                //length of an half world arc at current lat
                halfWorldMeters = 6378137 * Math.PI * Math.cos(centerLat * Math.PI / 180),
                //length of this arc from map left to map right
                dist = halfWorldMeters * (bounds.getNorthEast().lng - bounds.getSouthWest().lng) / 180,
                size = this._map.getSize();

            if (this.options.type == 'nautical'){
                dist = dist/1.852;
            }

            if (size.x > 0) {
                this._updateScale(dist, this.options);
            }
        },

        _updateScale: function(maxMeters, options) {
            var scale = this._getBestScale(maxMeters, options.minUnitWidth, options.maxUnitsWidth);
            this._render(scale);
        },

        _getBestScale: function(maxMeters, minUnitWidthPx, maxUnitsWidthPx) {
            //favor full units (not 500, 25, etc)
            //favor multiples in this order: [3, 5, 2, 4]
            //units should have a minUnitWidth
            //full scale width should be below maxUnitsWidth
            //full scale width should be above minUnitsWidth ?

            var possibleUnits = this._getPossibleUnits( maxMeters, minUnitWidthPx, this._map.getSize().x );
            var possibleScales = this._getPossibleScales(possibleUnits, maxUnitsWidthPx);
            possibleScales.sort(function(scaleA, scaleB) {
                return scaleB.score - scaleA.score;
            });

            return possibleScales[0];
        },

        _getPossibleScales: function(possibleUnits, maxUnitsWidthPx) {
            var scales = [];
            var minTotalWidthPx = Number.POSITIVE_INFINITY;
            var fallbackScale;

            for (var i = 0; i < this._possibleUnitsNumLen; i++) {
                var numUnits = this._possibleUnitsNum[i];
                var numUnitsScore = (this._possibleUnitsNumLen-i)*0.5;

                for (var j = 0; j < possibleUnits.length; j++) {
                    var unit = possibleUnits[j];
                    var totalWidthPx = unit.unitPx * numUnits;
                    var scale = {
                            unit: unit,
                            totalWidthPx: totalWidthPx,
                            numUnits: numUnits,
                            score: 0
                        };

                    //TODO: move score calculation  to a testable method
                    var totalWidthPxScore = 1-(maxUnitsWidthPx - totalWidthPx) / maxUnitsWidthPx;
                    totalWidthPxScore *= 10;

                    var score = unit.unitScore + numUnitsScore + totalWidthPxScore;

                    //penalty when unit / numUnits association looks weird
                    if (
                        unit.unitDivision === 0.25 && numUnits === 3 ||
                        unit.unitDivision === 0.5 && numUnits === 3 ||
                        unit.unitDivision === 0.25 && numUnits === 5
                    ) {
                        score -= 2;
                    }

                    scale.score = score;

                    if (totalWidthPx < maxUnitsWidthPx) {
                        scales.push(scale);
                    }

                    //keep a fallback scale in case totalWidthPx < maxUnitsWidthPx condition is never met
                    //(happens at very high zoom levels because we dont handle submeter units yet)
                    if (totalWidthPx < minTotalWidthPx) {
                        minTotalWidthPx = totalWidthPx;
                        fallbackScale = scale;
                    }
                }
            }

            if (!scales.length)
                scales.push(fallbackScale);
            return scales;
        },

        /**
        Returns a list of possible units whose widthPx would be < minUnitWidthPx
        **/
        _getPossibleUnits: function(maxMeters, minUnitWidthPx, mapWidthPx) {
            var exp = (Math.floor(maxMeters) + '').length;

            var unitMetersPow;
            var units = [];

            for (var i = exp; i > 0; i--) {
                unitMetersPow = Math.pow(10, i);
                for (var j = 0; j < this._possibleDivisionsLen; j++) {
                    var unitMeters = unitMetersPow * this._possibleDivisions[j];
                    var unitPx = mapWidthPx * (unitMeters/maxMeters);
                    if (unitPx < minUnitWidthPx) {
                        return units;
                    }
                    units.push({
                        unitMeters: unitMeters,
                        unitPx: unitPx,
                        unitDivision: this._possibleDivisions[j],
                        unitScore: this._possibleDivisionsLen-j
                    });
                }
            }

            return units;
        },

        _render: function(scale) {
            var _this = this,
                displayUnit = this._getDisplayUnit(scale.unit.unitMeters),
                numFormat   = this.options.parent.options.numeralFormat;

            //Get numeral format
            numFormat = $.isFunction(numFormat) ? numFormat(this) : numFormat;

            this.$lastLbl = null;
            $.each( this.$units, function(index, $division){
                var showDivision = (index < scale.numUnits);
                $division
                    .width(showDivision ? scale.unit.unitPx + 'px' : 0)
                    .toggleClass('hidden', !showDivision);

                if (!_this.$unitsLbls)
                    return true;

                var $lbl = _this.$unitsLbls[index];
                $lbl
                    .removeClass()
                    .addClass('label divisionLabel');

                if (showDivision) {
                    var lblText = window.numeral( (index+1)*displayUnit.amount ).format(numFormat);

                    if (index === scale.numUnits-1) {
                        lblText += displayUnit.unit;
                        $lbl.addClass('labelLast');
                        _this.$lastLbl = $lbl;
                    }
                    else
                        $lbl.addClass('labelSub');
                    $lbl.html('<span>'+ lblText + '</span>');
                }
            });


            //Set timeout to adjust right-padding to fix last label
            if (this.timeoutId)
                window.clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout( function(){
                var halfLabelWidth = (_this.$lastLbl.children().first().width() || 0) / 2;
                if (halfLabelWidth)
                    _this.$scaleInner.css('margin-right', halfLabelWidth + 'px');
            }, 100);
        },

        _getDisplayUnit: function(meters) {
            if (this.options.type == 'metric'){
                var displayUnit = (meters<1000) ? 'm' : 'km';
                return {
                    unit: displayUnit,
                    amount: (displayUnit === 'km') ? meters / 1000 : meters
                };
            }
            else
                return {
                    unit  : 'nm',
                    amount: meters /1000
                };
        }
    });//end of L.Control.SingleScale = L.Control.extend({


    //********************************************************************************
    L.Map.mergeOptions({
        bsScaleControl: false
    });

    L.Map.addInitHook(function () {
        if (this.options.bsScaleControl) {
            this.bsScaleControl = new L.Control.bsSScale();
            this.addControl(this.bsScaleControl);
        }
    });

    L.control.bsScale = function(options){ return new L.control.BsScale(options); };

}(jQuery, L, this, document));


;
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


}(jQuery, L, this, document));

;
/****************************************************************************
    leaflet-bootstrap-tooltip.js,

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



    /*********************************************************
    Extend L.Layer with methods to show and hide tooltip
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

    /*********************************************************
    Overwrite L.Layer.bindTooltip to check for this.options
    regarding tooltip and add events to hide tooltips when
    popup is open
    *********************************************************/
    L.Layer.prototype.bindTooltip = function( bindTooltip ){
        return function(content, options){
            if (this && this.options){
                options =
                    $.extend({
                        sticky          : !this.options.tooltipPermanent,       //If true, the tooltip will follow the mouse instead of being fixed at the feature center.
                        interactive     : false,                                //If true, the tooltip will listen to the feature events.
                        permanent       : this.options.tooltipPermanent,        //Whether to open the tooltip permanently or only on mouseover.
                        hideWhenDragging: this.options.tooltipHideWhenDragging  //True and tooltipPermanent: false => the tooltip is hidden when dragged
                    }, options);

                this.on('popupopen',  this._hideTooltipWhenPopupOpen,  this);
                this.on('popupclose', this._showTooltipWhenPopupClose, this);
            }
            return bindTooltip.call( this, content, options );
        };
    }( L.Layer.prototype.bindTooltip );

    L.Layer.prototype._hideTooltipWhenPopupOpen = function(){
        if (this && this.options && this.options.tooltipHideWhenPopupOpen && !this.options.tooltipPermanent)
            this.hideTooltip();
    };

    L.Layer.prototype._showTooltipWhenPopupClose = function(){
        if (this && this.options && this.options.tooltipHideWhenPopupOpen && !this.options.tooltipPermanent)
            this.showTooltip();
    };

}(jQuery, L, this, document));




;
/****************************************************************************
    leaflet-bootstrap.js,

    (c) 2017, FCOO

    https://github.com/FCOO/leaflet-bootstrap
    https://github.com/FCOO

****************************************************************************/
(function (/*$, L, window, document, undefined*/) {
    "use strict";

}(jQuery, L, this, document));



