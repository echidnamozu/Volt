define(['modules/jquery-mozu'],
    function ($) {
        // Your Client ID can be retrieved from your project in the Google
        // Developer Console, https://console.developers.google.com
        var CLIENT_ID = '649165021139-1cr4bmv2q64t2s99v2c9c7to1a9o2usm.apps.googleusercontent.com';
        var apiKey = 'AIzaSyBpa6CtWYhcTP3VvxVp7-GDyFk3vTtHcxw';
        var SCOPES = ['https://www.googleapis.com/auth/gmail.compose']; 
       
        /*** Check if current user has authorized this application.*/
        function checkAuth() {
            gapi.auth.authorize({
                'client_id': CLIENT_ID,
                'scope': SCOPES.join(' '),
                'immediate': true
            }, handleAuthResult);
        }
        /**
         * Handle response from authorization server.
         *
         * @param {Object} authResult Authorization result.
         */
        function handleAuthResult(authResult) {
            var authorizeDiv = document.getElementById('authorize-div');
            if (authResult && !authResult.error) {
                // Hide auth UI, then load client library.
                authorizeDiv.style.display = 'none';
                loadGmailApi();
            } else {
                // Show auth UI, allowing the user to initiate authorization by
                // clicking authorize button.
                authorizeDiv.style.display = 'inline';
                $('.preloader').fadeOut(300);
            }  
        }
        /**
         * Initiate auth flow in response to user clicking authorize button.
         *
         * @param {Event} event Button click event.
         */
        function handleAuthClick(event) {
            gapi.auth.authorize({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    immediate: false
                },
                handleAuthResult);
            return false;
        }
        
        /**
       * Load Gmail API client library. List labels once client library
       * is loaded.
       */
        function loadGmailApi() {
            gapi.client.load('gmail', 'v1', sendEmail);
        }
    
        function sendEmail()
        {
            var preview = document.querySelector('#hiddenImg');
            var file = document.querySelector('#attachment').files[0];
            var reader = new FileReader();

            reader.addEventListener("load", function () {
                preview.src = reader.result;
                var imgData = preview.src.split('base64,')[1];
                var receiver    = 'gunasekaran.r@echidnainc.com';
                var subject     = 'Share Your Stories - Volt Lighting';
                var mailContent = 'First Name: '+$('#mz-app-firstname').val()+'\n'+
                    'Last Name: '+$('#mz-app-lastname').val()+'\n'+
                    'Location: '+$('#mz-app-location').val()+'\n'+
                    'Designer: '+$('#mz-app-designer').val()+'\n'+
                    'Installed By: '+$('#mz-app-installedby').val()+'\n'+
                    'Title: '+$('#mz-app-storyTitle').val()+'\n'+
                    $('#mz-app-storyDesc').val()+'\n'+
                    'Note: Please find the user uploaded images in attachments'; 
                
                var message = 'Content-Type: multipart/mixed; boundary="foo_bar_baz"\n' +
                    'MIME-Version: 1.0\n' +
                    'from: '+$('#mz-app-firstname').val()+' '+$('#mz-app-firstname').val()+'\n' +
                    'to: '+receiver+'\n' +
                    'subject: '+subject+'\n\n' +

                    '--foo_bar_baz\n' +
                    'Content-Type: text/plain; charset="UTF-8"\n' +
                    'MIME-Version: 1.0\n' +
                    'Content-Transfer-Encoding: 7bit\n\n' +

                    mailContent+'\n\n' +

                    '--foo_bar_baz\n' +
                    'Content-Type: image\n' +
                    'MIME-Version: 1.0\n' +
                    'Content-Transfer-Encoding: base64\n' +
                    'Content-Disposition: attachment; filename='+file.name+'\n\n' +
                    imgData + '\n\n' +
                    '--foo_bar_baz--';
                sendMessage(message);
            }, false);
            
            if (file) {
                reader.readAsDataURL(file);
            }
        }
    
        function sendMessage(message) {
            var headers = getClientRequestHeaders();
            var path = "gmail/v1/users/me/messages/send?uploadType=multipart&key=" + CLIENT_ID;
            var base64EncodedEmail = btoa(message).replace(/\+/g, '-').replace(/\//g, '_');
            gapi.client.request({
                path: path,
                method: "POST",
                headers: headers,
                body: {
                    'raw': base64EncodedEmail
                }
            }).then(function (response) {  
                if (response.statusText === "OK") {
                    $("body,html").animate({
                        scrollTop: 0
                    }, 600, function(){
                        $('.preloader').fadeOut(300);
                        $('.application-form').html('<h3>Thank you! Your story have been shared sucessfully.</h3');
                    });
                } else {
                    $('.preloader').fadeOut(300);
                    $('.application-form').append('<span class="mz-validationmessage">Sorry, an error occurred. Please make sure all fields are filled out!</span>');
                }
            });
        }

        var t = null;
        function getClientRequestHeaders() {
            if(!t) t = gapi.auth.getToken();
            gapi.auth.setToken({token: t.access_token});
            var a = "Bearer " + t.access_token;
            return {
                "Authorization": a,
                "X-JavaScript-User-Agent": "Google APIs Explorer"
            };
        }
            /**
         * Append a pre element to the body containing the given message
         * as its text node.
         *
         * @param {string} message Text to be placed in pre element.
         */
        function appendPre(message) {
            var pre = document.getElementById('output');
            var textContent = document.createTextNode(message + '\n');
            pre.appendChild(textContent);
        }
    
    $(document).ready(function(){
        $('#uploadForm').on('submit',function(){
            checkAuth();
            $('.preloader').fadeIn(300);
            return false;
        });
        $('.authorize-button').on('click',function(){
            handleAuthClick(this);
        });
    });
    
    });