require(["modules/jquery-mozu", "underscore", "hyprlive",'modules/api',
 "modules/backbone-mozu", "modules/models-checkout", "modules/views-messages",
  "modules/cart-monitor", 'hyprlivecontext', 'modules/editable-view',
   'modules/preserve-element-through-render','modules/amazonpay'], function ($, _, Hypr, api, Backbone, CheckoutModels, messageViewFactory, CartMonitor, HyprLiveContext, EditableView, preserveElements,AmazonPay) {

    var CheckoutStepView = EditableView.extend({    
        edit: function () {            
            this.model.edit();   
            var obj=event.target;
        }, 
        next: function () {      
           
            var scrollinfo, me = this;
            me.editing.savedCard = false;
            _.defer(function () {
                me.model.next();
               if($(window).width() < 768){ 
                    if($(document).find(".is-incomplete:first").length > 0){
                        scrollinfo=$(document).find(".is-incomplete:first").offset().top - 100;
                    }else{
                        if($(document).find(".is-invalid").length > 0){
                                scrollinfo=$(document).find(".is-invalid:first").offset().top - 100;
                        }else{
                                scrollinfo=$(document).find(".is-new:first").offset().top - 100;        
                        }
                    }
                    var isIE11 = !!(navigator.userAgent.match(/Trident/) && navigator.userAgent.match(/rv[ :]11/));
                    if(isIE11){
                        document.documentElement.scrollTop = scrollinfo;    
                    }else{
                        $('html, body').animate({
                        scrollTop: scrollinfo 
                        }); 
                    } 
                }
            }); 
        },
        amazonShippingAndBilling: function() {
            //isLoading(true);
            window.location = "/checkout/"+window.order.id+"?isAwsCheckout=true&access_token="+window.order.get("fulfillmentInfo").get("data").addressAuthorizationToken+"&view="+AmazonPay.viewName;
        },
        choose: function () { 
            var me = this;
            me.model.choose.apply(me.model, arguments);
        },
        constructor: function () {   
            var me = this;
            EditableView.apply(this, arguments);
            me.resize();
            setTimeout(function () {
                me.$('.mz-panel-wrap').css({ 'overflow-y': 'hidden'});
            }, 250);
            me.listenTo(me.model,'stepstatuschange', me.render, me);
            me.$el.on('keypress', 'input', function (e) {
                if (e.which === 13) {
                    me.handleEnterKey(e);

                    return false;
                }
            });
        },
        initStepView: function() {
            this.model.initStep();
        },
        handleEnterKey: function (e) { 
            this.model.next(); 
        },  
        render: function () {
             $(".mz-formstep.is-incomplete h3").addClass("checkoutbgmh3");
             $(".mz-formstep.is-complete h3").removeClass("checkoutbgmh3");
            this.$el.removeClass('is-new is-incomplete is-complete is-invalid').addClass('is-' + this.model.stepStatus());
            /*var coupon=$.cookie("coupon"); 
            if(coupon=="Removed"){
                $(".removeCoupon").trigger("click");
            }else if(coupon=="added"){
                
            }*/
            EditableView.prototype.render.apply(this, arguments);
            this.resize();
        }, 
        resize: _.debounce(function () {
            this.$('.mz-panel-wrap').animate({'height': this.$('.mz-inner-panel').outerHeight() });
        },200)
    });

    var OrderSummaryView = Backbone.MozuView.extend({
        templateName: 'modules/checkout/checkout-order-summary',

        initialize: function () {
            this.listenTo(this.model.get('billingInfo'), 'orderPayment', this.onOrderCreditChanged, this);
        },

        editCart: function () {
            window.location = "/cart";
        }, 
        renderOnChange: [  
            'couponCodes'
        ],
        render:function(){
            var shippincost=this.model.get('shippingTotal');
            var handlingcost=this.model.get('handlingTotal');
            var shipingHandlingCost=shippincost+handlingcost;
            shipingHandlingCost=shipingHandlingCost.toFixed(2); 
           
            this.model.set('shippingSubTotal',shipingHandlingCost);
            
             Backbone.MozuView.prototype.render.apply(this, arguments);
           
        },
        
        onOrderCreditChanged: function (order, scope) {
            this.render();
        },

        // override loading button changing at inappropriate times
        handleLoadingChange: function () { }
    });

    var ShippingAddressView = CheckoutStepView.extend({
        templateName: 'modules/checkout/step-shipping-address',
        autoUpdate: [
            'firstName',
            'lastNameOrSurname',
            'address.address1',
            'address.address2',
            'address.address3',
            'address.cityOrTown',
            'companyOrOrganization',
            'address.countryCode',
            'address.stateOrProvince',
            'address.postalOrZipCode',
            'address.addressType',
            'phoneNumbers.home',
            'contactId',
            'email',
            'updateaddress',
            'updateMode'
        ],
        renderOnChange: [
            'address.countryCode',
            'contactId'
        ],
        additionalEvents: {   
            "keypress input[name='postal-code']": "preventdata",
            "change #updateaddress":"updateaddres",
            "change .customaddress":"updateaddresmodel",
            "keypress .mz-address-phoneNumber": "numPress",
            "keyup .mz-address-phoneNumber": "numPress"
        },
        numPress: function(e) {
            var key = e.charCode || e.keyCode || 0,
                str = String.fromCharCode(event.key);
                $phone = $(e.currentTarget);
                $phone.val($phone.val().replace(/[^\d-+ ]/g, "")); 
        },
        updateaddresmodel: function(e){ 
            this.model.set(this.model.getOrder().get('customer').get('contacts').get($(e.currentTarget).val()).toJSON(), {silent: true});
            this.model.next();
        },
        updateaddres: function(e){
            var val = $(e.currentTarget).val();
            if(val){
                this.model.set("updateshipaddress",true);
            }else{
                this.model.set("updateshipaddress",false);
            }
        },
        preventdata: function(e){
            var regx = /^[A-Za-z0-9 _.-]+$/;
            if (regx.test(event.key)){
            }else{
                event.preventDefault();
            }
        },
        beginAddContact: function () {
            this.model.set('contactId', 'new');
        },  
        
    });

    var ShippingInfoView = CheckoutStepView.extend({
        templateName: 'modules/checkout/step-shipping-method',
        renderOnChange: [
            'availableShippingMethods'
        ],
        additionalEvents: {
            "change [data-mz-shipping-method]": "updateShippingMethod"
        },
        updateShippingMethod: function (e) {
            this.model.updateShippingMethod(this.$('[data-mz-shipping-method]:checked').val());
        }
    });

    var visaCheckoutSettings = HyprLiveContext.locals.siteContext.checkoutSettings.visaCheckout;
    var pageContext = require.mozuData('pagecontext');
    var BillingInfoView = CheckoutStepView.extend({
        templateName: 'modules/checkout/step-payment-info',
        autoUpdate: [
            'savedPaymentMethodId',
            'paymentType',
            'card.paymentOrCardType',
            'card.cardNumberPartOrMask',
            'card.nameOnCard',
            'card.expireMonth',
            'card.expireYear',
            'card.cvv',
            'card.isCardInfoSaved',
            'check.nameOnCheck',
            'check.routingNumber',
            'check.checkNumber',
            'isSameBillingShippingAddress',
            'billingContact.firstName',
            'billingContact.lastNameOrSurname',
            'billingContact.address.address1',
            'billingContact.address.address2',
            'billingContact.address.address3',
             'billingContact.companyOrOrganization',
            'billingContact.address.cityOrTown',
            'billingContact.address.countryCode',
            'billingContact.address.stateOrProvince',
            'billingContact.address.postalOrZipCode',
            'billingContact.phoneNumbers.home',
            'billingContact.email',
            'creditAmountToApply',   
            'digitalCreditCode'
        ],
        renderOnChange: [  
            'billingContact.address.countryCode',
            'paymentType',
            'isSameBillingShippingAddress',
            'usingSavedCard',
            'savedPaymentMethodId'
        ],
        additionalEvents: {
            "change [data-mz-digital-credit-enable]": "enableDigitalCredit",
            "change [data-mz-digital-credit-amount]": "applyDigitalCredit",
            "change [data-mz-digital-add-remainder-to-customer]": "addRemainderToCustomer",
            "change [name='paymentType']": "resetPaymentData",
            "change #payamazon": "resetPaymentData",
            "click .checkradio":"checkradio",
            "keypress input[name='postal-code']": "preventdata",
            "keypress input[name='security-code']": "preventdata1",
            "keypress .mz-address-phoneNumber": "numPress",
            "keyup .mz-address-phoneNumber": "numPress"
        },
        numPress: function(e) {
            var key = e.charCode || e.keyCode || 0,
            str = String.fromCharCode(event.key);
            $phone = $(e.currentTarget);
            $phone.val($phone.val().replace(/[^\d-+ ]/g, "")); 

        },
        preventdata: function(e){
            var sss = String.fromCharCode(event.keyCode);
            if (/[a-zA-Z0-9-_ ]/.test(sss)){
            }else{
                event.preventDefault();
            }
        },
        preventdata1: function(e){
            var sss = String.fromCharCode(event.keyCode);
            if (/[0-9]/.test(sss)){
            }else{
                event.preventDefault();
            }
        },
        initialize: function () {
            this.listenTo(this.model, 'change:digitalCreditCode', this.onEnterDigitalCreditCode, this);
            this.listenTo(this.model, 'orderPayment', function (order, scope) {
                    this.render();
            }, this);
            this.listenTo(this.model, 'change:savedPaymentMethodId', function (order, scope) {
                $('[data-mz-saved-cvv]').val('').change();
                this.render();
            }, this);
            this.codeEntered = !!this.model.get('digitalCreditCode');
            if(require.mozuData("user").isAnonymous){
                this.model.getOrder().set('acceptsMarketing', true);  
            }    
        },
        resetPaymentData: function (e) {
            if (e.target !== $('[data-mz-saved-credit-card]')[0]) {
                $("[name='savedPaymentMethods']").val('0');
            }
            this.model.clear();
            this.model.resetAddressDefaults();
        },
        checkradio : function(e){       
            $(e.currentTarget).parents(".checkradioparent").find("input[type='radio']").click();
        },
        render: function() {
            
            preserveElements(this, ['.v-button','.p-button', '#amazonButonPaymentSection'], function() {
                CheckoutStepView.prototype.render.apply(this, arguments);
            });
            var status = this.model.stepStatus();
            if ($("#AmazonPayButton").length > 0 && $("#amazonButonPaymentSection").length > 0)
                $("#AmazonPayButton").removeAttr("style").appendTo("#amazonButonPaymentSection");

            if (visaCheckoutSettings.isEnabled && !this.visaCheckoutInitialized && this.$('.v-button').length > 0) {
                window.onVisaCheckoutReady = _.bind(this.initVisaCheckout, this);
                require([pageContext.visaCheckoutJavaScriptSdkUrl]);
                this.visaCheckoutInitialized = true;
            }
            $(document).find("#paypaypal").on("change",function(){
                $(document).find("#btn_xpressPaypal").click();
            });  

            $(document).find("#payamazon").on("change",function(){
                $(document).find("#AmazonPayButton").find("img").click();
            });      
        },
        updateAcceptsMarketing: function(e) {
            this.model.getOrder().set('acceptsMarketing', $(e.currentTarget).prop('checked'));
        },
        updatePaymentType: function(e) {
            var newType = $(e.currentTarget).val();
            this.model.set('usingSavedCard', e.currentTarget.hasAttribute('data-mz-saved-credit-card'));
            this.model.set('paymentType', newType);
        },
        beginEditingCard: function () {
            var me = this;
            if (!this.model.isExternalCheckoutFlowComplete()) {
                this.editing.savedCard = true;
                this.render();
            } else {
                this.cancelExternalCheckout();
            }
        },
        beginEditingExternalPayment: function () {
            var me = this;
            if (this.model.isExternalCheckoutFlowComplete()) {
                this.doModelAction('cancelExternalCheckout').then(function () {
                    me.editing.savedCard = true;
                    me.render();
                });
            }
        },
        beginEditingBillingAddress: function() {
            this.editing.savedBillingAddress = true;
            this.render();
        },
        beginApplyCredit: function () {
            this.model.beginApplyCredit();
            this.render();
        },
        cancelApplyCredit: function () {
            this.model.closeApplyCredit();
            this.render();
        },
        cancelExternalCheckout: function () {
            var me = this;
            this.doModelAction('cancelExternalCheckout').then(function () {
                me.editing.savedCard = false;
                me.render();
            });
        },
        finishApplyCredit: function () {
            var self = this;
            this.model.finishApplyCredit().then(function() {
                self.render();
            });
        },
        removeCredit: function (e) {
            var self = this,
                id = $(e.currentTarget).data('mzCreditId');
            this.model.removeCredit(id).then(function () {
                self.render();
            });
        },
        getDigitalCredit: function (e) {
            var self = this;
            this.$el.addClass('is-loading');
            this.model.getDigitalCredit().ensure(function () {
                self.$el.removeClass('is-loading');
            });
        },
        stripNonNumericAndParseFloat: function (val) {
            if (!val) return 0;
            var result = parseFloat(val.replace(/[^\d\.]/g, ''));
            return isNaN(result) ? 0 : result;
        },
        applyDigitalCredit: function(e) {
            var val = $(e.currentTarget).prop('value'),
                creditCode = $(e.currentTarget).attr('data-mz-credit-code-target');  
            if (!creditCode) {
                return;
            }
            var amtToApply = this.stripNonNumericAndParseFloat(val);
            
            this.model.applyDigitalCredit(creditCode, amtToApply, true);
            this.render();
        },
        onEnterDigitalCreditCode: function(model, code) {
            if (code && !this.codeEntered) {
                this.codeEntered = true;
                this.$el.find('[data-mz-action="getDigitalCredit"]').prop('disabled', false);
            }
            if (!code && this.codeEntered) {   
                this.codeEntered = false;
                this.$el.find('[data-mz-action="getDigitalCredit"]').prop('disabled', true);
            }
        },
        enableDigitalCredit: function(e) {
            var creditCode = $(e.currentTarget).attr('data-mz-credit-code-source'),
                isEnabled = $(e.currentTarget).prop('checked') === true,
                targetCreditAmtEl = this.$el.find("input[data-mz-credit-code-target='" + creditCode + "']"),
                me = this;

            if (isEnabled) {
                targetCreditAmtEl.prop('disabled', false);
                me.model.applyDigitalCredit(creditCode, null, true);
            } else {
                targetCreditAmtEl.prop('disabled', true);
                me.model.applyDigitalCredit(creditCode, 0, false);
                me.render();
            }
        },
        addRemainderToCustomer: function (e) {
            var creditCode = $(e.currentTarget).attr('data-mz-credit-code-to-tie-to-customer'),
                isEnabled = $(e.currentTarget).prop('checked') === true;
            this.model.addRemainingCreditToCustomerAccount(creditCode, isEnabled);
        },
        handleEnterKey: function (e) {
            var source = $(e.currentTarget).attr('data-mz-value');
            if (!source) return;
            switch (source) {
                case "creditAmountApplied":
                    return this.applyDigitalCredit(e);
                case "digitalCreditCode":
                    return this.getDigitalCredit(e);
            }
        },
        /* begin visa checkout */
        initVisaCheckout: function () {
            var me = this;
            var visaCheckoutSettings = HyprLiveContext.locals.siteContext.checkoutSettings.visaCheckout;
            var apiKey = visaCheckoutSettings.apiKey || '0H1JJQFW9MUVTXPU5EFD13fucnCWg42uLzRQMIPHHNEuQLyYk';
            var clientId = visaCheckoutSettings.clientId || 'mozu_test1';
            var orderModel = this.model.getOrder();


            // on success, attach the encoded payment data to the window
            // then call the sdk's api method for digital wallets, via models-checkout's helper
            window.V.on("payment.success", function(payment) {
                //console.log({ success: payment });
                me.editing.savedCard = false;
                me.model.parent.processDigitalWallet('VisaCheckout', payment);
            });

            // for debugging purposes only. don't use this in production
            window.V.on("payment.cancel", function(payment) {
                console.log({ cancel: JSON.stringify(payment) });
            });

            // for debugging purposes only. don't use this in production
            window.V.on("payment.error", function(payment, error) {
                console.warn({ error: JSON.stringify(error) });
            });

            window.V.init({
                apikey: apiKey,
                clientId: clientId,
                paymentRequest: {
                    currencyCode: orderModel.get('currencyCode'),
                    subtotal: "" + orderModel.get('subtotal')
                }
            });
        }
        /* end visa checkout */
    });

    
    var CouponView = Backbone.MozuView.extend({
        templateName: 'modules/checkout/coupon-code-field',
        couponsData:{},
        handleLoadingChange: function (isLoading) {
            // override adding the isLoading class so the apply button 
            // doesn't go loading whenever other parts of the order change
        },
        renderOnChange: [  
            'couponCodes'
        ],
        initialize: function() {
            var self=this;
            this.listenTo(this.model, 'change:couponCode', this.onEnterCouponCode, this);
            this.codeEntered = !!this.model.get('couponCode');
            this.$el.on('keypress', 'input#coupon-code', function (e) {
                if (e.which === 13) { 
                    self.$el.find('.mz-button').trigger('click');
                    return false;
                }
            });
            /*coupon cookie code*/
            var coupon=$.cookie("coupon");     
            var couponObj = {};
            if(typeof coupon !== 'undefined'){
                couponObj = $.parseJSON(coupon);
            }
            var couponCodes = this.model.get('couponCodes');
            var cartId = this.model.id;    
            if((couponCodes !== undefined)&&(couponCodes.length > 0 )){       
                $.each(couponObj,function(key,val){  
                    if(couponCodes.indexOf(key) >= 0 && val === false){ 
                        try{
                            api.request("delete","/api/commerce/orders/"+self.model.id+"/coupons/"+key).then(function(res){
                            //self.model.apiRemoveCoupon(key).then(function (res) {
                                self.model.set('couponCodes',res.couponCodes);
                                self.model.set("orderDiscounts",res.orderDiscounts);
                                self.model.set("discountTotal",res.discountTotal);
                                console.log(res);
                                CartMonitor.updateCart();  
                                location.reload();
                                self.render();
                            });
                        }
                        catch(err){
                            console.log(err);
                        }
                    }
                });
            }    
        },
        onEnterCouponCode: function (model, code) {
            if (code && !this.codeEntered) {
                this.codeEntered = true;
                this.$el.find('button').prop('disabled', false);
            }
            if (!code && this.codeEntered) {
                this.codeEntered = false;
                this.$el.find('button').prop('disabled', true);
            }
        },
        removecouponcode:function(e){  
            var self=this,CartData = this.model.apiModel.data, $couponcode = $(e.currentTarget), id=$couponcode.data('mz-coupon-code');
            
                //self.model.apiRemoveCoupons(id).then(function (res) {
                api.request("delete","/api/commerce/orders/"+self.model.id+"/coupons/"+id).then(function(res){
                    var getExistsData = $.cookie('coupon');
                    if(getExistsData && getExistsData!== ""){
                        self.couponsData = JSON.parse(getExistsData);
                    }
                    self.couponsData[id]= false;
                    if((self.model.get("pdiscount") !== undefined) && (self.model.get("pdiscount") !== "")){
                        self.model.set("pdiscount","");
                    }
                    $.cookie("coupon", JSON.stringify(self.couponsData), {  path: '/',expires: 7 });
                    self.model.set('couponCodes',res.couponCodes);
                    self.model.set("orderDiscounts",res.orderDiscounts);
                    self.model.set("discountTotal",res.discountTotal);
                    self.model.unset('couponCode');
                    location.reload();  
                    CartMonitor.updateCart();
                    self.render();  
                });   
        },
        autoUpdate: [
            'couponCode'
        ],
        addCoupon: function (e) {  
            // add the default behavior for loadingchanges
            // but scoped to this button alone
            
            var self = this;
            var obj=e.currentTarget;
            var coup=$(obj).parent().find("#coupon-code").val();
            var couponArr = self.model.get('couponCodes');
            var couponCode = $('#coupon-code').val();

            this.$el.addClass('is-loading');  
            this.model.addCoupon().ensure(function() {   
                if(couponArr.indexOf(couponCode) < 0){
                    var getExistsData = $.cookie('coupon');
                   if(getExistsData && getExistsData!== ""){
                      self.couponsData = JSON.parse(getExistsData);
                   }
                   self.couponsData[couponCode]= true;
                   $.cookie("coupon", JSON.stringify(self.couponsData), {  path: '/',expires: 7 });
                }
                self.$el.removeClass('is-loading');
                self.model.unset('couponCode');
                CartMonitor.updateCart();
                self.render(); 
            });
        },
        handleEnterKey: function () {
            this.addCoupon();
        },

        
    });

    var CommentsView = Backbone.MozuView.extend({   
        templateName: 'modules/checkout/comments-field', 
        autoUpdate: ['shopperNotes.comments','ponumber']
    });

    var ReviewOrderView = Backbone.MozuView.extend({
        templateName: 'modules/checkout/step-review',
        autoUpdate: [
            'createAccount',
            'agreeToTerms',
            'emailAddress',
            'password',
            'confirmPassword'
        ],
        renderOnChange: [
            'createAccount',
            'isReady'
        ],
        initialize: function () {
            var me = this;
            this.$el.on('keypress', 'input', function (e) {
                if (e.which === 13) {
                    me.handleEnterKey();
                    return false;
                }
            });
            this.model.on('passwordinvalid', function(message) {
                me.$('[data-mz-validationmessage-for="password"]').text(message);
            });
            this.model.on('userexists', function (user) {
                me.$('[data-mz-validationmessage-for="emailAddress"]').html(Hypr.getLabel("customerAlreadyExists", user, encodeURIComponent(window.location.pathname)));
            });
        },
        
        submit: function () {
            
            //loader
            $('.preloader').show();
            $('.preloader').css({'opacity': "0.5"});
            $('.preloader svg').hide();
            $('.place-order-submit').addClass('is-processing');
            
            var self = this;
            _.defer(function () {
                self.model.submit();
            });
        },
        handleEnterKey: function () {
            this.submit();
        }
    });

    var ParentView = function(conf) {
      var gutter = parseInt(Hypr.getThemeSetting('gutterWidth'), 10);
      if (isNaN(gutter)) gutter = 15;
      var mask;
      conf.model.on('beforerefresh', function() {
         killMask();
         conf.el.css('opacity',0.5);
         var pos = conf.el.position();
         mask = $('<div></div>', {
           'class': 'mz-checkout-mask'
         }).css({
           width: conf.el.outerWidth() + (gutter * 2),
           height: conf.el.outerHeight() + (gutter * 2),
           top: pos.top - gutter,
           left: pos.left - gutter
         }).insertAfter(conf.el);
      });
      function killMask() {
        conf.el.css('opacity',1);
        if (mask) mask.remove();
      }
      conf.model.on('refresh', killMask); 
      conf.model.on('error', killMask);
      return conf;
    };

    $(document).ready(function () {
        
         api.on('error', function(badPromise, xhr, requestConf) { 
                console.log("error");
            });
        if(require.mozuData("pagecontext").isMobile){ 
            $("#checkout-rightcol").insertBefore("#checkout-leftcol");
        }
        
        $(document).on("click", ".tnc-link", function() {
                $('body').css('overflowY', 'hidden');
            });
            $(document).on("click", ".close", function() {
                $('body').css('overflowY', 'auto');
            });
        $(".mz-contactselector .mz-contactselector-contact").hide();
        var $checkoutView = $('#checkout-form'),
            checkoutData = require.mozuData('checkout');

        AmazonPay.init(true);
        window.CheckoutModels =CheckoutModels;
        checkoutData.isAmazonPayEnable = AmazonPay.isEnabled;
        var checkoutModel = window.order = new CheckoutModels.CheckoutPage(checkoutData);
        $.each(checkoutModel.attributes.items, function(i,v){
                    if(v.productDiscount){
                        if(v.productDiscount.couponCode){
                            checkoutModel.attributes.pdiscount = v.productDiscount.couponCode;
                        }
                    }
                });

            var checkoutViews = {
                parentView: new ParentView({
                  el: $checkoutView,
                  model: checkoutModel
                }),
                steps: {
                    shippingAddress: new ShippingAddressView({
                        el: $('#step-shipping-address'),
                        model: checkoutModel.get("fulfillmentInfo").get("fulfillmentContact")
                    }),
                    shippingInfo: new ShippingInfoView({
                        el: $('#step-shipping-method'),
                        model: checkoutModel.get('fulfillmentInfo')
                    }),
                    paymentInfo: new BillingInfoView({
                        el: $('#step-payment-info'),
                        model: checkoutModel.get('billingInfo')
                    })
                },
                orderSummary: new OrderSummaryView({
                    el: $('#order-summary'),
                    model: checkoutModel
                }),
                couponCode: new CouponView({
                    el: $('#coupon-code-field'),
                    model: checkoutModel
                }),
                comments: Hypr.getThemeSetting('showCheckoutCommentsField') && new CommentsView({
                    el: $('#comments-field'),
                    model: checkoutModel
                }),
                
                reviewPanel: new ReviewOrderView({
                    el: $('#step-review'),
                    model: checkoutModel
                }),
                messageView: messageViewFactory({
                    el: $checkoutView.find('[data-mz-message-bar]'),
                    model: checkoutModel.messages
                })
            };

        window.checkoutViews = checkoutViews;
        checkoutViews.couponCode.render();
        checkoutModel.on('complete', function() {
            CartMonitor.setCount(0);
            if (window.amazon)
                window.amazon.Login.logout();
            window.location = "/checkout/" + checkoutModel.get('id') + "/confirmation";
        });

        var $reviewPanel = $('#step-review');
        checkoutModel.on('change:isReady',function (model, isReady) {
            if (isReady) {
                setTimeout(function () { window.scrollTo(0, $reviewPanel.offset().top - 100); }, 750);
            }
        });

        _.invoke(checkoutViews.steps, 'initStepView');  
   
        checkoutViews.orderSummary.render();
        $checkoutView.noFlickerFadeIn();

        if (AmazonPay.isEnabled)
            AmazonPay.addCheckoutButton(window.order.id, false);
        var pageaction, user = require.mozuData('user');
        if (user.isAnonymous) {
            if(checkoutData.billingInfo){   
            }else{   
                var gmail=$.cookie("guest"); 
                $('#billing-email').val(gmail);
                $('#billing-email').blur();  
            }  
        }
        
    }); 
});
