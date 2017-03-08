//Reading and Updating Cookie
function dropCookie(pId, days, cookieName)
{
    var maxNoOfProducts = readMaxProducts(),              //Maximum number of products do be stored in cookie
        expDays         = (days? days : 30),                            //Expiry date for the cookie
        cName           = (cookieName? cookieName : "recentProduct"),   //Name of the cookie
        path            = "path=/",                                     //what path the cookie belongs to
        newDate         = new Date();
    
    newDate.setTime(newDate.getTime() + (expDays*24*60*60*1000));
    var expires = "expires="+newDate.toUTCString();
    
    var cookieData = {};
    document.cookie.split("; ").map(function(value)
    { 
        if( value.split("=")[0].indexOf(cName) != -1)
            cookieData[value.split("=")[0]] = value.split("=")[1];
    });
    
    //First ProductId Drop
    if(Object.getOwnPropertyNames(cookieData).length === 0)
        document.cookie = cName+"="+pId+";"+expires+";"+path;
    
    else {
        var productArray = cookieData[cName].split(",");
        
        //remove, if the product was visted before
        productArray.map(function(value, index)
        {
            if(value == pId)
                productArray.splice(index, 1);
        });
        
        if(productArray.length > maxNoOfProducts) {
            //Queque is overflow. Splice oldest products            
            productArray.splice(0, productArray.length - maxNoOfProducts + 1);
            productArray.push(pId);
            
            productArray.join();
            document.cookie = cName+"="+productArray+";"+expires+";"+path;
        }
        else if(productArray.length == maxNoOfProducts) {
            //Queque is full. Splice oldest product and push new product
            productArray.splice(0, 1);
            productArray.push(pId);
            
            productArray.join();
            document.cookie = cName+"="+productArray+";"+expires+";"+path;
        }
        else {
            //Queque is not full. Do only push
            productArray.push(pId);
            
            productArray.join();
            document.cookie = cName+"="+productArray+";"+expires+";"+path;
        }
    }
    
}

function readMaxProducts()
{
    var cookieData = {};
    document.cookie.split("; ").map(function(value)
    { 
        if( value.split("=")[0].indexOf("maxRecentProducts") != -1)
            cookieData[value.split("=")[0]] = value.split("=")[1];
    });
    
    return (cookieData.maxRecentProducts ? cookieData.maxRecentProducts : 10);
}