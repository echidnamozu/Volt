define(['modules/jquery-mozu', 'underscore',  'hyprlive', 'modules/api', "vendor/jquery.maskedinput.min"],
 
function($, _, Hypr, Api) {
        
    // ---------------Contractor Application Form ---------------------------------------\
   
    var ApplicationForm = function($el) {
        var self = this;
        this.$el = $el;

        this.$messageBar = this.$el.find('[data-mz-messagebar-container]');
        this. $el.on('submit', function(e) {
            e.preventDefault();
            self.appform();
            return false;
        });

        $.each(this.boundMethods, function(ix, method) {
            self[method] = $.proxy(self[method], self);
        });
 
    };
    
     var ApplicationForm1 = function($el) {
        var self = this;
        this.$el = $el;

        this.$messageBar = this.$el.find('[data-mz-messagebar-container]');
        this. $el.on('submit', function(e) {
            e.preventDefault();
            self.appform();
            return false;
        });


        this.$el.find('#phno').on("keyup",function (e) {  

               var obj=e.target;
                $(obj).val($(obj).val().replace(/[^\d-+ ]/g, "")); 

        });

        $.each(this.boundMethods, function(ix, method) {
            self[method] = $.proxy(self[method], self);
        });

    };
    
    $.extend(ApplicationForm1.prototype, {
        boundMethods: ['displayMessage', 'displayApiMessage', 'appform'],
        appform: function() {
            sctop = $('#question-form').offset().top - 140; 
            var self = this,
                data = (function(formdata) {
                            return _.object(_.pluck(formdata, 'name'), _.pluck(formdata, 'value'));
                        }(this.$el.serializeArray()));
                $('[data-mz-messagebar-container]').empty();
            if (this.validate(data)) {
               var $form=$('[data-mz-question-form]');
                var action = $form.prop('action');
                action += (action.indexOf('?') !== -1) ? "&" : "?";
                $.getJSON(action + $form.serialize() + "&callback=?").then(function(res) {
                  if (res === "OK") {
                    self.displayMessage("Thank you! Your question has been submitted successfully.","success");
                    
                    $("html, body").animate({
                        scrollTop: sctop
                    }, 600); 
                     $('input, textarea').val('');
		     $('select option:first-child').prop("selected");
                
                  } else { 
                    self.displayMessage("Sorry, an error occurred. Please make sure all fields are filled out!");
                    
                    $("html, body").animate({
                        scrollTop: sctop
                    }, 600); 
                  }
                }); 
            }
        },
        validate: function(data) {

            var datavalue,strongRegex = /^(?:([A-Z])*([a-z])*){8,12}$/,
                    emailCharsAfterSymbol, emailCharsBeforeSymbol;

            var urlreg = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            
                $('#question-form #username,#question-form #address,#question-form #emailaddress,#question-form #phno,#question-form #question').removeClass('input-required');
                $('#suggestion-form #username,#suggestion-form #emailaddress,#suggestion-form #dropdown,#suggestion-form #comments').removeClass('input-required');
                if (!data.emailaddress && !data.username && !data.address && !data.question && !data.phno ) {
                    $("html, body").animate({
                        scrollTop: sctop
                    }, 600); 
                     $('#question-form #username,#question-form #address,#question-form #emailaddress,#question-form #phno,#question-form #question').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signupall')), false;

                }
                else if (data.username.trim() === "") {
                    datavalue = data.username.substring(0, 1);
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    
                    
                    $('#question-form #username').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('suggestionusername')), false;
                 
                } 
                else if (data.address.trim() === "") { 
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);  
                    $('#question-form #address').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('suggestionaddress')), false;
                }
                else if (data.phno.trim() === "") { 
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);   
                    $('#question-form #phno').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('suggestionphno')), false;
                }
                if (data.emailaddress.length > 0) {
                    var email = data.emailaddress.split("@");

                    var re=/^(?:[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[A-Za-z0-9-]*[A-Za-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

                    if(email.length>1)
                    {
                        emailCharsAfterSymbol = email[1].length;
                        emailCharsBeforeSymbol = email[0].length;

                        if ((emailCharsAfterSymbol > 255) || (emailCharsBeforeSymbol > 64)) {
                            $('#question-form #emailaddress').addClass('input-required');
                            return this.displayMessage(Hypr.getLabel('emailLengthLimitAfterSymbol')), false;
                        }

                        if(!re.test(data.emailaddress)){
                            $("html,body").animate({
                                scrollTop: sctop
                            }, 600);
                            $('#question-form #emailaddress').addClass('input-required');
                            return this.displayMessage(Hypr.getLabel('signupemailMissing')), false;
                        }
                    }
                    else
                    {
                        $("html,body").animate({
                            scrollTop: sctop
                        }, 600);
                        $('#question-form #emailaddress').addClass('input-required');
                        return this.displayMessage(Hypr.getLabel('signupemail')), false;
                    }
                } 
                else {
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    
                    
                    $('#question-form #emailaddress').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signupemail')), false;
                }

                if (data.question.trim() === "") { 
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);   
                    $('#question-form #question').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('suggestionquestion')), false;
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

  
  
    $.extend(ApplicationForm.prototype, {
        boundMethods: ['displayMessage', 'displayApiMessage', 'appform'],
        appform: function() {
             sctop = $('#suggestion-form').offset().top - 140; 
            var self = this,
                data = (function(formdata) {
                            return _.object(_.pluck(formdata, 'name'), _.pluck(formdata, 'value'));
                        }(this.$el.serializeArray()));
                $('[data-mz-messagebar-container]').empty();
            if (this.validate(data)) {
                   var $form=$('[data-mz-suggestion-form]');
                        var action = $form.prop('action');
                        action += (action.indexOf('?') !== -1) ? "&" : "?";
                        $.getJSON(action + $form.serialize() + "&callback=?").then(function(res) {
                          if (res === "OK") {
                            self.displayMessage("Thank you! Your suggestion has been submitted successfully.","success");
                            $("html, body").animate({
                                scrollTop: sctop
                            }, 600); 
                            $('input, textarea').val('');
		     	$('select option:first-child').prop("selected");
                            
                          } else { 
                            self.displayMessage("Sorry, an error occurred. Please make sure all fields are filled out!");
                            $("html, body").animate({
                                scrollTop: sctop
                            }, 600); 
                            
                          }
                        }); 
            }
        },
        validate: function(data) {

            var datavalue,strongRegex = /^(?:([A-Z])*([a-z])*){8,12}$/,
                    emailCharsAfterSymbol, emailCharsBeforeSymbol;

                    var urlreg = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
                   
                $('#suggestion-form #username,#suggestion-form #emailaddress,#suggestion-form #dropdown,#suggestion-form #comments').removeClass('input-required');
                $('#question-form #username,#question-form #address,#question-form #emailaddress,#question-form #phno,#question-form #question').removeClass('input-required');
                if (!data.emailaddress && !data.username && !data.dropdown && !data.comments ) {
                    $("html, body").animate({
                        scrollTop: sctop
                    }, 600); 
                     $('#suggestion-form #username,#suggestion-form #emailaddress,#suggestion-form #dropdown,#suggestion-form #comments').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signupall')), false;

                }
                else if (data.username.trim() === "") {
                    datavalue = data.username.substring(0, 1);
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    
                    
                    $('#suggestion-form #username').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('suggestionusername')), false;
                 
                } 
                if (data.emailaddress.length > 0) {
                    var email = data.emailaddress.split("@");

                    var re=/^(?:[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[A-Za-z0-9-]*[A-Za-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

                    if(email.length>1)
                    {
                        emailCharsAfterSymbol = email[1].length;
                        emailCharsBeforeSymbol = email[0].length;

                        if ((emailCharsAfterSymbol > 255) || (emailCharsBeforeSymbol > 64)) {
                            $('#suggestion-form #emailaddress').addClass('input-required');
                            return this.displayMessage(Hypr.getLabel('emailLengthLimitAfterSymbol')), false;
                        }

                        if(!re.test(data.emailaddress)){
                            $("html,body").animate({
                                scrollTop: sctop
                            }, 600);
                            $('#suggestion-form #emailaddress').addClass('input-required');
                            return this.displayMessage(Hypr.getLabel('signupemailMissing')), false;
                        }
                    }
                    else
                    {
                        $("html,body").animate({
                            scrollTop: sctop
                        }, 600);
                        $('#suggestion-form #emailaddress').addClass('input-required');
                        return this.displayMessage(Hypr.getLabel('signupemail')), false;
                    }
                } 
                else {
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    
                    
                    $('#suggestion-form #emailaddress').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('signupemail')), false;
                }
                if ($('#dropdown').val() === "" || $('#dropdown').val() === "Select a subject" || $('#dropdown').find(":selected").text() === "" || $('#dropdown').find(":selected").text() === "Select a subject") {
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);
                    $('#suggestion-form #dropdown').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('suggestionsubject')), false;
                } else if (data.comments.trim() === "") { 
                    $("html,body").animate({
                        scrollTop: sctop
                    }, 600);  
                    $('#suggestion-form #comments').addClass('input-required');
                    return this.displayMessage(Hypr.getLabel('suggestioncomments')), false;
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

    $(function() {
        var form=$('[data-mz-suggestion-form]');
        window.ApplicationForm = new ApplicationForm(form);
        var form1 =$('[data-mz-question-form]');
        window.ApplicationForm1 = new ApplicationForm1(form1); 

    });
});
    





