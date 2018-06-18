/****************************************************************************
    leaflet-bootstrap.js,

    (c) 2017, FCOO

    https://github.com/FCOO/leaflet-bootstrap
    https://github.com/FCOO

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";


    //Override L.DivOverlay._updateContent to also accept content-object from jquery-bootstrap
    L.DivOverlay.prototype._updateContent = function (_updateContent) {
        return function () {
            if (!this._content) { return; }

            var $node = $(this._contentNode);
            var content = $.isFunction(this._content) ? this._content(this._source || this) : this._content;

            $node.empty();

            if ((typeof content === 'string') || (content instanceof HTMLElement))
                //Use original function/method
                _updateContent.apply(this, arguments);
            else {
                $node._bsAddHtml( content );
                this.fire('contentupdate');
            }
        };
    } (L.DivOverlay.prototype._updateContent);

/*
Map.mergeOptions({
    zoomControl: true
});
Map.addInitHook(function () {
    if (this.options.zoomControl) {
        this.zoomControl = new Zoom();
        this.addControl(this.zoomControl);
    }
});

*/


/*
    //Extend base leaflet class
    L.LeafletBootstrap = L.Class.extend({
        includes: L.Mixin.Events,

    //or extend eq. L.Control
    //L.Control.LeafletBootstrap = L.Control.extend({

    //Default options
        options: {
            VERSION: "{VERSION}"

        },

        //initialize
        initialize: function(options) {
            L.setOptions(this, options);

        },

        //addTo
        addTo: function (map) {
            L.Control.prototype.addTo.call(this, map); //Extend eq. L.Control

            return this;
        },


        //onAdd
        onAdd: function (map) {
            this._map = map;
            var result = L.Control.Box.prototype.onAdd.call(this, map );

            //Create the object/control


            return result;
        },

        //myMethod
        myMethod: function () {

        }
    });
*/

    //OR/AND extend a prototype-method (METHOD) of a leaflet {CLASS}

    /***********************************************************
    Extend the L.{CLASS}.{METHOD} to do something more
    ***********************************************************/
/*
    L.{CLASS}.prototype.{METHOD} = function ({METHOD}) {
        return function () {
    //Original function/method
    {METHOD}.apply(this, arguments);

    //New extended code
    ......extra code

        }
    } (L.{CLASS}.prototype.{METHOD});
*/


}(jQuery, L, this, document));



