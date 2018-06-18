/****************************************************************************
leaflet-bootstrap-polyline.js

Extend L.Polyline with options to draw "shadow" and "almost over" zone

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";
    var override = function(method, fn, callBefore) {
        return callBefore ?
            function() {
                fn.apply(this, arguments);
                return method.apply(this, arguments);
            } :
            function() {
                method.apply(this, arguments);
                return fn.apply(this, arguments);
            }
    },
    beforeAndAfter = function(methodName, method, reverseOrder) {
        method = method || L.Polyline.prototype[methodName];
        return function(){
            var firstPolyline = reverseOrder ? this.touchZonePolyline : this.shadowPolyline,
                lastPolyline  = reverseOrder ? this.shadowPolyline : this.touchZonePolyline;

            if (firstPolyline)
                firstPolyline[methodName].apply(firstPolyline, arguments);

            var result = method.apply(this, arguments);

            if (lastPolyline)
                lastPolyline[methodName].apply(lastPolyline, arguments);
            return result;
        }
    };


    L.Polyline.include({

        /*****************************************************
        initialize
        *****************************************************/
        initialize: override( L.Polyline.prototype.initialize, function(){
            $.extend(this.options, {
                shadowStyle: {
                    width: 1,
                    color: 'yellow',//'white'
                    opacity: 1//0.5
                },
                touchZoneStyle: {
                    width: 4,
                    color: 'black', //'transparent',
                    opacity: .1 //1
                },
            });
            function extendOptions( options, style ){
                return $.extend({}, options, {
                    weight : options.weight+2*style.width,
                    color  : style.color,
                    opacity: style.opacity,
                    shadow: false,
                    touchZone: false
                });
            }

            if (this.options.shadow)
                this.shadowPolyline = L.polyline(this.getLatLngs(), extendOptions(this.options, this.options.shadowStyle) );

            if (this.options.touchZone)
                this.touchZonePolyline = L.polyline(this.getLatLngs(), extendOptions(this.options, this.options.touchZoneStyle) );
        }),

        /*****************************************************
        onAdd - Add Polyline, shadow and touch-zone
        *****************************************************/
        onAdd: beforeAndAfter( 'addTo', L.Polyline.prototype.onAdd ),

        /*****************************************************
        Bind tooltip to touchZonePolyline (if any)
        *****************************************************/
        bindTooltip: function(bindTooltip){
            return function(){
                bindTooltip.apply(this.touchZonePolyline || this, arguments);
            }
        }(L.Polyline.prototype.bindTooltip),

        /*****************************************************
        setLatLngs, bringToFront, bringToBack, removeFrom:
        All called for shadowPolyline and touchZonePolyline
        *****************************************************/
        setLatLngs  : beforeAndAfter('setLatLngs'),
        bringToFront: beforeAndAfter('bringToFront'),
        bringToBack : beforeAndAfter('bringToBack', null, true),
        removeFrom: beforeAndAfter('removeFrom'),
/*
removeFrom(layer) {
    if (layer && layer.hasLayer(this)) {
      layer.removeLayer(this);
    }
    return this;
  }
*/

    })

}(jQuery, L, this, document));

