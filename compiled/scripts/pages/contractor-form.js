define(['modules/jquery-mozu', 'underscore',  'hyprlive', 'modules/api', "vendor/jquery.maskedinput.min", "pages/countries"],

function($, _, Hypr, Api) {
        
    // ---------------Contractor Application Form ---------------------------------------\
   
    var ApplicationForm = function($el) {
        var self = this;
        this.$el = $el;

        this.$messageBar = this.$el.find('[data-mz-messagebar-container]');
        
        this. $el.on('keyup', function(e) {
            var obj=e.target; 

            if($(obj).attr("id") == "mz-app-phno" || $(obj).attr("id") == "mz-app-mobno") { 

                    $(obj).val($(obj).val().replace(/[^\d-+ ]/g, ""));  
                    return false;

            }
            else if($(obj).attr("id") == "mz-app-years" ){ 
                $(obj).val($(obj).val().replace(/\D/g, ""));  
                 return false;
           }
        
        });
        this. $el.on('submit', function(e) {
            e.preventDefault();
            self.appform();
            return false;
        });

        $.each(this.boundMethods, function(ix, method) {
            self[method] = $.proxy(self[method], self);
        });

    };

    $.extend(ApplicationForm.prototype, {
        boundMethods: ['displayMessage', 'displayApiMessage', 'appform'],
        appform: function() {
            var self = this,
                data = (function(formdata) {
                            return _.object(_.pluck(formdata, 'name'), _.pluck(formdata, 'value'));
                        }(this.$el.serializeArray()));
                $('[data-mz-messagebar-container]').empty();
            if (this.validate(data)) {
                     var $form=$('[data-mz-contractor-form]');
                        var action = $form.prop('action');
                        action += (action.indexOf('?') !== -1) ? "&" : "?";
                        $.getJSON(action + $form.serialize() + "&callback=?").then(function(res) {
                          if (res === "OK") {
              
                        
                        $("html, body").animate({
                            scrollTop: sctop
                        }, 600); 
                                $form.html('<h3>Thank you! Your Request for a wholesale account has been submitted successfully .</h3');
                          } else { 
              
                        
                        $("html, body").animate({
                            scrollTop: sctop
                        }, 600); 
                            $form.append('<span class="mz-validationmessage">Sorry, an error occurred. Please make sure all fields are filled out!</span>');
                          }
                        });   
                        
                
                      
            }
        },
        validate: function(data) {
            var googleResponse = jQuery('#g-recaptcha-response').val();
            var datavalue,strongRegex = /^(?:([A-Z])*([a-z])*){8,12}$/,
                    emailCharsAfterSymbol, emailCharsBeforeSymbol;

                    var urlreg = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
                    sctop = $('#contract-form').offset().top - 140;
                $('#mz-app-emailaddress,#mz-app-firstname,#mz-app-lastname,#mz-app-address,#mz-app-city,#mz-app-zipcode,#mz-app-state,#mz-app-country,#mz-app-phno,#mz-app-website,#mz-app-years,#mz-app-installed,#mz-app-spend,#mz-app-brands,#mz-app-details,#mz-app-find').removeClass('input-required');

                if (!data.emailaddress && !data.firstname && !data.lastname && !data.address && !data.city && !data.zipcode && !data.state && !data.country && !data.phno && !data.website && !data.years && !data.installed && !data.spend && !data.brands && !data.details && !data.find) {
                    $(".mz-modal").animate({
                        scrollTop: sctop
                    }, 600);
                    
                    return this.displayMessage(Hypr.getLabel('signupall')), false;

                }
                if (data.emailaddress.length > 0) {
                    var email = data.emailaddress.split("@");

                    var re=/^(?:[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[A-Za-z0-9-]*[A-Za-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

                    if(email.length>1)
                    {
                        emailCharsAfterSymbol = email[1].length;
                        emailCharsBeforeSymbol = email[0].length;

                        if ((emailCharsAfterSymbol > 255) || (emailCharsBeforeSymbol > 64)) {
                            $('#mz-app-emailaddress').addClass('input-required');
                            return this.displayMessage(Hypr.getLabel('emailLengthLimitAfterSymbol')), false;
                        }

                        if(!re.test(data.emailaddress)){
                            $("html,body").animate({
                                scrollTop: sctop
                            }, 600);
                            $('#mz-app-emailaddress').addClass('input-required');
                            return this.displayMessage(Hypr.getLabel('signupemailMissing')), false;
                        }
                    }
                    else
                    {
                        $("html,body").animate({
                            scrollTop: sctop
                        }, 600);
                        $('#mz-app-emailaddress').addClass('input-required');
                        return this.displayMessage(Hypr.getLabel('signupemail')), false;
                    }
                } else {
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    
                    
                    $('#mz-app-emailaddress').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signupemail')), false;
                }

                if (data.firstname.trim() === "") {
                    datavalue = data.firstname.substring(0, 1);
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    
                    
                    $('#mz-app-firstname').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signupfirst')), false;
                } else if (data.lastname.trim() === "") {
                    datavalue = data.lastname.substring(0, 1);
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    
                    
                    $('#mz-app-lastname').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signuplast')), false;
                } else if (data.address.trim() === "") {
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    $('#mz-app-address').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('labeladdress')), false;
                } else if (data.city.trim() === "") {
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    $('#mz-app-city').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('labelcity')), false;
                } else if (data.zipcode.trim() === "") {
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    $('#mz-app-zipcode').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signzip')), false;
                } else if ($('#mz-app-state').val() === "" || $('#mz-app-state').val() === "Select State" || $('#mz-app-state').find(":selected").text() === "" || $('#mz-app-state').find(":selected").text() === "Select State") {
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    $('#mz-app-state').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('labelstate')), false;
                } else if ($('#mz-app-country').val() === "" || $('#mz-app-country').val() === "Select Country" || $('#mz-app-country').find(":selected").text() === "" || $('#mz-app-country').find(":selected").text() === "Select Country") {
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    $('#mz-app-country').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('labelcountry')), false;
                } else if (data.phno.trim() === "") {
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    $('#mz-app-phno').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signuphone')), false;
                } else if (data.website.trim() === "") {
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    $('#mz-app-website').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('labelwebsite')), false;
                } else if(!urlreg.test(data.website)){
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    $('#mz-app-website').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('labelvalidwebsite')), false;
                } else if (data.years.trim() === "") {
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    $('#mz-app-years').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signyearsbusiness')), false;
                } else if (data.installed.trim() === "") {
                   $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    $('#mz-app-installed').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signupinstall')), false;
                } else if (data.spend.trim() === "") {
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    $('#mz-app-spend').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signupspendperyear')), false;
                } else if (data.brands.trim() === "") {
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    $('#mz-app-brands').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signupcurrentbrands')), false;
                } else if (data.details.trim() === "") {
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    $('#mz-app-details').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signupcurrentpurchase')), false;
                } else if (data.find.trim() === "") {
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    $('#mz-app-find').addClass('input-required');   
                    return this.displayMessage(Hypr.getLabel('companyinfo')), false;
                }
                else if (!googleResponse) {
                     $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    return this.displayMessage(Hypr.getLabel('captcha')), false;
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
        messageTemplate: Hypr.getTemplate('modules/common/message-bar')
    });

    $(function() {
      

        // populate country dropdown

        populateCountries("mz-app-country", "mz-app-state");
        $("#mz-app-country").val('United States of America');

        // populate state dropdown for country USA

        populateStates("mz-app-country", "mz-app-state", 239);

        // Allow only Alphanumeric

        $('#mz-app-zipcode, #mz-app-years').bind('keypress', function (event) {
            var regex = new RegExp("^[a-zA-Z0-9]+$");
            var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
            if (!regex.test(key)) {
               event.preventDefault();
               return false;
            }
        });
        
        var userinfo= require.mozuData('user');
            if(!userinfo.isAnonymous){
                //var requestConfigure = {"url":"https://t16137-s24000.sandbox.mozu.com/api/commerce/customer/accounts/"+userinfo.accountId,"iframeTransportUrl":"https://t16137-s24000.sandbox.mozu.com/receiver?receiverVersion=2"};
                var dataobj={};
                dataobj.id=userinfo.accountId;
                Api.get("customer",dataobj).then(function(res){
                    console.log(res); 
                    var company=res.data.companyOrOrganization;
                    var contacts= res.contacts;
                    $("#mz-app-company").val(company);
                   var primaryaddress=(_.find(res.data.contacts, function(item) {
                        if(item.types.length > 0){ 
                            for(var i=0;i<item.types.length;i++){ 
                                if(item.types[i].name == "Billing" && item.types[i].isPrimary ){ 
                                        return item;
                                }
                                      
                            }
                                
                        }
                    }));
                    if(primaryaddress){
                        var address1=primaryaddress.address.address1;
                        if(address1){
                            $("#mz-app-address").val(address1);
                        }
                        console.log("address1=>"+address1);
                        var address2=primaryaddress.address.address2; 
                        if(address2){
                            $("#mz-app-addressl2").val(address2);
                        }
                        console.log("address2=>"+address2);
                        var city=primaryaddress.address.cityOrTown;
                        console.log("city=>"+city);
                        if(city){
                            $("#mz-app-city").val(city);
                        }
                        var postalOrZipCode=primaryaddress.address.postalOrZipCode;
                        console.log("postalOrZipCode=>"+postalOrZipCode);
                        if(postalOrZipCode){
                            $("#mz-app-zipcode").val(postalOrZipCode);
                        }
                        var countryCode=primaryaddress.address.countryCode;
                        console.log("countryCode=>"+countryCode);
                        if(countryCode){
                            var country= Hypr.getThemeSetting('checkcountryLst');
                            var countrytext=(_.find(country, function(item) {
                                return item.value==countryCode;
                            }));
                            console.log(countrytext.key); 
                            if(countryCode=="US"){
                                countrytext.key="United States of America";
                            }
                            if(countrytext.key){
                                $("#mz-app-country").val(countrytext.key); 
                            }
                            //$("#mz-app-country").val(countryCode);
                        }
                        var stateOrProvince=primaryaddress.address.stateOrProvince;
                        console.log("stateOrProvince=>"+stateOrProvince);
                         if(stateOrProvince){ 
                            var states= Hypr.getThemeSetting('usStates');
                            var statetext=(_.find(states, function(item) {
                                return item.abbreviation==stateOrProvince;
                            }));    
                            if(statetext){
                                if(statetext.name){
                                    $("#mz-app-state").val(statetext.name);
                                }
                            }    
                            else{
                                states= Hypr.getThemeSetting('caStates');
                                statetext=(_.find(states, function(item) {
                                    return item.abbreviation==stateOrProvince;
                                 }));
                                    if(statetext && statetext.name){
                                        $("#mz-app-state").val(statetext.name);
                                    }    
                                } 
                                
                            }
                        var mobile=primaryaddress.phoneNumbers.mobile;
                        console.log("mobile=>"+mobile);
                        if(mobile && mobile!="N/A"){
                            $("#mz-app-mobno").val(mobile); 
                        }
                        
                        var home=primaryaddress.phoneNumbers.home;
                        console.log("home=>"+home);
                         if(home && home!="N/A"){
                            $("#mz-app-phno").val(home); 
                        }
                        
                    }
                    
                });
                
             /*   Api.request('get',requestConfigure).then(function(response){
                    console.log(response);
                });*/
                
            } 
        

        var form=$('[data-mz-contractor-form]');
        window.ApplicationForm = new ApplicationForm(form);


    });
});
    








