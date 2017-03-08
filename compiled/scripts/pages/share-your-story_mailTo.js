define(['modules/jquery-mozu'], 
function ($) {
    $(document).ready(function(){
        $('#share-your-story-mailto').on('click',function(){
            var googleResponse  = $('#g-recaptcha-response').val(),
                adminEmailId    = $('#admin-email').val(),
                adminName    = $('#admin-name').val(),
                eMailId         = $('#mz-app-emailaddress').val(),
                firstname       = $('#mz-app-firstname').val(),
                lastname        = $('#mz-app-lastname').val(),
                location        = $('#mz-app-location').val(),
                installedBy     = $('#mz-app-installedby').val(),
                designer        = $('#mz-app-designer').val(),
                storyTitle      = $('#mz-app-storyTitle').val(),
                storyDesc       = $('#mz-app-storyDesc').val();
            if (googleResponse && $('#share-your-story-form')[0].checkValidity()) {
                var mailBody = "Email ID: "+eMailId+"\nFirst Name: "+firstname+"\nLast name: "+lastname+"\nLocation: "+location+"\nInstalled By: "+installedBy+"\nDesigned By: "+designer+"\n\nTitle of your Story: "+storyTitle+"\nDescription of your Story:\n"+storyDesc,
                    d = new Date();
                
                mailBody = encodeURIComponent("****************************************************************************\nInstructions : Please use Email client to add your attachment before sending\n****************************************************************************\n\nNew story submitted from "+adminName+" form at "+d+"\n\n"+mailBody);
                
                document.location.href = "mailto:"+adminEmailId+"?subject=Share%20Your%20Story&body="+mailBody;
            }
            else {
                if(!$('#mz-app-emailaddress')[0].checkValidity() && eMailId !== "")
                {
                    $('html,body').scrollTop(0);
                    $('#mz-app-emailaddress').css({'border-color':'red'});
                    $('.message-bar').html('Please enter valid e-mail id');
                }
                else if(eMailId === "") {  
                    $('html,body').scrollTop(0);
                    $('.message-bar').html('Please make sure all fields are filled out!');
                }
                else if(!googleResponse){
                    $('.validation-captcha').html('Please select the captcha');
                }
                else {  
                    $('html,body').scrollTop(0);
                    $('.message-bar').html('Please make sure all fields are filled out!');
                }
            }
        });
    });
});