define(['modules/jquery-mozu', 'underscore', 'hyprlive', 'modules/backbone-mozu', 'modules/api',
    'modules/models-product', 'modules/soft-cart',
    'modules/modal', "modules/views-productimages",
    "modules/models-faceting", "modules/cart-monitor", "shim!vendor/owl.carousel[jquery=jQuery]"
], function($, _, Hypr, Backbone, Api, ProductModels, SoftCart, ModalWindow, 
            ProductImageViews, FacetingModels, CartMonitor) {

    var DummyView = Backbone.MozuView.extend({  
        templateName: 'modules/product/product-detail',
        modelW: '',
        render: function() {
            var me = this;
            var producttype;
            me.model.on('addedtowishlist',function(a,b,c){
                $('#add-to-wishlist').text('ADDED TO WHISHLIST');
            });
             
            if (me.modelW === '') {
                if(this.model.attributes.variations){
                    if(this.model.attributes.variations.length > 0){
                        this.model.set("backorderprd",false);      
                    }
                }else{  
                    if((this.model.attributes.inventoryInfo.onlineStockAvailable === 0)&&(this.model.attributes.inventoryInfo.outOfStockBehavior === "AllowBackOrder")){
                        this.model.set("backorderprd",true);   
                    }    
                }
                if(navigator.userAgent.match('CriOS')){
                    if($.cookie("chromeipad") === undefined){
                        $.cookie("chromeipad", "clicked", {expires: 7});
                        _.each(this.model.get('options').toJSON(),function(val,index) {
                           var indv = _.findWhere(me.model.get('options').models, {id: val.attributeFQN});
                           var iscolor = _.contains(_.pluck(me.model.get('options').models, 'id'),"tenant~color");
                           
                           if(indv.id !== "tenant~color") {
                               indv.set('iscolor',iscolor);
                               indv.set('index',index);
                           } else {
                               indv.set('iscolor',iscolor);
                               indv.set('index',"color");
                           }
                        });
                        producttype = this.model.attributes.productType;
                        me.modelW = new CustomOptionModel(this.model,producttype);   
                    }
                }else{
                    _.each(this.model.get('options').toJSON(),function(val,index) {
                       var indv = _.findWhere(me.model.get('options').models, {id: val.attributeFQN});
                       var iscolor = _.contains(_.pluck(me.model.get('options').models, 'id'),"tenant~color");
                       
                       if(indv.id !== "tenant~color") {
                           indv.set('iscolor',iscolor);
                           indv.set('index',index);
                       } else {
                           indv.set('iscolor',iscolor);
                           indv.set('index',"color");
                       }
                    });
                    producttype = this.model.attributes.productType;
                    me.modelW = new CustomOptionModel(this.model,producttype);
                }  
            }
            Backbone.MozuView.prototype.render.apply(this, arguments);

        }
    });

    var qmodalTemplate = Hypr.getTemplate('modules/product/product-customization'),
        CustomOptionModel,
        modal,
        getRenderProductContext = function(substituteModel) {
            var model = (substituteModel || this.model).toJSON({
                helpers: true
            });
            return {
                Model: model,
                model: model
            };
        };
    CustomOptionModel = function(cartViewObj, producttype) {
        var self = this;
        var flag=true;
        if((cartViewObj.attributes.variations === undefined)|| (cartViewObj.attributes.variations.length < 1)){
            if(cartViewObj.get('options').length > 0){ 
                _.each(cartViewObj.get('options').toJSON(), function (val, index) {
                    if(val.attributeDetail.usageType==="Extra" && flag && val.attributeFQN!== require.mozuData("sitecontext").themeSettings.singleCustomisedBulbMostPopularExtra &&  val.attributeFQN!== require.mozuData("sitecontext").themeSettings.doubleCustomisedBulbMostPopularExtra ){
                        if((val.values[0].deltaPrice < 1) && (val.values.length === 1) && (val.isRequired)){
                        }else{
                            flag=false; 
                            cartViewObj.set("closestate",val.attributeFQN);
                        }
                    }
                });    
            }
        }
        self.cartViewObj = cartViewObj;
        self.render(qmodalTemplate.render(getRenderProductContext(cartViewObj)));
        var data=self.cartViewObj.apiModel.data.options;
        if(data.length < 2){  
            $("#tz-cart-dialog").find(".custom_popup_options").find(".Optioncontainer").find(".mz-size-block").css("width","70%");
            $("#tz-cart-dialog").find(".custom_popup_options").find(".sel_opt").find(".mz-size-block").css("width","70%");
            $("#tz-cart-dialog").find(".custom_popup_options").find(".sel_opt").find(".mz-size-block").find(".label_name").css("width","30%");
            $("#tz-cart-dialog").find(".custom_popup_options").find(".sel_opt").find(".mz-size-block").find(".mz-customdrop").css("width","60%");
            $("#tz-cart-dialog").find(".custom_popup_options").find(".Optioncontainer").find(".mz-color-block").css("width","70%");
            $("#tz-cart-dialog").find(".custom_popup_options").find(".sel_opt").find(".mz-color-block").css("width","70%");
            
        }
        if($("#tz-cart-dialog").find(".mz-productoptions-optioncontainer").length < 2){
            $("#tz-cart-dialog").find(".option-subextras").hide();
        }
          
            sessionStorage.setItem('custbulb', JSON.stringify(self.cartViewObj.attributes));
            var ss = self.cartViewObj.attributes;
            var searchfil;
            var custoption1 = Hypr.getThemeSetting("singleCustomisedBulbExtra");
            var custoption2 = Hypr.getThemeSetting("TopCustomisedBulbExtra");
            var custoption3 = Hypr.getThemeSetting("BottomCustomisedBulbExtra");
            if(producttype === "single_customised_bulbs"){ 
                filteredGoal = _.where(data, {attributeFQN: custoption1});
                filterdatas(filteredGoal); 
            }else if(producttype ==="multiple_customised_bulbs"){
                filteredGoal = _.where(data, {attributeFQN: custoption2}); 
                if(filteredGoal)filterdatas(filteredGoal);
                filteredGoal1 = _.where(data, {attributeFQN: custoption3}); 
                if(filteredGoal1)filterdatas(filteredGoal1);
            } 
            
             
    };

    // customization bulb
    var QOModel  = Backbone.MozuModel.extend({});
    var ProductCustomizationView = Backbone.MozuView.extend({ 
      templateName: 'modules/customizebulb', 
      events: {
            'click .mz-productoptions-option_bulb': 'getimageinfo', 
            'click .mz-customizebulb':'finishfilter'
        },
        getimageinfo:function(e){   
            var prodData = JSON.parse(sessionStorage.custbulb);
            var prodnam = $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("label:first").attr("val");
            var products = _.where(prodData.options, {attributeFQN: prodnam }); 
            var beam = [];
            var filitem = [];
            var filitem1 = [];
            var datfil = [];
            
            var wat = [];
            
            var apival="",prodarr, prodbeam, $target = e.currentTarget;
            var obj=$($target).attr("value");
            var type=$($target).attr("data-proptype"); 

            if(type==="BULBTYPE"){
                 $("#bulbtype").attr("value",obj);  
            }else if(type==="colortemp"){  
                 $("#colortemp").attr("value",obj); 
            }else if(type==="BeamSpread"){  
                 $("#beamspread").attr("value",obj); 
            }else if(type==="wattage"){  
                 $("#wattage").attr("value",obj); 
            } 
            var selmain = $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").text();
            var bulbtype= $("#bulbtype").attr("value");
            var colortemp= $("#colortemp").attr("value");  
            var beamspread= $("#beamspread").attr("value"); 
            var wattage= $("#wattage").attr("value"); 
            var imgsrc=$($target).attr("imgsrc"); 
            
            $(e.currentTarget).parents(".option-container").find(".options").each(function(){
               $(this).removeClass("selectedoption"); 
            });
            $(e.currentTarget).parents(".options").addClass("selectedoption");
            $($target).parents(".option-container").prev().find("img").attr("src",imgsrc);
            if($(window).width() < 768){
                $($target).parents(".option-container").find(".description-mobile").each(function(){
                   $(this).html(""); 
                });
                $($target).parents(".options").find(".description-mobile").html($($target).attr("descrip"));
                $(e.currentTarget).parents(".option-container").find(".options").each(function(){
                   $(this).removeClass("selectedoption"); 
                });
                 $(e.currentTarget).parents(".options").addClass("selectedoption");
            }else{
                $($target).parents(".option-container").next().html($($target).attr("descrip"));
            }
            var dataobj={};
            var currentdata = $($target).parents(".parent_type").attr("id");
            
            $(products[0].values).each(function(i,j){
                if(i===0){
                    prodarr= "(productCode+eq+"+j.value+")";
                }else{
                    prodarr += " or (productCode+eq+"+j.value+")";
                }
                
            });
            //color
            if(currentdata === "BulbType" ){
                
                
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").html("");
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").removeClass("selectopt");
                $($target).parents(".customizebulb").next().css("display","none");
                $($target).parents(".customised_view").next().find("button").attr("disabled","disabled");
                $($target).parents(".customizebulb").next().find('.option-container').find('.options').each(function(){
                   $(this).css("display","none");
                   $(this).find("input[type='radio']").attr("checked",false);
                });
                
                //if(colortemp !== ""){
                    $($target).parents(".mz-productoptions-valuecontainer").find('#ColorTemp').css("display","none");
                    $("#colortemp").attr("value",""); 
                    $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#colortemplabel").html("");
                    $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#colortemplabel").removeClass("selectopt");
                    $($target).parents(".mz-productoptions-valuecontainer").find('#ColorTemp').find('.option-container').find('.options').each(function(){
                       $(this).css("display","none");
                       $(this).find("input[type='radio']").attr("checked",false);
                    });
                //}    
                
                //if(beamspread !== ""){
                    $("#beamspread").attr("value","");   
                    $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#BeamSpreadlabel").html("");
                    $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#BeamSpreadlabel").removeClass("selectopt"); 
                    $($target).parents(".mz-productoptions-valuecontainer").find('#BeamSpread').css("display","none");
                    $($target).parents(".mz-productoptions-valuecontainer").find('#BeamSpread').find('.option-container').find('.options').each(function(){
                       $(this).css("display","none");
                       $(this).find("input[type='radio']").attr("checked",false);
                    });
                //}
                $($target).parents(".customised_view").find(".preloader").show();
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#bulbtypelabel").html($($target).attr("dispalytxt"));
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#bulbtypelabel").addClass("selectopt"); 
                Api.request('GET',"/api/commerce/catalog/storefront/productsearch/search/?query=&filter="+prodarr+"and(properties.bulbtype+eq+"+bulbtype+")&startIndex=0&pageSize=100").then(function(Res){
                    
                    var filcols, filbeams, listname, seldata;   
                    $(Res.items).each(function(i,j){  
                        filcols = _.where(j.properties, {attributeFQN: "tenant~color-temperature"});  
                        filbeams = _.where(j.properties, {attributeFQN: "tenant~beamspread"}); 
                        if(filcols.length !== 0){
                            if($.inArray(filcols[0].values[0].value, filitem) === -1) filitem.push(filcols[0].values[0].value);
                        }    
                        if(filbeams.length !== 0){
                            if($.inArray(filbeams[0].values[0].value, filitem1) === -1) filitem1.push(filbeams[0].values[0].value);
                        }
                    });
                    
                    if(Res.items.length === 0){
                        alert("No Products Found. Please Re-Customise Bulb.");
                        $($target).parents(".customised_view").find(".preloader").hide();
                    }

                    if(filitem.length !== 0){    
                        datfil = filitem;  
                        seldata = "ColorTemp";
                        listname = 'ColorTemperature@DrewVolt';
                    }else if(filitem1.length !== 0){  
                        datfil = filitem1; 
                        seldata = "BeamSpread";
                        listname = 'beamSpread@DrewVolt';
                    }
                    
                    $(datfil).each(function(i,j){ 
                        if(i===0){
                            prodcol= "(properties.Code eq "+j+")";
                        }else{
                            prodcol += " or (properties.Code eq "+j+")";
                        }
                    });
                    
                    Api.get('documentView', {
                        listName: listname,
                        viewName: 'siteBuilder',
                        filter : prodcol 
                        }).then(function(proddata) { 
                            if($(proddata.data.items).length > 0 ){
                                $(proddata.data.items).each(function(i,v){  
                                    $($target).parents(".customizebulb").find('#'+seldata).find("."+v.properties.Code).css("display","block"); 
                                });
                                $($target).parents(".customizebulb").find('#'+seldata).show();
                                $($target).parents(".customised_view").scrollTop($($target).parents(".customizebulb").find('#'+seldata).offset().top);
                            }else{
                                alert("No Products Found. Please Re-Customise Bulb.");
                            }
                            $($target).parents(".customised_view").find(".preloader").hide();
                    });
                    
                });  
               
            //beamspread    
            }else if(currentdata === "ColorTemp" ){   
                
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").html("");
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").removeClass("selectopt");
                $($target).parents(".customizebulb").next().css("display","none");
                $($target).parents(".customised_view").next().find("button").attr("disabled","disabled");
                $($target).parents(".customizebulb").next().find('.option-container').find('.options').each(function(){
                   $(this).css("display","none");
                   $(this).find("input[type='radio']").attr("checked",false);
                });
                
                //if(beamspread !== ""){
                    $("#beamspread").attr("value","");   
                    $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#BeamSpreadlabel").html("");
                    $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#BeamSpreadlabel").removeClass("selectopt"); 
                    $($target).parents(".mz-productoptions-valuecontainer").find('#BeamSpread').css("display","none");
                    $($target).parents(".mz-productoptions-valuecontainer").find('#BeamSpread').find('.option-container').find('.options').each(function(){
                       $(this).css("display","none");
                       $(this).find("input[type='radio']").attr("checked",false);
                    });
                //}
                
                $($target).parents(".customised_view").find(".preloader").show();
                if(bulbtype !== "" ){ 
                    apival = "and (properties.bulbtype+eq+"+bulbtype+")";       
                }
                if(colortemp !== "" ){
                    apival += "and (properties.color-temperature+eq+"+colortemp+")";    
                }
               
                Api.request('GET',"/api/commerce/catalog/storefront/productsearch/search/?query=&filter="+prodarr+""+apival+"&startIndex=0&pageSize=100").then(function(Res){
                   
                    var filtemp, listname, seldata = $($target).parents(".parent_type").next().attr("id");
                    $(Res.items).each(function(i,j){
                        
                        if(seldata === "BeamSpread"){
                            filtemp = _.where(j.properties, {attributeFQN: "tenant~beamspread"});     
                            listname = 'beamSpread@DrewVolt';
                        }
                        if($.inArray(filtemp[0].values[0].value, filitem) === -1) filitem.push(filtemp[0].values[0].value);
                    });
                    
                    if(Res.items.length === 0){
                        alert("No Products Found. Please Re-Customise Bulb.");
                        $($target).parents(".customised_view").find(".preloader").hide();
                    }

                    $(filitem).each(function(i,j){ 
                        if(i===0){
                            prodcol= "(properties.Code eq "+j+")";
                        }else{
                            prodcol += " or (properties.Code eq "+j+")";
                        }
                    });
                    
                    Api.get('documentView', {
                        listName: listname,
                        viewName: 'siteBuilder',
                        filter : prodcol 
                        }).then(function(proddata) { 
                            if($(proddata.data.items).length > 0 ){
                                $(proddata.data.items).each(function(i,v){  
                                    $(document).find(".customizebulb").find('#'+seldata).find("."+v.properties.Code).css("display","block"); 
                                });
                                $($target).parents(".parent_type").next().show();
                                $($target).parents(".customised_view").scrollTop($($target).parents(".parent_type").next().offset().top);
                            }else{
                                alert("No Products Found. Please Re-Customise Bulb.");
                            }
                            $($target).parents(".customised_view").find(".preloader").hide();
                    });
                    
                });   
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#colortemplabel").html($($target).attr("dispalytxt"));
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#colortemplabel").addClass("selectopt"); 
                
            //wattage
            }else if(currentdata === "BeamSpread" ){  
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").html("");
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").removeClass("selectopt");
                $($target).parents(".customised_view").next().find("button").attr("disabled","disabled");
                $($target).parents(".customizebulb").next().css("display","none");
                $($target).parents(".customizebulb").next().find('.option-container').find('.options').each(function(){
                   $(this).css("display","none");
                   $(this).find("input[type='radio']").attr("checked",false);
                });
                
                if(bulbtype !== "" ){  
                    apival += "and (properties.bulbtype+eq+"+bulbtype+")";          
                }
                if(colortemp !== "" ){
                    apival += "and (properties.color-temperature+eq+"+colortemp+")";    
                }
                if(beamspread !== "" ){
                    apival += "and (properties.beamspread+eq+"+beamspread+")";
                }
                $($target).parents(".customised_view").find(".preloader").show();
                Api.request('GET',"/api/commerce/catalog/storefront/productsearch/search/?query=&filter="+prodarr+" "+apival+"&startIndex=0&pageSize=100").then(function(Res){
                   
                    $(Res.items).each(function(i,j){ 
                        $($target).parents(".customizebulb").next().css("display","block");
                        $($target).parents(".customizebulb").next().find("[value='"+j.productCode+"']").parent().css("display","block");
                        $($target).parents(".customised_view").scrollTop($($target).parents(".customizebulb").next().offset().top);
                    });
                    if(Res.items.length === 0){
                        alert("No Products Found. Please Re-Customise Bulb.");
                    }
                    $($target).parents(".customised_view").find(".preloader").hide();
                });
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#BeamSpreadlabel").html($($target).attr("dispalytxt"));
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#BeamSpreadlabel").addClass("selectopt");  
            }
        },
        finishfilter:function(){
                $(document).find(".customizebulb").css("display","none");
                $(document).find(".customizebulb").next().css("display","block");
        },
        render: function() {
            Backbone.MozuView.prototype.render.apply(this, arguments);
        }
    });
     
   
    function filterdatas(filteredGoal){
        var filobj={};
        var prodarr = [];
        var bulb= [];
        var colortmp= [];
        var beam= [];
        var watag= [];
        
        
        if(filteredGoal.length > 0 ){ 
            if(filteredGoal[0].attributeFQN !== undefined){
                filobj.productopt = filteredGoal[0].attributeFQN;    
            }  
            $(filteredGoal[0].values).each(function(i,j){
                if(i===0){
                    prodarr= "(productCode+eq+"+j.value+")";
                }else{
                    prodarr += " or (productCode+eq+"+j.value+")";   
                }
                
            });
            Api.request('GET',"/api/commerce/catalog/storefront/productsearch/search/?query=&filter="+prodarr+"&startIndex=0&pageSize=100").then(function(Res){
                
                $(Res.items).each(function(i,j){ 
                    var bulbprop = _.where(j.properties, {attributeFQN: "tenant~bulbtype"});
                    var colortemp = _.where(j.properties, {attributeFQN: "tenant~color-temperature"});
                    
                    var beamprop = _.where(j.properties, {attributeFQN: "tenant~beamspread"});
                    var wattage = _.where(j.properties, {attributeFQN: "tenant~wattage"});
                    
                    if(colortemp.length !== 0){
                        if($.inArray(colortemp[0].values[0].value, colortmp) === -1) colortmp.push(colortemp[0].values[0].value);    
                    }
                    if(bulbprop.length !== 0){
                        if($.inArray(bulbprop[0].values[0].value, bulb) === -1) bulb.push(bulbprop[0].values[0].value);
                    }
                    
                    if(beamprop.length !== 0){
                        if($.inArray(beamprop[0].values[0].value, beam) === -1) beam.push(beamprop[0].values[0].value);
                    }
                    
                    if(wattage.length !== 0){
                        if($.inArray(wattage[0].values[0].value, watag) === -1) watag.push(wattage[0].values[0].value);
                    }
                        
                });
                if(bulb.length !== 0){ 
                    filobj.bulbtype = bulb;
                }
                if(colortmp.length !== 0){
                    filobj.colortemp = colortmp;
                }
                if(beam.length !== 0){
                    filobj.beamtype = beam;
                }
                
                if(watag.length !== 0){
                    filobj.wattage = watag; 
                }
                
                
                calculate(filobj); 
            });
        }
    }
    
     
    function calculate(val){  
        var obj={};
        var prodbulb,colortemp,prodbeam,prodwat;
       
            
        $(val.bulbtype).each(function(i,j){
            if(i===0){
                prodbulb= "(properties.Code eq "+j+")";
            }else{
                prodbulb += " or (properties.Code eq "+j+")";
            }
            
        });       
        $(val.colortemp).each(function(i,j){
            if(i===0){
                colortemp= "(properties.Code eq "+j+")";
            }else{
                colortemp += " or (properties.Code eq "+j+")";
            }
            
        });  
        $(val.beamtype).each(function(i,j){
            if(i===0){
                prodbeam= "(properties.Code eq "+j+")";
            }else{
                prodbeam += " or (properties.Code eq "+j+")";
            }
        }); 
        $(val.wattage).each(function(i,j){
            if(i===0){
                prodwat= "(properties.Code eq "+j+")";
            }else{
                prodwat += " or (properties.Code eq "+j+")";
            }
        });  
        
         Api.get('documentView', { 
            listName: 'BulbType@DrewVolt',
            viewName: 'siteBuilder',
            filter : prodbulb 
                }).then(function(documents) { 
                if(val.bulbtype){
                    obj.BulbType=documents.data.items;      
                }
                Api.get('documentView', { 
                    listName: 'ColorTemperature@DrewVolt',
                    viewName: 'siteBuilder',
                    filter : colortemp 
                        }).then(function(documents) {   
                        if(val.colortemp){
                            obj.colortemp=documents.data.items;  
                        }
                        Api.get('documentView', {
                            listName: 'BeamSpread@DrewVolt',
                            viewName: 'siteBuilder' ,
                            filter : prodbeam 
                            }).then(function(beamspread) {
                                if(val.beamtype){
                                    obj.BeamSpread=beamspread.data.items; 
                                }
                                obj.opt = val.productopt; 
                               
                                renderthecustomview(obj); 
                        });
                });        
        });
   
    }
    
     function renderthecustomview(obj){ 
         var custoption1 = Hypr.getThemeSetting("singleCustomisedBulbExtra");
        var custoption2 = Hypr.getThemeSetting("TopCustomisedBulbExtra");
        var custoption3 = Hypr.getThemeSetting("BottomCustomisedBulbExtra");
         var productcustomizationview;
          if(obj.opt == custoption2 ){ 
            productcustomizationview = new ProductCustomizationView({
                el: $(document).find('[valopt="'+obj.opt+'"]'),
                model: new QOModel(obj)
            });  
          }else if(obj.opt == custoption3 ){
            productcustomizationview = new ProductCustomizationView({
                el: $(document).find('[valopt="'+obj.opt+'"]'),
                model: new QOModel(obj)
            });   
          }else  if(obj.opt == custoption1 ){
            productcustomizationview = new ProductCustomizationView({
                el: $(document).find('[valopt="'+obj.opt+'"]'),
                model: new QOModel(obj)
            });   
          }  
            
            
            productcustomizationview.render();  
                                         
        }

     
        
    $.extend(CustomOptionModel.prototype = new ModalWindow(), {
        constructor: CustomOptionModel,
        render: function(html) {
            var $modal = $(html);
            this.loadWrapper($modal.appendTo('body'));
            this.bindClose();
            this.open();
            this.otherEvent();
            this.events($modal);
        },
        events: function($modal) {                     
            var colordata,sizeval;
            var self = this;
            $modal.find('.mz-productoptions').on('click', function (e) { 
                if($("body").find('#tz-cart-dialog').find(".mz-messagebar").html() !== "")
                    $("body").find('#tz-cart-dialog').find(".mz-messagebar").html("");    
            });
            $modal.find('.custom_edit').on('click', function (e) {
                e.preventDefault();
                var $target = e.currentTarget;
                $($target).parents(".sel_opt").hide();
                $($target).parents(".sel_opt").next().show();   
                $($target).parents(".mz-modal__inner").find(".add-to-cart-block").find("#add-to-cart").attr("disabled","disabled"); 
                $($target).parents(".mz-productoptions-optioncontainer").nextAll(".mz-productoptions-optioncontainer").find(".Optioncontainer").addClass("closeContainer");
                $($target).parents(".mz-productoptions-optioncontainer").nextAll(".mz-productoptions-optioncontainer").addClass("closestate");
                if($($target).parents(".mz-productoptions-optioncontainer").nextAll(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").text() !== ""){
                    $($target).parents(".mz-productoptions-optioncontainer").nextAll(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").removeClass("selectopt");
                    $($target).parents(".mz-productoptions-optioncontainer").nextAll(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").parent().css("border-left","1px solid rgb(222, 222, 222)");
                }
            });
            $modal.find('#custom_options_next').on('click', function (e) {   
                var $target = e.currentTarget;
                var colordata, coloroptex, sizelabel;
                var buildoption= [], color = {},extraoption = {};
                productcode = $($target).attr("data-mz-product");
                coloroptex = $($target).parents(".Optioncontainer").find(".mz-color-block");
                $($target).addClass("is-processing");
                if($(window).width() < 768){   
                    color.value = $($target).parents(".Optioncontainer").find(".mobile-active-color").attr("color_data");  
                    color.attributeFQN = $($target).parents(".Optioncontainer").find(".mobile-active-color").parents("a").attr("option-name");
                    colordata = $($target).parents(".Optioncontainer").find(".mobile-active-color").parents(".color-swatches-icon").html();
                }else{
                    color.value = $($target).parents(".Optioncontainer").find(".active-color").attr("color_data");
                    color.attributeFQN = $($target).parents(".Optioncontainer").find(".active-color").parents("a").attr("option-name");
                    colordata = $($target).parents(".Optioncontainer").find(".active-color").parents(".color-swatches-icon").html();
                }  
                extraoption.attributeFQN = $($target).parents(".Optioncontainer").find("select").attr("option-name");
                extraoption.value = $($target).parents(".Optioncontainer").find("select").val();
                if(coloroptex.length > 0){
                    buildoption.push(color);    
                }
                buildoption.push(extraoption);   
                $(".optionselected").each(function(){
                    var optobj={};
                    if($(this).attr("customisenothanks") !== "nothanks"){
                        if($(this).attr("option-type").toLowerCase()=="option"){
                            optobj.attributeFQN=$(this).data("mz-product-option");
                            optobj.value=$(this).attr("value");
                            buildoption.push(optobj);
                        }else{ 
                            optobj.attributeFQN=$(this).data("mz-product-option");
                            optobj.value=$(this).attr("value");
                            buildoption.push(optobj);
                        }
                    }
                });
                self.checkinventory($target,productcode,buildoption);
                sizeval = $($target).parents(".Optioncontainer").find("select").find('option:selected').attr("val_name");
                sizelabel = $($target).parents(".Optioncontainer").find(".mz-size-block").find(".label_name").text();
                if(coloroptex.length > 0){  
                    $($target).parents(".Optioncontainer").prev().find(".color-swatches-icon").html(colordata);
                }
                $($target).parents(".Optioncontainer").prev().find(".custom_value").text(sizeval);
                $($target).parents(".Optioncontainer").prev().find(".mz-size-block").find(".label_name").text(sizelabel); 
                
                if(coloroptex.length > 0){  
                    option = self.cartViewObj.get("options").get('tenant~color');
                    if (option !== undefined) {
                        if (color.value === "" || color.value === undefined) {
                            newValue = option.get('values')[0].value;
                        } else {
                            newValue = color.value;
                        }
                        option.set('value', newValue);
                    }
                    sizesoption = self.cartViewObj.get('options').get(extraoption.attributeFQN);
                    if (sizesoption !== undefined) {
                        if (extraoption.value === "" || extraoption.value === undefined) {  
                            newValue = sizesoption.get('values')[0].value;
                        } else {
                            newValue = extraoption.value;
                        }
                        sizesoption.set('value', newValue);
                    }
                }else{
                    sizesoption = self.cartViewObj.get('options').get(extraoption.attributeFQN);
                    if (sizesoption !== undefined) {
                        if (extraoption.value === "" || extraoption.value === undefined) {  
                            newValue = sizesoption.get('values')[0].value;
                        } else {
                            newValue = extraoption.value;
                        }
                        sizesoption.set('value', newValue);
                    }
                }
                
            });
            $modal.find('.color-swatches-icon').on('click', function (e) {
                var obj;
                if(($( window ).width()) > 767 ){    
                
                    obj=e.currentTarget;
                    e.preventDefault();
                    $(obj).parent().find('.color-swatches-icon').each(function(){
                        if($(this).find('.color-span').hasClass("active-color")){
                            $(this).find('.color-span').removeClass("active-color");
                        }
                    });
                    $(this).find('.color-span').addClass("active-color");
                }else{
                    obj=e.currentTarget;
                    e.preventDefault();
                    $(obj).parent().find('.color-swatches-icon').each(function(){
                        if($(this).find('.color-span').hasClass("mobile-active-color")){
                            $(this).find('.color-span').removeClass("mobile-active-color");
                        }
                    });
                    $(this).find('.color-span').addClass("mobile-active-color");    
                }  
            });
            $modal.find('[option-name]').on('change', function (e){   
                self.configopt(e);
                
            });
            $modal.find('.select_customised_bulb').on('click', function (e) {
                    $(e.target).parents('.mz-productoptions-optioncontainer').find(".option-container-heading").find("#selectmain").text("");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").removeClass("selectopt");
                    $(e.target).parents('.Optioncontainer').find(".mz-product-next").attr("disabled", "disabled");
                    $(e.target).parents('.mz-modal__inner').find(".mz-productdetail-addtocart").attr("disabled", "disabled");
                    $(e.target).parents('.mz-modal__inner').find(".mz-productdetail-addtowiishlist").attr("disabled", "disabled");
                    $(e.currentTarget).parents(".customised_view").find(".mz-productoptions-valuecontainer").find(".selectedoption").find(".optionselected").removeClass("optionselected");
                    $(e.currentTarget).parents(".customised_view").find(".mz-productoptions-valuecontainer").find(".selectedoption").removeClass("selectedoption");
                    $(e.target).parents('.mz-productoptions-valuecontainer').next().show();
                    var eleopt = $(e.currentTarget).parents(".customised_view").find(".mostpopular").attr("mostopt");
                    var objjs = self.cartViewObj.getConfiguredOptions();
                    _.each(objjs, function (objoptions) {
                        var optv = self.cartViewObj.get('options').get(objoptions.attributeFQN);
                        if((optv.attributes.attributeFQN === eleopt)){
                            optv.unset("value");  
                        }
                    });
                });
                $modal.find('.custom_options').on('click', function (e) {
                    var objjs = self.cartViewObj.getConfiguredOptions();
                    var optionnothanks = $(e.currentTarget).attr("customisenothanks");
                    var ss = $(e.currentTarget).attr("description");
                    if ($(window).width() < 768) {
                        $(e.currentTarget).parents(".options").find(".description-mobile").html(ss);
                    } else {
                        $(e.currentTarget).parents(".option-container").next().html(ss);
                    }
                    $(e.currentTarget).parents(".customised_view").find(".customise_block").css("display", "none");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#bulbtypelabel").removeClass("selectopt");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#bulbtypelabel").text("");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#colortemplabel").removeClass("selectopt");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#colortemplabel").text("");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#BeamSpreadlabel").removeClass("selectopt");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#BeamSpreadlabel").text("");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#wattagelabel").removeClass("selectopt");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#wattagelabel").text("");
                    $(e.currentTarget).parents(".customised_view").find(".customise_block").find('.customise_products').css("display", "none");
                    $(e.currentTarget).parents(".customised_view").find(".customise_block").find('.customise_products').find(".selectedoption").find(".optionselected").removeClass("optionselected");
                    $(e.currentTarget).parents(".customised_view").find(".customise_block").find('.customise_products').find(".selectedoption").removeClass("selectedoption");
                    $(e.currentTarget).parents(".customised_view").find(".customise_block").find('input[type="radio"]').each(function () {
                        $(this).attr("checked", false);
                        if ($(this).parents(".parent_type").attr("id") !== "BulbType") {
                            $(this).parents(".options").css("display", "none");
                            $(this).parents(".parent_type").css("display", "none");
                            $(this).parents(".mz-option-space").find(".description-mobile").html("");
                            $(this).parents(".mz-option-space").find(".description").html("");
                        }
                    });
                    var selectedopt = $(e.currentTarget).attr("nothank_opt"); 
                    var mostopt = $(e.currentTarget).parents(".customised_view").find(".mostpopular").attr("mostopt");
                    var eleopt = $(e.currentTarget).parents(".customised_view").find(".customizebulb").attr("valopt");
                    if (optionnothanks !== undefined) {
                        $(e.currentTarget).parents(".customised_view").find(".mostpopular").find('input[type="radio"]').each(function () {
                            $(this).attr("checked", false);
                            $(this).removeClass("optionselected");
                            $(this).parents(".options").removeClass("selectedoption");
                        });
                        _.each(objjs, function (objoptions) {  
                            var optv = self.cartViewObj.get('options').get(objoptions.attributeFQN);
                            if ((optv.attributes.attributeFQN === selectedopt) || (optv.attributes.attributeFQN === mostopt)) {
                                optv.unset("value");
                            }
                        });
                    } else {  
                        if (self.cartViewObj.attributes.productType === "multiple_customised_bulbs") {  
                            _.each(objjs, function (objoptions) {
                                var optv = self.cartViewObj.get('options').get(objoptions.attributeFQN);
                                if (optv.attributes.attributeFQN === eleopt) {
                                    optv.unset("value");
                                }
                            });
                        } else {
                            _.each(objjs, function (objoptions) {
                                var optv = self.cartViewObj.get('options').get(objoptions.attributeFQN);
                                if (optv.attributes.attributeFQN === eleopt) {
                                    optv.unset("value");
                                }  
                            });
                        }

                    }
                });
            $modal.find('.mz-sub-qty').on('click', function(e) {
                var quantity=parseInt($(e.currentTarget).parent().find(".mz-productdetail-qty").val());
                var val = $(e.currentTarget).parent().find(".mz-productdetail-qty");
                self.minusqty(val,quantity); 
            });
            $modal.find('.mz-add-qty').on('click', function(e) {
                var quantity=parseInt($(e.currentTarget).parent().find(".mz-productdetail-qty").val());
                var val = $(e.currentTarget).parent().find(".mz-productdetail-qty");
                self.addqty(val,quantity); 
            });
            $modal.find('[data-mz-product-option]').on('change', function() {
                self.onOptionChange(this);    
            });
            $modal.find('#add-to-cart').on('click', function() {
                var data = _.where(self.cartViewObj.get("options").toJSON(),{isRequired : true});
                _.each(data,function(opt){  
                    console.log(opt.attributeFQN);  
                    if((opt.attributeDetail.usageType === "Extra") && (opt.isRequired) && (opt.values[0].deltaPrice < 1)&&(opt.values.length === 1)){
                        val = _.where(self.cartViewObj.getConfiguredOptions(),{attributeFQN : opt.attributeFQN });
                        console.log(val);
                        if((val === undefined)||(val.length < 1)){
                            option = self.cartViewObj.get('options').get(opt.attributeFQN);
                            console.log(option);
                            console.log(opt.values[0].value);
                            option.set('value', opt.values[0].value);
                        }             
                    }
                }); 
                self.addToCart(this);
            });
            $modal.find('.mz-productdetail-qty').on('keypress', function (e) {    
                var regex = new RegExp("^[0-9-]+$");  
                var str = String.fromCharCode(!e.charCode ? e.which : e.charCode);
                if (regex.test(str)) {
                    return true;
                }
                e.preventDefault(); 
                return false;
            });
            $modal.find('.mz-productdetail-qty').on('change', function(e) {
                 
                var quantity=$(e.currentTarget).val();
                self.updatequantity(this,quantity); 
                
            });
            $modal.find('.mz-productdetail-qty').on("keyup", function(e) {
                    if ($(this).val() == '0') {
                        $(this).val('');
                    }
            });         
            $modal.find('[data-mz-product-option]').on('change', function(e) {
                 var $target = $(e.currentTarget).val(); 
                 var obj=$(e.currentTarget);    
                 var descr = $(e.currentTarget).attr("description");
                    if($(window).width() < 768){ 
                        $(obj).parents(".option-container").find(".description-mobile").each(function(){
                           $(this).html(""); 
                        });
                        $(obj).parents(".options").find(".description-mobile").html(descr);
                    }else{
                        if(descr){
                            $(obj).parents(".option-container").next().html(descr); 
                        }    
                    } 
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").text($(e.currentTarget).attr("prnames"));
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").addClass("selectopt"); 
                    $(e.currentTarget).parents(".option-container").find(".options").each(function(){
                       $(this).removeClass("selectedoption"); 
                    });
                    $(e.currentTarget).parents(".options").addClass("selectedoption");
                    $(obj).closest(".option-container").find(".optionselected").removeClass("optionselected");
                    $(obj).addClass("optionselected"); 
                    var optionprice=0;
                      var prodprice=0;
                      
                     var buildoption= [], color = {},extraoption = {};
                      var options=[];
                    var coloroptex = $(e.currentTarget).parents(".mz-productoptions").find(".custom_popup_options").find(".Optioncontainer").find(".mz-color-block");
                    var sizeoptex = $(e.currentTarget).parents(".mz-productoptions").find(".custom_popup_options").find(".Optioncontainer").find(".mz-size-block");
                    if(coloroptex.length > 0){
                        if($(window).width() < 768){   
                            color.value = $(e.currentTarget).parents(".mz-productoptions").find(".custom_popup_options").find(".Optioncontainer").find(".mobile-active-color").attr("color_data");  
                            color.attributeFQN = $(e.currentTarget).parents(".mz-productoptions").find(".custom_popup_options").find(".Optioncontainer").find(".mobile-active-color").parents("a").attr("option-name");
                            colordata = $(e.currentTarget).parents(".mz-productoptions").find(".custom_popup_options").find(".Optioncontainer").find(".mobile-active-color").parents(".color-swatches-icon").html();
                        }else{
                            color.value = $(e.currentTarget).parents(".mz-productoptions").find(".custom_popup_options").find(".Optioncontainer").find(".active-color").attr("color_data");
                            color.attributeFQN = $(e.currentTarget).parents(".mz-productoptions").find(".custom_popup_options").find(".Optioncontainer").find(".active-color").parents("a").attr("option-name");
                            colordata = $(e.currentTarget).parents(".mz-productoptions").find(".custom_popup_options").find(".Optioncontainer").find(".active-color").parents(".color-swatches-icon").html();
                        }
                        options.push(color);  
                    }  
                    if(sizeoptex.length > 0){
                        extraoption.attributeFQN = $(e.currentTarget).parents(".mz-productoptions").find(".custom_popup_options").find(".Optioncontainer").find("select").attr("option-name");
                        extraoption.value = $(e.currentTarget).parents(".mz-productoptions").find(".custom_popup_options").find(".Optioncontainer").find("select").val();
                        options.push(extraoption);   
                    }
                      $(".optionselected").each(function(){
                          
                         
                         var optobj={};
                         if($(this).attr("customisenothanks") !== "nothanks"){
                          if($(this).attr("option-type").toLowerCase()=="option"){
                            optionprice+=0;
                            optobj.attributeFQN=$(this).data("mz-product-option");
                            optobj.value=$(this).attr("value");
                            options.push(optobj);
                          }else{
                            optionprice+= parseFloat($(this).attr("optionprice"));      
                            
                            optobj.attributeFQN=$(this).data("mz-product-option");
                            optobj.value=$(this).attr("value");
                            options.push(optobj);
                          }
                         }
                        
                        prodprice=$(this).attr("pordprice");
                     });
                     
                     var prodcode=$(this).attr("prcode");
                     Api.request("post","/api/commerce/catalog/storefront/products/"+prodcode+"/configure?includeOptionDetails=true",{options:options}).then(function(response){
                        var optprice=0;
                        if(response.price){
                            if(response.price.salePrice){
                                optprice=response.price.salePrice;
                            }else{
                                optprice=response.price.price;
                            }
                        }else if(response.priceRange){
                            if(response.priceRange.lower.salePrice){
                                optprice=response.priceRange.lower.salePrice;
                            }else{
                                optprice=response.priceRange.lower.price;
                            }  
                        } 
                        self.selectedPrice(optprice,obj);
                     });  
                
                self.productOPtionChange(obj,$target);
            });
            
            $modal.find('.close-icon').on('click', function() {
                if($.cookie("chromeipad") !== undefined){
                    $.removeCookie('chromeipad');
                }
                $("body").find('#tz-cart-dialog').find('.mz-backorder').hide();
                $('body').css({'height':'auto', 'position': 'static'}); 
                $('[data-mz-role="modal-close"]').trigger('click');
                $("#tz-cart-dialog").remove();
                $(".cart-overlay").remove();
                window.onscroll=function(){
                    return true;
                };
            });
            
            $modal.find('[data-mz-action="addToWishlist"]').on('click',function(){
                self.addToWishlist();
            });

        },
        configopt : function(e){
            var self = this;
            var newValue;
            var $target = e.currentTarget;
            var sizeselection = $($target).val();
            var sizeoption = $($target).attr("option-name");
            var option = this.cartViewObj.get('options').get(sizeoption);  
            if (option !== undefined) {
                if (sizeselection === "" || sizeselection === undefined) {
                    newValue = option.get('values')[0].value;
                } else {
                    newValue = sizeselection;
                }
                option.set('value', newValue);
            }         
        },
        checkinventory: function ($target,productcode,buildoption){    
                var obj=$($target);          
                var self = this;
                var product = Api.action('product','configure',{productCode: productcode,options:buildoption});
                product.then(function(res) {
                    var erroHtml,data,optprice;  
                    if(res.data.inventoryInfo.onlineStockAvailable){ 
                        if((res.data.inventoryInfo.onlineStockAvailable === 0) && (res.data.inventoryInfo.outOfStockBehavior !== "AllowBackOrder")) {
                            $("body").find('#tz-cart-dialog').find('.mz-backorder').hide();
                            data= Hypr.getLabel('insufficientinventory'); 
                            erroHtml = "<ul class='is-showing mz-errors'><li>" + data + "<li>";
                            $("body").find('#tz-cart-dialog').find(".mz-messagebar").html(erroHtml);
                            $("body").find('#tz-cart-dialog').scrollTop(0);
                            obj.removeClass("is-processing");
                            
                        }else{
                            $("body").find('#tz-cart-dialog').find('.mz-backorder').hide();
                            optprice=0;   
                            if(res.data.price){
                                if(res.data.price.salePrice){
                                    optprice=res.data.price.salePrice;
                                }else{
                                    optprice=res.data.price.price;
                                }
                            }else if(res.data.priceRange){
                                if(res.data.priceRange.lower.salePrice){
                                    optprice=res.data.priceRange.lower.salePrice;   
                                }else{
                                    optprice=res.data.priceRange.lower.price;
                                }  
                            } 
                            self.selectedPrice(optprice,obj); 
                            if($("body").find('#tz-cart-dialog').find(".option-container-heading").length === $(".optionselected").length ){
                                $("body").find('#tz-cart-dialog').find(".add-to-cart-block").find("#add-to-cart").removeAttr("disabled"); 
                            } 
                            obj.parents(".Optioncontainer").hide();   
                            obj.parents(".Optioncontainer").prev().show();   
                            obj.removeClass("is-processing");
                            if($("body").find('#tz-cart-dialog').find(".mz-productoptions-optioncontainer").length > 1){
                                obj.parents(".mz-productoptions-optioncontainer").next().next().removeClass("closestate");
                                obj.parents(".mz-productoptions-optioncontainer").next().next().find(".Optioncontainer ").removeClass("closeContainer");
                                if(obj.parents(".mz-productoptions-optioncontainer").next().next().find(".option-container-heading").find("a").hasClass("expand-collapse-btn")){
                                }else{
                                    obj.parents(".mz-productoptions-optioncontainer").next().next().find(".option-container-heading").find("a").addClass("expand-collapse-btn");
                                }
                                if(obj.parents(".mz-productoptions-optioncontainer").next().next().find(".option-container-heading").find("#selectmain").text() !== ""){
                                    obj.parents(".mz-productoptions-optioncontainer").next().next().find(".option-container-heading").find("#selectmain").addClass("selectopt");
                                    obj.parents(".mz-productoptions-optioncontainer").next().next().find(".option-container-heading").find("#selectmain").parent().css("border-left","none");
                                }
                                if(obj.closest('.mz-productoptions-optioncontainer').next().next().attr("autoselectinfo")!==undefined){ 
                                    obj.closest('.mz-productoptions-optioncontainer').next().next().find(".mz-productoptions-option").click();
                                    obj.closest('.mz-productoptions-optioncontainer').next().next().find(".mz-product-next").removeAttr("disabled").trigger("click");                    
                                }    
                            }else{
                                obj.parents('#tz-cart-dialog').find('#add-to-wishlist').removeAttr('disabled');
                                obj.parents('#tz-cart-dialog').find('#add-to-cart').removeAttr('disabled');        
                            } 
                             
                        }
                    }else{   
                        if((res.data.inventoryInfo.outOfStockBehavior) && (res.data.inventoryInfo.outOfStockBehavior === "AllowBackOrder")){
                            var ss = _.findWhere(self.cartViewObj.attributes.properties, {attributeFQN: "tenant~backorder-date"}),
                            backordermess = Hypr.getLabel('backOrder');
                            if(ss){
                                var sb = ss.values[0].value.split("Discontinued");
                                if(sb.length >1 ){  
                                    $("body").find('#tz-cart-dialog').find('.mz-backorder').html(ss.values[0].value);
                                }else{
                                    $("body").find('#tz-cart-dialog').find('.mz-backorder').html(backordermess+"Expected By:"+ss.values[0].value);
                                }
                            }else{
                                $("body").find('#tz-cart-dialog').find('.mz-backorder').html(backordermess);
                            } 
                            $("body").find('#tz-cart-dialog').find('.mz-backorder').show();
                            optprice=0;   
                            if(res.data.price){
                                if(res.data.price.salePrice){
                                    optprice=res.data.price.salePrice;
                                }else{
                                    optprice=res.data.price.price;
                                }
                            }else if(res.data.priceRange){
                                if(res.data.priceRange.lower.salePrice){
                                    optprice=res.data.priceRange.lower.salePrice;   
                                }else{
                                    optprice=res.data.priceRange.lower.price;
                                }  
                            } 
                            self.selectedPrice(optprice,obj); 
                            if($("body").find('#tz-cart-dialog').find(".option-container-heading").length === $(".optionselected").length ){
                                $("body").find('#tz-cart-dialog').find(".add-to-cart-block").find("#add-to-cart").removeAttr("disabled"); 
                            } 
                            obj.parents(".Optioncontainer").hide();   
                            obj.parents(".Optioncontainer").prev().show();   
                            obj.removeClass("is-processing");
                            if($("body").find('#tz-cart-dialog').find(".mz-productoptions-optioncontainer").length > 1){
                                obj.parents(".mz-productoptions-optioncontainer").next().next().removeClass("closestate");
                                obj.parents(".mz-productoptions-optioncontainer").next().next().find(".Optioncontainer ").removeClass("closeContainer");
                                if(obj.parents(".mz-productoptions-optioncontainer").next().next().find(".option-container-heading").find("a").hasClass("expand-collapse-btn")){
                                }else{
                                    obj.parents(".mz-productoptions-optioncontainer").next().next().find(".option-container-heading").find("a").addClass("expand-collapse-btn");
                                }
                                if(obj.parents(".mz-productoptions-optioncontainer").next().next().find(".option-container-heading").find("#selectmain").text() !== ""){
                                    obj.parents(".mz-productoptions-optioncontainer").next().next().find(".option-container-heading").find("#selectmain").addClass("selectopt");
                                    obj.parents(".mz-productoptions-optioncontainer").next().next().find(".option-container-heading").find("#selectmain").parent().css("border-left","none");
                                }
                                if(obj.closest('.mz-productoptions-optioncontainer').next().next().attr("autoselectinfo")!==undefined){ 
                                    obj.closest('.mz-productoptions-optioncontainer').next().next().find(".mz-productoptions-option").click();
                                    obj.closest('.mz-productoptions-optioncontainer').next().next().find(".mz-product-next").removeAttr("disabled").trigger("click");                    
                                }    
                            }else{
                                obj.parents('#tz-cart-dialog').find('#add-to-wishlist').removeAttr('disabled');
                                obj.parents('#tz-cart-dialog').find('#add-to-cart').removeAttr('disabled');        
                            } 
                        }else{
                            $("body").find('#tz-cart-dialog').find('.mz-backorder').hide();  
                            data= Hypr.getLabel('insufficientinventory'); 
                            erroHtml = "<ul class='is-showing mz-errors'><li>" + data + "<li>";
                            
                            $("body").find('#tz-cart-dialog').find(".mz-messagebar").html(erroHtml);
                            $("body").find('#tz-cart-dialog').scrollTop(0);
                            obj.removeClass("is-processing");
                        }
                    }
                });
        },
         addqty:function($qty,currentVal){
                if (!isNaN(currentVal)   && currentVal < 999 ) {
                    $qty.val(currentVal + 1);
                    var quantity=currentVal + 1;
                    this.updatequantity($qty,quantity);
                }
        },    
        minusqty:function($qty,currentVal){
                if (!isNaN(currentVal) && currentVal > 1) {
                    $qty.val(currentVal - 1);
                    var quantity=currentVal - 1;
                    this.updatequantity($qty,quantity);
                }
        },

       selectedPrice:function(optionprice,obj){
            var self=this;
            if(require.mozuData("pagecontext").title === "Build Your Own System"){
                window.accountmodel=self.cartViewObj;
            }
            var quantity=(obj).parents(".mz-modal").find(".price-qty-block").find(".mz-productdetail-qty").val();
            var quanityupdateprice=optionprice*quantity;
            var newupdateprice=quanityupdateprice.toFixed(2);
            $(obj).parents(".mz-modal").find(".price-qty-block").find(".upd_price").text("$"+newupdateprice); 
        
        },
        productOPtionChange:function(obj,value){
             var t = Api.context.tenant;
         var s = Api.context.site;
         var filepath=""+require.mozuData("sitecontext").cdnPrefix+"/cms/"+s+"/files/";
            
            var $target = value;
            
            var loadimgsrc =""+filepath+"loading-small-flat.gif";
            var loadimg = "<img src=" + loadimgsrc + "></img>";
            $(obj).closest(".mz-productoptions-valuecontainer").find(".img-slot").html(loadimg); 
            var imgsrc = ""; 
            if ($target != "None" &&  $(obj).attr("option-type")!="Option") {
                Api.get('product', $target).then(function (sdkProduct) {

                        if (sdkProduct.data.content.productImages.length > 0) {
                            imgsrc = sdkProduct.data.content.productImages[0].imageUrl;
                        } else {
                            imgsrc = "" + filepath +"nooption.png";
                        }
                        var imghtml = "<img src=" + imgsrc + "></img>";
                        obj.closest(".mz-productoptions-valuecontainer").find(".img-slot").html(imghtml);
                    }, function(err){
                        if(err.errorCode=="ITEM_NOT_FOUND"){
                            var indexdae= err.message.split("baseproductCode:")+16;
                            var code=err.message.substring(90);
                            
                             Api.get('product', code).then(function (sdkProduct) {

                                if (sdkProduct.data.content.productImages.length > 0) {
                                    imgsrc = sdkProduct.data.content.productImages[0].imageUrl;
                                } else {
                                    imgsrc = "" + filepath +"nooption.png";
                                }
                                var imghtml = "<img src=" + imgsrc + "></img>";
                                obj.closest(".mz-productoptions-valuecontainer").find(".img-slot").html(imghtml);
                            });
                            
                        }  
                            
                          });
                
                
            }else{
                imgsrc = ""+filepath+"nooption.png"; 
                var imaghtml = "<img src=" + imgsrc + "></img>";
                obj.closest(".mz-productoptions-valuecontainer").find(".img-slot").html(imaghtml);
            }    
        },
         updatequantity:function(obj,value){
            this.cartViewObj.set({
                "quantity": value
            });
            var price=0;
            if(this.cartViewObj.get("price").attributes.price){
                if(this.cartViewObj.get("price").get("salePrice")){
                   price=this.cartViewObj.get("price").get("salePrice"); 
                }else{
                    price=this.cartViewObj.get("price").get("price");    
                }    
            }else if(this.cartViewObj.get("priceRange").attributes.lower){
                price=this.cartViewObj.get("priceRange").get("lower").get("price");    
            } 
            var Updatetotal=value*price;
            $(obj).closest(".price-qty-block").find(".upd_price").text("$"+Updatetotal.toFixed(2)); 
             
        },
          
        addToCart: function(obj) {
            
            Api.on('error', function(badPromise, xhr, requestConf) {
                if(badPromise.message.indexOf('limited quantity') != -1){ 
                    badPromise.message= Hypr.getLabel('insufficientinventory');
                } 
                var erroHtml = "<ul class='is-showing mz-errors'><li>" + badPromise.message + "<li>";
                    
                $("body").find('#tz-cart-dialog').find(".mz-messagebar").html(erroHtml);
            });
            this.cartViewObj.on('addedtocart', function() {
                $('[data-mz-role="modal-close"]').trigger('click');
                $("#tz-cart-dialog").remove();
                $(".cart-overlay").remove();
                
                window.onscroll=function(){
                    return true;
                };
                
                CartMonitor.updateCart();
                if (($(window).width()) < 768) {
                //Check is user is valid or not
                     window.location.href = require.mozuData("pagecontext").secureHost+"/cart";
                }
                
            });
            this.cartViewObj.addToCart();
        },
        onOptionChange: function(e) { 
            this.configure($(e));
        },
        configure: function($optionEl) {
            var EliminateProduct=Hypr.getThemeSetting("nothanks");
            var newValue = $optionEl.val(),
                oldValue,
                id = $optionEl.data('mz-product-option'),
                optionEl = $optionEl[0],
                isPicked = (optionEl.type !== "checkbox" && optionEl.type !== "radio") || optionEl.checked,
                option = this.cartViewObj.get('options').get(id);
              if(newValue!=EliminateProduct){ 
                if (option) {
                    if (option.get('attributeDetail').inputType === "YesNo") {
                        option.set("value", isPicked);
                    } else if (isPicked) {
                        oldValue = option.get('value');
                        if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                            option.set('value', newValue);
                        }
                    }
                }
                    }else{ 
                        if(option.get("value")!==undefined){
                            option.unset("value");
                        }
                    }
        },
        otherEvent: function() {
            var $that = this;
        },
        addToWishlist: function(){
            this.cartViewObj.addToWishlist();
        }
        
    });

    $(window).load(function() {
    });

    $(document).ready(function() { 
        var resourcename = $.cookie("resourcename");
        if (resourcename !=="undefined") {
            $('.learning-menu').text(resourcename);
           
        }
        var data = $('.left-navigation').html();
        $('.learning-popup').html(data); 
        
        //resource center mobile popup fix
        if($('body').width() < 727) {
            $('.learning-menu').on('click', function(e){
                $('body').css({'height':$(window).height()-100, 'overflow':'hidden','position':'fixed'});
            });
            $('#openModal').find('.close').on('click', function(e){
                $('body').css({'height':'auto', 'overflow':'auto', 'position':'static'});
            });
        }
        $(document).on("click", ".learning-popup h3 > a", function(e) { 
            var name = $(this).text();
           $.cookie('resourcename', name);
            $(".learning-popup ul").slideUp(); 
            if($(this).parent().find("ul").length>0){
                $(this).parent().find("ul").slideDown();
               
                e.preventDefault();
                 return false;
            }
        });
       $(document).on("click", ".left-navigation ul li", function(e) { 
            $(".learning-popup ul li").removeClass("active");
            $(this).addClass("active"); 
            
          
          
        });   
        $.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);// jshint ignore:line
    if (results===null){
       return null;
    }
    else{
       return results[1] || 0;
    }
};
        if($.urlParam('facetValueFilter')!==null){
            var urlparm= $.urlParam('facetValueFilter').split("%");
            if(urlparm[0].toLowerCase()=="tenant~tags"){
                
                $("html, body").animate({ scrollTop: $(".plpbreadcrumb").offset().top-200 }, "medium");
                
            }    
        }
        
        
        
        
                var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

        var indexoff=0;
           $(document).on("click",".color_buymultiple_product",function(e){
            e.preventDefault(); 
            var $target = $(e.currentTarget),
            productCode = $target.attr("mz-quick-add-to-cart"); 
            var dataarray=$target.data("mz-extracode").split(",");
            Api.get('product', productCode).then(function(sdkProduct) {
                            var product = new ProductModels.Product(sdkProduct.data),
                                variantOpt = sdkProduct.data.options,
                                label, options;
                            if (variantOpt) { 
                                 for (var i in variantOpt) {
                                    label = variantOpt[i].attributeDetail.name;
                                    var id = variantOpt[i].attributeFQN;
                                    var newValue=dataarray[i];
                                     option = product.get('options').get(id);
                                    if(newValue){
                                        if (option) { 
                                            oldValue = option.get('value'); 
                                            if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                                                option.set('value', newValue);
                                            }
                                        }
                                    } 
                                    if(i==variantOpt.length-1){
                                        product.addToCart(1);
                                          /* jshint ignore:start */
                                        product.on('addedtocart', function(attr) {
                                        if (($(window).width()) < 768) {
                                       
                                             window.location.href = require.mozuData("pagecontext").secureHost+"/cart";
                                        }
                                        $target.removeClass("is-processing");
                                        CartMonitor.updateCart();
                                    }); 
                                         /* jshint ignore:end */
                                    }
                                 }
                                 
                            }    
                        });
                        
                    });
        $(document).on('click', '.color_buy_product', function(e) {
            e.preventDefault();
            var $target = $(e.currentTarget),
                productCode = $target.attr("mz-quick-add-to-cart"); 
                  Api.on('error', function (badPromise, xhr, requestConf) {
                      $(document).find(".cart-out-of-stock").hide();
                    if(badPromise.message.indexOf('limited quantity') != -1){ 
                        
                        $($target).closest(".mz-productlist-item").find(".cart-out-of-stock").show(); 
                        $target.removeClass("is-processing");
                    }
                    }); 
                
            Api.get('product', productCode).then(function(sdkProduct) {
                var product = new ProductModels.Product(sdkProduct.data),
                    variantOpt = sdkProduct.data.options,
                    label, options;
                if (variantOpt) {
                    var sel,oldValue,newValue, variantflag = 0;
                    for (var i in variantOpt) {
                        label = variantOpt[i].attributeDetail.name;
                        var id = variantOpt[i].attributeFQN,
                        coloroption = Hypr.getThemeSetting('coloroption');
                        if ($.inArray(id, coloroption) > -1) {
                           
                            option = product.get('options').get(id);
                            newValue="";
                            if($(window).width() < 1025){ 
                                newValue = $target.parent().parent().parent().find(".mobile-active-color").parents(".color-swatches-icon").attr('color_data');
                            }else{
                                newValue = $target.parent().parent().parent().find('.active-color').parents(".color-swatches-icon").attr('color_value');    
                            }
                                
                            if (newValue) {
                                if (option) {
                                    oldValue = option.get('value');
                                    if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                                        option.set('value', newValue);
                                    }
                                }
                                if (variantOpt.length == 1) {
                                    $target.addClass("is-processing");
                                    product.addToCart(1);
                                    /* jshint ignore:start */
                                    product.on('addedtocart', function(attr) {
                                        if (($(window).width()) < 768) {
                                        //Check is user is valid or not
                                             window.location.href = require.mozuData("pagecontext").secureHost+"/cart";
                                        }
                                        $target.removeClass("is-processing"); 
                                        CartMonitor.updateCart();
                                    });
                                    /* jshint ignore:end */
                                }   
                            } else {
                                //otherthan  
                            }
                           
                        } else{
                              option = product.get('options').get(id);
                                newValue=$target.data("mz-extracode");
                                if(newValue){
                                    
                                if (option) { 
                                    oldValue = option.get('value');
                                    if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                                        option.set('value', newValue);
                                    }
                                }
                                if (variantOpt.length == 1) {
                                    $target.addClass("is-processing");
                                    product.addToCart(1);
                                    /* jshint ignore:start */
                                    product.on('addedtocart', function(attr) {
                                        if (($(window).width()) < 768) {
                                        //Check is user is valid or not
                                             window.location.href = require.mozuData("pagecontext").secureHost+"/cart";
                                        }
                                        $target.removeClass("is-processing");
                                        CartMonitor.updateCart();
                                    });
                                    /* jshint ignore:end */
                                }   
                            
                                } 
                                
                        }  
                        
                    }  
                    
                }
            });
        });

        var imglength = $(".mz-category").find(".imgvideo").find("img").length;
      
        if (imglength > 1) {
            $(".mz-category").find(".imgvideo").owlCarousel({
                center: true,
                loop: true,
                margin: 10,
                nav: true,
                dots: true,
                autoplay: true,
                items: 1,
                responsive: {

                },
            });


        }

        var ColorImageCache = {},
            arraydata = [],
            CategoryHeirachyList = {},
            customizeimgProduct = "",
            customizeimagecachearr = {},  
            productProperties;
            var t = Api.context.tenant;  
            var s = Api.context.site;
            var filepath=""+require.mozuData("sitecontext").cdnPrefix+"/cms/"+s+"/files/";   
            
            
        function ipadJumpFix() {
            //iPad jump issue fix
            $('#tz-cart-dialog').find('select').on('click',function(){
                event.stopPropagation();
            });
            var is_iPad = navigator.userAgent.match(/iPad/i) !== null;
            
            if (is_iPad) {  
                var currentPos = $('body').scrollTop();
                
                window.onscroll=function(){
                    $('body').scrollTop(currentPos);
                };
                $('#tz-cart-dialog').css({ 'top': $('body').scrollTop()-100 +"px", height: '120%'});
                $('#tz-cart-dialog').css({'position':'absolute'});
                
                $('.mz-productdetail-qty').on('focus', function(){
                    $('#tz-cart-dialog').css({ 'top': $('body').scrollTop() - $('#tz-cart-dialog .mz-price-addcart').position().top + 100});
                });
                
                $('.mz-productdetail-qty').on('blur', function(){
                    $('#tz-cart-dialog').css({ 'top': $('body').scrollTop()-100 });
                });
            }  
            
        }

       $(document).on("click",".customcart",function(e){ 
            
            $('body').css({'height':$(window).height() , 'overflowY': "hidden", 'position': 'relative','-ms-overflow-y': "hidden"});
           if($(e.currentTarget).attr("disabled")!=="disabled"){
            var currentSelection,sizeselection,$target = $(e.currentTarget),
                productCode = $target.data('mz-prcode'),
                index;
            if($(window).width() < 768){
                currentcolorSelection = $target.parents(".mz-productlist-item").find('.mobile-active-color').attr('color_data');
            }else{
                currentcolorSelection = $target.parents(".mz-productlist-item").find('.active-color').attr('color_data');    
            }
            
            Api.get('product', productCode).then(function(sdkProduct) {
                var product = new ProductModels.Product(sdkProduct.data),
                    val, sitecontext, imagefilepath, option, newValue;
                if($.cookie("chromeipad") !== undefined){
                    $.removeCookie('chromeipad');
                }
                var dummyView = new DummyView({
                    model: product
                });
                   
                
                //var dummyView;
                if (product.get('options').length > 0) {
                    if(currentcolorSelection){
                        option = product.get('options').get('tenant~color');
                        if (option !== undefined) {
                            if (currentcolorSelection === "" || currentcolorSelection === undefined) {
                                newValue = option.get('values')[0].value;
                            } else {
                                newValue = currentcolorSelection;
                            }
                            option.set('value', newValue);
                        }
                        dummyView.render(); 
                        ipadJumpFix();
                    }
                    else{
                        dummyView.render();
                        ipadJumpFix();
                    }
                }else{
                    dummyView.render();
                    ipadJumpFix();
                }  
            });
               
            
        }
        });

    });
});





