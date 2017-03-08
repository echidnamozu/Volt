define(['modules/jquery-mozu', 'underscore',  'hyprlive', 'modules/modal', 'modules/api', 'modules/models-cart', 'modules/models-product',
        'modules/soft-cart', "vendor/jquery.maskedinput.min"
    ],     
function($, _, Hypr, ModalWindow, Api, CartModels, ProductModels, SoftCart) {
        var isiPad = navigator.userAgent.toLowerCase().indexOf("ipad");
        $(function() {
            var sele = $("#vt-header-right").find(".mz-searchbox-field")[1],
                subsle = $("#vt-additional-header").find(".mz-searchbox-field")[1];
            var modelpop = $('.' + 'mz-modal');
            $(sele).blur(function() {
                var dtat = $(sele).val();
                $(subsle).val(dtat);
            });
            $(subsle).blur(function() {
                var dtat = $(subsle).val();
                $(sele).val(dtat);
            });

            $(document).on("click", ".selectpicker", function() {
                $("#sidebar").slideUp();
            });
            $('#vt-header').data('size', 'big');

    
            $('#mz-login-email,#mz-password').keypress(function (e) {
             var key = e.which;
             if(key == 13)  // the enter key code
              {
                $('.loginformbtn').click();    
                return false;  
              }
            }); 
            $('#mz-signup-fname,#mz-signup-lname,#mz-signup-email,#mz-signup-password,#mz-signup-repassword').keypress(function (e) {
             var key = e.which;
             if(key == 13)  // the enter key code
              {
                $('.mz-btn-signup').click();
                return false;  
              }
            });
            $('#mz-fpwd-email').keypress(function (e) {
             passclicked_flag=false;
             var key = e.which;
             if(key == 13)  // the enter key code
              {
                $('[data-mz-forgotpwd-form]').click();
                return false;  
              }
            });
            $(document).find('form#mz-div-fpwd-assist').find('#mz-fpwd-assist-email').keypress(function (e) {
             var key = e.which;
             if(key == 13)  // the enter key code
              {
                $(this).parents("#mz-div-fpwd-assist").find('[data-mz-pwdassist-form]').click();
                return false;  
              }
            });
            $(document).find('div#mz-div-fpwd-assist').find('#mz-fpwd-assist-email').keypress(function (e) {
             var key = e.which;
             if(key == 13)  // the enter key code
              {
                $(this).parent().find('[data-mz-pwdassist-form]').click();
                return false;  
              }
            });

            $( "#reset-pwd, #re-enter-pwd" ).keyup(function() {
              
              if($(this).val().trim() !== "")
              {
                $('#reset-submit').prop("disabled",false);
              }
              else
              {
                $('#reset-submit').prop("disabled",true);
              }
            });

        });

        var Headerheight = $("#vt-header .bg-header").height(),
            HeaderMainopacity = $("#vt-header").css('opacity'),
            Headeropacity = $("#vt-header .bg-header").css('opacity');
        var HeaderIntroOpcity = $(".header-intro").css('opcaity'),
            navTop = $('.mz-temp-sitenav').css('top'),
            activeDiv = 1,
            mobileactiveDiv = 1;
        // For Web version
        var arr = [];
        if (($(window).width()) > 767) {
            //Check is user is valid or not
            if (!require.mozuData('user').isAnonymous) {
                showEachItem($('.promoslider'));
            } else {
                arr = [];
                $('.promoslider').each(function(k, v) {
                    if (!v.hasAttribute('type')) {
                        arr.push(v);
                    }
                });
                showEachItem(arr);
            }
        }
        //Mobile 
        else {
            //Check is user is valid or not
            if (!require.mozuData('user').isAnonymous) {
                showEachItem($('.mobilepromoslider'));
            } else {
                arr = [];
                $('.mobilepromoslider').each(function(k, v) {
                    if (!v.hasAttribute('type')) {
                        arr.push(v);
                    }
                });
                showEachItem(arr);
            }
        }

        function showEachItem(arr) {
            var k = 0;
            setInterval(function() {
                k = k === arr.length ? k = 0 : k;
                var numDivs = arr.length;
                $(arr).fadeOut(function(a, b, c) {
                    if (--numDivs > 0) return;
                    $(arr[k]).fadeIn();
                    k = k + 1;
                });
            }, 2500);
        }

        $(window).scroll(function() {
            var urlcheck = !window.location.pathname.split("/")[2] ? "" : window.location.pathname.split("/")[2].toLowerCase();
            var urlcheck1 = !window.location.pathname.split("/")[1] ? "" : window.location.pathname.split("/")[1].toLowerCase();
            if ($(document).scrollTop() > 100) {
                $('.header-intro').addClass('removebghead');
                $('.mz-ampheade').addClass('removebghead');
                $('.mz-home-nav').addClass('removebghead');
                $('#vt-header-right').stop(true).fadeOut(100, function() {
                    $('#vt-additional-header').stop(true).fadeIn(100, function() {
                        $('#vt-header-right').stop(true).slideUp("slow");
                    });
                    $(document).find(".icon-srch").show();   
                    $(document).find(".add_search").hide();
                });
                $("#vt-header").stop().animate({
                    'min-height': "54px",
                    opacity: 1
                }, 1);
                $('.mz-temp-sitenav').stop().animate({}, 1);

            } else {

                $("#vt-header .bg-header").stop().animate({
                    
                    opacity: Headeropacity
                }, 1);
                $('.mz-temp-sitenav').stop().animate({
                    top: navTop,
                    opacity: 1,
                }, 1);
                $('#vt-additional-header').stop(true).fadeOut(200, function() {
                    $('#vt-header-right').stop(true).fadeIn(300, function() {
                        $('#vt-additional-header').stop(true).slideUp();
                    });
                });
                $('.header-intro').removeClass('removebghead');
                $('.mz-ampheade').removeClass('removebghead');
                $('.mz-home-nav').removeClass('removebghead');

            }
            var _index = urlcheck1.indexOf("video");

        });

        // ---------------Login Popup ---------------------------------------
        var currentUser = require.mozuData('user');
  
       
        if (!currentUser.isAnonymous && !currentUser.isAuthenticated) { 
            var urlinfo = !window.location.pathname.split("/")[1] ? "" : window.location.pathname.split("/")[1].toLowerCase();
            if(urlinfo.toLowerCase()=="checkout" || urlinfo.toLowerCase()=="myaccount" ){
                $(".warning-info").show();
                
            }
            
           
        }  
        
       

        // ---------------Common Function for toggel---------------------------------------
        function toggleBind(trigger, target) {
            return $(trigger).on('click', function(e) {
                e.preventDefault();
                $(target).toggle();
            });
        }
        isiPad = navigator.userAgent.toLowerCase().indexOf("ipad");
        
        
        //--- Password Assist------//
        var PassAssist= function($el){
            var self = this;
            this.$el = $el;
            this.$messageBar = this.$el.find('[data-mz-messagebar-container]');
            
            this.$el.find('[data-mz-pwdassist-form]').on('click', function(e) {
               
                e.preventDefault();
                $("#mz-fpwd-assist-email").removeClass('input-required');
               
                self.retrievePassword();
                return false;
            });


             $('[data-mz-role="modal-close"]').on('click', function() {
                $("#mz-fpwd-assist-email").removeClass('input-required');
                $("#mz-fpwd-assist-email").val('');
                 $('.mz-popover-pwdassist').hide();
                 $('#mz-fpwd-assist-email').val('');
            });
        };
        $.extend(PassAssist.prototype, {
            boundMethods: ['displayMessage', 'displayApiMessage', 'login'],
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
            displayresetMessage: function(msg,type) {
                $(document).find('[data-mz-messagebar-container]').html(this.messageTemplate.render({
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
                this.$el.find('[data-mz-email]').val('');
            },
            hideMessage: function() {
                this.$messageBar.html('');
            },
            validateForgotPwdEmail: function(data) {
                var self = this;
                if (!self.$el.find("#mz-fpwd-assist-email").val() ) {
                    $(".mz-popover-pwdassist").animate({ scrollTop: 0 }, 600);
                    self.$el.find("#mz-fpwd-assist-email").addClass('input-required');

                    return this.displayMessage(Hypr.getLabel('emailMiss')), false;
                }
                if (data.length > 0) {
                    var email = data.split("@"),
                        emailCharsAfterSymbol=0,
                        emailCharsBeforeSymbol=0;
                    if(email.length>1)
                    {
                        emailCharsAfterSymbol = email[1].length;
                        emailCharsBeforeSymbol = email[0].length;

                        if ((emailCharsAfterSymbol > 255) || (emailCharsBeforeSymbol > 64)) {
                            $(".mz-popover-pwdassist").animate({ scrollTop: 0 }, 600);
                            self.$el.find("#mz-fpwd-assist-email").addClass('input-required');
                            return this.displayMessage(Hypr.getLabel('emailLengthLimitAfterSymbol')), false;
                        }
                    }
                    else
                    {
                        $(".mz-popover-pwdassist").animate({ scrollTop: 0 }, 600);
                        self.$el.find("#mz-fpwd-assist-email").addClass('input-required');
                        return this.displayMessage(Hypr.getLabel('emailMissing')), false;
                    }

                }
                return true;
            },
            retrievePassword: function() {
                var self = this;
                $('[data-mz-messagebar-container]').empty();
                if (this.validateForgotPwdEmail(self.$el.find("#mz-fpwd-assist-email").val())) {
                
                $(".mz-popover-pwdassist").animate({ scrollTop: 0 }, 600);
                
                    Api.on('error', function(badPromise, xhr, requestConf) {
                        self.displayApiMessage(badPromise);
                    });
                    Api.action('customer', 'resetPasswordStorefront', {
                        EmailAddress: self.$el.find("#mz-fpwd-assist-email").val()
                    }).then(function(response) {
                        self.$el.find("#mz-fpwd-assist-email").val('');
                        self.displayMessage(Hypr.getLabel('resetEmailSent'),"success"); 
                    });
                }
            },
            displayResetPasswordMessage: function(self) {
                self.$el.find("[data-mz-email]").val('');
                self.displayMessage(Hypr.getLabel('resetEmailSent'));
            },
            messageTemplate: Hypr.getTemplate('modules/common/message-bar')
        });
        
        //----- End Password Assist------//
        $(document).find('[data-mz-forgotpwd-form]').on('click', function(e) {
              
            e.preventDefault();
            $('#mz-fpwd-email').removeClass('input-required');
            var fgpwd_view = new PassForm($("#mz-div-fpwd"));
            fgpwd_view.retrievePassword();
            return false;  
            
        });
        //--- Forgot Password ------//
        var passclicked_flag=false;
        var PassForm= function($el){ 
            var self = this;
            this.$el = $el;
            this.$messageBar = this.$el.find('[data-mz-messagebar-container]');
        };
        $.extend(PassForm.prototype, {
            boundMethods: ['displayMessage', 'displayApiMessage', 'login'],
            displayMessage: function(msg) {
                this.$messageBar.html(this.messageTemplate.render({
                    model: [{
                        message: msg
                    }]
                }));
                this.$el.find('[data-mz-pwd]').val('');
            },
            /* jshint ignore:start */
            displayMessage: function(msg,type) {
                this.$messageBar.html(this.messageTemplate.render({
                    model: [{
                        message: msg,
                        messageType:type
                    }]
                }));
                  this.$el.find('[data-mz-pwd]').val('');
            },
            /* jshint ignore:end */
            displayApiMessage: function(xhr) {

                if (xhr.errorCode == "ITEM_NOT_FOUND") {
                    xhr.message = "This email address is not yet registered with us";
                    this.displayMessage(xhr.message);
                } else {
                    this.displayMessage(xhr.message);
                }
                this.$el.find('[data-mz-pwd]').val('');
            },
            hideMessage: function() {
                this.$messageBar.html('');
            },
            validateForgotPwdEmail: function(data) {
                var reMail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                if (!data) {
                    $('#mz-fpwd-email').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('emailMiss')), false;
                }
                else if (!reMail.test(data)) {
                    $('#mz-login-email').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('emailMissing')), false;
                }
                return true;
            },
            retrievePassword: function() {
                var self = this;
                if (this.validateForgotPwdEmail($("#mz-fpwd-email").val())) {
                    Api.on('error', function(badPromise, xhr, requestConf) {
                        self.displayApiMessage(badPromise);
                    });
                    Api.action('customer', 'resetPasswordStorefront', {
                        EmailAddress: $("#mz-fpwd-email").val()
                    }).then(function(data) {
                        $("#mz-fpwd-email").val('');
                        self.displayMessage(Hypr.getLabel('resetEmailSent'),"success"); 
                    });
                }
            },
            displayResetPasswordMessage: function(self) {
                $("[data-mz-forgotpassword-email]").val('');
                self.displayMessage(Hypr.getLabel('resetEmailSent'));
            },
            messageTemplate: Hypr.getTemplate('modules/common/message-bar')
        });
        
        //----- End Forgot Password ------//
        
        
        // ---------------Login Popup ---------------------------------------
        var LoginForm = function($el) {
            var self = this;
            this.$el = $el;

            this.$messageBar = this.$el.find('[data-mz-messagebar-container]');
            this.$el.find('[data-mz-login-form]').on('submit', function(e) {
                e.preventDefault();
                self.login();
                return true; 
            });
            this.$el.find('[data-mz-forgotpwd-form]').on('click', function(e) {
                e.preventDefault();
                $('#mz-fpwd-email').removeClass('input-required');
                self.retrievePassword();
                return false;
            });
            this.$el.find('[data-mz-guestemail]').on('click', function(e) {
                e.preventDefault();
                self.guestlogin();
                return false;
            });
             this.$el.find('[data-mz-guestemaill]').on('click', function(e) {
                e.preventDefault();
                self.guestlogin();
                return false; 
            });
            this.$el.find('#guest_email').on('keypress', function(e) {
                 if (e.which === 13) {
                    e.preventDefault();
                     self.guestlogin();
                    return false;
                 }
            });
 
            this.$el.find('.mz-creatacc-btn').on('click', function() {
                $('.mz-messagebar').html('');
                $('.mz-login-head').addClass('mz-signupmodal_inner');
            });   

            $('#mz-sinup-form-panel .mz-back-link').on('click', function() {
                $('.mz-login-head').removeClass('mz-signupmodal_inner');
            });
            $.each(this.boundMethods, function(ix, method) {
                self[method] = $.proxy(self[method], self);
            });

            var signupform = new SignupForm($('[data-mz-signup-form]'));
             if(!require.mozuData("pagecontext").isEditMode){ 
            $('[data-mz-role="modal-close"]').on('click', function() {
                closePopup(); 
                
                var inputs = $(document).find('select, input, textarea, button, a').filter(':visible');
                $(inputs).each(function(){
                    var tbindex=$(this).data("index");
                    if(tbindex){
                        $(this).attr("tabindex",tbindex);
                    }
                    //$(this).attr("data-index",tbindex);
                            
                });
                
                 $('body').css('overflowY','auto');


                $('#mz-signupback').trigger("click"); 
                $('#mz-signup').hide();
                $('#mz-login').show();
                $('#mz-divlogin').show();
                $('#mz-div-fpwd').hide();

                $('#mz-login-email').val('');
                $('#mz-password').val('');
                $('#mz-fpwd-email').val('');
                $('#mz-signup-fname').val('');
                $('#mz-signup-lname').val('');
                $('#mz-signup-email').val('');
                $('#mz-signup-password').val('');
                $('#mz-signup-repassword').val('');
                $('[data-mz-messagebar-container]').empty();
                $('#mz-login-email,#mz-password,#mz-fpwd-email,#mz-signup-fname,#mz-signup-lname,#mz-signup-email,#mz-signup-password,#mz-signup-repassword').removeClass('input-required');
                
                $('[data-mz-login-form]').show();
                
                
                if(location.pathname === "/user/login" || location.pathname === "/user/login/"){
                   
                }
            }); 
             }

            function closePopup() {
                $('.mz-modal').hide();
                $('[data-mz-loginpopup]').removeAttr('action');
                $('.mz-login-container').remove();
            }
        };

        $.extend(LoginForm.prototype, {
            boundMethods: ['displayMessage', 'displayApiMessage', 'login'],
            login: function() {
                    var self = this,
                    data = (function(formdata) {  
                        return _.object(_.pluck(formdata, 'name'), _.pluck(formdata, 'value'));
                    }(this.$el.find('[data-mz-login-form]').serializeArray())),
                    payload = {
                        email: data.email,
                        password: data.password
                    };
                    $('[data-mz-messagebar-container]').empty();
                if (this.validate(payload)) {
                    return Api.action('customer', 'loginStorefront', {
                        email: payload.email, 
                        password: payload.password
                    }).then(function(res) {
                        var pageaction = $('.mz-utilitynav-link').attr('action');
                        var wishlabel = /wishlist/g;     
                        if($.cookie("wishlist")){      
                            var wishlistinfo=$.cookie("wishlist");
                            if(wishlistinfo=="clicked"){
                                $.removeCookie("wishlist"); 
                                window.location="/myaccount#wishlist";
                            }
                        }else if (pageaction == 'checkout') {
                            location.reload(); 
                        } else if (wishlabel.test(pageaction)) {
                           location.reload();
                       } else if(window.location.pathname === "/user/login"){
                            if(window.location.queryString.returnUrl !== undefined){
                                window.location=window.location.queryString.returnUrl+""+window.location.hash;
                            }else{
                                window.location = '/myaccount'; 
                            }
                        } else {
                            var cartlabel = /cart/g,
                                currentUrl = window.location.href;
                            if (cartlabel.test(currentUrl)) {
                                if($(document).find(".mz-loginpop").attr("addguest") === "yes"){
                                    $.cookie("guestuse", "yes");
                                    location.reload(); 
                                }else{
                                    location.reload();    
                                }    
                            } else {    
                                
                                if(location.pathname=="/user/resetpasswordconfirm"){
                                    window.location = '/myaccount'; 
                                }else{
                                    if((require.mozuData("pagecontext").title === "SignInForm")||(require.mozuData("pagecontext").title === "SignUpForm")){      
                                        window.location=document.referrer;
                                    }else{
                                        window.location.reload();
                                    }    
                                }
                                
                            }
                        }
                    }, self.displayApiMessage);
                }
            },
            validate: function(data) {
                var reMail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

                if ((!data.email) && (!data.password)) {
                    $('#mz-password,#mz-login-email').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('emailPasswordMissing')), false;
                } else {
                    $('#mz-password,#mz-login-email').removeClass('input-required');
                }

                if (!data.email) { 
                    $('#mz-login-email').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('emailMiss')), false;
                } 
                else if (!data.password) {
                    $('#mz-password').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('passwordMissing')), false;

                } 
                else if (!reMail.test(data.email)) {
                    $('#mz-login-email').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('emailMissing')), false;
                }
                 if (data.email.length > 0) {
                    var email = data.email.split("@");

                    var re=/^(?:[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[A-Za-z0-9-]*[A-Za-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

                    if(email.length>1)
                    {
                        emailCharsAfterSymbol = email[1].length;
                        emailCharsBeforeSymbol = email[0].length;

                        if ((emailCharsAfterSymbol > 255) || (emailCharsBeforeSymbol > 64)) {
                            $('#mz-login-email').addClass('input-required');
                            return this.displayMessage(Hypr.getLabel('emailLengthLimitAfterSymbol')), false;
                        }
            if(email.length > 2 ){
                            $('#mz-login-email').addClass('input-required');
                            return this.displayMessage(Hypr.getLabel('signupemailMissing')), false;
                        }
                        if(!re.test(data.email)){
                           
                            $('#mz-login-email').addClass('input-required');
                            return this.displayMessage(Hypr.getLabel('signupemailMissing')), false;
                        }
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
                this.$el.find('[data-mz-pwd]').val('');
            },
            /* jshint ignore:start */
            displayMessage: function(msg,type) {
                this.$messageBar.html(this.messageTemplate.render({
                    model: [{
                        message: msg,
                        messageType:type
                    }]
                }));
                  this.$el.find('[data-mz-pwd]').val('');
            },
            /* jshint ignore:end */
            displayApiMessage: function(xhr) {

                if (xhr.errorCode == "ITEM_NOT_FOUND") {
                    xhr.message = "This email address is not yet registered with us";
                    this.displayMessage(xhr.message);
                } else {
                    this.displayMessage(xhr.message);
                }
                this.$el.find('[data-mz-pwd]').val('');
            },
            hideMessage: function() {
                this.$messageBar.html('');
            },
            validateForgotPwdEmail: function(data) {
                if (!$("#mz-fpwd-email").val() ) {
                    $("#mz-fpwd-email").addClass('input-required');

                    return this.displayMessage(Hypr.getLabel('emailMiss')), false;
                }
                if (data.length > 0) {
                    var email = data.split("@"),
                        emailCharsAfterSymbol=0,
                        emailCharsBeforeSymbol=0,
                        reMail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    if(email.length>1)
                    {
                        emailCharsAfterSymbol = email[1].length;
                        emailCharsBeforeSymbol = email[0].length;

                        if ((emailCharsAfterSymbol > 255) || (emailCharsBeforeSymbol > 64)) {
                            $("#mz-fpwd-email").addClass('input-required');
                            return this.displayMessage(Hypr.getLabel('emailLengthLimitAfterSymbol')), false;
                        }
                        else if(!reMail.test(data)) {
                            $("#guest_email").addClass('input-required');
                            return this.displayMessage(Hypr.getLabel('emailMissing')), false;
                        }
                    }
                    else
                    {
                        $("#mz-fpwd-email").addClass('input-required');
                        return this.displayMessage(Hypr.getLabel('emailMissing')), false;
                    }

                }
                return true;
            },
               guestemail: function(data) {
                   
                if (!data ) {
                    $("#guest_email").addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('emailMiss')), false;
                }
                if (data.length > 0) {
                    var email = data.split("@"),
                        emailCharsAfterSymbol=0,
                        emailCharsBeforeSymbol=0,
                        reMail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    if(email.length>1)
                    {
                        emailCharsAfterSymbol = email[1].length;
                        emailCharsBeforeSymbol = email[0].length;

                        if ((emailCharsAfterSymbol > 255) || (emailCharsBeforeSymbol > 64)) {
                            $("#guest_email").addClass('input-required');
                            return this.displayMessage(Hypr.getLabel('emailLengthLimitAfterSymbol')), false;
                        }
                        else if(!reMail.test(data)) {
                            $("#guest_email").addClass('input-required');
                            return this.displayMessage(Hypr.getLabel('emailMissing')), false;
                        } 
                    }
                    else
                    {
                        $("#guest_email").addClass('input-required');
                        return this.displayMessage(Hypr.getLabel('emailMissing')), false;
                    }

                }
                return true;
            },
            retrievePassword: function() {
                var self = this;
                if (this.validateForgotPwdEmail($("#mz-fpwd-email").val())) {
                    Api.on('error', function(badPromise, xhr, requestConf) {
                        self.displayApiMessage(badPromise);
                    });
                    Api.action('customer', 'resetPasswordStorefront', {
                        EmailAddress: $("#mz-fpwd-email").val()
                    }).then(function(response) {
                        $("#mz-fpwd-email").val('');
                        self.displayMessage(Hypr.getLabel('resetEmailSent'),"success"); 
                    });
                }
            },
            guestlogin: function(){
                var validGuestEmail; 
                if (!$("#guest_email").val() || $("#guest_email").val().length>0) {
                    validGuestEmail = this.guestemail($("#guest_email").val());
                } 
               if(validGuestEmail){
                    $.cookie('guest', $('#guest_email').val());
                    $('.mz-modal').hide();
                    $("body").css("overflowY","auto");
                    if(require.mozuData('pagecontext').pageType === "cart"){
                        if($(document).find(".mz-loginpop").attr("addguest") === "yes"){
                            var cartModel = CartModels.Cart.fromCurrent();  
                            cartModel.on('ordercreated', function (order) { 
                                window.location = "/checkout/" + order.prop('id');
                            });
                            cartModel.toOrder();
                        }           
                    }else{
                        var gmail = $("#guest_email").val();
                        $('#billing-email').val(gmail);
                        $('#billing-email').blur();
                    }

               } 

           }, 

            displayResetPasswordMessage: function(self) { 
                $("[data-mz-forgotpassword-email]").val('');
                self.displayMessage(Hypr.getLabel('resetEmailSent'));
            },
            messageTemplate: Hypr.getTemplate('modules/common/message-bar')
        });

        var handleLoginComplete = function () {
            window.location.reload();
         };

        var clicked_flag=false;
        var SignupForm = function($el) {
            var self = this;  
            this.$el = $el;
            this.$messageBar = this.$el.find('[data-mz-messagebar-container]');
            
            this.$el.find('.mz-btn-signup').click(function(e) {
         if($('#mz-signup-fname').val()===""){
                    clicked_flag=false;
                }
                if(!clicked_flag){
                    clicked_flag=true;
                    e.preventDefault();
                    self.signup();
                    return false;    
                }
                
            });
            this.$el.find('input').keypress(function(e) {
                    clicked_flag=false;
            });
            $.each(this.boundMethods, function(ix, method) {
                self[method] = $.proxy(self[method], self);
            });
        };
        $.extend(SignupForm.prototype, {
            boundMethods: ['displayMessage', 'displayApiMessage', 'signup'],
            signup: function() {
                $(document).find('.preloader').show();
                var self = this,
                    firstName = $('#mz-signup-fname').val(),
                    lastName = $('#mz-signup-lname').val(),
                    email = $('#mz-signup-email').val().trim(),
                    password = $('#mz-signup-password').val(),
                    repassword = $('#mz-signup-repassword').val(),
                    checksign = $('#checksign').is(":checked");
                 var payload={
                     account: { 
                        emailAddress : $('#mz-signup-email').val(),
                        userName: $('#mz-signup-email').val(), 
                         firstName : $('#mz-signup-fname').val(),
                        lastName : $('#mz-signup-lname').val(),
                        acceptsMarketing: checksign,
                        contacts: [{
                                email: $('#mz-signup-email').val(),
                                firstName:$('#mz-signup-fname').val(),
                                lastNameOrSurname: $('#mz-signup-lname').val(),
                                companyName : "",
                                city: "",
                                phone: "",
                                mobile: "",
                                state: "",
                                business: "", 
                                url: ""
                            }]   
                    },       
                    password:$('#mz-signup-password').val(), 
                }; 
                $('[data-mz-messagebar-container]').empty();
                if (this.validate(payload)) {
                     

                    Api.action('customer', 'createStorefront',payload).then(function(resp){
                        if(require.mozuData('pagecontext').pageType === "cart"){
                            if($(document).find(".mz-loginpop").attr("addguest") === "yes"){
                                $.cookie("guestuse", "yes");
                                window.location.reload(); 
                            }else{
                                window.location.reload(); 
                            }
                        }else{
                            if(window.location.pathname === "/user/login"){
                                if(window.location.queryString.returnUrl !== undefined){
                                    window.location=window.location.queryString.returnUrl+""+window.location.hash;
                                }else{
                                    window.location = '/myaccount'; 
                                }
                            }else{
                                if((require.mozuData("pagecontext").title === "SignInForm")||(require.mozuData("pagecontext").title === "SignUpForm")){      
                                        window.location=document.referrer;
                                }else{
                                    window.location.reload();
                                }  
                            }
                        }
                    },self.displayApiMessage); 
                }   

            },
            validate: function(data) {
                var datavalue,strongRegex = /^(?:([A-Z])*([a-z])*){8,12}$/,
                    emailCharsAfterSymbol, emailCharsBeforeSymbol;
                if (data.account.emailAddress.length > 0) {
                    var email = data.account.emailAddress.split("@");

                    var re=/^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

                    if(email.length>1)
                    {
                        emailCharsAfterSymbol = email[1].length;
                        emailCharsBeforeSymbol = email[0].length;

                        if(!re.test(data.account.emailAddress)){
                            $('#mz-signup-email').addClass('input-required');
                            return this.displayMessage(Hypr.getLabel('signupemailMissing')), false;
                        }
                    }
                    else
                    {
                        $('#mz-signup-email').addClass('input-required');
                        return this.displayMessage(Hypr.getLabel('signupemailMissing')), false;
                    }
                }
                
                if (data.account.firstName.trim() === "") {
                    datavalue = data.account.firstName.substring(0, 1);
                    
                    $('#mz-signup-fname,#mz-signup-lname,#mz-signup-email,#mz-signup-password,#mz-signup-repassword').removeClass('input-required');
                    $('#mz-signup-fname').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signupfirst')), false;
                }
                if (data.account.lastName.trim() === "") {
                    datavalue = data.account.firstName.substring(0, 1);
                    
                    $('#mz-signup-fname,#mz-signup-lname,#mz-signup-email,#mz-signup-password,#mz-signup-repassword').removeClass('input-required');
                    $('#mz-signup-lname').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signuplast')), false;
                }
                if (!data.account.emailAddress && !data.account.firstName && !data.account.lastName && !data.account.password && !data.account.repassword) {
                    $(".mz-modal").animate({
                        scrollTop: 0
                    }, 600);
                    $('#mz-signup-email,#mz-signup-fname,#mz-signup-lname,#mz-signup-password,#mz-signup-repassword').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signupall')), false;

                } else {
                    $('#mz-signup-email,#mz-signup-fname,#mz-signup-lname,#mz-signup-email,#mz-signup-password,#mz-signup-repassword').removeClass('input-required');
                }

                if (!data.account.firstName) {
                    $(".mz-modal").animate({
                        scrollTop: 0
                    }, 600);
                    $('#mz-signup-fname').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signupfirst')), false;
                } else if (!data.account.lastName) {
                    $(".mz-modal").animate({
                        scrollTop: 0
                    }, 600);
                    $('#mz-signup-lname').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signuplast')), false;
                }else if (!data.account.emailAddress) {
                    $(".mz-modal").animate({
                        scrollTop: 0
                    }, 600);
                    $('#mz-signup-email').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signupemail')), false;
                } else if (!data.password) {
                    $(".mz-modal").animate({
                        scrollTop: 0
                    }, 600);
                    $('#mz-signup-password').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signuppass')), false;
                
                } else if (!$('#mz-signup-repassword').val()) {
                    $(".mz-modal").animate({
                        scrollTop: 0
                    }, 600);
                    $('#mz-signup-repassword').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signupconfirmpass')), false;
                }
                else if (data.password != $('#mz-signup-repassword').val()) {
                  $(".mz-modal").animate({
                        scrollTop: 0
                    }, 600);
                    $('#mz-signup-password,#mz-signup-repassword').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('passwordsDoNotMatch')), false;
                } 
                return true;
            },
            
            displayMessage: function(msg) {
                $('.preloader').hide();
                $(".mz-modal").animate({
                        scrollTop: 0
                    }, 600); 
                
                this.$messageBar.html(this.messageTemplate.render({
                    model: [{
                        message: msg
                    }]
                }));
                this.$el.find('[data-mz-signup-password]').val('');
                this.$el.find('[data-mz-signup-confirmpassword]').val('');
            },
            /* jshint ignore:start */
            displayMessage: function(msg,type) {
              if(type!==undefined){
                this.$messageBar.html(this.messageTemplate.render({
                    model: [{
                        message: msg,
                        messageType:type
                    }]
                }));    
                }else{
                
                $('.preloader').hide();
                    $(".mz-modal").animate({
                        scrollTop: 0
                    }, 600); 
                
                this.$messageBar.html(this.messageTemplate.render({
                    model: [{
                        message: msg,
                    }]
                }));
                    
                } 
            }, 
            /* jshint ignore:end */
            displayApiMessage: function(xhr) {
                $('.preloader').hide();
                $(".mz-modal").animate({
                        scrollTop: 0
                    }, 600);
               var err;
                if (xhr.errorCode == "MISSING_OR_INVALID_PARAMETER") {
                    var errorMessage = xhr.message,
                        msgArray = errorMessage.split("Missing or invalid parameter:"),
                        trimMsg = msgArray[1].trim();
                    var errArray = trimMsg.replace(/^\S+/g, '');
                    err = errArray; 
                    
                } else if (xhr.errorCode == "VALIDATION_CONFLICT") {
                    this.$el.find('[data-mz-signup-email]').val('');
                    this.$el.find('[data-mz-signup-confirmemail]').val('');
                    err = 'Username already registered';
                }
                else if(xhr.errorCode=="UNEXPECTED_ERROR"){
                        err = 'This form cannot be submitted while user is already logged In';
                        
                }
                this.displayMessage(err);
            },
            hideMessage: function() {
                this.$messageBar.html('');

            }, 
            messageTemplate: Hypr.getTemplate('modules/common/message-bar')
        });
        /** Login func End **/
        
        /* Login Popup creation start*/
        
        var LoginModal = function() {
                var html = Hypr.getTemplate('modules/common/login-popover-form').render({ 
                host: window.location.host,
                returnUrl: window.location.pathname + window.location.search + window.location.hash
                }); // needs hostname since we don't currently have a siteContext url for this
        
                ModalWindow.call(this, html);
                this.$wrapper.appendTo('.mz-login-content');
                $(".mz-login-container").removeClass("hidden");
                
                var login_view = new LoginForm($("[data-mz-login]"));
                var fgpwd_view = new PassForm($("#mz-div-fpwd"));
                var pwdassist_view = new PassForm($("#mz-div-fpwd-assist"));
                var guest_view = new LoginForm($("#guestuser")); 
                this.loginForm = this.$wrapper.find('#mz-login');
                this.forgotForm = this.$wrapper.find('#tz-fgtpwd-panel');
                this.guest_view = this.$wrapper.find('#guestuser'); 
                this.$wrapper.on('click', '.mz-fgtpwd-link, .mz-frgpassclose', $.proxy(this.toggleLogin, this));
                this.$wrapper.find('[data-mz-login-form]').on('submit', function(e) {
                    e.preventDefault();
                    login_view.login(); 
                    return true;
                });
                this.$wrapper.find('[data-mz-forgotpwd-form]').on('submit', function(e) {
                    e.preventDefault();
                    fgpwd_view.retrievePassword();
                    return false;
                });
                this.$wrapper.find('[data-mz-guestemail]').on('submit', function(e) {
                    e.preventDefault();
                    guest_view.guestlogin();
                    return false;
                });
                
                this.$wrapper.find('#guest_email').on('keypress', function(e) {
                     if (e.which === 13) {
                        e.preventDefault();
                        guest_view.guestlogin();
                        return false;
                     }
                });
                
                this.open();  
        };
        function openPopup() {
            var pageaction = $('.mz-utilitynav-link').attr('action');
            if ((pageaction == "checkout") || (pageaction == "cart")) {
                $('.sectionforlogin').hide();
                $('.sectionforcheckout').show();
            } else {
                $('.sectionforcheckout').hide();
                $('.sectionforlogin').show();
            }
            if(require.mozuData('pagecontext').pageType === "cart"){  
                if($(window).width() < 768){
                    if($(".mz-ampheade").find(".login").find("a").attr("extraattr") !== "1"){
                        $("#guestuser").hide();
                        $(".checkoutbtns").hide();  
                        $(".cartspecor").hide(); 
                        $(".onlyforlogin").show();     
                    }   
                }else{
                   if($(".user-utility").find("[data-mz-loginpopup]").attr("extraattr") !== "1"){
                        $("#guestuser").hide();
                        $(".checkoutbtns").hide();  
                        $(".cartspecor").hide(); 
                        $(".onlyforlogin").show();     
                    }
                } 
                $(".mz-btn-continue-login").first().trigger( "click" );   
            }
            $('.mz-modal').fadeIn();
            $('.mz-login-content').show();
            $('#amp-sign-login').show();

        }  
        LoginModal.create = function(wishListProductId) {
            
            $('.is-showing.mz-errors').hide();
            $('body').css('overflowY', 'hidden');
            var inputs = $(document).find('select, input, textarea, button, a').filter(':visible');
                $(inputs).each(function(){
                    var tbindex=$(this).attr("tabindex");
                    $(this).attr("data-index",tbindex);
                    $(this).attr("tabindex",-1);        
                });
            openPopup();
            
            LoginModal.current = new LoginModal();
        return LoginModal.current;
        };
        $.extend(LoginModal.prototype = new ModalWindow(), {  
            constructor: LoginModal,
            toggleLogin: function() {
                this.loginForm.toggleClass("hidden");
                this.forgotForm.toggleClass("hidden");
                return false;
            },
            
        });
        /* Login Popup Creation  end*/
        
        /** Ready Function Starts **/
        $(function() {
            
             var user = require.mozuData('user');
            var url = !window.location.pathname.split("/")[1] ? "" : window.location.pathname.split("/")[1].toLowerCase();      
            
            if(require.mozuData("pagecontext").isMobile){ 
                if($(".projdescription").height() <362) {
                    $('.more-link').hide();  
                    $(".projdescription").removeClass("set-height");
                }
                else
                {
                   $(".projdescription").addClass("set-height");
                    $('.more-link').show();  
                }
                $(document).on("click", ".more-link", function() {
                    if($(this).hasClass("less")) {
                        $(this).removeClass("less");
                        $(this).html("More");
                        $(this).prev().removeClass("more-desc");
                    } else {
                        $(this).addClass("less");
                        $(this).html("");
                        $(this).prev().addClass("more-desc");
                    }
                });
            }
             var divh=$('.clamped').height(); 
            var p=$('.clamped .text');
           
            $(p).each(function(){ 
                 if($(this).outerHeight()>divh){
               $(this).text(function(index, currentText) {
                return currentText.substr(0, 135) + "....";
                 });
                 }
            });

            
            var urlamp = window.location.hash;

            var obj1 = $(urlamp).closest(".lifetime-warranty-heading");
            accordiontrigger(obj1);
            $(document).on("click", ".lifetime-warranty-heading", function() {
                accordiontrigger(this); 
            });

            function accordiontrigger(obj) {
                if ($(obj).find(".btn").hasClass('minus')) {
                    $(obj).addClass('grey').removeClass('red').next().slideUp();
                    $(obj).find(".lifetime-product-name-heading").addClass("mobile-heading");
                    $(obj).find(".btn").removeClass('minus').addClass('plus');
                    return false;
                } else {
                    $(".lifetime-warranty-content").slideUp();
                
                    $(".lifetime-warranty-heading").find(".btn").removeClass('minus').addClass("plus");
                
                    $(obj).find(".lifetime-product-name-heading").removeClass("mobile-heading");
                    $(obj).find(".btn").removeClass('plus').addClass('minus');
                      $(obj).next().slideDown('slow',function(){
                    var post=$(obj).offset(),top;
                    if(!window.location.pathname.split("/")[2] ? "" : window.location.pathname.split("/")[2].toLowerCase() === 'c') {
                        top=post.top-260;
                    }else{
                        top=post.top-210;    
                    } 
                    $("html, body").animate({ scrollTop: top },600); 
                        
                });
                    return false;
                }
            }
 
        
         if ( (user.isAnonymous && url == "cart") || (user.isAnonymous && url == "checkout") ) {  
            $(".mz-btn-continue-sign-up").click(function(){
                $(".defaultlogin").hide();
                $(".mzloginsignup").show(); 
                if((url == "cart") && ($(this).parent().attr("class") !== "checkoutbtns") ){
                    $(".right-side-signup").show();    
                    $(".onlyforlogin").hide();
                }else{
                      
                }
                if($("#mz-divlogin").attr("style") === "display: none;"){
                    $('#mz-divlogin,#mz-div-fpwd').toggle();
                    $('#mz-login-email').val('');
                    $('#mz-password').val('');
                    $('#mz-fpwd-email').val('');
                    $('[data-mz-messagebar-container]').empty();
                    $('#mz-login-email,#mz-password,#mz-fpwd-email,#mz-signup-fname,#mz-signup-lname,#mz-signup-email,#mz-signup-password,#mz-signup-repassword').removeClass('input-required');
                    $(".mz-messagebar").html("");
                     $(".input-required").removeClass("input-required");
                }  
                $(".mz-btn-continue-sign-up").hide();
                 $(".mz-btn-continue-login").show();
                $(".mz-messagebar").html("");
                 $(".input-required").removeClass("input-required");
            });
            var data = 0;
            $(".mz-btn-continue-login").click(function(){   
               
                    $('#mz-login').show();
                    $('#mz-signup').hide();  
                    if((url == "cart") && ($(this).parent().attr("class") === "checkoutbtns") ){
                       $('.right-side-signup').hide();  
                    } 
                    if($(window).width() < 768){   
                        if((url == "cart") && ($(".mz-ampheade").find(".login").find("a").attr("extraattr") !== "1") && ($(this).parent().attr("class") !== "checkoutbtns") ){
                            $(".right-side-signup").hide();  
                            $(".onlyforlogin").show();
                            
                        }else{
                            $(".onlyforlogin").hide();  
                            $(".mz-ampheade").find(".login").find("a").removeAttr("extraattr");
                            
                        }
                    }else{
                        if((url == "cart") && ($(".user-utility").find("[data-mz-loginpopup]").attr("extraattr") !== "1") && ($(this).parent().attr("class") !== "checkoutbtns") ){
                            $(".right-side-signup").hide();  
                            $(".onlyforlogin").show();
                            
                        }else{
                            $(".onlyforlogin").hide();  
                            $(".user-utility").find("[data-mz-loginpopup]").removeAttr("extraattr");
                            
                        }
                    }  
                   $(".defaultlogin").show(); 
                    $(".mzloginsignup").hide(); 
                    $(".mz-btn-continue-login").hide();
                     $(".mz-btn-continue-sign-up").show();
                       $(".mz-messagebar").html("");
                     $(".input-required").removeClass("input-required");
                     
            });
            $(".mz-forgot-pwd").click(function() {
                 
                $('#mz-divlogin,#mz-div-fpwd').toggle();
                $('#mz-login-email').val('');
                $('#mz-password').val('');
                $('#mz-fpwd-email').val('');
                $('[data-mz-messagebar-container]').empty();
                $('#mz-login-email,#mz-password,#mz-fpwd-email,#mz-signup-fname,#mz-signup-lname,#mz-signup-email,#mz-signup-password,#mz-signup-repassword').removeClass('input-required');
                $(".mz-messagebar").html("");
                 $(".input-required").removeClass("input-required");
        return false;
            });
        }
          else{
                 $(".mz-forgot-pwd").click(function() {
                 
                $('#mz-divlogin,#mz-div-fpwd').toggle();
                $('#mz-login-email').val('');
                $('#mz-password').val('');
                $('#mz-fpwd-email').val('');
                $('[data-mz-messagebar-container]').empty();
                $('#mz-login-email,#mz-password,#mz-fpwd-email,#mz-signup-fname,#mz-signup-lname,#mz-signup-email,#mz-signup-password,#mz-signup-repassword').removeClass('input-required');
                return false;
            });
            var loops = true;     
            $(".mz-btn-continue-sign-up,.mz-btn-continue-login").click(function(e) {

                if(($(this).hasClass("mz-btn-continue-login")) && (loops)){
                  var logindat= new LoginModal();
                  loops = false;
                }
                $('#mz-login,#mz-signup').toggle();
                if($(e.currentTarget).parents(".mz-modal").length === 1){
                    $(document).find(".mz-modal").find('#mz-divlogin').show();
                    $(document).find(".mz-modal").find('#mz-div-fpwd').hide();
                }else{
                    $('#mz-divlogin').show();
                    $('#mz-div-fpwd').hide();
                }
                $(".mz-checkout left-side-login").hide();
                $('#mz-login-email').val('');
                $('#mz-password').val('');
                $('#mz-fpwd-email').val('');
                $('#mz-signup-fname').val('');
                $('#mz-signup-lname').val('');
                $('#mz-signup-email').val('');
                $('#mz-signup-password').val('');
                $('#mz-signup-repassword').val('');
                $('#checksign').attr('checked','false');
                $('[data-mz-messagebar-container]').empty();
                $('#mz-login-email,#mz-password,#mz-fpwd-email,#mz-signup-fname,#mz-signup-lname,#mz-signup-email,#mz-signup-password,#mz-signup-repassword').removeClass('input-required');
                return false;
            });
          }

            $("#amp-sign").click(function() {
                $("#amp-btn").trigger("click");
                 
                $('#mz-signup-page').show();
                $('#mz-login').hide();
                
                $('#mz-password,#mz-login-email').removeClass('input-required');
                return false;
            });
            $('#mz-close').click(function() {
                $('#amp-sign-login').trigger('click');
                $('#tz-fgtpwd-panel').fadeIn();
            });

            $('#amp-sign-login').click(function() {
                $('#mz-signupback').trigger("click");
                $('#mz-signup-page').hide();
                $('#mz-login').show();
                $('[data-mz-login-form]').show();
                $('#mz-signup-email,#mz-signupconfirm,#mz-signuppassword,#mz-signupconfirmpassword,#mz-firstName,#mz-lastName,#mz-company,#mz-city,#mz-state,#mz-phone').removeClass('input-required');
            });

            // Darkens all targetted items except the hovered one on listing pages. */
            $('.mz-tool-content .panel-container').hover(
                function() {
                    $('.mz-tool-content .panel-container').not($(this)).stop().animate({
                        opacity: "0.7"
                    }, 200);
                    $('.models-count', this).stop().animate({
                        opacity: "0.999"
                    }, 200);
                },
                function() {
                    $('.mz-tool-content .panel-container').stop().animate({
                        opacity: "0.999"
                    }, 600);
                    $('.models-count', this).stop().animate({
                        opacity: "0"
                    }, 200);
                }
            );
            $('.mz-tablet-search-button,.icon-search').on('click', function(e) {
                e.preventDefault();    
                $('.search-site').show("fast", function nextshow() {
                    $('.mz-searchbox-input').focus();
                });
            });
            $('.mz-searchclose').on('click', function(e) {
                e.preventDefault();
                window.location.hash="";
                $('.search-site').removeAttr("val");
                $('body').css('overflowY', 'auto');
                $('.search-site').hide();
                $('.uniqsearchbox').val('');  
                $('.mz-searchbox-input').val('');

            });   
            $("[customdata]").keyup(function (e) {
                if (e.which === 13) {
                    var searchval = $.trim($(e.currentTarget).val());
                    if (searchval !== "") {
                        return true;
                    }else{
                        return false;    
                    }
                }
            });
            $(".mz-searchbox-button, button.icon-search2, button.vt-btnno").click(function(e) {
                var searchval = $.trim($(e.currentTarget).parents(".mz-searchbox").find(".tt-input").first().val());
                if (searchval !== "") {
                    return true;
                }else{
                    return false;           
                }
            });
            
            toggleBind('.mz-nav__item.menu', '.mz-main-nav');
            toggleBind('.mz-nav__item.search', '.mz-search');
            toggleBind('.mz-search__dismiss', '.mz-search');

        $(document).on("click", ".tabs-menu a", function(e) { 
            e.preventDefault();
            $(this).parent().addClass("current");
            $(this).parent().siblings().removeClass("current");
            var tab = $(this).attr("href");
            $(this).parents("#tabs-container").find(".tab-content").not(tab).css("display", "none");
            $(this).parents("#tabs-container").find(tab).fadeIn();
        });
            /** Show Login Model **/
            if(require.mozuData("pagecontext").isEditMode){ 
               $('[data-mz-role="modal-close"]').on('click', function(e) {
                  e.preventDefault(); 
                 $('.mz-modal').fadeOut(); 
                  $('body').css('overflowY','scroll'); 
               });
                 $('[data-mz-loginpopup]').on('click',function(e){
                       //e.preventDefault(); 
                       $('body').css('overflowY','hidden');
                       $('.mz-modal').fadeIn();
                    
                    $( ".loginlink" ).trigger( "click" );
                    $('#amp-sign').trigger( "click" ); 
                    return false;   
                 });  

                
            }else{
                  
                $('[data-mz-loginpopup]').on('click', function(e) {
                        //e.preventDefault(); 
                        $('body').css('overflowY','hidden');
                        LoginModal.create();
                        
                        return true;
                        
                        
                  });

                  
               $('[data-mz-pwdassist]').on('click',function(e){
                   e.preventDefault(); 
                   $('body').css('overflowY','hidden');
                   $('.mz-popover-pwdassist').fadeIn();
               });
            }
            
            $('[data-mz-signup]').on('click', function(e) {
                e.preventDefault();
                $('.is-showing.mz-errors').hide();
                $('body').css('overflowY', 'hidden');
                var inputs = $(document).find('select, input, textarea, button, a').filter(':visible');
                $(inputs).each(function(){
                    var tbindex=$(this).attr("tabindex");
                    $(this).attr("data-index",tbindex);
                    $(this).attr("tabindex",-1);        
                });
                
                openSignup(); 
            });
            $('.icon-login').on('click', function(e) {  
                $('body').css('overflowY', 'hidden'); 
                $(".mz-mobile-logout").show();
                $("#vt-header").css('z-index', 999);
            $(".header-intro").css('z-index', 1000);
            $(".mz-ampheade").css('z-index', 1000);
            });
            $(".mz-logout-close").click(function() {
                $('.mz-mobile-logout').hide();
                
                $("body").removeClass("pop-position-mob");
                $("#vt-header").css('z-index', 999);
            $(".header-intro").css('z-index', 1000);
            $(".mz-ampheade").css('z-index', 1000);
               

            });
            

            $('.mz-column-head').on('click', function(e) {
                e.preventDefault();
                if (($(window).width()) < 767) {
                    if ($(this).hasClass('active')) {
                        $('.active').siblings('li').slideToggle("fast");
                        $('.mz-column-head').removeClass('active');
                    } else {
                        $('.active').siblings('li').slideToggle("fast");
                        $('.mz-column-head').removeClass('active');
                        $(this).addClass('active');
                        $(this).siblings('li').slideToggle("fast");
                    }
                }
            });


            if (($(window).width()) < 767) {
                $('.mz-sitenav-item-inner > .mz-sitenav-link').on('click', function(e) {
                    e.preventDefault();
                    if ($(this).parents().hasClass('mz-home-mobile-nav')) {
                        if ($(this).hasClass('mz-droparrow')) {
                            if ($(this).parent().hasClass('active')) {
                                $(this).parent().children('.mz-sitenav-sub').slideToggle("fast");
                                $(this).removeClass('mz-uparrow');
                                $(this).parent().removeClass('active');
                                $('.mz-sitenav-item-inner').removeClass('active');
                            } else {
                                $('.active').children('.mz-sitenav-sub').slideToggle("fast");
                                $('.active').children('a').removeClass('mz-uparrow');
                                $('.mz-sitenav-item-inner').removeClass('active');
                                $(this).toggleClass('mz-uparrow');
                                $(this).parent().addClass('active');
                                $(this).parent().children('.mz-sitenav-sub').slideToggle("fast");
                            }
                        } else {
                            var navlink = $(this).attr('href'),
                                httpfind = navlink.indexOf('http');
                            if (httpfind === 0) {
                                window.open(navlink, '_blank');
                            } else { 
                                window.location = navlink;
                            }
                        }
                    }
                });
                $('.mz-sitenav-item .mz-sitenav-linktitle').on('click', function(e) {
                    e.preventDefault();
                    if ($(this).parents().hasClass('mz-home-mobile-nav')) {
                        if ($(this).parent().hasClass('active')) {
                            $('.active').siblings('li').slideToggle("fast");
                            $('.mz-sitenav-item').removeClass('active');
                            $(this).removeClass('mz-minus');
                        } else {
                            $('.active').siblings('li').slideToggle("fast");
                            $('.active').find('span').removeClass('mz-minus');
                            $('.mz-sitenav-item').removeClass('active');
                            $(this).toggleClass('mz-minus');
                            $(this).parent().addClass('active');
                            $(this).parent().siblings('li').slideToggle("fast");
                        }
                    }
                });
            }

            //---------------------------Mobile Global Menu Click----------------------------------------

            $('.mz-head-menu a').on('click', function(e) {
                e.preventDefault();
                
                $('.mz-mobile-nav').toggleClass('leftside',1000, "easeOutSine");
                $('.page-main-container').toggleClass('rightside');
                $('body').toggleClass('body-left');
            });

            if (($(window).width()) < 767) {

            }
            $('.mz-bck').on('click', function(e) {
                e.preventDefault();
                $('.mz-sitenav-list').find('.mz-subnav').removeClass('mz-subactive');
                $('.mz-sitenav-list').find('.mz-sitenav-item').removeClass('mz-parentdeactive');
                $('.mz-bck').hide();
            });
            if (($(window).width()) < 767) {
                $('.mz-sitenav-item-inner > .mz-sitenav-link').on('click', function(e) {
                    e.preventDefault();
                    if ($(this).parents().hasClass('leftside')) {
                        if ($(this).hasClass('mz-droparrow')) {
                            $(this).next().addClass('mz-subactive');
                            $(this).parents('.mz-sitenav-list').children('li').addClass('mz-parentdeactive');
                            $('.mz-bck').show();
                        } else {
                            var navlink = $(this).attr('href'),
                                httpfind = navlink.indexOf('http');
                            if (httpfind === 0) {
                                window.open(navlink, '_blank');
                            } else {
                                window.location = navlink;
                            }
                        }
                    }
                });
                $('.mz-sitenav-item .mz-sitenav-linktitle').on('click', function(e) {
                    e.preventDefault();
                    if ($(this).parents().hasClass('mz-mobile-global-nav')) {

                        if ($(this).parent().hasClass('active')) {
                            $('.active').siblings('li').slideToggle("fast");
                            $('.mz-sitenav-item').removeClass('active');
                            $(this).removeClass('mz-minus');
                        } else {
                            $('.active').siblings('li').slideToggle("fast");
                            $('.active').find('span').removeClass('mz-minus');
                            $('.mz-sitenav-item').removeClass('active');
                            $(this).toggleClass('mz-minus');
                            $(this).parent().addClass('active');
                            $(this).parent().siblings('li').slideToggle("fast");
                        }
                    }

                });
            }

            //---------------------Position of arrow-------------------------------------
            $("<style type='text/css' id='dynamic' />").appendTo("head");
            $('.mz-droparrow').on('mouseenter', function(e) {
                e.preventDefault();
                var leftV = ($(this).offset().left + $(this).width() / 2) - ($('.mz-sitenav-list').offset().left);

                $("#dynamic").text(".mz-subnav-content:after{left:" + leftV + "px;}");

            });
            //------------------------MENU SLIDE DOWN EFFECT----------------------------------------------------    
       
             if (($(window).width()) > 767) {
                var makeShow = function() {
                        $(this).find('.mz-sitenav-sub').addClass('active');
                        $(this).find('.mz-sitenav-sub').slideToggle(400);
                    },
                    makeHide = function() {
                        $(this).find('.mz-sitenav-sub').removeClass('active');
                        $(this).find('.mz-sitenav-sub').hide();
                    };
                $('.mz-sitenav-item-inner:has(.mz-droparrow)').hoverIntent({
                    over: makeShow,
                    out: makeHide
                });
            }

            var passistform=$('div#mz-div-fpwd-assist');
             window.passassist = new PassAssist(passistform);

            var $theForm = $('[data-mz-login]'); 
            window.loginForm = new LoginForm($theForm);
  
             var $theguestform = $('#guestuser');
            window.loginForm = new LoginForm($theguestform);
   
            $('.custom_reset_pwd_link').click(function() {
                $('.resetpasswordlinkbtn').trigger('click');
            });

            $('a[href$=".pdf"]').each(function() { 
                $(this).prop('target', '_blank');
            });

  
            var urlpath = window.location.pathname; 
  
            if (urlpath.indexOf("/user/forgotpassword") > -1){
                var passistform1=$('form#mz-div-fpwd-assist');
                window.passassist1 = new PassAssist(passistform1);
            }    

            var urlhash = window.location.hash;
            if (urlhash.indexOf("appynow") > -1) {
                $('.mz-pro_patners .mz-affiliate_background').hide();
                $('.mz-pro_patners .mz-affiliate_section_content').hide();
                $('.mz-pro_patners .mz-affiliate_section_already_affiliate').hide();
                $('.mz-pro_patners .mz-propartenerform').fadeIn(200);
            }

            if ($(".order-date-dump")) {
                var orderDate = $(".order-date-dump").text();
                var dateSplit = orderDate.split(/["]/);
                var showDate = new Date(dateSplit[1]);
                $('.order-date').text(" " + showDate.toLocaleDateString() + " " + showDate.toLocaleTimeString());
            }

            $(".myaccount-paymentmethod #mz-labelship").text("New word");

            /** Ready End **/
            function closePopup() {
                alert('sadd');
                $('.mz-modal').hide();
                $('[data-mz-loginpopup]').removeAttr('action');
            }
/* jshint ignore:start */
            function openPopup() {
                var pageaction = $('.mz-utilitynav-link').attr('action');
                 if ((pageaction == "checkout") || (pageaction == "cart")) {   
                    $('.sectionforlogin').hide();
                    $('.sectionforcheckout').show();
                } else {
                    $('.sectionforcheckout').hide();
                    $('.sectionforlogin').show();
                }
                $('.mz-modal').fadeIn();   
                 $('input').attr('tabindex', "-1");
                     $('.mz-modal input').each(function(index, input) {
                           input.tabIndex = index + 1;
                        });
                if(require.mozuData('pagecontext').pageType === "cart" | require.mozuData('pagecontext').pageType === "checkout" ){
                    if($(window).width() < 768){
                        if($(".mz-ampheade").find(".login").find("a").attr("extraattr") !== "1"){
                            $("#guestuser").hide();
                            $(".checkoutbtns").hide(); 
                            $(".cartspecor").hide(); 
                            $(".onlyforlogin").show();     
                        }   
                    }else{
                        if($(".user-utility").find("[data-mz-loginpopup]").attr("extraattr") !== "1"){
                            $("#guestuser").hide();
                            $(".checkoutbtns").hide();  
                            $(".cartspecor").hide(); 
                            $(".onlyforlogin").show();     
                        }
                    } 
                    
                    $(".mz-btn-continue-login").first().trigger( "click" );
                }else{
                    $( ".loginlink" ).trigger( "click" );
                    $('#amp-sign').trigger( "click" );    
                }

            }
/* jshint ignore:end */
            function openSignup() {
                $('.mz-modal').fadeIn();
                if ($(this).click()) {
                    if(require.mozuData('pagecontext').pageType === "cart" | require.mozuData('pagecontext').pageType === "checkout" ){
                       $(".mz-btn-continue-sign-up").trigger( "click" );
                       $('#guestuser').hide();
                       $('.right-side-signup').show();
                       $(".checkoutbtns").hide();  
                    }else{
                        $(document).find(".mz-modal").find("#mz-login").hide();
                        $(document).find(".mz-modal").find('#mz-signup').css({'display':'inline-block'});
                    }    
                }
            }

            function validate(key) {
                var keycode = (key.which) ? key.which : key.keyCode;
                var phn = document.getElementById('mz-fquantity');
                if (!(keycode == 8 || keycode == 46) && (keycode < 48 || keycode > 57)) {
                    return false;
                } else {
                    //Condition to check textbox contains ten numbers or not
                    if (phn.value.length < 3) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }

        });
    }); 
$(document).on("click",".questions", function () {
        var tabid = $(this).attr("id");
        $(".questions").removeClass("active");
        $(this).addClass("active");
        $(".top-border").addClass("hide-container");
        $('[targetid='+tabid+']').removeClass("hide-container");
    });
    
$(document).on("click",".acc-heading", function () {
        var tabidmob = $(this).attr("id"); 
        
         $(".acc-heading").removeClass("acc-active");
        $(this).addClass("acc-active");
         $(".top-border").addClass("hide-container");
        $('[mz-targetid='+tabidmob+']').removeClass("hide-container");
    });
    

            
   
    
$(document).ready( function() {

    var userlabel = require.mozuData("user").isAnonymous;
    if(!userlabel){
        $(document).find(".customersaleprice").each(function(){
            $(this).show();
        });
    }

    $(document).on('click',".mobile-more", function(){
        
            $('#mz-drop-zone-category-page-top .mz-cms-col-4-12:nth-child(2) .mz-cms-block:last-child, #mz-drop-zone-category-page-top .mz-cms-col-4-12:last-child').slideToggle();
            $('.mobile-more span').toggleClass('changeicon');
        });

        $(document).on('click',".faq-accordion .faq-accordion-header h3", function(e){

            if( ($( window ).width()) > 767 ){

                if($(this).closest('.faq-accordion').parent().attr("class") === "left-navigation")
                {
                    $(this).closest('.faq-accordion').find('h3').removeClass('active');
                    var commonname = $(this).attr("id");
                    $(this).addClass('active');
                    $('.right-content').hide();
                    $('.faq-content').find('[data-mz-row="'+commonname+'"]').show();
                    return false;
                }
            }

            if($(this).closest('.faq-accordion-header').find('span.mz-acc-open').is(":visible"))
            {
                $(this).closest('.faq-accordion-header').find('span.mz-acc-open').hide();
                $(this).closest('.faq-accordion-header').find('span.mz-acc-icon').show();
                $(this).closest('.faq-accordion-header').next().slideUp();
            }
            else
            {
                $('.faq-accordion .faq-accordion-header span.mz-acc-open').hide();
                $('.faq-accordion .faq-accordion-header span.mz-acc-icon').show();
                $('.faq-accordion .faq-accordion-content').slideUp();
                $(this).closest('.faq-accordion-header').find('span.mz-acc-open').show(); 
                $(this).closest('.faq-accordion-header').find('span.mz-acc-icon').hide();
                $(this).closest('.faq-accordion-header').next().slideDown();

            }
        });

        $(document).on('click',".article-wrapper .accordion .article-header h3", function(e){

            if($(this).closest('.article-header').find('span.mz-acc-open').is(":visible"))
            {
                $(this).closest('.article-header').find('span.mz-acc-open').hide();
                $(this).closest('.article-header').find('span.mz-acc-icon').show();
                $(this).closest('.article-header').next().slideUp();
            }
            else
            {
                $('.article-wrapper .accordion .article-header span.mz-acc-open').hide();
                $('.article-wrapper .accordion .article-header span.mz-acc-icon').show();
                $('.article-wrapper .accordion .article-content').slideUp();
                $(this).closest('.article-header').find('span.mz-acc-open').show(); 
                $(this).closest('.article-header').find('span.mz-acc-icon').hide();
                $(this).closest('.article-header').next().slideDown();
            }
        });


        $(document).on('click',".careers-accordion .careers-accordion-header h3", function(e){

            if($(this).closest('.careers-accordion-header').find('span.mz-acc-open').is(":visible"))
            {
                $(this).closest('.careers-accordion-header').find('span.mz-acc-open').hide();
                $(this).closest('.careers-accordion-header').find('span.mz-acc-icon').show();
                $(this).closest('.careers-accordion-header').next().slideUp();
            }
            else
            {
                $('.careers-accordion .careers-accordion-header span.mz-acc-open').hide();
                $('.careers-accordion .careers-accordion-header span.mz-acc-icon').show();
                $('.careers-accordion .careers-accordion-content').slideUp();
                $(this).closest('.careers-accordion-header').find('span.mz-acc-open').show(); 
                $(this).closest('.careers-accordion-header').find('span.mz-acc-icon').hide();
                $(this).closest('.careers-accordion-header').next().slideDown();
            }
        });
        $(document).on('click',".warranty-accordion .warranty-accordion-header h3", function(e){

            if($(this).closest('.warranty-accordion-header').find('span.mz-acc-open').is(":visible"))
            {
                $(this).closest('.warranty-accordion-header').find('span.mz-acc-open').hide();
                $(this).closest('.warranty-accordion-header').find('span.mz-acc-icon').show();
                $(this).closest('.warranty-accordion-header').next().slideUp();
            }
            else
            {
                $('.warranty-accordion .warranty-accordion-header span.mz-acc-open').hide();
                $('.warranty-accordion .warranty-accordion-header span.mz-acc-icon').show();
                $('.warranty-accordion .warranty-accordion-content').slideUp();
                $(this).closest('.warranty-accordion-header').find('span.mz-acc-open').show(); 
                $(this).closest('.warranty-accordion-header').find('span.mz-acc-icon').hide();
                $(this).closest('.warranty-accordion-header').next().slideDown();
            }
        }); 
        $(document).on('click',".tech-accordion .tech-accordion-header h3", function(e){

            if($(this).closest('.tech-accordion-header').find('span.mz-acc-open').is(":visible"))
            {
                $(this).closest('.tech-accordion-header').find('span.mz-acc-open').hide();
                $(this).closest('.tech-accordion-header').find('span.mz-acc-icon').show();
                $(this).closest('.tech-accordion-header').next().slideUp();
            }
            else
            {
                $('.tech-accordion .tech-accordion-header span.mz-acc-open').hide();
                $('.tech-accordion .tech-accordion-header span.mz-acc-icon').show();
                $('.tech-accordion .tech-accordion-content').slideUp();
                $(this).closest('.tech-accordion-header').find('span.mz-acc-open').show(); 
                $(this).closest('.tech-accordion-header').find('span.mz-acc-icon').hide();
                $(this).closest('.tech-accordion-header').next().slideDown();
            }
        });
        $(document).on('click',".products-accordion .products-accordion-header h3", function(e){

            if($(this).closest('.products-accordion-header').find('span.mz-acc-open').is(":visible"))
            {
                $(this).closest('.products-accordion-header').find('span.mz-acc-open').hide();
                $(this).closest('.products-accordion-header').find('span.mz-acc-icon').show();
                $(this).closest('.products-accordion-header').next().slideUp();
            }
            else
            {
                $('.products-accordion .products-accordion-header span.mz-acc-open').hide();
                $('.products-accordion .products-accordion-header span.mz-acc-icon').show();
                $('.products-accordion .products-accordion-content').slideUp();
                $(this).closest('.products-accordion-header').find('span.mz-acc-open').show(); 
                $(this).closest('.products-accordion-header').find('span.mz-acc-icon').hide();
                $(this).closest('.products-accordion-header').next().slideDown();
            }
        });
            
            
        $(document).on('click',".index-accordion .index-accordion-header h3", function(e){
            

            if($(this).closest('.index-accordion-header').find('span.mz-acc-open').is(":visible"))
            {
                $(this).closest('.index-accordion-header').find('span.mz-acc-open').hide();
                $(this).closest('.index-accordion-header').find('span.mz-acc-icon').show();
                $(this).closest('.index-accordion-header').next().slideUp();
                $(this).removeClass('active');
            }
            else
            {
                $('.index-accordion .index-accordion-header span.mz-acc-open').hide();
                $('.index-accordion .index-accordion-header span.mz-acc-icon').show();
                $('.index-accordion .index-accordion-header h3').removeClass('active');
                $('.index-accordion .index-accordion-content').slideUp();
                $(this).closest('.index-accordion-header').find('span.mz-acc-open').show(); 
                $(this).closest('.index-accordion-header').find('span.mz-acc-icon').hide();
                $(this).closest('.index-accordion-header').next().slideDown(400,function() {  
                    var offtop = $(this).offset().top; 
                    if($(window).width() < 767)
                    {
                        $('html,body').animate({scrollTop: offtop - 135},600);
                    }
                    else
                    {
                        $('html,body').animate({scrollTop: offtop - 165},600);
                    }
                });
                $(this).addClass('active');
            }
        }); 

        var $root = $('html, body');
        $('.contact-slot1 p a:not(.mail)').click(function() {
            $root.animate({
                scrollTop: $( $.attr(this, 'href') ).offset().top - 100
            }, 1000);
            return false;
        });


    //avoid null in reset password page
    $('.mz-resetPasswWord').on('click', function(){
        if($('input.newPassword').val() === "" || $('input.confirmPassword').val() === ""){
            return false;
        }
    });
    
    // On focus disable header on mobile device for News lett er
    $('#bronto-email-subscription').on('focusout', function(){
        if($(window).width() > 420 && $(window).width() < 768)
        {
            $('header.mz-mobile.mz-pageheader').fadeIn(300);
        }
    });
        
    $('#bronto-email-subscription').on('focusin', function(){
        if($(window).width() > 420 && $(window).width() < 768)
        {
            $('header.mz-mobile.mz-pageheader').fadeOut(300);
        }
    });  


            $('.mz-searchbox-input').focus(function(){
                setTimeout(function(){$(window).scrollTop(0);},2000);
            });  
            
            $(".icon-srch").on("click", function(e){
                if(($(window).width() > 767) && ($(window).width() < 1025)){
                    e.preventDefault(); 
                   window.location.hash="popup";   
                   $('.search-site').attr("val","0");     
                   $('.mz-searchbox-input').focus();  
                   $(window).scrollTop(0);
                  } else{
                    $(this).parents(".add_search_section").find(".icon-srch").hide();
                    $(this).parents(".add_search_section").find(".add_search").show(0,function(){
                        $(this).css({'opacity':1, 'transform': "scale(1,1)"}); 
                    });
                    $(this).parents(".add_search_section").find(".add_search").find('input').focus(); 
                }
            });

            $("html").click(function(e){    
                if($(e.toElement).attr("id") === "Layer_1"){
                }else{
                    if(!$(e.toElement).hasClass("tt-input")){
                        $(document).find(".icon-srch").show();   
                        $(document).find(".add_search").hide();
                    }
                }
            });

            $(".amazon-but").on("click", function(){
                $(document).find(".preloader").show();
                $(".amazon-block").find("iframe").css("z-index","1");
            });

            if(require.mozuData('pagecontext').pageType == "checkout"){
                $(".mz-breadcrumbs").css("display","none");
            }

    $(document).on("click",".mz-productoptions-label",function(){
        var id =$(this).attr("for");
        $(".tz-cart-dialog").find("#"+id).trigger("click");
    }); 
    
   
   var $x = $("select option[value='US']");
        $x.prop("selected", "selected");
       
 
         $(document).on('click', '.mz-pagenumbers > a','.mz-pagenumbers > span','.mz-pagenumbers-number',  function(e) {
               $("html, body").animate({scrollTop: "0px"},1000);
            });
        
        if(require.mozuData('pagecontext').metaTitle=="SubmitMessage"){
            
        }
});     








