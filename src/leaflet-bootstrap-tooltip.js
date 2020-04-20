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
keepInView: true,
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



