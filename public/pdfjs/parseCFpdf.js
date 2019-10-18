var parseCFpdf = (function () {
    var self = {}
    self.texts = [];
    self.fontGroups = {};
    self.keyWords = "cause,incident,recommendation,recommandation,consequence,immediate,root,fondamental,introduction,description"
    self.keyWordsArray = [];
    self.currentPage=0;
    self.readPdf = function (pdfName) {
        var html = ""
        self.texts = [];
        self.fontGroups = {};
        $("#keyWordsInput").val(self.keyWords)

        $("#cfDiv").html(html);

        initPDFViewer("assets/" + pdfName);



    }


    self.hackText = function (glyphs, canvasState) {
        var html = ""
        var str = ""
        glyphs.forEach(function (glyph) {
            if (glyph.unicode)
                str += glyph.unicode;
        })
        var font = (canvasState.font.name + "" + canvasState.fontSize + "" + canvasState.fillColor).replace(/[\(\)\+\.,]/g, "")


        var y = canvasState.textMatrix[5]
        var length = self.texts.length
        if (  length > 0 && self.texts[length - 1].y == y && self.texts[length - 1].font == font &&  self.texts[length - 1].page == self.currentPage) {
            self.texts[length - 1].str += str

        } else {
            self.texts.push({str: str, font: font, y: y,page : self.currentPage});

        }


    }


    self.showTexts = function () {
        $("#cfDiv").html("");
        var html = "<table>";
        self.texts.sort(function (a, b) {

            return ((100000*b.page)+b.y )- ((100000*a.page)+a.y);
        })

        self.texts.forEach(function (line) {
            html += "<tr></td><td style='font-weight: bold' class='" + line.font + "'>" +line.str+ "</td><td><span>" + line.font  + "</span><tr></tr>";

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

        var topEntities = self.fontGroups[topEntityFont];
        $("." + topEntityFont).css("color", "red")


    }


    return self;
})
()
