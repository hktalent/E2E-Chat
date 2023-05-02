var defaultValues = {
    CODE128 : "Example 1234",
    CODE128A : "EXAMPLE",
    CODE128B : "Example text",
    CODE128C : "12345678",
    EAN13 : "1234567890128",
    EAN8 : "12345670",
    UPC : "123456789999",
    CODE39 : "EXAMPLE TEXT",
    ITF14 : "10012345000017",
    ITF : "123456",
    MSI : "123456",
    MSI10 : "123456",
    MSI11 : "123456",
    MSI1010 : "123456",
    MSI1110 : "123456",
    pharmacode : "1234"
};

var g_bStart = false,nTm = 0,g_qrcode = 0;
$(document).ready(function(){
  if(!g_qrcode)
  g_qrcode = new QRCode(document.getElementById("myQrcode"),{text:$("#userInput").val(),width:200,height:200});
  var omyHk = $("#myHk");
  omyHk.on('click',function()
  {
    if(g_bStart)
    {
      omyHk.val("start");
      return g_bStart=false,clearTimeout(nTm);
    }
    omyHk.val("stop");
    nTm = setInterval(() => {
      g_bStart=true;
       newBarcode();
       var o1  = $("#userInput"),s =  o1.val();
       o1.val(parseInt(s) + 1);
    }, $("#secId").val());
  });
    $("#userInput").on('input',newBarcode);
    $("#barcodeType").change(function()
    {
        // $("#userInput").val( defaultValues[$(this).val()] );
        newBarcode();
    });

    $(".text-align").click(function(){
      $(".text-align").removeClass("btn-primary");
      $(this).addClass("btn-primary");

      newBarcode();
    });

    $(".font-option").click(function(){
      if($(this).hasClass("btn-primary")){
        $(this).removeClass("btn-primary");
      }
      else{
        $(this).addClass("btn-primary");
      }

      newBarcode();
    });

    $(".display-text").click(function(){
      $(".display-text").removeClass("btn-primary");
      $(this).addClass("btn-primary");

      if($(this).val() == "true"){
        $("#font-options").slideDown("fast");
      }
      else{
        $("#font-options").slideUp("fast");
      }

      newBarcode();
    });

    $("#font").change(function(){
      $(this).css({"font-family": $(this).val()});
      newBarcode();
    });

    $('input[type="range"]').rangeslider({
        polyfill: false,
        rangeClass: 'rangeslider',
        fillClass: 'rangeslider__fill',
        handleClass: 'rangeslider__handle',
        onSlide: newBarcode,
        onSlideEnd: newBarcode
    });

    newBarcode();
});

var newBarcode = function() {
    //Convert to boolean
    $("#barcode").JsBarcode(
        $("#userInput").val(),
        {
          "format": $("#barcodeType").val(),
          "background": '#FFFFFF',
          "lineColor": "#000000",
          "fontSize": parseInt($("#bar-fontSize").val()),
          "height": parseInt($("#bar-height").val()),
          "width": $("#bar-width").val(),
          "margin": parseInt($("#bar-margin").val()),
          "textMargin": parseInt($("#bar-text-margin").val()),
          "displayValue": $(".display-text.btn-primary").val() == "true",
          "font": $("#font").val(),
          "fontOptions": $(".font-option.btn-primary").map(function(){return this.value;}).get().join(" "),
          "textAlign": $(".text-align.btn-primary").val(),
          "valid":
            function(valid){
              if(valid){
                $("#barcode").show();
              }
              else{
                $("#barcode").hide();
              }
            }
        });

    $("#bar-width-display").text($("#bar-width").val());
    $("#bar-height-display").text($("#bar-height").val());
    $("#bar-fontSize-display").text($("#bar-fontSize").val());
    $("#bar-margin-display").text($("#bar-margin").val());
    $("#bar-text-margin-display").text($("#bar-text-margin").val());
    if(g_qrcode)
    {
      g_qrcode.clear();
      g_qrcode.makeCode($("#userInput").val());
    }
};
