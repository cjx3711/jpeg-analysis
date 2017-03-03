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
    while (cursor < length) {
      var huffTable = {
        number: 0,
        type: '',
        map: {}, // Actual map data
        tree: {} // Used for processing and tree storing
      }
      // The data used for generating the tree
      // The tree will be used to generate the bitstrings later oncam
      var huffTreeData = {
        totalSymbols: 0,
        symbolCount: [], // Should be size 16
        symbolList: []
      }

      // Get HT information
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

      huffTable.tree = huffTreeData;
      huffData.tables.push(huffTable);
    }

    window.settings.fileData.DHT = huffData;

    generateHuffTree();
  }
  function headerLoadCallback(data, hexArray) {
    var identifier = hexArray[0] + hexArray[1];
    if ( identifier != 'FFC4' ) {
      console.log("Can't read DQT");
      return;
    }
    var lengthHex = hexArray[2] + hexArray[3];
    length = parseInt(lengthHex, 16) - 2;
    huffData.length = length;
    var byteAfterLength = start + 4;
    var bytesWithoutLength = byteAfterLength + length;
    readBlob(byteAfterLength, bytesWithoutLength, loadCallback);
  }
  readBlob(start, start + 4, headerLoadCallback);

  function newNode(node, side) {
    node[side] = {
      0: null,
      1: null,
      level: node.level + 1
    };
    return node[side];
  }
  function generateHuffTree() {
    huffData.tables.forEach( function(table) {
      var layerList = [];
      var nextLayerList = [];
      var rootNode = {
        0: null,
        1: null,
        level: 0
      };

      layerList.push(rootNode);
      var symbolsProcessed = 0;
      for (var i = 0; i < table.tree.symbolList.length; i++) {
        var symList = table.tree.symbolList[i];
        // Fill up the symbol nodes
        var N = 0;
        for (var j = 0; j < symList.length; j++) {
          var symbol = symList[j];
          N = Math.floor(j/2);
          layerList[N][j%2] = symbol;
          symbolsProcessed++;
        }
        if ( symbolsProcessed >= table.tree.totalSymbols ) {
          break;
        }
        // Fill in the rest with another node
        for (var n = N; n < layerList.length; n++) {
          if ( layerList[n][0] == null ) {
            nextLayerList.push(newNode(layerList[n], 0));
          }
          if ( layerList[n][1] == null ) {
            nextLayerList.push(newNode(layerList[n], 1));
          }
        }
        // Reset the layer list
        layerList = nextLayerList;
        nextLayerList = [];
      }

      // Delete temp data by replacing with tree
      table.tree = rootNode;
    });

    generateHuffTable();
  }

  function generateHuffTable() {
    function traverse(node, bitString, map) {
      for (var i = 0; i < 2; i++) {
        if ( node[i] != null ) {
          if ( node[i].hasOwnProperty('level') ) {
            traverse(node[i], bitString + i, map);
          } else { // Node is leaf
            map[bitString] = node[i];
          }
        }
      }
    }
    huffData.tables.forEach( function(table) {
      var rootNode = table.tree;
      var map = {};
      traverse(rootNode, '', map);
      table.map = map;
      delete table.tree; // Remove all workings
    });
  }
}
