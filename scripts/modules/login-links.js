/**
 * Adds a login popover to all login links on a page.
 */
define(['shim!vendor/bootstrap/js/popover[shim!vendor/bootstrap/js/tooltip[modules/jquery-mozu=jQuery]>jQuery=jQuery]>jQuery', 'modules/api', 'hyprlive', 'underscore'], function ($, api, Hypr, _) {

    var usePopovers = function () {
       // return !Modernizr.mq('(max-width: 480px)'); 
    },
    returnFalse = function () {
        return false;
    },
    isTemplate = function(path) {
        return require.mozuData('pagecontext').cmsContext.template.path === path;
    },
    polyfillPlaceholders = !('placeholder' in $('<input>')[0]),
    $docBody;  

    var DismissablePopover = function () { };

    $.extend(DismissablePopover.prototype, {
        boundMethods: [],
        setMethodContext: function () {
            for (var i = this.boundMethods.length - 1; i >= 0; i--) {
                this[this.boundMethods[i]] = $.proxy(this[this.boundMethods[i]], this);
            }
        },
        dismisser: function (e) {
            if (!$.contains(this.popoverInstance.$tip[0], e.target) && !this.loading) {
                // clicking away from a popped popover should dismiss it
                this.$el.popover('destroy');
                this.$el.on('click', this.createPopover);
                this.$el.off('click', returnFalse);
                this.bindListeners(false);
                $docBody.off('click', this.dismisser);
            }
        },
        setLoading: function (yes) {
            this.loading = yes;
            this.$parent[yes ? 'addClass' : 'removeClass']('is-loading');
        },
        onPopoverShow: function () {
            var self = this;
            _.defer(function () {
                $docBody.on('click', self.dismisser);
                self.$el.on('click', returnFalse);
            });
            this.popoverInstance = this.$el.data('bs.popover');
            this.$parent = this.popoverInstance.tip();
            this.bindListeners(true);
            this.$el.off('click', this.createPopover);
        },
        createPopover: function (e) {
            // in the absence of JS or in a small viewport, these links go to the login page.
            // Prevent them from going there!
            var self = this;
            //if (usePopovers()) {
                e.preventDefault();
                // If the parent element's not positioned at least relative,
                // the popover won't move with a window resize
                //var pos = $parent.css('position');
                //if (!pos || pos === "static") $parent.css('position', 'relative');
                this.$el.popover({
                    //placement: "auto right",
                    animation: true,
                    html: true,
                    trigger: 'manual',
                    content: this.template,
                    container: 'body'
                }).on('shown.bs.popover', this.onPopoverShow)
                .popover('show');

          //  }
        },
        retrieveErrorLabel: function (xhr) {
            var message = "";
            if (xhr.message) {
                message = Hypr.getLabel(xhr.message);
            } else if ((xhr && xhr.responseJSON && xhr.responseJSON.message)) {
                message = Hypr.getLabel(xhr.responseJSON.message);
            }

            if (!message || message.length === 0) {
                this.displayApiMessage(xhr);
            } else {
                var msgCont = {};
                msgCont.message = message;
                this.displayApiMessage(msgCont);
            }
        }, 
        displayApiMessage: function (xhr) {
            this.displayMessage(xhr.message ||
                (xhr && xhr.responseJSON && xhr.responseJSON.message) ||
                Hypr.getLabel('unexpectedError'));
        },
        displayMessage: function (msg) {
            this.setLoading(false);
            $(".order").find(".mz-messagebar").html('<ul class="is-showing mz-errors"><li>' + msg + '</li></ul>');
            $('.ordstat-error').show();
        },
        init: function (el) {
            this.$el = $(el);
            this.loading = false;
            this.setMethodContext();
            if (!this.pageType){
                this.$el.on('click', this.createPopover);
            }
            else {
               this.$el.on('click', _.bind(this.doFormSubmit, this));
            }  
        },
        doFormSubmit: function(e){
            e.preventDefault();
            this.$parent = this.$el.closest(this.formSelector);
            this[this.pageType]();
        }
    });

    var LoginPopover = function() {
        DismissablePopover.apply(this, arguments);
    };
    LoginPopover.prototype = new DismissablePopover();
    $.extend(LoginPopover.prototype, {
        boundMethods: ['handleEnterKey', 'handleLoginComplete', 'displayResetPasswordMessage', 'dismisser', 'displayMessage', 'displayApiMessage', 'createPopover', 'slideRight', 'slideLeft', 'login', 'retrievePassword', 'onPopoverShow'],
        template: Hypr.getTemplate('modules/common/login-popover').render(), 
        bindListeners: function (on) {
            var onOrOff = on ? "on" : "off";
            this.$parent[onOrOff]('click', '[data-mz-action="forgotpasswordform"]', this.slideRight);
            this.$parent[onOrOff]('click', '[data-mz-action="loginform"]', this.slideLeft);
            this.$parent[onOrOff]('click', '[data-mz-action="submitlogin"]', this.login);
            this.$parent[onOrOff]('click', '[data-mz-action="submitforgotpassword"]', this.retrievePassword);
            this.$parent[onOrOff]('keypress', 'input', this.handleEnterKey);
        },
        onPopoverShow: function () {
            DismissablePopover.prototype.onPopoverShow.apply(this, arguments);
            this.panelWidth = this.$parent.find('.mz-l-slidebox-panel').first().outerWidth();
            this.$slideboxOuter = this.$parent.find('.mz-l-slidebox-outer');

            if (this.$el.hasClass('mz-forgot')){
                this.slideRight();
            }
        },
        handleEnterKey: function (e) {
            if (e.which === 13) {
                var $parentForm = $(e.currentTarget).parents('[data-mz-role]');
                switch ($parentForm.data('mz-role')) {
                    case "login-form":
                        this.login();
                        break;
                    case "forgotpassword-form":
                        this.retrievePassword();
                        break;
                }
                return false;
            }
        },
        slideRight: function () {
            this.$slideboxOuter.css('left', -this.panelWidth);
        },
        slideLeft: function () {
            this.$slideboxOuter.css('left', 0);
        },
        login: function () {
            this.setLoading(true);
            api.action('customer', 'loginStorefront', {
                email: this.$parent.find('[data-mz-login-email]').val(),
                password: this.$parent.find('[data-mz-login-password]').val()
            }).then(this.handleLoginComplete, this.displayApiMessage);
        },
        anonymousorder: function() {
            var email = ""; 
            var billingZipCode = "";
            var billingPhoneNumber = "";

            switch (this.$parent.find('[data-mz-verify-with]').val()) {
                case "zipCode":
                    {
                        billingZipCode = this.$parent.find('[data-mz-verification]').val();
                        email = null;
                        billingPhoneNumber = null;
                        break;
                    }
                case "phoneNumber":
                    {
                        billingZipCode = null;
                        email = null;
                        billingPhoneNumber = this.$parent.find('[data-mz-verification]').val();
                        break;
                    }
                case "email":
                    {
                        billingZipCode = null;
                        email = this.$parent.find('[data-mz-verification]').val();
                        billingPhoneNumber = null;
                        break;
                    }
                default:
                    {
                        billingZipCode = null;
                        email = null;
                        billingPhoneNumber = null;
                        break;
                    }
 
            }

            this.setLoading(true);  
            // the new handle message needs to take the redirect.
            api.action('customer', 'orderStatusLogin', {
                ordernumber: this.$parent.find('[data-mz-order-number]').val(),
                email: email,
                billingZipCode: billingZipCode,
                billingPhoneNumber: billingPhoneNumber
            }).then(function () { window.location.href = "/my-anonymous-account"; }, _.bind(this.retrieveErrorLabel, this));
        },

        retrievePassword: function () {
            this.setLoading(true);
            api.action('customer', 'resetPasswordStorefront', {
                EmailAddress: this.$parent.find('[data-mz-forgotpassword-email]').val()
            }).then(this.displayResetPasswordMessage, this.displayApiMessage);
        },
        handleLoginComplete: function () {
            window.location.reload();
        },
        displayResetPasswordMessage: function () {
            this.displayMessage(Hypr.getLabel('resetEmailSent'));
        }
    });

    var SignupPopover = function() {
        DismissablePopover.apply(this, arguments);
    };
    SignupPopover.prototype = new DismissablePopover();
    $.extend(SignupPopover.prototype, LoginPopover.prototype, {
        boundMethods: ['handleEnterKey', 'dismisser', 'displayMessage', 'displayApiMessage', 'createPopover', 'signup', 'onPopoverShow'],
        template: Hypr.getTemplate('modules/common/signup-popover').render(),
        bindListeners: function (on) {
            var onOrOff = on ? "on" : "off";
            this.$parent[onOrOff]('click', '[data-mz-action="signup"]', this.signup);
            this.$parent[onOrOff]('keypress', 'input', this.handleEnterKey);
        },
        handleEnterKey: function (e) {
            if (e.which === 13) { this.signup(); }
        },
        validate: function (payload) {
            if (!payload.account.emailAddress) return this.displayMessage(Hypr.getLabel('emailMissing')), false;
            if (!payload.password) return this.displayMessage(Hypr.getLabel('passwordMissing')), false;
            if (payload.password !== this.$parent.find('[data-mz-signup-confirmpassword]').val()) return this.displayMessage(Hypr.getLabel('passwordsDoNotMatch')), false;
            return true;
        },
        signup: function () {
            var self = this,
                email       = this.$parent.find('[data-mz-signup-emailaddress]').val(),
                firstName   = this.$parent.find('[data-mz-signup-firstname]').val(),
                lastName    = this.$parent.find('[data-mz-signup-lastname]').val(),
                company     = this.$parent.find('[data-mz-signup-company]').val(),
                city        = this.$parent.find('[data-mz-signup-city]').val(),
                state       = this.$parent.find('[data-mz-signup-state]').val(),
                phone       = this.$parent.find('[data-mz-signup-phone]').val(),
                mobile      = this.$parent.find('[data-mz-signup-mobile]').val(),
                payload = {
                    account: { 
                        emailAddress: email,
                        userName: email,
                        firstName: firstName,
                        lastName: lastName,
                        contacts: [{ 
                            email: email,
                            firstName: firstName,
                            lastNameOrSurname: lastName,
                            companyname : company,
                            city : city,
                            state : state,
                            phone : phone,
                            mobile : mobile,
                        }]
                    },
                password: this.$parent.find('[data-mz-signup-password]').val()
                };
            if (this.validate(payload)) {
                //var user = api.createSync('user', payload);
                this.setLoading(true);
                return api.action('customer', 'createStorefront', payload).then(function () {
                    if(window.location.pathname === "/user/login"){
                            if(window.location.queryString.returnUrl !== undefined){
                                window.location=window.location.queryString.returnUrl+""+window.location.hash;
                            }else{
                                window.location = '/myaccount'; 
                            }
                    } else {
                        window.location.reload(); 
                    }
                }, self.displayApiMessage);
            }
        }
    }); 


var UserLogin = function($el) {
    var self = this;
    this.$el = $el;

    this.$messageBar = this.$el.find('[data-mz-messagebar-container]');
    this.$el.find('[data-mz-login-btn]').on('click', function(e) {
        e.preventDefault();
        self.login();
        return false; 
    });
    $.each(this.boundMethods, function(ix, method) {
        self[method] = $.proxy(self[method], self);
    });
};

$.extend(UserLogin.prototype, {
    boundMethods: ['displayMessage', 'displayApiMessage', 'login'],
    login: function() {
        var self = this,returnval,
            payload = {
                email: $('input[name="email"]').val(),
                password: $('input[name="password"]').val()
            };
            $('[data-mz-messagebar-container]').empty();
        if(self.$el.parent().find('input[name=returnUrl]').val() === ""){
            returnval = "/myaccount";
        }else{
            returnval = self.$el.parent().find('input[name=returnUrl]').val();
        }

        if (this.validate(payload)) {
            return api.action('customer', 'loginStorefront', {
                email: payload.email,
                password: payload.password   
            }).then(self.handleLoginComplete.bind(this, returnval), self.displayApiMessage);
            
        }
    },
    
    handleLoginComplete: function (returnUrl) {
            if ( returnUrl ){
                //var redirectedurl= getUrlParameter("returnUrl");
                returnUrl=returnUrl+window.location.hash;
                window.location.href= returnUrl;
            }else{ 
                window.location.reload();  
            }
        },
    
    validate: function(data) {
        
        if ((!data.email) && (!data.password)) {
            $('#mz-userpassword,#mz-userlogin-email').addClass('input-required');
            $("html,body").animate({ scrollTop: $('.login').offset().top }, 600);
            return this.displayMessage(Hypr.getLabel('emailPasswordMissing')), false;
        } else {
            $('#mz-userpassword,#mz-userlogin-email').removeClass('input-required');
        }

        if (!data.email) {
            $('#mz-userlogin-email').addClass('input-required');

            return this.displayMessage(Hypr.getLabel('emailMiss')), false;
        } else if (!data.password) {
            $('#mz-userpassword').addClass('input-required');
            return this.displayMessage(Hypr.getLabel('passwordMissing')), false;

        }
        if (data.email.length > 0) {
            var email = data.email.split("@"),
                emailCharsAfterSymbol=0,
                emailCharsBeforeSymbol=0;
            if(email.length>1)
            {
                emailCharsAfterSymbol = email[1].length;
                emailCharsBeforeSymbol = email[0].length;

                if ((emailCharsAfterSymbol > 255) || (emailCharsBeforeSymbol > 64)) {
                    $('#mz-userlogin-email').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('emailLengthLimitAfterSymbol')), false;
                }
            }
            else
            {
                $('#mz-userlogin-email').addClass('input-required');
                return this.displayMessage(Hypr.getLabel('emailMissing')), false;
            }

        }
        return true;

    },
    displayMessage: function(msg) {
        this.$messageBar.html(this.messageTemplate.render({
            model: [{
                message: msg
            }]
        }));
    },
    /* jshint ignore:start */
    displayMessage: function(msg,type) {
        this.$messageBar.html(this.messageTemplate.render({
            model: [{
                message: msg,
                messageType:type
            }]
        }));
    },
    /* jshint ignore:end */
    displayApiMessage: function(xhr) {

        if (xhr.errorCode == "ITEM_NOT_FOUND") {
            xhr.message = "This email address is not yet registered with us";
            this.displayMessage(xhr.message);
        } else {
            this.displayMessage(xhr.message);
        }
    },
    hideMessage: function() {
        this.$messageBar.html('');
    },
    messageTemplate: Hypr.getTemplate('modules/common/message-bar')
});

var $theuserForm = $('[data-mz-userlogin]');
window.userlogin = new UserLogin($theuserForm);  

    $(document).ready(function () {

        if(!require.mozuData("pagecontext").user.isAnonymous && !require.mozuData("pagecontext").user.isAuthenticated){
            if(require.mozuData("pagecontext").isMobile){
                var pagetype=require.mozuData("pagecontext").cmsContext.template.path;
                if(pagetype == "login"){
                    $('html, body').animate({
                        scrollTop: $("#mz-userlogin-email").offset().top-200 
                    }, 2000);    
                }    
            }
        }

        if(!require.mozuData("pagecontext").user.isAnonymous && require.mozuData("pagecontext").user.isAuthenticated){
            if(window.location.pathname === "/user/order-status"){
                window.location="/myaccount#orderhistory";
            }    
        }else if(!require.mozuData("pagecontext").user.isAnonymous && !require.mozuData("pagecontext").user.isAuthenticated){ 
            $('form[name="mz-anonymousorder"]').find(".mz-popover-message").addClass("mz-messagebar").html('<ul class="is-showing mz-errors"><li>Please log out to view guest order-status, or log in to view orders in your account.</li></ul>');
            $('form[name="mz-anonymousorder"]').find("button").attr("disabled","disabled");
        }     

        $docBody = $(document.body);

        $("[data-mz-verify-with]").on("change", function(e){
            var placehold = $("[data-mz-verify-with] option:selected").attr("textdata");
            $("[data-mz-verification]").attr("placeholder", placehold);
            
        });

        $('[data-mz-action="login"]').each(function () {
            var popover = new LoginPopover();
            popover.init(this); 
            $(this).data('mz.popover', popover);
        });
        $('[data-mz-action="signup"]').each(function () {
            //alert("hii");
            var popover = new SignupPopover();
            popover.init(this);
            $(this).data('mz.popover', popover);
        });
        $('[data-mz-action="launchforgotpassword"]').each(function () {
            var popover = new LoginPopover(); 
            popover.init(this);
            $(this).data('mz.popover', popover);
        });
        $('[data-mz-action="anonymousorder-submit"]').each(function () {
            var loginPage = new SignupPopover();
            loginPage.formSelector = 'form[name="mz-anonymousorder"]';
            loginPage.pageType = 'anonymousorder';
            loginPage.init(this);
        });

        //volt mobile megamenu implementation 
            
        var toggle = 1;
        $('.mz-sitenav-link').click(function(){
            if($(this).parents().hasClass("forMobile"))
            {
                if(toggle%2 ==1)
                    menuActivtion(this);
                else
                    menuDeactivtion(this);

                toggle++;
            }
        });


    });

    //volt mobile megamenu implementation 
   
    function menuActivtion(e) {
        $(e).parent().addClass('activeMenu');
        $(e).addClass('activeTitle');
    }

    function menuDeactivtion(e)
    {
        $(e).parent().removeClass('activeMenu');
        $(e).removeClass('activeTitle');
    }

});
