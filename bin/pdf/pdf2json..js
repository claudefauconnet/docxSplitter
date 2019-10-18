var fs = require('fs')
var path = require('path');
var PDFParser = require("pdf2json");
//const pdf = require('pdfjs')

//var pdfParse=require('pdf-parse')

var pdfjsLib = require('pdfjs-dist');

var pdf2json = {

//https://github.com/mozilla/pdf.js/blob/master/examples/node/getinfo.js
    parsePdf3: function (filePath, callback) {
        var jsonTexts = []
        var loadingTask = pdfjsLib.getDocument(filePath);
        loadingTask.promise.then(function (doc) {
            var numPages = doc.numPages;

            var lastPromise; // will be used to chain promises
            lastPromise = doc.getMetadata().then(function (data) {
                //   console.log(JSON.stringify(data.info, null, 2));
                if (data.metadata) {

                    //     console.log(JSON.stringify(data.metadata.getAll(), null, 2));

                }
            });
                doc.getPageLayout(1).then(function (page) {
                var x=page
                })

var sss=   doc.getOutline().then(function (data) {
var xx=data;
})

            var loadPage = function (pageNum) {

                return doc.getPage(pageNum).then(function (page) {



                    var readStream=page.streamTextContent() ;
                    var reader=readStream.getReader();




                    function pump() {
                        reader.read().then(function(chunk) {
                            if (!chunk.value) {
                                return;
                            }
                            var xx = chunk
                            console.log(JSON.stringify(chunk));
                         //   Object.assign(textContent.styles, value.styles);
                         //   textContent.items.push(...value.items);
                            pump();
                        });
                    }
                    pump()

                        /*   xxx.then(function (chunk) {
                                var xx = chunk
                                console.log(JSON.stringify(chunk.value));

                            })*/


                /*    reader.on('data', function (chunk) {
                        var x=chunk
                    })
                        .on('end', function () {
                            console.log("done");
                        });*/



                    var operators = page.getOperatorList().then(function(data){

                        var x=data;

                    });
                    var viewport = page.getViewport({scale: 1.0,});
                    return page.getTextContent().then(function (content) {
                        // Content contains lots of information about the text layout and
                        // styles, but we need only strings at the moment
                        var strings = content.items.map(function (item) {
                            jsonTexts.push(item)
                            return item.str;
                        });

                    }).then(function () {

                    });
                });
            };
            // Loading of the first page will wait on metadata and subsequent loadings
            // will wait on the previous pages.
            for (var i = 1; i <= numPages; i++) {
                lastPromise = lastPromise.then(loadPage.bind(null, i));
            }
            return lastPromise;
        }).then(function () {
            //  console.log('# End of Document');
            jsonTexts = pdf2json.sortTextsByY(jsonTexts)
            return callback(null, jsonTexts)
        }, function (err) {
            console.error('Error: ' + err);
            return callback(err)
        });
    },


    sortTextsByY: function (jsonTexts) {
        var orderedTexts = [];
        jsonTexts.forEach(function (item) {
            var x = item.transform[4]
            var y = item.transform[5]
            var index = orderedTexts.length;
            if (index > 0 > 0 && y == orderedTexts[index - 1].transform[5]) {
                var dx = x - orderedTexts[index - 1].transform[5]
                var space = (dx > 2) ? " " : "";
                orderedTexts[index - 1].str += item.str;

            } else {
                orderedTexts.push(item)
            }

        })

        return orderedTexts;

    },


    parsePdf: function (filePath, callback) {


        var pdfParser = new PDFParser();
        pdfParser.on("pdfParser_dataError", errData => {
            console.error(
                errData.parserError)
        });
        pdfParser.on("pdfParser_dataReady", pdfData => {
            //   console.log(1)
            var x = pdfData;
            var str0 = ""
            var pages = pdfData.formImage.Pages;
            var texts = [];
            var rects = [];
            var hlines = []
            var offset = 0;

            var rectYoffsets = {}
            var textYoffsets = {}

            pages.forEach(function (page, pageIndex) {
                /*   page.HLines.forEach(function (line,lineIndex) {
                       if (lineIndex > 0 && Math.abs(line.y+offset - hlines[lineIndex - 1].y)<5) {
                        return;

                       } else {
                           line.y += offset;
                           line.w = 50;
                           line.h = 2
                           hlines.push(line);
                       }

                   })*/
                page.Texts.forEach(function (text) {
                    if (text.R.length > 1)
                        var x = "";
                    var strTxt = decodeURIComponent(text.R[0].T)
                    var textIndex = texts.length
                    if (textIndex > 0 && text.y + offset == texts[textIndex - 1].y) {
                        var dx = text.x - texts[textIndex - 1].x
                        var space = (dx > 2) ? " " : "";
                        texts[textIndex - 1].text += strTxt

                    } else {
                        var obj = {
                            x: text.x,
                            y: text.y + offset,
                            text: strTxt,
                            page: pageIndex
                        }
                        texts.push(obj)
                        textYoffsets[obj.y] = obj;
                    }
                    //  str0 += JSON.stringify(obj) + ",\n"


                })


                page.Fills.forEach(function (line) {
                    line.y += offset;
                    rects.push(line)
                    rectYoffsets[line.y] = line;
                })
                //   str0 += "--------------------\n"
                offset += page.Height;
            })
            return callback(null, {texts: texts, rects: rects, hlines: hlines, rectYoffsets: rectYoffsets, textYoffsets: textYoffsets})
        })

        pdfParser.loadPDF(filePath);
    }
    ,


    splitByEntityList: function (pdfJson) {
        texts.sort(function (a, b) {

            var ay = (a.page * 1000) + a.y
            var by = (b.page * 1000) + b.y
            return a - b;
        })


        var keywords = [
            "Introduction",
            "Description",
            "Causes immédiates",
            "Causes fondamentales",
            "Recommendations"

        ]


        var keywords = [
            "Incident description:",
            "Consequences:",
            "Analysis:",
            "Immediate causes:",
            "Root causes:",
            "Lessons learned:",
            "Corrective actions",
            "Recommandations:"

        ]


        var output = {};
        var currentKeyword = null;
        texts.forEach(function (sentence) {

            if (keywords.indexOf(sentence.text) > -1) {
                currentKeyword = sentence.text
                output[sentence.text] = [];
            } else {
                if (currentKeyword)
                    output[currentKeyword].push(sentence)

            }


        })
    },

    extractEntitiesByUnderline: function (json) {

        var entities = {};


        json.rects.sort(function (a, b) {
            return a.y - b.y;
        })


        json.texts.sort(function (a, b) {
            return a.y - b.y;
        })


        //    var rectYoffsets=json.rectYoffsets;
        //     var textYoffsets=json.textYoffsets;
        var rect = null;
        var text = null;
        for (var j = 0; j < json.rects.length; j++) {
            rect = json.rects[j];
            if (rect.h < 0.04 && rect.w > 0.1) {//underline

                for (var i = 0; i < json.texts.length; i++) {
                    var text = json.texts[i];

                    if (text.text.indexOf("Incident") > -1)
                    //  console.log(rect.y)
                        rect = json.rects[j];
                    var yy = rect.y;
                    if (((rect.y + 0.07) >= text.y)) {//&& ((rect.y + 0.9) <= text.y)) {
                        if (!entities[text.text]) {
                            // console.log(text.text)
                            entities[text.text] = [];
                            break;
                        }

                    }
                }
            }

        }
    }

    ,


    analyzeByRegex: function (json, template) {
        // regroupement des textes par rectangle
        var regex = /^\d+\.\s*.*/g;

        var entities = {}
        var currentEntity = null;
        json.texts.forEach(function (text) {
            // console.log(text.text)
            if (regex.test(text.text)) {
                currentEntity = text.text;
                entities[currentEntity] = []
            } else {
                if (currentEntity)
                    entities[currentEntity].push(text.text)
            }

        })
        return entities;

    },


    extractEntitiesFontNameAndHeight: function (json, callback) {

        /**
         *
         *
         * @param entities
         * @param keyword
         * @returns la fonte qui a le plus de mots clés correspondantr aux entités
         */
        function indentifyEntitiesFontKey(entities) {

            var scores = {}
            var keys = Object.keys(entities);

            keys.forEach(function (key) {
                var concatTexts = ""
                var keyScore = 0;
                entities[key].forEach(function (text) {
                    concatTexts += " " + text.str;
                })
                if (concatTexts.length / key.length < 30) {
                    keyWords.forEach(function (keyword) {
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
            return maxScoreKey;
        }


        var fontGroups = {}

        json.forEach(function (text) {
            var key = text.height + " " + text.fontName;
            if (!fontGroups[key]) {
                fontGroups[key] = [text]
            } else {
                fontGroups[key].push(text)
            }

        })

        var keyWords = ["cause", "causes", "incident", "recommendation", "recommandation", "consequence", "immediate", " root", "fondamental"];
        var topEntityFont = indentifyEntitiesFontKey(fontGroups, keyWords);
console.log(JSON.stringify(fontGroups,null,2))
        var topEntities = fontGroups[topEntityFont]


        return callback(null, topEntities);
    },


    extractEntitiesByFontName: function (json, entityFontName, callback) {


        var entities = {}
        var currentEntity = null;
        json.forEach(function (text) {
            //   console.log(text.fontName)
            if (text.fontName == entityFontName) {
                currentEntity = text.str;
                entities[currentEntity] = [text]
            } else {
                if (currentEntity)
                    entities[currentEntity].push(text)
            }

        })
        return entities;


    }
    ,

}

module.exports = pdf2json;

if (false) {
    var filePath = path.resolve("D:\\Total\\REX\\Butane.pdf");


    var filePath = path.resolve("D:\\Total\\REX\\Gratings.pdf");
    pdf2json.parsePdf3(filePath, function (err, json) {
        pdf2json.extractEntitiesFontNameAndHeight(json, "g_d0_f5", function (err, result) {
            var xx = result;
        });

        // var entities = pdf2json.analyzeByRegex(json)
        //   fs.writeFileSync("D:\\GitHub\\docxSplitter\\public\\entities.json",JSON.stringify(entities))

        fs.writeFileSync("D:\\GitHub\\docxSplitter\\public\\pdf.js", "var data=" + JSON.stringify(json))
        fs.writeFileSync("D:\\GitHub\\docxSplitter\\public\\pdf.json", JSON.stringify(json))


    })
}

if (true) {

    var dirPath = "D:\\Total\\REX\\";

    var files = fs.readdirSync(dirPath);
    files.forEach(function (file) {
        var filePath = dirPath + file;
        if (file.indexOf("Barge") < 0)
            return;
        pdf2json.parsePdf3(filePath, function (err, json) {
            return
            pdf2json.extractEntitiesFontNameAndHeight(json, function (err, result) {
                console.log("-----" + file);
                result.forEach(function (line) {
                    console.log("  " + line.str)
                })
                //  console.log(JSON.stringify(result,null,2))


            })

        })

    })

}


