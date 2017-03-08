require(["modules/jquery-mozu", "underscore", "hyprlive", "modules/backbone-mozu", "modules/cart-monitor",
        "modules/models-product",
        "modules/views-productimages","widgets/powerreviews", "modules/api", "modules/modal", "hyprlivecontext",
        "modules/jquery-dateinput-localized",
        "shim!vendor/jquery.responsiveTabs[jquery=jQuery]"

    ],
    function ($, _, Hypr, Backbone, CartMonitor, ProductModels, ProductImageViews, PowerReviewsWidget, Api, ModalWindow, HyprLiveContext) {

        var cdnquality = Hypr.getThemeSetting("cdnQuality");
        var qmodalTemplate = Hypr.getTemplate('modules/product/product-customization'),
            CustomOptionModel,
            modal,
            getRenderProductContext = function (substituteModel) {
                var model = (substituteModel || this.model).toJSON({
                    helpers: true
                });
                return {
                    Model: model,
                    model: model
                };
            };    

        CustomOptionModel = function (target, cartViewObj, producttype) {
            var filteredGoal, self = this;
            self.e = target;
            self.cartViewObj = cartViewObj;
            self.render(qmodalTemplate.render(getRenderProductContext(cartViewObj)));  
            var data = self.cartViewObj.apiModel.data.options;
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

        $.extend(CustomOptionModel.prototype = new ModalWindow(), {
            constructor: CustomOptionModel,
            render: function (html) {    

                var currentquantity = $(document).find(".mz-productdetail-qty").val();
                var $modal = $(html);
                $modal.find('.mz-productdetail-qty').val(currentquantity);
                this.updatequantity(this, currentquantity);
                this.loadWrapper($modal.appendTo('body'));
                this.bindClose();
                this.open();
                this.otherEvent();
                this.events($modal);
                $(".optionselected").removeClass("optionselected");  
            },
            events: function ($modal) {
                var self = this;
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
                $modal.find('.mz-sub-qty').on('click', function (e) {
                    var quantity = parseInt($(e.currentTarget).parent().find(".mz-productdetail-qty").val());
                    var val = $(e.currentTarget).parent().find(".mz-productdetail-qty");
                    self.minusqty(val, quantity);
                });
                $modal.find('.mz-add-qty').on('click', function (e) { 
                    var quantity = parseInt($(e.currentTarget).parent().find(".mz-productdetail-qty").val());
                    var val = $(e.currentTarget).parent().find(".mz-productdetail-qty");
                    self.addqty(val, quantity);
                });
                $modal.find('[data-mz-product-option]').on('change', function () {
                    self.onOptionChange(this);
                });
                $modal.find('.mz-productdetail-qty').on('keypress', function (e) {    
                    var regex = new RegExp("^[0-9-]+$");  
                    var str = String.fromCharCode(!e.charCode ? e.which : e.charCode);
                    var verified = (e.which === 8 || e.which === undefined || e.which === 0) ? null : String.fromCharCode(e.which).match(/[^0-9]/);
                    if (verified === null) { 
                            
                          }else{
                               $(obj).val($(obj).val().replace(/\D/g, "")); 
                              
                          } 
                }); 
                $modal.find('.mz-productdetail-qty').on('change', function (e) {
                    var quantity = $(e.currentTarget).val();
                    self.updatequantity(this, quantity);
                });
                $modal.find('#add-to-cart').on('click', function () {
                    var data = _.where(self.cartViewObj.get("options").toJSON(),{isRequired : true});
                    _.each(data,function(opt){   
                        if((opt.attributeDetail.usageType === "Extra") && (opt.isRequired) && (opt.values[0].deltaPrice < 1)&&(opt.values.length === 1)){
                            val = _.where(self.cartViewObj.getConfiguredOptions(),{attributeFQN : opt.attributeFQN });
                            if((val === undefined)||(val.length < 1)){
                                option = self.cartViewObj.get('options').get(opt.attributeFQN);
                                option.set('value', opt.values[0].value);
                            }             
                        }
                    }); 
                    self.addToCart(this);
                    
                    
                });  
                $modal.find('[data-mz-product-option]').on('change', function (e) {
                    var $target = $(e.currentTarget).val();
                    var descr = $(e.currentTarget).attr("description");
                    var obj = $(e.currentTarget);  

                    if ($(window).width() < 768) {
                        $(obj).parents(".option-container").find(".description-mobile").each(function () {
                            $(this).html("");
                        });
                        $(obj).parents(".options").find(".description-mobile").html(descr);
                    } else {
                        if (descr) {
                            $(obj).parents(".option-container").next().html(descr);
                        }
                    }
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").text($(e.currentTarget).attr("prnames"));
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").addClass("selectopt");
                    $(e.currentTarget).parents(".option-container").find(".options").each(function () {
                        $(this).removeClass("selectedoption");
                    });
                    $(e.currentTarget).parents(".options").addClass("selectedoption");
                    $(obj).closest(".option-container").find(".optionselected").removeClass("optionselected");
                    $(obj).addClass("optionselected");
                    var optionprice = 0;
                    var prodprice = 0;

                    var options = [];
                    $(".optionselected").each(function () {


                        var optobj = {};
                        if ($(this).attr("customisenothanks") !== "nothanks") {
                            if ($(this).attr("option-type").toLowerCase() == "option") {
                                optionprice += 0;

                                optobj.attributeFQN = $(this).data("mz-product-option");
                                optobj.value = $(this).attr("value");
                                options.push(optobj);
                            } else {
                                optionprice += parseFloat($(this).attr("optionprice"));

                                optobj.attributeFQN = $(this).data("mz-product-option");
                                optobj.value = $(this).attr("value");
                                options.push(optobj);
                            }
                        }

                        prodprice = $(this).attr("pordprice");
                    });

                    var prodcode = $('[data-mz-prodtcode]').first().data('mzProdtcode');
                    Api.request("post", "/api/commerce/catalog/storefront/products/" + prodcode + "/configure?includeOptionDetails=true", {
                        options: options
                    }).then(function (response) {
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

                    self.productOPtionChange(obj, $target);
                });
                $modal.find('.close-icon').on('click', function () {

                    var objj = self.cartViewObj.getConfiguredOptions();
                    var newobj = [];
                    _.each(objj, function (objoptions) {
                        var optv = self.cartViewObj.get('options').get(objoptions.attributeFQN);
                        if (optv.attributes.attributeFQN != "tenant~color" && optv.attributes.attributeFQN != "tenant~lead-wire" && optv.attributes.attributeFQN != "tenant~color-temperature-option" && optv.attributes.attributeFQN != "tenant~size") {
                            optv.unset("value"); 
                        }
                    });
                    
                    $('body').css({'height':'auto', 'position': 'static'}); 
                    
                    setTimeout(function () {
                        $('[data-mz-role="modal-close"]').trigger('click');
                        $("#tz-cart-dialog").remove();
                        $(".cart-overlay").remove();
                    }, 500);

                });

                //--- this is for overlay wishList

                $modal.find('[data-mz-action="guestCustomWishlist"]').on('click', function (e) {

                    //close the custom overlay
                    $('[data-mz-role="modal-close"]').trigger('click');
                    $("#tz-cart-dialog").remove();
                    $(".cart-overlay").remove();

                    $('[data-mz-loginpopup]').trigger('click');

                    //randomstring for verification
                    var randomString = Math.random().toString(36).substr(2, 8),
                        customProObj = {};

                    $.each(self.cartViewObj.getConfiguredOptions(), function (i, v) {
                        customProObj[v.attributeFQN] = v.value;
                    });

                    if (history.pushState && "" !== $.param(customProObj)) {
                        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + randomString,
                            newDate = new Date();

                        newDate.setTime(newDate.getTime() + (10 * 60 * 1000));

                        window.history.pushState({
                            path: newurl
                        }, '', newurl);
                        document.cookie = "guestWishList=" + randomString + "|" + $.param(customProObj) + ";expires=" + newDate.toUTCString() + ";/";
                    }
                    
                    var objj = self.cartViewObj.getConfiguredOptions();
                    var newobj = [];
                    _.each(objj, function (objoptions) {
                        var optv = self.cartViewObj.get('options').get(objoptions.attributeFQN);
                        if (optv.attributes.attributeFQN != "tenant~color") {
                            if (optv.attributes.attributeFQN != "tenant~lead-wire")
                            {
                                optv.unset("value");
                            }
                        }   
                    });
                    
                });
                $modal.find('[data-mz-action="addToWishlist"]').on('click', function (e) {
                    var obj = e.currentTarget;
                    $(obj).addClass("is-processing");
                    self.addToWishlist(e);
                });
            },
            addqty: function ($qty, currentVal) {
                if (!isNaN(currentVal) && currentVal < 999) {
                    $qty.val(currentVal + 1);
                    var quantity = currentVal + 1;
                    this.updatequantity($qty, quantity);
                }
            },
            minusqty: function ($qty, currentVal) {
                if (!isNaN(currentVal) && currentVal > 1) {
                    $qty.val(currentVal - 1);
                    var quantity = currentVal - 1;
                    this.updatequantity($qty, quantity);
                }
            },
            selectedPrice: function (optionprice, obj) {

                var quantity = (obj).parents(".mz-modal").find(".price-qty-block").find(".mz-productdetail-qty").val();
                var quanityupdateprice = optionprice * quantity;
                var newupdateprice = quanityupdateprice.toFixed(2);
                $(obj).parents(".mz-modal").find(".price-qty-block").find(".upd_price").text("$" + newupdateprice);
            },
            productOPtionChange: function (obj, value) {
                var t = Api.context.tenant;
                var s = Api.context.site;
                var filepath = ""+require.mozuData("sitecontext").cdnPrefix+"/cms/" + s + "/files/";

                var $target = value;

                var loadimgsrc = "" + filepath + "/loading-small-flat.gif";
                var loadimg = "<img src=" + loadimgsrc + "></img>";
                $(obj).closest(".mz-productoptions-valuecontainer").find(".img-slot").html(loadimg);
                var imgsrc = "";
                if ($target != "None" && $(obj).attr("option-type") != "Option") {
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
                                    imgsrc = ""+filepath +"nooption.png";
                                }
                                var imghtml = "<img src=" + imgsrc + "></img>";
                                obj.closest(".mz-productoptions-valuecontainer").find(".img-slot").html(imghtml);
                            });
                            
                        }  
                            
                          });
                

                } else {
                    var imghtml = ""+filepath+"nooption.png";
                    obj.closest(".mz-productoptions-valuecontainer").find(".imgse-slot").html(imghtml);
                }
            },
            updatequantity: function (obj, value) {
                this.cartViewObj.set({
                    "quantity": value
                });

                var price = 0;
                if (this.cartViewObj.get("price").attributes.price) {
                    if (this.cartViewObj.get("price").get("salePrice")) {
                        price = this.cartViewObj.get("price").get("salePrice");
                    } else {
                        price = this.cartViewObj.get("price").get("price");
                    }
                } else if (this.cartViewObj.get("priceRange").attributes.lower) {
                price=this.cartViewObj.get("priceRange").get("lower").get("price");    
                }
                var Updatetotal = value * price;
                $(obj).closest(".price-qty-block").find(".upd_price").text("$" + Updatetotal.toFixed(2));

            },
            addToCart: function (obj) {

                $("body").find('#tz-cart-dialog').find('.productcustomize').attr('disabled', "disabled");

                Api.on('error', function (badPromise, xhr, requestConf) {
                    if (badPromise.message.indexOf('limited quantity') != -1) {
                        badPromise.message = Hypr.getLabel('insufficientinventory');
                    }
                    var erroHtml = "<ul class='is-showing mz-errors'><li>" + badPromise.message + "<li>";

                    $(obj).parents('.mz-modal-outer').find(".mz-messagebar").html(erroHtml);
                });
                this.cartViewObj.on('addedtocart', function () {
                    $(obj).addClass("is-processing");
                    $('[data-mz-role="modal-close"]').trigger('click');
                    
                    if($(window).scrollTop() > $('.mz-l-container').height() + 30) {
                        $('body,html').scrollTop(100);
                    }
                    $(".cart-overlay").remove();
                    CartMonitor.updateCart();

                });

                this.cartViewObj.addToCart();

            },
            onOptionChange: function (e) {
                this.configure($(e));
            },
            configure: function ($optionEl) {
                var EliminateProduct = Hypr.getThemeSetting("nothanks");
                var newValue = $optionEl.val(),
                    oldValue,
                    id = $optionEl.data('mz-product-option'),
                    optionEl = $optionEl[0],
                    isPicked = (optionEl.type !== "checkbox" && optionEl.type !== "radio") || optionEl.checked,
                    option = this.cartViewObj.get('options').get(id);
                if (newValue != EliminateProduct) {
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
                } else {
                    if (option.get("value") !== undefined) {
                        option.unset("value");
                    }
                }
            },
            otherEvent: function () {
                var $that = this;
            },
            addToWishlist: function (e) {
                this.cartViewObj.addToWishlist();
                this.cartViewObj.on('addedtowishlist', function (cartitem) {
                    $(e.target).prop('disabled', 'disabled').text(Hypr.getLabel('addedToWishlist'));
                });
            }
        });
        // End of Customized add to cart

        var ProductView = Backbone.MozuView.extend({
            templateName: 'modules/product/product-detail',
            autoUpdate: ['quantity'],
            additionalEvents: {
                "click .mz-prdOption": "showAddToCartDialog",

                "click .color-span" : "switchSelectedImage",
                "change .mz-size-content": "sizeUpdate",
                "click .mz-backorder-button": "backOrderPopUp",
                "keyup .mz-productdetail-qty": "quantityBox",
                "keypress .mz-productdetail-qty": "quantityBox",
                "change .mz-productdetail-qty": "quantityBoxVal"

            },
            
            quantityBox: function(e) {
                
                var qtyEle = e.target;
                var qtyMaxValue = (this.model.get("inventoryInfo") ? this.model.get("inventoryInfo").onlineStockAvailable : 0 ),
                    qtyCurrentValue = parseInt($(qtyEle).val());
                
                if( "undefined" == qtyMaxValue || 1 > qtyMaxValue )
                {
                    if(this.model.get("inventoryInfo").outOfStockBehavior === "AllowBackOrder")
                    {
                        qtyMaxValue = 500;
                    }
                }
                
                // allow only numbers
              var verified = (e.which === 8 || e.which === undefined || e.which === 0) ? null : String.fromCharCode(e.which).match(/[^0-9]/);
                         if (verified === null) { 
                            
                          }else{
                               $(obj).val($(obj).val().replace(/\D/g, "")); 
                              
                          } 
                       
                   
              /*  $(qtyEle).val($(qtyEle).val().replace(/\D/g, ""));*/
                
                if ((event.which < 48 || event.which > 57)) {
                    event.preventDefault();
                }
                if (qtyCurrentValue > qtyMaxValue)
                {
                    $(qtyEle).val(qtyMaxValue);
                    $(qtyEle).parent().find(".mz-validationmessage").fadeIn(200);
                    if(qtyMaxValue === 1){
                        $(qtyEle).parent().find(".mz-validationmessage").html("Not in Stock. Please enter below 2");
                    }else{
                        $(qtyEle).parent().find(".mz-validationmessage").html("Not in Stock. Please enter below "+qtyMaxValue);
                    }
                    $(qtyEle).parent().find(".mz-validationmessage").delay(1000).fadeOut(500);
                }
            },
            quantityBoxVal: function(e) {
                var qtyEle = e.target;
                if(parseInt($(qtyEle).val()) === 0 ||  $(qtyEle).val() === "")
                {
                    $(qtyEle).val(1);
                }
            },
            
            backOrderPopUp: function (e) { 
                $('.mz-backorder-popup').fadeIn(500);
            },

            
            sizeUpdate: function (e) {  
                if($(e.target).attr("data-mz-product-option") === "tenant~size"){
                    $('.product-size-selected-value').html($(e.target).find('option:selected').html());    
                }else if($(e.target).attr("data-mz-product-option") === "tenant~lead-wire"){
                    $('.product-leadwire-selected-value').html($(e.target).find('option:selected').html());    
                }else if($(e.target).attr("data-mz-product-option") === "tenant~color-temperature-option"){
                    $('.product-temperature-selected-value').html($(e.target).find('option:selected').html());    
                }  
                $('.mz-price').fadeTo(0, 0.2);
                $(".mz-productdetail-conversion-buttons .mz-productdetail-addtocart").addClass("is-processing");
                $(".mz-productdetail-conversion-buttons .mz-productdetail-addtocart").html("Processing..."); 
                this.onOptionChange($(e.target));
            },
            render: function () {
                var me = this;
                var val = false;
                 _.each(this.model.attributes.options.toJSON(),function(opt){
                    if((opt.attributeDetail.usageType === "Extra") && (opt.isRequired) && (opt.values[0].deltaPrice < 1)&&(opt.values.length === 1)){
                        val = true;             
                    }
                });
                if(val){   
                    this.model.set("crproduct", true);
                }
                var pricelabel = $(document).find("#customersegmentval").val();
                var priceval = $(document).find("#customersegmentvallabel").val();
                if((pricelabel !== undefined)&&(priceval !== undefined)){
                    this.model.attributes.segpricelabel=priceval;
                }    
                var msrp = this.model.attributes.price.attributes.msrp;
                var quantity = this.model.attributes.quantity;
                var price = (this.model.attributes.price.attributes.salePrice) ? this.model.attributes.price.attributes.salePrice : this.model.attributes.price.attributes.price;
                var tempval = (msrp * quantity) - (price * quantity);
                var saveprice = tempval.toFixed(2);
                me.model.set("saveprice", saveprice);
                Backbone.MozuView.prototype.render.apply(this);
                
                var userlabel = require.mozuData("user").isAnonymous;
                if(!userlabel){
                    $(document).find(".customersaleprice").each(function(){
                        $(this).show();
                    });
                }
                var sele = $('.mz-productoptions-option.sb-color'),
                    selected_color = $.trim(sele.val());
                
                $('.mz-productlisting-savings').find('span').html((saveprice != "undefined" ? "$"+saveprice : ""));
                
                if (selected_color !== "") {
                    $('.product-color-selected-value').html($('.mz-productoptions-option.sb-color option:selected').text());
                }
                
                //if($('.mz-size-content') !== "undefined")
                //    $('.product-size-selected-value').html($('.mz-size-content').find('option:selected').html());
                
                if($('.mz-size-content').length > 0){
                    $('.mz-size-content').each(function(i,j){
                        if($(j).attr("data-mz-product-option") === "tenant~size"){
                            $('.product-size-selected-value').html($(j).find('option:selected').html());    
                        }else if($(j).attr("data-mz-product-option") === "tenant~lead-wire"){
                            $('.product-leadwire-selected-value').html($(j).find('option:selected').html());    
                        }else if($(j).attr("data-mz-product-option") === "tenant~color-temperature-option"){
                            $('.product-temperature-selected-value').html($(j).find('option:selected').html());    
                        }
                    });   
                }
                
                $('.mz-productlisting-savings').children('span').html("$"+saveprice);
                
                $('.internalLinks a').on('click', function () {

                    if ($(this).hasClass('videos')) {
                        if ($(window).width() > 767) {
                            $(".product-detail-tabs").find("a[href='#tab-6']").trigger("click");
                            if ($('.video-preview').find(".item").length > 4 && !$('.video-preview').hasClass('.owl-carousel')) {
                                $('.video-preview').owlCarousel({
                                    loop: true,
                                    margin: 10,
                                    nav: true,
                                    items: 3
                                });
                            }
                        } else {
                            $(".r-tabs-accordion-title").find("a[href='#tab-6']").trigger("click");
                        }
                    } else if ($(this).hasClass('downloads')) {
                        $(".product-detail-tabs").find("a[href='#tab-2']").trigger("click");
                    } else if ($(this).hasClass('specification')) {
                        $(".product-detail-tabs").find("a[href='#tab-3']").trigger("click");
                    }

                    $("html, body").animate({
                        scrollTop: $('#horizontalTab').offset().top - 100   
                    }, 100);
                });

                
                $('.spec-link').on('click', function(e) {
                    e.stopPropagation();  
                    if($(this).parent().hasClass('r-tabs-state-active'))
                    {
                        $(".product-detail-tabs").find("a[href='#tab-2']").trigger("click");
                        $("html, body").animate({
                            scrollTop: $('#horizontalTab').offset().top - 100
                        });
                    }
                });
                
                if ("undefined" != typeof $.cookie("guestWishList")) {

                    var cookieData = $.cookie("guestWishList").split('|'),
                        optValue = {},
                        option,
                        thisModel = this.model;

                    if (cookieData[0] == location.search.replace('?', '')) {
                        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '';

                        if (cookieData.length == 2) {
                            cookieData[1].split("&").map(function (value) {
                                optValue[value.split("=")[0]] = value.split("=")[1];
                            });

                            if (!require.mozuData("pagecontext").user.isAnonymous) {

                                $.each(optValue, function (i, v) {
                                    option = thisModel.get('options').get(i);
                                    option.set('value', v);
                                });
                                $('.mz-wishproductlist').addClass("is-processing"); 
                                thisModel.addToWishlist();
                                document.cookie = "guestWishListe=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
                                window.history.pushState({
                                    path: newurl
                                }, '', newurl);
                            }

                        } else {
                            if (!require.mozuData("pagecontext").user.isAnonymous) {
                                $('.mz-wishproductlist').addClass("is-processing"); 
                                thisModel.addToWishlist();
                                document.cookie = "guestWishListe=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
                                window.history.pushState({
                                    path: newurl
                                }, '', newurl);
                            }
                        }
                    }
                }

                $('.mz-backorder-popup button').on('click', function () {
                    $('.mz-backorder-popup').fadeOut(500);
                });
                
                //update quantity box
                if ( this.model.get("inventoryInfo") )
                {
                    if( "undefined" == this.model.get("inventoryInfo").onlineStockAvailable || 1 > this.model.get("inventoryInfo").onlineStockAvailable )
                    {
                        if(this.model.get("inventoryInfo").outOfStockBehavior !== "AllowBackOrder")
                        {
                            $(".mz-productdetail-qty").attr("disabled", "disabled");
                            $(".mz-productdetail-qty").addClass("is-disabled");
                            
                        }
                    }
                    else {
                        $(".mz-productdetail-qty").removeAttr("disabled");
                        $(".mz-productdetail-qty").removeClass("is-disabled");
                    }
                }
                
                //pdp main gallery mobile
                 if($(window).width() > 767 ) {
                     $('.mz-productimages-thumbs').owlCarousel({  
                        dots: false,
                        autoplay:false, 
                        showNavPreview: false,
                        responsive : {    
                            1024 : {
                                loop:false,
                                items: 4
                            },
                            768 : {
                                loop:false,
                                items: 4
                            },
                            640 : {
                                items: 1,
                                dots: true,
                                nav: ($('.mz-productimages-thumbimage').length > 1 ? true : false),
                                loop: true
                            },
                            300 : {
                                loop: true,
                                items: 1,
                                dots: true,
                                nav: ($('.mz-productimages-thumbimage').length > 1 ? true : false)
                            }
                        },    
                        nav: ($('.mz-productimages-thumbimage').length > 4 ? true : false),
                        addClassActive:true,
                        navThumbImg: false
                    });
                }

                //google analytics
                
                setTimeout(function(){
                    if($(document).find(".mz-productdetail-conversion-cart").find("#out_of_stock").length > 0){
                        $(document).find(".mz-productdetail-conversion-cart").find("#out_of_stock").click();
                    }
                }, 2000);
                
            },


            showAddToCartDialog: function (e) {
                var $target = e.currentTarget,
                    me = this;
                var flag=true;
                _.each(this.model.get('options').toJSON(), function (val, index) {
                    if(val.attributeDetail.usageType==="Extra" && flag && val.attributeFQN!== require.mozuData("sitecontext").themeSettings.singleCustomisedBulbMostPopularExtra &&  val.attributeFQN!== require.mozuData("sitecontext").themeSettings.doubleCustomisedBulbMostPopularExtra ){
                        if((val.values[0].deltaPrice < 1) && (val.values.length === 1) && (val.isRequired)){
                        }else{
                            flag=false; 
                            me.model.set("closestate",val.attributeFQN);
                        }
                    } 
                    var indv = _.findWhere(me.model.get('options').models, {
                        id: val.attributeFQN
                    });
                    var iscolor = _.contains(_.pluck(me.model.get('options').models, 'id'), "tenant~color");
                    if (indv.id !== "tenant~color") {
                        indv.set('iscolor', iscolor);
                        indv.set('index', index);
                    } else {
                        indv.set('iscolor', iscolor);
                        indv.set('index', "color");
                    }
                });
                var product = this.model;
                var producttype = this.model.attributes.productType;
                var modelW = new CustomOptionModel($target, product, producttype);
                
                $('body').css({'height':$(window).height() , 'overflowY': "hidden", 'position': 'relative', '-ms-overflow-y': "hidden"});

            },
            getKeyByValue: function (obj, value) {
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        if ($.inArray(value, obj[prop]) !== -1)
                            return prop;
                    }
                }
            },
            onOptionChange: function (e) {
                return this.configure(e);
            },
            configure: function ($optionEl) {
                var newValue = $optionEl.val(),
                    oldValue,
                    id = $optionEl.data('mz-product-option'),
                    optionEl = $optionEl[0],
                    isPicked = (optionEl.type !== "checkbox" && optionEl.type !== "radio") || optionEl.checked,
                    option = this.model.get('options').get(id);
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
            },
            addToCart: function (e) {
                var obj = e.currentTarget;
               
                $(obj).addClass("is-processing");
                this.model.addToCart();

                Api.on('error', function (badPromise, xhr, requestConf) {
                    if (badPromise.message.indexOf('limited quantity') != -1) {

                        $(obj).removeClass("is-processing");
                        badPromise.message = Hypr.getLabel('insufficientinventory');


                    }
                });

            },
             addTocartExtramultiple:function(e){
                var oldValue;
                var me=this;
                var $target = $(e.currentTarget);
                $target.addClass("is-processing"); 
                var dataarray=$target.data("mz-extracode").split(",");
                var dataobj=me.model.get("options").toJSON();
                $(dataobj).each(function(i,j){
                    var id=$(this)[0].attributeFQN;
                    var option=me.model.get("options").get(id).toJSON();
                     if(!option.values[0].isSelected){
                        me.model.get("options").get(id).set('value', dataarray[i]);     
                    }
                    if(i==dataobj.length-1){
                         me.model.addToCart(); 
                    }
                });  
                   Api.on('error', function (badPromise, xhr, requestConf) {  
                    if (badPromise.message.indexOf('limited quantity') != -1) {
                        $target.removeClass("is-processing");
                        badPromise.message = Hypr.getLabel('insufficientinventory');
                    }
                });
                me.model.on('addedtocart', function () {
                     $target.removeClass("is-processing");
                    CartMonitor.updateCart();

                }); 
                
            },
             addTocartExtra:function(e){
                var oldValue;
                var me=this;
                var $target = $(e.currentTarget);
                $target.addClass("is-processing");
                var id=me.model.get("options").toJSON()[0].attributeFQN;
                var option=me.model.get("options").get(id).toJSON();
                var newValue=$target.data("mz-extracode");
                if(!me.model.get("options").get(id).toJSON().values[0].isSelected){
                   me.model.get("options").get(id).set('value', newValue);     
                }
                
                me.model.addToCart(); 
                    
                Api.on('error', function (badPromise, xhr, requestConf) {  
                    if (badPromise.message.indexOf('limited quantity') != -1) {
                        $target.removeClass("is-processing");
                        badPromise.message = Hypr.getLabel('insufficientinventory');
                    }
                });
                 me.model.on('addedtocart', function () {
                     $target.removeClass("is-processing");
                    CartMonitor.updateCart();

                });
            }, 
            addToWishlist: function (e) {
                var obj = e.currentTarget;
                $(obj).addClass("is-processing");
                this.model.addToWishlist();
            },
            addToWishlistExtra: function (e) {
                var me=this;
                var $target = $(e.currentTarget);
                $target.addClass("is-processing"); 
                var dataarray=$target.data("mz-extracode").split(",");
                var dataobj=me.model.get("options").toJSON();
                $(dataobj).each(function(i,j){
                    var id=$(this)[0].attributeFQN;
                    var option=me.model.get("options").get(id).toJSON();
                    
                    if(!option.values[0].isSelected){
                        me.model.get("options").get(id).set('value', dataarray[i]);     
                    }
                });  
                this.model.addToWishlist();
            },            
            guestWishlistExtra: function (e) {
                var me=this;
                var $target = $(e.currentTarget);
                $target.addClass("is-processing"); 
                var dataarray=$target.data("mz-extracode").split(",");
                var dataobj=me.model.get("options").toJSON();
                $(dataobj).each(function(i,j){
                    var id=$(this)[0].attributeFQN;
                    var option=me.model.get("options").get(id).toJSON();
                    
                    if(!option.values[0].isSelected){
                        me.model.get("options").get(id).set('value', dataarray[i]);     
                    }
                });
                
                $('[data-mz-loginpopup]').trigger('click');
                
                //randomstring for verification
                var randomString = Math.random().toString(36).substr(2, 8),
                    customProObj = {};

                $.each(me.model.getConfiguredOptions(), function (i, v) {
                    customProObj[v.attributeFQN] = v.value;
                });

                if (history.pushState && "" !== $.param(customProObj)) {
                    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + randomString,
                        newDate = new Date();

                    newDate.setTime(newDate.getTime() + (10 * 60 * 1000));

                    window.history.pushState({
                        path: newurl
                    }, '', newurl);
                    document.cookie = "guestWishList=" + randomString + "|" + $.param(customProObj) + ";expires=" + newDate.toUTCString() + ";/";
                }
            },
            guestWishlist: function (e) {
                var obj = e.currentTarget,
                    randomString = Math.random().toString(36).substr(2, 8);
                $('[data-mz-loginpopup]').trigger('click');

                if (history.pushState) {
                    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + randomString,
                        newDate = new Date();

                    newDate.setTime(newDate.getTime() + (10 * 60 * 1000));

                    window.history.pushState({
                        path: newurl
                    }, '', newurl);
                    document.cookie = "guestWishList=" + randomString + ";expires=" + newDate.toUTCString() + ";/";
                }
            },
            checkLocalStores: function (e) {
                var me = this;
                e.preventDefault();
                this.model.whenReady(function () {
                    var $localStoresForm = $(e.currentTarget).parents('[data-mz-localstoresform]'),
                        $input = $localStoresForm.find('[data-mz-localstoresform-input]');
                    if ($input.length > 0) {
                        $input.val(JSON.stringify(me.model.toJSON()));
                        $localStoresForm[0].submit();
                    }
                });

            },
            switchSelectedImage: function (e) {
                var target = $(e.currentTarget);
                var id = $.trim($(e.currentTarget).data('mz-product-option'));
                var coloroption = Hypr.getThemeSetting('coloroption');
                var productData = this.model.apiModel.data;
                if (id == 'tenant~color') {
                    //loader for price
                    $('.mz-price').fadeTo(0, 0.2);
                    
                    //Cart button loader
                    $(".mz-productdetail-conversion-buttons .mz-productdetail-addtocart").addClass("is-processing");
                    $(".mz-productdetail-conversion-buttons .mz-productdetail-addtocart").html("Processing...");
                    
                    // Product gallery hide
                    if(!$(e.target).hasClass('active'))
                    {
                        $(".loader-product").show();
                        $(".mz-productimages-thumbs").fadeTo(1000, 0.3);
                        $('.mz-productimages-main .mz-productimages-mainimage').fadeTo(1000, 0.3);
                        var ele = $(e.target).attr('color_value');
                        $('.product-color-selected-value').html(ele);
                        
                        $(e.target).siblings(".color-span").css({"opacity":"0.3"});
                        $(e.target).siblings(".active").removeClass("active");
                        $(e.target).addClass("active");
                    }
                    $(this).addClass('activeColorBox');
                    $(this).siblings().removeClass('activeColorBox');

                    $('.color-outer').removeClass("activeColorImage");
                    $(e.currentTarget).parent().addClass("activeColorImage");
                    $('.color_value').css('display', 'block');
                    
                    var select_color = $.trim(target.attr('color_value')),
                        sele = $('.mz-productoptions-option.sb-color'),
                        selectedOpt = $('.mz-productoptions-option.sb-color option:selected');
                    selectedOpt.removeAttr('selected');
                    sele.val(select_color);
                    this.onOptionChange(sele);
                    
                    // To check any disabled options are selected in previous
                    var avoidDisable = this;
                    this.model.get('options').models.map(function(v,i){
                        if(v.id == "tenant~lead-wire" && v.attributes.values.length > 1  && typeof v.attributes.value == "undefined" ){
                            $('.mz-size-content.Option option:selected').removeAttr('selected');
                            avoidDisable.onOptionChange($('.mz-size-content.Option'));
                        }
                    });
                    
                } else {

                    
                }
            },
            initialize: function () {
                // handle preset selects, etc
                var me = this;
                
                this.$('[data-mz-product-option]').each(function () {
                    var $this = $(this),
                        isChecked, wasChecked;
                    var optiontype = $(this).attr("option-type");

                    if (optiontype.toLowerCase() != "extra") {
                        if ($this.data("mz-product-option").toLowerCase() == "tenant~lead-wire") {
                            if ($this.val()) {
                                switch ($this.attr('type')) {
                                case "checkbox":
                                case "radio":
                                    isChecked = $this.prop('checked');
                                    wasChecked = !!$this.attr('checked');
                                    if ((isChecked && !wasChecked) || (wasChecked && !isChecked)) {
                                        me.configure($this);
                                    }
                                    break;
                                default:
                                    me.configure($this);
                                }
                            } 
                        } 
                        else if ($this.data("mz-product-option").toLowerCase() == "tenant~size")  {
                            if ($this.val()) {
                                switch ($this.attr('type')) {
                                case "checkbox":
                                case "radio":
                                    isChecked = $this.prop('checked');
                                    wasChecked = !!$this.attr('checked');
                                    if ((isChecked && !wasChecked) || (wasChecked && !isChecked)) {
                                        me.configure($this);
                                    }
                                    break;
                                default:
                                    me.configure($this);
                                }
                            } 
                        }
                        else if ($this.data("mz-product-option").toLowerCase() == "tenant~color-temperature-option")  {
                            if ($this.val()) {
                                switch ($this.attr('type')) {
                                case "checkbox":
                                case "radio":
                                    isChecked = $this.prop('checked');
                                    wasChecked = !!$this.attr('checked');
                                    if ((isChecked && !wasChecked) || (wasChecked && !isChecked)) {
                                        me.configure($this);
                                    }
                                    break;
                                default:
                                    me.configure($this);
                                }
                            } 
                        }
                        else {
                            if ($this.val()) {
                                switch ($this.attr('type')) {
                                case "checkbox":
                                case "radio":
                                    isChecked = $this.prop('checked');
                                    wasChecked = !!$this.attr('checked');
                                    if ((isChecked && !wasChecked) || (wasChecked && !isChecked)) {
                                        me.configure($this);
                                    }
                                    break;
                                default:
                                    me.configure($this);
                                }
                            }
                        }
                    }

                });
                Api.request('GET', '/api/commerce/catalog/storefront/categories/tree')
                    .then(function (CategoryTree) {
                        if (CategoryTree.items) {
                            var CategoryItems = CategoryTree.items,
                                catlength = CategoryItems.length,
                                htmlcontent = '';
                            for (var catindex = 0; catindex < catlength; catindex++) {
                                var catrootname = CategoryItems[catindex].categoryId;
                                CategoryHeirachyList[catrootname] = [];
                                var childcatitems = CategoryItems[catindex].childrenCategories;
                                if (childcatitems.length > 0) {
                                    for (var childitemind = 0; childitemind < childcatitems.length; childitemind++) {
                                        CategoryHeirachyList[catrootname].push(childcatitems[childitemind].categoryId);
                                        var subchilditems = childcatitems[childitemind].childrenCategories;
                                        if (subchilditems.length > 0) {
                                            for (var subitemind = 0; subitemind < subchilditems.length; subitemind++) {
                                                CategoryHeirachyList[catrootname].push(subchilditems[subitemind].categoryId);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        var productCategorydata = me.model.apiModel.data.categories;
                        _.each(productCategorydata, function (imgdata) {
                            var catid = me.getKeyByValue(CategoryHeirachyList, imgdata.categoryId);
                            if (catid == 11) {
                                if (PorjectIndex < 4) {
                                    arraydata.push(imgdata.content);
                                }
                                PorjectIndex++;
                            }
                        });

                    });

            }
        });

        var ProductProjectView = Backbone.MozuView.extend({
            templateName: 'modules/product/projectportf1olio',
            render: function () {
                Backbone.MozuView.prototype.render.apply(this, arguments);
            }

        });


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
               // }    
                
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
                
                
                if(bulbtype !== "" ){ 
                    apival = "and (properties.bulbtype+eq+"+bulbtype+")";       
                }
                if(colortemp !== "" ){
                    apival += "and (properties.color-temperature+eq+"+colortemp+")";    
                }
                
                $($target).parents(".customised_view").find(".preloader").show();
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

        var ColorImageCache = {},
            arraydata = [],
            CategoryHeirachyList = {},
            PorjectIndex = 0;
        var projectArray = [];
        $(document).ready(function () {
            if (location.hash.length > 0) {
                if(location.hash.substring(1, location.hash.length) === "tab-5"){
                    $("html, body").animate({
                            scrollTop: $(".rtab-5").offset().top - 200
                        }, "medium");
                    if($(window).width() < 768){
                        setTimeout(function(){  
                            $(".product-detail-tabs").find("a[href='#tab-5']").trigger("click");
                        },3000);
                    }else{
                        $(".rtab-5").find("a").click();
                    }
                }
            } 
            $(document).on("click","#desrating", function(e){
                $("html, body").animate({ 
                    scrollTop: $(".rtab-5").offset().top - 200
                }, "medium");
            }); 
            
            if($(window).width() < 768){
                if($("[itemprop='reviewCount']").text() !== ""){
                    $("#pdpmobilerating").text("("+$("[itemprop='reviewCount']").text()+")");
                } 
                $(document).on("click", ".pdpmobileratelink", function(e){  
                    if(!($(".product-detail-tabs").find("a[href='#tab-5']").parent().hasClass("r-tabs-state-active"))){
                        $(".product-detail-tabs").find("a[href='#tab-5']").trigger("click");
                    }
                    $("html, body").animate({
                        scrollTop: $(".r-tabs-accordion-title").find("a[href='#tab-5']").offset().top - 150
                    }, "medium");
                });
                $(document).on("click", "#writereview_snippet", function(e){
                    if($(document).find(".pr-write-review-link").find("div").length > 0){
                        $(document).find(".pr-write-review-link").find("div").click();       
                    }else{
                        $(document).find(".pr-write-review-link")[0].click();   
                    }    
                });    
            }
            
            var productCode = $('[data-mz-prodtcode]').first().data('mzProdtcode');

            Api.request('GET', '/api/commerce/catalog/storefront/products/' + productCode + '/locationinventory?locationCodes=ALLDC').then(function (response) {

            });

            $('.feature-images').children("span").on('mouseover',function (e) {
                $(this).addClass('on');
                if($(this).children("p").length === 0) {
                    $(this).removeClass('on');
                }
            });

            $(document).on("click", ".prodvideo", function (e) {
              
                var obj = $(e.currentTarget);
                var dtsrc = $(obj).attr("datavideo");
                var newsrc = "http://www.youtube.com/embed/" + dtsrc + "?autoplay=1&showinfo=0&controls=0' frameborder='0' allowfullscreen";
                $(obj).parents(".video-carousel").find(".mz-embedvideo").attr("src", newsrc);
            });
            var pageCntxt = require.mozuData('pagecontext');
            $('body').on('keyup', function (e) {
                if (e.which == 27) {
                    return false;
                }
            });


            var prodinfo = require.mozuData("product");

            var videoresourcehtml = "";
            var mobileResource = "";

            var resourcehtml = "";
            _.each(prodinfo.properties, function (propitm) {

                var sitecontext = require.mozuData('sitecontext');

                var imagefilepath = sitecontext.cdnPrefix + '/cms/' + sitecontext.siteId + '/files';
                if (propitm.attributeFQN.toLowerCase() === "tenant~documents") {
                    if (propitm.values[0] !== undefined) {
                        var documents = propitm.values[0].stringValue;
                        var docarray = documents.split(",");
                        var res = [];
                        for (var i = 0; i < docarray.length; i++) {
                            var index = docarray[i].indexOf(":");
                            var key = docarray[i].substring(0, index);

                            var datakey = docarray[i].substring(index + 1);

                            resourcehtml += "<h3>" + key + "</h3><h4><a href='" + imagefilepath + '/' + datakey + "' target='_blank' title='" + key + "'>" + datakey + "</a></h4>";
                        }

                    }
                }
            });
            $(document).on('click', '.pdp-top-arrow', function (e) {
                $("html, body").animate({
                    scrollTop: "0"
                }, 1000);
            });

            $(document).on('click', '.addtocartfloating', function (e) {
                $(".mz-productdetail-addtocart").trigger("click");
            });
            $(document).on('click', '.customwishlist', function (e) {
                var lengthofmodel = $(".cart-overlay").length;
                if (lengthofmodel === 0) {
                    $(".mz-prdOption").trigger("click");
                }

            });

            if ($(window).width() <= 767) {
                $(document).on('click', '.write-review', function (e) {
                    e.preventDefault();

                    $(".r-tabs-accordion-title").find("a[href='#tab-4']").click();
                    $("html, body").animate({
                        scrollTop: $(".rtab-4").offset().top - 200
                    }, "medium");
                });
                $(document).on('click', '.r-tabs-accordion-title', function (e) {
                    e.preventDefault();
                    var post = $(this).offset(),
                        top = post.top - 160;
                    $(window).scrollTop(top);
                    reInitializeOwnlCaraousal();
                });

            } else if (($(window).width() > 768 && $(window).width()) < 979) {
                $(document).on('click', '.fixed > li', function (e) {
                    $(window).scrollTop(900);
                });
            } else {
                $(document).on('click', '.fixed > li', function (e) {
                    $(window).scrollTop(840);
                });
                $(document).on('click', '.write-review', function (e) {
                    e.preventDefault();

                    $(".rtab-4").find("a").click();
                    $("html, body").animate({
                        scrollTop: $(".rtab-4").offset().top - 200
                    }, "medium");
                });
            }

            $(document).on('click', '.read-more', function (e) {
                e.preventDefault();
               
                if($(window).width() < 767)
                {
                    $(".r-tabs-accordion-title").find("a[href='#tab-1']").click();
                    $("html, body").animate({
                        scrollTop: $(".rtab-1").offset().top - 60
                    }, "medium");
                }
                else
                {
                    $(".rtab-1").find("a").click();
                    $("html, body").animate({
                        scrollTop: $(".rtab-1").offset().top - 200
                    }, "medium");
                }
            });

            function reInitializeOwnlCaraousal(){
                var owl = $(document).find("#tab-6").find(".video-linkcontainer-mobile");
                var x = owl.data('owlCarousel');

                owl.trigger('destroy.owl.carousel');
                owl.html(owl.find('.owl-stage-outer').html()).removeClass('owl-loaded');
                loadVideoGallery();
            }
            //load video gallery

            function loadVideoGallery() { 

                if($(document).find("#tab-6").find(".video-linkcontainer-mobile").children().length > 1){
                    $(document).find("#tab-6").find(".video-linkcontainer-mobile").addClass('owl-carousel').owlCarousel({ 
                        items:1,
                        loop: true, 
                        singleItem:true,
                        nav:true,
                        touchDrag: true,
                        dots: false
                    });
 
                    productView.render();
                }
            }

            //stop youtube video
            function pauseYouTubeVideo(elm) {

            }

            $('#horizontalTab .product-detail-tabs-wrap').responsiveTabs({
                rotate: false,
                startCollapsed: 'accordion',
                collapsible: 'accordion',
                setHash: true,
                disabled: [6, 7],
                activate: function (e, tab) {
                    $('.info').html('Tab <strong>' + tab.id + '</strong> activated!');
                },
                activateState: function (e, state) {
                    $('.info').html('Switched from <strong>' + state.oldState + '</strong> state to <strong>' + state.newState + '</strong> state!');
                }
            });



            

            $('.r-tabs-anchor').on('click', function () {
                if ($(this).attr("href") == "#tab-6") {   
                    videoPreviewGallery();
                }
            });

            if ($('#horizontalTab li.r-tabs-state-active').children('.r-tabs-anchor').attr('href') == "#tab-6") {
                videoPreviewGallery();
            }

            function videoPreviewGallery() {
                if (!$('.video-preview').hasClass('.owl-carousel')) {
                    $('.video-preview').owlCarousel({
                        loop: true,
                        margin: 10,
                        nav: ($('.video-preview').find(".item").length > 3? true: false),
                        items: 3
                    });
                }
            }

            // show/hide Tab menu

            tabMenuShowHide();
            $(window).on('scroll', function () {
                tabMenuShowHide();
            });
            function tabMenuShowHide() {
                var navHeight = $(window).height() - 75;
                if ($(window).width() > 767) {
                    if ($(window).scrollTop() > $('.mz-l-container').height() + 30) {

                        $(".pdp-float-header").fadeIn();
                        $('ul.megaMenuMain').stop(true).fadeOut(300);
                        $('#vt-header').fadeOut(300);

                        if ($('.product-detail-tabs').css('position') !== 'fixed') {
                            $(".product-detail-tabs").fadeOut(function () {
                                $('.product-detail-tabs').addClass('fixed');
                                $(".product-detail-tabs").fadeIn(function () {});
                            });
                        }

                    } else {
                        $(".pdp-float-header").fadeOut();
                        $('.mz-pagefooter').css({
                            'padding-bottom': "0px"
                        });
                        $('ul.megaMenuMain').stop(true).fadeIn(300);
                        $('#vt-header').fadeIn(300);
                        $('#').fadeIn(300);

                        if ($('.product-detail-tabs').css('position') == 'fixed') {
                            $(".product-detail-tabs").fadeOut(function () {
                                $('.product-detail-tabs').removeClass('fixed');
                                $(".product-detail-tabs").fadeIn(function () {});
                            });
                        }
                    }
                }
                else {
                    if ($(document).scrollTop() > $('.mz-l-container').height()) {
                        $(".pdp-float-header").fadeIn();
                        $('.mz-pagefooter').css({
                            'padding-bottom': "80px"
                        });
                    } else {
                        $(".pdp-float-header").fadeOut();
                    }
                }

            }
            function reviewCounts(){
                if($(".pr-snapshot-average-based-on-text").length > 0){
                    $("#pdpmobilerating").text("("+$(".pr-snapshot-average-based-on-text").find("span").text()+")");
                }else{
                    $("#pdpmobilerating").text("(0)"); 
                }
            }
            var product = new ProductModels.Product(prodinfo),
                recentProduct = {
                    code: prodinfo.productCode
                },
                productProperties = product.apiModel.data.properties,
                productcolorimagesstr = "";

            var customizeimgProduct = "",
                customizeimagecachearr = {};
            productProperties = product.apiModel.data.properties;
            for (var index1 = 0; index1 < productProperties.length; index1++) {
                if (productProperties[index1].attributeFQN == "tenant~customizecart" || productProperties[index1].attributeFQN == "Tenant~Customizecart") {
                    for (var val1 in productProperties[index1].values) {
                        customizeimgProduct = $.trim(productProperties[index1].values[val1].stringValue);
                    }
                }
            }

            if (customizeimgProduct !== "") {
                var cutomarr = customizeimgProduct.split(";");
                _.each(cutomarr, function (imgdata) {
                    var customprod = $.trim(imgdata),
                        dataarr = customprod.split(":"),
                        customprodname = dataarr[0],
                        customprodimg = dataarr[1],
                        imagejson = {};
                    imagejson.imageUrl = imagefilepath + '/' + $.trim(customprodimg);
                    customizeimagecachearr[customprodname] = imagejson;
                });
            }
            var t = Api.context.tenant;
            var s = Api.context.site;
            var filepath = ""+require.mozuData("sitecontext").cdnPrefix+"/cms/" + s + "/files/";
            
            // customized add to cart end
            var relatedprojectsHtml = "<h3>Projects Featuring</h3>";
            relatedprojectsHtml += "<h4>"+product.apiModel.data.content.productName+"</h4><ul class='projects-featuring-gallery'>";

            var cde = $('[data-mz-prodtcode]').first().data('mzProdtcode');
            var projarrayy = [];
            var prjid = Hypr.getThemeSetting('Project_Cid');
            Api.request('GET', "/api/commerce/catalog/storefront/productsearch/search/?query=&startIndex=0&pageSize=200&filter=categoryId%20req%20"+prjid).then(function (prjctinfo) {

                var projlength = prjctinfo.items.length;
                var dynamicArrayobj = [];
                var indexar = 0;
                _.each(prjctinfo.items, function (subproductitem, totalloop) {
                    var Projobj = _.findWhere(subproductitem.properties, {
                        attributeFQN: "tenant~products-in-project"
                    });

                    if (Projobj) {

                        indexar++;
                        var tempval = Projobj.values[0].value.replace(/"/g, "").replace("[", "").replace("]", "");

                        var tempArray = tempval.split(",");
                        var flaug = false;
                        for (var i = 0; i < tempArray.length; i++) {
                            if (tempArray[i] == cde) {
                                flaug = true;
                            }
                        }
                        if (flaug) {
                            dynamicArrayobj.push(subproductitem.productCode);
                            flaug = false;
                        }
                    } else {
                        indexar++;
                    }
                    if (indexar == projlength) {

                        for (var iarray = 0; iarray < dynamicArrayobj.length; iarray++) {
                            /* jshint ignore:start */
                            Api.get('product', dynamicArrayobj[iarray]).then(function (productObjecsst) {
                                projarrayy.push(productObjecsst.data);
                                if (projarrayy.length == dynamicArrayobj.length) {

                                    renderobj(projarrayy);
                                }
                            });
                            /* jshint ignore:end */
                        }

                    }

                });

            });

            function renderobj(obj) {

                _.each(obj, function (catdata) {
                    var seourl = (catdata.content.seoFriendlyUrl)?"/"+catdata.content.seoFriendlyUrl+"":"";
                    _.each(catdata.content.productImages, function (catimgdata, index) {
                        if (index === 0) {
                            relatedprojectsHtml += "<li class='products-list-item projects-featuring-gallery-item'> <a href='"+seourl+"/p/" + catdata.productCode + "' class='projects-featuring-gallery-item-inner'><figure class='projects-featuring-gallery-image-wrap'>";
                            if (pageCntxt.isDesktop) {
                                relatedprojectsHtml += "<img class='projects-featuring-gallery-image' src='" + catimgdata.imageUrl + "?max="+require.mozuData("sitecontext").themeSettings.listProductThumbSize+"&quality=" + cdnquality + "' alt='"+catimgdata.altText+"' />";
                            } else if (pageCntxt.isMobile) {
                                relatedprojectsHtml += "<img class='projects-featuring-gallery-image' src='" + catimgdata.imageUrl + "?max="+require.mozuData("sitecontext").themeSettings.listProductThumbSize+"&quality=" + cdnquality + "' alt='"+catimgdata.altText+"' />";
                            } else {
                                relatedprojectsHtml += "<img class='projects-featuring-gallery-image' src='" + catimgdata.imageUrl + "?max="+require.mozuData("sitecontext").themeSettings.listProductThumbSize+"&quality=" + cdnquality + "' alt='"+catimgdata.altText+"' />";
                            }
                            relatedprojectsHtml += "</figure><h4 class='projects-featuring-gallery-name'>"+catdata.content.productName+"</h4></a></li>";
                        }
                    });
                });
                relatedprojectsHtml += "</ul>";
                relatedprojectsHtml += "<a href='/c/"+hypr.getThemeSetting("ProjectListing")+"' class='projects-featuring-link'>View All Projects</a></div>";

                $('.projects-featuring').append(relatedprojectsHtml);
                //if ($(".projects-featuring-gallery").find("li").length > 3) {
                    /*$(".projects-featuring-gallery").owlCarousel({
                        loop: true,
                        margin: 0,
                        nav: true,
                        dots: false,
                        autoplay: true,
                        items: 4,
                        responsive: {
                            0: {
                                items: 1,
                                nav: true
                            },
                            768: {
                                items: 3,
                            },
                            1025: {
                                items: 4,
                            }
                        },
                    });*/
                    //project featuring gallery

                    $('.projects-featuring-gallery').fadeIn(300);
                    $('.projects-featuring-gallery').owlCarousel({
                        responsive: {
                            1024: {
                                items: 4,
                                nav: ($('.projects-featuring-gallery-item').length <= 4 ? false : true),
                            },
                            768: {
                                items: 2,
                                nav: ($('.projects-featuring-gallery-item').length <= 2 ? false : true),
                            },
                            640: {
                                items: 2,
                                nav: ($('.projects-featuring-gallery-item').length <= 2 ? false : true),
                            },
                            300: {
                                items: 1,
                                nav: ($('.projects-featuring-gallery-item').length <= 1 ? false : true),
                            }
                        },
                        lazyLoad : true,
                        loop: false,
                        dots: false,
                        autoplay: false,
                        showNavPreview: true,
                        addClassActive: true,
                        navThumbImg: false
                    });

               // }



            }

            product.on('addedtocart', function (cartitem) {
                if (cartitem && cartitem.prop('id')) {
                    
                    CartMonitor.updateCart(product.get('quantity'));
                    $(document).find(".product-container").find(".mz-messagebar").html("");
                    if($(window).scrollTop() > $('.mz-l-container').height() + 30) {
                        $('body,html').scrollTop(100);
                    }
                    $('.mz-productdetail-addtocart').removeClass("is-processing");
                    
                    
                } else {
                    product.trigger("error", {
                        message: Hypr.getLabel('unexpectedError')
                    });
                }
                if (($(window).width()) < 768) {
                    //Check is user is valid or not
                    window.location.href = HyprLiveContext.locals.pageContext.secureHost + "/cart";
                }
            });

            product.on('addedtowishlist', function (cartitem) {
                $('#add-to-wishlist').removeClass("is-processing");
                $('#add-to-wishlist').prop('disabled', 'disabled').text(Hypr.getLabel('addedToWishlist'));
            });

            var productView = new ProductView({
                el: $('#product-detail'),
                model: product,
                messagesEl: $('[data-mz-message-bar]')
            });

            var productImagesView = new ProductImageViews.ProductPageImagesView({
                el: $('[data-mz-productimages]'),
                model: product
            });
            window.productView = productView;
            productView.render();
            window.productImagesView = productImagesView;
            productImagesView.render();
            if(Hypr.getThemeSetting('managePowerReview')) window.productImagesView.on('render', reviewCounts);
            $(document).on('click', '.mz-productwishlist', function (e) {
                e.preventDefault();
                $(".mz-wishproductlist").click();
            });
            reviewCounts();
            tabMenuShowHide();
        });
    });

