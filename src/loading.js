var $ = require('jquery');


// Add scanlines
$(function(){
  for(var i=0;i<4;i++){
    $('.load-screen .text span').eq(0).clone().prependTo('.load-screen .text');
  }
});

// https://jsfiddle.net/xu0hxmss/4/
$(document).ready(function() {
    setTimeout(function(){
        setTimeout(function(){
        $(".load-text").css("display", "none");
        $("#play").css("display", "inherit");
        $('#time').text("00:00:00");
    }, 1000);

    $("#play").click(function() {
        $('.load-screen').fadeOut();
        $('audio').trigger("play");
        setTimeout(function(){
            $('.load-screen').remove();
        }, 1000);
    });
    }, 1000);
})
