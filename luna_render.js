

function lunaRender( width, height, context )
{
  this.context = context;
  this.gridMode = 2;		// 0=none, 1=dots, 2=lines  
  this.pixel_per_unit = 1.0;  
  this.width = width;
  this.height = height;

  this.view = new Object(); 
  this.view.cx = this.width / 2;
  this.view.cy = this.height / 2;
  this.view.x1 = 0;
  this.view.y1 = 0;
  this.view.x2 = this.width;
  this.view.y2 = this.height;
  
  this.debugPrint();
  
  this.zoom_max = 40.0;
  this.zoom_min = 0.001;  
  this.zoom = 1;   		// initial zoom
  this.zoom_factor = 1.0;

  this.setView ( this.view.cx, this.view.cy, this.zoom );  	// set view for first time
	
  this.dirty_flag = true;

  this.default_line_width = 5;
  this.default_stroke_color = "rgb( 0, 160, 0 )";
  this.default_fill_color = "rgb( 0, 160, 0 )";
}

lunaRender.prototype.setGrid = function ( val )
{
	this.gridMode = val;
	this.dirty_flag = true;
}

lunaRender.prototype.getWidth = function ()
{   
   return this.width;
}
lunaRender.prototype.getHeight = function ()
{   
   return this.height;
}

lunaRender.prototype.setView = function( x, y, z )
{
	// set center and zoom
	this.view.cx = x;
	this.view.cy = y;
	this.zoom = z;

  console.log ( "w: " + this.width + " h: " +this.height );
	
	// compute the view region
  var dx = this.width / (2.0*z);
  var dy = this.height / (2.0*z);
  this.view.x1 = this.view.cx - dx;
  this.view.y1 = this.view.cy - dy;
  this.view.x2 = this.view.cx + dx;
  this.view.y2 = this.view.cy + dy;
  
  this.debugPrint();

	//console.log ( "zoom: " + this.zoom );
	//console.log ( "view: " + this.view.x1 + " " + this.view.y1 + " " + this.view.x2 + " " + this.view.y2 );

  // update the transform
  this.transform = [ 
            [ z, 0, -this.view.x1*z ],
            [ 0, z, -this.view.y1*z ],
            [ 0, 0, 1 ] ];
}

lunaRender.prototype.debugPrint = function()
{
  console.log("lunaRender.debugPrint: view [" + this.view.x1 + " " + this.view.y1 + ", " + this.view.x2 + " " + this.view.y2 + "] ");
  console.log("lunaRender.debugPrint: zoom " + this.zoom );
}

lunaRender.prototype.devToWorld = function(x, y)
{

  //var wx = this.view.x1 + (x / this.zoom);
  //var wy = this.view.y1 + (y / this.zoom);

  var wx = this.view.x1 + x * ( this.view.x2 - this.view.x1) / this.width;
  var wy = this.view.y1 + y * ( this.view.y2 - this.view.y1) / this.height;

  //this.debugPrint();
  //console.log("devToWorld: (" + x + " " + y + ") -> (" + wx + " " + wy + ")");

  return { "x" : wx, "y" : wy};
}

lunaRender.prototype.adjustZoom = function(x, y, z)
{
   zf = ( (z<0) ? -(1.0/z)*this.zoom_factor : z/(this.zoom_factor) );
   //var newzoom = this.zoom + z*0.01;
   var newzoom = this.zoom * zf;
   if ( newzoom < this.zoom_min ) newzoom = this.zoom_min;
   if ( newzoom > this.zoom_max ) newzoom = this.zoom_max;

   //console.log("newzoom: " + newzoom);

   // size of new view
   var nx = this.width / (newzoom*2.0);
   var ny = this.height / (newzoom*2.0);

   // center of new view that puts cursor at same relative position
   var rx = x / this.width;
   var ry = y / this.height;
   var w = this.devToWorld ( x, y );
   w.x = w.x - nx*2.0*rx + nx;
   w.y = w.y - ny*2.0*ry + ny;

   this.setView ( w.x, w.y, newzoom );
  
   this.dirty_flag = true;
}

lunaRender.prototype.adjustPan = function(x, y)
{
   var z = this.zoom;
   this.setView ( this.view.cx - x/z, this.view.cy - y/z, z );
   
   this.dirty_flag = true;
}

lunaRender.prototype.drawGrid = function()
{
	if ( this.gridMode == 0 ) return;

	var ctx = this.context;
	var view = this.view;
	var M = this.transform;
	var start, stop, t;		
	var lt = Math.pow ( 10, Math.floor( Math.log( view.x2-view.x1 ) / Math.log(10) ) );
	var gridstep = lt / 10.0 ;
	
	x_start = gridstep * (Math.floor( view.x1 /gridstep));		// round = int()
	x_stop = gridstep * (Math.floor( view.x2 / gridstep)+1);	// round = int()
	if ( x_start > x_stop ) { t = x_start; x_start = x_stop; x_stop = t; } 

	y_start = gridstep * (Math.floor( view.y1 / gridstep));
	y_stop = gridstep * (Math.floor( view.y2 / gridstep)+1);
	if ( y_start > y_stop ) { t = start; y_start = y_stop; y_stop = t; } 
	
	if ( this.gridMode == 1 ) {
		// Dots		
		ctx.lineWidth = 1.0;
		rect_l = 15.0 / (10.0 * this.zoom) ;
		rect_c = rect_l / 2.0;
		ctx.fillStyle = "#808080";
		ctx.beginPath ();
		for (var x = x_start; x < x_stop; x += gridstep ) {
		  for (var y = y_start; y < y_stop; y+= gridstep) {
			ctx.fillRect( x - rect_c, y - rect_c , rect_l, rect_l);
		  }
		} 
		ctx.stroke ();
	}
	if ( this.gridMode == 2 ) {
		// Lines
    ctx.lineWidth = 0.5;
		ctx.beginPath();
		for (var x=x_start; x < x_stop; x += gridstep ) {
		  ctx.moveTo ( x, view.y1 );
		  ctx.lineTo ( x, view.y2 );
		}		
		for (var y=y_start; y < y_stop; y += gridstep ) {
		  ctx.moveTo ( view.x1, y );
		  ctx.lineTo ( view.x2, y );
		}
        ctx.lineJoin = "round";
		ctx.stroke();
	}
}

lunaRender.prototype.startDraw = function()
{
  // clear view
  this.context.setTransform ( 1, 0, 0, 1, 0, 0 );

  this.context.clearRect( 0, 0, this.width, this.height );

  // save context
  //this.context.save ();

  // setup world space (just once)
  M = this.transform;  
  this.context.setTransform( M[0][0], M[1][0], M[0][1], M[1][1], M[0][2], M[1][2] );
}

lunaRender.prototype.startDrawColor = function( color )
{

  color = ( typeof color !== 'undefined' ? color : "rgb(0,0,0)" );

  this.context.setTransform ( 1, 0, 0, 1, 0, 0 );

  // clear view
  this.context.fillStyle =  color;
  this.context.fillRect( 0, 0, this.width, this.height );

  M = this.transform;  
  this.context.setTransform( M[0][0], M[1][0], M[0][1], M[1][1], M[0][2], M[1][2] );
}



lunaRender.prototype.endDraw = function()
{
  // restore context
  //this.context.restore ();
}


// start_angle_rad is clockwise (as is end_angle).  ccw_flag tells it which way to go from sa to ea.
//
lunaRender.prototype.drawArc= function( x, y, r, start_angle_rad, end_angle_rad, ccw_flag, line_width, line_color, fill_flag, fill_color )
{
  var ctx = this.context;

  var line_width = ( typeof line_width !== 'undefined' ? line_width : this.default_line_width );
  var line_color = ( typeof line_color !== 'undefined' ? line_color : this.default_line_color );

  var fill_flag  = ( typeof fill_flag  !== 'undefined' ? fill_flag : false );
  var fill_color = ( typeof fill_color !== 'undefined' ? fill_color : this.default_fill_color );

  //console.log("drawArc: " + x + " " + y + " " + r + " " + start_angle_rad + " " + end_angle_rad + " " + ccw_flag );
  //console.log("  " + line_width + " " + line_color + " " + fill_flag + " " + fill_color );

  ctx.beginPath();
  ctx.arc( x, y, r, start_angle_rad , end_angle_rad ,  ccw_flag );

  if (fill_flag) { 
    ctx.fillStyle = fill_color; 
    ctx.fill();
  }

  if (line_width > 0)
  {
    ctx.lineWidth = line_width;
    ctx.strokeStyle = line_color;
    ctx.stroke();
  }

  ctx.closePath();
}


//------------------------------------------
//
// rectangle (and circle with holes) primitives
//
//  all rectangles are centered


lunaRender.prototype._rect_path = function( x, y, w, h )
{
  var ctx = this.context;
  var w2 = w/2;
  var h2 = h/2;

  ctx.moveTo( x + w2, y - h2 );
  ctx.lineTo( x - w2, y - h2 );
  ctx.lineTo( x - w2, y + h2 );
  ctx.lineTo( x + w2, y + h2 );
  ctx.lineTo( x + w2, y - h2 );

}

lunaRender.prototype._rect_hole_path = function( x, y, w, h )
{
  var ctx = this.context;
  var w2 = w/2;
  var h2 = h/2;

  ctx.moveTo( x + w2, y - h2 );
  ctx.lineTo( x + w2, y + h2 );
  ctx.lineTo( x - w2, y + h2 );
  ctx.lineTo( x - w2, y - h2 );
  ctx.lineTo( x + w2, y - h2 );

}


lunaRender.prototype.fillRect = function( x, y, w, h, fill_color )
{
  var ctx = this.context;

  ctx.fillStyle = fill_color; 

  ctx.beginPath();
  ctx.rect( x - w/2, y - h/2, w, h );
  ctx.fill();
  ctx.closePath();

}

lunaRender.prototype.strokeRect = function( x, y, w, h, line_width, line_color )
{
  var ctx = this.context;

  ctx.lineWidth = line_width;
  ctx.strokeStyle = line_color;

  ctx.beginPath();
  ctx.rect( x - w/2, y - h/2, w, h);
  ctx.stroke();
  ctx.closePath();
}

lunaRender.prototype.fillRectHoleCircle = function( x, y, w, h, ix, iy, ir, fill_color )
{
  var ctx = this.context;

  ctx.fillStyle = fill_color; 

  ctx.beginPath();

  this._rect_path( x, y, w, h );
  ctx.arc( ix, iy, ir, 0, 2 * Math.PI, false );

  ctx.closePath();
  ctx.fill();
}

lunaRender.prototype.fillRectHoleOblong = function( x, y, w, h, ix, iy, ibx, iby, fill_color )
{
  var ctx = this.context;

  ctx.fillStyle = fill_color; 

  ctx.beginPath();
  this._rect_path( x, y, w, h );
  this._oblong_hole_path(ix, iy, ibx, iby);
  ctx.closePath();

  ctx.fill();
}

lunaRender.prototype.strokeRectHoleCircle = function( x, y, w, h, ix, iy, ir, line_width, line_color )
{
  var ctx = this.context;

  ctx.lineWidth = line_width;
  ctx.strokeStyle = line_color; 

  ctx.beginPath();
  ctx.rect(x - w/2, y - h/2, w, h);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc( ix, iy, ir, 0, 2 * Math.PI, false );
  ctx.closePath();
  ctx.stroke();

}

lunaRender.prototype.strokeRectHoleOblong = function( x, y, w, h, ix, iy, ibx, iby, line_width, line_color )
{
  var ctx = this.context;

  ctx.lineWidth = line_width;
  ctx.strokeStyle = line_color; 

  ctx.beginPath();
  ctx.rect(x - w/2, y - h/2, w, h);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  this._oblong_hole_path(ix, iy, ibx, iby);
  ctx.closePath();
  ctx.stroke();

}

lunaRender.prototype.rectHoleCircle = function( x, y, w, h, ir, line_width, line_color, fill_color )
{
  if (fill_color)
    this.fillRectHoleCircle( x, y, w, h, x, y, ir, fill_color );

  if (line_width > 0)
    this.strokeRectHoleCircle( x, y, w, h, x, y, ir, line_width, line_color );
}

lunaRender.prototype.rectHoleOblong = function( x, y, obx, oby, ibx, iby, line_width, line_color, fill_color )
{
  if (fill_color)
    this.fillRectHoleOblong( x, y, obx, oby, x, y, ibx, iby, fill_color );

  if (line_width > 0)
    this.strokeRectHoleOblong( x, y, obx, oby, x, y, ibx, iby, line_width, line_color );
}


// - *************************************
// - *************************************
// - *************************************


//------------------------------------------
//
// oblong (and circle with holes) primitives
//
//

lunaRender.prototype._oblong_hole_path = function( x, y, obx, oby )
{
  var ctx = this.context;

  var obr = ( (obx > oby) ? (oby/2) : (obx/2) );
  var obs = ( (obx > oby) ? (obx - oby) : (oby - obx) );
  var obs2 = obs/2;

  if (obx > oby)
  {
    ctx.arc   ( x + obs2, y, obr, 0, Math.PI/2, false );
    ctx.lineTo( x - obs2, y + obr );
    ctx.arc   ( x - obs2, y, obr, Math.PI/2, 3 * Math.PI/2, false );
    ctx.lineTo( x + obs2, y - obr );
    ctx.arc( x + obs2, y, obr, 3 * Math.PI/2, 0, false );
  }
  else
  {
    ctx.moveTo( x + obr, y)
    ctx.lineTo( x + obr, y + obs2 );
    ctx.arc( x, y + obs2, obr, 0, Math.PI, false );
    ctx.lineTo( x - obr, y - obs2 );
    ctx.arc( x, y - obs2, obr, Math.PI, 0, false );
    ctx.lineTo( x + obr, y);
  }

}

lunaRender.prototype._oblong_contour_path = function( x, y, obx, oby )
{
  var ctx = this.context;

  var obr = ( (obx > oby) ? (oby/2) : (obx/2) );
  var obs = ( (obx > oby) ? (obx - oby) : (oby - obx) );
  var obs2 = obs/2;

  if (obx > oby)
  {
    ctx.arc   ( x + obs2, y, obr, 0, -Math.PI/2, true );
    ctx.lineTo( x - obs2, y - obr );
    ctx.arc   ( x - obs2, y, obr, -Math.PI/2, Math.PI/2, true );
    ctx.lineTo( x + obs2, y + obr );
    ctx.arc( x + obs2, y, obr, Math.PI/2, 0, true );
  }
  else
  {
    ctx.moveTo( x + obr, y)
    ctx.lineTo( x + obr, y - obs2 );
    ctx.arc( x, y - obs2, obr, 0, Math.PI, true );
    ctx.lineTo( x - obr, y + obs2 );
    ctx.arc( x, y + obs2, obr, Math.PI, 0, true );
    ctx.lineTo( x + obr, y);
  }


}




lunaRender.prototype.fillOblong = function( x, y, obx, oby, fill_color )
{
  var ctx = this.context;

  ctx.fillStyle = fill_color; 

  ctx.beginPath();
  this._oblong_contour_path( x, y, obx, oby );
  ctx.fill();
  ctx.closePath();

}

lunaRender.prototype.strokeOblong = function( x, y, obx, oby, line_width, line_color )
{
  var ctx = this.context;

  ctx.lineWidth = line_width;
  ctx.strokeStyle = line_color;

  ctx.beginPath();
  this._oblong_contour_path( x, y, obx, oby );
  ctx.stroke();
  ctx.closePath();
}

lunaRender.prototype.fillOblongHoleCircle = function( x, y, obx, oby, ix, iy, ir, fill_color )
{
  var ctx = this.context;

  ctx.fillStyle = fill_color; 

  ctx.beginPath();

  this._oblong_contour_path(x, y, obx, oby);
  ctx.arc( ix, iy, ir, 0, 2 * Math.PI, false );

  ctx.closePath();
  ctx.fill();
}

lunaRender.prototype.fillOblongHoleOblong = function( x, y, obx, oby, ix, iy, iobx, ioby, fill_color )
{
  var ctx = this.context;

  var obr = ( (obx > oby) ? (oby/2) : (obx/2) );
  var obs = ( (obx > oby) ? (obx - oby) : (oby - obx) );
  var obs2 = obs/2;

  ctx.fillStyle = fill_color; 

  ctx.beginPath();
  this._oblong_contour_path(x, y, obx, oby);
  this._oblong_hole_path(ix, iy, iobx, ioby);
  ctx.closePath();

  ctx.fill();
}

lunaRender.prototype.strokeOblongHoleCircle = function( x, y, obx, oby, ix, iy, ir, line_width, line_color )
{
  var ctx = this.context;

  ctx.lineWidth = line_width;
  ctx.strokeStyle = line_color; 

  ctx.beginPath();
  this._oblong_contour_path(x, y, obx, oby);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc( ix, iy, ir, 0, 2 * Math.PI, false );
  ctx.closePath();
  ctx.stroke();

}

lunaRender.prototype.strokeOblongHoleOblong = function( x, y, obx, oby, ix, iy, ibx, iby, line_width, line_color )
{
  var ctx = this.context;

  var obr = ( (obx > oby) ? (oby/2) : (obx/2) );
  var obs = ( (obx > oby) ? (obx - oby) : (oby - obx) );
  var obs2 = obs/2;

  ctx.lineWidth = line_width;
  ctx.strokeStyle = line_color; 

  ctx.beginPath();
  this._oblong_contour_path(x, y, obx, oby);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  this._oblong_hole_path(ix, iy, ibx, iby);
  ctx.closePath();
  ctx.stroke();

}

lunaRender.prototype.oblongHoleCircle = function( x, y, obx, oby, ir, line_width, line_color, fill_color )
{
  if (fill_color)
    this.fillOblongHoleCircle( x, y, obx, oby, x, y, ir, fill_color );

  if (line_width > 0)
    this.strokeOblongHoleCircle( x, y, obx, oby, x, y, ir, line_width, line_color );
}

lunaRender.prototype.oblongHoleOblong = function( x, y, obx, oby, ibx, iby, line_width, line_color, fill_color )
{
  if (fill_color)
    this.fillOblongHoleOblong( x, y, obx, oby, x, y, ibx, iby, fill_color );

  if (line_width > 0)
    this.strokeOblongHoleOblong( x, y, obx, oby, x, y, ibx, iby, line_width, line_color );
}


// - *************************************
// - *************************************
// - *************************************


lunaRender.prototype.circle = function( x, y, r, line_width, line_color, fill_flag, fill_color )
{
  var ctx = this.context;

  var line_width = ( typeof line_width !== 'undefined' ? line_width : this.default_line_width );
  var line_color = ( typeof line_color !== 'undefined' ? line_color : this.default_line_color );

  var fill_flag  = ( typeof fill_flag  !== 'undefined' ? fill_flag : false );
  var fill_color = ( typeof fill_color !== 'undefined' ? fill_color : this.default_fill_color );

  ctx.beginPath();
  ctx.arc( x, y, r, 0, 2 * Math.PI, false );

  if (fill_flag) { 
    ctx.fillStyle = fill_color; 
    ctx.fill();
  }

  if (line_width > 0)
  {
    ctx.lineWidth = line_width;
    ctx.strokeStyle = line_color;
    ctx.stroke();
  }

  ctx.closePath();
}

//------------------------------------------
//
// circle (and circle with holes) primitives
//
//

lunaRender.prototype.fillCircle = function( x, y, r, fill_color )
{
  var ctx = this.context;

  ctx.fillStyle = fill_color; 

  ctx.beginPath();
  ctx.arc( x, y, r, 0, 2 * Math.PI, false );
  ctx.fill();
  ctx.closePath();
}

lunaRender.prototype.strokeCircle = function( x, y, r, line_width, line_color )
{
  var ctx = this.context;

  ctx.lineWidth = line_width;
  ctx.strokeStyle = line_color;

  ctx.beginPath();
  ctx.arc( x, y, r, 0, 2 * Math.PI, false );
  ctx.stroke();
  ctx.closePath();
}

lunaRender.prototype.fillCircleHoleCircle = function( x, y, r, ix, iy, ir, fill_color )
{
  var ctx = this.context;

  ctx.fillStyle = fill_color; 

  ctx.beginPath();
  ctx.arc( x, y, r, 0, 2 * Math.PI, true );

  ctx.arc( ix, iy, ir, 0, 2 * Math.PI, false );
  ctx.closePath();

  ctx.fill();
}

lunaRender.prototype.fillCircleHoleOblong = function( x, y, r, obx, oby, fill_color )
{
  var ctx = this.context;

  var obr = ( (obx > oby) ? (oby/2) : (obx/2) );
  var obs = ( (obx > oby) ? (obx - oby) : (oby - obx) );
  var obs2 = obs/2;

  ctx.fillStyle = fill_color; 

  ctx.beginPath();
  ctx.arc( x, y, r, 0, 2 * Math.PI, true );

  if (obx > oby)
  {
    ctx.arc   ( x + obs2, y, obr, 0, Math.PI/2, false );
    ctx.lineTo( x - obs2, y + obr );
    ctx.arc   ( x - obs2, y, obr, Math.PI/2, 3 * Math.PI/2, false );
    ctx.lineTo( x + obs2, y - obr );
    ctx.arc( x + obs2, y, obr, 3 * Math.PI/2, 0, false );
  }
  else
  {
    ctx.moveTo( x + obr, y)
    ctx.lineTo( x + obr, y + obs2 );
    ctx.arc( x, y + obs2, obr, 0, Math.PI, false );
    ctx.lineTo( x - obr, y - obs2 );
    ctx.arc( x, y - obs2, obr, Math.PI, 0, false );
    ctx.lineTo( x + obr, y);
  }

  ctx.closePath();

  ctx.fill();
}

lunaRender.prototype.strokeCircleHoleCircle = function( x, y, r, ix, iy, ir, line_width, line_color )
{
  var ctx = this.context;

  ctx.lineWidth = line_width;
  ctx.strokeStyle = line_color; 

  ctx.beginPath();
  ctx.arc( x, y, r, 0, 2 * Math.PI, true );
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc( ix, iy, ir, 0, 2 * Math.PI, false );
  ctx.closePath();
  ctx.stroke();

}

lunaRender.prototype.strokeCircleHoleOblong = function( x, y, r, obx, oby, line_width, line_color )
{
  var ctx = this.context;

  var obr = ( (obx > oby) ? (oby/2) : (obx/2) );
  var obs = ( (obx > oby) ? (obx - oby) : (oby - obx) );
  var obs2 = obs/2;

  ctx.lineWidth = line_width;
  ctx.strokeStyle = line_color; 

  ctx.beginPath();
  ctx.arc( x, y, r, 0, 2 * Math.PI, true );
  ctx.closePath();
  ctx.stroke();


  ctx.beginPath();


  if (obx > oby)
  {
    ctx.arc   ( x + obs2, y, obr, 0, Math.PI/2, false );
    ctx.lineTo( x - obs2, y + obr );
    ctx.arc   ( x - obs2, y, obr, Math.PI/2, 3 * Math.PI/2, false );
    ctx.lineTo( x + obs2, y - obr );
    ctx.arc( x + obs2, y, obr, 3 * Math.PI/2, 0, false );
  }
  else
  {
    ctx.moveTo( x + obr, y)
    ctx.lineTo( x + obr, y + obs2 );
    ctx.arc( x, y + obs2, obr, 0, Math.PI, false );
    ctx.lineTo( x - obr, y - obs2 );
    ctx.arc( x, y - obs2, obr, Math.PI, 0, false );
    ctx.lineTo( x + obr, y);
  }

  ctx.closePath();
  ctx.stroke();

}

lunaRender.prototype.circleHoleCircle = function( x, y, r, ir, line_width, line_color, fill_color )
{
  if (fill_color)
    this.fillCircleHoleCircle( x, y, r, x, y, ir, fill_color );

  if (line_width > 0)
    this.strokeCircleHoleCircle( x, y, r, x, y, ir, line_width, line_color );
}

lunaRender.prototype.circleHoleOblong = function( x, y, r, obx, oby, line_width, line_color, fill_color )
{
  if (fill_color)
    this.fillCircleHoleOblong( x, y, r, obx, oby, fill_color );

  if (line_width > 0)
    this.strokeCircleHoleOblong( x, y, r, obx, oby, line_width, line_color );
}


lunaRender.prototype.circle = function( x, y, r, line_width, line_color, fill_flag, fill_color )
{
  var ctx = this.context;

  var line_width = ( typeof line_width !== 'undefined' ? line_width : this.default_line_width );
  var line_color = ( typeof line_color !== 'undefined' ? line_color : this.default_line_color );

  var fill_flag  = ( typeof fill_flag  !== 'undefined' ? fill_flag : false );
  var fill_color = ( typeof fill_color !== 'undefined' ? fill_color : this.default_fill_color );

  ctx.beginPath();
  ctx.arc( x, y, r, 0, 2 * Math.PI, false );

  if (fill_flag) { 
    ctx.fillStyle = fill_color; 
    ctx.fill();
  }

  if (line_width > 0)
  {
    ctx.lineWidth = line_width;
    ctx.strokeStyle = line_color;
    ctx.stroke();
  }

  ctx.closePath();
}

lunaRender.prototype.line = function(x0, y0, x1, y1, color, line_width )
{
  var ctx = this.context;
  color      = ( typeof color      !== 'undefined' ? color      : this.default_stroke_color );
  line_width = ( typeof line_width !== 'undefined' ? line_width : this.default_line_width  );

  //ctx.lineWidth = ( (line_width > 0) ? line_width : this.default_line_width );
  //ctx.strokeStyle = ( (color) ? color : this.default_stroke_color );
  ctx.lineWidth = line_width;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineJoin = "round";
  ctx.stroke();
}

lunaRender.prototype.drawGradientLine = function(x0, y0, x1, y1, line_width, end_color, mid_color, pos )
{
  var ctx = this.context;
  color      = ( typeof color      !== 'undefined' ? color      : this.default_stroke_color );
  line_width = ( typeof line_width !== 'undefined' ? line_width : this.default_line_width  );

  //ctx.lineWidth = ( (line_width > 0) ? line_width : this.default_line_width );
  //ctx.strokeStyle = ( (color) ? color : this.default_stroke_color );
  ctx.lineWidth = line_width;

  var grad = ctx.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, end_color);
  grad.addColorStop(1, end_color);
  grad.addColorStop(pos, mid_color);
  grad.addColorStop(1-pos, mid_color);
  grad.addColorStop(0.5, end_color);

  ctx.strokeStyle = grad;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineJoin = "round";
  ctx.stroke();
}

lunaRender.prototype.drawPath= function( path,  x, y, color, line_width, closePathFlag )
{
  var ctx = this.context;
  color      = ( typeof color      !== 'undefined' ? color      : this.default_stroke_color );
  line_width = ( typeof line_width !== 'undefined' ? line_width : this.default_line_width  );
  closePathFlag = ( typeof closePathFlag !== 'undefined' ? closePathFlag : true);

  //ctx.lineWidth = ( (line_width > 0) ? line_width : this.default_line_width );
  //ctx.strokeStyle = ( (color) ? color : this.default_stroke_color );
  ctx.lineWidth = line_width;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";

  ctx.beginPath();

  var ind = 0;
  for (ind=0; ind < path.length; ind++) 
  //for (ind in path)
  {
    if (ind == 0) { ctx.moveTo(x + path[ind][0], y + path[ind][1]); }
    else          { ctx.lineTo(x + path[ind][0], y + path[ind][1]); }
  }

  if (closePathFlag && (path.length > 2))
    ctx.lineTo(x + path[0][0], y + path[0][1]);

  ctx.lineJoin = "round";
  ctx.stroke();

}

lunaRender.prototype.drawBarePolygon = function( path,  x, y, color )
{
  var ctx = this.context;
  color         = ( typeof color !== 'undefined' ? color : this.default_stroke_color );

  ctx.lineWdith = 0;
  ctx.fillStyle = color; 
  ctx.beginPath();

  var ind = 0;
  for (ind in path)
  {
    if (ind == 0) { ctx.moveTo(x + path[ind][0], y + path[ind][1]); }
    else          { ctx.lineTo(x + path[ind][0], y + path[ind][1]); }
  }

  ctx.lineTo( x + path[0][0], y + path[0][1] );
  ctx.fill(); 
}

lunaRender.prototype.drawBarePolygons = function( paths,  x, y, color )
{
  var ctx = this.context;
  color         = ( typeof color !== 'undefined' ? color : this.default_stroke_color );

  ctx.lineWdith = 0;
  ctx.fillStyle = color; 
  ctx.beginPath();

  for (var k in paths)
  {
    var path = paths[k];

    var ind = 0;
    for (ind in path)
    {
      if (ind == 0) { ctx.moveTo(x + path[ind][0], y + path[ind][1]); }
      else          { ctx.lineTo(x + path[ind][0], y + path[ind][1]); }
    }

    ctx.lineTo( x + path[0][0], y + path[0][1] );
  }

  ctx.fill(); 
}

lunaRender.prototype.drawPolygon = function( path,  x, y, color, fill, line_width, closePathFlag )
{
  var ctx = this.context;
  color         = ( typeof color !== 'undefined' ? color : this.default_stroke_color );
  fill          = ( typeof fill !== 'undefined' ? fill : true );
  line_width    = ( typeof line_width !== 'undefined' ? line_width : this.default_line_width  );
  //closePathFlag = ( typeof closePathFlag !== 'undefined' ? closePathFlag : true);
  closePathFlag = ( typeof closePathFlag !== 'undefined' ? closePathFlag : fill );
  

  //ctx.lineWidth = ( (line_width > 0) ? line_width : this.default_line_width );
  //ctx.strokeStyle = ( (color) ? color : this.default_stroke_color );

  if (fill) 
  { 
    ctx.fillStyle = color; 
    ctx.lineWidth = 0;
  }
  else
  { 
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineWidth = line_width;
  }

  ctx.beginPath();

  var ind = 0;
  for (ind in path)
  {
    if (ind == 0) { ctx.moveTo(x + path[ind][0], y + path[ind][1]); }
    else          { ctx.lineTo(x + path[ind][0], y + path[ind][1]); }
  }


  if (fill) 
  {
    ctx.lineTo( x + path[0][0], y + path[0][1] );
    ctx.fill(); 
    ctx.lineJoin = "round";
    ctx.stroke(); 
  }
  else
  { 
    ctx.lineJoin = "round";
    ctx.stroke(); 
  }

}

lunaRender.prototype.translate = function( x,y ) {
  var ctx = this.context;
  ctx.translate( x, y );
}

lunaRender.prototype.rotate = function( angle_radian ) {
  var ctx = this.context;
  ctx.rotate( angle_radian );
}

lunaRender.prototype.drawFill = function( x, y, w, h, fill_color )
{
  var ctx = this.context;
  ctx.fillStyle = fill_color;
  ctx.fillRect ( x, y, w, h);  
}

lunaRender.prototype.drawRect = function( x, y, w, h, border_color )
{
  var ctx = this.context;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect( x, y, w, h );
  ctx.strokeStyle = border_color;
  ctx.stroke();
}

lunaRender.prototype.drawFillRect = function( x, y, w, h, fill_color, line_width, border_color )
{
  var ctx = this.context;
  ctx.beginPath();
  ctx.rect( x, y, w, h );
  ctx.fillStyle = fill_color;

  ctx.lineWidth = line_width;
  ctx.strokeStyle = border_color;

  ctx.fill();
  ctx.stroke();
}

lunaRender.prototype.drawTri = function( x1, y1, x2, y2, x3, y3, fill_color )
{
  var ctx = this.context;  
  ctx.fillStyle = fill_color;
  ctx.beginPath ();
  ctx.moveTo ( x1, y1 );
  ctx.lineTo ( x2, y2 );
  ctx.lineTo ( x3, y3 );
  ctx.closePath ();
  ctx.fill ();
}


lunaRender.prototype.drawImage = function( img, x, y,
                                           w, h,
                                           clip_x, clip_y, clip_w, clip_h) {
  var ctx = this.context;
  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof y !== 'undefined' ? y : 0 );

  var draw_type = 0;

  if ( (typeof w !== 'undefined') && (typeof h !== 'undefined') ) {
    draw_type = 1;

    if ( (typeof clip_x !== 'undefined') &&
         (typeof clip_y !== 'undefined') &&
         (typeof clip_w !== 'undefined') &&
         (typeof clip_h !== 'undefined')
       ) {
      draw_type = 2;
    }

  }

  //ctx.translate( x, y );
  if (draw_type == 0) {
    ctx.drawImage( img, x, y);
  } else if (draw_type == 1) {
    ctx.drawImage( img, x, y, w, h );
  } else if (draw_type == 2) {
    ctx.drawImage( img, clip_x, clip_y, clip_w, clip_h, x, y, w, h );
  }
  //ctx.translate( -x, -y );

}

lunaRender.prototype.drawRectangle = function( x, y, w, h, line_width, line_color, fill_flag, fill_color )
{
  var ctx = this.context;
  line_width    = ( typeof line_width !== 'undefined' ? line_width : this.default_line_width  );
  line_color    = ( typeof line_color !== 'undefined' ? line_color : this.default_stroke_color );
  fill_flag     = ( typeof fill_flag  !== 'undefined' ? fill_flag : false );
  fill_color    = ( typeof fill_color !== 'undefined' ? fill_color : this.default_fill_color );

  ctx.beginPath();
  ctx.rect( x, y, w, h );

  if (fill_flag)
  {
    ctx.fillStyle = fill_color;
    ctx.fill();
  }

  if (line_width > 0)
  {
    ctx.lineWidth = line_width;
    ctx.strokeStyle = line_color;
    ctx.stroke();
  }

}


lunaRender.prototype._font_text_width = function(text, font, xsize)
{
  var tally = 0;
  var scale = font.scale_factor;
  xsize = parseFloat(xsize);

  for (var i in text)
  {
    var ch_ord = text.charCodeAt(i);
    var f = font[ch_ord];
    var dx = xsize * (parseFloat(f.xsto) - parseFloat(f.xsta)) * scale ;
    tally += dx;
  }

  return tally;

}

lunaRender.prototype.drawTextFont = 
  function( text,
            font, 
            x, y, 
            color,
            sizex, sizey,
            line_width,
            angle_deg, 
            offset_flag_h, 
            offset_flag_v,
            flip_text_flag  )
{

  var ctx = this.context;

  color         = (( typeof color !== 'undefined' ) ? color : "rgb( 255, 255, 255 )" );
  sizex         = (( typeof sizex !== 'undefined' ) ? parseFloat(sizex) : 500 );
  sizey         = (( typeof sizey !== 'undefined' ) ? parseFloat(sizey) : 500 );
  line_width    = (( typeof line_width !== 'undefined' ) ? parseFloat(line_width) : 80 );
  angle_deg     = (( typeof angle_deg !== 'undefined' ) ? parseFloat(angle_deg) : 0 );
  offset_flag_h = (( typeof offset_flag_h !== 'undefined' ) ? offset_flag_h : 'C' );
  offset_flag_v = (( typeof offset_flag_v !== 'undefined' ) ? offset_flag_v : 'C' );
  flip_text_flag= (( typeof flip_text_flag !== 'undefined' ) ? flip_text_flag : false );

  var angle_radian = Math.PI * angle_deg / 180.0;

  var scale = parseFloat(font.scale_factor);

  var w = this._font_text_width(text, font, sizex);
  var sx = w / 2;

  //var h = scale * sizey;
  var h = sizey;
  var sy = h / 2;

  if      (offset_flag_h == 'L') { sx = 0; }
  else if (offset_flag_h == 'C') { sx = w/2; }
  else if (offset_flag_h == 'R') { sx = w; }

  if      (offset_flag_v == 'T') { sy = h; }
  else if (offset_flag_v == 'C') { sy = h/2; }
  else if (offset_flag_v == 'B') { sy = 0; }

  ctx.translate( x, y );
  if (flip_text_flag) ctx.scale(-1, 1);
  ctx.rotate( angle_radian );

  //ctx.translate( -sx, +sy );
  //ctx.translate( 0, +sy );

  var ch_x = 0;

  var A = scale * sizex;
  var B = scale * sizey;

  ctx.strokeStyle = color;
  ctx.lineJoin = "round";
  ctx.lineWidth = line_width;
  ctx.beginPath();


  for (var i in text)
  {
    var ch_ord = text.charCodeAt(i);


    var f = font[ch_ord];

    var xsta = scale * parseFloat(f.xsta) * sizex;
    var xsto = scale * parseFloat(f.xsto) * sizex;

    var dx =  (xsto - xsta) ;

    for (var a_ind in f.art)
    {

      for (var k in f.art[a_ind])
      {
        //var tx =  A * parseFloat(f.art[a_ind][k].x) + x - sx;
        //var ty = -B * parseFloat(f.art[a_ind][k].y) + y + sy;
        var tx =  A * parseFloat(f.art[a_ind][k].x)  - sx;
        var ty = -B * parseFloat(f.art[a_ind][k].y)  + sy;
        //var ty = -B * parseFloat(f.art[a_ind][k].y) ;

        if ( parseInt(k) == 0 )
          ctx.moveTo(ch_x + tx, ty);
        ctx.lineTo(ch_x + tx, ty);

      }
    }

    ch_x += dx;
  }

  ctx.stroke(); 

  //ctx.translate( -x + sx, -y - sy );

  //ctx.translate( sx, -sy );
  //ctx.translate( 0, -sy );

  ctx.rotate( -angle_radian );
  if (flip_text_flag) ctx.scale(-1, 1);
  ctx.translate( -x, -y );


}


// rotate text angle_deg clockwise
//
lunaRender.prototype.drawText = 
  function( s, x, y, 
            color, size, angle_deg, 
            offset_flag_h, offset_flag_v,
            flip_text_flag
          )
{
  var ctx = this.context;

  color         = (( typeof color !== 'undefined' ) ? color : "rgb( 0, 0, 0 )" );
  size          = (( typeof size !== 'undefined' ) ? size : 60 );
  angle_deg     = (( typeof angle_deg !== 'undefined' ) ? angle_deg : 0 );
  offset_flag_h = (( typeof offset_flag_h !== 'undefined' ) ? offset_flag_h : 'L' );
  offset_flag_v = (( typeof offset_flag_v !== 'undefined' ) ? offset_flag_v : 'C' );
  flip_text_flag= (( typeof flip_text_flag !== 'undefined' ) ? flip_text_flag : false );

  var pix_font = Math.floor( (size * this.pixel_per_unit) + 0.5 );
  var pix_width = Math.floor( pix_font * 0.6 + 0.5 );
  var x_height = Math.floor( 0.42 * pix_font + 0.5 );
  var fudge_up = (pix_font - x_height)/2;

  var angle_radian = Math.PI * angle_deg / 180.0;

  ctx.translate( x, y );
  ctx.rotate( angle_radian );
  if (flip_text_flag) ctx.scale(-1, 1);

  if      (offset_flag_h == 'L') { ctx.textAlign = "left"; }
  else if (offset_flag_h == 'C') { ctx.textAlign = "center"; } 
  else if (offset_flag_h == 'R') { ctx.textAlign = "right"; }

  if      (offset_flag_v == 'T') { ctx.textBaseline = "top"; }
  else if (offset_flag_v == 'C') { ctx.textBaseline = "middle"; }
  else if (offset_flag_v == 'B') { ctx.textBaseline = "bottom"; }

  ctx.fillStyle = color;
  ctx.font = pix_font + "px Courier";



  ctx.fillText( s, 0, 0 );

  if (flip_text_flag) ctx.scale(-1, 1);
  ctx.rotate( -angle_radian );
  ctx.translate( -x, -y );

}
