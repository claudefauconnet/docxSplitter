var iteration = 0;
var pageIndex = 0;
var parseCFpdf = (function () {
    var self = {}
    self.texts = [];
    self.fontGroups = {};
    self.isDrawing = false;
    self.keyWords = "cause,incident,recommendation,recommandation,consequence,immediate,root,fondamental,introduction,description"
    self.keyWordsArray = [];
    self.currentPage = 0;
    self.currentEntityFont = "";
    self.textIndex = 0;
    self.readPdf = function (pdfName) {
        pageIndex=0;
        var html = ""
        self.texts = [];
        self.fontGroups = {};
        self.currentPage = 0;
        $("#keyWordsInput").val(self.keyWords)

        $("#cfDiv").html(html);


        pdfjsLib.getDocument("assets/" + pdfName).then(pdf => {
            self.pdfInstance = pdf;
            self.totalPagesCount = pdf.numPages;
            var renderPagesPromises = [];
          /*  for (let i = 1; i <= self.totalPagesCount; i++) {
                if (i == 1)
                    self.renderPage(self.pdfInstance.getPage(i), i)
                self.renderTimeOut = setTimeout(function () {
                    self.renderPage(self.pdfInstance.getPage(i), i)

                }, 10000)


            }

            pageIndex = 0;*/


          var page=self.pdfInstance.getPage(2).then(function (page) {
              page.getTextContent({normalizeWhitespace: true}).then(function (textContent) {
                  var textContents = textContent;
              })
          })

            function myLoop() {
                var x = ++pageIndex
                console.log("begin "+pageIndex)
                self.renderPage(self.pdfInstance.getPage(x), x)

                if (pageIndex < self.totalPagesCount)
                    setTimeout(myLoop, 2000)
                else{
                    self.showTexts();
                }
            }

            myLoop();


        })
    }
    self.renderPage = function (promise, pageNum) {
        promise.then(page => {

            var pdfViewport = page.getViewport(1);

            var viewport = document.getElementById("viewport")
            var pagesHTML = `<div style="width:100% "><canvas></canvas></div>`
            viewport.innerHTML = pagesHTML;
            var container = viewport.children[0];

            pdfViewport = page.getViewport(container.offsetWidth / pdfViewport.width);
            var canvas = container.children[0];
            var context = canvas.getContext("2d");
            canvas.height = pdfViewport.height;
            canvas.width = pdfViewport.width;
            self.isDrawing = true;
            console.log("1" + self.isDrawing)
            self.currentPage += 1;
            context.page = pageNum;
            page.render({
                canvasContext: context,
                viewport: pdfViewport
            });


        })


    }


    ;


    self.onEndPageDrawing = function (obj) {
        //  if(self.currentPage==
        self.isDrawing = false;
        clearTimeout(self.renderTimeOut)
        console.log("end "+pageIndex)

    }

    self.hackText = function (glyphs, canvasState, page) {
        self.isDrawing = true;
        var html = ""
        var str = ""
        glyphs.forEach(function (glyph) {
            if (glyph.unicode)
                str += glyph.unicode;
        })
        var font = (canvasState.font.name + "" + canvasState.fontSize + "" + canvasState.fillColor).replace(/[\(\)\+\.,]/g, "")


        var y = canvasState.textMatrix[5]
        var length = self.texts.length
        if (length > 0 && self.texts[length - 1].y == y && self.texts[length - 1].font == font) {
            self.texts[length - 1].str += str

        } else {
            self.texts.push({str: str, font: font, y: y, page: page, textIndex: self.textIndex});

        }


    }
    self.showEntitiesJson = function () {
        var json = {};
        var currentEntityName = ""
        self.texts.forEach(function (line) {
            if (line.font == self.currentEntityFont) {
                json[line.str] = [];
                currentEntityName = line.str

            } else {
                if (json[currentEntityName])
                    json[currentEntityName].push(line.str);
            }


        })
        $("#entitiesJsonDiv").css("display", "block")
        $("#entitiesJsonDiv").val(JSON.stringify(json, null, 2));


    }

    self.showTexts = function () {
        $("#entitiesJsonDiv").css("display", "none")
        $("#cfDiv").html("");
        var html = "<table border='1'>";
     /*   self.texts.sort(function (a, b) {
            if (a.page == b.page) {
                if (a.y > b.y)
                    return 1;
                if (a.y < b.y)
                    return -1;
                return 0

            } else if (a.page > b.page) {
                return 1;
            } else if (a.page < b.page) {
                return -1;
            }


        })*/

        self.texts.forEach(function (line) {

            html += "<tr><td>" + line.page + "</td><td>" + line.y + "</td><td style='font-weight: bold' class='" + line.font + "'>" + line.str + "</td><td><span>" + line.font + "</span><tr></tr>";

        })

        html += "<table>";
        $("#cfDiv").append(html);
        self.showEntities();
    }


    self.showEntities = function () {


        function setFontGroups() {

            self.texts.forEach(function (line) {
                if (!self.fontGroups[line.font])
                    self.fontGroups[line.font] = [line.str]
                else
                    self.fontGroups[line.font].push(line.str)
            })

        }


        function getTopEntityFontGroup() {

            var scores = {}
            var keys = Object.keys(self.fontGroups);

            keys.forEach(function (key) {
                var concatTexts = ""
                var keyScore = 0;
                self.fontGroups[key].forEach(function (text) {
                    concatTexts += " " + text;
                })
                if (concatTexts.length / key.length < 30) {
                    self.keyWordsArray.forEach(function (keyword) {
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


        setFontGroups();
        //  var keyWords = ["cause", "causes", "incident", "recommendation", "recommandation", "consequence", "immediate", " root", "fondamental"];
        self.keyWordsArray = $("#keyWordsInput").val().split(",")
        var topEntityFont = getTopEntityFontGroup(self.fontGroups, self.keyWords);
        self.currentEntityFont = topEntityFont;

        var topEntities = self.fontGroups[topEntityFont];
        $("." + topEntityFont).css("color", "red")


    }


    return self;
})
()
