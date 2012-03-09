     function advance() {
        var value = $("#health_bar").progressbar("value");
        
        value = value - 1;
        if (value < 0) {
          value = 100;
        }
        
        $("#health_bar").progressbar({ "value" : value });
        if (value == 0 || value == 100) {
          setTimeout("advance()", 1000);
        } else {
          setTimeout("advance()", 100);
        }
           
     }
     
     function convertToTwoDigitHex(number) {
       var str = number.toString(16);
       if (str.length == 1) {
         str = '0' + str; 
       }
       return str;
     }
     
     function mixColours(rgb1, rgb2, relative1to2) {
        var red = Math.round( relative1to2 * rgb1[0] + (1-relative1to2) * rgb2[0]);
        var green = Math.round( relative1to2 * rgb1[1] + (1-relative1to2) * rgb2[1]);
        var blue = Math.round( relative1to2 * rgb1[2] + (1-relative1to2) * rgb2[2]);
            
        var colour = "#" + convertToTwoDigitHex(red)
                         + convertToTwoDigitHex(green)
                         + convertToTwoDigitHex(blue);
        return colour;
     }
    
     $(document).ready(function() {
          $("#health_bar").progressbar({ value: 0 });
          $("#health_bar").bind('progressbarchange', function(event, ui) {
            var selector = "#health_bar > div";
            var value = $("#health_bar").progressbar( "value" );
            
            var colours = [[0,255,0],[255,255,0],[255,200,0],[255,0,0]];
            var valueThresholds = [100,60,30,0];
            
            var backColours = [[255,255,255],[255,50,50]];
            var backThreshold = 25;
            
            for (var i = 0; i < valueThresholds.length;i++) {
              if (value > valueThresholds[i] || i == valueThresholds.length-1) {
              
                var relative = (value - valueThresholds[i]) / (valueThresholds[i-1] - valueThresholds[i]) 
              
                var colour  = mixColours(colours[i-1],colours[i],relative);
            
                $(selector).css({ 'background': colour }); 
                if (value == 0) {
                  var backColour = "#000000";
                } else if (value < backThreshold) {
                  var backRelative = 1
                  if (value < backThreshold) {
                    backRelative = value / backThreshold;
                  }
                  var backColour = mixColours(backColours[0],backColours[1], backRelative);
                } else {
                  var backColour = "#FFFFFF";
                }
                
                $("#health_bar").parent().css({ 'background': backColour }); 
                break;
              }
            }
            
            
           
            // $("#" + this.id).css({ 'background': colour });
            
            if (value < 0) {
              var greenBack = Math.round(240 * value / 50) ;
              var blueBack = Math.round(240 * value / 50) ;
              var colourBack = "#" + convertToTwoDigitHex(240)
                                   + convertToTwoDigitHex(greenBack)
                                   + convertToTwoDigitHex(blueBack);
              $("#health_bar").css({ 'background': colourBack });
            } else {
              $("#health_bar").css({ 'background': "#FFFFFF" });
            }
            
            
            $("#status").empty();
            $("#status").append(value + " " + colour);
            
          }); 
          
          $("#health_bar").progressbar({ value: 100 });
          
          setTimeout("advance()", 2000);
     });