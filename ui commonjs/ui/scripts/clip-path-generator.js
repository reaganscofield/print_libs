var previewImg;
var isClipMovable = false;
var isClipDraggingMode = false;

var clipMarkersLatestId = 0;
var clipMarkers;
var previewWrap;
var pvLeftOffset, pvTopOffset;
var lineDotDistanceThrashold  = 8;
var clipType = 'polygon';
var clipCircleX, clipCircleY;
var clipCircleRadius = 100;
var imgBgColor = "";
var applyMaskOn = true, visibleMarkersOn = true;
var canvas;

jQuery(document).ready(function(){
  jQuery.event.props.push('dataTransfer');

  previewImg = jQuery('#preview-img');

  previewImg.load(function(){
    pvLeftOffset = previewWrap.offset().left;
    pvTopOffset  = previewWrap.offset().top;
  });

  previewWrap = jQuery('#preview-img-wrap');
  pvLeftOffset = previewWrap.offset().left;
  pvTopOffset  = previewWrap.offset().top;



  loadPath( examplePaths['4side-polygon'] );
  handleMarkers();

  initAddingMarkerProcess();
  initHotKeys();
  initControls();
  initMarkerControls();
  initDragDrop();
  initImage();

});

function initHelp(){
  jQuery("#help-btn").fancybox({
    type: 'inline'
  });
}


function initLinesSelection(){

     function init(container, width, height, fillColor) {
        canvas = createCanvas(container, width, height);
        var ctx = canvas.context;
        // define a custom fillCircle method
        var fillColor = "rgba(255, 255, 255, 0)";

        ctx.clearTo = function(fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(0, 0, width, height);
        };
        ctx.clearTo(fillColor);


        // bind mouse events
        var offsetLeft = jQuery('#preview-img-wrap').position().left;
        var offsetTop = jQuery('#preview-img-wrap').position().top;

        canvas.node.onmousemove = function(e) {

            if (!canvas.isDrawing) {
               return;
            }
            ctx.clearRect(0, 0, width, height);
            ctx.beginPath();

            var radius = 2; // or whatever
            //var fillColor = '#ff0000';
            //ctx.fillCircle(x, y, radius, fillColor);
            ctx.moveTo( linePoints[0].x, linePoints[0].y);
            var cLen = linePoints.length;

            if(cLen > 1)
              for(var i = 1; i < cLen; i++ ){
                ctx.lineTo( linePoints[i].x, linePoints[i].y );
              }
            var x = e.clientX - offsetLeft;
            var y = e.clientY - offsetTop + jQuery(window).scrollTop();
            ctx.lineTo(x,y);
            //coords.push( {x: x, y: y});
            ctx.strokeStyle = '#ff0000';
            ctx.stroke();

            ctx.closePath();
            return false;
        };

        var linePoints;
        canvas.node.onmousedown = function(e) {
            if(!canvas.isDrawing){
              canvas.isDrawing = true;
              linePoints = [];
              resetPath();
            }
            /*coords = [];

            var fillColor = "rgba(255, 255, 255, 0)";
            ctx.clearTo(fillColor);
            ctx.clearRect(0, 0, width, height);
            //ctx.clear();
            ctx.beginPath();
            var x = e.clientX - offsetLeft;
            var y = e.clientY - offsetTop;
            coords.push( {x: x, y: y});
            ctx.moveTo(x,y);
            */

            var x = e.clientX - offsetLeft;
            var y = e.clientY - offsetTop + jQuery(window).scrollTop();

            var cLen = linePoints.length;
            if(cLen > 0){
              if( ( Math.abs( x - linePoints[cLen - 1].x ) <= 1 && Math.abs( y - linePoints[cLen - 1].y) <= 1 ) ||
                  ( Math.abs(x - linePoints[0].x) <= 2 && Math.abs(y - linePoints[0].y) <= 2 )
                ){
                canvas.isDrawing = false;
                //handleCoordsIntersection(linePoints);
                //console.log(linePoints);
                handleCoordsSelection(linePoints);

                return false;
              }
            }

            unselectSelectionButtons();

            linePoints.push( {x: x, y: y});
            return false;
        };
        canvas.node.onmouseup = function(e) {
            //canvas.isDrawing = false;
            //ctx.closePath();

            //handleCoordsIntersection(coords);
        };
    }

    var container = document.getElementById('preview-img-wrap');
    var cWidth = jQuery(container).width();
    var cHeight = jQuery(container).height();

    init(container, cWidth, cHeight, '#ddd');

    jQuery('#lines-selection-lnk').addClass('active');
    jQuery('#pen-selection-lnk').removeClass('active');

    jQuery('#preview-img-wrap').removeClass('lasso-mode');
    jQuery('#preview-img-wrap').addClass('polygonal-lasso-mode');
}

function unselectSelectionButtons(){
  jQuery('#lines-selection-lnk').removeClass('active');
  jQuery('#pen-selection-lnk').removeClass('active');

  jQuery('#preview-img-wrap').removeClass('lasso-mode');
  jQuery('#preview-img-wrap').removeClass('polygona-lasso-mode');
}

function optimizeCoords(coords){
  var cLen = coords.length;
  if(cLen <= 3)
    return coords;

  var pP1 = coords[cLen - 1];
  var pP2 = coords[cLen - 2];
  var pV = normalizePointsToVector(pP1, pP2);
  for(var j = cLen - 3; j >= 0; j--){
    if(j + 1 >= coords.length )
      continue;

    var pP1 = coords[j + 1];
    var pP2 = coords[j];
    var nV = normalizePointsToVector(pP1, pP2);
    if(nV.x == pV.x && nV.y == pV.y){
      coords.splice(j + 1, 1);
    }
    else
      pV = nV;
  }

  return coords;
}

function createCanvas(parent, width, height) {
        if(canvas){
          jQuery(canvas.node).remove();
          delete canvas;
        }
        canvas = {};
        canvas.node = document.createElement('canvas');
        canvas.context = canvas.node.getContext('2d');
        canvas.node.width = width || 100;
        canvas.node.height = height || 100;
        parent.appendChild(canvas.node);
        return canvas;
}

function initPenSelection() {



    function init(container, width, height, fillColor) {
        var canvas = createCanvas(container, width, height);
        var ctx = canvas.context;
        // define a custom fillCircle method
        var fillColor = "rgba(255, 255, 255, 0)";

        ctx.clearTo = function(fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(0, 0, width, height);
        };
        ctx.clearTo(fillColor);


        // bind mouse events
        var offsetLeft = jQuery('#preview-img-wrap').position().left;
        var offsetTop = jQuery('#preview-img-wrap').position().top;
        canvas.node.onmousemove = function(e) {
            if (!canvas.isDrawing) {
               return;
            }

            var x = e.clientX - offsetLeft;
            var y = e.clientY - offsetTop + jQuery(window).scrollTop();
            var radius = 2; // or whatever
            //var fillColor = '#ff0000';
            //ctx.fillCircle(x, y, radius, fillColor);
            ctx.lineTo(x,y);
            coords.push( {x: x, y: y});
            ctx.strokeStyle = '#ff0000';
            ctx.stroke();
            return false;
        };

        var coords = [];
        canvas.node.onmousedown = function(e) {
            coords = [];
            canvas.isDrawing = true;
            var fillColor = "rgba(255, 255, 255, 0)";
            ctx.clearTo(fillColor);
            ctx.clearRect(0, 0, width, height);
            //ctx.clear();
            ctx.beginPath();
            var x = e.clientX - offsetLeft;
            var y = e.clientY - offsetTop + jQuery(window).scrollTop();
            coords.push( {x: x, y: y});
            ctx.moveTo(x,y);
            return false;
        };
        canvas.node.onmouseup = function(e) {
            canvas.isDrawing = false;
            ctx.closePath();

            handleCoordsIntersection(coords);
            unselectSelectionButtons();
        };
    }

    var container = document.getElementById('preview-img-wrap');
    var cWidth = jQuery(container).width();
    var cHeight = jQuery(container).height();

    init(container, cWidth, cHeight, '#ddd');

    jQuery('#lines-selection-lnk').removeClass('active');
    jQuery('#pen-selection-lnk').addClass('active');

    jQuery('#preview-img-wrap').addClass('lasso-mode');
    jQuery('#preview-img-wrap').removeClass('polygonal-lasso-mode');
}

function handleCoordsIntersection(coords){
  var cLen = coords.length;

  var good = false;
  var j,i,intersectionPoint;
  for(i = cLen - 1; i > 0 ; i--){
     for(j = 0 ; j < cLen - 1; j++){

       if( i - 1 == j + 1 || i == j )
         continue;
       intersectionPoint = linesIntersect( coords[i], coords[i - 1], coords[j], coords[j+1]  );
       if( intersectionPoint ){
         //console.log(i + ' ' + j);
         //console.log(coords[i] +', ' + coords[i - 1]  +', ' + coords[j]  +', ' + coords[j+1]);
         good = true;
         break;
       }
      }
       if(good)
        break;

  }

  if(good){
    //console.log(good);
    //console.log(j + ' ' + i);
    coords = coords.slice(j,i);
    var pathLength = coords.length;
    coords[0].x = intersectionPoint.x;
    coords[0].y = intersectionPoint.y;

    coords[pathLength - 1].x = intersectionPoint.x;
    coords[pathLength - 1].y = intersectionPoint.y;

    handleCoordsSelection(coords);
  }
  else{
    //var pathLength = coords.length;
    //var x1 = coords[0].x;
    //var y1 = coords[0].y;

    //var x2 = coords[pathLength - 1].x;
    //var y2 = coords[pathLength - 1].y;

    //var distance = getVectorLength( {x : x2 - x1, y: y2 - y2 } );
    //if(distance <= 3)
    handleCoordsSelection(coords);

  }

  //linesIntersect
}

function handleCoordsSelection(coords){
    optimizeCoords(coords);
    var pathLength = coords.length;

    jQuery('#preview-img-wrap .marker').remove();
    clipMarkers = new Array();

    for(var i = 0; i< pathLength; i++){
      addMarker( coords[i].x , coords[i].y);
    }

    if(canvas)
      jQuery(canvas.node).hide();
    handleMarkers();
}

var examplePaths = {
  '4side-polygon': [ [0,0], [200, 0], [400, 0], [400, 300], [400, 600], [200, 600], [0, 600], [0, 300] ] ,
  'triangle': [ [300, 50], [400, 100], [200, 250] ],
  'rhomb' : [  [300,50], [ 400, 200], [300, 350], [ 200 , 200] ]

};
function initClipExamples(){
  jQuery('#clip-example a').click(function(){
     var val = jQuery(this).attr('data-value');

     loadPath( examplePaths[val] );
     handleMarkers();
  });
}

function resetPath(){
  jQuery('#preview-img-wrap .marker').remove();
  clipMarkers = new Array();
  draggableMakerIndex = -1;
  handleMarkers();
}

function loadPath(path){
  jQuery('#preview-img-wrap .marker').remove();
  clipMarkers = new Array();
  var pathLength = path.length;
  for(var i = 0; i< pathLength; i++){
   addMarker( path[i][0] , path[i][1]);
  }


}

var startClipX;
var startClipY;
var isInsidePolygon = false;
function initImage(){
  previewImg.mousemove(function(e){
  	 if(isClipDraggingMode || clipType != 'polygon')
  	 	return;

     if(clipType == 'polygon'){
		   if( insidePolygon(e)){
			   previewImg.addClass('moving');
			   isClipMovable = true;
         isInsidePolygon = true;
		   }
		   else{
			   isClipMovable = false;
			   previewImg.removeClass('moving');
         isInsidePolygon = false;
		    }
     }

  });

  previewImg.mousedown(function(e){
  	 if(clipType != 'polygon')
  	 	return;

  	 if(isClipMovable){
  	 	isClipDraggingMode = true;
  	 	startClipX = e.clientX;
  	 	startClipY = e.clientY;
  	 	updateClipMarkersStartPositions();

  	 }

  	 return false;
  });

  previewImg.mousemove(function(e){
     if(isClipDraggingMode){
     	var deltaX =  e.clientX - startClipX;// - pvLeftOffset;
  	 	var deltaY =  e.clientY - startClipY;// - pvTopOffset;
     	updateClipMarkersPositionByDelta(deltaX, deltaY);
     	updateMarkersRednerPosition();
     	handleMarkers();
     }
  });

  previewImg.mouseup(function(e){
		isClipDraggingMode = false;
  });
}

function updateClipMarkersStartPositions(){
  var markersCount = clipMarkers.length;
  for(var i = 0; i < markersCount; i++){
  	clipMarkers[i].startX = clipMarkers[i].x;
  	clipMarkers[i].startY = clipMarkers[i].y;
  }
}

function updateClipMarkersScaleVectors(){
  var centroid = calculateCenteroid();
  var markersCount = clipMarkers.length;
  for(var i = 0; i < markersCount; i++){
    clipMarkers[i].vectorX = clipMarkers[i].x - centroid.x;
    clipMarkers[i].vectorY = clipMarkers[i].y - centroid.y;
  }
}

function updateClipMarkersPositionByDelta(deltaX, deltaY){
  var markersCount = clipMarkers.length;
  for(var i = 0; i < markersCount; i++){
  	clipMarkers[i].x = clipMarkers[i].startX + deltaX;
  	clipMarkers[i].y = clipMarkers[i].startY + deltaY;
  }
}

function insidePolygon(e){
  var x = e.clientX - pvLeftOffset;
  var y = e.clientY - pvTopOffset;

  var markersCount = clipMarkers.length;

  var j=0;
  var oddNodes = false;


  for (var i=0; i < markersCount; i++) {
    j++;
    if (j == markersCount)
    	j = 0;

    if (((clipMarkers[i].y < y) && ( clipMarkers[j].y >= y))
    || (( clipMarkers[j].y < y) && (clipMarkers[i].y >= y))) {
      if ( clipMarkers[i].x + (y - clipMarkers[i].y )   /  ( clipMarkers[j].y - clipMarkers[i].y)
      *  (clipMarkers[j].x - clipMarkers[i].x)<x ) {
        oddNodes = !oddNodes
      }
    }
  }
  return oddNodes;
}

function initDragDrop(){
  jQuery('#preview-img-wrap').bind('drop', function(e) {
  	 var files = e.dataTransfer.files;
  	  jQuery.each(files, function(index, file) {
  	  	 if(index > 0 || !files[index].type.match('image.*') )
  	  	 	return false;

  	  	 var fileReader = new FileReader();
  	  	 fileReader.onload = (function(file) {
        	return function(e) {

        	  var image = this.result;
        	  jQuery('#preview-img').attr('src', image);
        	}
         })(files[index]);

  	  	 fileReader.readAsDataURL(file);

  	  });

  	 return false;
  });

  jQuery('#preview-img-wrap').bind('dragenter', function() {
    jQuery(this).addClass('over-drag');
    return false;
  });

  jQuery('#preview-img-wrap').bind('dragleave', function() {
    jQuery(this).removeClass('over-drag');
    return false;
  });

  jQuery('#user-image-input').change(function(){
      var input = jQuery(this);
      console.log(input.files);
      if ( input.files && input.files[0] && input.files[0].type.match('image.*') ) {
         var fileReader = new FileReader();
  	  	 fileReader.onload = (function(file) {
        	return function(e) {

        	  var image = this.result;
        	  jQuery('#preview-img').attr('src', image);
        	}
         })(files[index]);

  	  	 fileReader.readAsDataURL(file);
    }
  });
}

function initMouseCoordsDisplaying(){
  var xLabel = jQuery('#x-coord-lb');
  var yLabel = jQuery('#y-coord-lb');
  jQuery('#preview-img-wrap').mousemove(function(e){
    xLabel.text( parseInt( e.clientX - pvLeftOffset) );
    yLabel.text( parseInt(e.clientY - pvTopOffset) );
  });
}

function initCodeMode(){
  jQuery('input[name="code-type"]').click(function(){
     var radio = jQuery(this);
     if( radio.val() == 'file' ){
       jQuery('#files-texts').show();
       jQuery('#inline-texts').hide();
     }
     else{
       jQuery('#files-texts').hide();
       jQuery('#inline-texts').show();
     }

  });
}

function initControls(){

  initMouseCoordsDisplaying();
  initCodeMode();

  jQuery('#pen-selection-lnk').click(initPenSelection);
  jQuery('#lines-selection-lnk').click(initLinesSelection);
  jQuery('#reset-lnk').click(resetPath);



  jQuery('#apply-mask-btn').click(function(){
    applyMaskOn = !applyMaskOn;
    if(applyMaskOn)
      jQuery(this).addClass('active');
    else
      jQuery(this).removeClass('active');

    handleMarkers();
    return false;
  });

  jQuery('#show-markers-btn').click(function(){
    visibleMarkersOn = !visibleMarkersOn;
    if(visibleMarkersOn){
      jQuery('body').removeClass('hide-markers');
      jQuery(this).addClass('active');
    }
    else{
      jQuery('body').addClass('hide-markers');
      jQuery(this).removeClass('active');
    }
    return false;
  });

  /*jQuery('#show-markers-chk').change(function(){
    if(jQuery(this).is(':checked'))
      jQuery('body').removeClass('hide-markers');
    else
      jQuery('body').addClass('hide-markers');
    return false;

  });
*/

  jQuery('#clip-type-select').change(function(){
     clipType = jQuery(this).val();

     //jQuery('.marker').hide();
     jQuery('#clip-circle').hide();

     if(clipType == 'circle' ){
     	if( clipCircleX == undefined){
     	  clipCircleX = previewImg.width() * 0.5;
     	  clipCircleY = previewImg.height() * 0.5;
        jQuery('#polygon-tools').hide();
        jQuery('body').addClass('hide-markers');
        jQuery('body').addClass('hide-lines');
     	}

     	jQuery('#clip-circle').css({ left: clipCircleX - clipCircleRadius, top: clipCircleY - clipCircleRadius, width: clipCircleRadius * 2, height: 2 * clipCircleRadius });
    	jQuery('#clip-circle').show();

     }
     else if(clipType == 'polygon'){
     	jQuery('body').removeClass('hide-markers');
      jQuery('body').removeClass('hide-lines');
      jQuery('#polygon-tools').show();
     }

     handleMarkers();

  });

  var clipCircleElement = jQuery('#clip-circle');
  clipCircleElement.draggable({
      start: function(e){

      },

      stop: function(e) {
        updateClipCircle();
      },
      drag: function(e){
        updateClipCircle();
      }
  });

  var initClipCircleElementWidth, initClipCircleElemenLeft, initClipCircleElemenTop;

  clipCircleElement.resizable({
      aspectRatio: 1,
      start: function(e){
      	initClipCircleElementWidth = clipCircleElement.width();
  		initClipCircleElemenLeft = clipCircleElement.position().left;
  		initClipCircleElemenTop = clipCircleElement.position().top;
      },

      stop: function(e) {

      },
      resize: function(e){

        var newWidth = clipCircleElement.width();
        var deltaWidth = Math.round( (newWidth - initClipCircleElementWidth) * 0.5 );
        clipCircleElement.css({ left: initClipCircleElemenLeft - deltaWidth, top: initClipCircleElemenTop - deltaWidth  });
        clipCircleRadius = Math.round( newWidth * 0.5);
        updateClipCircle();
      }
  });
}

function updateClipCircle(){
	var clipCircleElement = jQuery('#clip-circle');
	clipCircleX = clipCircleElement.position().left + clipCircleRadius;
  clipCircleY = clipCircleElement.position().top + clipCircleRadius;
	handleMarkers();
}

function initHotKeys(){
	jQuery('body').keydown(function(e){
       // remove current selected marker

       if(e.keyCode == 46){
       		 removeActiveMarker();
       }
	});


}

function initMarkerControls(){
  jQuery('#remove-marker-lnk').click(function(){
    removeActiveMarker();
    return false;
  });

  jQuery('#next-marker-lnk').click(function(){
    highlightNextMarker(1);
    return false;
  });

  jQuery('#prev-marker-lnk').click(function(){
    highlightNextMarker(-1);
    return false;
  });

  jQuery('#selected-marker-left').change(function(){
     if(draggableMakerIndex >=0 ){
       clipMarkers[ draggableMakerIndex].x = parseInt( jQuery(this).val() );
       handleMarkers();
       updateMarkersRednerPosition();
     }
  });

  jQuery('#selected-marker-top').change(function(){
     if(draggableMakerIndex >=0 ){
       clipMarkers[ draggableMakerIndex].y = parseInt( jQuery(this).val() );
       handleMarkers();
       updateMarkersRednerPosition();
     }
  });

}

function highlightNextMarker(delta){
  if(draggableMakerIndex >= 0){
    draggableMakerIndex += delta;
    if(draggableMakerIndex < 0 )
      draggableMakerIndex = clipMarkers.length - 1;
    else if(draggableMakerIndex >= clipMarkers.length)
      draggableMakerIndex = 0;

  }
  else
    draggableMakerIndex = 0;

  highlightSelectedMarker();
}

function removeActiveMarker(){
  if(draggableMakerIndex < 0 || draggableMakerIndex  == undefined)
     return;

  var marker = clipMarkers[draggableMakerIndex].marker;
  marker.remove();

  clipMarkers.splice( draggableMakerIndex, 1);
  //draggableMakerIndex = -1;
  if(draggableMakerIndex >= clipMarkers.length )
    draggableMakerIndex = clipMarkers.length - 1;
  handleMarkers();
  highlightSelectedMarker();
}

function scalePolygonByRatio(ratio, centroid){
  var clipMarkersCount = clipMarkers.length;
  for(var i = 0; i < clipMarkersCount; i++) {
    var marker = clipMarkers[i];
    marker.x = centroid.x + Math.round( marker.vectorX * ratio );
    marker.y = centroid.y + Math.round( marker.vectorY * ratio );
  }
}

function rotatePolygonByDegree(degree, centroid){
  var clipMarkersCount = clipMarkers.length;
  for(var i = 0; i < clipMarkersCount; i++) {
    var marker = clipMarkers[i];
    var rotatedVector = rotateVectorByAngle({x: marker.vectorX, y: marker.vectorY }, degree);
    marker.x = rotatedVector.x + centroid.x;
    marker.y = rotatedVector.y + centroid.y;

  }
}


var initScaleVectorLen;
function bindScalingMouseDown(e){
    if(!allowScaling)
      return false;

    updateClipMarkersStartPositions();
    updateClipMarkersScaleVectors();
    centroid = calculateCenteroid();
    initScaleVectorLen = getVectorLength( {x : e.clientX - centroid.x, y: e.clientY - centroid.y } );

    jQuery('#preview-img').bind('mouseup', bindScalingMouseUp );
    jQuery('#preview-img').bind('mousemove', bindScalingMouseMove );
}

function bindScalingMouseUp(){
  jQuery('#preview-img').unbind('mousemove', bindScalingMouseMove );
  jQuery('#preview-img').unbind('mouseup', bindScalingMouseUp );

}

function bindScalingMouseMove(e){
  if(clipType != 'polygon')
    return;

    var newScaleVectorLen = getVectorLength( {x : e.clientX - centroid.x, y: e.clientY - centroid.y } );
    var ratio = newScaleVectorLen / initScaleVectorLen;
    scalePolygonByRatio(ratio, centroid);
    updateMarkersRednerPosition();
    handleMarkers();
};

function isNearMarker(e){
  if(isInsidePolygon)
    return false;

  var clipMarkersCount = clipMarkers.length;
  for(var i = 0; i < clipMarkersCount; i++) {
    var marker = clipMarkers[i];
    var distance = getVectorLength( {x : e.clientX - marker.x - pvLeftOffset, y: e.clientY - marker.y - pvTopOffset } );
    if(distance >= 8 && distance <= 16 )
        return true;
  }

  return false;

}

function bindRotationMouseDown(e){
   if(!allowRotation)
    return false;

   updateClipMarkersScaleVectors();
   centroid = calculateCenteroid();

   initRotateVector = normalizeVector( {x : e.clientX - centroid.x, y: e.clientY - centroid.y} )

   jQuery('#preview-img').bind('mouseup',   bindRotationMouseUp );
   jQuery('#preview-img').bind('mousemove', bindRotationMouseMove );

}

function bindRotationMouseUp(e){
  jQuery('#preview-img').unbind('mouseup',   bindRotationMouseUp );
  jQuery('#preview-img').unbind('mousemove', bindRotationMouseMove );
}

function bindRotationMouseMove(e){
  if(clipType != 'polygon')
      return;

  var newRotationVector = normalizeVector( {x : e.clientX - centroid.x, y: e.clientY - centroid.y} );
  var deltaAngle = vectorsAngle(newRotationVector, initRotateVector);
  rotatePolygonByDegree(deltaAngle, centroid);
  updateMarkersRednerPosition();
  handleMarkers();
}

var allowMarkerAdding = true;
var allowScaling = false;
var markerInsertionIndex;
var centroid;
var allowRotation = false;
var initScaleVectorLen;
  var initRotateVector;

function initAddingMarkerProcess(){

  jQuery('#preview-img').click(function(e){

    if(!allowMarkerAdding || allowScaling || allowRotation)
    	return false;

    addMarker( e.clientX - pvLeftOffset, e.clientY - pvTopOffset, markerInsertionIndex );
    draggableMakerIndex = markerInsertionIndex;
    handleMarkers();
    highlightSelectedMarker();
  });

  jQuery('#preview-img').bind('mousedown', bindScalingMouseDown );
  jQuery('#preview-img').bind('mousedown', bindRotationMouseDown );

  jQuery('#preview-img').mousemove(function(e){
  	 if(clipType != 'polygon')
  	 	return;

     var pointX = e.clientX - pvLeftOffset;
     var pointY = e.clientY - pvTopOffset;

     var markersCount = clipMarkers.length;
     var i;
     var dot = { x: pointX, y: pointY};
     var lineDot1, lineDot2;
     for(i = 0; i < markersCount; i++){
     	if( i < markersCount - 1){
     	  lineDot1 = clipMarkers[i];
     	  lineDot2 = clipMarkers[i + 1];
     	}
     	else{
     	  lineDot1 = clipMarkers[i];
     	  lineDot2 = clipMarkers[0];
     	}

		  distance = Math.round( distToSegment( dot , lineDot1 , lineDot2 ) );
		  if(distance <= lineDotDistanceThrashold)
			  break;
     }

      if(isNearMarker(e)){
         allowRotation = true;
         jQuery('#preview-img-wrap').addClass('rotate-mode');
      }
      else{
         allowRotation = false;
         jQuery('#preview-img-wrap').removeClass('rotate-mode');
      }

     //console.log(distance);

     if(!isInsidePolygon && distance > 4 && distance <= 8){
       jQuery('#preview-img-wrap').addClass('scale-mode');
       jQuery('#preview-img-wrap').removeClass('add-mode');
       allowScaling = true;
     }
     else if(distance <= 3){
     	jQuery('#preview-img-wrap').addClass('add-mode');
      jQuery('#preview-img-wrap').removeClass('scale-mode');
     	allowMarkerAdding = true;
     	markerInsertionIndex = i + 1;

     }
     else {
       jQuery('#preview-img-wrap').removeClass('add-mode');
       jQuery('#preview-img-wrap').removeClass('scale-mode');
       allowMarkerAdding = false;
       allowScaling = false
     }

  });


}

function updateMarkersRednerPosition(){
  var markersCount = clipMarkers.length;

  for(var i = 0; i < markersCount; i++){
  	//clipMarkers[i].x = clipMarkers[i].startX + deltaX;
  	//clipMarkers[i].y = clipMarkers[i].startY + deltaY;
  	var clipMarker = clipMarkers[i];
    var marker = clipMarker.marker;
  	marker.css( { left : clipMarker.x, top: clipMarker.y } );
  }



}

function updateMarkerLines(){
  var markersCount  = clipMarkers.length;
  jQuery('.marker-line').remove();
  for(var i = 0; i < markersCount; i++){
    var clipMarker = clipMarkers[i];
    var nextMarker;
    if(i + 1 < markersCount)
      nextMarker = clipMarkers[i + 1];
    else
      nextMarker = clipMarkers[0];
    addMarkerConnectionLine(clipMarker.x, clipMarker.y, nextMarker.x, nextMarker.y);
  }
}

function addMarkerConnectionLine(x1,y1, x2,y2){
  var length = Math.round( Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2)) );
  var angle  = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

  var newLine = jQuery('<div>');
  newLine.addClass('marker-line');
  jQuery('#preview-img-wrap').append(newLine);

  newLine.css('-webkit-transform', 'rotate(' + angle + 'deg)')
    .css('-moz-transform', 'rotate(' + angle + 'deg)')
    .css('-o-transform', 'rotate(' + angle + 'deg)')
    .css('-ms-transform', 'rotate(' + angle + 'deg)')
    .css('transform', 'rotate(' + angle + 'deg)')

    .css('width', length)
    .css({left: x1, top: y1});
}

var draggableMakerIndex;
function addMarker( x, y, insertionIndex){
	clipMarkersLatestId ++;

	var marker = jQuery('<span>');
	var markerId = 'marker-' + clipMarkersLatestId;
	marker.attr('id', markerId );
	marker.addClass('marker');
	marker.css({ 'left': x, 'top': y});

	if( typeof insertionIndex !== undefined)
	  clipMarkers.splice(insertionIndex, 0, {x: x, y: y, id : markerId, marker: marker });
	else
	  clipMarkers.push({x: x, y: y, id : markerId, marker: marker });

    previewWrap.append(marker);

	marker.draggable({
      start: function(e){
        var tmpMarker = jQuery(this);
        var tmpMarkerId = tmpMarker.attr('id');
        draggableMakerIndex = getClipMarkerIndexById(tmpMarkerId);
        var offset = tmpMarker.position();


        //updateDraggableMarker( e.clientX - pvLeftOffset, e.clientY - pvTopOffset  );
        updateDraggableMarker( offset.left, offset.top );
        highlightSelectedMarker();
      },

      stop: function(e) {
      	var tmpMarker = jQuery(this);
      	var offset = tmpMarker.position();
        //updateDraggableMarker( e.clientX - pvLeftOffset, e.clientY - pvTopOffset  );
        updateDraggableMarker( offset.left , offset.top  );
      },
      drag: function(e){
      	var tmpMarker = jQuery(this);
      	var offset = tmpMarker.position();
      	//console.log( offset.left);
        //console.log(e.clientX - pvLeftOffset);
        //updateDraggableMarker( e.clientX - pvLeftOffset, e.clientY - pvTopOffset  );
        updateDraggableMarker( offset.left , offset.top);
      }
    });

    marker.click(function(){
		var tmpMarker = jQuery(this);
        var tmpMarkerId = tmpMarker.attr('id');
        draggableMakerIndex = getClipMarkerIndexById(tmpMarkerId);
        highlightSelectedMarker();
    });

}

function highlightSelectedMarker(){

	jQuery('.marker').removeClass('active');
	if(draggableMakerIndex >= 0) {
	  clipMarkers[ draggableMakerIndex ].marker.addClass('active');
    updateSelectedMarkerControls();

  }
}

function updateSelectedMarkerControls(){
  if(draggableMakerIndex >= 0) {
    jQuery('#selected-marker-left').val( parseInt( clipMarkers[ draggableMakerIndex].x ) );
    jQuery('#selected-marker-top').val( parseInt( clipMarkers[ draggableMakerIndex].y ) );

    jQuery('#selected-marker-block').addClass('enabled');
    jQuery('#selected-marker-block .position-input').removeAttr('disabled');

  }
  else {
    jQuery('#selected-marker-left').val( '' );
    jQuery('#selected-marker-top').val( '' );

    jQuery('#selected-marker-block').removeClass('enabled');
    jQuery('#selected-marker-block .position-input').attr('disabled', 'disabled');
  }


}

function updateDraggableMarker(x, y){
  //console.log(draggableMakerIndex);
  if(draggableMakerIndex < 0)
    return;
  clipMarkers[draggableMakerIndex].x = x;
  clipMarkers[draggableMakerIndex].y = y;
  //console.log(clipMarkers);
  handleMarkers();
}

function getClipMarkerIndexById(markerId){
  var count = clipMarkers.length;
  for(var i = 0; i < count; i++){
  	var marker = clipMarkers[i];
  	if(marker.id == markerId)
  		  return i;
  }

  return -1;
}

function handleMarkers(){
  updateMarkerLines();

  //var css = "";
  //var applyCss = "";

  var css;
  if(clipType == 'circle')
    css = generateClipCircleCss();
  else
    css = generateClipPathCss();

  //if(applyMaskOn)
  //  applyCss += css;


  var codeCss = "/*Chrome,Safari*/\n-webkit-clip-path: " + css.webkit +";\n\n/*Firefox*/\nclip-path: " + css.ff  +";";
  var inlineCodeCss =
   "\n/* iOS support */\n -webkit-mask: url(clip.svg);" +
  "/*Chrome,Safari*/\n-webkit-clip-path: url(clip.svg);\n" +
                      "\n/* Firefox*/\nclip-path: url(clip.svg#svgClip);\n"
                     ;




  if(imgBgColor){
    //applyCss += "background-color:"+ imgBgColor +";";
    previewImg.css('background-color', imgBgColor);
  }
  else
    previewImg.css('background-color', 'none');

  //previewImg.attr('style',applyCss);
  //console.log(css.webkit);
  //previewImg[0].style['-webkit-clip-path'] =  css.webkit;
  if(applyMaskOn){
    var base64encoded = btoa(svgFile);
    var maskCss = 'url(data:image/svg+xml;charset=utf-8;base64,'+ base64encoded +') no-repeat';
    //codeCss += "\n\n/* iOS support inline encoded svg file*/\n-webkit-mask: " +  maskCss + ';';
    //previewImg[0].style.webkitMask =  maskCss;

    previewImg[0].style.webkitClipPath =  css.webkit;
    previewImg[0].style.clipPath =  css.ff;

    // support ios
      if(true){
       var svgFile = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' + "\n" +
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' + "\n" +
        '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="0" height="0">' + "\n" +
        '  <clipPath id="svgClip">' + "\n" +
        '    <path id="svgPath" d="'+ css.svgCommand +'"/>' + "\n" +
        '  </clipPath>' + "\n" +
        '  <path id="svgMask" d="'+ css.svgCommand +'"  />' + "\n" +
        '</svg>';

        jQuery('#file-svg-text').text(svgFile);



        jQuery('#svg-file-download-lnk').attr('href', 'data:application/octet-stream;base64,'+ base64encoded);


    }


  }
  else{
     previewImg[0].style.webkitClipPath =  'inherit';
     previewImg[0].style.clipPath =  'inherit';
     previewImg[0].style.webkitMask =  'inherit';

  }

  jQuery('#code-text').text(codeCss);
  jQuery('#file-code-text').text(inlineCodeCss);

  //console.log(css.webkit);
  //console.log(previewImg[0].style);
  //console.log(previewImg);
  //previewImg[0].style['display'] = 'none';

  //jQuery('#preview-img-wrap').attr('style',applyCss);
  updateSelectedMarkerControls();
}

function calculateCenteroid(){
  var markersCount = clipMarkers.length;
  var x = 0;
  var y = 0;
  var secondFactor;
  for(var i = 0; i < markersCount; i++){
    var marker = clipMarkers[i];
    var nextIndex = i + 1;
    if(nextIndex >= markersCount)
      nextIndex = 0;
    var nextMarker = clipMarkers[nextIndex];
    secondFactor = marker.x * nextMarker.y - nextMarker.x * marker.y;
    x += ( marker.x + nextMarker.x) * secondFactor;
    y += ( marker.y + nextMarker.y) * secondFactor;
  }

  var polygonArea = getPolygonArea();
  x = x / ( 6 * polygonArea);
  y = y / ( 6 * polygonArea);
  if(x < 0){
    x = -x;
    y = -y;
  }

  //console.log( x + ' ' + y);

  //jQuery('#centeroid').css({ left: x, top: y });
  return {x:x, y:y};
}

function getPolygonArea(){
  var markersCount = clipMarkers.length - 1;
  var result =  0;
  for(var i = 0; i < markersCount; i++)
     result += (clipMarkers[i].x * clipMarkers[i+1].y) - (clipMarkers[i+1].x * clipMarkers[i].y);
  result += (clipMarkers[markersCount].x * clipMarkers[0].y) - (clipMarkers[0].x * clipMarkers[markersCount].y);

  return result / 2;
}

function generateClipCircleCss(){
  var css = "-webkit-clip-path:circle( "+ clipCircleX +"px, "+ clipCircleY +"px,"+ clipCircleRadius +"px);";
  return css;
}

function generateClipPathCss(){
  var css = "polygon(";
  var count = clipMarkers.length;
  if(count  == 0)
    return {'webkit' : 'inherit', 'ff' : 'inherit'};

  var svgCoords = '';//'<polygon points="';
  var svgCommand = '';
  for(var i = 0; i < count; i++){
  	var marker = clipMarkers[i];
    if(i > 0){
    	css += ',';
      svgCoords += ',';
    }
    if(i == 0 )
      svgCommand += 'M';
    else if(i == 1)
    svgCommand += 'L';

    css+= Math.round(marker.x) + 'px ' + Math.round(marker.y) + 'px' ;
    svgCoords += Math.round(marker.x) + ' ' + Math.round(marker.y);
    svgCommand += Math.round(marker.x) + ',' + Math.round(marker.y) + ' ';
  }
  css += ')';

  svgCommand += 'z';


  //svgCoords += '"></polygon>';
  //jQuery('#clipPolygon').empty();
  //jQuery('#clipPolygon').append(svgCoords);

  jQuery('#clipPoints').attr('points', svgCoords);

  jQuery('#svg-text').text('<svg width="0" height="0">'+ "\n" +
    '  <clipPath id="clipPolygon">' +  "\n" +
    '    <polygon points="'+ svgCoords +'">' + "\n" +
    '    </polygon>' + "\n" +
    '  </clipPath>' + "\n" +
  '</svg>');

  //var finalCss = '-webkit-clip-path:' + css;// + ' -moz-clip-path:' + css + ' clip-path:' + css;
  //finalCss += 'clip-path: url("#clipPolygon");';
  //return finalCss;
  return {'webkit': css, 'ff': 'url("#clipPolygon")', 'svgCommand' : svgCommand };
}

function initColorPicker(){

  //jQuery('#use-bg-color-chk').change(function(e){
    jQuery('#use-bg-color-btn').click(function(){
    //if( jQuery(this).is(':checked') ){
    if( !imgBgColor ){
       jQuery(this).removeClass('active');
       imgBgColor = jQuery('#color-p').val();
       jQuery('#preview-img').attr('width', jQuery('#preview-img').width() );
       jQuery('#preview-img').attr('height', jQuery('#preview-img').height() );
       jQuery('#preview-img').addClass('bg-color-mode');

    }
    else{
      jQuery('#preview-img').removeClass('bg-color-mode');
      imgBgColor = null;
      jQuery('#preview-img').removeAttr('width');
      jQuery('#preview-img').removeAttr('height');
      jQuery(this).addClass('active');
    }

    handleMarkers();
    return false;
  });

  jQuery("#color-p").spectrum({
    color: "#ECC",
    showInput: true,
    className: "full-spectrum",
    showInitial: true,
    showPalette: true,
    showSelectionPalette: true,
    maxPaletteSize: 10,
    preferredFormat: "hex",
    localStorageKey: "spectrum.demo",
    move: function (color) {

    },
    show: function () {

    },
    beforeShow: function () {

    },
    hide: function () {

    },
    change: function() {

        //if( jQuery('#use-bg-color-chk').is(':checked') )
        if(imgBgColor){
          imgBgColor = jQuery('#color-p').val();
          handleMarkers();
        }
    },
    palette: [
        ["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)",
        "rgb(204, 204, 204)", "rgb(217, 217, 217)","rgb(255, 255, 255)"],
        ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
        "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"],
        ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)",
        "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)",
        "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)",
        "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)",
        "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)",
        "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
        "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
        "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
        "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)",
        "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
    ]
});
}

// math functions
function sqr(x) {
	return x * x ;
}
function dist2(v, w) {
	return sqr(v.x - w.x) + sqr(v.y - w.y);
}
function distToSegmentSquared(p, v, w) {
  var l2 = dist2(v, w);
  if (l2 == 0)
  	return dist2(p, v);

  var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;

  if (t < 0)
  	return dist2(p, v);
  if (t > 1)
  	return dist2(p, w);

  return dist2(p, { x: v.x + t * (w.x - v.x),
                    y: v.y + t * (w.y - v.y) }
               );
}

function distToSegment(p, v, w) {
	return Math.sqrt(distToSegmentSquared(p, v, w));
}

function getVectorLength(vector){
  var vectorLength = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  return vectorLength;
}

function normalizePointsToVector(point1, point2){
  return normalizeVector( { x: point2.x - point1.x, y: point2.y - point1.y } );
}

function normalizeVector(vector){
  var vectorLength = getVectorLength(vector);
  var newVector = {};
  if(vectorLength != 0){
    newVector.x = vector.x /  vectorLength;
    newVector.y = vector.y /  vectorLength;
  }

  return newVector;

}

function vectorsAngle(v1, v2){
  var perDot = v1.x * v2.x + v1.y * v2.y;
  var dot = getVectorLength(v1) * getVectorLength(v2);
  var cosA = perDot / dot;

  var angle =  - 180/Math.PI * Math.atan2( v1.x*v2.y-v1.y*v2.x , v1.x*v2.x+v1.y*v2.y );
  return angle;

  // optimize ???
  /*var signed_angle = (Math.atan2(v1.y,v1.x) - Math.atan2(v2.y,v2.x) ) * 180 / Math.PI;
  console.log( 's ' + signed_angle + ' ' + angle);
  return signed_angle;
  */

}

function heading2D(v) {
  return -Math.atan2( {x: v.x, y: -v.y} );
}

function rotateVectorByAngle(v, theta) {
  theta *= Math.PI / 180;
  var xTemp = v.x;
  var x = v.x* Math.cos(theta) - v.y* Math.sin(theta);
  var y = xTemp* Math.sin(theta) + v.y* Math.cos(theta);

  return {x:x, y:y};
}

function linesIntersect( p1, p2, p3, p4) {
// Store the values for fast access and easy
// equations-to-code conversion
var x1 = p1.x, x2 = p2.x, x3 = p3.x, x4 = p4.x;
var y1 = p1.y, y2 = p2.y, y3 = p3.y, y4 = p4.y;

var d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
// If d is zero, there is no intersection
if (d == 0) return null;

// Get the x and y
var pre = (x1*y2 - y1*x2), post = (x3*y4 - y3*x4);
var x = ( pre * (x3 - x4) - (x1 - x2) * post ) / d;
var y = ( pre * (y3 - y4) - (y1 - y2) * post ) / d;

// Check if the x and y coordinates are within both lines
if ( x < Math.min(x1, x2) || x > Math.max(x1, x2) ||
x < Math.min(x3, x4) || x > Math.max(x3, x4) ) return null;
if ( y < Math.min(y1, y2) || y > Math.max(y1, y2) ||
y < Math.min(y3, y4) || y > Math.max(y3, y4) ) return null;

// Return the point of intersection
    return  {x:x, y:y};
}
