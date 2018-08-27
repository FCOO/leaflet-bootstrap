/****************************************************************************
    leaflet-bootstrap.js,

    (c) 2017, FCOO

    https://github.com/FCOO/leaflet-bootstrap
    https://github.com/FCOO

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    /*********************************************************
    Overwrite L.Tooltip._initLayout to add leaflet-tooltip-permanent and
    leaflet-tooltip-big-icon big-to class-name (when needed)
    *********************************************************/
    L.Tooltip.prototype._initLayout = function( _initLayout ){
        return function(){
            if (this.options.permanent)
                this.options.className = (this.options.className || '') + ' leaflet-tooltip-permanent';

            if (this._source && this._source.$icon && this._source.$icon.hasClass('lbm-big'))
                this.options.className = (this.options.className || '') + ' leaflet-tooltip-big-icon';


            _initLayout.apply( this, arguments );
        };
    }( L.Tooltip.prototype._initLayout );


    /*********************************************************
    Overwrite L.Tooltip._updateContent to update tooltip with Bootstrap-content
    *********************************************************/
    L.Tooltip.prototype._updateContent = function () {
        $(this._contentNode)
            .empty()
            ._bsAddHtml( this._content );

		this.fire('contentupdate');
    };


}(jQuery, L, this, document));



