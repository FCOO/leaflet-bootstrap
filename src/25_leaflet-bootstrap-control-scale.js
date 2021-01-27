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
    L.Control.BsScale
    Create a bsButtonBox with the scale
    ********************************************************************************/
    L.Control.BsScale = L.Control.BsButtonBox.extend({
        options: {
            icon                : 'fa-ruler-horizontal',//Icon for bsButton
            mode                : 'METRIC',             //'METRIC', 'NAUTICAL', or 'BOTH'
            showBoth            : false,
            showReticle         : false,

            position            : 'bottomright',
            minUnitWidth        : 40,
            maxUnitsWidth       : 200,                  //Max width
            maxUnitsWidthPercent: 90,                   //Max width as percent of map wisth
            width               : 'auto',
            content: {
                modalContentClassName: 'leaflet-bootstrap-control-scale',
                semiTransparent      : true,
                clickable            : true,
                noHeader             : true,
                content              : 'This is not empty'
            },
            numeralFormat  : '0,0[.]0',                  //String or function
            shadowColor: 'rgba(255,255,255,.28)',        //Shadow for Reticle
            textBackgroundColor: "rgba(255,255,255,.6)", //Background for reticle label
        },

        initialize: function(options){
            //Set default BsButtonBox-options and own options
            L.Control.BsButtonBox.prototype.initialize.call(this, options);

            //Set default tooltip-diretion
            if (!this.options.tooltipDirection)
                this.options.tooltipDirection = (this.options.position.indexOf('top') !== -1) ? 'bottom' : 'top';

            //Set popup-items - two different modes: With and without options.selectFormat
            var reticlePopup = {
                    id          : 'showReticle',
                    icon        : 'fa-ruler-combined', text: {da:'Vis trådkors', en:'Show Reticle'},
                    type        : 'checkbox',
                    closeOnClick: false,
                    selected    : this.options.showReticle,
                    onChange    : $.proxy(this._onShowReticle, this)
                };

            this._adjustPopupList(
                //Items above options.popupList
                options.selectFormat ? [
                    {icon: this.options.icon, text: {da:'Skala (in situ)', en:'Scale (in situ)'} },
                    reticlePopup,
                    {type:'checkbox', id:'showBoth', text: {da:'Vis km og nm', en:'Show km and nm'}, selected: this.options.showBoth, onChange: $.proxy(this._setBoth, this), closeOnClick: false},
                ] : [
                    {icon: this.options.icon, text: {da:'Vis', en:'Show'} },
                    reticlePopup,
                    {
                        radioGroupId: 'mode',
                        type        :'radio',
                        selectedId  : this.options.mode,
                        closeOnClick: true,
                        onChange    : $.proxy(this.setMode, this),
                        list: [
                            {id:'METRIC',   text: {da:'Kilometer', en:'Metric'}     },
                            {id:'NAUTICAL', text: {da:'Sømil', en:'Nautical miles'} },
                            {id:'BOTH',     text: {da:'Begge', en:'Both'}           }
                        ]
                    }
                ],

                //Items belows options.popupList
                options.selectFormat ?
                    [{type:'button',   icon:'fa-cog',           text: {da:'Format...', en:'Format...'}, onClick: $.proxy(this.options.selectFormat, this), closeOnClick: true, }] :
                    null
            );
        },

        onAdd: function (map) {
            this._map = map;
            var result = L.Control.BsButtonBox.prototype.onAdd.call(this, map ),
                $contentContainer = this.$contentContainer.bsModal.$body;

            this.$container
                .addClass( 'leaflet-button-box-scale' )
                .addClass( $._bsGetSizeClass({baseClass: 'leaflet-button-box-scale', useTouchSize: true}) );

            //Create and add nautical-scale
            $contentContainer.empty();
            this.nauticalScale = new L.Control.SingleScale( L.extend({type:'NAUTICAL', labelPlacement:'top', parent:this}, this.options ) );
            this.$nauticalScaleContainer = $(this.nauticalScale.onAdd( this._map )).appendTo( $contentContainer );

            //Create and add metric-scale
            this.metricScale = new L.Control.SingleScale( L.extend({type:'METRIC', labelPlacement:'bottom', parent:this}, this.options ) );
            this.$metricScaleContainer = $(this.metricScale.onAdd( this._map )).appendTo( $contentContainer );

            //Create and add Reticle-marker
            this.reticleMarker =
                new L.Marker.Reticle([0,0], {
                        interactive: false,
                        keyboard   : false,
                        icon       : new L.Icon.Reticle(),
                        pane       : map.getPaneBelow('tooltipPane'),
                        shadowColor        : this.options.shadowColor,
                        textBackgroundColor: this.options.textBackgroundColor,
                    });
            this.reticleMarker.parent = this;
            this.reticleMarker.addTo(map);
            this.onShowReticle(this.options.showReticle);

            this.setMode( this.options.mode, result );
            return result;
        },

        onRemove: function (map) {
            this.metricScale.onRemove(map);
            this.nauticalScale.onRemove(map);

            this.reticleMarker.remove();
        },

        _setBoth: function(id, selected){
            this.setBoth(selected);
        },

        setBoth: function(selected){
            this.options.showBoth = selected;
            this.setMode( this.options.mode );
            this._onChange();
        },

        setMode: function(mode, container){
            this.options.mode = mode;

            if (this.options.selectFormat)
                mode = this.options.showBoth ? 'BOTH' : mode;
            $(this.getContainer() || container).toggleClass('both', mode == 'BOTH');

            //nauticalScale
            this.$nauticalScaleContainer.toggleClass('hidden', (mode == 'METRIC'));
            if ((mode == 'BOTH') || (mode == 'NAUTICAL'))
                this.nauticalScale._setLabelPlacement( mode == 'BOTH' ? 'top' : 'bottom' );

            //metricScale
            this.$metricScaleContainer.toggleClass('hidden', mode == 'NAUTICAL');

            this._updateScales();

            //Update the reticle-marker
            this.reticleMarker._update();

            this._onChange();
        },

        _updateScales: function(){
            if (this.nauticalScale)
                this.nauticalScale._update();
            if (this.metricScale)
                this.metricScale._update();
        },

        onChange: function(/*state*/){
            this._updateScales();
        },

        _onShowReticle: function(id, selected){
            this.onShowReticle(selected);
        },
        onShowReticle: function(show){
            this.options.showReticle = show;
            this.reticleMarker.setShow(this.options.showReticle && this.options.show);

            this._onChange();

        },

        getState: function(BsButtonBox_getState){
            return function () {
//HERconsole.log('getState scale', this);

                return $.extend(
                    this.options.selectFormat ? {showBoth: this.options.showBoth} : {mode: this.options.mode},
                    {showReticle: this.options.showReticle},
                    BsButtonBox_getState.call(this)
                );
            };
        }(L.Control.BsButtonBox.prototype.getState),

        setState: function(BsButtonBox_setState){
            return function (options) {

//HERconsole.log('setState scale', this);
                BsButtonBox_setState.call(this, options);
                if (this.options.selectFormat)
                    this.setBoth(this.options.showBoth);
                else
                    this.setMode(this.options.mode);
                this.onShowReticle(this.options.showReticle);
                return this;
            };
        }(L.Control.BsButtonBox.prototype.setState),

    });


    /********************************************************************************
    L.Control.SingleScale
    Leaflet control representning a single scale
    ********************************************************************************/
    function $div( className ){ return $('<div/>').addClass(className); }

    L.Control.SingleScale = L.Control.extend({
        options: {
            type: 'NAUTICAL',//'METRIC', or 'NAUTICAL'
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

            //Add events
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
            if (!this._map || !this._map._loaded || !this.options.parent.options.isExtended) return;


            //Update the scale
            /*The old AND INCORRECT method
            var bounds = this._map.getBounds(),
                centerLat = bounds.getCenter().lat,

                //length of an half world arc at current lat
                halfWorldMeters = 6378137 * Math.PI * Math.cos(centerLat * Math.PI / 180),
                //length of this arc from map left to map right
                dist = halfWorldMeters * (bounds.getNorthEast().lng - bounds.getSouthWest().lng) / 180,

                size = this._map.getSize();
            */

            //New methods to calc dist. Assume that the control is placed at the bottom of the map - TOD: Check for position
            var bounds = this._map.getBounds(),
                dist   = this._map.distance(bounds.getSouthEast(), bounds.getSouthWest()),
                size   = this._map.getSize();

            if (this.options.type == 'NAUTICAL'){
                dist = dist/1.852;
            }

            if (size.x > 0) {
                this._updateScale(dist, this.options);
            }
        },

        _updateScale: function(maxMeters, options) {
            var scale = this._getBestScale(maxMeters, options.minUnitWidth, options.maxUnitsWidth);
            if (scale)
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

                    //Never allow scale to be wider that maxUnitsWidthPx
                    var score = totalWidthPx > maxUnitsWidthPx ? 0 : unit.unitScore + numUnitsScore + totalWidthPxScore;

                    //penalty when unit / numUnits association looks weird
                    if (
                        unit.unitDivision === 0.25 && numUnits === 3 ||
                        unit.unitDivision === 0.5 && numUnits === 3 ||
                        unit.unitDivision === 0.25 && numUnits === 5
                    ) {
                        score -= 10;
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
            if (this.options.type == 'METRIC'){
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


    /********************************************************************************
    L.Control.Reticle
    Leaflet control representning a reticle at map center

    Modified version of leaflet-reticle
    https://github.com/rwev/leaflet-reticle by https://github.com/rwev
    ********************************************************************************/
    L.Icon.Reticle = L.DivIcon.extend({
        options: {
            className : 'visible', //Must be <> ""
            iconSize  : [10, 10],
            iconAnchor: [ 0,  0],
        }
    });

    L.Marker.Reticle = L.Marker.extend({
        options: {
            margin     : 20,
            tickLength : 11,
            maxLength  : 125,
            shadowColor        : 'rgba(255,255,255,.28)',
            fontSize           : 12,
            textBackgroundColor: "rgba(255,255,255,.6)"
        },

        onAdd: function(map) {
            var result = L.Marker.prototype.onAdd.apply(this, arguments);

            this.canvas = document.createElement(`canvas`);

            this.options.canvasDim = 2*this.options.maxLength;

            this.canvas.width = this.options.canvasDim;
            this.canvas.height = this.options.canvasDim;
            $(this.canvas)
                .css({
                    'margin-top' : -this.options.margin + 'px',
                    'margin-left': -this.options.margin + 'px'
                })
                .addClass('icon-reticle')
                .appendTo(this._icon);

            this.ctx = this.canvas.getContext(`2d`);

            map.on('move', this._update, this);
            map.whenReady(this._update, this);

            return result;
        },

        onRemove: function(map){
            map.off('move', this._update, this);
            this.canvas = null;
            return L.Marker.prototype.onRemove.apply(this, arguments);
        },

        setShow: function(show){
            $(this._icon).toggle(!!show);
        },

        _update: function() {
            if (!this._map || !this._map._loaded) return;

            var center = this._map.getCenter();
            this.setLatLng(center);

            //Reset canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            //Draw scales
            this.ctx.fillStyle   = 'black';
            this.ctx.strokeStyle = 'black';
            this.ctx.font = 'normal ' + this.options.fontSize + 'px Verdana';

            //Calc max distance covered (in meter) from center within the maximum width/height of the ruler
            var mapSize = this._map.getSize(),
                centerX = mapSize.x / 2,
                centerY = mapSize.y / 2,
                maxWidthDist =  this._map.distance( this._map.getCenter(), this._map.containerPointToLatLng( [centerX + this.options.maxLength, centerY] ) ),
                maxHeightDist = this._map.distance( this._map.getCenter(), this._map.containerPointToLatLng( [centerX, centerY + this.options.maxLength] ) ),


                scaleLength = 0,
                mode     = this.parent.options.mode,
                modeIsNautical = mode == 'NAUTICAL',
                showBoth = this.parent.options.showBoth;


            //Draw horizontal scale(s)
            if (showBoth){
                scaleLength = this.drawOneScale(maxWidthDist, false, false, true);
                this.drawOneScale(maxWidthDist, false, true,  false, scaleLength);
            }
            else
                scaleLength = this.drawOneScale(maxWidthDist, false, false, modeIsNautical);

            //Draw vertical scale(s)
            if (showBoth){
                scaleLength = this.drawOneScale(maxHeightDist, true, false, true);
                this.drawOneScale(maxHeightDist, true, true,  false, scaleLength);
            }
            else
                this.drawOneScale(maxHeightDist, true, false, modeIsNautical);

        },

        /********************************************
        drawOneScale
        *********************************************/
        drawOneScale: function(maxDistMeter, vertical, ticksBelow, isNautical, existingScaleLength = 0) {
            var maxDistUnit = maxDistMeter,
                unitStr = 'm';

            if (isNautical){
                unitStr = 'nm';
                maxDistUnit = maxDistMeter / 1852;
            }
            else
                if (maxDistMeter > 1000){
                    unitStr = 'km';
                    maxDistUnit = maxDistMeter / 1000;
                }

            //Get ratio (current-dim / max-dim) and label
            var pow10 = Math.pow(10, (''+Math.floor(maxDistUnit)).length - 1),
                digit = maxDistUnit / pow10;

            digit = digit >= 10 ? 10 : digit >= 8 ? 8 : digit >= 6 ? 6 : digit >= 5 ? 5 : digit >= 4 ? 4 : digit >= 3 ? 3 : digit >= 2 ? 2 : 1;

            var currentDistUnit = pow10 * digit,
                ratio = currentDistUnit / maxDistUnit,
                label = window.numeral(currentDistUnit).format(this.parent.options.numeralFormat) +' ' + unitStr,

                //Get scale length and number of ticks
                scaleLength = this.options.maxLength * ratio,
                sections = digit == 1 ? 5 : digit == 3 ? 3 : digit == 5 ? 5 : digit == 6 ? 3 : 4,
                delta = scaleLength / sections,

                //Use negative tick-lenght to draw above the line
                tickLgd = (ticksBelow ? +1 : -1) * this.options.tickLength;


            //Draw line
            if (vertical) {
                if (scaleLength > existingScaleLength)
                    this.drawVLine(0, -this.options.tickLength + existingScaleLength, scaleLength - existingScaleLength + this.options.tickLength);
            }
            else {
                if (scaleLength > existingScaleLength)
                    this.drawHLine(-this.options.tickLength + existingScaleLength, 0, scaleLength - existingScaleLength + this.options.tickLength);
            }


            //Draw ticks
            var i;
            if (vertical){
                var deltaMeter = Math.round(maxDistMeter*ratio/sections),
                    mapCenter = this._map.getCenter(),
                    mapCenterY = this._map.latLngToLayerPoint(mapCenter).y;

                for (i=1; i < sections; i++){
                    var nextPoint = mapCenter.rhumbDestinationPoint(i*deltaMeter, 180);
                    this.drawHLine(0, this._map.latLngToLayerPoint(nextPoint).y - mapCenterY, tickLgd/2);
                }
                this.drawHLine(0, scaleLength, tickLgd);
            }
            else {
                for (i=1; i < sections; i++)
                    this.drawVLine(i*delta, 0, tickLgd/2);
                this.drawVLine(scaleLength, 0, tickLgd);
            }

            //Draw label
            if (vertical){
                this.ctx.save();
                this.ctx.translate(0 , this.options.canvasDim);
                this.ctx.rotate(0.5*Math.PI);
                this.drawText(
                    label,
                     this.options.margin + scaleLength + 2 - this.options.canvasDim,
                    -this.options.margin + (ticksBelow ? -3 : this.options.fontSize)
                );
                this.ctx.restore();
            }
            else
                this.drawText(
                    label,
                    this.options.margin + scaleLength + 2,
                    this.options.margin + (ticksBelow ? 1 + this.options.fontSize : -2)
                );

            return scaleLength;
        },

        drawText: function(text, x, y){
            x = Math.round(x);
            y = Math.round(y);
            var textWidth = this.ctx.measureText(text).width,
                textHeight = this.options.fontSize;


            this.ctx.fillStyle = this.options.textBackgroundColor;
            this.ctx.fillRect(x-1, y-textHeight, textWidth+2, textHeight+2);

            this.ctx.fillStyle = 'black';
            this.ctx.fillText(text, x, y);
        },

        drawLine: function(xS, yS, xE, yE) {
            xS = Math.round(xS) + .5;
            yS = Math.round(yS) + .5;
            xE = Math.round(xE) + .5;
            yE = Math.round(yE) + .5;

            var extraX = 0, extraY = 0;
            if (xS < xE)
                extraX = 1;
            if (xS > xE)
                extraX = -1;
            if (yS < yE)
                extraY = 1;
            if (yS > yE)
                extraY = -1;

            var margin = this.options.margin,
                ctx = this.ctx;

            ctx.save();
            ctx.strokeStyle = this.options.shadowColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(xS + margin + extraX, yS + margin + extraY);
            ctx.lineTo(xE + margin,          yE + margin);
            ctx.stroke();
            ctx.restore();

            ctx.beginPath();
            ctx.moveTo(xS + margin, yS + margin);
            ctx.lineTo(xE + margin, yE + margin);
            ctx.stroke();
        },

        drawVLine: function(x, y, lgd){
            this.drawLine(x, y, x, y+lgd);
        },

        drawHLine: function(x, y, lgd){
            this.drawLine(x, y, x+lgd, y);
        }
    });

    //********************************************************************************
    //********************************************************************************
    L.Map.mergeOptions({
        bsScaleControl: false,
        bsScaleOptions: {}
    });

    L.Map.addInitHook(function () {
        if (this.options.bsScaleControl) {
            this.bsScaleControl = new L.Control.BsScale(this.options.bsScaleOptions);
            this.addControl(this.bsScaleControl);
        }
    });

    L.control.bsScale = function(options){ return new L.Control.BsScale(options); };

}(jQuery, L, this, document));

