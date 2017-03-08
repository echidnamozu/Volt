require(["modules/jquery-mozu","shim!vendor/owl.carousel"], function () { 
var imagesvideo = require.mozuData('uploadimagevideos'), tags = $.parseJSON(imagesvideo), imghtml="", videohtml="", finalhtml="";
$(tags).each(function(k,v){  
  //  console.log(v.type);
      if(v.type=="image"){  
        imghtml+="<div class='vt-slider'><p class='first-line'>THE MOST ADVANCED </p><p class='second-line'>"+v.title+"</p><p class='third-line'>FIXTURES EVER!</p><img src='"+v.value+"'></div>";
        finalhtml+=imghtml;       
      }else if(v.type=="video"){   
        videohtml+="<div class='videopop'><p class='first-line'>THE MOST ADVANCED </p><p class='second-line'>"+v.title+"</p><p class='third-line'>FIXTURES EVER!</p><span class='videoicon'></span><img src='"+v.value+"' data-video='"+v.imgsrc+"'></img></div>";
        finalhtml+=videohtml;
      }
 });  
  
    $(".imgvideo").html(finalhtml);
});



