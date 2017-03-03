/**
 * Reads the start of file tables at the given start byte
 * and puts it in the global settings variable
 * @method readQuantTable
 * @param  {[type]}       start Start byte in the file
 */
function readSOF0(start) {
  function loadCallback(data, hexArray) {
    var identifier = hexArray[0] + hexArray[1];
    if ( identifier != 'FFC0' ) {
      console.log("Can't read SOF0");
      return;
    }
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

function zigzagArray(array) {
  var arrayMap = [[0, 0],[1, 0],[0, 1],[0, 2],[1, 1],[2, 0],[3, 0],[2, 1],[1, 2],[0, 3],[0, 4],[1, 3],[2, 2],[3, 1],[4, 0],[5, 0],[4, 1],[3, 2],[2, 3],[1, 4],[0, 5],[0, 6],[1, 5],[2, 4],[3, 3],[4, 2],[5, 1],[6, 0],[7, 0],[6, 1],[5, 2],[4, 3],[3, 4],[2, 5],[1, 6],[0, 7],[1, 7],[2, 6],[3, 5],[4, 4],[5, 3],[6, 2],[7, 1],[7, 2],[6, 3],[5, 4],[4, 5],[3, 6],[2, 7],[3, 7],[4, 6],[5, 5],[6, 4],[7, 3],[7, 4],[6, 5],[5, 6],[4, 7],[5, 7],[6, 6],[7, 5],[7, 6],[6, 7],[7, 7]];
  if ( array.length != 64 ) {
    console.log("Array needs to be 64 long to zig zag");
    return;
  }
  var array2d = [[0,0,0,0,0,0,0,0],
                 [0,0,0,0,0,0,0,0],
                 [0,0,0,0,0,0,0,0],
                 [0,0,0,0,0,0,0,0],
                 [0,0,0,0,0,0,0,0],
                 [0,0,0,0,0,0,0,0],
                 [0,0,0,0,0,0,0,0],
                 [0,0,0,0,0,0,0,0]];
  for (var i = 0; i < array.length; i++) {
    array2d[arrayMap[i][1]][arrayMap[i][0]] = array[i];
  }

  return array2d;
}

function print2DArray( array2d ) {
  for (var y = 0; y < array2d.length; y++) {
    console.log(array2d[y].join(" "));
  }
}

/**
 * Reads the huffman tables at the given start byte
 * and puts it in the global settings variable
 * @method readHuffTable
 * @param  {[type]}       start Start byte in the file
 */
function readHuffTable(start) {
  var length = 0;
  var huffData = {
    length: 0,
    tables: []
  }

  function loadCallback(data, hexArray) {
    var cursor = 0;
    console.log(cursor, length);
    while (cursor < length) {
      console.log(cursor, length);
      var huffTable = {
        number: 0,
        type: '',
        data: {}
      }
      // The data used for generating the tree
      // The tree will be used to generate the bitstrings later oncam
      var huffTreeData = {
        totalSymbols: 0,
        symbolCount: [], // Size 16
        symbolList: []
      }

      // Get HT information
      console.log(hexArray[cursor]);
      var HTNumberHex = hexArray[cursor].charAt(0);
      var HTNumber = parseInt(HTNumberHex, 16);
      var HTType = hexArray[cursor].charAt(1) == '1' ? 'AC' : 'DC';

      huffTable.number = HTNumber;
      huffTable.type = HTType;
      cursor++;

      //Get number of symbols
      var totalSymbols = 0;
      for (var i = 0; i < 16; i++) {
        var count = parseInt(hexArray[cursor], 16);
        huffTreeData.symbolCount.push(count);
        totalSymbols += count;
        cursor++;
      }
      huffTreeData.totalSymbols = totalSymbols;

      // Get symbols
      huffTreeData.symbolCount.forEach( function(symbolCount) {
        var symbols = [];
        for (var i = 0; i < symbolCount; i++) {
          var symbol = hexArray[cursor];
          symbols.push(symbol);
          cursor++;
        }
        huffTreeData.symbolList.push(symbols);
      });

      huffTable.temp = huffTreeData;
      huffData.tables.push(huffTable);
      console.log(cursor, length);

    }

    window.settings.fileData.DHT = huffData;
  }
  function headerLoadCallback(data, hexArray) {
    var identifier = hexArray[0] + hexArray[1];
    if ( identifier != 'FFC4' ) {
      console.log("Can't read DQT");
      return;
    }
    var lengthHex = hexArray[2] + hexArray[3];
    console.log(lengthHex);
    length = parseInt(lengthHex, 16) - 2;
    huffData.length = length;
    var byteAfterLength = start + 4;
    var bytesWithoutLength = byteAfterLength + length;
    readBlob(byteAfterLength, bytesWithoutLength, loadCallback);
  }
  readBlob(start, start + 4, headerLoadCallback);
}
/**
 * Reads the quantization tables at the given start byte
 * and puts it in the global settings variable
 * @method readQuantTable
 * @param  {[type]}       start Start byte in the file
 */
function readQuantTable(start) {
  var length = 0;
  var QTData = {
    length: 0,
    tables: []
  }
  function loadCallback(data, hexArray) {
    var cursor = 0;
    while ( cursor < QTData.length ) {
      var tableData = {
        precision: 0,
        number: 0,
        data: [],
        data2d: []
      }
      var QTPrecisionHex = hexArray[cursor].charAt(0);
      var QTNumberHex = hexArray[cursor].charAt(1);
      var QTPrecision = QTPrecisionHex == '0' ? 0 : 1;
      var QTNumber = parseInt(QTNumberHex, 16);
      cursor += 1;
      tableData.precision = QTPrecision;
      tableData.number = QTNumber;
      var QTBytes = 64 * (QTPrecision + 1);
      for (var i = 0; i < 64; i++) {
        var valueHex = hexArray[cursor];
        if ( QTPrecision == 1 ) {
          valueHex += hexArray[cursor+1];
        }
        var value = parseInt(valueHex, 16);
        tableData.data.push(value);
        cursor += QTPrecision + 1;
      }

      tableData.data2d = zigzagArray(tableData.data);

      QTData.tables.push(tableData);
    }

    window.settings.fileData.QT = QTData;
    console.log(window.settings.fileData.QT);
  }
  function headerLoadCallback(data, hexArray) {
    var identifier = hexArray[0] + hexArray[1];
    if ( identifier != 'FFDB' ) {
      console.log("Can't read DQT");
      return;
    }
    var lengthHex = hexArray[2] + hexArray[3];
    console.log(lengthHex);
    length = parseInt(lengthHex, 16) - 2; // 2 is the size of the length variable itself
    QTData.length = length;
    var byteAfterLength = start + 4;
    var bytesWithoutLength = byteAfterLength + length;
    readBlob(byteAfterLength, bytesWithoutLength, loadCallback);
  }
  readBlob(start, start + 4, headerLoadCallback);
}

/**
 * Search for the JPEG markers
 * @method searchForMarkers
 * @param  {Function}       callback Callback after markers are found
 * @return {[type]}                  [description]
 */
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
