/*******************************************************************************
 * DOCX SPLITTER LICENCE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2018 Claude Fauconnet claude.fauconnet@gmail.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to w
 * hom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/

/**
 *
 * contains methods to parse and extract conforming to openXml standard (Microsoft docx documents)
 * @module docxExtactor
 *
 *
 */


var fs = require('fs');
var path = require('path');
var dom = require('xmldom').DOMParser
var docxParagraphAggregator = require("./docxParagraphAggregator..js")

// utilitary functions


/**
 *
 *
 * @param run
 * @returns {string}
 */
var extractRunText = function (run) {
    var runStr = "";
    var textStr = ""
    var texts = run.getElementsByTagName("w:t")
    // remove annotations
    if (run.parentNode.parentNode.parentNode.tagName == "v:textbox")
        return "";
    // remove annotations
    var shapes = run.getElementsByTagName("v:shape");
    if (shapes && shapes.length > 0)// annotations d'images voir 118 7944
        return "";


    for (var k = 0; k < texts.length; k++) {
        var textStr = ""
        for (var l = 0; l < texts[k].childNodes.length; l++) {
            var textChild = texts[k].childNodes[l]
            if (textChild.data && textChild.data != "")
                textStr += textChild.data;
        }
        runStr += textStr.replace(/\n/g, "");
    }
    var objects = run.getElementsByTagName("w:object");
    if (objects && objects.length > 0) {
        runStr += " [[" + objects.length + " OLE objects(formulae...)]] ";
    }

    return runStr;
};


// provisoire
var extractMathFormula = function (mathRun) {
    var runStr = "";
    var texts = mathRun.getElementsByTagName("m:t")

    for (var k = 0; k < texts.length; k++) {
        var textStr = ""
        for (var l = 0; l < texts[k].childNodes.length; l++) {
            var textChild = texts[k].childNodes[l]
            if (textChild.data && textChild.data != "")
                textStr += textChild.data;
        }
        runStr += textStr.replace(/\n/g, "");


    }
    return runStr;
}

var extractImage = function (imageRun, docRels) {
    if (!docRels)
        return "";
    var urlPrefix = "./"
    var imgName = "";
    var images = imageRun.getElementsByTagName("a:blip")

    for (var k = 0; k < images.length; k++) {
        var id = images[k].getAttribute("r:embed");
        //  console.log(id)
        if (docRels[id])
            imgName = docRels[id].target
        // conversion .png
        var p = imgName.indexOf(".")
        if (p > -1) {
            imgName = imgName.substring(0, p) + ".png"
        }


    }
    return imgName;


}

extractMathFromula = function (paragraph) {
    var mathElts = paragraph.getElementsByTagName("m:oMath");
    var str = "";
    for (var i = 0; i < mathElts.length; i++) {
        var mathTextElts = paragraph.getElementsByTagName("m:t");
        for (var k = 0; k < mathTextElts.length; k++) {

            if (mathTextElts[k].parentNode.parentNode.tagName == "m:den")
                str += "/";
            if (mathTextElts[k].childNodes[0].data && mathTextElts[k].childNodes[0].data != "")
                str += mathTextElts[k].childNodes[0].data;

        }

    }
    return str;

}


var extractPagesNumbers = function () {
//<w:br w:type="page"/>
}


var getAllElementsByTagNameDepth = function (element, tagName) {
    function recurse(element, tagName, result) {
        if (!element.getElementsByTagName)
            return result;
        result = result || [];
        var elements = element.getElementsByTagName(tagName);
        for (var i = 0; i < elements.length; i++) {
            result.push(elements[i])
        }
        if (elements.length > 0)
            ;//  return result;
        for (var i = 0; i < element.childNodes.length; i++) {
            recurse(element.childNodes[i], tagName, result)
        }
        return result;
    }

    return recurse(element, tagName, [])
}

var getPstyles = function () {
    var styles = body.getElementsByTagName("w:pStyle");
    for (var j = 0; j < styles.length; j++) {
        var attrs = styles[j].attributes;
        for (var k = 0; k < attrs.length; k++) {
            var value = attrs[k].value
            if (docxExtactor.stylesArray.indexOf(value) < 0)
                docxExtactor.stylesArray.push(value)
        }
    }
    console.log(docxExtactor.stylesArray);
}

var getDocPstylesOffsets = function (body) {
    var stylesArray = [];
    if (body) {
        var pPrs = body.getElementsByTagName("w:pPr");
        for (var i = 0; i < pPrs.length; i++) {
            var styleObj = {offset: pPrs[i].columnNumber};

            var styles = pPrs[i].getElementsByTagName("w:pStyle");
            for (var j = 0; j < styles.length; j++) {
                var styleValue = styles[j].getAttribute("w:val");
                var htmlStyle = docxExtactor.pStyles[styleValue];
                if (!htmlStyle) {
                    console.log("!!!style not  in pStylesMap " + styleValue);
                    // htmlStyle=styleValue
                }
                else {
                    styleObj.style = htmlStyle;
                    stylesArray.push(styleObj);
                }
            }
        }
    }
    return stylesArray;

}
/**
 *
 *
 * @class
 * @memberof module:docxExtactor
 *
 *
 */
var docxExtactor = {

    pStyles: {
        RfrentielTexte1avecpuces: "ul",
        Paragraphedeliste: "h5",// on ne considère pas comme des bullets
        Listepuces2: "ul2",
        RfrentielTexte2: "ul2",
        //  Listepuces2: "ul",
        Titre1: "h1",
        Titre2: "h2",
        Titre3: "h3",
        Titre4: "h4",
        TM1: "p",
        TM2: "p",
        Corpsdetexte: "?",
        TM3: "p",
        RfrentielTexte3: "?",
        TitreAnnexe: "h1",
        Listepuces: "ul",
        Default: "?",
        Pieddepage: "?",
        Lgende: "?",
        // En-tte:"?",
        Rfrentieltexte2puce: "ul",
        referentielTexte3: "?",
        TitreAppendix: "h1",
        Retraitcorpsdetexte: "?",
        Titre5: "h5",
        Citationintense: "?",
        num: "?",
        sommaire: "?",
        TM5: "?",
        Tabledesillu: "?",
        TableText: "?",
        Titre8: "h8",
        Listenumros: "?",
        Titre7: "h7",
        Liste: "ul",
        Liste2: "ul",
        Listepuces3: "ul",
        Titre6: "h6",
        "En-tte": "?",
        'Tabledesillustrations': "?"


    },


    stylesArray: [],



    /**
     *
     * parse xml document  extracted from docx file (openxml format) and  split it into an  ordered collection  of elementary paragraphs
     * Elamentary paragraphs contains related arrays and images
     *
     * @method
     * @param {object} dom  of the xml document
     * @param {object} docRels map of images refecences in _rels.xml (@see getRelsMap)
     * @returns {Array} all extracted paragraphs and nested object tables containing all extacted tables
     *
     */
    extractContentJson: function (doc, docRels) {
        /**
         *
         * @param jsonParagraphs
         * @param jsonTables
         * @returns {*}
         */
        function setParagraphTablesContent(jsonParagraphs, jsonTables) {
            jsonTables.forEach(function (table, indexTable) {
                var offset = table.startOffset;
                var found = false
                jsonParagraphs.forEach(function (paragraph, index) {
                    if (!jsonParagraphs[index].tables)
                        jsonParagraphs[index].tables = [];

                    if (offset > paragraph.startOffset && offset < paragraph.endOffset) {
                        jsonParagraphs[index].tables.push(table);
                        found = true;
                    }
                })
                if (found == false) {
                    if (!jsonParagraphs.globalTables)
                        jsonParagraphs.globalTables = [];
                    jsonParagraphs.globalTables.push("table-#" + indexTable)
                }
            })
            return jsonParagraphs;
        }

        //***************************  gestion des styles******************************

        /**
         *
         * styles management
         *
         * @param json
         * @returns {Array}
         */
        function setStyles(json) {
            var json2 = [];
            json.forEach(function (paragraph, index) {
                var paragraphStyle = null;//get paragraph Style by offsets
                stylesArray.some(function (style) {
                    if (paragraph.startOffset < style.offset && paragraph.endOffset > style.offset) {
                        paragraphStyle = style.style;
                        paragraph.style = style.style;
                        return true;
                    }
                    return false;
                })
                if (paragraph.text == "" && paragraph.title == "" && !paragraph.tableIndices)
                    return;
                if (paragraphStyle) {

                    if (docxParagraphAggregator.isParagraphChapter(paragraph)) {
                        paragraph.title = paragraph.title//"<" + paragraphStyle + ">" + paragraph.title + "</" + paragraphStyle + ">"
                    }
                }
                json2.push(paragraph)

            })
            return json2;
        }

        /**
         *
         * @param obj object to set image to
         * @param run run containing or not images
         */
        function setImages(obj, run) {
            var images = run.getElementsByTagName("pic:pic");
            var imageSrcs = []
            for (var k = 0; k < images.length; k++) {
                // runStr += "{{\"image\":\"" + extractImage(images[k], docRels) + "\"}}"
                if (!obj.images)
                    obj.images = [];
                obj.images.push(extractImage(images[k], docRels))
            }
        }

        /**
         *
         * extract tables from json  cell elements and affect them to a paragraph index before putting them into an array placed in the tables property of the json
         * @param {object} json  json of dom
         * @param {array} docTableCells  all cell dom objects previsously extracted from json dom
         * @returns {array} json enriched with tables [] property
         */
        function setTables(json, docTableCells) {
            var currentRow = null;
            var currentTable = null;
            var currentTableElt = null;
            var currentRowElt = null;
            var tables = {};
            var i = 0;
            docTableCells.forEach(function (cellElt) {
                var rowElt = cellElt.parentNode.parentNode;
                var tableElt = cellElt.parentNode.parentNode.parentNode;
                if (currentTableElt != tableElt) {
                    currentTableElt = tableElt;
                    if (cellElt.paragraphIndex < 0)
                        cellElt.paragraphIndex = cellElt.paragraphIndex - (i++);
                    currentTable = {index: cellElt.paragraphIndex, rows: []}
                    currentRow = null;
                    tables[currentTable.index] = currentTable
                }
                if (currentRowElt != rowElt) {
                    currentRowElt = rowElt;
                    currentRow = [];
                    currentTable.rows.push(currentRow)
                }
                //setImages  a faire!!!!!!!!!!!!!!!
                var text = extractRunText(cellElt)

                var obj = {text: text}
                setImages(obj, cellElt)
                currentRow.push(obj);


            })
            var docTables = []
            for (var key in tables) {

                var index = parseInt(key);
                var table = {paragraphIndex: index, rows: tables[index].rows}
                docTables.push(table);
                if (json[index]) {
                    if (!json[index].tables)
                        json[index].tables = [];
                    json[index].tables.push(table);

                }
                else {
                    console.log(key);
                }
            }
            json.tables = docTables;
            return json;


        }





        /**
         * NOT FINISHED
         * //https://blogs.msdn.microsoft.com/brian_jones/2006/12/11/whats-up-with-all-those-rsids/
         *  //https://docs.microsoft.com/en-us/office/open-xml/how-to-accept-all-revisions-in-a-word-processing-document
         *
         *
         * @param {Array} allparagraphs
         * @returns {Array} last version paragraphs
         */
        function extractCurrentVersion(paragraphs) {
            var docVersions = {};
            var currentVersionNumber // the most frequent
            paragraphs.forEach(function (paragraph) {

                if (!docVersions[paragraph.version]) {//version id frequency
                    docVersions[paragraph.version] = 0;
                }
                docVersions[paragraph.version] += 1;
            })

            var maxFrequency = 0
            for (var key in docVersions) {
                maxFrequency = Math.max(maxFrequency, docVersions[key])
            }
            for (var key in docVersions) {
                if (docVersions[key] == maxFrequency)
                    currentVersionNumber = key;
            }
            console.log(JSON.stringify(docVersions, null, 2))
            var currentVersionParagraphs = [];
            paragraphs.forEach(function (paragraph) {
                if (!paragraph.version || paragraph.version == currentVersionNumber) {//version id frequency
                    currentVersionParagraphs.push(paragraph)
                }
            })
            return currentVersionParagraphs;
        }




        var json = [];
        var bodyStr = "";
        var currentTocId = "";
        var jsonTables = [];
        var docTableCells = [];
        var body = doc.documentElement.getElementsByTagName("w:body")[0]


        var stylesArray = getDocPstylesOffsets(body);
        var previousTextIndex = -1;
        //extraction des tables
        var tables = body.getElementsByTagName("w:tbl");
        for (var j = 0; j < tables.length; j++) {
            var jsonTable = docxExtactor.extractTable(tables[j])
            jsonTable.startOffset = tables[j].columnNumber;
            jsonTables.push(jsonTable)
        }

        //extraction des paragraphes
        var paragraphs = body.getElementsByTagName("w:p")
        var runStr;

        for (var i = 0; i < paragraphs.length; i++) {
            var paragraph = paragraphs[i];

            //cellule de tableau
            if (paragraph.parentNode.tagName == "w:tc") {
                paragraph.paragraphIndex = previousTextIndex
                docTableCells.push(paragraph);
                continue;
            }

            if (paragraph.parentNode.parentNode.tagName == "v:textbox") {// annotations
                var x = i;
                continue;
            }
            var pVersionId = paragraph.getAttribute("w:rsidRPr");
            var obj = {status: "normal", title: "", text: "", paragraphIndex: i, images: [], version: pVersionId};


            obj.startOffset = paragraph.columnNumber
            if (i < paragraphs.length - 1)
                obj.endOffset = paragraphs[i + 1].columnNumber - 1
            else
                obj.sendOffset = 999999999;

            var runs = paragraph.getElementsByTagName("w:r");

            var styleElts = paragraph.getElementsByTagName("w:pStyle");
            var style = null;
            if (styleElts && styleElts.length > 0)
                var style = styleElts[0].getAttribute("w:val");
            style = docxExtactor.pStyles[style];
            obj.style = style;
            var runStr = ""
            for (var j = 0; j < runs.length; j++) {
                var rVersionId = runs[j].getAttribute("w:rsidRPr");
                if (true || !pVersionId || !rVersionId || rVersionId == pVersionId)
                    runStr += extractRunText(runs[j])
                else
                    var old = extractRunText(runs[j])

            }
            obj.text = runStr;
            obj.text += extractMathFromula(paragraph);


            //si pas de run et pas de formule c'est un saut de ligne qui délimite un paragraphe
            if (paragraph.getElementsByTagName("w:r").length == 0 && paragraph.getElementsByTagName("m:oMath").length == 0) {
                json.push({paragraphIndex: i, isLineBreak: true, parentTocId: currentTocId, version: pVersionId})
                continue;
            }

            setImages(obj, paragraph);


            json.push(obj);
            previousTextIndex = json.length - 1


        }


        var currentVersionJson = json;// extractCurrentVersion(json);
        json = setTables(currentVersionJson, docTableCells);

        //   console.log(JSON.stringify(json,null,2))
        //   json = setParagraphTablesContent(json, jsonTables);
        //  json.tables = jsonTables
        currentVersionJson = docxParagraphAggregator.groupParagraphs(currentVersionJson);
        //   console.log(JSON.stringify(json,null,2))
        //   docxExtactor.setParagraphsParents(toc, json);

        return currentVersionJson;
    },

    /**
     *  extract tables corresponding to headers of the docx stored  in xml (_header.xml)
     * @method
     * @param filePath of the _header.xml file
     * @returns {Array} tbl tags in the xml file
     */
    extractHeaderJson: function (filePath) {
        var headerTables = []
        if (!fs.existsSync(filePath))
            return headerTables;
        var xmlStr = "" + fs.readFileSync(filePath);
        var doc = new dom().parseFromString(xmlStr);
        var headerTablesElts = doc.documentElement.getElementsByTagName("w:tbl");
        if (headerTablesElts) {
            for (var j = 0; j < headerTablesElts.length; j++) {
                headerTables.push(docxExtactor.extractTable(headerTablesElts[j]))
            }
        }
        return headerTables
    },


    /**
     * @method
     *
     * extract  types from _header.xml
     * @param filePath
     * @param types
     * @returns {{}}
     */
    getRelsMap: function (filePath, types) {

        var docRels = {};//id and relative url

        var xmlStr = "" + fs.readFileSync(filePath);
        var doc = new dom().parseFromString(xmlStr);
        var relations = doc.documentElement.getElementsByTagName("Relationship");
        for (var i = 0; i < relations.length; i++) {
            var obj = {
                id: relations[i].getAttribute("Id"),
                target: relations[i].getAttribute("Target"),
                type: relations[i].getAttribute("Type")
            }
            obj.type = obj.type.substring(obj.type.lastIndexOf("/") + 1)
            if (!types || types.indexOf(type))
                docRels[obj.id] = obj;
        }
        return docRels;


    }
    ,










    /**
     *
     * @method
     * @param dir
     *
     */
    deleteNonPngImages: function (dir) {

        dir = path.resolve(dir)
        var docxFiles = fs.readdirSync(dir)
        docxFiles.forEach(function (docPath) {
            var docMediaPath = path.resolve(dir + "/" + docPath);
            var imageFiles = fs.readdirSync(docMediaPath)
            imageFiles.forEach(function (imageFile) {
                if (imageFile.indexOf(".png") < 0) {
                    try {
                        var imagePath = path.resolve(docMediaPath + "/" + imageFile)
                        fs.unlinkSync(imagePath)

                    } catch (e) {
                        console.log(e);
                    }
                }
            })
        })
    },


    /**
     *
     * extrait uniquement les tableaux à l'interieur des paragraphes
     * @param xml
     * @returns {Array}
     *
     */
    getTablesinParagraphs: function (xml) {
        var paragraphJsonTables = [];
        var contentJson = docxExtactor.extractContentJson(xml);
        contentJson.tables.forEach(function (table) {
            if (true || table.tocId)
                paragraphJsonTables.push(table);
        })
        return paragraphJsonTables;
    },


    /**
     *
     * @param tblElt
     * @returns {{rows: Array}}
     */

    extractTable: function (tblElt) {


        var table = {rows: []};


        var columns = tblElt.getElementsByTagName("w:tr");
        for (var k = 0; k < columns.length; k++) {
            var row = [];
            table.rows.push(row)
            var cells = columns[k].getElementsByTagName("w:tc");

            for (var y = 0; y < cells.length; y++) {
                var cell = extractRunText(cells[y]);
                row.push(cell);

            }


        }
        return table;
        // console.log(JSON.stringify(json,null,2))
    },


}

module.exports = docxExtactor;

/*
if (false) {

    // docxExtactor.convertAllImagesToPng("D:\\Total\\docs\\GS MEC Word\\documents\\");
    docxExtactor.deleteNonPngImages("D:\\Total\\docs\\GS MEC Word\\documents\\media\\");

}


if (false) {
    docxExtactor.extractXmlFilesFromDocXDir("D:\\Total\\docs\\GM MEC Word");

}
if (false) {
    docxExtactor.extractXmlFilesFromDocXDir("D:\\ATD_Baillet\\applicationTemporaire\\fichiersVersement");

}



if (false) {
    var filePath = "D:\\Total\\NLP\\document.xml";
    var data = "" + fs.readFileSync(filePath);
    var cleanXml = data;// data.replace(/>/gm, ">\n");

    var contentJson = docxExtactor.extractContentJson(cleanXml);
    //console.log(JSON.stringify(contentJson, null, 2))
    //  console.log("******************************************************************");

    var toc = docxExtactor.extractTOC(cleanXml);
    //  console.log(JSON.stringify(toc, null, 2))
    //  console.log("******************************************************************");

    var linkedContentJson = docxExtactor.linkContentJsonToToc(toc, contentJson);
    //  console.log(JSON.stringify(linkedContentJson, null, 2))

    var toc = docxExtactor.extractTOC(cleanXml, true);
    var csv = docxExtactor.contentToCsv(contentJson, toc);
    console.log(csv);
    // var tablesJson = extractTables(cleanXml)
}
*/