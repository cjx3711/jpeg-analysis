function readSOF0(start) {
  function loadCallback(data, hexArray) {
    var identifier = hexArray[0] + hexArray[1];
    var lengthHex = hexArray[2] + hexArray[3];
    var precisionHex = hexArray[4];
    var heightHex = hexArray[5] + hexArray[6];
    var widthHex = hexArray[7] + hexArray[8];
    var componentHex = hexArray[9];

    var length = parseInt(lengthHex, 16);
    var precision = parseInt(precisionHex, 16);
    var height = parseInt(heightHex, 16);
    var width = parseInt(widthHex, 16);
    var component = parseInt(componentHex, 16);

    // console.log("Start of Frame 0");
    // console.log("identifier", identifier);
    // console.log("length", length);
    // console.log("precision", precision);
    // console.log("height", height);
    // console.log("width", width);
    // console.log("component", component);

    var SOF0Data = {
      length: length,
      precision: precision,
      height: height,
      width: width,
      component: []
    }

    var componentMap = [ '', 'Y', 'Cb', 'Cr', 'I', 'Q' ];
    for (var i = 0; i < component; i++) {
      var componentIdHex = hexArray[10 + i*3 + 0];
      var samplingFactorsHex = hexArray[10 + i*3 + 1];
      var quantizationTableNumberHex = hexArray[10 + i*3 + 2];
      var componentId = parseInt(componentIdHex, 16);
      var samplingFactorsVert = parseInt(samplingFactorsHex.charAt(0), 16);
      var samplingFactorsHorz = parseInt(samplingFactorsHex.charAt(1), 16);
      var componentType = componentMap[componentId];
      var quantizationTableNumber = parseInt(quantizationTableNumberHex, 16);

      // console.log("component", i+1);
      // console.log("componentType", componentType);
      // console.log("samplingFactorsVert", samplingFactorsVert);
      // console.log("samplingFactorsHorz", samplingFactorsHorz);
      // console.log("quantizationTableNumber", quantizationTableNumber);

      var componentData = {
        type: componentType,
        samplingFactorsHorz: samplingFactorsHorz,
        samplingFactorsVert: samplingFactorsVert,
        quantizationTableID: quantizationTableNumber
      }
      SOF0Data.component.push( componentData );
    }

    window.settings.fileData.SOF0 = SOF0Data;
  }

  readBlob(start, start + 19, loadCallback);
}
function searchForMarkers(callback) {
  // Load n bytes at a time
  var file = window.settings.currentFile;
  if (file == null) {
    return;
    console.log("No current file la.");
  }
  var cursor = 0;
  var bytesToLoad = 5 * 1024;
  var maxBytes = 1024 * 1024;

  function loadCallback(data, hexArray) {
    for (var i = 0; i < hexArray.length - 1; i++) {
      var potentialMarker = hexArray[i] + hexArray[i+1];
      switch( potentialMarker ) {
        case "FFD8":
          window.settings.fileData.markers.SOI.push(cursor + i);
          // console.log("SOI Marker found at: " + (cursor + i));
        break;
        case "FFE0":
          window.settings.fileData.markers.APP0.push(cursor + i);
          // console.log("APP0 Marker found at: " + (cursor + i));
        break;
        case "FFDB":
          window.settings.fileData.markers.DQT.push(cursor + i);
          // console.log("DQT Marker found at: " + (cursor + i));
        break;
        case "FFC0":
          window.settings.fileData.markers.SOF0.push(cursor + i);
          // console.log("SOF0 Marker found at: " + (cursor + i));
        break;
        case "FFC4":
          window.settings.fileData.markers.DHT.push(cursor + i);
          // console.log("DHT Marker found at: " + (cursor + i));
        break;
        case "FFDA":
          window.settings.fileData.markers.SOS.push(cursor + i);
          // console.log("SOS Marker found at: " + (cursor + i));
        break;
        case "FFD9":
          window.settings.fileData.markers.EOI.push(cursor + i);
          // console.log("EOI Marker found at: " + (cursor + i));
        break;
      }
    }
    // Search through bytes for marker
    cursor += bytesToLoad;
    if ( cursor < file.size && cursor < maxBytes) {
      readBlob(cursor, cursor + bytesToLoad + 1, loadCallback);
    } else {
      if ( typeof callback == 'function' ) {
        callback();
      }
    }
  }

  readBlob(cursor, cursor + bytesToLoad + 1, loadCallback);
}
