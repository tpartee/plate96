"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var core_2 = require("@angular/core");
var well_class_1 = require('./well.class');
var AppComponent = (function () {
    /* ### (ctor) Initialize AppComponent ### */
    function AppComponent() {
        this.wells = [];
        this.currentWell = 0;
        this.selectedCol = 1;
        this.selectedRow = 'A';
        this.rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        this._rowHash = {};
        this.cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        this._optdim = 0;
        this._offsetx = 0;
        this._offsety = 0;
        this.showWellOverlays = false;
        this.isAutoAdvanceEnabled = false;
        this._nameCount = 0;
        this._nameHash = {};
        this._fillColors = ['#8888ff', '#88ff88', '#ff8888'];
        this._strokeColors = ['#6666ee', '#66ee66', '#ee6666'];
        // Initialize all 96 wells to new unused objects
        for (var idx = 0; idx < 96; idx++) {
            this.wells[idx] = new well_class_1.Well();
            this.wells[idx].locationName = this.getWellLocationName(idx);
        }
        // Map the rows strings into a reverse-lookup hash to speed things up
        for (var idx = 0; idx < this.rows.length; idx++) {
            this._rowHash[this.rows[idx]] = idx;
        }
    }
    // ### User Event Handling ###
    AppComponent.prototype.onRowChange = function ($event) {
        console.log("Row Changed: " + $event);
        this.selectedRow = $event;
        this.setSelectedWell();
        $event.stopPropagation;
    };
    AppComponent.prototype.onColChange = function ($event) {
        console.log("Col Changed: " + $event);
        this.selectedCol = $event;
        this.setSelectedWell();
        $event.stopPropagation;
    };
    AppComponent.prototype.addClick = function ($event) {
        console.log("Add Clicked: " + $event);
        $event.stopPropagation;
        this.wells[this.currentWell].isComplete = true;
        if (!(this.wells[this.currentWell].sampleName in this._nameHash)) {
            this._nameHash[this.wells[this.currentWell].sampleName] = this._nameCount;
            this._nameCount++;
        }
        if (this.isAutoAdvanceEnabled) {
            this.currentWell = (this.currentWell >= 95) ? 0 : this.currentWell + 1;
            this.selectedCol = this.cols[this.currentWell % this.cols.length];
            this.selectedRow = this.rows[Math.floor(this.currentWell / this.rows.length)];
            this.setSelectedWell();
            this.reactionTime.nativeElement.focus();
        }
    };
    AppComponent.prototype.remClick = function ($event) {
        console.log("Remove Clicked: " + $event);
        $event.stopPropagation;
        this.wells[this.currentWell] = new well_class_1.Well();
        this.wells[this.currentWell].locationName = this.getWellLocationName(this.currentWell);
    };
    AppComponent.prototype.canvasClick = function ($event) {
        $event.stopPropagation;
        // Based on the size of the canvas, determine which well (if any) the user clicked on and change selection to it
        var hitx = Math.floor(($event.offsetX - this._offsetx) / this._optdim);
        var hity = Math.floor(($event.offsetY - this._offsety) / this._optdim);
        console.log("Canvas Clicked: x=" + $event.x + " - y=" + $event.y + " ox=" + $event.offsetX + " - oy=" + $event.offsetY + " - hitx=" + hitx + " - hity=" + hity);
        if (hitx < 0 || hitx >= this.cols.length || hity < 0 || hity >= this.rows.length)
            return;
        this.selectedCol = this.cols[hitx];
        this.selectedRow = this.rows[hity];
        this.setSelectedWell();
    };
    // ### Utility/Render Methods ###
    AppComponent.prototype.getWellLocationName = function (index) {
        return this.rows[Math.floor(index / 12)] + (((index % 12) + 1 < 10) ? "0" : "") + ((index % 12) + 1);
    };
    AppComponent.prototype.setSelectedWell = function () {
        this.currentWell = this._rowHash[this.selectedRow] * this.cols.length + (this.selectedCol - 1);
    };
    AppComponent.prototype.getSimpleChecksum = function (str) {
        var chk = 0;
        var len = str.length;
        for (var i = 0; i < len; i++)
            chk += str.charCodeAt(i);
        return chk;
    };
    AppComponent.prototype.ngAfterViewInit = function () {
        var canvas = this.wellCanvas.nativeElement;
        this.context = canvas.getContext("2d");
        this.tick();
    };
    AppComponent.prototype.tick = function () {
        var _this = this;
        // Prepare canvas
        requestAnimationFrame(function () { _this.tick(); });
        var canvas = this.wellCanvas.nativeElement;
        var ctx = this.context;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Calculate offsets and well sizes based on canvas size
        var rowgut = 40;
        var colgut = 40;
        var optw = Math.floor((canvas.width - rowgut) / this.cols.length);
        optw -= (optw % 2 > 0) ? 1 : 0; // We want an even-numbered width due to radius
        var opth = Math.floor((canvas.height - colgut) / this.rows.length);
        opth -= (opth % 2 > 0) ? 1 : 0; // We want an even-numbered height due to radius
        this._optdim = (opth > optw) ? optw : opth; // Use the smaller of width or height
        this._offsetx = Math.floor((canvas.width - rowgut - this.cols.length * this._optdim) / 2) + rowgut;
        this._offsety = Math.floor((canvas.height - colgut - this.rows.length * this._optdim) / 2) + colgut;
        //console.log("Frame Rendered: optdim=" + this._optdim + " offx=" + this._offsetx + " offy=" + this._offsety);
        // Render the row and column headers
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px sans-serif';
        for (var idx = 0; idx < this.cols.length; idx++) {
            var cenx = this._offsetx + (idx * this._optdim) + this._optdim / 2;
            ctx.fillText(this.cols[idx].toString(), cenx, colgut / 2);
        }
        for (var idx = 0; idx < this.rows.length; idx++) {
            var ceny = this._offsety + (idx * this._optdim) + this._optdim / 2;
            ctx.fillText(this.rows[idx], rowgut / 2, ceny);
        }
        // Do the rendering of each well
        ctx.font = '12px sans-serif';
        for (var idx = 0; idx < 96; idx++) {
            var cenx = this._offsetx + ((idx % this.cols.length) * this._optdim) + this._optdim / 2;
            var ceny = this._offsety + (Math.floor(idx / this.cols.length) * this._optdim) + this._optdim / 2;
            if (this.wells[idx].isComplete) {
                // Render the outer 'reaction time' circle first as the well will be rendered atop it to fake the arc look
                var arcBeg = 0;
                var arcEnd = 2 * Math.PI;
                if (this.wells[idx].reactionTime < 90) {
                    arcBeg = 1.5 * Math.PI;
                    arcEnd = ((this.wells[idx].reactionTime / 90) * 2 * Math.PI + arcBeg) % (2 * Math.PI);
                }
                ctx.beginPath();
                ctx.arc(cenx, ceny, this._optdim * 0.42, arcBeg, arcEnd, false);
                ctx.lineWidth = this._optdim * 0.05;
                ctx.strokeStyle = '#eebb33';
                ctx.stroke();
                // Now render the well itself 
                ctx.beginPath();
                ctx.arc(cenx, ceny, this._optdim * 0.35, 0, 2 * Math.PI, false);
                ctx.fillStyle = this._fillColors[this._nameHash[this.wells[idx].sampleName] % 3];
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = this._strokeColors[this._nameHash[this.wells[idx].sampleName] % 3];
                ctx.stroke();
            }
            else {
                ctx.beginPath();
                ctx.arc(cenx, ceny, Math.floor(this._optdim * 0.35), 0, 2 * Math.PI, false);
                ctx.fillStyle = 'lightgray';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'darkgray';
                ctx.stroke();
            }
            if (this.showWellOverlays) {
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'black';
                ctx.fillText(this.wells[idx].locationName, cenx, ceny);
            }
        }
    };
    __decorate([
        core_2.ViewChild("wellCanvas"), 
        __metadata('design:type', Object)
    ], AppComponent.prototype, "wellCanvas", void 0);
    __decorate([
        core_2.ViewChild("reactionTime"), 
        __metadata('design:type', Object)
    ], AppComponent.prototype, "reactionTime", void 0);
    __decorate([
        core_2.ViewChild("sampleName"), 
        __metadata('design:type', Object)
    ], AppComponent.prototype, "sampleName", void 0);
    AppComponent = __decorate([
        core_1.Component({
            selector: 'plate96',
            template: "\n  <div>\n    <div>\n      <form class=\"form-inline\">\n        <div>\n        <label>Well</label>\n        <select [(ngModel)]=\"selectedRow\" (ngModelChange)=\"onRowChange($event)\" name=\"rowSelect\" class=\"form-control\">\n          <option *ngFor=\"let row of rows\" [value]=\"row\">{{row}}</option>\n        </select>\n        <select [(ngModel)]=\"selectedCol\" (ngModelChange)=\"onColChange($event)\" name=\"colSelect\" class=\"form-control\">\n          <option *ngFor=\"let col of cols\" [value]=\"col\">{{col}}</option>\n        </select>\n        <label for=\"reactionTime\">Reaction Time</label>\n        <input type=\"text\" #reactionTime name=\"reactionTime\" [(ngModel)]=\"wells[currentWell].reactionTime\" class=\"form-control\" pattern=\"[0-9]{1,2}\" />\n        <label for=\"sampleName\">Sample Name</label>\n        <input type=\"text\" #sampleName name=\"sampleName\" [(ngModel)]=\"wells[currentWell].sampleName\" class=\"form-control\" maxlength=\"64\" />\n        <button (click)=\"addClick($event)\" class=\"btn btn-success\">Add</button>\n        <button (click)=\"remClick($event)\" class=\"btn btn-danger\">Remove</button>\n        </div>\n        <div>\n          <label><input type=\"checkbox\" [(ngModel)]=\"isAutoAdvanceEnabled\" name=\"autoAdvance\"> Auto Advance</label>\n          <label><input type=\"checkbox\" [(ngModel)]=\"showWellOverlays\" name=\"showWellOverlays\"> Show Well Name Overlays</label>\n        </div>\n      </form>\n    </div>\n    <div>\n      <canvas #wellCanvas width=\"800\" height=\"560\" style=\"background:white;border:2px solid darkgray;\" (click)=\"canvasClick($event)\"></canvas>\n    </div>\n  </div>\n  "
        }), 
        __metadata('design:paramtypes', [])
    ], AppComponent);
    return AppComponent;
}());
exports.AppComponent = AppComponent;
//# sourceMappingURL=app.component.js.map