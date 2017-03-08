define(['modules/jquery-mozu', 'hyprlive', "modules/backbone-mozu", "modules/models-product", "modules/api", 'modules/models-orders','hyprlivecontext'],
    function($, Hypr, Backbone, ProductModels, Api, OrderModels,HyprLiveContext) {

        if(!Hypr.getThemeSetting('managePowerReview')) return;
        var res = Api.get('entity', {
            listName: 'mozu-powerreviews-sitesettings@mzint',
            id: Api.context.site
        });

        var merchantGroupId;  
        var merchantId;
        var siteId = '';
        var zip_location;
        var prStylesReview;
        var prMerchantStyles2;
        var locale = "en_US";
        var returnUrl;

        function writeProductListBoxes() {    
            $('.mz-productlist').append('<link rel="stylesheet" href=\"' + prStylesReview + '\" type="text/css" id="prBaseStylesheet">');
            $('.mz-productlist').append('<link rel="stylesheet" href=\"' + prMerchantStyles2 + '\" type="text/css" id="prMerchantOverrideStylesheet">');
            $('.mz-productlist').append('<link rel="stylesheet" href="/stylesheets/widgets/pr_category.css" type="text/css" id="prCategory">');
            //$('.mz-productlist').append('<link rel="stylesheet" href="/stylesheets/widgets/pr_category_styles_review_override.css" type="text/css" id="prCategoryBaseStylesheetOverride">');

            var allInlineRatings = $('.pr-inline-rating');
            var pagesize;
            if((require.mozuData("pagecontext").pageType === "search") || (require.mozuData("pagecontext").pageType === "category")) {
                if(require.mozuData("facetedproducts") === undefined){
                    pagesize = 15;  
                }else{
                    pagesize = require.mozuData("facetedproducts").pageSize;  
                }
            }else{
                pagesize = 15;  
            }
            if(!allInlineRatings.length) return;
            Api.get('entityList', {
                listName: 'mozu-powerreviews-ratings@mzint',
                filter: 'productCode  eq ' + allInlineRatings.map(function() {
                    return $(this).data('mzProductCode');
                }).get().join(' or productCode  eq '),
                pageSize : (pagesize === undefined)?15:pagesize
            }).then(function(collection) {
                // turn from array of ids into map with key
                var productsMap = collection.data.items.reduce(function(memo, item) {
                    memo[item.productCode] = item;
                    return memo;  
                }, {});
                allInlineRatings.each(function() {
                    var $this = $(this);
                    returnUrl = document.location;
                    var productCode = $this.data('mzProductCode');
                    var data = productsMap[productCode];
                    if (data) {  
                        var fullReviewCount = data.fullReviews;
                        var fullReviewCountText;
                        if (data.fullReviews > 1) {
                            fullReviewCountText = "" + data.fullReviews + " reviews";
                            num_reviews = "" + data.fullReviews + " Reviews";
                        } else if (data.fullReviews == 1) {
                            fullReviewCountText = "" + data.fullReviews + " review";
                            num_reviews = "" + data.fullReviews + " Review";
                        }
    
                        if (data.averageDecimalRating > 0 && data.merchantGrpId == merchantGroupId) {    
                            $("#PRInlineRating-" + productCode).show();
                            $("#PRInlineRating-" + productCode).find(".pr-snippet-write-review").show();
                            $("#PRInlineRating-" + productCode).find(".pr-snippet-read-reviews").show();
                            $("#PRInlineRating-" + productCode).find(".pr-snippet-write-review").find("a.pr-snippet-link").attr("href", '/write-a-review?pageId=' + productCode + '&merchantGroupId=' + merchantGroupId + '&merchantId=' + merchantId + '&siteId=' + siteId + '&zipLocation=' + zip_location + '&returlUrl=' + returnUrl);
                            $("#PRInlineRating-" + productCode).find(".pr-snippet-read-reviews").find("a.pr-snippet-link").find("#pr-snippet-read-review-count").text(fullReviewCount);
                            $("#PRInlineRating-" + productCode).find("#pr-snippet-rating-decimal").text(data.averageDecimalRating);
                            $("#PRInlineRating-" + productCode).find("#pr-snippet-review-count").text(fullReviewCountText);
                            $("#PRInlineRating-" + productCode).find("#num_review").text(num_reviews);
                            if(require.mozuData("pagecontext").pageType === "product"){  
                                $("a#writereview_snippet").attr("href", '/write-a-review?pageId=' + productCode + '&merchantGroupId=' + merchantGroupId + '&merchantId=' + merchantId + '&siteId=' + siteId + '&zipLocation=' + zip_location + '&returlUrl=' + returnUrl);
                            }
                            $("#PRInlineRating-" + productCode).find("#pdpnum_review").text(data.fullReviews);
                            $("#PRInlineRating-" + productCode).find("#pr-snippet-star-image").addClass("pr-stars").addClass("pr-stars-small").addClass("pr-stars-" + data.averageOverallRating + "-sm");
                        } else {
                            $("#PRInlineRating-" + productCode).show();
                            $("#PRInlineRating-" + productCode).find(".pr-snippet-write-first-review").show(); 
                            $("#PRInlineRating-" + productCode).find(".pr-snippet-write-first-review").find("a.pr-snippet-link").attr("href", '/write-a-review?pageId=' + productCode + '&merchantGroupId=' + merchantGroupId + '&merchantId=' + merchantId + '&siteId=' + siteId + '&zipLocation=' + zip_location + '&returlUrl=' + returnUrl);
                            $("#PRInlineRating-" + productCode).find("#pr-snippet-rating-decimal").text("0.0");
                            $("#PRInlineRating-" + productCode).find("#pr-snippet-review-count").text("No reviews");
                            $("#PRInlineRating-" + productCode).find("#num_review").text("0 Reviews");
                            if(require.mozuData("pagecontext").pageType === "product"){
                                $("a#writereview_snippet").attr("href", '/write-a-review?pageId=' + productCode + '&merchantGroupId=' + merchantGroupId + '&merchantId=' + merchantId + '&siteId=' + siteId + '&zipLocation=' + zip_location + '&returlUrl=' + returnUrl);
                            }
                            $("#PRInlineRating-" + productCode).find("#pdpnum_review").text("0");
                            $("#PRInlineRating-" + productCode).find("#pr-snippet-star-image").addClass("pr-stars").addClass("pr-stars-small").addClass("pr-stars-0_0-sm");
                        }
                    } else {
                        $("#PRInlineRating-" + productCode).show();
                        $("#PRInlineRating-" + productCode).find(".pr-snippet-write-first-review").show();
                        $("#PRInlineRating-" + productCode).find(".pr-snippet-write-first-review").find("a.pr-snippet-link").attr("href", '/write-a-review?pageId=' + productCode + '&merchantGroupId=' + merchantGroupId + '&merchantId=' + merchantId + '&siteId=' + siteId + '&zipLocation=' + zip_location + '&returlUrl=' + returnUrl);
                        $("#PRInlineRating-" + productCode).find("#pr-snippet-rating-decimal").text("0.0");
                        $("#PRInlineRating-" + productCode).find("#pr-snippet-review-count").text("No reviews");
                        if(require.mozuData("pagecontext").pageType === "product"){
                            $("a#writereview_snippet").attr("href", '/write-a-review?pageId=' + productCode + '&merchantGroupId=' + merchantGroupId + '&merchantId=' + merchantId + '&siteId=' + siteId + '&zipLocation=' + zip_location + '&returlUrl=' + returnUrl);
                        }
                        $("#PRInlineRating-" + productCode).find("#num_review").text("0 Reviews");
                        $("#PRInlineRating-" + productCode).find("#pdpnum_review").text("0");
                        $("#PRInlineRating-" + productCode).find("#pr-snippet-star-image").addClass("pr-stars").addClass("pr-stars-small").addClass("pr-stars-0_0-sm");

                    }
                });

            });

        }

        $(document).ready(function() {

            res.then(function(r) {  
                var data = r.data;
                var isWidget = $("#prProductDetail").val() == 1;
                var isROIWidget = $("#prROIWidget").val() == 1;
                var isReviewSnippet = $("#productReviewSnippet").val() == 1;
                var isSocialAnswerSnippet = $("#productSocialAnswerSnippet").val() == 1;
                var isReviewDisplay = $("#productReviewDisplay").val() == 1;
                var isSocialAnswerDisplay = $("#productSocialAnswerDisplay").val() == 1;
                var isTabEnabled = $("#reviewSocialAnswerTab").val() == 1;
                returnUrl = document.location;

                if (data.locale !== null)
                    locale = data.locale;

                merchantGroupId = data.merchantGrpId;
                merchantId = data.merchantId;

                if (data.merchantSiteId !== null) {
                    siteId = data.merchantSiteId;
                }
      
                zip_location = "/staticContent/pwr/" + merchantGroupId + "/";

                // Removed by pradeep to fix the issue on power reviews
                
               /* var prScript = zip_location + "pwr/engine/js/full.js";
                prStylesReview = zip_location + "pwr/engine/pr_styles_review.css";
                prMerchantStyles2 = zip_location + "pwr/engine/merchant_styles2.css";*/
                
                var host = HyprLiveContext.locals.siteContext.cdnPrefix,
                 prScript = host + zip_location + "pwr/engine/js/full.js?t="+Date.now();
                 prStylesReview = host + zip_location + "pwr/engine/pr_styles_review.css";
                 prMerchantStyles2 = host + zip_location + "pwr/engine/merchant_styles2.css";

                //alert(prScript);  
                // Removed by pradeep to fix the issue on power reviews
                //$.getScript(prScript).done(function(script, textStatus) { //alert(1); 
                $.ajax( { url: prScript } ).done(function(script, textStatus) {
                    var currentProduct = ProductModels.Product.fromCurrent(); //require.mozuData('product') - removed
                    if (isWidget) { 
                        //alert(2);  

                        $('head').append('<link rel="stylesheet" href=\"' + prStylesReview + '\" type="text/css" id="prBaseStylesheet">');
                        $('<script>')
                            .attr('type', 'text/javascript')
                            .text('var pr_locale=\"' + locale + '\";var pr_zip_location=\"' + zip_location + '\";')
                            .appendTo('head');
                   // alert(3);
                        if (isReviewSnippet) { console.log(currentProduct);
                            if (isTabEnabled) { 
                                POWERREVIEWS.display.snippet({
                                    write: function(content) { 
                                        $("#reviewSnippetProduct").append(content);
                                    }
                                }, {
                                      /* jshint ignore:start */
                                    pr_page_id: currentProduct.id,
                                    pr_read_review: 'javascript:activateTab(\'reviews\');',
                                    pr_write_review: '/write-a-review?pageId=' + currentProduct.id + '&merchantGroupId=' + merchantGroupId + '&merchantId=' + merchantId + '&siteId=' + siteId + '&locale=' + locale + '&returlUrl=' + returnUrl
                                     /* jshint ignore:end */
                                });
                            } else {
                                POWERREVIEWS.display.snippet({
                                    write: function(content) {
                                        $("#reviewSnippetProduct").append(content);
                                    }
                                }, {
                                    pr_page_id: currentProduct.id,
                                    pr_read_review: '#ReviewHeader',
                                    pr_write_review: '/write-a-review?pageId=' + currentProduct.id + '&merchantGroupId=' + merchantGroupId + '&merchantId=' + merchantId + '&siteId=' + siteId + '&locale=' + locale + '&returlUrl=' + returnUrl
                                });
                            }
                        }
                        if (isSocialAnswerSnippet) {
                            if (isTabEnabled) {

                                POWERREVIEWS.display.productAnswersSnippet({
                                    write: function(content) {
                                        $("#socialAnswerSnippet").append(content);
                                    }
                                }, {
                                      /* jshint ignore:start */
                                    pr_page_id: currentProduct.id,
                                    pr_ask_question: '/write-a-review?pageId=' + currentProduct.id + '&merchantGroupId=' + merchantGroupId + '&merchantId=' + merchantId + '&siteId=' + siteId + '&locale=' + locale + '&appName=askQuestion&returlUrl='+returnUrl,
                                    pr_answer_question: '/write-a-review?pageId=' + currentProduct.id + '&merchantGroupId=' + merchantGroupId + '&merchantId=' + merchantId + '&siteId=' + siteId + '&locale=' + locale + '&appName=answerQuestion&questionId=@@@QUESTION_ID@@@&returlUrl=' + returnUrl,
                                    pr_read_qa: 'javascript:activateTab(\'socialAnswer\');'
                                     /* jshint ignore:end */
                                });
                            } else {
                                POWERREVIEWS.display.productAnswersSnippet({
                                    write: function(content) {
                                        $("#socialAnswerSnippet").append(content);
                                    }
                                }, {
                                    pr_page_id: currentProduct.id,
                                    pr_ask_question: '/write-a-review?pageId=' + currentProduct.id + '&merchantGroupId=' + merchantGroupId + '&merchantId=' + merchantId + '&siteId=' + siteId + '&locale=' + locale + '&appName=askQuestion&returlUrl=' + returnUrl,
                                    pr_answer_question: '/write-a-review?pageId=' + currentProduct.id + '&merchantGroupId=' + merchantGroupId + '&merchantId=' + merchantId + '&siteId=' + siteId + '&locale=' + locale + '&appName=answerQuestion&questionId=@@@QUESTION_ID@@@&returlUrl=' + returnUrl,
                                    pr_read_qa: '#QAHeader'
                                });
                            }

                        }
                        if (isReviewDisplay || isTabEnabled) {
                            POWERREVIEWS.display.engine({
                                write: function(content) {
                                    $("#reviewDisplayProduct").append(content);
                                }
                            }, {
                                pr_page_id: currentProduct.id,
                                pr_write_review: '/write-a-review?pageId=' + currentProduct.id + '&merchantGroupId=' + merchantGroupId + '&merchantId=' + merchantId + '&siteId=' + siteId + '&locale=' + locale + '&returlUrl=' + returnUrl
                            });
                        }
                        if (isSocialAnswerDisplay || isTabEnabled) {
                            POWERREVIEWS.display.productAnswers({
                                write: function(content) {
                                    $("#socialAnswerDisplay").append(content);
                                }
                            }, {
                                pr_page_id: currentProduct.id,
                                pr_ask_question: '/write-a-review?pageId=' + currentProduct.id + '&merchantGroupId=' + merchantGroupId + '&merchantId=' + merchantId + '&siteId=' + siteId + '&locale=' + locale + '&appName=askQuestion&returlUrl=' + returnUrl,
                                pr_answer_question: '/write-a-review?pageId=' + currentProduct.id + '&merchantGroupId=' + merchantGroupId + '&merchantId=' + merchantId + '&siteId=' + siteId + '&locale=' + locale + '&appName=answerQuestion&questionId=@@@QUESTION_ID@@@&returlUrl=' + returnUrl,
                                pr_read_qa: '#QAHeader'
                            });
                        }
                    } else if (isROIWidget) {

                        var prTrackerScript = "//static.powerreviews.com/t/v1/tracker.js";
                        $.getScript(prTrackerScript).done(function(script, textStatus) {

                            var tracker = POWERREVIEWS.tracker.createTracker({
                                merchantGroupId: merchantGroupId
                            });

                            var order = OrderModels.Order.fromCurrent().attributes;
                            var customerId = "";
                            var firstName;
                            var lastName;
                            if (order.customerAccountId !== null)
                                customerId = order.customerAccountId;
                            if (order.fulfillmentInfo !== null && order.fulfillmentInfo.fulfillmentContact !== null) {
                                firstName = order.fulfillmentInfo.fulfillmentContact.firstName;
                                lastName = order.fulfillmentInfo.fulfillmentContact.lastNameOrSurname;
                            } else {
                                firstName = order.billingInfo.billingContact.firstName;
                                lastName = order.billingInfo.billingContact.lastNameOrSurname;
                            }

                            var items = [];
                            var item = {};

                            for (var i = 0; i < order.items.models.length; i++) {
                                var lineItem = order.items.models[i].attributes;
                                item.pageId = lineItem.product.attributes.productCode;
                                item.unitPrice = lineItem.total;
                                item.qty = lineItem.quantity;
                                item.name = lineItem.product.attributes.name;
                                if (lineItem.product.attributes.imageUrl !== null)
                                    item.imageURL = lineItem.product.attributes.imageUrl;
                                items[i] = item;
                            }

                            tracker.trackPageview("c", {
                                merchantId: merchantId,
                                locale: locale,
                                merchantUserId: customerId,
                                marketingOptIn: order.acceptsMarketing,
                                userEmail: order.email,
                                userFirstName: firstName,
                                userLastName: lastName,
                                orderId: order.orderNumber,
                                orderSubtotal: order.total,
                                orderNumberOfItems: items.length,
                                orderItems: items
                            });
                           // console.log("sent order data to PowerReviews");
                        })
                            .fail(function(jqxhr, settings, exception) { 
                              //  console.log(jqxhr);
                            });

                    } else {

                        writeProductListBoxes();

                    }
                })
                    .fail(function(jqxhr, settings, exception) {
                      //  console.log(jqxhr);
                    });
            });
        });

        return {
            writeProductListBoxes: function() {
                return res.then(writeProductListBoxes);     
            }
        };

    });














 

