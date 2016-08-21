"use strict";
var Well = (function () {
    function Well() {
        this.isComplete = false;
        this.isTainted = false;
        this.locationName = "";
        this.sampleName = "";
        this.reactionTime = 5.0;
        this.uid = "";
    }
    Well.prototype.Well = function () { };
    return Well;
}());
exports.Well = Well;
//# sourceMappingURL=well.class.js.map