
/**
 * Quick utility to use on Backbone MozuViews. In case some third party
 * absolutely has to bind an event to an individual DOM element, the view will 
 * need to preserve that actual element between renders. Normally, .render()
 * with HyprLive will destroy and recreate the view's entire innerHTML. This
 * function will take a set of CSS selectors and a callback, and will preserve
 * matching elements through multiple renders, by storing a reference to them
 * and then putting them back where they were. Call this function in your
 * .render() method and send the view-destroying function as its
 * `renderCallback`. You'll be glad you did.
 *
 * Example:
 *
 *     define(['preserve-element-through-render', 'backbone'], 
 *       function(preserveElements, Backbone) {
 *         return Backbone.MozuView.extend({
 *           render: function() {
 *             preserveElements(this, ['.v-button'], function() {
 *               Backbone.MozuView.prototype.render.call(this);
 *             });
 *           }    
 *         });
 *     });
 * 
 * 
 * @param {object} view The Backbone.MozuView we're working with.
 * @param {string[]} selectors An array of selectors for elements to preserve.
 * @param {function} renderCallback A callback representing the render action.
 */

define('modules/preserve-element-through-render',['underscore'], function(_) {
  return function(view, selectors, renderCallback) {
    var thisRound = {};
    view._preserved = view._preserved || {};
    _.each(selectors, function(selector) {
      thisRound[selector] = view.$(selector);
    });
    renderCallback.call(view);
    _.each(thisRound, function($element, selector) {
      var $preserved = view._preserved[selector];
      if ($element.length > 0 && (!$preserved || $preserved.length === 0)) {
        $preserved = view._preserved[selector] = $element;
      }
      if ($preserved && $preserved.length > 0) {
        view.$(selector).replaceWith($preserved);
      }
    });

  };
});
define('modules/eventbus',["underscore", "backbone"], function(_, Backbone){
	return _.extend({}, Backbone.Events);
});
define('modules/amazonpay',['modules/jquery-mozu','modules/eventbus',"modules/api",'hyprlivecontext','underscore'],
function($,EventBus, Api, hyprlivecontext, _) {
	var AmazonPay = {
		sellerId : "",
		clientId : "",
		buttonColor: "",
		buttonType: "",
		usePopUp: true,
		isEnabled: false,
		isScriptLoaded: false,
		viewName:"amazon-checkout",
		init:function(loadScript) {
			var paymentSettings = _.findWhere(hyprlivecontext.locals.siteContext.checkoutSettings.externalPaymentWorkflowSettings, {"name" : "PayWithAmazon"});
			if (!paymentSettings || !paymentSettings.isEnabled) return;
			this.isEnabled = paymentSettings.isEnabled;
			var environment = this.getValue(paymentSettings, "environment");
			var isSandbox = environment == "sandbox";
			var region = this.getValue(paymentSettings, "region");
			this.sellerId = this.getValue(paymentSettings, "sellerId");
			this.clientId = this.getValue(paymentSettings, "clientId");
			this.buttonColor = this.getValue(paymentSettings,"buttonColor") || "Gold";
			this.buttonType = this.getValue(paymentSettings,"buttonType") || "PwA";
			this.usePopUp = (this.getValue(paymentSettings, "usepopup") || "true") == "true";
			this.billingType = this.getValue(paymentSettings, "billingAddressOption") ;
			var regionMappings = {"de" : "eu", "uk" : "eu", "us" : "na", "jp" : "jp"};

			if (this.sellerId && this.clientId && loadScript) {
				var self = this;
				window.sandbox = (isSandbox ? "/sandbox" : "");

				if (region != "us")
					window.sandbox += "/lpa";

				var payWithAmazonUrl = "https://static-"+regionMappings[region]+".payments-amazon.com/OffAmazonPayments/"+ region + window.sandbox + "/js/Widgets.js";

				window.onAmazonLoginReady = function() {
					window.amazon.Login.setClientId(self.clientId); //use clientId
				};
			
				$.getScript(payWithAmazonUrl).done(function(scrit, textStatus){
					//console.log(textStatus);
					self.isScriptLoaded = true;
					EventBus.trigger("aws-script-loaded");
				}).fail(function(jqxhr, settings, exception) {
					console.log(jqxhr);
				});
			}
		},
		getValue: function(paymentSetting, key) {
			var value = _.findWhere(paymentSetting.credentials, {"apiName" : key});

			if (!value) 
				return;
			return value.value;
		},
		addCheckoutButton: function(id, isCart) {
			var self = this;
			if (!self.isEnabled) return;
			var redirectUrl = hyprlivecontext.locals.pageContext.secureHost;
			if (!isCart)
				redirectUrl += "/checkout/"+id+"?isAwsCheckout=true&view="+self.viewName;
			else
				redirectUrl += "/cart?cartId="+id+"&isAwsCheckout=true&view="+self.viewName;
			EventBus.on("aws-script-loaded", function(){
				var authRequest;
				window.OffAmazonPayments.Button("AmazonPayButton", self.sellerId, { //use seller id
					type:  self.buttonType,
					color: self.buttonColor,
					useAmazonAddressBook: true,
					size: (!isCart ? "small" : "large"), 
					authorization: function() {
						var scope = "profile postal_code payments:widget payments:shipping_address";
						if (self.billingType === "1")
							scope += " payments:billing_address";
						
						var loginOptions = {scope: scope, popup: self.usePopUp};
						authRequest = window.amazon.Login.authorize (loginOptions,redirectUrl);
					},
					onError: function(error) {
						console.log("AmazonPay widget errorCode: "+error.getErrorCode());
						console.log("AmazonPay widget erorMessage: "+error.getErrorMessage());
					}
				});
			});
		},
		addAddressWidget: function(awsReferenceId) {
			loadAddressWidget(this.sellerId,awsReferenceId);
		},
		addWalletWidget: function(awsReferenceId) {
			loadWalletWidget(this.sellerId, awsReferenceId);
		}
	};
	return AmazonPay;

	function loadWalletWidget(sellerId,awsReferenceId) {
		var divId = "walletWidgetDiv";
		var walletData = {
			sellerId: sellerId,
			onPaymentSelect: function(orderReference) {
				EventBus.trigger("aws-card-selected");
			},
			design : {
				designMode: 'responsive'
			},
			onError: function(error) {
				console.log(error.getErrorCode());
				console.log(error.getErrorMessage());
			}
		};

		if (awsReferenceId) {
			divId = "readOnlyWalletWidgetDiv";
			walletData.displayMode = "Read";
			walletData.amazonOrderReferenceId = awsReferenceId;
		}
		new window.OffAmazonPayments.Widgets.Wallet(walletData).bind(divId);

	}

	function loadAddressWidget(sellerId,awsReferenceId) {
		var divId = "amazonAddressBookWidgetDiv";
		var addressWalletData = {
			sellerId: sellerId,
			design : {
				designMode: 'responsive'
			},
			onOrderReferenceCreate: function(orderReference) {
				var orderReferenceId = orderReference.getAmazonOrderReferenceId();
				EventBus.trigger("aws-referenceOrder-created", {"orderReferenceId": orderReferenceId});
			},
			onAddressSelect: function(orderReference) {

			},
			onError: function(error) {
				console.log("AmazonPay widget errorCode: "+error.getErrorCode());
				console.log("AmazonPay widget erorMessage: "+error.getErrorMessage());
			}
		};

		if (awsReferenceId) {
			delete addressWalletData.onOrderReferenceCreate;
			delete addressWalletData.onAddressSelect;
			addressWalletData.displayMode = "Read";
			addressWalletData.amazonOrderReferenceId = awsReferenceId;
		}
		new window.OffAmazonPayments.Widgets.AddressBook(addressWalletData).bind(divId);
	}
	
});
define('modules/xpresspaypal',['modules/jquery-mozu',
        "modules/api",
        'modules/models-cart',
        'hyprlivecontext',
        'underscore'],
function($, Api, CartModels, hyprlivecontext, _) {

    window.paypalCheckoutReady = function() {

      var siteContext = hyprlivecontext.locals.siteContext,
          externalPayment = _.findWhere(siteContext.checkoutSettings.externalPaymentWorkflowSettings, {"name" : "PayPalExpress2"}),
          merchantAccountId = _.findWhere(externalPayment.credentials, {"apiName" : "merchantAccountId"}),
          environment = _.findWhere(externalPayment.credentials, {"apiName" : "environment"});
          if( (require.mozuData("pagecontext").pageType =="cart") || (require.mozuData("pagecontext").pageType=="checkout")){
            var id = CartModels.Cart.fromCurrent().id || window.order.id;    
          }
          
          var isCart = window.location.href.indexOf("cart") > 0;

        window.paypal.checkout.setup(merchantAccountId.value, {
            environment: environment.value,
            click: function(event) {
                event.preventDefault();
                var url = "../paypal/token?id=" + id + (!document.URL.split('?')[1] ? "": "&" + document.URL.split('?')[1].replace("id="+id,"").replace("&&", "&"));
                if (isCart)
                  url += "&isCart="+ isCart;
                window.paypal.checkout.initXO();
                $.ajax({
                    url: url,
                    type: "GET",
                    async: true,

                    //Load the minibrowser with the redirection url in the success handler
                    success: function (token) {
                        var url = window.paypal.checkout.urlPrefix + token.token;
                        //Loading Mini browser with redirect url, true for async AJAX calls
                        window.paypal.checkout.startFlow(url);
                    },
                    error: function (responseData, textStatus, errorThrown) {
                        console.log("Error in ajax post " + responseData.statusText);
                        //Gracefully Close the minibrowser in case of AJAX errors
                        window.paypal.checkout.closeFlow();
                    }
                });
            },
            button: ['btn_xpressPaypal']
        });
    };
    var paypal = {
      scriptLoaded: false,
     loadScript: function() {
      var self = this;
       if (this.scriptLoaded) return;
        this.scriptLoaded = true;
      $.getScript("//www.paypalobjects.com/api/checkout.js").done(function(scrit, textStatus){
        //console.log(textStatus);

      }).fail(function(jqxhr, settings, exception) {
        console.log(jqxhr);
      });
    }
   };
   return paypal;
});


define('pages/cart',['modules/backbone-mozu', 'underscore', 'modules/jquery-mozu', 'modules/api', 'modules/models-cart', 'modules/cart-monitor', 'hyprlivecontext', 'hyprlive', 'modules/models-product','modules/modal','modules/preserve-element-through-render','modules/amazonPay', 'modules/xpressPaypal'], function (Backbone, _, $,api, CartModels, CartMonitor, HyprLiveContext, Hypr,ProductModels,ModalWindow, preserveElement,AmazonPay, paypal) {
    

    //Cart Delete Pop up 
        var qmodalTemplate = Hypr.getTemplate('modules/cart/cart-itemdelete'), 
            CartDeleteConfirmBoxModel;            

        CartDeleteConfirmBoxModel = function(target, cartViewObj) {
            var self = this;
            self.e = target;
            self.cartViewObj = cartViewObj;
            self.render(qmodalTemplate.render()); 
        };   
        $.extend(CartDeleteConfirmBoxModel.prototype = new ModalWindow(), {
            constructor: CartDeleteConfirmBoxModel, 
            render: function(html) {
                var elem= this.e;
                if(elem.className.indexOf("mz-carttable-item-allremove") != -1)
                {
                    singleitem = '<p class="delete_text">';
                    hidesingle = '<p class="delete_text" style="display: none;">';

                    allitem = '<p class="delete_text" id="removeallitems"style="display: none;">';
                    hideall = '<p class="delete_text" id="removeallitems">';
                    
                    html = html.replace(singleitem, hidesingle);
                    html = html.replace(allitem, hideall);
                    if($.cookie("coupon")){
                        $.removeCookie('coupon');
                    }
                }
                var $modal = $(html);
                this.loadWrapper($modal.appendTo('body'));
                this.bindClose();
                this.open();  
                this.otherEvent();
            },  
            otherEvent: function() {
                $that = this;
                $('#cart-del-confirm-yes').on('click', function(e) {
                    e.preventDefault();
                    if($($that.e).hasClass('mz-carttable-emptylink')){
                        $that.cartViewObj.empty();
                    }else{  
                        $that.cartViewObj.removeItem($that.e);    
                    }
                    $('.amprecommends').empty();
                    $that.e = "";
                    $("#tz-cart-dialog").remove();
                });
                $(document).on('click', '#cart-del-confirm-no', function(e) {
                    e.preventDefault();
                    $('[data-mz-role="modal-close"]').trigger('click');
                    $("#tz-cart-dialog").remove();

                    if($('.mz-carttable-qty-field').val() === "0")
                    {
                        $('.mz-carttable-qty-field').val('');
                    }
                });
            }

        });
        
        var CartView = Backbone.MozuView.extend({
            couponsData:{},
            renderOnChange: [  
                'couponCodes'
            ],
            initialize: function() {
                var me=this;

                this.listenTo(this.model, 'change:couponCode', this.onEnterCouponCode, this);
                this.codeEntered = !!this.model.get('couponCode');
               this.$el.on('keypress', 'input.mz-carttable-qty-field', function (e) { 
                    var obj=e.target;
                     if($(this).attr("id") != "coupon-code"){  
                         
                         var verified = (e.which === 8 || e.which === undefined || e.which === 0) ? null : String.fromCharCode(e.which).match(/[^0-9]/);
                         
                        if($(this).attr("id") != "coupon-code"){ 
                         if (verified === null) { 
                            
                          }else{
                               $(obj).val($(obj).val().replace(/\D/g, "")); 
                              
                          } 
                       
                   }
                   }
                }); 
                this.$el.on('keypress', '#coupon-code', function (e) { 
                    if (e.which === 13) {
                        $(this).parent().find("#cart-coupon-code").trigger("click");   
                    }   
                });
                
                /*Coupon cookie code*/
                
                var coupon=$.cookie("coupon");
                var couponObj = {};
                if(typeof coupon !== 'undefined'){
                    couponObj = $.parseJSON(coupon);
                }
                var couponCodes = this.model.get('couponCodes');
                var cartId = this.model.id;
                console.log(this.model.attributes.couponCodes);
                if((couponCodes !== undefined)&&(couponCodes.length > 0 )){
                    $.each(couponObj,function(key,val){  
                        if(couponCodes.indexOf(key) >= 0 && val === false){
                            try{
                                api.request("delete","/api/commerce/carts/"+me.model.id+"/coupons/"+key).then(function(res){
                                    console.log(res);
                                    location.reload();
                                    me.render();
                                });
                            }
                            catch(err){
                                console.log(err);  
                            }
                        }
                    });
                }    
                
                /*Coupon cookie code*/
                 
                AmazonPay.init(CartModels.Cart.fromCurrent().id);
                AmazonPay.init(true);

              this.$el.on('click', '.amp-rightcolor .estimate a', function (e) { 
                    e.preventDefault();
                    $('#loader').hide();
                    $('#estimate-popup').show();
                });
               this.$el.on('keypress', 'input.zip-code', function (e) { 
                    
                    if (e.which === 13) {
                        if($(this).hasClass("zip-code")){
                            me.estimateShip(); 
                            return false;  
                        }
                    }
                });
               this.$el.on('click', '.close-estimate', function (e) { 
                    e.preventDefault();
                    $('#estimate-popup').hide();
                    $('.estimationshipping').remove();
                    $('.zip-code').val("");
                });
                this.$el.on('keyup','input.mz-carttable-qty-field',function(e){ 
                 var obj=e.currentTarget; 
                  var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
                 if (key == 8 && $(obj).val().length=== 0) 
                    {
                        $(obj).parent().find(".cart-update-btn").prop('disabled',true); 
                        
                    } 
                   $(obj).val($(obj).val().replace(/\D/g, ""));   
                   return false;
                });
                this.$el.on('keydown','input.mz-carttable-qty-field',function(e){ 
                     
                    var obj=e.currentTarget;
                     
                    var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
                   
                   //$(obj).val($(obj).val().replace(/\D/g, ""));
                   if($(obj).val().length > 3 & key !== 8) {
                        e.preventDefault();
                        return false;
                    }
                    if($(this).attr('id') !== "coupon-code")
                    {
                        if (key == 48 && $(obj).val().length=== 0)
                        {
                            $(obj).parent().find(".cart-update-btn").prop('disabled',true);
                            me.showDeleteModelDialog(e);
                            $(this).val('');
                            return false;
                        }
                       
                        //if the letter is not digit then don't type anything
                        else if (key !== 8 && key !== 0 && key!==229 && ((key < 48 || key > 57) && (key <= 96 && key >= 105) && (key !=13))) {
                           $(this).val('');
                            $(obj).parent().find(".cart-update-btn").prop('disabled',true);
                            return false;
                        }   
                        else 
                        {
                            $(obj).parent().find(".cart-update-btn").prop('disabled',false); 
                        } 
                    }
                   // $(obj).parent().find(".cart-update-btn").removeAttr("disabled");
                    if(key===13){
                        if($(this).attr('id') !== "coupon-code")
                        {
                            if($(obj).val()=="0"){ 
                                $(obj).closest(".cart-row").find(".mz-carttable-item-remove").find("a").trigger("click");
                                 if ($(window).width() < 767) {
                                    $('#page-content').ScrollTo({
                                            axis: 'y'
                                    });
                                } 
                            }else if($(obj).val()===""){
                                $(obj).parent().find(".cart-update-btn").prop("disabled",true);
                                
                            }
                            else{
                                $(obj).parent().find(".cart-update-btn").trigger("click"); 
                            }
                            return false;     
                        }
                    }    
                });
            },
            additionalEvents: {
                "click .cart-update-btn" : "updateQuantity",
                "focusin .mz-carttable-qty-field" : "focusing",
                "click .remoteamp-btn" : "addtocarttt",
                "click #cart-popupopen":"openpopupincart",
                "change .mz-carttable-qty-field" : "enableUpdatebtn",
                "click .mz-estimate": "estimateShip" ,
                "click .mz-loginpop":"loginpopup"
            },
        
            getcountryinfo:function(zipcd){
                var me=this;
                window.geocoder = new google.maps.Geocoder();
                window.geocoder.geocode({'componentRestrictions': { 'postalCode': zipcd}},function(res,status){                         
                if (status === 'OK') {
                    var country_code_shipping;
                    var state_code_shipping;
                    res[0].address_components.forEach(function(element,index){
                        for(var i=0;i<element.types.length;i++){
                            if(element.types[i] == "country"){
                                country_code_shipping=element.short_name;
                            }else if(element.types[i] == "administrative_area_level_1"){
                                state_code_shipping=element.short_name;
                            }  
                        }
                    });
                    me.shippingestimate(country_code_shipping,state_code_shipping);  

                }else{
                    var chooseShip="<div class='estimationshipping'><p> Sorry ! Shipping Rates cannot be estimated for your Region</p></div>";
                    console.log("Issue on google geo location api "+status);
                    $('#loader').hide();
                    $('.estimationshipping').remove();
                    $(chooseShip).insertAfter($('.mz-estimate'));
                }
               
            },function(err){
                console.log("Error ");   
                console.log(err);
            });   
            },
            shippingestimate:function(countryinfo,state_code_shipping){
              //------Fetching product and generating Json Array of Items ---------------            
             var CartData = this.model.apiModel.data;
              $('.estimationshipping').remove();
               api.request("get","/api/commerce/carts/current/items").then(function(currentinfo){
                var objarray=[];  
                $(currentinfo.items).each(function(i,j){   
                    var tempobj={};   

                    if(j.product.bundledProducts.length > 0 ){
                        if(j.product.productUsage !== "Bundle"){
                            tempobj={};
                            tempobj.quantity=j.quantity;  
                            tempobj.shipsByItself=false; 
                            tempobj.unitMeasurements=j.product.measurements;  
                            objarray.push(tempobj);    
                        }
                        for(var k=0;k<j.product.bundledProducts.length;k++){
                            tempobj={}; 
                            tempobj.quantity=j.product.bundledProducts[k].quantity * j.quantity; 
                            tempobj.shipsByItself=false; 
                            tempobj.unitMeasurements=j.product.bundledProducts[k].measurements;  
                            objarray.push(tempobj);
                        }
                        
                    }else{
                        tempobj={};
                        tempobj.quantity=j.quantity;  
                        tempobj.shipsByItself=false; 
                        tempobj.unitMeasurements=j.product.measurements;  
                        objarray.push(tempobj);
                    }                       
                });
              
//-----------Estimate Date and time generating--------------------------
           var now = new Date($("#time-custom-now").attr("date-attr")); 
           var utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()+1, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
//--------Generating Array For Ship time-----------------------            
           var responsefiled1={
                     "carrierIds": ["custom","ups"], 
                     
                     "destinationAddress" : {  
                         "stateOrProvince":state_code_shipping,
                        "countryCode":countryinfo,
                        "postalOrZipCode":$('.zip-code').val()
                    }, 
                    "isDestinationAddressCommercial" : false,
                    "isoCurrencyCode" :"USD", 
                     "items": objarray,
                    "originAddress": {
                        "address1": "15486 N. Nebraska Ave",
                        "address2":'#100',
                        "cityOrTown":"Lutz",
                        "countryCode":"US",
                        "postalOrZipCode":"33549",
                        "stateOrProvince":"FL"
                    }
                  
                }; 
                
            api.request('POST',{ 
              url: '/api/commerce/catalog/storefront/shipping/request-rates',
              iframeTransportUrl: 'https://' + document.location.host + '/receiver?receiverVersion=2'
            },responsefiled1).then(function(resp){
                $('.zip-code').val(); 
                var chooseShip="<div class='estimationshipping'><p>Available Shipping Methods</p>";
                var flag=true;
                $.each(resp.rates,function(index,obj){
                    $.each(obj.shippingRates,function(i,o){
                          if(o.amount!==null && o.amount!==undefined ){ 
                            flag=false;
                            chooseShip+='<div><span>'+ o.content.name +'</span><label>$'+ o.amount.toFixed(2)+'</label></div>';
                          }else if(o.amount === undefined){
                              
                          }
                          else{ 
                              flag=false;
                              chooseShip+='<div><span>'+ o.content.name +'</span><label>$'+ o.amount+'</label></div>';
                          } 
                            
                    }); 
                });
               chooseShip+="</div>";
                if(resp.rates.length===0 || flag){ 
                     chooseShip="<div class='estimationshipping'><p> UPS Live Rates are not currently available. Please try again in a few moments.</p></div>";
                }
                $('#loader').hide();
                $('.estimationshipping').remove();
                $(chooseShip).insertAfter($('.mz-estimate'));
            });
            return false;  
        });
            },
             estimateShip:function(e){
                 var me =this;
                if($('.zip-code').val().trim() !== "")
                {
                    $('.estimationshipping').remove();    
                    $('#loader').show(); 
                    var countryinfo= me.getcountryinfo($('.zip-code').val()); 
                }
            },
            openpopupincart:function(e){
                  $.cookie("wishlist", "clicked", {
                        expires: 7
                    });
                $(".guestuser").hide();  
                $(".onlyforlogin").show();   
                $(".mz-popover-login").show(); 
            },
            addtocarttt: function(e){
                if($(e.currentTarget).attr("data-mz-extracode") !== undefined){
                    var oldValue;
                    var $target = $(e.currentTarget);
                    $target.addClass("is-processing");
                    var data = _.where(ProductDataModel.get("options").toJSON(),{isRequired : true});
                    _.each(data,function(opt){  
                        if((opt.attributeDetail.usageType === "Extra") && (opt.isRequired) && (opt.values[0].deltaPrice < 1)&&(opt.values.length === 1)){
                            if(!opt.values[0].isSelected){
                                option = ProductDataModel.get("options").get(opt.attributeFQN);
                                option.set('value', opt.values[0].value);
                            }             
                        }
                    });
                }
                window.ProductDataModel.addToCart();  
                window.ProductDataModel.on('addedtocart', function(attr) {
                    CartMonitor.update();
                    CartViewInstance.update();
                    location.reload(true); 
                    $('.amprecommends').empty();
                });
            },
            focusing: function(e) {
                $(e.currentTarget).data('oldVal', $(e.currentTarget).val());
            },
            updateq: function(e) {
                e.preventDefault();
                inpt_val=$(e.currentTarget).parent().find("input").val();
            },
            templateName: "modules/cart/cart-table",
            enableUpdatebtn: function(e) {
                
            },
            updateQuantity: function(e) {
                e.preventDefault();
                var curnobj=$(e.currentTarget).parents(".cart-row");
              
                 $(e.currentTarget).addClass("is-processing");
                var $qField = $(e.currentTarget).parent().find("input"),
                    oldQuantity = $(e.currentTarget).parent().find("input").data('oldVal'),
                    newQuantity = parseInt($qField.val(), 10),
                    id = $(e.currentTarget).parents(".cart-row").find(".mz-carttable-item-remove a").attr("data-mz-cart-item"),
                    item = this.model.get("items").get(id);
                if (item && !isNaN(newQuantity)) {
                    
                    if(newQuantity=="0"){
                        
                        $(e.currentTarget).closest(".cart-row").find(".mz-carttable-item-remove").find("a").trigger("click");
                        if ($(window).width() < 767) {
                        $('#page-content').ScrollTo({
                                axis: 'y'
                        });
                        } 
                        $(document).find("#cart-checkout").attr("disabled","disabled");
                            $(document).find(".cart-update-btn").attr("disabled","disabled");
                            $(document).find(".cart-update-btn").removeClass("is-processing");
                    }else{
                                 item.set('quantity', newQuantity);
                    var operation = item.saveQuantity();
                    if(operation && operation.then) $qField.val(newQuantity);
                    api.on('error', function (badPromise, xhr, requestConf) {
                        $('#page-content').ScrollTo({
                                axis: 'y'
                        });
                        if(badPromise.message.indexOf('out of stock') != -1 || badPromise.message.indexOf('sufficient stock') !=-1 || badPromise.message.indexOf('Delegated Authorization') !=-1){
                          
                            badPromise.message= Hypr.getLabel('insufficientinventory');
                           $(curnobj).css("border-color","red");  
                           
                           $('#page-content').ScrollTo({ 
                                axis: 'y' 
                            }); 
                            $(document).find("#cart-checkout").attr("disabled","disabled");
                             $(document).find(".amp-btn").prop("disabled",true);
                            $(document).find(".cart-update-btn").attr("disabled","disabled");
                            $(document).find(".cart-update-btn").removeClass('is-processing'); 
                        
                    }
                 

                    });
                    }
           
                    $(document).find(".amp-btn").prop("disabled",false);
                    CartMonitor.updateCart();
                    CartMonitor.updateBronto();
                }
                    
            },
            render: function() {  
            
                var priceRangeprice;
                var me = this,
                    productApiflag = false;
                /*var coupon = $.cookie("coupon");
                if (coupon == "Removed") { 
                    $(".removeCoupon").trigger("click");
                } else if (coupon == "added") {
                    
                } */  
                var totalCount=0;       
                productExist=false;
                purchaseable=false; 
                var NumberOfItems = this.model.toJSON().items.length;
                var recommendationproduct=require.mozuData('sitecontext').themeSettings.recommendationproduct;
                $(this.model.toJSON().items).each(function(k,v){        
                    
                    totalCount += v.quantity;           
                    if(v.product.productCode==recommendationproduct){
                        productExist=true;
                         
                          
                    }else if(!productExist){ 
                        productExist=false;
                        var catId=recommendationproduct;
                        if(catId !== ""){
                         api.get('product', catId).then(function(sdkProduct) {
                            window.ProductDataModel = new ProductModels.Product(sdkProduct.data);
                            
                            var obj=sdkProduct.data;
                            var val = false;
                            if(obj){
                                if(obj.options !== undefined){
                                    if(obj.options.length > 0){
                                        _.each(obj.options,function(opt){
                                            if((opt.attributeDetail.usageType === "Extra") && (opt.isRequired) && (opt.values[0].deltaPrice < 1)&&(opt.values.length === 1)){
                                                val = true;             
                                            }
                                        });
                                        me.model.set("amproproduct",sdkProduct.data); 
                                        if(val){
                                            if((ProductDataModel.get("inventoryInfo").outOfStockBehavior === "DisplayMessage") && (ProductDataModel.get("inventoryInfo").onlineStockAvailable === 0)){
                                                purchaseable = false;
                                                me.model.set("prdpurchaseable", false);  
                                            }else{
                                                purchaseable = val;
                                                me.model.set("prdpurchaseable",val);  
                                            }
                                        }else{
                                            purchaseable = obj.purchasableState.isPurchasable;
                                            me.model.set("prdpurchaseable",obj.purchasableState.isPurchasable);
                                        }
                                    }else{
                                        purchaseable = obj.purchasableState.isPurchasable;
                                        me.model.set("amproproduct",sdkProduct.data); 
                                        me.model.set("prdpurchaseable",obj.purchasableState.isPurchasable);
                                    }
                                }else{
                                    purchaseable = obj.purchasableState.isPurchasable;
                                    me.model.set("amproproduct",sdkProduct.data); 
                                    me.model.set("prdpurchaseable",obj.purchasableState.isPurchasable);
                                }   
                            }   
                         });
                        }
                    }
                });  
                
                this.model.set("productExist",productExist); 
                this.model.set("totalCount",totalCount);        
                  
                if(this.model.get("total")!==undefined){     
                  $(".cart-total").text("$"+this.model.get("total"));       
                }       
                
                _.each(this.model.toJSON().items, function(conf, i, obj) {
                    product = {
                        productCode: conf.product.productCode
                    };
                    
                    if (conf.unitPrice.saleAmount) {
                        var listprice = conf.unitPrice.listAmount;
                        priceRangeprice=conf.product.price;
                       
                        var quantity = conf.quantity;
                        var newprice = listprice * quantity;
                        var newsaleprice = conf.unitPrice.saleAmount * conf.quantity;
                        var finalprice = ((newprice - newsaleprice) / newprice) * 100;
                        
                        var newfinalprice = Math.round(finalprice * 100) / 100;
                            
                            var tempprice=Math.round(newfinalprice);
                             
                            var tempsaveprice=newprice-newsaleprice;
                            var saveprice=tempsaveprice.toFixed(2);
                        me.model.get("items").models[i].get('product').set("originalAmount", newprice);
                        me.model.get("items").models[i].get('product').set("savedamount", tempprice);
                        me.model.get("items").models[i].get('product').set("savedprice", saveprice);
                       
                    }

                    priceRangeprice=conf.product.price.price;
                       
                    var res = api.createSync("product", _.extend({}, product));
                    res.get().then(function(rea) {
                        me.model.get('items').models[i].get('product').set("inventory", rea.data.inventoryInfo);
                        if (i === me.model.toJSON().items.length - 1) productApiflag = true;
                    });
                    
                });
                
                        
                /**
                 * Getting Delta price for each item
                 *       
                **/
                var flagg=false;
                
                _.each(me.model.toJSON().items, function(conf, i, obj) {
                    var code  = conf.product.productCode;
                    api.get('product', code).then(function(sdkProduct) {
                        var PRODUCT = new ProductModels.Product(sdkProduct.data);
                        
                        if (PRODUCT.get('price').get('salePrice') !== undefined) {
                            priceinfo = PRODUCT.get('price').get('salePrice');
                        } 
                        else if(PRODUCT.get('price').get('price')!== undefined) {
                            priceinfo = PRODUCT.get('price').get('price');
                        }else if(conf.product.price.salePrice){
                            priceinfo=conf.product.price.salePrice;
                        }else  {  
                            priceinfo=conf.product.price.price;
                        } 

                        var qunatity = me.model.get('items').models[i].get('quantity');
                        var basepric = priceinfo;   
                        me.model.get('items').models[i].set('basePrice', basepric.toFixed(2)); 
                        
                        $(me.model.toJSON().items[i].product.options).each(function(ind,opt){
                            $(PRODUCT.get('options').models).each(function(x,y){
                                if(y.get('attributeFQN') === opt.attributeFQN){
                                    $(y.get('values')).each(function(xx,yy){
                                        if(opt.value === yy.value){
                                            if(yy.deltaPrice){ 
                                              basepric=basepric-yy.deltaPrice;
                                              if(y.get("attributeDetail").usageType.toLowerCase()=="option"){
                                                    me.model.get('items').models[i].set('basePrice', basepric.toFixed(2)); 
                                              } 
                                                  
                                                me.model.toJSON().items[i].product.options[ind].deltaPrice = yy.deltaPrice;
                                            }
                                        }
                                    });
                                }
                            });
                        });
                        
                        
                        
                        NumberOfItems--;
                        if(NumberOfItems === 0){
                            flagg=true;
                             preserveElement(me, ['.v-button','.p-button','#AmazonPayButton'], function() {
                                Backbone.MozuView.prototype.render.call(this);
                            });
          
                    if(productExist){
                       
                    }else{
                        if ($(window).width() > 767) {
                                   
                            }else{
                                
                            }
                    }
                 var productListarr =  $(".mz-productlist-carousel ul li");
                     
                
                        }
                        
                    });   
                });
               
                if(NumberOfItems === 0 && !flagg ){ 
                          
                           preserveElement(me, ['.v-button','.p-button','#AmazonPayButton'], function() {
                                Backbone.MozuView.prototype.render.call(this);
                            });

                        }
                       // jshint ignore:line
                var productApiinterval = setInterval(function() {// jshint ignore:line
                    if (productApiflag === true) clearInterval(productApiinterval), me.renderCallback();// jshint ignore:line
                }, 500); 
               // jshint ignore:line
                      
            }, 
            renderCallback: function() { 
                var flag = false;
                var me = this;
                var obj = me.model.get("items").models;
                $(obj).each(function(k, v) {
                    if (v.get('product').get("inventory")) {
                        if (v.get('product').get("inventory").manageStock) {
                            var inventoryBehaviour = v.get('product').get("inventory").outOfStockBehavior;
                            if (inventoryBehaviour.toLowerCase() == "allowbackorder") {
                                if (v.get('product').get("inventory").onlineStockAvailable < this.get('quantity')) {
                                    var backstock = this.get('quantity') - v.get('product').get("inventory").onlineStockAvailable;
                                    v.get('product').set("backstock", backstock);
                                }
                            } else if (inventoryBehaviour.toLowerCase() == "displaymessage") {
                                if (v.get('product').get("inventory").onlineStockAvailable === 0) {
                                    v.get('product').set("nonstock", true);
                                    flag = true;
                                    me.model.set("proccedDisable", true);
                                } else if (v.get('product').get("inventory").onlineStockAvailable < this.get('quantity')) {
                                    var nonstock=this.get('quantity')-v.get('product').get("inventory").onlineStockAvailable; 
                                    v.get('product').set("nonstock",true);
                                     flag = true;
                                    me.model.set("proccedDisable", true);  

                                }
                            }

                        }
                    }
                });
                 
                if (flag) {
                    me.model.set("proccedDisable", true);
                } else {
                    me.model.unset('proccedDisable');
                }
                preserveElement(me, ['.v-button','.p-button','#AmazonPayButton'], function() {
                                Backbone.MozuView.prototype.render.call(this);
                            });

            },
            removecouponcode: function(e) {  
                /*var self = this;
                var CartData = this.model.apiModel.data;
                var $couponcode = $(e.currentTarget);
                var id = $couponcode.data('mz-coupon-code');
                api.request('DELETE', '/api/commerce/carts/' + CartData.id + '/coupons/' + id).then(function(resp) {
                    CartViewInstance.update();
                    CartMonitor.update();
                    $.cookie("coupon", "Removed", {
                        expires: 7
                    }); // Sample 2
                });*/
                
                var self=this;
                var me= this.$el; 
                var orderId = this.model.id;  
                var couponCode = $(e.currentTarget).data('mz-coupon-code');   
                api.request("delete","/api/commerce/carts/"+self.model.id+"/coupons/"+couponCode).then(function(res){
                    var getExistsData = $.cookie('coupon');
                    if(getExistsData && getExistsData!== ""){
                        self.couponsData = JSON.parse(getExistsData);
                    }
                    self.couponsData[couponCode]= false;
                    $.cookie("coupon", JSON.stringify(self.couponsData), {  path: '/',expires: 7 }); 
                    CartViewInstance.update();
                    CartMonitor.update();
                    self.render();
                });
                
                
            },   
            removeItem: function(e) {
                var $removeButton = $(e),
                    id = $removeButton.data('mz-cart-item'),
                    self = this;
                self.model.get('items').get(id).apiModel.del().then(function() {
                    CartMonitor.update();
                    CartMonitor.updateBronto();
                    location.reload(true);
                });
            }, 
            empty: function() {
                this.model.apiDel().then(function() {
                    window.location.reload();
                });
            },
            loginpopup: function(e){   
                $(e.currentTarget).attr("addguest","yes");
                $(".checkoutbtns").show();  
                $(".onlyforlogin").hide();
                $(".cartspecor").show();    
                $("#guestuser").show();
                if($(window).width() < 768){
                    $(".mz-ampheade").find(".login").find("a").attr("extraattr","1");
                    $(".mz-ampheade").find(".login").find("a")[0].click();
                }else{
                    $(".user-utility").find("[data-mz-loginpopup]").attr("extraattr","1");
                    $(".user-utility").find("[data-mz-loginpopup]").trigger( "click" );
                }
            },
            proceedToCheckout: function() {
                this.model.isLoading(true);
            },
            addCoupon: function() {
               /* var self = this;
                this.model.addCoupon().ensure(function() {
                    self.model.unset('couponCode');
                    self.render();
                });
                CartMonitor.update();
                $.cookie("coupon", "added", {
                    expires: 7
                }); // Sample 2
                */
                
                var self = this;
                var couponArr = self.model.get('couponCodes');
                var couponCode = $('#coupon-code').val();
                if(couponArr.indexOf(couponCode) < 0){  
                    
                    this.model.addCoupon().ensure(function() {
                        var getExistsData = $.cookie('coupon');
                        if(getExistsData && getExistsData!== ""){
                            self.couponsData = JSON.parse(getExistsData);
                        }
                        self.couponsData[couponCode]= true;
                        $.cookie("coupon", JSON.stringify(self.couponsData), {  path: '/',expires: 7 });              
                       
                        self.model.set('couponCode',couponCode);
                        self.$el.removeClass('is-loading');
                        self.model.unset('couponCode');
                        self.render();
                    });     
                }
                return false;
               
            },
            onEnterCouponCode: function(model, code) {
                if (code && !this.codeEntered && !this.model.isEmpty()) {
                    this.codeEntered = true;
                    this.$el.find('#cart-coupon-code').prop('disabled', false);
                }
                if (!code && this.codeEntered) {
                    this.codeEntered = false;
                    this.$el.find('#cart-coupon-code').prop('disabled', true);
                }
            },
            autoUpdate: [
                'couponCode'
            ],
            handleEnterKey: function() {
                this.addCoupon();
            },

            showDeleteModelDialog: function(e) {
                var $target = e.currentTarget,
                    me = this;
                model = new CartDeleteConfirmBoxModel($target, me);
            }

        });
        
        var AmprpromoView = Backbone.MozuView.extend({
            templateName: "modules/cart/amppromotions",
            events: {
                "click .amp-btn": "addtoCart"
            },
            addtoCart: function(e) {
                
                this.model.addToCart();   
                this.model.on('addedtocart', function(attr) {
                    CartMonitor.update();
                    CartViewInstance.update();
                });
                return false;   
            }
        });
        
    /* begin visa checkout */
    function initVisaCheckout (model, subtotal) {
        var delay = 500;
        var visaCheckoutSettings = HyprLiveContext.locals.siteContext.checkoutSettings.visaCheckout;
        var apiKey = visaCheckoutSettings.apiKey;
        var clientId = visaCheckoutSettings.clientId;

        // if this function is being called on init rather than after updating cart total
        if (!model) {
            model = CartModels.Cart.fromCurrent();
            subtotal = model.get('subtotal');
            delay = 0;

            if (!window.V) {
                //console.warn( 'visa checkout has not been initilized properly');
                return false;
            }
            // on success, attach the encoded payment data to the window
            // then turn the cart into an order and advance to checkout
            window.V.on("payment.success", function(payment) {
                // payment here is an object, not a string. we'll stringify it later
                var $form = $('#cartform');
                
                _.each({

                    digitalWalletData: JSON.stringify(payment),
                    digitalWalletType: "VisaCheckout"

                }, function(value, key) {
                    
                    $form.append($('<input />', {
                        type: 'hidden',
                        name: key,
                        value: value
                    }));

                });

                $form.submit();  

            });

            // for debugging purposes only. don't use this in production
            window.V.on("payment.cancel", function(payment) {
                console.log({ cancel: JSON.stringify(payment) });
            });

            // for debugging purposes only. don't use this in production
            window.V.on("payment.error", function(payment, error) {
                console.warn({ error: JSON.stringify(error) });
            });
        }

        // delay V.init() while we wait for MozuView to re-render
        // we could probably listen for a "render" event instead
        _.delay(window.V.init, delay, {
            apikey: apiKey,
            clientId: clientId,
            paymentRequest: {   
                currencyCode: model ? model.get('currencyCode') : 'USD',
                subtotal: "" + subtotal
            }
        });
    }
    /* end visa checkout */

        var CartViewInstance = {
            update: function() {
                return this.view.model.apiGet();
            }
        };     

        $(document).ready(function() {
            //guest user checkout
            var gmail=$.cookie("guest"); 
            if(gmail !== ""){
                $('#guest_email').val(gmail);
            }
            if(require.mozuData('pagecontext').pageType === "cart"){
                $(window).scroll(function(){
                    var offsettop = $('.mz-carttable-thirdpartypayment').offset().top;
                    if(window.scrollY > 250 && window.scrollY < offsettop - 530)
                    {
                        $(document).find('#cart-checkout').parent('.mz-mobile').addClass('floating-btn', 1000);
                    }
                    else if(window.scrollY < 250)
                    {
                        $(document).find('#cart-checkout').parent('.mz-mobile').removeClass('floating-btn', 1000);
                    }
                    else
                    {
                        $(document).find('#cart-checkout').parent('.mz-mobile').removeClass('floating-btn', 1000);
                    }
                });
            }

            
        if($(window).width() < 768){
            $(document).on("click","#cart-popupopenmobile",function(){
                $.cookie("wishlist", "clicked", {
                            expires: 7
                        });
                $(".guestuser").hide();  
                $(".onlyforlogin").show();    
                $(".mz-popover-login").show();     
            });    
        }   

          $(".left-cart").css("background","none");
            $(".leftcartcolor").css("background","none");
       
            var cartModel = CartModels.Cart.fromCurrent(),
                itemCount = cartModel.get('count');
            cartModel.set('itemCount', itemCount);
            $('.amp-count').text(itemCount);  
            cartView = new CartView({
                el: $('#cart'),
                model: cartModel,
                messagesEl: $('[data-mz-message-bar]')
            });
     
                
            cartModel.on('ordercreated', function(order) {
                cartModel.isLoading(true);
                
            });
            

            cartModel.on('sync', function() {
                CartMonitor.setCount(cartModel.count());
            });

            CartViewInstance.view = cartView;
            window.cartView = cartView;
            window.CartViewInstance = CartViewInstance;
            cartView.render(); 

                CartMonitor.setCount(cartModel.count());
         if (AmazonPay.isEnabled && cartModel.count() > 0)
            AmazonPay.addCheckoutButton(cartModel.id, true);
        cartModel.on('ordercreated', function (order) {
            cartModel.isLoading(true);
            window.location = "/checkout/" + order.prop('id');
        });
        CartMonitor.setCount(cartModel.count());
        paypal.loadScript(); 
        var cok = $.cookie("guestuse");
        if(cok === "yes"){
            $.cookie("guestuse", "no");
            $(document).find("#cart-checkout").trigger("click");
        }
});

        
    });         



