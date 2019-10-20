/* Copyright 2017 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Canvas = require('canvas');
var assert = require('assert');
var fs = require('fs');
var async = require('async');
var pdfjsLib = require('pdfjs-dist');


var allFiles = [];





var pdfToEntities = {

    extractPdfData: function (dirPath, topKeywordsArray, callback) {
        var pdfsPaths = [];
        allFiles = [];
        async.series([

                //list pdfs to process
                function (callbackSeries) {
                    //   pdfsPaths.push('./Barge.pdf');
                    var files = fs.readdirSync(dirPath);
                    files.forEach(function (file) {
                        if (true || file.indexOf("Electrical") == 0)
                            pdfsPaths.push(dirPath + file)
                    })


                    return callbackSeries();
                }
                ,

                //process eachPDF
                function (callbackSeries) {


                    async.eachSeries(pdfsPaths, function (pdfPath, callbackEachPdf) {
                        // Read the PDF file into a typed array so PDF.js can load it.
                        var docData = [];
                        var rawData = new Uint8Array(fs.readFileSync(pdfPath));
                        // Load the PDF file.
                        var loadingTask = pdfjsLib.getDocument(rawData);
                        loadingTask.promise.then(function (pdfDocument) {

                            console.log('# PDF document loaded.' + pdfPath);
                            var totalPagesCount = pdfDocument.numPages;


                            var pageIndexes = [];
                            for (var i = 0; i < totalPagesCount; i++) {
                                pageIndexes.push(i + 1)

                            }

                            async.eachSeries(pageIndexes, function (pageIndex, callbackEachPage) {
                                    pdfDocument.getPage(pageIndex).then(function (page) {

                                        if (true) {
                                            var textContents = [];
                                            page.getTextContent({normalizeWhitespace: true}).then(function (textContent) {
                                                textContents = textContent;
                                                textContent.items.forEach(function (textItem) {
                                                    //	console.log(textItem.str);
                                                });
                                            });
                                        }


                                        // Render the page on a Node canvas with 100% scale.
                                        var viewport = page.getViewport({scale: 1.0,});
                                        var canvasFactory = new NodeCanvasFactory();
                                        var canvasAndContext =
                                            canvasFactory.create(viewport.width, viewport.height);
                                        canvasAndContext.canvas.CFinfos = [];
                                        var renderContext = {
                                            canvasContext: canvasAndContext.context,
                                            viewport: viewport,
                                            canvasFactory: canvasFactory,
                                        };

                                        var renderTask = page.render(renderContext);
                                        renderTask.promise.then(function () {

                                            docData.push({page: pageIndex, data: canvasAndContext.canvas.CFinfos, textContents: textContents})


                                            return callbackEachPage();
                                        })
                                    })
                                },//end callbackEachPage
                                function (err) {
                                    if (err)
                                        return callbackSeries(err);


                                    pdfToEntities.processData(pdfPath, docData, topKeywordsArray, function (err, result) {
                                        if (err)
                                            return callback(err)

                                        allFiles.push(result)
                                        return callbackEachPdf();
                                    });

                                })
                        })
                    }, function (err) {
                        callbackSeries(err);
                    })
                }
            ],

            function (err) {
                if (err)
                    return callback(err)
                return callback(null, allFiles)

            }
        )
    },
    //for each pdf
    processData: function (pdfPath, docData, topKeywordsArray, callback) {
        var rawPageJson = [];
        var rawDocJson2 = [];
        var fontGroups = {};
        var topFontKey = null;

        var outputJson = {pdfPath: pdfPath, entities: {}, entityNames: []};

        async.series([

                //sort by page et y
                function (callbackSeries) {
                    // return callbackSeries()
                    docData.forEach(function (page) {
                        page.data.sort(function (a, b) {
                            if (a.y < b.y)
                                return 1;
                            if (a.y > b.y)
                                return -1;
                            return 0


                        })
                    })
                    callbackSeries()

                },
                //preformat data in rawPageJson
                function (callbackSeries, pageIndex) {


                    //str cumulated with glyphs
                    docData.forEach(function (page) {
                        page.data.forEach(function (line, index) {
                            var str = "";
                            line.glyphs.forEach(function (glyph) {
                                if (glyph.unicode)
                                    str += glyph.unicode;

                            })
                            page.data[index].str = str;
                        })

                        var verticalTextIndex = null;

                        page.data.forEach(function (line, index) {

                            var xx = page.data
                            var font = (line.fontName + "" + line.fontSize + "" + line.fillColor).replace(/[\(\)\+\.,]/g, "")
                            //   console.log(line.textMatrix.toString()+"  "+line.str)
                            var y = line.textMatrix[5]
                            var x = line.textMatrix[4]
                            var length = rawPageJson.length;

                            // juxtaposition des textes contigus
                            // && (length>0 && rawPageJson[length - 1].font != font)
                            if (length == 0) {
                                rawPageJson.push({str: line.str, font: font, y: y, x: x, page: pageIndex + 1});
                            } else {
                                if (rawPageJson[length - 1].y == y && rawPageJson[length - 1].x != x)
                                    rawPageJson[length - 1].str += line.str;
                                else if (rawPageJson[length - 1].y != y && rawPageJson[length - 1].x == x && line.str.length==1 &&  rawPageJson[length - 1].length==1) {// texte vertical
                                    /*    rawPageJson[length - 1].str += line.str;
                                        rawPageJson[length - 1].textIsVertical = true;
                                        verticalTextIndex = length - 1;*/

                                    rawPageJson.error = "vertical text";
                                } else
                                    rawPageJson.push({str: line.str, font: font, y: y, x: x, page: pageIndex + 1});
                            }


                        })


                        // modeles avec titre à gauche ex incidents d'ancrage.pfd
                        /*  if (verticalTextIndex != null) {
                              var obj = rawPageJson[verticalTextIndex];
                              rawPageJson.splice(verticalTextIndex, 1)
                              rawPageJson.splice(0, 0, obj)

                          }*/
                    })


                    return callbackSeries();
                },


                //preformat data in rawDocJson with textContents
                function (callbackSeries) {
                    return callbackSeries();
                    docData.forEach(function (page, pageIndex) {

                        page.textContents.items.forEach(function (line) {

                            var y = line.transform[5];
                            var font = line.fontName + "_" + line.height
                            var obj = {str: line.str, font: font, y: y, page: pageIndex + 1}
                            rawDocJson2.push(obj);


                        })

                    })

                    return callbackSeries();
                },
                //  set fontGroups
                function (callbackSeries) {
                    rawPageJson.forEach(function (line) {
                        if (!fontGroups[line.font])
                            fontGroups[line.font] = [line.str]
                        else
                            fontGroups[line.font].push(line.str)
                    })

                    return callbackSeries();

                },
                // getTopEntityFontGroup
                function (callbackSeries) {
                    if (!Array.isArray(topKeywordsArray))
                        topKeywordsArray = topKeywordsArray.split(",")
                    var scores = {}
                    var keys = Object.keys(fontGroups);
                    keys.forEach(function (key) {
                        var concatTexts = ""
                        var keyScore = 0;
                        fontGroups[key].forEach(function (text) {
                            concatTexts += " " + text;
                        })


                        if (concatTexts.length / key.length < 30) {
                            topKeywordsArray.forEach(function (keyword) {
                                var regex = new RegExp(".*" + keyword + ".*", "ig");
                                var n = concatTexts.match(regex)
                                if (n != null)
                                    keyScore += n.length;
                                var yy = 3

                            })
                        }
                        scores[key] = keyScore

                    })
                    var maxScore = 0;
                    var maxScoreKey = null;
                    for (var key in scores) {
                        maxScore = Math.max(scores[key], maxScore)
                    }
                    for (var key in scores) {
                        if (scores[key] == maxScore)
                            maxScoreKey = key;
                    }
                    topFontKey = maxScoreKey
                    return callbackSeries();

                },

                // generate final json
                function (callbackSeries) {
                    var currentEntityName = ""

                    rawPageJson.forEach(function (line) {
                        if (rawPageJson.error)
                            outputJson.error = rawPageJson.error;

                        if (line.font == topFontKey) {
                            outputJson.entityNames.push(line.str)
                            outputJson.entities[line.str] = {name: line.str, content: []}
                            currentEntityName = line.str

                        } else {
                            if (outputJson.entities[currentEntityName])
                                outputJson.entities[currentEntityName].content.push(line.str);
                        }


                    })

                    return callbackSeries();

                },    //generateHtml
                function (callbackSeries) {
                    return callbackSeries();
                },

            ],

            function (err) {

                if (err) {
                    callback(err);
                }
                callback(null, outputJson)


            }
        )


    }


}



function NodeCanvasFactory() {
}

NodeCanvasFactory.prototype = {
    create: function NodeCanvasFactory_create(width, height) {
        assert(width > 0 && height > 0, 'Invalid canvas size');
        var canvas = Canvas.createCanvas(width, height);
        var context = canvas.getContext('2d');
        return {
            canvas: canvas,
            context: context,
        };
    },

    reset: function NodeCanvasFactory_reset(canvasAndContext, width, height) {
        assert(canvasAndContext.canvas, 'Canvas is not specified');
        assert(width > 0 && height > 0, 'Invalid canvas size');
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
    },

    destroy: function NodeCanvasFactory_destroy(canvasAndContext) {
        assert(canvasAndContext.canvas, 'Canvas is not specified');

        // Zeroing the width and height cause Firefox to release graphics
        // resources immediately, which can greatly reduce memory consumption.
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
        canvasAndContext.canvas = null;
        canvasAndContext.context = null;
    },
};





module.exports = pdfToEntities;

var dir = "D:\\GitHub\\docxSplitter\\public\\pdfjs\\assets\\"
var dir = "D:\\Total\\REX\\"

var topKeywords = "cause,incident,recommendation,recommandation,consequence,immediate,root,fondamental,introduction,description"
pdfToEntities.extractPdfData(dir, topKeywords, function (err, allFiles) {
    allFiles.forEach(function (file) {
        if (file.error)
            console.log("*****" + file.pdfPath + "\t" + file.error)
        else

            console.log("*****" + file.pdfPath + "\t" + JSON.stringify(file.entityNames, null, 2))
    })
});


