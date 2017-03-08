define(['modules/backbone-mozu', 'hyprlive', 'hyprlivecontext', 'modules/jquery-mozu', 'underscore', 'modules/models-customer', 
'modules/views-paging', 'modules/api', 'modules/models-product', 'modules/soft-cart', "modules/cart-monitor"], 
function(Backbone, Hypr, HyprLiveContext, $, _, CustomerModels, PagingViews, Api, ProductModels, SoftCart, CartMonitor) {

    var EditableView = Backbone.MozuView.extend({  
        constructor: function() {
            Backbone.MozuView.apply(this, arguments);
            this.editing = {};
        },
        getRenderContext: function() {
            var c = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);
            c.editing = this.editing;
            return c;
        },
        doModelAction: function(action, payload) {
            var self = this,
                renderAlways = function() {
                    self.render();
                };  
            var operation = this.model[action](payload);
            if (operation && operation.then) {
                operation.then(renderAlways, renderAlways);
                return operation;
            }   
        } 
    });
 

    var AccountSettingsView = EditableView.extend({
        myaccountStorage: [],
        templateName: 'modules/my-account/my-account-settings',
        autoUpdate: [
            'firstName',
            'lastName',
            'emailAddress',
            'oldPassword',
            'password',
            'confirmPassword',
            "companyOrOrganization",
            'acceptsMarketing'
        ], 
        updateAcceptsMarketing: function(e) {
            var yes = $(e.currentTarget).prop('checked');
            this.model.set('acceptsMarketing', yes);
            this.model.updateAcceptsMarketing(yes);
        },
        startEditName: function(event) {
            event.preventDefault();
            var self = this;
            this.editing.name = true;
            this.render();
            var res = this.$el.find('[data-mz-value]');
            _.each(res, function(re, i) {
                var dataValue = $(re).attr('data-mz-value');
                if ($(re).attr('type') === "text" || $(re).attr('type') === "email") {
                    self.myaccountStorage[$(re).attr('data-mz-value')] = $(re).val();
                } else if ($(re).attr('type') === "checkbox") {
                    self.myaccountStorage[$(re).attr('data-mz-value')] = $(re).is(':checked');
                }

            });
        },
    
        cancelEditName: function() {
            var self = this;
            this.editing.name = false;
            var res = this.$el.find('[data-mz-value]');
            _.each(res, function(re, i) {
                self.model.set($(re).attr('data-mz-value'), self.myaccountStorage[$(re).attr('data-mz-value')]);
            });
            
            this.render();
        },
        finishEditName: function() {
            var self = this;
            var email = self.$el.find('.mz-accountsettings-email');
            var fname = self.$el.find('.mz-accountsettings-firstname');
            var lname = self.$el.find('.mz-accountsettings-lastname');
            $(email).removeClass("input-required");
            $(fname).removeClass("input-required");
            $(lname).removeClass("input-required");
            $(email).parent().find('.validation-accountsettings').html('');
            $(fname).parent().find('.validation-accountsettings').html('');
            $(lname).parent().find('.validation-accountsettings').html('');
            var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            if (fname.val() === '' && lname.val() === "" && email.val() === "" && fname.val() !== undefined && lname.val() !== undefined && email.val() !== undefined) {
                $(email).addClass("input-required");
                $(fname).addClass("input-required");
                $(lname).addClass("input-required");
                $(email).parent().find('.validation-accountsettings').html('Please Enter Email');
                $(fname).parent().find('.validation-accountsettings').html('Please Enter First Name');
                $(lname).parent().find('.validation-accountsettings').html('Please Enter Last Name');
                return false;
            }else if ((!filter.test(email.val()))) {
                
                $(email).addClass("input-required");
                $(email).parent().find('.validation-accountsettings').html('Please Enter Vaild Email');
                return false;
            }else if (fname.val().trim() === '') {
                $(fname).addClass("input-required");
                $(fname).parent().find('.validation-accountsettings').html('Please Enter First Name');
                return false;
            } else if (lname.val().trim() === '') {
                $(lname).addClass("input-required");
                $(lname).parent().find('.validation-accountsettings').html('Please Enter Last Name');
                return false;
            }


            self.doModelAction('apiUpdate').then(function () {
                self.editing.name = false;
                $(event.target).removeAttr('disabled');
            }).otherwise(function () {
               self.editing.name = true;
                $(event.target).removeAttr('disabled');
            }).ensure(function () {
               self.editing.name = false;
               self.render();
           $(event.target).removeAttr('disabled');
            });
            
            $(event.target).attr('disabled','true');
        }, 
        startEditPassword: function() {
            this.editing.password = true;
            this.render();
        },
        finishEditPassword: function() {
            var self = this;
            $("[data-mz-validationmessage-for]").empty(); 
            if( $("[data-mz-value='oldPassword']").val().trim() === "") {
                $("[data-mz-validationmessage-for='oldPassword']").html(Hypr.getLabel('currentPasswordMissing'));
            }else if($("[data-mz-value='password']").val().trim() === "" ){
                $("[data-mz-validationmessage-for='password']").html(Hypr.getLabel('newPasswordMissing')); 

            }else{ 
            this.doModelAction('changePassword').then(function() {
                self.$('[data-mz-validationmessage-for="passwordChanged"]').addClass('success').show().text(Hypr.getLabel('passwordChanged'));
            }, function() {
                self.editing.password = true;
            });
            this.editing.password = false;
        }
        }, 
        cancelEditPassword: function() {
                this.editing.password = false;
                this.render();
            }
           
    });

    var WishListView = EditableView.extend({
        templateName: 'modules/my-account/my-account-wishlist',
        additionalEvents: {
            "keyup #mz-fquantity": "quantityBox",
            "keypress #mz-fquantity": "quantityBox",
            "change #mz-fquantity": "quantityBoxVal"
        },
        
        quantityBox: function(e) {
            var qtyEle = e.target,
                qtyCurrentValue = parseInt($(qtyEle).val());
            
            var qtyMaxValue = (this.model.get("inventoryInfo") ? this.model.get("inventoryInfo").onlineStockAvailable : 999 );
            if( "undefined" == qtyMaxValue || 1 > qtyMaxValue )
            {
                if(this.model.get("inventoryInfo").outOfStockBehavior === "AllowBackOrder")
                {
                    qtyMaxValue = 999;
                }
            }

            if (qtyCurrentValue > qtyMaxValue)
            {
                $(qtyEle).val(1); 
            }
            
            // allow only numbers
            var verified = (e.which === 8 || e.which === undefined || e.which === 0) ? null : String.fromCharCode(e.which).match(/[^0-9]/);
                         if (verified === null) { 
                            
                          }else{
                               $(qtyEle).val($(qtyEle).val().replace(/\D/g, ""));
                              
                          }
            //$(qtyEle).val($(qtyEle).val().replace(/\D/g, ""));
            if ((event.which < 48 || event.which > 57)) {
                event.preventDefault();
            }            
        },
        quantityBoxVal: function(e) {
            var qtyEle = e.target;
            if(parseInt($(qtyEle).val()) === 0 ||  $(qtyEle).val() === "")
            {
                $(qtyEle).val(1);
            }
        },
        addItemToCart: function(e) {
            var stocks, stocksback, self = this,
                $target = $(e.currentTarget),
                id = $target.data('mzItemId'),
                backorder = $target.attr("backorder"),
                backOrdermess = Hypr.getLabel('backOrder');
            if (id) {
                this.editing.added = id;
                var obj=_.findWhere(this.model.get("items").models,{"id":id}),qunaity;
                if(backorder === "yes"){
                    qunaity=parseInt($target.attr("quantity"));  
                }else{
                    qunaity=parseInt($target.closest(".cart-row").find(".mz-carttable-item-qty").find("#mz-fquantity").val());   
                }
                if (isNaN(qunaity) || qunaity < 1 ) {
                    $(target).removeClass("is-processing");
                    return false; 
                } 
                if(obj.attributes.product.attributes.inventory.onlineStockAvailable === 0){
                    stocks = obj.attributes.product.attributes.inventory.onlineStockAvailable;
                    stocksback = obj.attributes.product.attributes.inventory.outOfStockBehavior;
                } else{
                    stocks = obj.attributes.product.attributes.inventoryInfo.onlineStockAvailable;
                    stocksback = obj.attributes.product.attributes.inventoryInfo.outOfStockBehavior;
                }
                if((stocks === 0)&&( stocksback === "AllowBackOrder")&&(backorder !== "yes")){
                    var ss = _.findWhere(obj.attributes.product.attributes.properties, {attributeFQN: "tenant~backorder-date"}),data;
                    if(ss){
                        var sb = ss.values[0].value.split("Discontinued");
                        if(sb.length >1){
                            $($target).parents(".cart-brd").find(".mz-backorder-popup").find(".mz-backorder-content-message").html(ss.values[0].value);
                        }else{
                           $($target).parents(".cart-brd").find(".mz-backorder-popup").find(".mz-backorder-content-message").html(backOrdermess+"Expected By:"+ss.values[0].value);
                        }
                    }else{
                       $($target).parents(".cart-brd").find(".mz-backorder-popup").find(".mz-backorder-content-message").html(backOrdermess);
                    }
                    $($target).parents(".cart-brd").find(".mz-backorder-popup").find("[data-mz-item-id]").attr("data-mz-item-id",id);
                    $($target).parents(".cart-brd").find(".mz-backorder-popup").find("[data-mz-item-id]").attr("quantity",qunaity);
                    $($target).parents(".cart-brd").find(".mz-backorder-popup").fadeIn(500);
                }else{
                    obj.set("quantity",qunaity);
                    SoftCart.update().then(function() {
                        SoftCart.show(); 
                    });  
                    return this.doModelAction('addItemToCart', id);
                }
                
            }
        },
        doNotRemove: function() {
            this.editing.added = false;
            this.editing.remove = false;
            this.render();
        },
        beginRemoveItem: function(e) {
            var self = this;
            var id = $(e.currentTarget).data('mzItemId');
            if (id) {
                this.editing.remove = id;
                this.render();
            }
        },
        render: function(e) {
            var me = this;
            Backbone.MozuView.prototype.render.apply(this);
            
            _.each(this.model.toJSON().items, function(conf, i, obj) {
                var product = {
                    productCode: conf.product.productCode
                };
                if (conf.product.price.salePrice > 0) {
                    
                    if (conf.product.price.salePrice > 0) {
                        var listprice = conf.product.price.price;
                        var quantity = conf.quantity;
                        var newprice = listprice * quantity;
                        var newsaleprice = conf.product.price.salePrice * conf.quantity;
                        var finalprice = ((newprice - newsaleprice) / newprice) * 100;
                        
                        var newfinalprice = Math.round(finalprice * 100) / 100;
                        
                        me.model.get("items").models[i].set("savedamount", newfinalprice);
                        
                    }
                }
                $(".preloader").hide();
                var productApiflag, res = Api.createSync("product", _.extend({}, product));
                res.get().then(function(rea) {
                    me.model.get('items').models[i].get('product').set("inventory", rea.data.inventoryInfo);
                    if (i === me.model.toJSON().items.length - 1) productApiflag = true;
                });
            });
            me.model.on('addedtocart',function(e){
                
                CartMonitor.updateCart();
            });
        },
        finishRemoveItem: function(e) {
            var self = this;
            var id = $(e.currentTarget).data('mzItemId');
            if (id) {
                var removeWishId = id;
                return this.model.apiDeleteItem(id).then(function() {
                    self.editing.remove = false;
                    var itemToRemove = self.model.get('items').where({
                        id: removeWishId
                    });
                    if (itemToRemove) {
                        self.model.get('items').remove(itemToRemove);
                        self.render();
                    }
                });
            }
        }
    });
    //Quick order view 
    var QuickOrderView = Backbone.MozuView.extend({
        templateName: "modules/my-account/my-quickreorder",
        additionalEvents: {
            "keyup .mz-fquantity-reorder": "reoreder_qty",
            "keypress .mz-fquantity-reorder": "reoreder_qty",
            "change .mz-fquantity-reorder": "quantityBoxVal",
            "click .mz-fquantity-reorder" : "reoreder_qty"
        },
        
        virtualArray :[],
        initialize: function() {
               this.listenTo(this.model, "change:pageSize", _.bind(this.model.myAccountChangePageSize, this.model)); 
                this.model.set('pageSize',10);  
            },
        addMultiQuickToCart:function(e){
            e.preventDefault();
            $(target).addClass("is-processing");
            var target = $(e.currentTarget),optionid,
            options = [],
            extraoption = {},
            backorder = target.attr("backorder"),productQuantity;
            if(backorder === "yes"){
                productQuantity=target.attr("quantity");   
            }else{
                productQuantity = target.parent().parent().find('.mz-carttable-qty-field').val();
            }
            var value = parseInt(productQuantity),
            backOrdermess = Hypr.getLabel('backOrder'),
            productCode = target.attr('href');

            if (isNaN(value) || value < 1 ) {
                $('[data-mz-message-bar]').html('<ul class="is-showing mz-errors"><li>Cannot be empty or < 0 </li>'); 
                $('[data-mz-message-bar]').show(); 
                $(target).removeClass("is-processing");
                return false; 
            }

            if (value >= 1 && value < 100000) {
                Api.on('error', function(badPromise, xhr, requestConf) {
                    $('[data-mz-message-bar]').html('<ul class="is-showing mz-errors"><li>' + badPromise.message + '</li>');
                    $('[data-mz-message-bar]').show();
                });
               Api.get('product', productCode).then(function(sdkProduct) {   
                   var product = new ProductModels.Product(sdkProduct.data);
                   optionid =target.attr("attrvalue").split(",");
                    for(var i=0;i<optionid.length;i++){  
                       var temparr=optionid[i].split(":");
                        extraoption.attributeFQN = temparr[0].trim();
                        extraoption.value = temparr[1].trim();
                        options.push({attributeFQN:extraoption.attributeFQN,value:extraoption.value});
                          
                    }
                        Api.request("post","/api/commerce/catalog/storefront/products/"+productCode+"/configure?includeOptionDetails=true",{options:options}).then(function(response){
                             
                            if((response.inventoryInfo.onlineStockAvailable === 0)&&(response.inventoryInfo.outOfStockBehavior === "AllowBackOrder")&&(backorder !== "yes")){
                                var ss = _.findWhere(product.attributes.properties, {attributeFQN: "tenant~backorder-date"}),data;
                                if(ss){
                                    var sb = ss.values[0].value.split("Discontinued");
                                    if(sb.length >1){
                                        $(target).parents(".cart-brd").find(".mz-backorder-popup").find(".mz-backorder-content-message").html(ss.values[0].value);
                                    }else{
                                       $(target).parents(".cart-brd").find(".mz-backorder-popup").find(".mz-backorder-content-message").html(backOrdermess+"Expected By:"+ss.values[0].value);
                                    }
                                }else{
                                   $(target).parents(".cart-brd").find(".mz-backorder-popup").find(".mz-backorder-content-message").html(backOrdermess);
                                }
                                $(target).parents(".cart-brd").find(".mz-backorder-popup").find("[data-mz-item-id]").attr("href",productCode);
                                $(target).parents(".cart-brd").find(".mz-backorder-popup").find("[data-mz-item-id]").attr("quantity",value);
                                $(target).parents(".cart-brd").find(".mz-backorder-popup").find("[data-mz-item-id]").attr("attrvalue",optionid);
                                $(target).parents(".cart-brd").find(".mz-backorder-popup").find("[data-mz-item-id]").attr("data-mz-action","addMultiQuickToCart");
                                $(target).parents(".cart-brd").find(".mz-backorder-popup").fadeIn(500);
                                $(target).removeClass("is-processing");
                            }else{ 
                                
                                product.set('quantity', value);
                                for(var i=0;i<optionid.length;i++){
                                   var temparr=optionid[i].split(":");
                                    product.get('options').get(temparr[0].trim()).set("value",temparr[1].trim());
                                }
                                product.on('addedtocart', function() {
                                   $(target).removeClass("is-processing");
                                   CartMonitor.updateCart(); 
                                });
                                product.addToCart(value); 
                            }
                        });
                });
            } else {  

                $(target).removeClass("is-processing");
                return false;
            }
        }, 
        
       addQuickToCart: function(e) {
            e.preventDefault();  
            $(target).addClass("is-processing");
            var target = $(e.currentTarget),
            backorder = target.attr("backorder"),productQuantity;
            if(backorder === "yes"){
                productQuantity= target.attr("quantity");   
            }else{
                productQuantity = target.parent().parent().find('.mz-carttable-qty-field').val();
            }
            var value = parseInt(productQuantity),
            backOrdermess = Hypr.getLabel('backOrder'),
            productCode = target.attr('href');
            
            
           if (isNaN(value) || value < 1 ) { 
                $(target).removeClass("is-processing"); 
                return false;
            }
            if (value >= 1 && value < 100000) { 
                Api.on('error', function(badPromise, xhr, requestConf) {
                    $('[data-mz-message-bar]').html('<ul class="is-showing mz-errors"><li>' + badPromise.message + '</li>');
                    $('[data-mz-message-bar]').show();
                });
                Api.get('product', productCode).then(function(sdkProduct) {
                    var product = new ProductModels.Product(sdkProduct.data);
                    if((product.attributes.inventoryInfo.onlineStockAvailable === 0)&&(product.attributes.inventoryInfo.outOfStockBehavior === "AllowBackOrder")&&(backorder !== "yes")){
                        var ss = _.findWhere(product.attributes.properties, {attributeFQN: "tenant~backorder-date"}),data;
                        if(ss){
                            var sb = ss.values[0].value.split("Discontinued");
                            if(sb.length >1){
                                $(target).parents(".cart-brd").find(".mz-backorder-popup").find(".mz-backorder-content-message").html(ss.values[0].value);
                            }else{
                               $(target).parents(".cart-brd").find(".mz-backorder-popup").find(".mz-backorder-content-message").html(backOrdermess+"Expected By:"+ss.values[0].value);
                            }
                        }else{
                           $(target).parents(".cart-brd").find(".mz-backorder-popup").find(".mz-backorder-content-message").html(backOrdermess);
                        }
                        $(target).parents(".cart-brd").find(".mz-backorder-popup").find("[data-mz-item-id]").attr("href",productCode);
                        $(target).parents(".cart-brd").find(".mz-backorder-popup").find("[data-mz-item-id]").attr("quantity",value);
                        $(target).parents(".cart-brd").find(".mz-backorder-popup").fadeIn(500);
                        $(target).removeClass("is-processing");
                    }else{     
                        
                        product.set('quantity', value);
                        product.on('addedtocart', function() {
                            $(target).removeClass("is-processing");
                            CartMonitor.updateCart();
                        });

                        product.addToCart(value);
                    }
                });  
            } else {
                $(target).removeClass("is-processing"); 
                return false;
            }
        },
        addcoloroption:function(e){
           e.preventDefault(); 
            var productQuantity, $target = $(e.currentTarget),
                productCode = $target.attr("href"), 
            backorder = $target.attr("backorder");
            if(backorder === "yes"){
                productQuantity = parseInt($target.attr("quantity"));   
            }else{
                productQuantity = parseInt($target.parent().parent().find('.mz-carttable-qty-field').val());
            }
            var backOrdermess = Hypr.getLabel('backOrder');
            Api.get('product', productCode).then(function(sdkProduct) {
                var product = new ProductModels.Product(sdkProduct.data),
                    variantOpt = sdkProduct.data.options,
                    label, options;
                if (variantOpt) {
                    var sel, variantflag = 0;
                    for (var i in variantOpt) { 
                        label = variantOpt[i].attributeDetail.name;  
                            var id = variantOpt[i].attributeFQN,
                            coloroption = Hypr.getThemeSetting('coloroption');
                        if ($.inArray(id, coloroption) > -1) {
                            
                            var oldValue,
                                option = product.get('options').get(id);
                                var newValue="";
                                    newValue = $target.attr('color_value');    
                            if (newValue) {
                                if (option) {
                                    oldValue = option.get('value');
                                    if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                                        option.set('value', newValue);
                                    }
                                }
                                if (variantOpt.length == 1) {   
                                    /* jshint ignore:start */
                                    _.each(sdkProduct.data.variations,function(b){
                                        if(b.options[0].value === $target.attr('color_value')){
                                            if((b.inventoryInfo.outOfStockBehavior === "AllowBackOrder")&&(b.inventoryInfo.onlineStockAvailable === 0)&&(backorder !== "yes")){
                                                var ss = _.findWhere(sdkProduct.data.properties, {attributeFQN: "tenant~backorder-date"}),data;
                                                if(ss){
                                                    var sb = ss.values[0].value.split("Discontinued");
                                                    if(sb.length >1){
                                                        $($target).parents(".cart-brd").find(".mz-backorder-popup").find(".mz-backorder-content-message").html(ss.values[0].value);
                                                    }else{
                                                       $($target).parents(".cart-brd").find(".mz-backorder-popup").find(".mz-backorder-content-message").html(backOrdermess+"Expected By:"+ss.values[0].value);
                                                    }
                                                }else{
                                                   $($target).parents(".cart-brd").find(".mz-backorder-popup").find(".mz-backorder-content-message").html(backOrdermess);
                                                } 
                                                $($target).parents(".cart-brd").find(".mz-backorder-popup").find("[data-mz-item-id]").attr("href",productCode);
                                                $($target).parents(".cart-brd").find(".mz-backorder-popup").find("[data-mz-item-id]").attr("quantity",productQuantity);
                                                $($target).parents(".cart-brd").find(".mz-backorder-popup").find("[data-mz-item-id]").attr("color_value",newValue);
                                                $($target).parents(".cart-brd").find(".mz-backorder-popup").find("[data-mz-item-id]").attr("data-mz-action","addcoloroption");
                                                $($target).parents(".cart-brd").find(".mz-backorder-popup").fadeIn(500);
                                                $($target).removeClass("is-processing");   
                                            }else{
                                                $target.addClass("is-processing");
                                                product.set("quantity",productQuantity);
                                                product.addToCart();
                                                
                                                product.on('addedtocart', function(attr) {
                                                    $target.removeClass("is-processing");
                                                    CartMonitor.updateCart(); 
                                                });
                                                 
                                            }
                                        }   
                                    });
                                    /* jshint ignore:end */  
                                }
                            } else {

                               
                            }
                           

                        } else {
                            variantflag = 1;
                            if (variantOpt[i].attributeDetail.inputType == "List") {
                                sel = '<select class="mz-productoptions-option" data-mz-product-option="' + variantOpt[i].attributeFQN + '">' +
                                    '<option value="">Select ' + variantOpt[i].attributeDetail.name.toLowerCase() + '</option>';
                                for (var j in variantOpt[i].values) {
                                    sel += '<option ' + ((!variantOpt[i].values[j].isEnabled) ? 'class="is-disabled"' : '') + ((variantOpt[i].values[j].isSelected) ? 'selected="true"' : '') + 'value="' + variantOpt[i].values[j].value + '">' + variantOpt[i].values[j].stringValue + ((variantOpt[i].values[j].deltaPrice && variantOpt[i].values[j].deltaPrice > 0) ? '(' + variantOpt[i].values[j].deltaPrice + ' more)' : '') + '</option>';
                                }
                                sel += '</select>';
                            }
                        }
                    }
                    if (variantflag) {
                        var variants = '<div class="mz-productdetail-options mz-l-stack-section"><h4 class="mz-l-stack-sectiontitle">Please choose a ' + label + '</h4></div><div class="mz-productoptions"><div class="mz-productoptions-optioncontainer"><label class="mz-productoptions-optionlabel">' + label + '</label><div class="mz-productoptions-valuecontainer">' + sel + '</div>';
                        var modal = new VariantsModal(product, $target, variants);
                    }
                }
            }); 
        },
        
        
        getRenderContext: function () {
            
            var me =this; 
            var c = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);
            if(c.model.hasNextPage) {
                c.model.allLoaded = 1;
            }else{
                c.model.allLoaded = 2;
            }
            var count =  0;
            var arrayOfDuplicateProducts = [];
            var arrayOfUniqueProducts = [];
            _.each(c.model.items,function(a,b){
                _.each(a.items,function(h,d){
                    count++;
                    var obj = {};
                    obj.pcode = h.product.productCode;
                    obj.options = [];
                    _.each(h.product.options,function(e,f){
                        obj.options.push(e.value);
                    });
                    obj.options.sort();
                    
                    var isThere = _.find(arrayOfUniqueProducts,function(item){
                         return JSON.stringify(item) === JSON.stringify(obj);
                    });
                    if(!isThere){// undefined is not there
                        arrayOfUniqueProducts.push(obj);   
                    }else{// delete
                        arrayOfDuplicateProducts.push(c.model.items[b]);
                        delete c.model.items[b].items[d];
                    }
                });
            });
            
            me.virtualArray=[];
           
            return c;
        }, 
        
        loadMoreItems: function(){
            
            this.model.changePageSize(true);    
        },
        keyUpQty: function(e) {
            var charCode = e.which ? e.which : e.keyCode;
            return true;
        },

        render: function() { 
            var me = this;
            Backbone.MozuView.prototype.render.apply(this);
            $('.mz-carttable-qty-field').bind('cut copy paste', function(e) {
                e.preventDefault();
            }); 
            _.each(this.model.toJSON().items, function(conf, i, obj) {
                
                
                if( conf.items && conf.items.length>0 && conf.items[0].product){
                    var product = {
                        productCode: conf.items[0].product.productCode
                    };   
                    if (conf.items[0].product.price.salePrice > 0) {
                        var listprice = conf.items[0].unitPrice.listAmount;
                        var quantity = conf.items[0].quantity;
                        var newprice = listprice * quantity;
                        var newsaleprice = conf.items[0].unitPrice.saleAmount * conf.items[0].quantity;
                        var finalprice = ((newprice - newsaleprice) / newprice) * 100;
                        
                        var newfinalprice = Math.round(finalprice * 100) / 100;
                            
                        me.model.get("items").models[i].set("savedamount", newfinalprice);
                        
                    }

                }
                
            $(".preloader").hide();
           
                

            });
            $(".quickreorder-preloader").hide();
            $(".mz-quickreorder").show();
            
            $('.mz-fquantity-reorderr').on('keyup', function(event){
                reoreder_qty(event);
            });
            
            $('.mz-fquantity-reorder').on('keypress', function(event){
                reoreder_qty(event);
            });
            
            $('.mz-fquantity-reorder').on('change', function(event){
                quantityBoxVal(event);
            });
                        
        function reoreder_qty(e) {
            
            var qtyEle = e.target,
                qtyCurrentValue = parseInt($(qtyEle).val());
            
            var qtyMaxValue = 999;
            if( "undefined" == qtyMaxValue || 1 > qtyMaxValue )
            {
                if(this.model.get("inventoryInfo").outOfStockBehavior === "AllowBackOrder")
                {
                    qtyMaxValue = 999;
                }
            }

            if (qtyCurrentValue > qtyMaxValue)
            {
                $(qtyEle).val(1);
            }
            
            // allow only numbers
            
              var verified = (e.which === 8 || e.which === undefined || e.which === 0) ? null : String.fromCharCode(e.which).match(/[^0-9]/);
                         if (verified === null) { 
                            
                          }else{
                             $(qtyEle).val($(qtyEle).val().replace(/\D/g, "")); 
                              
                          }  
            
            //$(qtyEle).val($(qtyEle).val().replace(/\D/g, ""));
            if ((event.which < 48 || event.which > 57)) {
                event.preventDefault();
            }            
        }
        function quantityBoxVal(e) {
            var qtyEle = e.target;
            if(parseInt($(qtyEle).val()) === 0 ||  $(qtyEle).val() === "")
            {
                $(qtyEle).val(1);
            }
        }
        }
    });
    //View Quickorder view //
    var OrderHistoryView = Backbone.MozuView.extend({
        templateName: "modules/my-account/order-history-list",
        autoUpdate: [
            'rma.returnType',
            'rma.reason',
            'rma.quantity',
            'rma.comments' 
        ],
        loadMoreItems: function(){
            this.model.changePageSize(true);    
        },
        initialize: function() {   
            if(require.mozuData('pagecontext').pageType === "my_account"){
                this.listenTo(this.model, "change:pageSize", _.bind(this.model.myAccountChangePageSize, this.model)); 
                this.model.set('pageSize',10);     
            }else{
                this.listenTo(this.model, "change:pageSize", _.bind(this.model.changePageSize, this.model));    
            }
        },
        getRenderContext: function() {
            var context = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);
            context.returning = this.returning;
            if(require.mozuData('pagecontext').pageType === "my_account"){
                var obj =this.model.get('items'); 
                if(context.model.hasNextPage) {
                    context.model.allLoaded = 1;
                }else{
                    context.model.allLoaded = 2;
                }
            }
            return context; 
        },
        startReturnItem: function(e) {
            var $target = $(e.currentTarget),
                itemId = $target.data('mzStartReturn'),
                orderId = $target.data('mzOrderId');
            if (itemId && orderId) {
                this.returning = itemId;
                this.model.startReturn(orderId, itemId);
            }
            this.render('startReturn', orderId);
        },
        cancelReturnItem: function(e) {
            delete this.returning;
            this.model.clearReturn();

            var $target = $(e.currentTarget),
                itemId = $target.data('mzStartReturn'),
                orderId = $target.data('.mz-orderrefund');

            this.render('selectreturn', orderId);

        },
        printReciept: function(e){
            var self= this;
            var data = $(e.currentTarget).parents("li").html(); 
            var mywindow = window.open('', 'Reciept', 'height=400,width=600');  
            mywindow.document.write('<html><head><title>Order Reciept</title><link src="https://cdnjs.cloudflare.com/ajax/libs/foundation/6.2.3/foundation.css" rel="stylesheet" />');
            mywindow.document.write('<style>body {font-family: Georgia, serif;} .print-address p{margin: 5px;} .mz-myordercollapse .mz-billinginormation .left-shipping .mz-shippinginformation  p {word-wrap:break-word;}.print-address p {margin-bottom: 0}h1 {font-size: 24px;}.clear{clear:both;}.mz-mobile{display:none;}.mz-orderhistory-section .mz-l-paginatedlist-list{text-align:center}.mz-orderhistory-section .mz-l-paginatedlist-list .mz-orderlist{text-align:left;margin-bottom:20px}.mz-orderhistory-section .mz-l-paginatedlist-list .mz-more-order{padding:8px 15px;font-size:14px;border:0;border-radius:5px;color:#fff;background:#ff0}.mz-orderhistory-section .mz-l-paginatedlist-list .mz-more-order:hover{background:#000}.mz-myordercollapse{border:1px solid #f6f6f6}.mz-myordercollapse .mz-redorderdetails{background:#fcfcfc;font-family:open_sansbold;border:1px solid #f6f6f6}.mz-myordercollapse .mz-redorderdetails.bgclass{background:#fcfcfc!important}.mz-myordercollapse .mz-redorderdetails ul{margin:0;padding:0}.mz-myordercollapse .mz-redorderdetails ul li{display:inline-block;font-size:14px;padding:10px 10px;margin-bottom:0;line-height:1.5em;vertical-align:middle}.mz-myordercollapse .mz-redorderdetails ul li .mz-value{color:initial}.mz-myordercollapse .mz-redorderdetails ul li .mz-name{font-weight:700;text-transform:uppercase}.mz-myordercollapse .mz-redorderdetails ul li.mz-reorder-name{width:5%}.mz-myordercollapse .mz-redorderdetails ul li.mz-reorder-refno{width:25%}.mz-myordercollapse .mz-redorderdetails ul li.mz-reorder-placed{width:20%}.mz-myordercollapse .mz-redorderdetails ul li.mz-reorder-total{width:12%}.mz-myordercollapse .mz-redorderdetails ul li.mz-reorder-status{width:16%}.mz-myordercollapse .mz-redorderdetails ul li.mz-reorder-icon{width:6%}.mz-myordercollapse .mz-redorderdetails ul .mz-namevalue{color:#000;font-size:13px}.mz-myordercollapse .mz-redorderdetails ul .mz-name{color:#979696;font-family:roboto_light;font-size:14px;display:block}.mz-myordercollapse .mz-billinginormation .left-shipping{width:45%;float:left;padding:10px}.mz-myordercollapse .mz-billinginormation .left-shipping.panel-border{width:40%;padding:2%;margin:2%;background:#f6f6f6}.mz-myordercollapse .mz-billinginormation .left-shipping .left-shippingdetails{font-family:roboto_light;border-bottom:1px solid #424242}.mz-myordercollapse .mz-billinginormation .left-shipping .left-shippingdetails span{margin-bottom:6px;font-weight:700;display:inline-block;font-family:roboto_regular;font-size:15px;color:#000}.mz-myordercollapse .mz-billinginormation .left-shipping .mz-shippinginformation{padding:4% 0;font-family:open_sansbold;font-size:14px}.mz-myordercollapse .mz-billinginormation .left-shipping .mz-shippinginformation .mz-shippingaccount{float:left;width:49%;margin:0;font-size:14px}.mz-myordercollapse .mz-billinginormation .left-shipping .mz-shippinginformation .mz-shippingaccount .mz-shippinginformatonship{text-transform:capitalize;min-height:75px;font-size:14px;margin:0;font-family:roboto_light;color:#666;font-weight:700;letter-spacing:1px}.mz-myordercollapse .mz-billinginormation .left-shipping .mz-shippinginformation .mz-shippingaccount .mz-shippinginformatonship2{font-size:14px;margin:0;font-family:roboto_light;color:#666;font-weight:700;letter-spacing:1px}.mz-myordercollapse .mz-billinginormation .left-shipping .mz-shippinginformation .mz-rightinfomation{float:right;text-align:left;width:50%}.mz-myordercollapse .mz-billinginormation .left-shipping .mz-shippinginformation .mz-rightinfomation a{color:#fddb00;text-decoration:underline;font-size:11px;margin:0 3px}.mz-myordercollapse .mz-billinginormation .left-shipping .mz-shippinginformation .mz-rightinfomation p{margin:0;font-size:12px;font-family:sans-serif;font-weight:700}.mz-myordercollapse .mz-billinginormation .left-shipping .mz-shippinginformation .mz-rightinfomation p:first-child{color:#1c1c1c;font-size:12px;margin-bottom:8px}.mz-myordercollapse .mz-billinginormation .left-shipping .mz-shippinginformation .mz-rightinfomation .nocolor{color:initial}.mz-myordercollapse .mz-billinginormation .right-billing{width:45%;float:left;padding:10px}.mz-myordercollapse .mz-billinginormation .right-billing.panel-border{width:40%;padding:2%;margin:2%;background:#f6f6f6}.mz-myordercollapse .mz-billinginormation .right-billing .left-shippingdetails{font-family:roboto_light;border-bottom:1px solid #424242}.mz-myordercollapse .mz-billinginormation .right-billing .left-shippingdetails span{font-weight:700;margin-bottom:6px;display:inline-block;font-family:roboto_light;font-size:15px;color:#1c1c1c}.mz-myordercollapse .mz-billinginormation .right-billing .mz-shippinginformation{padding:4% 0;font-family:roboto_light;font-size:14px}.mz-myordercollapse .mz-billinginormation .right-billing .mz-shippinginformation .mz-shippingaccount{float:left;width:50%;margin:0;font-size:14px}.mz-myordercollapse .mz-billinginormation .right-billing .mz-shippinginformation .mz-shippingaccount .mz-shippinginformatonship{min-height:73px;font-size:14px;margin:0;font-family:roboto_light;color:#666;font-weight:700;letter-spacing:.5px}.mz-myordercollapse .mz-billinginormation .right-billing .mz-shippinginformation .mz-shippingaccount .mz-shippinginformatonship2{font-size:14px;margin:0;font-family:roboto_light;color:#666;font-weight:700;letter-spacing:.5px}.mz-myordercollapse .mz-billinginormation .right-billing .mz-shippinginformation .mz-shippingaccount .mz-shippinginformatonship0{word-wrap: break-word;font-size:14px;margin-bottom:2px;font-family:roboto_light;color:#666;font-weight:700;letter-spacing:.5px}.mz-myordercollapse .mz-billinginormation .right-billing .mz-shippinginformation .mz-rightinfomation{float:right;text-align:left;width:50%}.mz-myordercollapse .mz-billinginormation .right-billing .mz-shippinginformation .mz-rightinfomation p{margin:0;font-size:12px;font-family:sans-serif;font-weight:700;letter-spacing:.5px}.mz-myordercollapse .mz-billinginormation .right-billing .mz-shippinginformation .mz-rightinfomation p:first-child{word-wrap:break-word;font-size:12px;margin-bottom:8px}.mz-myordercollapse .mz-billinginormation .right-billing .mz-shippinginformation .mz-rightinfomation .nocolor{color:initial}.mz-myordercollapse .mz-orderstructure{font-weight:700;padding:15px;clear:both}.mz-myordercollapse .mz-orderstructure p{margin:0;font-family:montserratregular;font-size:15px;color:#1c1c1c;text-transform:uppercase;font-weight:700}.mz-myordercollapse .mz-orderrefund,.mz-myordercollapse .mz-orderrefund .checkbox1 label,.mz-myordercollapse .mz-orderrefund .checkbox2 label{font-size:14px;font-family:montserratregular}.mz-myordercollapse .toggle-icon{width:32px;display:inline-block;background:url(../resources/images/myaccount-icons/plus.svg) no-repeat;text-indent:-9999px;background-size:78%;position:relative;bottom:-5px;height:25px}.mz-myordercollapse .toggle-icon-down{display:none;}.mz-myordercollapse .mz-orderrefund{background:#f3f3f3;float:left;width:100%;border-radius:6px;position:relative;border:4px solid #f3f3f3;top:15px;padding:20px 47px 25px 59px}.mz-myordercollapse .mz-orderrefund .checkbox1 [type=checkbox]:checked+span,.mz-myordercollapse .mz-orderrefund .checkbox2 [type=checkbox]:checked+span{background:#000}.mz-myordercollapse .mz-orderrefund .checkbox1{width:18%;float:left}.mz-myordercollapse .mz-orderrefund .checkbox1 label input{display:none}.mz-myordercollapse .mz-orderrefund .checkbox1 label span{height:10px;width:10px;border:1px solid grey;display:inline-block;margin-right:10px}.mz-myordercollapse .mz-orderrefund .checkbox2{width:18%;float:left}.mz-myordercollapse .mz-orderrefund .checkbox2 label input{display:none}.mz-myordercollapse .mz-orderrefund .checkbox2 label span{height:10px;width:10px;border:1px solid grey;display:inline-block}.mz-myordercollapse .mz-orderrefund .mz-detailsrefund{text-align:left}.mz-myordercollapse .mz-orderrefund .mz-detailsrefund .mz-refundselect{border:1px solid #e8e8e8;background-color:#f7f7f7;width:250px}.mz-myordercollapse .mz-orderrefund .mz-detailsrefund input[type=number]{border:1px solid #e8e8e8;background-color:#f7f7f7;width:93px}.mz-myordercollapse .mz-orderrefund .mz-detailsrefund .mz-textarea textarea{border:1px solid #e8e8e8;background-color:#f7f7f7;width:250px;height:68px}.mz-myordercollapse .mz-orderrefund .mz-detailsrefund .mz-buttons{margin:0 20px;clear:both}.mz-myordercollapse .mz-orderrefund .mz-detailsrefund .mz-accountsave{width:110px;border:none;margin:7px 7px 0 0!important;font-size:12px;font-family:montserratregular;text-transform:uppercase}.mz-myordercollapse .mz-orderrefund .mz-detailsrefund .mz-accountcancel{width:110px;background:#fddb00;color:#fff;border:none;margin-top:5px!important;font-size:12px;font-family:montserratregular;text-transform:uppercase}.mz-myordercollapse .mz-orderrefund .mz-detailsrefund .mz-selectons{float:left;width:36%}.mz-myordercollapse .mz-orderrefund .mz-l-formfieldgroup-cell:first-child{text-align:left}.mz-myordercollapse .mz-orderrefund:after,.mz-myordercollapse .mz-orderrefund:before{bottom:100%;left:15%;border:solid transparent;content:" ";height:0;width:0;position:absolute;pointer-events:none}.mz-myordercollapse .mz-orderrefund:after{border-bottom-color:#f3f3f3;border-width:30px}.mz-myordercollapse .item-listing-block{border-bottom:1px solid #f6f6f6}.mz-myordercollapse .item-listing-block .mz-itemlisting{padding-top:20px}.mz-myordercollapse .item-listing-block .mz-itemlisting .mz-item-price{padding:0 7%}.mz-myordercollapse .item-listing-block .mz-itemlisting .mz-itemlisting-actions{float:none}.mz-myordercollapse .item-listing-block .mz-item-discount{background:#eee;color:#4a4a4a;font-size:12px;padding:10px;margin:1%;text-align:left;font-weight:400}.mz-myordercollapse .item-listing-block .mz-item-discount .mz-item-discountname{display:inline-block;text-align:left;width:77%}.mz-myordercollapse .item-listing-block .mz-item-discount .mz-item-discountamt{display:inline-block;text-align:right;width:20%;color:#4a4a4a}.mz-carttable-item-product .mz-productimage img,.row{max-width:100%}.mz-tablestructure .cart-brd{padding:25px 10px}.mz-tablestructure .cart-brd .cart-section{text-transform:uppercase;font-size:13px;color:#979696;padding:5px 0;border-bottom:1px solid #f6f6f6;border-top:1px solid #f6f6f6}.row{width:100%;margin:0 auto}.text-center{text-align:center}.text-left{text-align:left!important}.large-1{width:8.33333%}.large-2{width:16.66667%}.large-3{width:25%}.large-4{width:33.33333%}.large-5{width:41.66667%}.large-6{width:50%}.large-7{width:58.33333%}.large-8{width:66.66667%}.large-9{width:75%}.large-10{width:83.33333%}.large-11{width:91.66667%}.large-12{width:100%}.large-push-0{position:relative;left:0;right:auto}.columns{position:relative;padding-left:0;padding-right:.0;float:left}.mz-carttable-item-product .mz-productimage{border:1px solid #f3f3f3;-moz-box-shadow:1px 2px 13px #fefefe;-webkit-box-shadow:0 2px 7px #F3F3F3;box-shadow:0 2px 7px #F3F3F3;float:left;margin-right:10px;padding:8px;width:25%}.mz-carttable-item-product .mz-carttable-item-title{font-family:montserratregular;font-size:13px;color:#3f3f3f;text-align:left}.mz-carttable-item-product .option-values .bronze,.mz-carttable-item-product .option-values .mz-finish,.mz-carttable-item-product .option-values .mzcolor-text{display:inline-block;font-size:12px;font-family:montserratregular}.mz-carttable-item-product .mz-itemlisting-description{float:left}.mz-carttable-item-product .option-values{text-align:left}.mz-carttable-item-product .option-values .mz-finish{width:auto}.mz-carttable-item-product .option-values .bronze{height:25px;width:45px;position:relative;top:9px}.mz-carttable-item-product .option-values .mzcolor-text{margin-top:10px;margin-left:10px}.amp-cross{color:#ccc;font-size:14px}.is-saleprice{font-size:16px;color:#000;display:block}.amp-quantityvalue{font-size:14px}.mz-carttable-header-options label{font-size:13px;font-weight:400;color:#979696;text-align:left}.mz-carttable-header-options{margin-top:10px;margin-bottom:10px}.mz-carttable-header-options label span{font-weight:700;color:#000;margin-right:10px}.mz-carttable-item-total .is-crossedout{font-family:montserratregular;font-size:14px;color:#ccc;display:block;margin-left:-15px}.mz-carttable-item-total .savepercent{display:block;font-size:12px;color:#ccc}.mz-carttable-item-total .amp-price{font-family:montserratbold;font-size:16px;color:#fddb00;display:block}.mz-carttable-item-remove{font-family:montserratregular}.mz-carttable-item-remove .mzaccount-remove-item{font-size:14px}.mz-carttable-item-remove .mz-accoutreturn{font-size:10px;border:1.5px solid #b3b3b4;padding:7px;border-radius:6px;font-family:montserratbold;text-transform:uppercase}.mz-carttable-item-remove .mz-accoutreturn a{color:#000}.mz-carttable-item-remove .mz-accoutreturn a:hover{opacity:.7}.mz-carttable-item-remove .mz-accountvalues{width:100%;float:left;border-bottom:1px solid #f6f6f6;margin-top:20px;font-family:montserratregular;font-size:16px;letter-spacing:1px;font-weight:400}.mz-carttable-item-remove .mz-accountvalues .order-comments{float:left;width:45%}.mz-accountvalues h6.heading{margin-top:0;}.mz-carttable-item-remove .mz-accountvalues .order-comments .body{color:#979696;text-align:left;font-size:12px}.mz-carttable-item-remove .mz-accountvalues table{background:0 0;float:right;width:48%;}.mz-carttable-item-remove .mz-accountvalues table tr{background:0 0}.mz-carttable-item-remove .mz-accountvalues table tr td{text-align:left}.mz-carttable-item-remove .mz-accountvalues .mz-accountvaluestd1{color:grey;width:200px;text-align:left}.mz-carttable-item-remove .mz-accountvalues .mz-accountvaluestd1.total{color:initial}.mz-carttable-item-remove .mz-accountvalues .mz-accountvaluestd2{color:grey;width:150px;text-align:right}.mz-carttable-item-remove .mz-accountvalues .mz-accountvaluestd2.total{color:initial}.mz-carttable-item-remove .mz-totalgrandvalue{width:100%;float:left;font-family:montserratregular;font-size:16px;padding:15px 0}.mz-carttable-item-remove .mz-totalgrandvalue .print-reciept{float:left;color:#979696}.mz-carttable-item-remove .mz-totalgrandvalue .print-reciept a{color:grey;text-decoration:underline}.mz-carttable-item-remove .mz-totalgrandvalue table{background:0 0;float:right}.mz-carttable-item-remove .mz-totalgrandvalue .mz-accountvaluestd1{color:grey;width:168px;text-align:left;letter-spacing:1px;font-weight:400}.mz-carttable-item-remove .mz-totalgrandvalue .mz-accountvaluestd1.total{color:initial}.mz-carttable-item-remove .mz-totalgrandvalue .mz-accountvaluestd2{color:grey;width:150px;text-align:right;letter-spacing:1px;font-weight:400}.mz-carttable-item-remove .mz-totalgrandvalue .mz-accountvaluestd2.total{color:initial}.mz-carttable-item-remove .toggle{display:inline-block}.mz-carttable-item-remove .bgclass{background:#fddb00!important}.mz-carttable-item-remove .bordrnone{border:none!important}.mz-carttable-item-remove .mz-validationmessage{top:48px}.mz-carttable-item-remove .mz-returnform-optionalcomments .mz-validationmessage{position:relative;top:0}.mz-itemactionlink{float:right}.mz-itemactionlink .mz-itemlisting-action{font-size:13px;border:1px solid #39393C;color:#343434;padding:4px 6px;border-radius:6px;text-transform:uppercase}.row:before, .row:after {content: " ";display: table;}.item-listing-block{border-bottom:1px solid #f6f6f6}.item-listing-block .mz-itemlisting{padding-top:20px}.item-listing-block .mz-itemlisting .mz-item-price{padding:0 7%}.item-listing-block .mz-itemlisting .mz-itemlisting-actions{float:none}.item-listing-block .mz-item-discount{background:#eee;color:#4a4a4a;font-size:12px;padding:10px;margin:1%;text-align:left;font-weight:400}.item-listing-block .mz-item-discount .mz-item-discountname{display:inline-block;text-align:left;width:77%}.item-listing-block .mz-item-discount .mz-item-discountamt{display:inline-block;text-align:right;width:20%;color:#4a4a4a}.mz-tablestructure .cart-brd{padding:25px 10px}.mz-tablestructure .cart-brd .mz-table-cart-items{border-bottom:1px solid #c9c9c9;padding:25px 0}.mz-tablestructure .cart-brd .cart-section{text-transform:uppercase;font-size:13px;color:#979696;padding:5px 0;border-bottom:0;border-top:1px solid #f6f6f6}.mz-tablestructure .cart-brd .mz-carttable-item-product .mz-productimage{border:1px solid #f3f3f3;-moz-box-shadow:1px 2px 13px #fefefe;-webkit-box-shadow:0 2px 7px #F3F3F3;box-shadow:0 2px 7px #F3F3F3;float:left;margin-right:10px;padding:8px;width:25%}.mz-tablestructure .cart-brd .mz-carttable-item-product .mz-productimage img{max-width:100%}.mz-tablestructure .cart-brd .mz-carttable-item-product .mz-carttable-item-title{font-family:montserratregular;font-size:13px;color:#000;text-align:left;font-weight:600;}.mz-tablestructure .cart-brd .mz-carttable-item-product .mz-itemlisting-description{float:left}.mz-tablestructure .cart-brd .mz-carttable-item-product .option-values{text-align:left}.mz-tablestructure .cart-brd .mz-carttable-item-product .option-values .mz-finish{display:inline-block;width:auto;font-family:montserratregular;font-size:12px}.mz-tablestructure .cart-brd .mz-carttable-item-product .option-values .bronze{height:25px;width:45px;display:inline-block;position:relative;top:9px;font-family:montserratregular;font-size:12px}.mz-tablestructure .cart-brd .mz-carttable-item-product .option-values .mzcolor-text{display:inline-block;font-family:montserratregular;font-size:12px;margin-top:10px;margin-left:10px}.mz-tablestructure .cart-brd .amp-cross{color:#ccc;font-size:14px}.mz-tablestructure .cart-brd .is-saleprice{font-size:16px;color:#000;display:block}.mz-tablestructure .cart-brd .amp-quantityvalue{font-size:14px}.mz-tablestructure .cart-brd .mz-carttable-header-options label{font-size:13px;font-weight:400;color:#979696;text-align:left}.mz-tablestructure .cart-brd .mz-carttable-header-options{margin-top:10px;margin-bottom:10px}.mz-tablestructure .cart-brd .mz-carttable-header-options label span{font-weight:700;color:#000;margin-right:10px}.mz-tablestructure .cart-brd .mz-carttable-item-total .is-crossedout{font-family:montserratregular;font-size:14px;color:#ccc;display:block;margin-left:-15px}.mz-tablestructure .cart-brd .mz-carttable-item-total .savepercent{display:block;font-size:12px;color:#ccc}.mz-tablestructure .cart-brd .mz-carttable-item-total .amp-price{font-family:montserratbold;font-size:16px;color:#fddb00;display:block}.mz-tablestructure .cart-brd .mz-carttable-item-remove{font-family:montserratregular;display:none;}.mz-tablestructure .cart-brd .mz-carttable-item-remove .mzaccount-remove-item{font-size:14px}.mz-tablestructure .cart-brd .mz-carttable-item-remove .mz-accoutreturn{font-size:10px;border:1.5px solid #b3b3b4;padding:7px;border-radius:6px;font-family:montserratbold;text-transform:uppercase}.mz-accountvalues,.mz-totalgrandvalue{font-family:montserratregular}.mz-tablestructure .cart-brd .mz-carttable-item-remove .mz-accoutreturn a{color:#000}.mz-tablestructure .cart-brd .mz-carttable-item-remove .mz-accoutreturn a:hover{opacity:.7}.mz-accountvalues{width:100%;float:left;border-bottom:1px solid #f6f6f6;margin-top:20px;font-size:16px;letter-spacing:1px;font-weight:400}.mz-accountvalues .order-comments{float:left;width:50%}.mz-accountvalues .order-comments .body{color:#979696;text-align:left;font-size:12px}.mz-accountvalues table{background:0;float:right;width: 48%;}.mz-accountvalues table tr{background:0 0}.mz-accountvalues table tr td{text-align:left}.mz-accountvalues .mz-accountvaluestd1{color:grey;width:200px;text-align:left}.mz-accountvalues .mz-accountvaluestd1.total{color:initial}.mz-accountvalues .mz-accountvaluestd2{color:grey;width:150px;text-align:right}.mz-accountvalues .mz-accountvaluestd2.total{color:initial}.mz-totalgrandvalue{width:100%;float:left;font-size:16px;padding:15px 0}.mz-totalgrandvalue .print-reciept{float:left;color:#979696}.mz-totalgrandvalue .print-reciept a{color:grey;text-decoration:underline}.mz-totalgrandvalue table{background:0 0;float:right}.mz-totalgrandvalue .mz-accountvaluestd1{color:grey;width:178px;text-align:left;letter-spacing:1px;font-weight:400}.mz-totalgrandvalue .mz-accountvaluestd1.total{color:initial}.mz-totalgrandvalue .mz-accountvaluestd2{color:grey;width:150px;text-align:right;letter-spacing:1px;font-weight:400}.mz-totalgrandvalue .mz-accountvaluestd2.total{color:initial}.mz-carttable-item-price,.mz-carttable-item-qty,.mz-carttable-item-total {text-align: center;}.print-reciept{display:none;}.is-crossedout {text-decoration: line-through;}</style>');
            mywindow.document.write('</head><body >');
            mywindow.document.write(data);
            mywindow.document.write('</body></html>');

            mywindow.document.close(); // necessary for IE >= 10
            mywindow.focus(); // necessary for IE >= 10

            mywindow.print();  
            mywindow.close();    
            return true;  
        },  
        finishReturnItem: function() {
            var self = this, 
                op = this.model.finishReturn();
            if (op) {
                return op.then(function(res) {
                      
                    delete self.returning;
                    self.render();
                });
            }
        },
        render: function(options, $target) {
            if(require.mozuData('pagecontext').pageType === "my_account"){
            var self = this; 
            
            var obj=self.model.get("items");
            _.each(self.model.get("items").models, function(re, i) {
              
                var shippincost=re.get('shippingSubTotal');
                var handlingcost=re.get('handlingTotal');
                var shipingHandlingCost=parseFloat(shippincost)+parseFloat(handlingcost);
                if(shipingHandlingCost) shipingHandlingCost=shipingHandlingCost.toFixed(2);
                re.set('shippingSubTotal',shipingHandlingCost); 
                    
                if(re.get("packages").length > 0){
                    _.each(re.get("packages"), function(rt, i) {
                        if(rt.trackingNumber){
                            var trackingnumberarray=rt.trackingNumber.split(",");
                            rt.trackings=trackingnumberarray;
                        }
                    });
                }
            });           
            
            $(".preloader").hide();
            $(".mz-orderhistory").show();
            $(".quickreorder-preloader").hide();
            
            Backbone.MozuView.prototype.render.apply(this);
            var monthNames = ["January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
            ];
            $(".mz-date").each(function(){
                var orderDate = $(this).text();
                var formattedDate = new Date(orderDate);
                var d = formattedDate.getDate();
                var m =  formattedDate.getMonth();
                var mnth=monthNames[m];
                var y = formattedDate.getFullYear();
                $(this).text(mnth+" "+d+", "+y);
            }); 
            
            if ($(window).width() < 767) {
                if (options == "startReturn") {
                    $("#refund-show").show();
                    $('.' + $target).show();
                    $("#vt-header").css('z-index', 0);
                    $(".header-intro").css('z-index', 0);
                    $(".mz-ampheade").css('z-index', 0);
                }
                if (options == "selectreturn") {
    
                    $("#vt-header").css('z-index', 999);
                    $(".header-intro").css('z-index', 1000);
                    $(".mz-ampheade").css('z-index', 1000);
                }
            } else {
                $("#refund-show").show();
                $('.' + $target).show();
            }
            }
        }
    }),

ReturnHistoryView = Backbone.MozuView.extend({
    templateName: "modules/my-account/return-history-list",
    initialize: function() {
        var self = this;
        this.listenTo(this.model, "change:pageSize", _.bind(this.model.changePageSize, this.model));
        this.listenTo(this.model, 'returndisplayed', function(id) {
            var $retView = self.$('[data-mz-id="' + id + '"]');
            if ($retView.length === 0) $retView = self.$el;
            $retView.ScrollTo({
                axis: 'y'
            });
        });
    } 
});

    var PaymentMethodsView = EditableView.extend({
        templateName: "modules/my-account/my-account-paymentmethods",
        autoUpdate: [
            'editingCard.isDefaultPayMethod',
            'editingCard.paymentOrCardType',
            'editingCard.nameOnCard',
            'editingCard.cardNumberPartOrMask',
            'editingCard.expireMonth',
            'editingCard.expireYear',
            'editingCard.cvv',
            'editingCard.isCvvOptional',
            'editingCard.contactId',
            'editingContact.firstName',
            'editingContact.lastNameOrSurname',
            'editingContact.address.address1',
            'editingContact.address.address2',
            'editingContact.address.address3',
            'editingContact.address.cityOrTown',
            'editingContact.address.countryCode',
            'editingContact.address.stateOrProvince',
            'editingContact.address.postalOrZipCode',
            'editingContact.address.addressType',
            'editingContact.phoneNumbers.home',
            'editingContact.isBillingContact',
            'editingContact.isPrimaryBillingContact',
            'editingContact.isShippingContact',
            'editingContact.isPrimaryShippingContact',
        ],
        renderOnChange: [ 
            //'editingCard.contactId',
            'editingContact.address.countryCode',  
            'editingCard.isDefaultPayMethod' 
           
        ],
        additionalEvents: {
            "keypress .mz-address-phoneNumber": "numPress",
            "keyup .mz-address-phoneNumber": "numPress",
            "change [name=contactId]":"toggleAddressForm" 
           
        },  
        numPress: function(e) {
            var key = e.charCode || e.keyCode || 0,
                str = String.fromCharCode(event.key);
            if(e.keyCode !== 37 && e.keyCode !== 39) {
                $phone = $(e.currentTarget);
                $phone.val($phone.val().replace(/[^\d-+ ]/g, "")); 
            }
        },
         toggleAddressForm: function(e){
            if($(e.currentTarget).val()=='new'){
                $(".mz-contactselector-summarywrapper").show();
            }else{
                $(".mz-contactselector-summarywrapper").hide();
            }
        },
        beginEditCard: function (e) {
            e.preventDefault();
            var id = this.editing.card = e.currentTarget.getAttribute('data-mz-card');
            this.model.beginEditCard(id);
            this.render();
            if(id === "new"){
                this.clearAllData();
            }
        },
         render: function() {
            Backbone.MozuView.prototype.render.apply(this); 
            if($("[name='contactId']").val()=='new'){
              
            }else{ 
                $(".mz-contactselector-summarywrapper").hide();    
            }
            
         },
        clearAllData: function(){
            $('#mz-payment-credit-card-type').val($("#mz-payment-credit-card-type option:first").val());
            $('#mz-payment-credit-card-number').val("");
            $('#mz-payment-credit-card-name').val("");
            $('#mz-payment-expiration-month').val($('#mz-payment-expiration-month option:first').val());
            $('[name="mz-payment-expiration-year"]').val($('[name="mz-payment-expiration-year"] option:first').val());
            $('#mz-payment-security-code').val("");
        },
        finishEditCard: function () {
            if (this.doModelAction('saveCard')) {
                this.editing.card = false;
                $('body').scrollTop($(event.target).parents('.mz-accountaddressbook-contact').offset().top-150);
            }
        },
        cancelEditCard: function () {
            this.editing.card = false;
            this.model.endEditCard();
            this.render();
            $('body,html').scrollTop(0);
        },
        beginDeleteCard: function (e) {
            var self = this,
            id = e.currentTarget.getAttribute('data-mz-card'),
            card = this.model.get('cards').get(id);
            
            this.doModelAction('deleteCard', id);
        } 
        
    });
    var Preferences = EditableView.extend({
      templateName: "modules/my-account/my-preference",
      additionalEvents: {
          "click .css-checkbox": "acceptsMarketingview"
      },
        acceptsMarketingview:function(e){
               var yes = $(e.currentTarget).prop('checked');
            this.model.set('acceptsMarketing', yes);
            this.model.updateAcceptsMarketing(yes);
        }
      });

    var AddressBookView = EditableView.extend({
        templateName: "modules/my-account/my-account-addressbook",
        autoUpdate: [
            'editingContact.firstName',
            'editingContact.lastNameOrSurname',
            'editingContact.address.address1',
            'editingContact.address.address2',
            'editingContact.address.address3',
            'editingContact.address.cityOrTown',
            'editingContact.address.countryCode',
            'editingContact.address.stateOrProvince',
            'editingContact.address.postalOrZipCode',
            'editingContact.address.addressType',
            'editingContact.phoneNumbers.home',
            'editingContact.isBillingContact',
            'editingContact.companyOrOrganization',
            'editingContact.isPrimaryBillingContact',
            'editingContact.isShippingContact',
            'editingContact.isPrimaryShippingContact',
        ],
        renderOnChange: [
            'editingContact.address.countryCode',
            'editingContact.isBillingContact',
            'editingContact.isShippingContact'
        ],
        additionalEvents: {   
            "keypress .mz-address-phoneNumber": "numPress",
            "keyup .mz-address-phoneNumber": "numPress",
            "keydown .mz-address-phoneNumber": "numPress"
        },
        numPress: function(e) {
            var key = e.charCode || e.keyCode || 0,
                str = String.fromCharCode(event.key);

                $phone = $(e.currentTarget);
                $phone.val($phone.val().replace(/[^\d-+ ]/g, "")); 

        }, 
        beginAddContact: function() {
            this.editing.contact = "new";
            this.render();
        },
        beginEditContact: function(e) {
            var id = this.editing.contact = e.currentTarget.getAttribute('data-mz-contact');
            this.model.beginEditContact(id);
            this.render();
        },
        finishEditContact: function() {
 
            var self = this,
                isAddressValidationEnabled = HyprLiveContext.locals.siteContext.generalSettings.isAddressValidationEnabled;
            var operation = this.doModelAction('saveContact', {
                forceIsValid: isAddressValidationEnabled
            }); 
            // hack in advance of doing real validation in the myaccount page, tells the model to add isValidated: true
            if (operation) {
                operation.otherwise(function() {
                    self.editing.contact = true;
                });
                this.editing.contact = false;
                $('body').scrollTop($(event.target).parents('.mz-accountaddressbook-contact').offset().top);
            }

             var zip=$("input[name='postal-code']").val().trim(); 
            if(zip){
                if(/^[a-zA-Z0-9- ]*$/.test(zip) === false) {
                    $("[data-mz-validationmessage-for='editingContact.address.postalOrZipCode']").html(Hypr.getLabel('postalCodeHasSpecialChars')); 
                    }
            } 
           
        },
        cancelEditContact: function() {
            this.editing.contact = false;
            this.model.endEditContact();
            this.render();
            $('body,html').scrollTop(0);
        },
        beginDeleteContact: function(e) {
            var self = this,
                id = e.currentTarget.getAttribute('data-mz-contact'),
                contact = this.model.get('contacts').get(id);
                this.doModelAction('deleteContact', id);
            
        }
    }); 

    var StoreCreditView = Backbone.MozuView.extend({
        templateName: 'modules/my-account/my-account-storecredit',
        additionalEvents: {
            "keyup .mz-accountstorecredit-input": "enterkey"
        },
        enterkey : function(e){
            if (e.which === 13) {
                this.addStoreCredit(e);
            }       
        },
        addStoreCredit: function(e) {
            var self = this;
            var id = this.$('[data-mz-entering-credit]').val();
            if (id) return this.model.addStoreCredit(id).then(function() {
                return self.model.getStoreCredits();
            },function(dataError){ 
                if (dataError.message.indexOf("Item not found")!=-1){
                    dataError.message= "Sorry, but we didn't find that code. Please check it and try again."; 
                }
                
                console.log(dataError); });  
            Api.on('error', function(badPromise, xhr, requestConf) {
             console.log("error");
            }); 
        }
    });
  

    $(document).ready(function() {
        
        
         $(document).on('click', '.mz-backorder-popup button', function (e) {
            $(e.currentTarget).parents('.mz-backorder-popup').fadeOut(500);
        });
        $(document).on('click', '[backorderbutton]', function(e){  
           window.accountViews.wishList.backorderbutton(e);  
        });
         
        $(document).on("click",".mz-scrollnav-link",function(e){
          
            if($(this).text().trim().toLowerCase()=="quick reorders"){
                  
            }
            
            
            if($(this).text().trim()!="ADDRESS BOOK" && $(this).text().trim()!="SAVED CARDS"){ 
                $("html, body").animate({ scrollTop: 0 }, 10);        
            }else{
                $("html, body").animate({ scrollTop: 0 }, 10);        
            }
        });
        
        $(document).on("change", "#selectaddress", function(e) {
            if ($(e.currentTarget).val() == 'new') {
                $('.mz-contactselector-summarywrapper').show();
                
            } else {
                $('.mz-contactselector-summarywrapper').hide();
            }
        });
       
        $('#mz-labelship').html('sdf sdf');  
        var accountModel = window.accountModel = CustomerModels.EditableCustomer.fromCurrent();
        var Apagetype = require.mozuData('pagecontext').pageType;
        var  acceptiang = accountModel.updateAcceptsMarketing;

        var $accountSettingsEl = $('#account-settings'),
            $orderHistoryEl = $('#account-orderhistory'),
            $returnHistoryEl = $('#account-returnhistory'),
            $paymentMethodsEl = $('#account-paymentmethods'),
            $addressBookEl = $('#account-addressbook'),
            $wishListEl = $('#account-wishlist'),
            $messagesEl = $('#account-messages'),
            $storeCreditEl = $('#account-storecredit'),
            orderHistory = accountModel.get('orderHistory'),
            quickorderHistory = accountModel.get('orderHistory'),
            returnHistory = accountModel.get('returnHistory'),
            $quickOrderHistoryEl = $('#account-quickorder');
            var orderHistoryview= new OrderHistoryView({
                el: $orderHistoryEl.find('[data-mz-orderlist]'),
                model: orderHistory
            });

            var orderHistoryPagingControls= new PagingViews.PagingControls({
                templateName: 'modules/my-account/order-history-paging-controls',
                el: $orderHistoryEl.find('[data-mz-pagingcontrols]'),
                model: orderHistory
            });
           var quickOrderView= new QuickOrderView({
                el: $quickOrderHistoryEl.find('[data-mz-quickorderlist]'),
                model: quickorderHistory
            }); 
             var orderHistoryPageNumbers= new PagingViews.PageNumbers({
                el: $orderHistoryEl.find('[data-mz-pagenumbers]'),
                model: orderHistory 
            });
             var accountViews;
   
        accountViews = window.accountViews = {
            
            settings: new AccountSettingsView({
                el: $accountSettingsEl,
                model: accountModel,
                messagesEl: $messagesEl 
            }), 
            returnHistory: new ReturnHistoryView({
                el: $returnHistoryEl.find('[data-mz-orderlist]'),
                model: returnHistory
            }),
            returnHistoryPagingControls: new PagingViews.PagingControls({
                templateName: 'modules/my-account/order-history-paging-controls',
                el: $returnHistoryEl.find('[data-mz-pagingcontrols]'),
                model: returnHistory
            }),
            returnHistoryPageNumbers: new PagingViews.PageNumbers({
                el: $returnHistoryEl.find('[data-mz-pagenumbers]'),
                model: returnHistory
            }),
            paymentMethods: new PaymentMethodsView({
                el: $paymentMethodsEl,
                model: accountModel,
                messagesEl: $messagesEl
            }),
            addressBook: new AddressBookView({
                el: $addressBookEl,
                model: accountModel,
                messagesEl: $messagesEl
            }),
            storeCredit: new StoreCreditView({
                el: $storeCreditEl,
                model: accountModel,
                messagesEl: $messagesEl
            }),
            Preferencesview :new Preferences({
                el: $('#account-preference'),
                 model: accountModel
             })
        };
    
        var wishlist;

        if (HyprLiveContext.locals.siteContext.generalSettings.isWishlistCreationEnabled ) {
            wishlist = accountModel.get('wishlist');

            accountViews.wishList = new WishListView({
                el: $wishListEl,
                model: wishlist,
                messagesEl: $messagesEl
            });
        }

        // TODO: upgrade server-side models enough that there's no delta between server output and this render,
        // thus making an up-front render unnecessary.
        _.invoke(window.accountViews, 'render');

        // inventory data for configurable products in the wishlist is inaccurate on initial load/render
        // retrieving new data for each product and re-rendering the wishlist is *technically* a solution
        // #shame
        if (wishlist) {
            Api.all.apply(Api, wishlist.get('items').map(function(item) {
                var product = item.get('product');
                var options = product.get('options').map(function(opt) {
                    return {
                        attributeFQN: opt.get('attributeFQN'),
                        value: opt.get('value')
                    };
                });

                return options.length === 0 ? product : product.apiConfigure({
                    options: options
                }, {
                    useExistingInstances: true
                }).then(function(nextProduct) {
                    item.set('product', nextProduct.data);
                });
            })).then(function() {
                accountViews.wishList.render();
            });
        }
        //my account js //
        
        if(Apagetype == "my_account"){
            $(".mz-container").hide();
            $(".mz-myaccount-panels #account-settings").css('display', 'block');    
        }
        
        $(".mz-scrollnav-item").removeClass("active-tab");
        $(".mz-scrollnav-item:first").addClass("active-tab");


        $("a[data-target]").click(function() { 
            var target = "#" + $(this).data("target");
            //var cust_id = $(this).attr("custom");
            $(".mz-container").not(target).hide();
            $(target).show();
            $("a[data-target='"+ $(this).data("target") +"']").closest("li").addClass("active-tab").siblings().removeClass('active-tab');
            
            $("#account-messages").html(''); 
        });


        $(".mz-accountreturnhistory").find(".mz-toggle-icon").click(function() {

            if( $(this).parents(".order-row").hasClass("active") ){
                $(this).parents(".cart-brd").find(".order-row").each(function(e){
                    if($(this).hasClass("active")){
                        $(this).removeClass("active");
                        $(this).next().hide();
                    }
                });
            }else{
                $(this).parents(".cart-brd").find(".order-row").each(function(e){
                    if($(this).hasClass("active")){
                        $(this).removeClass("active");
                        $(this).next().hide();
                    }
                });
                $(this).parents(".order-row").addClass("active").next(".return-details").slideDown();
            }
            
        });

        $(document).on("change", "[data-mz-orderstatus]", function(e) {
            if ($(e.currentTarget).val() === 'orderhistory') {
                $('.mz-accountorderhistory').show();  
                $('.mz-accountreturnhistory').hide();
                
            } else if ($(e.currentTarget).val() === 'returnhistory') {
                $('.mz-accountreturnhistory').show();
                 $('.mz-accountorderhistory').hide();
            }
        });

        $(".mz-returnhistory").find("a").click(function() {
            $("#mz-orderhistory").trigger("click");
        });

        $(".selected-menu-mobile").click(function(e) {
            $('#myaccount-mbl').show();
            
            if($(window).width() < 756) {
                $("body").addClass("pop-position-mob");
                $('.account-settings').css('display', 'block');
                $("#vt-header").css('z-index', 0);
                $(".header-intro").css('z-index', 0);
                $(".mz-ampheade").css('z-index', 0);
            }
        });
        $(".close-mzaccount, .mz-mobile-logout li a").click(function(){
            $('.mz-mobile-logout').hide();
        }); 
        $(".mz-myaccountsettings a").click(function(e) {
            $('.mz-mobile-logout').hide();
                $('body').css('overflow-y', 'auto');
                $("body").removeClass("pop-position-mob");
                $("#vt-header").css('z-index', 999);
            $(".header-intro").css('z-index', 1000);
            $(".mz-ampheade").css('z-index', 1000);

        });
        $(".mz-scrollnav-item > .mz-scrollnav-link").click(function() {
            $("body").removeClass("pop-position-mob");
        });

        $("#mz-closebtnmbl").click(function() {
            $('#myaccount-mbl').hide();
            
            $("body").removeClass("pop-position-mob"); 
            $('#account-settings').css('display', 'block');
            $("#vt-header").css('z-index', 999);
            $(".header-intro").css('z-index', 1000);
            $(".mz-ampheade").css('z-index', 1000);

        });

        $(".mz-navmobile .mz-scrollnav-item").click(function() {
            $('#myaccount-mbl').fadeOut();
            $("body").css('overflow', 'auto');
            $("#vt-header").css('z-index', 999);
            $(".header-intro").css('z-index', 1000);
            $(".mz-ampheade").css('z-index', 1000);
        });



        $(".mz-scrollnav-item").click(function() {
            
            var classtag = $(this).find("span").attr("class");
            $(".selected-menu-mobile span").removeClass();
            $(".selected-menu-mobile span").addClass(classtag);
            $(".selected-menu-mobile span").html($(this).html());
            
            $("#account-messages").html('');
        });


        $(document).on('click', '.toggle', function(e) {

            if ($(this).hasClass("expanded")) {
                $(this).closest(".mz-myordercollapse").find('.mz-redorderdetails').toggleClass('bgclass');
                $(this).toggleClass("expanded");
                $(this).closest(".mz-myordercollapse").find('.toggle-icon').toggleClass('toggle-icon-down');
                $(this).closest(".mz-myordercollapse").find(".toggle-order").slideToggle();
                $(this).closest(".mz-myordercollapse").toggleClass('accountborder');
                $(this).closest(".mz-redorderdetails").toggleClass('bordrnone');

            } else {
                $('.mz-redorderdetails').removeClass('bgclass');
                $(".toggle").removeClass("expanded");
                $('.toggle-icon').removeClass('toggle-icon-down');
                $(".mz-myordercollapse").removeClass('accountborder');
                $(".toggle-order").hide();
                $(this).closest(".mz-myordercollapse").find('.mz-redorderdetails').toggleClass('bgclass');
                $(this).addClass("expanded");
                $(this).closest(".mz-myordercollapse").find('.toggle-icon').toggleClass('toggle-icon-down');
                $(this).closest(".mz-myordercollapse").find(".toggle-order").slideToggle();
                $(this).closest(".mz-myordercollapse").addClass('accountborder');
                $(this).closest(".mz-redorderdetails").toggleClass('bordrnone');

            }


            
        });
        if ($(window).width() < 767) {
            $(".toggle").on("click", function(e) {


            });     
            
        }


        $(document).on('click', '#mz-closebtnmbl2', function(e) {
            $("#refund-show").hide();
            
            $(this).closest(".mz-myordercollapse").addClass("accountborder");
            $(this).closest(".mz-myordercollapse").find(".mz-redorderdetails").addClass("bordrnone");
            $(this).closest(".mz-myordercollapse").find(".toggle").addClass("expanded");
            $("#vt-header").css('z-index', 999);
            $(".header-intro").css('z-index', 1000);
            $(".mz-ampheade").css('z-index', 1000);
        });
  

        
        //triggering the click event for the menu item based on hash value 
        if (location.hash.length > 0) {
            var clickLinkId = "#mz-" + location.hash.substring(1, location.hash.length);
            $(clickLinkId).trigger("click");    
        }

    });

});

