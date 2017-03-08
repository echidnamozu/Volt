require(['modules/jquery-mozu', 'underscore', 'modules/backbone-mozu', 'hyprlive', 'modules/api', 'modules/models-product', 'modules/cart-monitor', 'modules/modal'],
function ($, _, Backbone, Hypr, Api, ProductModels, CartMonitor, ModalWindow) {
 
    var QuickOrderView = Backbone.MozuView.extend({ 
        templateName: "modules/quick-orders",
        additionalEvents: {     
            "click #confirm-exit-yes": "confirmYes", 
            "click #confirm-exit-out-yes": "confirmoutYes", 
            "click #confirm-exit-no": "confirmNo", 
            "click [mz-qo-id]": "toggleDetails",
            "click [showConfigOptionWindow]": "showConfigOptionWindow",
            "click [mz-qo-finishopt]": "finish",
            "change .choose-finish": "onOptionChange",    
            "click .color-swatches-icon":"ColorOptionChange",
            "change .chose-secopt":"ColorOptionChange",
            "change [poption]": "onOptionChange",
            "click [mz-qo-add-all-to-cart]": "addAllToCart",
            "click [mz-qo-category-filtering]": "filterCategory",
            "click .mz-close-button": "filterCategory",
            "click [mz-toggle-clear]": "clearCategory",
            "change [mz-qo-id-toggle-cntrl]": "toggleCategory",
            "click [mz-qo-id-toggle-mobile]": "toggleMobCategoy",
            "click [mz-qty-plus]": "onQuantityChange",
            "click [mz-qty-minus]": "onQuantityChange",
            "focusout .mz-product-quantity":"emptyquantity",
            "keydown .mz-product-quantity":"preventpart",
            "keyup .mz-product-quantity":"onQuantityChange",
            "click .with-option": "toggleoptions",
            "click #cart-del-confirm-yes": "deleteFromVirtualCart",
            "click #cart-del-confirm-no": "removeModal",
            "click .select_customised_bulb":"select_custom_data",
            "click .custom_options":"custom_options_select",
        },
        products: [], 
        inventory: [],
        virtualCart: [], 
        confirmoutYes:function(e){
            var link = $(e.currentTarget).attr("url");
            window.open("//"+link, '_blank');
            $(e.currentTarget).parents('.confirm_modal').hide();
        },
        confirmYes:function(e){
            var link = $(e.currentTarget).attr("url");
            window.location = link;
            $(e.currentTarget).parents('.confirm_modal').hide();
            $('.preloader').show();
        },
        confirmNo:function(e){ 
            $(e.currentTarget).parents('.confirm_modal').hide();
            
        },
        emptyquantity:function(e){ 
            var meThis = this;
            var currentv = $(e.currentTarget).val();
            if(currentv === ""){
                var pid = $(e.currentTarget).parent().find('input[mz-product-quantity]').attr("mz-product-quantity");
                var optionsval = $(e.currentTarget).parents('.options-content').attr("options"+pid);
                var item = _.find(meThis.virtualCart, function(a){ return (a.productCode == pid)&&(a.options==optionsval); });
                if(item){
                    meThis.deleteFromVirtual(e, pid, optionsval);
                }
                else{
                    $(e.currentTarget).val(0);
                    $(e.currentTarget).parent().find('.mz-quantity span').text('00.00');
                }
            }    
        },
        deleteFromVirtual: function(e, id, val){
            var meThis = this;
            var invs, stock;
            var selit = $(e.currentTarget).parents('#mz-qo-category-collection').find('[mz-select-prcode="'+id+'"]');
            var item = _.find(meThis.virtualCart, function(a){ return (a.productCode == id)&&(a.options==val); });
            if(item)
            {
                var htm=selit.children('['+id+'options="'+val+'"]');
                var productModels = $.grep(meThis.products, function(e){ return e.id == id; });    
                var productModel = productModels[0];
                if(item.variationProductCode){
                    stock = parseInt(selit.find("#"+item.variationProductCode+"").val());
                    invs =  stock + item.quantity;
                    selit.find("#"+item.variationProductCode+"").val(invs);
                }else{
                    invs = item.quantity; 
                    stock = parseInt(selit.attr("inventoryvalue"));
                    var updateinv = stock + invs;
                    selit.attr("inventoryvalue", updateinv);
                    if(htm){
                        htm.attr("inventory", "0");
                    }
                }
                meThis.virtualCart.splice(meThis.virtualCart.indexOf(item),1);
                meThis.updateSubtotal(); 
                var quant = parseInt(selit.attr("sumquant"));
                var adquant = (quant - item.quantity)>0?(quant - item.quantity):0;
                selit.attr("sumquant",adquant);
                htm.find('[mz-product-quantity="'+id+'"]').removeAttr('quantity');
                htm.find('[mz-product-quantity="'+id+'"]').removeAttr('deletequant', "0");
                htm.find('[mz-product-quantity="'+id+'"]').val(0);
                htm.find('.mz-quantity span').text('00.00');
                var len=productModel.attributes.options.length;
                var length;
                if(len==1){
                    htm.remove(); 
                    length = selit.find('.options-content').length;
                    if(length === 0){
                        selit.parent().find("[showconfigoptionwindow]").trigger("click");    
                    }
                }
                else{
                    if(len>1){
                        htm.remove();   
                        length = selit.find('.options-content').length;
                        if(length === 0){
                            selit.parent().find("[showconfigoptionwindow]").trigger("click");    
                        }
                    }
                }
                
                $(e.currentTarget).parents(".modal").hide();
            }
        },
        removeModal:function(e){ 
            $(e.currentTarget).parents(".modal").hide();
            var value=$(e.currentTarget).attr('quantity'); 
            if(value){ 
                var opt =$(e.currentTarget).parents(".modal").find('#cart-del-confirm-yes').attr('options');
                var id=$(e.currentTarget).parents(".modal").find('#cart-del-confirm-yes').attr('prcode');
                var val=$(e.currentTarget).parents('#mz-qo-category-collection').find('[mz-select-prcode="'+id+'"]').children('['+id+'options="'+opt+'"]');
                val.find('[mz-product-quantity="'+id+'"]').val(value);
            }
        },
        preventpart:function(e){ 
            
            var event = e;
            var curinventory, inventory, c,cartopi,oldquant,oldquantity,meThis = this;
            if((e.keyCode >= 96 && e.keyCode <= 105)){
                c = String.fromCharCode(e.keyCode - 48);
            }else{
                c = String.fromCharCode(e.keyCode);
            }
            var addval = $(e.currentTarget).parents('.choose-finish-option').attr("addvalue");
            oldquantity= parseInt($(e.currentTarget).attr('quantity'));
            this.cquantity=$(e.currentTarget).val();
            var pcod = $(e.currentTarget).attr("product-code");
            var productModels = $.grep(meThis.products, function(e){ return e.id == pcod; });    
            var productModel = productModels[0];
            var options = productModel.attributes.options.length;
            cartopi = parseInt($(document).find('#'+pcod+'cartp').val());
            var q = $(e.currentTarget).val();
            var qnt = q + c;
            var coption = $(e.currentTarget).parents('.options-content').find('[data-mz-product-option]').attr("data-mz-product-option");
            if(coption == "tenant~color"){
                var vprcode = $(e.currentTarget).parents('.options-content').find('[data-mz-product-option]').find(":selected").attr("productCode");
                cartopi = parseInt($(document).find('#'+vprcode+'cartp').val());
                curinventory = parseInt($(e.currentTarget).parents(".choose-finish-option").find("#"+vprcode+"").val()); 
            }
            else{
                cartopi = parseInt($(document).find('#'+pcod+'cartp').val());
                inventory = parseInt($(e.currentTarget).parents('.choose-finish-option').attr("inventoryvalue")); 
                if(addval == "yes"){
                    curinventory = inventory;
                }else{
                    curinventory = cartopi? (inventory - cartopi) : inventory; 
                }
            }
            var val =  oldquantity? (curinventory + oldquantity): curinventory;
           
            if (event.keyCode == 46 || event.keyCode == 9 || event.keyCode == 8 || event.keyCode == 27 || event.keyCode == 13 || (event.keyCode == 65 && event.ctrlKey === true)  || (event.keyCode >= 35 && event.keyCode <= 39)||(event.keyCode >= 48 && event.keyCode <= 57)||(event.keyCode >= 96 && event.keyCode <= 105)){
                   // return true;
            }else {
                // If it's not a number stop the keypress
                if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 )) {
                    event.preventDefault(); 
                }   
            }
             
        },
        toggleoptions:function(e){ 
            var text, firstitem, valss, conds, currenti;
            var pid = $(e.currentTarget).parents('.choose-finish-option').attr('mz-select-prcode');
            var sd = $(e.currentTarget).parents(".choose-finish-option").attr("product_type");
            var cond = $(e.currentTarget).parents('.options-content').find(".mz-color-attribute").find(".active-color").length;
            var cond1 = $(e.currentTarget).parents('.options-content').find('[data-mz-product-option="tenant~lead-wire"]').length;
            var cond2 = $(e.currentTarget).parents('.options-content').find('[data-mz-product-option="tenant~size"]').length;
            var cond3 = $(e.currentTarget).parents('.options-content').find('[data-mz-product-option="tenant~color-temperature-option"]').length;
            if(cond > 0 ){
                conds = cond;     
            }
            else if(cond1 > 0 ){
                conds = cond1;
            }else if(cond2 > 0 ){
                conds = cond2;
            }else if(cond3 > 0 ){
                conds = cond3;
            }else{
                conds = 0;
            }
            var sumquan = parseInt($(e.currentTarget).parents('.choose-finish-option').attr("sumquant"));
            var cartinv = parseInt($(document).find('#cartdiv').find('#'+pid+'cartp').val());
            var inventory = parseInt($(e.currentTarget).parents('.choose-finish-option').attr("inventoryvalue"));
            var suminv = (sumquan>0)?(sumquan+inventory):inventory;
            if(sumquan>0){
                currenti = inventory;
            }else{
                currenti = cartinv? (inventory - cartinv) : inventory;
            }
            if(conds === 0){
                if($(e.currentTarget).text() == "Edit Options"){
                    $(e.currentTarget).text("Edit Options");
                    $(e.currentTarget).toggleClass("active");
                    $(e.currentTarget).parents('.options-content').find('.mz-qo-product-options').children(".mz-productoptions-optioncontainer").first().removeClass("closestate");
                    $(e.currentTarget).parents('.options-content').find('.mz-qo-product-options').children(".mz-productoptions-optioncontainer").first().find(".Optioncontainer").removeClass("closeContainer");
                    firstitem = $(e.currentTarget).parents('.options-content').find('.mz-productoptions-optioncontainer').first().find("a");
                    if(!firstitem.hasClass("expand-collapse-btn")){
                        firstitem.addClass("expand-collapse-btn");
                    }
                    $(e.currentTarget).parents('.options-content').find('.mz-qo-product-options').toggle();
                    $(e.currentTarget).parents('.options-content').find('.choose-finish').show();
                }
                else{ 
                    if(currenti > 0){
                        if($(e.currentTarget).text().search("Select") !== -1){
                            if(sd === "single_customised_bulbs" || sd === "multiple_customised_bulbs"){
                                this.custombulbinit(pid,e);   
                            }
                        }    
                        $(e.currentTarget).text("Edit Options");
                        $(e.currentTarget).toggleClass("active");
                        $(e.currentTarget).parents('.options-content').find('.mz-qo-product-options').children(".mz-productoptions-optioncontainer").first().removeClass("closestate");
                        $(e.currentTarget).parents('.options-content').find('.mz-qo-product-options').children(".mz-productoptions-optioncontainer").first().find(".Optioncontainer").removeClass("closeContainer");
                        firstitem = $(e.currentTarget).parents('.options-content').find('.mz-productoptions-optioncontainer').first().find("a");
                        if(!firstitem.hasClass("expand-collapse-btn")){
                            firstitem.addClass("expand-collapse-btn");
                        }
                        $(e.currentTarget).parents('.options-content').find('.mz-qo-product-options').toggle();
                        $(e.currentTarget).parents('.options-content').find('.choose-finish').show();
                    }
                    else{
                        $(document).find('.alert_modal').show();
                    }   
                }
            }     
            else{
                var colorlen = $(e.currentTarget).parents('.options-content').find(".mz-color-attribute").length;
                var val = $(e.currentTarget).parents('.options-content').find(".mz-color-attribute").find(".active-color").length;
                var val1 = $(e.currentTarget).parents('.options-content').find('[data-mz-product-option="tenant~lead-wire"]').val();
                var val2 = $(e.currentTarget).parents('.options-content').find('[data-mz-product-option="tenant~size"]').val();
                var val3 = $(e.currentTarget).parents('.options-content').find('[data-mz-product-option="tenant~color-temperature-option"]').val();
                if(colorlen > 0){  
                    if(val < 1){
                        valss = null;
                        text = "COLOR";
                    }else if(val1 === null ){
                        valss = null;
                        text = "lead-wire";
                    }else if(val2 === null){
                        valss = null;
                        text = "size";
                    }else if(val3 === null){
                        valss = null;
                        text = "color-temperature-option";
                    }else{
                        valss = "data";
                    }
                }else{
                    if(val1 === null){
                        valss = null;
                        text = "lead-wire";
                    }else if(val2 === null){
                        valss = null;
                        text = "size";
                    }else if(val3 === null){
                        valss = null;
                        text = "color-temperature-option";
                    }else{
                        valss = "data";
                    }  
                }
                if(valss === null){
                    $(document).find('.pr_error').find(".change-error").text('Please provide following required information:'+text);
                    $(document).find('.pr_error').show(); 
                }
                else{
                    if($(e.currentTarget).text().search("Select") !== -1){
                        if(sd === "single_customised_bulbs" || sd === "multiple_customised_bulbs"){
                            this.custombulbinit(pid,e);   
                        }  
                    }
                    $(e.currentTarget).text("Edit Options");
                    $(e.currentTarget).toggleClass("active");
                    if($(e.currentTarget).parents('.options-content').find('.mz-qo-product-options').children(".mz-productoptions-optioncontainer").first().attr("autoselectinfo")!==undefined){ 
                        $(e.currentTarget).parents('.options-content').find('.mz-qo-product-options').children(".mz-productoptions-optioncontainer").first().find(".mz-productoptions-option").click();
                        $(e.currentTarget).parents('.options-content').find('.mz-qo-product-options').children(".mz-productoptions-optioncontainer").first().find(".mz-product-next").removeAttr("disabled").trigger("click");                    
                    }else{
                        $(e.currentTarget).parents('.options-content').find('.mz-qo-product-options').children(".mz-productoptions-optioncontainer").first().removeClass("closestate");
                        $(e.currentTarget).parents('.options-content').find('.mz-qo-product-options').children(".mz-productoptions-optioncontainer").first().find(".Optioncontainer").removeClass("closeContainer");
                        firstitem = $(e.currentTarget).parents('.options-content').find('.mz-productoptions-optioncontainer').first().find("a");
                        if(!firstitem.hasClass("expand-collapse-btn")){
                            firstitem.addClass("expand-collapse-btn");
                        }    
                    }
                    $(e.currentTarget).parents('.options-content').find('.mz-qo-product-options').toggle();
                    $(e.currentTarget).parents('.options-content').find('.choose-finish').show();
                }    
            } 
        },  
        custombulbinit:function(pid,e){      
            var self = this;
            var productModels = $.grep(this.products, function(e){ return e.id == pid; });    
            var productModel = productModels[0];
            var producttype = productModel.attributes.productType;
            sessionStorage.setItem('custbulb', JSON.stringify(productModel.attributes));
            var data=productModel.apiModel.data.options;  
            var custoption1 = Hypr.getThemeSetting("singleCustomisedBulbExtra");
            var custoption2 = Hypr.getThemeSetting("TopCustomisedBulbExtra");
            var custoption3 = Hypr.getThemeSetting("BottomCustomisedBulbExtra");
            if(producttype === "single_customised_bulbs"){ 
                filteredGoal = _.where(data, {attributeFQN: custoption1});
                self.filterdatas(filteredGoal,e); 
            }else if(producttype ==="multiple_customised_bulbs"){
                filteredGoal = _.where(data, {attributeFQN: custoption2}); 
                if(filteredGoal)self.filterdatas(filteredGoal,e);
                filteredGoal1 = _.where(data, {attributeFQN: custoption3}); 
                if(filteredGoal1)self.filterdatas(filteredGoal1,e);
            }     
        },
        
        filterdatas: function(filteredGoal,e){
            var self = this;
            var filobj={};
            var prodarr = [];
            var bulb= [];
            var colortmp= [];
            var beam= [];
            var watag= [];
            
            if(filteredGoal.length >0 ){ 
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
                    
                    self.calculate(filobj,e); 
                });
            }
        },
        calculate: function(val,e){  
            var self = this;
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
                                    
                                    self.renderthecustomview(obj,e); 
                            });
                    });        
            });
       
        },
        renderthecustomview : function(obj,e){ 
            var custoption1 = Hypr.getThemeSetting("singleCustomisedBulbExtra");
            var custoption2 = Hypr.getThemeSetting("TopCustomisedBulbExtra");
            var custoption3 = Hypr.getThemeSetting("BottomCustomisedBulbExtra");
            var productcustomizationview;
            if(obj.opt == custoption2 ){  
                productcustomizationview = new ProductCustomizationView({
                    el: $(e.currentTarget).parents(".options-content").find('[valopt="'+obj.opt+'"]'),
                    model: new QOModel(obj)
                });  
            }else if(obj.opt == custoption3 ){
                productcustomizationview = new ProductCustomizationView({  
                    el: $(e.currentTarget).parents(".options-content").find('[valopt="'+obj.opt+'"]'),
                    model: new QOModel(obj)
                });   
            }else  if(obj.opt == custoption1 ){
                productcustomizationview = new ProductCustomizationView({
                    el: $(e.currentTarget).parents(".options-content").find('[valopt="'+obj.opt+'"]'),
                    model: new QOModel(obj)
                });   
            }   
            productcustomizationview.render();  
                                         
        }, 
        select_custom_data: function(e){
            var self = this;
            var pid = $(e.currentTarget).parents('.choose-finish-option').attr('mz-select-prcode');
            $(e.target).parents('.mz-productoptions-optioncontainer').find(".option-container-heading").find("#selectmain").text("");
            $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").removeClass("selectopt");
            $(e.target).parents('.Optioncontainer').find(".mz-product-next").attr("disabled", "disabled");
            $(e.currentTarget).parents(".customised_view").find(".mz-productoptions-valuecontainer").find(".selectedoption").find(".optionselected").removeClass("optionselected");
            $(e.currentTarget).parents(".customised_view").find(".mz-productoptions-valuecontainer").find(".selectedoption").removeClass("selectedoption");
            $(e.target).parents('.mz-productoptions-valuecontainer').next().show();
            var eleopt = $(e.currentTarget).parents(".customised_view").find(".mostpopular").attr("mostopt");
            var productModels = $.grep(self.products, function(e){ return e.id == pid; });    
            var productModel = productModels[0];
            var objjs = productModel.getConfiguredOptions();
            _.each(objjs, function (objoptions) {
                var optv = productModel.get('options').get(objoptions.attributeFQN);
                if((optv.attributes.attributeFQN === eleopt)){
                    optv.unset("value");  
                }
            });    
        },
        custom_options_select : function(e){
            var vproduct, self = this;
            var pid = $(e.currentTarget).parents('.choose-finish-option').attr('mz-select-prcode');
            var optin = $(e.currentTarget).parents('.options-content').attr("options"+pid);
            var productModels = $.grep(self.products, function(e){ return e.id == pid; });    
            var productModel = productModels[0];
            var objjs = productModel.getConfiguredOptions();
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
            $(e.currentTarget).parents(".customised_view").find(".customise_block").find('input[type="radio"]').each(function (e) {
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
                $(e.currentTarget).parents(".customised_view").find(".mostpopular").find('input[type="radio"]').each(function (e) {
                    $(this).attr("checked", false);
                    $(this).removeClass("optionselected");
                    $(this).parents(".options").removeClass("selectedoption");
                });
                _.each(objjs, function (objoptions) {  
                    var optv = productModel.get('options').get(objoptions.attributeFQN);
                    if ((optv.attributes.attributeFQN === selectedopt) || (optv.attributes.attributeFQN === mostopt)) {
                        optv.unset("value");
                    }
                });
                if(optin){
                    vproduct = $.grep(this.virtualCart, function(a){ return a.productCode == pid; });  
                    $(vproduct[0].configuredOptions).each(function(i,j){
                        if((j.attributeFQN === eleopt) || (j.attributeFQN === mostopt)){ 
                             vproduct[0].configuredOptions.splice(i, 1);  
                        }
                    }); 
                }
            } else {      
                if (productModel.attributes.productType === "multiple_customised_bulbs") {  
                    _.each(objjs, function (objoptions) {
                        var optv = productModel.get('options').get(objoptions.attributeFQN);
                        if (optv.attributes.attributeFQN === eleopt) {
                            optv.unset("value");
                        }
                    });
                    if(optin){
                        vproduct = $.grep(this.virtualCart, function(a){ return a.productCode == pid; });  
                        $(vproduct[0].configuredOptions).each(function(i,j){
                            if(j.attributeFQN === eleopt){
                                 vproduct[0].configuredOptions.splice(i, 1);
                            }
                        }); 
                    }
                } else {
                    _.each(objjs, function (objoptions) {
                        var optv = productModel.get('options').get(objoptions.attributeFQN);
                        if (optv.attributes.attributeFQN === eleopt) {
                            optv.unset("value");
                        }  
                    });
                    if(optin){
                        vproduct = $.grep(this.virtualCart, function(a){ return a.productCode == pid; });  
                        $(vproduct[0].configuredOptions).each(function(i,j){
                            if(j.attributeFQN === eleopt){
                                 vproduct[0].configuredOptions.splice(i, 1);
                            }
                        }); 
                    }
                }
            }
        },   
          
        
        filterCategory: function(e){
            e.preventDefault();
            $('[mz-qo-category-filtering]').toggleClass('active');
            $('.mz-qo-cart-filter').toggleClass('active');
            if($('[mz-qo-category-filtering]').hasClass('active')){
            $('[mz-qo-category-filtering-container]').slideDown();
            }else{
                $('[mz-qo-category-filtering-container]').slideUp();
            }
        },
        
        toggleCategory: function(e){
            if(!require.mozuData("pagecontext").isMobile){    
                var cid = e.currentTarget.getAttribute('mz-qo-id-toggle-cntrl');
                if(e.currentTarget.checked){
                    $('[mz-qo-id-toggle="'+cid+'"]').slideDown();
                }else{
                    $('[mz-qo-id-toggle="'+cid+'"]').slideUp();
                }
            }
        },
        toggleMobCategoy: function(e){
            if(require.mozuData("pagecontext").isMobile){    
                var checklist = $(e.currentTarget).parents('.mz-qo-category-filtering-container').find('.mz-qo-catfilt-checkbox');
                $(checklist).each( function(k,v){
                    var cid = v.getAttribute('mz-qo-id-toggle-cntrl');
                    if(v.checked){
                        $('[mz-qo-id-toggle="'+cid+'"]').slideDown();
                    }else{
                        $('[mz-qo-id-toggle="'+cid+'"]').slideUp();
                    }
                });
                this.filterCategory(e);
            } 
        },
        clearCategory: function(e){
            if(require.mozuData("pagecontext").isMobile){    
                var checklist = $(e.currentTarget).parents('.mz-qo-category-filtering-container').find('.mz-qo-catfilt-checkbox');
                $(checklist).each( function(k,v){
                    if(!v.checked){
                        $(v).prop('checked', true);
                    }
                });
            }
        },
        
        deleteFromVirtualCart: function(e){  
            var meThis = this;
            var invs,stock;
            var id=$(e.currentTarget).attr('prcode');
            var val=$(e.currentTarget).attr('options');
            var selit = $(e.currentTarget).parents('#mz-qo-category-collection').find('[mz-select-prcode="'+id+'"]');
            var item = _.find(meThis.virtualCart, function(a){ return (a.productCode == id)&&(a.options==val); });
            if(item)
            {
                var htm=selit.children('[options'+id+'="'+val+'"]');
                var productModels = $.grep(meThis.products, function(e){ return e.id == id; });    
                var productModel = productModels[0];
                if(item.variationProductCode){
                    stock = parseInt(selit.find("#"+item.variationProductCode+"").val());
                    invs =  stock + item.quantity;
                    selit.find("#"+item.variationProductCode+"").val(invs);
                }else{  
                    invs = item.quantity; 
                    stock = parseInt(selit.attr("inventoryvalue"));
                    var updateinv = stock + invs;
                    selit.attr("inventoryvalue", updateinv);
                    if(htm){ 
                        htm.attr("inventory", "0");
                    }
                }
                meThis.virtualCart.splice(meThis.virtualCart.indexOf(item),1);
                meThis.updateSubtotal(); 
                var quant = parseInt(selit.attr("sumquant"));
                var adquant = (quant - item.quantity)>0?(quant - item.quantity):0;
                selit.attr("sumquant",adquant);
                htm.find('[mz-product-quantity="'+id+'"]').removeAttr('quantity');
                htm.find('[mz-product-quantity="'+id+'"]').removeAttr('deletequant', "0"); 
                htm.find('[mz-product-quantity="'+id+'"]').val(0);
                htm.find('.mz-quantity span').text('00.00');
                var len=productModel.attributes.options.length;
                var length;
                if(len==1){
                    htm.remove(); 
                    length = selit.find('.options-content').length;
                    if(length === 0){
                        selit.parent().find("[showconfigoptionwindow]").trigger("click");    
                    }
                }
                else{
                    if(len>1){
                        htm.remove();   
                        length = selit.find('.options-content').length;
                        if(length === 0){
                            selit.parent().find("[showconfigoptionwindow]").trigger("click");    
                        }
                    }
                }
                
                $(e.currentTarget).parents(".modal").hide();
            }
        },
        
        updateSubtotal: function(){
            var meThis = this;
            var total = 0;
            $('[mz-qo-cart-subtotal] span')[0].innerHTML = '$'+total.toFixed(2);
            $(meThis.virtualCart).each(function(k,v){
                total += v.total;
                $('[mz-qo-cart-subtotal] span')[0].innerHTML = '$'+total.toFixed(2);
            });
        },
        
        /**
         * Save previous values
         * Delete element and data from virtual cart
         * Show adding view
         * set previous value saved as selected option
         * SAVE : add item as a new one
         * CANCEL : add item using previous value
        **/
        ColorOptionChange : function(e){    
            var meThis = this;
            var inventory,invent,activeval, prcode = $(e.currentTarget).parents(".choose-finish-option").attr("mz-select-prcode");
            var options = [];
            var optprice=0;
            var color = {}, secopt = {};
            var data = $(e.currentTarget).attr("option-name");
            var productModels = $.grep(meThis.products, function(e){ return e.id == prcode; });    
            var productModel = productModels[0];
            var backOrdermess = Hypr.getLabel('backOrder');  
            var ssb = _.findWhere(productModel.attributes.properties, {attributeFQN: "tenant~backorder-date"});
            $('[loader="'+prcode+'"]').show();
            if(data === "tenant~color"){
                activeval = $(e.currentTarget).find(".color-span").attr("color_data");
                color.attributeFQN = $(e.currentTarget).parents(".options-content").find(".mz-color-attribute").find(".active-color").parents(".color-swatches-icon").attr("data-mz-color-option"); 
                color.value =  activeval;
                $(e.currentTarget).parents(".color_block").find(".active-color-text").text(activeval); 
                invent = $(e.currentTarget).attr("inventory");
                varcod = $(e.currentTarget).attr("productCode");
            }else{
                color.attributeFQN = $(e.currentTarget).parents(".options-content").find(".mz-color-attribute").find(".active-color").parents(".color-swatches-icon").attr("data-mz-color-option"); 
                color.value =  $(e.currentTarget).parents(".options-content").find(".mz-color-attribute").find(".active-color").attr("color_data");
            }
            options.push(color);  
            optvals = $(e.currentTarget).parents(".qo-options-container").find(".mz-customdrop"); 
            extraopt = $(e.currentTarget).parents(".qo-options-container").find(".select-option").length;   
            if(optvals.length > 0){
                
                secopt.value  = optvals.find("select").val();   
                secopt.attributeFQN =  optvals.find("select").attr("data-mz-product-option");    
                options.push(secopt);   
                var option = $(e.currentTarget).parents(".choose-finish-option").find('#variationinventory').find("."+color.value+"-"+secopt.value);
                if(option.length > 0){
                    $('[loader="'+prcode+'"]').hide();
                    optprice = parseInt(option.attr("price"));
                    inventory = parseInt(option.val()); 
                    vprcode = option.attr("id");
                    var catopi = parseInt($(document).find('#'+vprcode+'cartp').val());
                    var inv = catopi?(inventory-catopi):inventory;
                    if(inv > 0){
                        if(data === "tenant~color"){
                            $(e.currentTarget).parents(".mz-color-attribute").find(".active-color").removeClass("active-color");
                            $(e.currentTarget).find(".color-span").addClass("active-color");
                        }
                        meThis.configure($(e.currentTarget),prcode);        
                    }else{
                        $(document).find('.alert_modal').show();    
                    }
                }else{
                    if(color.value !== undefined){
                        if(secopt.value !== null){ 
                            Api.request("post","/api/commerce/catalog/storefront/products/"+prcode+"/configure?includeOptionDetails=true",{options:options}).then(function(response){
                                $('[loader="'+prcode+'"]').hide();
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
                                if((response.inventoryInfo.outOfStockBehavior === "AllowBackOrder")&&(response.inventoryInfo.onlineStockAvailable === 0)){
                                    if(ssb){  
                                        var sbb = ssb.values[0].value.split("Discontinued");
                                        if(sbb.length >1){ 
                                            $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").html(ssb.values[0].value);
                                        }else{
                                           $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").html(backOrdermess+"Expected By:"+ssb.values[0].value);
                                        }
                                    }else{
                                       $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").html(backOrdermess);
                                    }
                                    $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").fadeIn(500);
                                }else{
                                    $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").html('');
                                    $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").fadeOut(500);    
                                }
                                if(response.inventoryInfo.outOfStockBehavior === "AllowBackOrder"){
                                    inventory = 10000;
                                }else{
                                    inventory = response.inventoryInfo.onlineStockAvailable;
                                }
                                var catopi = parseInt($(document).find('#'+response.variationProductCode+'cartp').val());
                                var inv = catopi?(inventory-catopi):inventory;
                                if(inv > 0){    
                                    if(data === "tenant~color"){
                                        $(e.currentTarget).parents(".mz-color-attribute").find(".active-color").removeClass("active-color");
                                        $(e.currentTarget).find(".color-span").addClass("active-color");
                                    }
                                    $(e.currentTarget).parents(".choose-finish-option").find('#variationinventory').append("<input type='hidden' id='"+response.variationProductCode+"' class='"+color.value+"-"+secopt.value+"'   price='"+optprice+"' name='hiddeninventory' value='"+inv+"'/>");  
                                    meThis.configure($(e.currentTarget),prcode);     
                                }else{
                                    if(data === "tenant~color"){
                                        
                                    }else{
                                        optvals.find("select").val(optvals.find("select").attr("selopt"));   
                                    }
                                    $(document).find('.alert_modal').show();    
                                }
                            });  
                        }else{  
                            if(data === "tenant~color"){
                                $(e.currentTarget).parents(".mz-color-attribute").find(".active-color").removeClass("active-color");
                                $(e.currentTarget).find(".color-span").addClass("active-color");
                            }
                            var newValue = $(e.currentTarget).parent().find(".color-swatches-icon").find(".active-color").attr("color_data"),
                            oldValue,
                            id = $(e.currentTarget).data('mz-color-option'),
                            vvalue =  $(e.currentTarget).data('mz-color-option'),
                            optionEl = $(e.currentTarget)[0],
                            isPicked = true;
                            productModels = $.grep(meThis.products, function(e){ return e.id == prcode; });    
                            productModel = productModels[0];
                            var optionsc = productModel.get('options').get(id); 
                            var variants = productModel.attributes.variations;
                            $(variants).each(function(a,b){
                                if(a === 0){
                                    oldValue = optionsc.get('value');
                                    if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                                        optionsc.set('value', newValue);
                                    }
                                }    
                            });
                            $('[loader="'+prcode+'"]').hide();  
                        }       
                    }else{
                        $(document).find('.pr_error').find(".change-error").text('Please provide following required information: Color.');
                        $(document).find('.pr_error').show();
                        optvals.find("select").val(optvals.find("select").find("option:first").val());
                        $('[loader="'+prcode+'"]').hide();  
                    }   
                }    
            }else{
                
                _.each(productModel.attributes.variations, function(a){
                    if(a.options[0].value === color.value){
                        if((a.inventoryInfo.outOfStockBehavior === "AllowBackOrder")&&(a.inventoryInfo.onlineStockAvailable === 0)){
                            if(ssb){
                                var sbb = ssb.values[0].value.split("Discontinued");
                                if(sbb.length >1){
                                    $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").html(ssb.values[0].value);
                                }else{
                                   $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").html(backOrdermess+"Expected By:"+ssb.values[0].value);
                                }
                            }else{
                               $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").html(backOrdermess);
                            }
                            $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").fadeIn(500);
                        }else{
                            $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").hide();
                            $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").html('');
                        }
                    }
                });  
                var ss = $(e.currentTarget).parents(".choose-finish-option").find("#"+varcod+"").length;
                if(ss > 0){
                   var sval = $(e.currentTarget).parents(".choose-finish-option").find("#"+varcod+"").val();
                   var squant = parseInt($(e.currentTarget).parents(".options-content").find(".quant-price-sec").find(".mz-product-quantity").val());
                    if(sval >= squant){     
                       $(e.currentTarget).parents(".mz-color-attribute").find(".active-color").removeClass("active-color");
                        $(e.currentTarget).find(".color-span").addClass("active-color");
                        meThis.configure($(e.currentTarget),prcode);            
                    }else{
                        $(document).find('.alert_modal').show(); 
                    }
                }else{
                    var catopis = parseInt($(document).find('#'+varcod+'cartp').val());
                    var invc = catopis?(invent-catopis):invent;
                    if(invc > 0){
                        $(e.currentTarget).parents(".mz-color-attribute").find(".active-color").removeClass("active-color");
                        $(e.currentTarget).find(".color-span").addClass("active-color");
                        meThis.configure($(e.currentTarget),prcode);            
                    }else{
                        $(document).find('.alert_modal').show(); 
                    }
                }    
                $('[loader="'+prcode+'"]').hide();
            }
        },
        onQuantityChange: function(e){     
            //event.stopPropagation();
            var qval, vprcode, event = e;
            var pid = $(e.currentTarget).parent().find('input[mz-product-quantity]').attr("mz-product-quantity");
            var inventory, curinventory,oldquantity,currentVal1,q,optionsval,oldquant;
            var addval, meThis = this;
            var classval = $(e.currentTarget).val();
            var delquant = parseInt($(e.currentTarget).attr("deletequant"));
            var coloroptvis = $(e.currentTarget).parents(".options-content").find(".mz-color-attribute").length;
            var typ = e.type;
            var curval = parseInt($(e.currentTarget).val());  
            var exces = $(e.currentTarget).parents(".choose-finish-option").attr("exceptioncase");
            var colorsval = $(e.currentTarget).parents(".choose-finish-option").find("#variationinventory").length;
            var item, cartopi, virtualcart;
            var coption = $(e.currentTarget).parents('.options-content').find('[data-mz-product-option]').attr("data-mz-product-option");  
            var activecval = $(e.currentTarget).parents(".options-content").find(".mz-color-attribute").find(".active-color").attr("color_data");
            var optvals = $(e.currentTarget).parents(".qo-options-container").find(".mz-customdrop").find("select").val();   
            if(colorsval > 0){
                vprcode = $(e.currentTarget).parents(".choose-finish-option").find('#variationinventory').find("."+activecval+"-"+optvals).attr("id"); 
                addval = $(e.currentTarget).parents(".options-content").attr("addvalue");
                cartopi = parseInt($(document).find('#'+vprcode+'cartp').val());
                inventory = parseInt($(e.currentTarget).parents(".choose-finish-option").find('#variationinventory').find("#"+vprcode+"").val());  
                if(addval){
                    curinventory = inventory;
                }else{
                    curinventory = cartopi? (inventory - cartopi) : inventory;   
                }
                $(e.currentTarget).parents(".choose-finish-option").find('#variationinventory').find("#"+vprcode+"").val(curinventory);
            }else{
                if(coloroptvis > 0){
                    vprcode = $(e.currentTarget).parents('.options-content').find(".mz-color-attribute").find(".active-color").parents(".color-swatches-icon").attr("productCode");
                    addval = $(e.currentTarget).parents('.options-content').find(".mz-color-attribute").find(".active-color").parents(".color-swatches-icon").attr("addvalue");
                    cartopi = parseInt($(document).find('#'+vprcode+'cartp').val());
                    inventory = parseInt($(e.currentTarget).parents(".choose-finish-option").find("#"+vprcode+"").val());  
                    if(addval){  
                        curinventory = inventory;
                    }else{
                        curinventory = cartopi? (inventory - cartopi) : inventory;   
                    }
                    $(e.currentTarget).parents(".choose-finish-option").find("#"+vprcode+"").val(curinventory);
                }else{    
                    if((coption == "tenant~color") || (coption == "tenant~lead-wire") || (coption == "tenant~size") || (coption == "tenant~color-temperature-option") ){
                        vprcode = $(e.currentTarget).parents('.options-content').find('[data-mz-product-option]').find(":selected").attr("productCode");
                        addval = $(e.currentTarget).parents('.options-content').find('[data-mz-product-option]').find(":selected").attr("addvalue");
                        cartopi = parseInt($(document).find('#'+vprcode+'cartp').val());
                        inventory = parseInt($(e.currentTarget).parents(".choose-finish-option").find("#"+vprcode+"").val());  
                        if(addval){
                            curinventory = inventory;
                        }else{
                            curinventory = cartopi? (inventory - cartopi) : inventory;   
                        }
                       
                        $(e.currentTarget).parents(".choose-finish-option").find("#"+vprcode+"").val(curinventory);
                    }
                    else{    
                        addval = $(e.currentTarget).parents('.choose-finish-option').attr("addvalue");
                        cartopi = parseInt($(document).find('#'+pid+'cartp').val());
                        inventory = parseInt($(e.currentTarget).parents('.choose-finish-option').attr("inventoryvalue")); 
                        if(addval){
                            curinventory = inventory;
                        }else{
                            curinventory = cartopi? (inventory - cartopi) : inventory;   
                        }
                    }
                }
            }
            var productModels = $.grep(meThis.products, function(e){ return e.id == pid; });    
            var productModel = productModels[0];
            var variants = productModel.attributes.variations;
            if(typ == "keyup"){
                if (event.keyCode == 46 || event.keyCode == 9 || event.keyCode == 8 || event.keyCode == 27 || event.keyCode == 13 || (event.keyCode == 65 && event.ctrlKey === true) || (event.keyCode >= 35 && event.keyCode <= 39)||(event.keyCode >= 48 && event.keyCode <= 57)||(event.keyCode >= 96 && event.keyCode <= 105)){
                        var curvalue = $(e.currentTarget).parents('.options-content').find('.mz-quantity span').text();
                        oldquantity= parseInt($(e.currentTarget).attr('quantity'));
                       
                        var curinv;
                        if(exces === "0"){
                            curinv = parseInt($(e.currentTarget).parents('.options-content').attr("inventory"));
                        }else{
                            if(vprcode){
                                if(coloroptvis > 0){
                                    curinv = parseInt($(e.currentTarget).parents('.options-content').find(".mz-color-attribute").find(".active-color").parents(".color-swatches-icon").attr("inventory"));
                                }else{
                                    curinv = parseInt($(e.currentTarget).parents('.options-content').find('[data-mz-product-option]').find(":selected").attr("inventory"));    
                                }
                            }
                            else{
                                curinv = parseInt($(e.currentTarget).parents('.options-content').attr("inventory"));    
                            }    
                        }
                        q = curval<1?0:curval;
                        if(isNaN(curval)){
                            
                        } 
                        else{
                            if(q===0){
                                optionsval = $(e.currentTarget).parents('.options-content').attr("options"+pid);
                                oldquantity= $(e.currentTarget).attr('quantity');
                                item = _.find(meThis.virtualCart, function(a){ return (a.productCode == pid)&&(a.options==optionsval); });
                                if(item){
                                    virtualcart = { id: pid, options: optionsval, value:curvalue, quantity:oldquantity };
                                    $(e.currentTarget).parents('#mz-qo-category-collection').find('[mz-qo-delete-modal]').empty();
                                    $(e.currentTarget).parents('#mz-qo-category-collection').find('[mz-qo-delete-modal]').append(Hypr.getTemplate('modules/quick-order-delete-view').render({model:virtualcart}));
                                    $(e.currentTarget).parents('#mz-qo-category-collection').find('[mz-qo-delete-modal]').show();
                                }
                                else{
                                    
                                }
                            }
                            else{
                                if(q == oldquantity){
                                    
                                }
                                else{
                                    var v = curinventory + curinv;
                                    if(variants){
                                        $(variants).each(function(a,b){
                                            if(b.productCode == vprcode){ 
                                                if(( v > 0)&&(v >= q)){
                                                    meThis.setQuantity(pid,q,$(e.currentTarget));     
                                                }
                                                else{
                                                    $(e.currentTarget).val(delquant);
                                                    $(document).find('.alert_modal').show();
                                                }
                                            }    
                                        });    
                                    } 
                                    else{
                                        if((v > 0)&&(v >= q)){
                                            meThis.setQuantity(pid,q,$(e.currentTarget));     
                                        }else{
                                            $(e.currentTarget).val(delquant);
                                            if(isNaN(oldquantity)){
                                                $(e.currentTarget).val(0);
                                            }
                                            $(document).find('.alert_modal').show();    
                                        }
                                    }    
                                }
                            }
                        }    
                        
                }else {
                    // If it's not a number stop the keypress
                    if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 )) {
                        event.preventDefault(); 
                    }   
                }
            }  
            else{
                var cid = e.currentTarget.getAttribute('field');   
                var currentVal = parseInt($(e.currentTarget).parent().find('input[name='+cid+']').val());  
                var qn = currentVal<1?0:currentVal;
                var $ele = $(e.currentTarget);
                if(classval == "+"){
                   if(variants){
                        $(variants).each(function(a,b){
                            if(b.productCode == vprcode){
                                if(curinventory > 0){
                                    if (!isNaN(currentVal)) {
                                    // Increment
                                    $ele.parent().find('input[name='+cid+']').val(currentVal + 1);    
                                    } else {
                                        // Otherwise put a 0 there
                                        $ele.parent().find('input[name='+cid+']').val(0);   
                                    }
                                    currentVal1 = parseInt($ele.parent().find('input[name='+cid+']').val());
                                    q = currentVal1<1?0:currentVal1;
                                   
                                    meThis.setQuantity(pid,q,$ele);     
                                }
                                else{
                                    $(document).find('.alert_modal').show();
                                }
                            }    
                        });    
                    } 
                    else{
                        if(curinventory > 0){
                            if (!isNaN(currentVal)) {
                            // Increment
                            $ele.parent().find('input[name='+cid+']').val(currentVal + 1);    
                            } else {
                                // Otherwise put a 0 there
                                $ele.parent().find('input[name='+cid+']').val(0);   
                            }
                            currentVal1 = parseInt($ele.parent().find('input[name='+cid+']').val());
                            q = currentVal1<1?0:currentVal1;
                           
                            meThis.setQuantity(pid,q,$ele);     
                        }else{
                            $(document).find('.alert_modal').show();    
                        }
                    }
                }else{
                    if(classval == "-"){
                        qval = currentVal - 1;
                        if(qval===0){
                            optionsval = $(e.currentTarget).parents('.options-content').attr("options"+pid);
                            item = _.find(meThis.virtualCart, function(a){ return (a.productCode == pid)&&(a.options==optionsval); });
                            if(item){
                                virtualcart = { id: pid, options: optionsval };
                                $(e.currentTarget).parents('#mz-qo-category-collection').find('[mz-qo-delete-modal]').empty();
                                $(e.currentTarget).parents('#mz-qo-category-collection').find('[mz-qo-delete-modal]').append(Hypr.getTemplate('modules/quick-order-delete-view').render({model:virtualcart}));
                                $(e.currentTarget).parents('#mz-qo-category-collection').find('[mz-qo-delete-modal]').show();
                            }
                            else{
                                
                            }
                        }else{
                            if (!isNaN(currentVal) && currentVal > 0) {
                                // Increment
                                $(e.currentTarget).parent().find('input[name='+cid+']').val(currentVal - 1);  
                                currentVal1 = parseInt($(e.currentTarget).parent().find('input[name='+cid+']').val());
                                q = currentVal1<1?0:currentVal1;
                                meThis.setQuantity(pid,q,$(e.currentTarget)); 
                            } else {
                                // Otherwise put a 0 there
                            }       
                        }
                        
                    }
                }
            }  
        }, 
        
        setQuantity: function(pid,q,e){   
            var prl,price,activecval,optvals,meThis = this; 
            var productModels = $.grep(meThis.products, function(e){ return e.id == pid; });    
            var productModel = productModels[0];
            if(q!==0){
                productModel.set({'quantity':q});
            }
            var vpr = e.parents(".options-content").attr("options"+pid);
            var len = productModel.attributes.options.length;
            if(len === 0){
                prl = productModel.get('price');
                price = (prl.attributes.salePrice)?prl.attributes.salePrice:prl.attributes.price;
            }else{
                if(vpr){
                    var vproduct = $.grep(meThis.virtualCart, function(a){ return (a.productCode == pid)&&(a.options == vpr);  }); 
                    if(vproduct.length === 0){
                        prl = productModel.get('price');  
                        if(prl.attributes.price !== undefined){
                            price = (prl.attributes.salePrice)?prl.attributes.salePrice:prl.attributes.price;
                        }else{
                            prl = productModel.get('priceRange');
                            price = (prl.attributes.lower.attributes.salePrice)?prl.attributes.lower.attributes.salePrice:prl.attributes.lower.attributes.price;
                        } 
                    }else{
                        price = vproduct[0].price; 
                    }
                }else{
                    prl = productModel.get('price');
                    price = (prl.attributes.salePrice)?prl.attributes.salePrice:prl.attributes.price;
                }
            }
            var updatePrice = price * q;
            e.parents('.options-content').find(".mz-quantity span").text(updatePrice.toFixed(2));
            if(q!==0){
                e.parents('.choose-finish-option').attr("addvalue", "yes");
                e.parents('.options-content').find('[mz-product-quantity="'+pid+'"]').attr("quantity",q);
                e.parents('.options-content').find('[mz-product-quantity="'+pid+'"]').attr("deletequant",q);
                meThis.addToQuickOrder(e); 
            }
        },
        
        toggleDetails: function(e){
            e.preventDefault();
            var catId = e.currentTarget.getAttribute('mz-qo-id');
            var topval=$(e.currentTarget).offset();
            var top;
            top=topval.top-142;
            $(window).scrollTop(top);  
            $('[mz-qo-id="'+catId+'"]').toggleClass('active');  
            if($('[mz-qo-id="'+catId+'"]').hasClass('active')){
                if($('[mz-qo-p-id="'+catId+'"]')[0].children.length>0){
                    $('[mz-qo-p-id="'+catId+'"]').slideDown();     
                }else{
                    Api.request("get","api/commerce/carts/current/items").then(function(response){
                        
                        $(response.items).each(function(key,val){
                            var code = (val.product.variationProductCode)? val.product.variationProductCode : val.product.productCode;
                            var searchcode = $(document).find("#cartdiv").find("#"+code+"cartp").length;
                            if(searchcode > 0){
                                var add = (parseInt($(document).find("#cartdiv").find("#"+code+"cartp").val())) + (parseInt(val.quantity));
                                $(document).find("#cartdiv").find("#"+code+"cartp").val(add);
                            }
                            else{
                                $('#cartdiv').append("<input type='hidden' id='"+code+"cartp'  name='cartvalues' value='"+val.quantity+"'/>");        
                            }
                        });
                    });
                    this.fetchProducts(catId);
                }
            }else{
                $('[mz-qo-p-id="'+catId+'"]').slideUp();
            } 
        },
        
        //Make Product Search API to fetch the products in category Id
        fetchProducts: function(id){
            $('.preloader').show();
            var serviceurl = '/api/commerce/catalog/storefront/productsearch/search/?startIndex=0&pageSize=200&filter=(categoryId+eq+'+id+')and(tenant~hide-product+eq+false)';
            var meThis = this;
            
            Api.request('GET',serviceurl).then(function(productslist){
                if(productslist.items.length === 0){    
                    $('[mz-qo-p-id="'+id+'"]').append("<p>No products available in this category.</p>");
                }
                else{
                    $(productslist.items).each(function(key,val){ 
                        var tempflag=false; 
                        if(val.options){
                            $(val.options).each(function(index,info){
                               if(info.isRequired && info.values.length == 1 && info.values[0].deltaPrice < 1 ){
                                   
                               }else{
                                   tempflag=true; 
                               } 
                            });
                        }else{ 
                            tempflag=true; 
                        }
                        if(!tempflag){
                                
                            val.crvalid=true;
                            
                        }else{
                            val.crvalid=false;
                        }
                        if(val.variations){
                            if(val.variations.length > 0){
                                val.backorderprd =false;      
                            }else if((val.inventoryInfo.onlineStockAvailable === 0)&&(val.inventoryInfo.outOfStockBehavior === "AllowBackOrder")){  
                                val.backorderprd =true;   
                            }
                        }else{  
                            if((val.inventoryInfo.onlineStockAvailable === 0)&&(val.inventoryInfo.outOfStockBehavior === "AllowBackOrder")){  
                                val.backorderprd =true;   
                            }          
                        }
                        
                        meThis.products.push(new ProductModels.Product(val));
                        if(val.content.productImages.length > 0){ 
                            val.productImage = val.content.productImages[0].imageUrl;
                        }
                        $('[mz-qo-p-id="'+id+'"]').append(Hypr.getTemplate('modules/quick-order-product').render({model:val}));
                    });
                }
                $('[mz-qo-p-id="'+id+'"]').slideDown();
                $('[mz-qo-title-loader="'+id+'"]').hide();
                $('.preloader').hide();
            }); 
            
        },
        
        addToQuickOrder: function(e){
            var cond = 0;
            var config = 0;
            var configuredProperties, invs,stock,catopi,value,pq,updateinv,message;
            var colorsval = e.parents(".choose-finish-option").find("#variationinventory").length;
            activecval = e.parents(".options-content").find(".mz-color-attribute").find(".active-color").attr("color_data");
            optvals = e.parents(".qo-options-container").find(".mz-customdrop").find("select").val();   
            if(colorsval > 0){
                qvprcode = e.parents(".choose-finish-option").find('#variationinventory').find("."+activecval+"-"+optvals).attr("id"); 
            }else{
                if(activecval){
                     qvprcode = e.parents('.options-content').find(".mz-color-attribute").find(".active-color").parents(".color-swatches-icon").attr("productCode");    
                }else{
                    qvprcode = e.parents('.options-content').find('[data-mz-product-option]').find(":selected").attr("productCode");        
                }
            }
            var pid = e.attr('product-code'), vprcode, meThis = this;
            var optionval = e.parents('.options-content').attr("options"+pid);
            $('[loader="'+pid+'"]').show();
            var PRODUCTS = $.grep(meThis.products, function(a){ return a.id == pid; });    
            var PRODUCT = PRODUCTS[0];
            var configuredOptions = PRODUCT.getConfiguredOptions();
            var availableOptions = PRODUCT.get('options').models;
            if(PRODUCT.attributes.crvalid){
                var optdata = PRODUCT.get('options').models;
                $(optdata).each(function(i,j){  
                     j.attributes.value = j.attributes.values[0].value;
                });
                configuredOptions = PRODUCT.getConfiguredOptions();
                e.parents('.options-content').attr("options"+pid, 0);
                optionval = e.parents('.options-content').attr("options"+pid);
            }  
            var isConfiguredAllRequiredOptions = true, optionsNeedTobConfigured = [];
            $(availableOptions).each(function(key,val){
                if(val.get('isRequired')){
                    var opt = $.grep(configuredOptions,function(b){
                        return b.attributeFQN == val.get('attributeFQN');
                    });
                    if(opt.length === 0){
                        isConfiguredAllRequiredOptions = false;   
                        optionsNeedTobConfigured.push(val);
                    }
                }    
            });
            if(meThis.virtualCart.length === 0){ 
                if(isConfiguredAllRequiredOptions){
                    $(configuredOptions).each(function(k,v){
                        var opt = $.grep(availableOptions,function(b){
                            return b.get('attributeFQN') == v.attributeFQN;
                        });
                        if(opt.length>0){
                            configuredOptions[k].label = opt[0].get('attributeDetail').name;
                        }
                    });  
                    configuredProperties = {
                        id                      : 0,
                        variationProductCode    : qvprcode,
                        quantity                : PRODUCT.get('quantity'),
                        productCode             : PRODUCT.get('productCode'),
                        configuredOptions       : configuredOptions,
                        availableOptions        : availableOptions,
                        price                   : PRODUCT.get('price').get('salePrice') === undefined ? PRODUCT.get('price').get('price') : PRODUCT.get('price').get('salePrice'),
                        total                   : 0
                    };
                    if(optionval){
                        configuredProperties.options = optionval;   
                    }
                    configuredProperties.total = configuredProperties.quantity *configuredProperties.price;
                    configuredProperties.id = Date();
                    //check for variations
                    if(qvprcode){
                        if(colorsval > 0){
                            e.parents(".options-content").attr("inventory", PRODUCT.get('quantity'));
                            stock = parseInt(e.parents(".choose-finish-option").find('#variationinventory').find("."+activecval+"-"+optvals).val());
                            invs =  stock - PRODUCT.get('quantity');
                            e.parents(".choose-finish-option").find('#variationinventory').find("."+activecval+"-"+optvals).val(invs);
                        }else{
                            if(e.parents('.options-content').find(".mz-color-attribute").length > 0){
                                e.parents('.options-content').find(".mz-color-attribute").find(".active-color").parents(".color-swatches-icon").attr("inventory", PRODUCT.get('quantity'));              
                                stock = parseInt(e.parents(".choose-finish-option").find("#"+qvprcode+"").val());
                                invs =  stock - PRODUCT.get('quantity');
                                e.parents(".choose-finish-option").find("#"+qvprcode+"").val(invs);
                            }else{
                                e.parents('.options-content').find('[data-mz-product-option]').find(":selected").attr("inventory", PRODUCT.get('quantity'));
                                stock = parseInt(e.parents(".choose-finish-option").find("#"+qvprcode+"").val());
                                invs =  stock - PRODUCT.get('quantity');
                                e.parents(".choose-finish-option").find("#"+qvprcode+"").val(invs);
                            }
                        }
                    }else{
                        invs = PRODUCT.get('quantity'); 
                        e.parents('.options-content').attr("inventory", invs);
                        catopi = parseInt($(document).find('#'+pid+'cartp').val());
                        value = catopi? catopi : 0;
                        pq = e.parents('.choose-finish-option').find('.options-content');
                        $(pq).each(function(k,v){
                        value += parseInt($(v).attr('inventory'));
                        });
                        e.parents('.choose-finish-option').attr("sumquant", value);
                        updateinv = PRODUCT.get('inventoryInfo').onlineStockAvailable - value; 
                        e.parents('.choose-finish-option').attr("inventoryvalue", updateinv);
                    }     
                    meThis.virtualCart.push(configuredProperties);
                    meThis.updateSubtotal();
                }else{
                    message = "";
                    $(optionsNeedTobConfigured).each(function(k,v){
                        message += message===""?v.get('attributeDetail').name:','+v.get('attributeDetail').name;
                    });
                    $(document).find('.pr_error').find(".change-error").text('Please provide following required information '+message);
                    $(document).find('.pr_error').show();
                }
            }
            else{
                var vproduct = $.grep(meThis.virtualCart, function(a){ return a.productCode == pid; });    
                if(vproduct.length > 0){
                    if(optionval){
                        var virproduct = $.grep(meThis.virtualCart, function(a){ return (a.productCode == pid)&&(a.options == optionval); });    
                        if(virproduct.length > 0){
                            $(virproduct).each(function(k,v){ 
                                //check for variations
                                if(v.variationProductCode){
                                    if(colorsval > 0){
                                        e.parents(".options-content").attr("inventory", PRODUCT.get('quantity'));
                                        stock = parseInt(e.parents(".choose-finish-option").find("#"+v.variationProductCode+"").val());
                                        invs =  stock - (PRODUCT.get('quantity') - v.quantity);
                                        e.parents(".choose-finish-option").find("#"+v.variationProductCode+"").val(invs);
                                    }else{
                                        if(e.parents('.options-content').find(".mz-color-attribute").length > 0){
                                            e.parents('.options-content').find(".mz-color-attribute").find(".active-color").parents(".color-swatches-icon").attr("inventory", PRODUCT.get('quantity'));              
                                            stock = parseInt(e.parents(".choose-finish-option").find("#"+v.variationProductCode+"").val());
                                            invs =  stock - (PRODUCT.get('quantity') - v.quantity);
                                            e.parents(".choose-finish-option").find("#"+v.variationProductCode+"").val(invs);
                                        }else{
                                            e.parents('.options-content').find('[data-mz-product-option]').find(":selected").attr("inventory", PRODUCT.get('quantity'));
                                            stock = parseInt(e.parents(".choose-finish-option").find("#"+v.variationProductCode+"").val());
                                            invs =  stock - (PRODUCT.get('quantity') - v.quantity);
                                            e.parents(".choose-finish-option").find("#"+v.variationProductCode+"").val(invs);
                                        }
                                    }
                                }else{
                                    invs = PRODUCT.get('quantity'); 
                                    e.parents('.options-content').attr("inventory", invs);
                                    catopi = parseInt($(document).find('#'+pid+'cartp').val());
                                    value = catopi? catopi : 0;
                                    pq = e.parents('.choose-finish-option').find('.options-content');
                                    $(pq).each(function(k,v){
                                    value += parseInt($(v).attr('inventory'));
                                    });
                                    e.parents('.choose-finish-option').attr("sumquant", value);
                                    var updateinv = PRODUCT.get('inventoryInfo').onlineStockAvailable - value;
                                    e.parents('.choose-finish-option').attr("inventoryvalue", updateinv);
                                }
                                v.quantity = PRODUCT.get('quantity');
                                v.total = v.quantity * v.price;
                                meThis.updateSubtotal();
                                return false;
                            });    
                        }else{
                           //create with new options 
                           if(isConfiguredAllRequiredOptions){
                                $(configuredOptions).each(function(k,v){
                                    var opt = $.grep(availableOptions,function(b){
                                        return b.get('attributeFQN') == v.attributeFQN;
                                    });
                                    if(opt.length>0){
                                        configuredOptions[k].label = opt[0].get('attributeDetail').name;
                                    }
                                });
                                configuredProperties = {
                                    id                      : 0,
                                    variationProductCode    : qvprcode,
                                    quantity                : PRODUCT.get('quantity'),
                                    productCode             : PRODUCT.get('productCode'),
                                    configuredOptions       : configuredOptions,
                                    availableOptions        : availableOptions,
                                    price                   : PRODUCT.get('price').get('salePrice') === undefined ? PRODUCT.get('price').get('price') : PRODUCT.get('price').get('salePrice'),
                                    total                   : 0
                                };
                                if(optionval){
                                    configuredProperties.options = optionval;   
                                }
                                configuredProperties.total = configuredProperties.quantity *configuredProperties.price;
                                configuredProperties.id = Date();
                                meThis.virtualCart.push(configuredProperties);
                                meThis.updateSubtotal();
                                //check for variations
                                if(qvprcode){
                                    if(colorsval > 0){
                                        e.parents(".options-content").attr("inventory", PRODUCT.get('quantity'));
                                        stock = parseInt(e.parents(".choose-finish-option").find('#variationinventory').find("."+activecval+"-"+optvals).val());
                                        invs =  stock - PRODUCT.get('quantity');
                                        e.parents(".choose-finish-option").find('#variationinventory').find("."+activecval+"-"+optvals).val(invs);
                                    }else{
                                        if(e.parents('.options-content').find(".mz-color-attribute").length > 0){
                                            e.parents('.options-content').find(".mz-color-attribute").find(".active-color").parents(".color-swatches-icon").attr("inventory", PRODUCT.get('quantity'));              
                                            stock = parseInt(e.parents(".choose-finish-option").find("#"+qvprcode+"").val());
                                            invs =  stock - PRODUCT.get('quantity');
                                            e.parents(".choose-finish-option").find("#"+qvprcode+"").val(invs);
                                        }else{
                                            e.parents('.options-content').find('[data-mz-product-option]').find(":selected").attr("inventory", PRODUCT.get('quantity'));
                                            stock = parseInt(e.parents(".choose-finish-option").find("#"+qvprcode+"").val());
                                            invs =  stock - PRODUCT.get('quantity');
                                            e.parents(".choose-finish-option").find("#"+qvprcode+"").val(invs);
                                        }
                                    }
                                }else{
                                    invs = PRODUCT.get('quantity'); 
                                    e.parents('.options-content').attr("inventory", invs);
                                    catopi = parseInt($(document).find('#'+pid+'cartp').val());
                                    value = catopi? catopi : 0;
                                    pq = e.parents('.choose-finish-option').find('.options-content');
                                    $(pq).each(function(k,v){
                                    value += parseInt($(v).attr('inventory'));
                                    });
                                    e.parents('.choose-finish-option').attr("sumquant", value);
                                    updateinv = PRODUCT.get('inventoryInfo').onlineStockAvailable - value; 
                                    e.parents('.choose-finish-option').attr("inventoryvalue", updateinv);
                                }   
                            }else{
                                message = "";
                                $(optionsNeedTobConfigured).each(function(k,v){
                                    message += message===""?v.get('attributeDetail').name:','+v.get('attributeDetail').name;
                                });
                                $(document).find('.pr_error').find(".change-error").text('Please provide following required information '+message);
                                $(document).find('.pr_error').show();
                            }
                        }
                    }else{
                        $(vproduct).each(function(k,v){
                            if(v.configuredOptions.length === 0){
                                //check for variations
                                if(v.variationProductCode){
                                    if(colorsval > 0){
                                        e.parents(".options-content").attr("inventory", PRODUCT.get('quantity'));
                                        stock = parseInt(e.parents(".choose-finish-option").find("#"+v.variationProductCode+"").val());
                                        invs =  stock - (PRODUCT.get('quantity') - v.quantity);
                                        e.parents(".choose-finish-option").find("#"+v.variationProductCode+"").val(invs);
                                    }else{
                                        if(e.parents('.options-content').find(".mz-color-attribute").length > 0){
                                            e.parents('.options-content').find(".mz-color-attribute").find(".active-color").parents(".color-swatches-icon").attr("inventory", PRODUCT.get('quantity'));              
                                            stock = parseInt(e.parents(".choose-finish-option").find("#"+v.variationProductCode+"").val());
                                            invs =  stock - (PRODUCT.get('quantity') - v.quantity);
                                            e.parents(".choose-finish-option").find("#"+v.variationProductCode+"").val(invs);           
                                        }else{
                                            e.parents('.options-content').find('[data-mz-product-option]').find(":selected").attr("inventory", PRODUCT.get('quantity'));
                                            stock = parseInt(e.parents(".choose-finish-option").find("#"+v.variationProductCode+"").val());
                                            invs =  stock - (PRODUCT.get('quantity') - v.quantity);
                                            e.parents(".choose-finish-option").find("#"+v.variationProductCode+"").val(invs);
                                        }
                                    }
                                }else{
                                    invs = PRODUCT.get('quantity'); 
                                    e.parents('.options-content').attr("inventory", invs);
                                    catopi = parseInt($(document).find('#'+pid+'cartp').val());
                                    value = catopi? catopi : 0;
                                    pq = e.parents('.choose-finish-option').find('.options-content');
                                    $(pq).each(function(k,v){
                                    value += parseInt($(v).attr('inventory'));
                                    });
                                    e.parents('.choose-finish-option').attr("sumquant", value);
                                    updateinv = PRODUCT.get('inventoryInfo').onlineStockAvailable - value;
                                    e.parents('.choose-finish-option').attr("inventoryvalue", updateinv);
                                }
                                v.quantity = PRODUCT.get('quantity');
                                v.total = v.quantity * v.price; 
                                meThis.updateSubtotal();
                                return false;    
                            }
                        });    
                    }    
                }else{
                    //create new if no product in virtual cart 
                    if(isConfiguredAllRequiredOptions){
                        $(configuredOptions).each(function(k,v){
                            var opt = $.grep(availableOptions,function(b){
                                return b.get('attributeFQN') == v.attributeFQN;
                            });
                            if(opt.length>0){
                                configuredOptions[k].label = opt[0].get('attributeDetail').name;
                            }
                        });
                        configuredProperties = {
                            id                      : 0,
                            variationProductCode    : qvprcode,
                            quantity                : PRODUCT.get('quantity'),
                            productCode             : PRODUCT.get('productCode'),
                            configuredOptions       : configuredOptions,
                            availableOptions        : availableOptions,
                            price                   : PRODUCT.get('price').get('salePrice') === undefined ? PRODUCT.get('price').get('price') : PRODUCT.get('price').get('salePrice'),
                            total                   : 0
                        }; 
                        if(optionval){
                            configuredProperties.options = optionval;   
                        }
                        configuredProperties.total = configuredProperties.quantity *configuredProperties.price;
                        configuredProperties.id = Date();
                        meThis.virtualCart.push(configuredProperties);
                        meThis.updateSubtotal();
                        //check for variations
                        if(qvprcode){
                            if(colorsval > 0){
                                e.parents(".options-content").attr("inventory", PRODUCT.get('quantity'));
                                stock = parseInt(e.parents(".choose-finish-option").find('#variationinventory').find("."+activecval+"-"+optvals).val());
                                invs =  stock - PRODUCT.get('quantity');
                                e.parents(".choose-finish-option").find('#variationinventory').find("."+activecval+"-"+optvals).val(invs);
                            }else{
                                if(e.parents('.options-content').find(".mz-color-attribute").length > 0){
                                    e.parents('.options-content').find(".mz-color-attribute").find(".active-color").parents(".color-swatches-icon").attr("inventory", PRODUCT.get('quantity'));              
                                    stock = parseInt(e.parents(".choose-finish-option").find("#"+qvprcode+"").val());
                                    invs =  stock - PRODUCT.get('quantity');
                                    e.parents(".choose-finish-option").find("#"+qvprcode+"").val(invs);            
                                }else{
                                    e.parents('.options-content').find('[data-mz-product-option]').find(":selected").attr("inventory", PRODUCT.get('quantity'));
                                    stock = parseInt(e.parents(".choose-finish-option").find("#"+qvprcode+"").val());
                                    invs =  stock - PRODUCT.get('quantity');
                                    e.parents(".choose-finish-option").find("#"+qvprcode+"").val(invs);
                                }
                            }
                        }else{
                            invs = PRODUCT.get('quantity'); 
                            e.parents('.options-content').attr("inventory", invs);
                            catopi = parseInt($(document).find('#'+pid+'cartp').val());
                            value = catopi? catopi : 0;
                            pq = e.parents('.choose-finish-option').find('.options-content');
                            $(pq).each(function(k,v){
                            value += parseInt($(v).attr('inventory'));
                            });
                            e.parents('.choose-finish-option').attr("sumquant", value);
                            updateinv = PRODUCT.get('inventoryInfo').onlineStockAvailable - value; 
                            e.parents('.choose-finish-option').attr("inventoryvalue", updateinv);
                        }    
                    }else{
                        message = "";
                        $(optionsNeedTobConfigured).each(function(k,v){
                            message += message===""?v.get('attributeDetail').name:','+v.get('attributeDetail').name;
                        });
                        $(document).find('.pr_error').find(".change-error").text('Please provide following required information '+message);
                        $(document).find('.pr_error').show();
                    }
                }          
            }  
            $('[loader="'+pid+'"]').hide();
        },   
        
        addAllToCart: function(PRODUCT, pid){ 
            var meThis = this, addedCount = 0;
            $('.preloader').show();
            if(meThis.virtualCart.length>0){
                meThis.addToCart(meThis.virtualCart[addedCount],addedCount);
            }else{
                $(document).find('.pr_error').find(".change-error").text('Please Add at least one product to cart!');
                $(document).find('.pr_error').show();
                $('.preloader').hide();
            }
        },
        
        
        addToCart: function(v,addedCount){
            var meThis = this;
            var EliminateProduct=Hypr.getThemeSetting("nothanks");
             Api.get('product', v.productCode).then(function(sdkProduct) {
                var PRODUCT = new ProductModels.Product(sdkProduct.data);
                PRODUCT.set({'quantity':v.quantity});
                $(v.configuredOptions).each(function(key,val){
                    var option = PRODUCT.get('options').get(val.attributeFQN);
                    if(val.value!=EliminateProduct){ 
                        option.set('value', val.value);
                    }else{
                        if(option.get("value")!==undefined){
                            option.unset("value");
                        }
                    }
                });
                
                PRODUCT.addToCart(1);
                
                PRODUCT.on('addedtocart', function(attr) {  
                    
                    $('.mz-qo-logging-loader').find('section').append('<p>'+attr.data.product.name+' is added to cart.</p>');
                    CartMonitor.update();
                    addedCount++;
                    if(addedCount === meThis.virtualCart.length){
                        $('[mz-qo-product-virtual-preview]').empty();
                        $('[mz-qo-product-cart-wish]').hide();
                        $('[mz-qo-product-options]').show();
                        meThis.virtualCart = [];
                        setTimeout(function(){ $('.mz-qo-logging-loader').hide(); }, 1500);
                        window.location.href = require.mozuData("pagecontext").secureHost+"/cart";
                    }else{
                        meThis.addToCart(meThis.virtualCart[addedCount],addedCount);
                    }
                });
                Api.on('error', function (badPromise, xhr, requestConf) {
                   
                    $('.preloader').hide(); 
                
                    var pos, open = $(document).find("[mz-select-prcode='"+meThis.virtualCart[0].productCode+"']").parents(".mz-qo-products").attr("style");
                    if(open == "display: none;"){
                        $(document).find("[mz-select-prcode='"+meThis.virtualCart[0].productCode+"']").parents(".mz-qo-category").find("[mz-qo-id]").trigger("click");
                        $(document).find("[mz-select-prcode='"+meThis.virtualCart[0].productCode+"']").parents(".mz-qo-product-details").css("border", "1px solid #cc0c0c");
                        pos = $(document).find("[mz-select-prcode='"+meThis.virtualCart[0].productCode+"']").parents(".mz-qo-product-details").offset().top;
                        $(window).scrollTop(pos-142);
                    }else{
                        $(document).find("[mz-select-prcode='"+meThis.virtualCart[0].productCode+"']").parents(".mz-qo-product-details").css("border", "1px solid #cc0c0c");
                        pos = $(document).find("[mz-select-prcode='"+meThis.virtualCart[0].productCode+"']").parents(".mz-qo-product-details").offset().top;
                        $(window).scrollTop(pos-142);
                    }
                    if(badPromise.message.indexOf('limited quantity') != -1){ 
                        badPromise.message= Hypr.getLabel('insufficientinventory');
                    }
                    var erroHtml = "<ul class='is-showing mz-errors'><li>" + badPromise.message + "<li>";
                    
                    $("body").find(".mz-messagebarmodel").html(erroHtml); 
                    $('.mz-messagebarmodel').show();
                });
            });    
        },
        productOPtionChange:function(obj,value){
            var t = Api.context.tenant;
            var s = Api.context.site;
            var filepath=""+require.mozuData("sitecontext").cdnPrefix+"/cms/"+s+"/files/";
            var $target = value;
            var loadimgsrc =""+filepath+"/loading-small-flat.gif";
            var loadimg = "<img src=" + loadimgsrc + "></img>";
            $(obj).closest(".mz-productoptions-valuecontainer").find(".img-slot").html(loadimg); 
            var imgsrc = ""; 
            if ($target != "None" &&  $(obj).attr("option-type")!="Option") {
                Api.get('product', $target).then(function(sdkProduct) {
                    
                    if (sdkProduct.data.content.productImages.length > 0) {
                        imgsrc = sdkProduct.data.content.productImages[0].imageUrl;
                    } else {
                        imgsrc = ""+filepath+"nooption.png";
                    }
                    var imghtml = "<img src=" + imgsrc + "></img>";
                    obj.closest(".mz-productoptions-valuecontainer").find(".img-slot").html(imghtml);
                });
            }else{   
                imgsrc = ""+filepath+"nooption.png"; 
                var imaghtml = "<img src=" + imgsrc + "></img>";
                obj.closest(".mz-productoptions-valuecontainer").find(".img-slot").html(imaghtml);
            }    
        },
        onOptionChange: function (e) { 
            var meThis = this;
            var pid = e.currentTarget.getAttribute('product-code');
            var obj=$(e.currentTarget);  
            var productModels = $.grep(meThis.products, function(e){ return e.id == pid; });    
            var productModel = productModels[0];
            
            var descr = $(e.currentTarget).attr("description");
            if((productModel.attributes.variations)&&(obj.attr("option-type") === "Option")){
                var backOrdermess = Hypr.getLabel('backOrder');  
                var ssb = _.findWhere(productModel.attributes.properties, {attributeFQN: "tenant~backorder-date"});
                if(productModel.attributes.variations.length > 0){
                    var pvrc = $(obj).find(":selected").attr("productcode");
                    var vdata = _.findWhere(productModel.attributes.variations, {productCode: pvrc });
                    
                    if((vdata.inventoryInfo.outOfStockBehavior === "AllowBackOrder")&&(vdata.inventoryInfo.onlineStockAvailable === 0)){
                        if(ssb){  
                            var sbb = ssb.values[0].value.split("Discontinued");
                            if(sbb.length >1){ 
                                $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").html(ssb.values[0].value);
                            }else{
                               $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").html(backOrdermess+"Expected By:"+ssb.values[0].value);
                            }
                        }else{  
                           $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").html(backOrdermess);
                        }
                        $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").fadeIn(500);
                    }else{
                        $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").hide();
                        $(e.currentTarget).parents(".mz-qo-product-details").find(".backorder-message").html('');
                            
                    }  
                }      
            }      
            if(descr){  
                if($(window).width() < 768){ 
                    $(obj).parents(".option-container").find(".description-mobile").each(function(){
                       $(this).html(""); 
                    });
                    $(obj).parents(".options").find(".description-mobile").html(descr);
                }else{
                    $(obj).parents(".option-container").next().html(descr);    
                } 
            }    
            return this.configure($(e.currentTarget),pid);
        },
        
        configure: function ($optionEl,pid) {        
            var EliminateProduct=Hypr.getThemeSetting("nothanks");   
            var meThis = this;  
            var exces = $optionEl.parents(".choose-finish-option").attr("exceptioncase");
            var cinventory, vprcode, inventory,curinv, oldsel,first,sec,hidinv,addv,newValue,oldValue,id,vvalue,optionEl,isPicked,selquant,selvarintv,oldselquant,newquan,newinforold,oldselpcode;
            var coloroptvis = $optionEl.parent().find(".color-swatches-icon").find(".active-color").attr("color_data");
            if(exces === "0"){
                oldselpcode = $optionEl.parents(".options-content").attr("oldvarcode");       
            }else{
                if(coloroptvis !== undefined){   
                    oldselpcode = $optionEl.parents(".options-content").find(".mz-color-attribute").attr("seloptpdcode");    
                }else{
                    oldselpcode = $optionEl.attr("seloptpdcode");        
                }
            }
            if(coloroptvis !== undefined){     
                selvarintv = $optionEl.parents('.options-content').find('[data-mz-color-option]').attr("data-mz-color-option");
                addv = $optionEl.parents(".options-content").find("[data-mz-product-option='"+selvarintv+"']").attr("addvalue");
            }else{
                if(exces === "0"){
                    selvarintv = $optionEl.parents('.options-content').find('[data-mz-product-option]').attr("data-mz-product-option");    
                    addv = $optionEl.parents(".options-content").attr("addvalue");
                }else{
                    selvarintv = $optionEl.parents('.options-content').find('[data-mz-product-option]').attr("data-mz-product-option");    
                    addv = $optionEl.parents(".options-content").find("[data-mz-product-option='"+selvarintv+"']").find(":selected").attr("addvalue");    
                }
            }
            if(exces === "0"){
                first = $optionEl.parents(".options-content").find(".mz-color-attribute").find(".active-color").attr("color_data");
                sec = $optionEl.parents(".qo-options-container").find(".mz-customdrop").find("select").val();
                vprcode = $optionEl.parents(".choose-finish-option").find('#variationinventory').find("."+first+"-"+sec).attr("id");
                hidinv = $optionEl.parents(".choose-finish-option").find('#variationinventory').find("#"+vprcode+"").length;
            }else{
                if(coloroptvis !== undefined){   
                    vprcode = $optionEl.attr("productCode");
                    hidinv = $optionEl.parents(".choose-finish-option").find("#"+vprcode+"").length;
                    addv = $optionEl.parents(".options-content").find(".mz-color-attribute").find(".active-color").parents(".color-swatches-icon").attr("addvalue");
                }else{
                    vprcode = $optionEl.parents(".options-content").find("[data-mz-product-option='"+selvarintv+"']").find(":selected").attr("productCode");
                    hidinv = $optionEl.parents(".choose-finish-option").find("#"+vprcode+"").length;   
                    addv = $optionEl.parents(".options-content").find("[data-mz-product-option='"+selvarintv+"']").find(":selected").attr("addvalue");
                }
            }
            if(addv !== "yes"){
                if(exces === "0"){
                    $optionEl.parents(".options-content").attr("oldvarcode", vprcode);
                    $optionEl.parents(".options-content").attr("addvalue", "yes");
                }else{
                    if(coloroptvis !== undefined){     
                        $optionEl.parents(".options-content").find(".mz-color-attribute").find(".active-color").parents(".color-swatches-icon").attr("addvalue", "yes");
                    }else{
                        $optionEl.parents(".options-content").find("[data-mz-product-option='"+selvarintv+"']").find(":selected").attr("addvalue", "yes");        
                    }
                }
            }
            var catopi = parseInt($(document).find('#'+vprcode+'cartp').val());
            var quant = parseInt($optionEl.parents('.options-content').find('input[mz-product-quantity]').val());
            if(hidinv > 0){
                if(exces === "0"){
                    cinventory = parseInt($optionEl.parents(".choose-finish-option").find("#"+vprcode+"").val()); 
                }else{
                    if(coloroptvis !== undefined){     
                        cinventory = parseInt($optionEl.parents(".choose-finish-option").find("#"+vprcode+"").val()); 
                    }else{
                        cinventory = parseInt($optionEl.parents(".choose-finish-option").find("#"+vprcode+"").val());        
                    }
                }
            }else{   
                if(exces === "0"){
                    cinventory = parseInt($optionEl.parents(".choose-finish-option").find("#"+vprcode+"").val()); 
                }else{
                    if(coloroptvis !== undefined){     
                        inventory = parseInt($optionEl.parents(".options-content").find(".mz-color-attribute").find(".active-color").parents(".color-swatches-icon").attr("inventory"));
                        cinventory = catopi? (inventory - catopi) : inventory;
                        selquant = (quant<=cinventory)?(cinventory-quant):cinventory;
                        if(vprcode){ 
                            $optionEl.parents(".choose-finish-option").append("<input type='hidden' id ='"+vprcode+"' name='hiddeninventory' value='"+selquant+"' />");
                        }
                    }else{
                        inventory = parseInt($optionEl.parents(".choose-finish-option").find("[productCode='"+vprcode+"']").attr("inventory"));
                        cinventory = catopi? (inventory - catopi) : inventory;
                        selquant = (quant<=cinventory)?(cinventory-quant):cinventory;
                        if(vprcode){ 
                            $optionEl.parents(".choose-finish-option").append("<input type='hidden' id ='"+vprcode+"' name='hiddeninventory' value='"+selquant+"' />");
                        }
                    }
                }   
            }
            if(coloroptvis !== undefined){    
                newValue = $optionEl.find(".color-span").attr("color_data"),
                oldValue,
                id = $optionEl.data('mz-color-option'),
                vvalue =  $optionEl.data('mz-color-option'),
                optionEl = $optionEl[0], 
                isPicked = true;// jshint ignore:line 
            }else{
                newValue = $optionEl.val(),
                oldValue,
                id = $optionEl.data('mz-product-option'),
                vvalue =  $optionEl.data('mz-product-option'),
                optionEl = $optionEl[0],
                isPicked = (optionEl.type !== "checkbox" && optionEl.type !== "radio") || optionEl.checked;    // jshint ignore:line
            }
            $optionEl.parents('.mz-productoptions-optioncontainer').find('#selectmain').text($optionEl.attr("prnames"));  
            var optin = $optionEl.parents('.options-content').attr("options"+pid);
            var productModels = $.grep(meThis.products, function(e){ return e.id == pid; });    
            var productModel = productModels[0];
            var option = productModel.get('options').get(id); 
            var variants = productModel.attributes.variations;
            if(optin){
                var pModels = $.grep(meThis.virtualCart, function(e){ return (e.productCode == pid)&&(e.options == optin); });  
                $(pModels).each(function(k,v){
                    if(v.options == optin){
                        if (isPicked) {
                            var configuredOptions = v.configuredOptions; 
                            var opt = $.grep(configuredOptions,function(b){
                                return b.attributeFQN == id;
                            });
                            if(variants){ 
                                $(variants).each(function(a,b){ 
                                    if(b.productCode == vprcode){
                                        if((cinventory > 0)&&(cinventory >= quant)){   
                                            //UPDATE INVENTORY FOR LAST ELEMENT
                                            if(oldselpcode !== vprcode){
                                                var oldinvs,newinvsn;
                                                if(exces === "0"){
                                                    oldselquant = parseInt($optionEl.parents(".options-content").attr("inventory"));
                                                    newquan = (oldselquant-quant)<0? 0 : (oldselquant-quant); 
                                                    newinforold = (cinventory - quant);
                                                    $optionEl.parents(".choose-finish-option").find("#"+vprcode+"").val(newinforold);
                                                    oldinvs = parseInt($optionEl.parents(".choose-finish-option").find("#"+oldselpcode+"").val());
                                                    newinvsn = (oldinvs + quant);
                                                    $optionEl.parents(".choose-finish-option").find("#"+oldselpcode+"").val(newinvsn);
                                                    v.variationProductCode = vprcode;
                                                    $optionEl.attr("seloptpdcode", vprcode);
                                                    $optionEl.attr("selopt", newValue); 
                                                }
                                                else{
                                                    oldselquant = parseInt($optionEl.find("[productCode='"+oldselpcode+"']").attr("inventory"));
                                                    newquan = (oldselquant-quant)<0? 0 : (oldselquant-quant); 
                                                    $optionEl.find("[productCode='"+oldselpcode+"']").attr("inventory", newquan);
                                                    $optionEl.find(":selected").attr("inventory", oldselquant);
                                                    newinforold = (cinventory - quant);
                                                    $optionEl.parents(".choose-finish-option").find("#"+vprcode+"").val(newinforold);
                                                    oldinvs = parseInt($optionEl.parents(".choose-finish-option").find("#"+oldselpcode+"").val());
                                                    newinvsn = (oldinvs + quant);
                                                    $optionEl.parents(".choose-finish-option").find("#"+oldselpcode+"").val(newinvsn);
                                                    v.variationProductCode = vprcode;
                                                    if(coloroptvis !== undefined){   
                                                        $optionEl.parents(".options-content").find(".mz-color-attribute").attr("seloptpdcode", vprcode);
                                                        $optionEl.parents(".options-content").find(".mz-color-attribute").attr("selopt", newValue);
                                                    }else{
                                                        $optionEl.attr("seloptpdcode", vprcode);      
                                                        $optionEl.attr("selopt", newValue);
                                                    }     
                                                }
                                            }
                                            if(opt.length > 0){
                                                $(opt).each(function(k,v){
                                                    if(v.attributeFQN == id){  
                                                        v.value = newValue;
                                                    }
                                                });
                                            }else{
                                                var addobj={};
                                                if(option){  
                                                    if(newValue !== "nothanks"){
                                                        oldValue = option.get('value');
                                                        if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                                                            option.set('value', newValue);
                                                        }
                                                        addobj.attributeFQN=id;
                                                        addobj.label=option.attributes.attributeDetail.name;
                                                        addobj.value=newValue;
                                                        v.configuredOptions.push(addobj);
                                                        configuredOptions = v.configuredOptions;     
                                                    }  
                                                }    
                                            }  
                                            
                                            Api.request("post","/api/commerce/catalog/storefront/products/"+pid+"/configure?includeOptionDetails=true&skipInventoryCheck=false",{options:configuredOptions}).then(function(response){
                                                var optprice=0;
                                                if(response.price.salePrice){
                                                    optprice=response.price.salePrice;
                                                }else{
                                                    optprice=response.price.price;
                                                }
                                                v.price = optprice;
                                                v.total = v.price * v.quantity;
                                                var exquan = parseInt($optionEl.parents('.options-content').find("[mz-product-quantity='"+pid+"']").val());
                                                var upval = optprice * exquan;
                                                $optionEl.parents('.options-content').find(".mz-quantity span").text(upval.toFixed(2));
                                                meThis.updateSubtotal(); 
                                            });
                                            if($optionEl.attr('data-mz-product-option') || $optionEl.attr('data-mz-color-option')){
                                                
                                            }else{
                                                meThis.productOPtionChange($optionEl,newValue);    
                                            }
                                        }
                                        else{
                                            if(coloroptvis !== undefined){   
                                                if($optionEl.parents(".options-content").find(".mz-color-attribute").attr("selopt")){
                                                }else{  
                                                }
                                            }else{
                                                if($optionEl.attr("selopt")){
                                                    $optionEl.val($optionEl.attr("selopt"));
                                                }else{
                                                    $optionEl.val($optionEl.find("option:first").val());    
                                                }
                                            }
                                            $(document).find('.alert_modal').show();
                                        }
                                    }    
                                });    
                            }    
                            else{
                                if(opt.length > 0){
                                    $(opt).each(function(k,v){
                                        if(v.attributeFQN == id){  
                                            v.value = newValue;
                                        }
                                    });
                                }else{    
                                    var addobj={};
                                    if(option){    
                                        if(newValue !== "nothanks"){
                                            oldValue = option.get('value');
                                            if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                                                option.set('value', newValue);
                                            }
                                            addobj.attributeFQN=id;
                                            addobj.label=option.attributes.attributeDetail.name;
                                            addobj.value=newValue;
                                            v.configuredOptions.push(addobj);
                                            configuredOptions = v.configuredOptions;     
                                        }
                                    }    
                                }
                                Api.request("post","/api/commerce/catalog/storefront/products/"+pid+"/configure?includeOptionDetails=true",{options:configuredOptions}).then(function(response){
                                    var optprice=0;
                                    if(response.price.salePrice){
                                        optprice=response.price.salePrice;
                                    }else{
                                        optprice=response.price.price;
                                    }
                                    v.price = optprice;
                                    v.total = v.price * v.quantity;
                                    var exquan = parseInt($optionEl.parents('.options-content').find("[mz-product-quantity='"+pid+"']").val());
                                    var upval = optprice * exquan;
                                    $optionEl.parents('.options-content').find(".mz-quantity span").text(upval.toFixed(2));
                                    meThis.updateSubtotal();
                                });
                                meThis.productOPtionChange($optionEl,newValue);
                            }    
                        }     
                    }
                });
            }else{
                if (option) {
                    if (option.get('attributeDetail').inputType === "YesNo") {
                        option.set("value", isPicked);
                    } else if (isPicked) {
                        if(variants){
                            if(vprcode){
                                $(variants).each(function(a,b){
                                    if(b.productCode == vprcode){  
                                        if(cinventory > 0){
                                            if(coloroptvis !== undefined){   
                                                $optionEl.parents(".options-content").find(".mz-color-attribute").attr("seloptpdcode", vprcode);
                                                $optionEl.parents(".options-content").find(".mz-color-attribute").attr("selopt", newValue);
                                            }else{
                                                $optionEl.attr("seloptpdcode", vprcode);
                                                $optionEl.attr("selopt", newValue);
                                            }
                                            oldValue = option.get('value');
                                            if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                                                option.set('value', newValue);
                                            }
                                            if($optionEl.attr('data-mz-product-option') || $optionEl.attr('data-mz-color-option')){
                                                
                                            }else{
                                                meThis.productOPtionChange($optionEl,newValue);    
                                            }
                                        } 
                                        else{
                                            if($optionEl.attr("selopt")){
                                                $optionEl.val($optionEl.attr("selopt"));
                                            }else{
                                                $optionEl.val($optionEl.find("option:first").val());    
                                            }
                                            $(document).find('.alert_modal').show();
                                        }
                                    }    
                                });
                            }    
                            else{   
                                if(newValue === "nothanks"){
                                    if((option.id === "tenant~premium-up") || (option.id === "tenant~down-sconce") || (option.id === "tenant~custom-mr16-bulbs")){
                                        
                                    }else{
                                        oldValue = option.get('value');
                                        if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                                            option.set('value', newValue);
                                        }
                                        meThis.productOPtionChange($optionEl,newValue);
                                    }
                                } else{
                                    oldValue = option.get('value');
                                    if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                                        option.set('value', newValue);
                                    }
                                    meThis.productOPtionChange($optionEl,newValue);
                                }   
                            }    
                        }    
                        else{
                            if(newValue === "nothanks"){
                                if((option.id === "tenant~premium-up") || (option.id === "tenant~down-sconce") || (option.id === "tenant~custom-mr16-bulbs")){
                                    
                                }else{
                                    oldValue = option.get('value');
                                    if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                                        option.set('value', newValue);
                                    }
                                    meThis.productOPtionChange($optionEl,newValue);
                                }
                            } else{
                                oldValue = option.get('value');
                                if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                                    option.set('value', newValue);
                                }
                                meThis.productOPtionChange($optionEl,newValue);
                            } 
                        }
                    }
                }
                //Activate disabled option
                var configuredOptions = productModel.getConfiguredOptions();
                var availableOptions = productModel.get('options').models;
                var isConfiguredAllRequiredOptions = true;
                $(availableOptions).each(function(key,val){
                    if(val.get('isRequired')){
                        var opt = $.grep(configuredOptions,function(b){
                            return b.attributeFQN == val.get('attributeFQN');
                        });
                        if(opt.length === 0){
                            isConfiguredAllRequiredOptions = false;
                        }
                    }    
                });
                if(vprcode){
                    if(cinventory > 0){   
                        if(isConfiguredAllRequiredOptions){
                            $('[mz-qo-finish][product-code="'+pid+'"]').removeClass('disabled');
                        }else{
                            $('[mz-qo-finish][product-code="'+pid+'"]').addClass('disabled');
                        }
                        if(id == selvarintv){
                            var optioncol = $optionEl.parents('.choose-finish-option').find(".mz-productoptions-optioncontainer").length;
                            if(optioncol === 0){
                                $optionEl.parents('.options-content').find('.mz-product-quantity,.qtyplus,.qtyminus').attr("disabled",false);
                                var optcount = $optionEl.parents('.choose-finish-option').find(".options-content").length;
                                if(optcount==1){
                                    $.cookie(pid+"optlength", "0");
                                    $optionEl.parents('.options-content').attr("options"+pid, 0);
                                }else{
                                    var opts= parseInt($.cookie(pid+"optlength"))+1;
                                    $.cookie(pid+"optlength", opts);
                                    $optionEl.parents('.options-content').attr("options"+pid, $.cookie(pid+"optlength"));
                                }
                                setTimeout(function(){
                                    $optionEl.parents('.options-content').find('.qtyplus').trigger("click");
                                }, 1000);
                                $('[mz-qo-product-cart-wish="'+pid+'"]').show();
                            }
                        }
                    }
                }
            }    
        },
         
        /**
         * Update virtual cart item
         * Add preview label
        **/ 
        finish: function(e){
            $(e.currentTarget).parents('.Optioncontainer').addClass('closeContainer');
            $(e.currentTarget).parents('.mz-productoptions-optioncontainer').addClass("closestate");
            var id, pid = $(e.currentTarget).attr('product-code'), meThis = this;
            var PRODUCTS = $.grep(meThis.products, function(a){ return a.id == pid; });    
            var PRODUCT = PRODUCTS[0];
            var configuredOptions = PRODUCT.getConfiguredOptions();
            var availableOptions = PRODUCT.get('options').models;
            var isConfiguredAllRequiredOptions = true, optionsNeedTobConfigured = [];
            
            $(availableOptions).each(function(key,val){
                if(val.get('isRequired')){
                    var opt = $.grep(configuredOptions,function(b){
                        return b.attributeFQN == val.get('attributeFQN');
                    });
                    if(opt.length === 0){
                        isConfiguredAllRequiredOptions = false;
                        optionsNeedTobConfigured.push(val);
                    }
                }     
            });
            if(isConfiguredAllRequiredOptions){
                id = $(e.currentTarget).attr("product-code");
                var optcount = $(e.currentTarget).parents('.choose-finish-option').find(".options-content").length;
                $(e.currentTarget).parents('.options-content').find('.mz-product-quantity,.qtyplus,.qtyminus').attr("disabled",false);
                var opt = $(e.currentTarget).parents('.options-content').attr("options"+id);
                if(opt){
                    
                }else{   
                    if(optcount==1){
                        $.cookie(id+"length", "0");
                        $(e.currentTarget).parents('.options-content').attr("options"+id, 0);  
                    }else{
                        var optss= parseInt($.cookie(pid+"length"))+1;
                        $.cookie(id+"length", optss);
                        $(e.currentTarget).parents('.options-content').attr("options"+id, $.cookie(id+"length"));
                    }
                    $(e.currentTarget).parents('.options-content').find('.qtyplus').trigger("click");    
                }       
            }else{
                var message = "";   
                $(optionsNeedTobConfigured).each(function(k,v){
                    message += message===""?v.get('attributeDetail').name:','+v.get('attributeDetail').name;
                });
                $('[loader="'+pid+'"]').hide();
                $(document).find('.pr_error').find(".change-error").text('Please provide following required information '+message);
                $(document).find('.pr_error').show();
            }
            $('[mz-qo-product-cart-wish="'+id+'"]').show(); 
            $(window).scrollTop($("[loader='"+pid+"']").parent().offset().top); 
            
        },
        /**
         * Show Option Selecting Window
        **/
        showConfigOptionWindow: function(e){
            var meThis = this;
            var pid = e.currentTarget.getAttribute('product-code'); 
            var count = parseInt($(e.currentTarget).attr("count"));
            $(e.currentTarget).attr("count",count+1);
            var productModels = $.grep(meThis.products, function(e){ return e.id == pid; });    
            var productModel = productModels[0];
            productModel.attributes.counts = count;
            var ss = JSON.stringify(productModel.attributes);
            var virtualmod = $.parseJSON(ss);
            $(e.currentTarget).parents(".mz-qo-product-details-container").find('.choose-finish-option').append(Hypr.getTemplate('modules/quick-order-virtual-preview').render({model:virtualmod}));
            $(e.currentTarget).parents(".mz-qo-product-details-container").find('[mz-qo-product-cart-wish="'+pid+'"]').hide();
        }
    }); 
    
    var QOModel  = Backbone.MozuModel.extend({});
    
    // customization bulb
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
                $($target).parents(".customizebulb").next().css("display","none");
                $($target).parents(".customised_view").next().find("button").attr("disabled","disabled");
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
    
    $(document).ready(function () {
        Api.request('GET','/api/commerce/catalog/storefront/categories/tree').then(function(resp) {
            var arrays = resp.items;
            var merged = [];
            merged = flatternCategoryTree(arrays);
            var renderObject = {
                name : "QuickOrderObject",
                items: merged
            };
            var quickOrderView = new QuickOrderView({
                el: $('#mz-qo-category-collection'),
                model: new QOModel(renderObject)
            });
            quickOrderView.render();
        });
        
        var returnArray = [];
        function flatternCategoryTree(arrays){
            for(var i=0; i<1; i++ ){
                returnArray.push(arrays[i]);
                if(arrays[i].childrenCategories.length>0){
                    recursivelyAddCategories(arrays[i].childrenCategories);
                }
            }
            return returnArray;
        }
        
        function recursivelyAddCategories(childrenCategories){
            for(var i=0; i<childrenCategories.length; i++ ){
                returnArray.push(childrenCategories[i]);
                if(notInReturnArray(childrenCategories[i].categoryId) && childrenCategories[i].childrenCategories.length>0){
                    recursivelyAddCategories(childrenCategories[i].childrenCategories);
                }
            }
        }
        
        function notInReturnArray(id){
            var isIt = $.grep(returnArray, function(e){ return e.id == id; });
            if(isIt.length>0) return false;
            return false;
        }
        
        $(document).on("click", ".pdp-image, .pdp-name", function(e) {
            e.preventDefault();
            var link = $(e.currentTarget).attr("href");
            var links = require.mozuData("sitecontext").domains.primary.domainName+link;
            var data = $(e.currentTarget).parents('.mz-qo-category-collection').find(".confirm_modal");
            data.find('#confirm-exit-yes').attr("url",link);
            data.find('#confirm-exit-out-yes').attr("url",links);
            $(e.currentTarget).parents('.mz-qo-category-collection').find(".confirm_modal").show();
        });
        $(document).on("click", "#alert_modal-exit", function(e) {
            $(document).find('.alert_modal').hide();
        });    
        $(document).on("click", "#error_modal-exit", function(e) {
            $(document).find('.pr_error').hide();
        }); 
        $(document).on("click", "body", function(e) {
            $(document).find('.mz-messagebarmodel').hide();
        }); 
        $(document).on("click", ".mz-qo-product-details", function(e) {
            $(this).removeAttr("style");
        });
    });  
});




































