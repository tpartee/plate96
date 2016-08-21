import { Component } from '@angular/core';
import { ViewChild } from "@angular/core";
import { AfterViewInit } from "@angular/core";
import { Well } from './well.class';

@Component({
  selector: 'plate96',
  template: `
  <div>
    <div>
      <form class="form-inline">
        <div>
        <label>Well</label>
        <select [(ngModel)]="selectedRow" (ngModelChange)="onRowChange($event)" name="rowSelect" class="form-control">
          <option *ngFor="let row of rows" [value]="row">{{row}}</option>
        </select>
        <select [(ngModel)]="selectedCol" (ngModelChange)="onColChange($event)" name="colSelect" class="form-control">
          <option *ngFor="let col of cols" [value]="col">{{col}}</option>
        </select>
        <label for="reactionTime">Reaction Time</label>
        <input type="text" #reactionTime name="reactionTime" [(ngModel)]="wells[currentWell].reactionTime" class="form-control" pattern="[0-9]{1,2}" />
        <label for="sampleName">Sample Name</label>
        <input type="text" #sampleName name="sampleName" [(ngModel)]="wells[currentWell].sampleName" class="form-control" maxlength="64" />
        <button (click)="addClick($event)" class="btn btn-success">Add</button>
        <button (click)="remClick($event)" class="btn btn-danger">Remove</button>
        </div>
        <div>
          <label><input type="checkbox" [(ngModel)]="isAutoAdvanceEnabled" name="autoAdvance"> Auto Advance</label>
          <label><input type="checkbox" [(ngModel)]="showWellOverlays" name="showWellOverlays"> Show Well Name Overlays</label>
        </div>
      </form>
    </div>
    <div>
      <canvas #wellCanvas width="800" height="560" style="background:white;border:2px solid darkgray;" (click)="canvasClick($event)"></canvas>
    </div>
  </div>
  `
})
export class AppComponent implements AfterViewInit {
  wells: Well[] = [];
  currentWell: number = 0;
  selectedCol: number = 1;
  selectedRow: string = 'A';
  rows: string[] = ['A','B','C','D','E','F','G','H'];
  private _rowHash: { [id: string] : number } = {};
  cols: number[] = [1,2,3,4,5,6,7,8,9,10,11,12];
  context: CanvasRenderingContext2D;
  private _optdim: number = 0;
  private _offsetx: number = 0;
  private _offsety: number = 0;
  showWellOverlays: boolean = false;
  isAutoAdvanceEnabled: boolean = false;
  private _nameCount: number = 0;
  private _nameHash: { [id: string] : number } = {};
  private _fillColors: string[] = ['#8888ff','#88ff88','#ff8888'];
  private _strokeColors: string[] = ['#6666ee','#66ee66','#ee6666'];

  @ViewChild("wellCanvas") wellCanvas;
  @ViewChild("reactionTime") reactionTime;
  @ViewChild("sampleName") sampleName;

  /* ### (ctor) Initialize AppComponent ### */

  constructor() {
    // Initialize all 96 wells to new unused objects
    for (var idx=0; idx < 96; idx++) {
      this.wells[idx] = new Well();
      this.wells[idx].locationName = this.getWellLocationName(idx);
    }
    // Map the rows strings into a reverse-lookup hash to speed things up
    for (var idx=0; idx < this.rows.length; idx++) {
      this._rowHash[this.rows[idx]] = idx;
    }
  }

  // ### User Event Handling ###

  onRowChange($event) {
    console.log("Row Changed: " + $event);
    this.selectedRow = $event;
    this.setSelectedWell();
    $event.stopPropagation;
  }

  onColChange($event) {
    console.log("Col Changed: " + $event);
    this.selectedCol = $event;
    this.setSelectedWell();
    $event.stopPropagation;
  }

  addClick($event: MouseEvent) {
    console.log("Add Clicked: " + $event);
    $event.stopPropagation;
    this.wells[this.currentWell].isComplete = true;
    if (!(this.wells[this.currentWell].sampleName in this._nameHash)) {
      this._nameHash[this.wells[this.currentWell].sampleName] = this._nameCount;
      this._nameCount++;
    }
    if (this.isAutoAdvanceEnabled) { // Advance to next well and give the reaction time input keyboard focus
      var desWell = (this.currentWell >= 95) ? 0 : this.currentWell + 1;
      this.selectedCol = this.cols[desWell % this.cols.length];
      this.selectedRow = this.rows[Math.floor(desWell / this.cols.length)];
      this.setSelectedWell();
      this.reactionTime.nativeElement.focus();
    }
  }

  remClick($event: MouseEvent) {
    console.log("Remove Clicked: " + $event);
    $event.stopPropagation;
    this.wells[this.currentWell] = new Well();
    this.wells[this.currentWell].locationName = this.getWellLocationName(this.currentWell);
  }

  canvasClick($event: MouseEvent) {
    $event.stopPropagation;
    // Based on the size of the canvas, determine which well (if any) the user clicked on and change selection to it
    var hitx = Math.floor(($event.offsetX - this._offsetx) / this._optdim);
    var hity = Math.floor(($event.offsetY - this._offsety) / this._optdim);
    console.log("Canvas Clicked: x=" + $event.x + " - y=" + $event.y + " ox=" + $event.offsetX + " - oy=" + $event.offsetY +  " - hitx=" + hitx + " - hity=" + hity);
    if (hitx < 0 || hitx >= this.cols.length || hity < 0 || hity >= this.rows.length) return;
    this.selectedCol = this.cols[hitx];
    this.selectedRow = this.rows[hity];
    this.setSelectedWell();
  }

  // ### Utility/Render Methods ###

  getWellLocationName(index: number) {
    return this.rows[Math.floor(index / 12)] + (((index % 12) + 1 < 10) ? "0" : "") + ((index % 12) + 1);
  }

  setSelectedWell() {
    this.currentWell = this._rowHash[this.selectedRow] * this.cols.length + (this.selectedCol - 1);
  }

  getSimpleChecksum(str: string): number {
    var chk: number = 0;
    var len = str.length;
    for (var i = 0; i < len; i++) chk += str.charCodeAt(i);
    return chk;
  }

  ngAfterViewInit() {
    let canvas = this.wellCanvas.nativeElement;
    this.context = canvas.getContext("2d");
    this.tick();
  }

  private tick() {
    // Prepare canvas
    requestAnimationFrame( () => { this.tick() } );
    let canvas = this.wellCanvas.nativeElement;
    var ctx = this.context;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Calculate offsets and well sizes based on canvas size
    var rowgut = 40;
    var colgut = 40;
    var optw = Math.floor((canvas.width - rowgut)  / this.cols.length);
    optw -= (optw % 2 > 0) ? 1 : 0; // We want an even-numbered width due to radius
    var opth = Math.floor((canvas.height - colgut) / this.rows.length);
    opth -= (opth % 2 > 0) ? 1 : 0; // We want an even-numbered height due to radius
    this._optdim = (opth > optw) ? optw : opth; // Use the smaller of width or height
    this._offsetx = Math.floor((canvas.width  - rowgut - this.cols.length * this._optdim) / 2) + rowgut;
    this._offsety = Math.floor((canvas.height - colgut - this.rows.length * this._optdim) / 2) + colgut;
    //console.log("Frame Rendered: optdim=" + this._optdim + " offx=" + this._offsetx + " offy=" + this._offsety);
    // Render the row and column headers
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = 'black';
    ctx.font         = 'bold 24px sans-serif';
    for (var idx=0; idx < this.cols.length; idx++) {
      var cenx = this._offsetx + (idx * this._optdim) + this._optdim / 2;
      ctx.fillText(this.cols[idx].toString(), cenx, colgut / 2);
    }
    for (var idx=0; idx < this.rows.length; idx++) {
      var ceny = this._offsety + (idx * this._optdim) + this._optdim / 2;
      ctx.fillText(this.rows[idx], rowgut / 2, ceny);
    }
    // Do the rendering of each well
    ctx.font = '12px sans-serif';
    for (var idx=0; idx < 96; idx++) {
      var cenx = this._offsetx + ((idx % this.cols.length) * this._optdim) + this._optdim / 2;
      var ceny = this._offsety + (Math.floor(idx / this.cols.length) * this._optdim) + this._optdim / 2;
      if (this.wells[idx].isComplete) { // For completed wells to render arcs and colors
        // Render the outer 'reaction time' circle first as the well will be rendered atop it to fake the arc look
        var arcBeg = 0;
        var arcEnd = 2 * Math.PI;
        if (this.wells[idx].reactionTime < 90) {
          arcBeg = 1.5 * Math.PI;
          arcEnd = ((this.wells[idx].reactionTime/90) * 2 * Math.PI + arcBeg) % (2 * Math.PI);
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
      } else { // For incomplete wells, just render a plain grey circle
        ctx.beginPath();
        ctx.arc(cenx, ceny, Math.floor(this._optdim * 0.35), 0, 2 * Math.PI, false);
        ctx.fillStyle = 'lightgray';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'darkgray';
        ctx.stroke();
      }
      if (this.showWellOverlays) {
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = 'black';
        ctx.fillText(this.wells[idx].locationName, cenx, ceny);
      }
    }
  }

}
