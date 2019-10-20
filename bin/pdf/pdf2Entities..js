const { createCanvas, loadImage } = require('canvas')

var pageIndex=0;
var pdfToEntities={



    getCanvas:function(width,height){
        const canvas = createCanvas(width,height)
       return canvas;
    },
    readPdf: function (pdfPath) {

        var html = ""
        self.texts = [];
        self.fontGroups = {};
        self.currentPage = 0;
        $("#keyWordsInput").val(self.keyWords)

        $("#cfDiv").html(html);


        pdfjsLib.getDocument(pdfPath).then(pdf => {
            self.pdfInstance = pdf;
            self.totalPagesCount = pdf.numPages;
            var renderPagesPromises = [];



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
    },renderPage : function (promise, pageNum) {
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








}
module.exports=pdfToEntities;
