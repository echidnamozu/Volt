define(['modules/jquery-mozu', 'hyprlive', 'underscore', "modules/api", "modules/backbone-mozu", "modules/models-product"],
    function ($, Hypr, _, api, Backbone, ProductModels, UserModels) {
        
        function getExistingNotifications() {
            return ($.cookie('mozustocknotify') || '').split(',');
        }

        function saveNotification(productCode) {
            var existing = getExistingNotifications();
            $.cookie('mozustocknotify', existing.concat(productCode).join(','), { path: '/', expires: 365 });
        }

        var user = require.mozuData('user'),
            InstockReqView = Backbone.MozuView.extend({
                templateName: 'modules/product/product-instock-request',
                clearError: function() {
                    this.setError('');
                },
                setError: function(txt) {
                    this.$('[data-mz-validationmessage-for]').text(txt);
                },
                getRenderContext: function() {
                    var context = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);
                    context.subscribed = (_.indexOf(getExistingNotifications(), (this.model.get('variationProductCode') || this.model.get('productCode'))) !== -1);
                    return context;
                },
                render: function() {
                    Backbone.MozuView.prototype.render.apply(this, arguments);
                    var inventoryInfo = this.model.get('inventoryInfo');
                    this.$el.css('display', (inventoryInfo && ("onlineStockAvailable" in inventoryInfo) && inventoryInfo.onlineStockAvailable === 0) || $('body').hasClass('mz-cms-editing') ? 'inherit' : 'none');
                    //for popUp
                    $('.mz-instock-request-popUp').on("click", function(){
                        $('body').css({
                            'overflowY': 'hidden',
                            'height': $(window).height(),
                            'position': ($(window).width()<1025?"fixed":"static"),
                            '-ms-overflow-y': "hidden"
                        });
                        $(this).siblings('.mz-modal-instockEmail').fadeIn(300);
                    });
                    $('.mz-instock-request .close-icon').on("click", function(){
                        $('body').css({
                            'overflowY': 'auto',
                            'height': 'auto',
                            'position': "static",
                            '-ms-overflow-y': "auto"
                        });
                        $(this).parents('.mz-modal-instockEmail').fadeOut(300);
                    });
                    if($('.mz-productdetail-addtocart').hasClass('mz-backorder-button'))
                    {
                        $('[data-mz-instock-request]').hide();
                    }
                },
                widgetNotifyUserAction: function () {
                    var self = this;
                    this.clearError();
                    var email = this.$('[data-mz-role="email"]').val() || user.email;
                    if (!email) {
                        this.setError(Hypr.getLabel('emailMissing'));
                        return false;
                    }
                    api.create('instockrequest', {
                        email: email,
                        customerId: user.accountId,
                        productCode: this.model.get('variationProductCode') || this.model.get('productCode'),
                        locationCode: this.model.get('inventoryInfo').onlineLocationCode
                    }).then(function () {
                        saveNotification(self.model.get('variationProductCode') || self.model.get('productCode'));
                        self.render();
                        $(body).css({
                            'overflowY': 'auto',
                            'height': 'auto',
                            'position': "static"
                        });
                        
                    }, function () {
                        self.setError(Hypr.getLabel('notifyWidgetError'));
                        $('body').css({
                            'overflowY': 'hidden',
                            'height': $(window).height(),
                            'position': ($(window).width()<1025?"fixed":"static"),
                            '-ms-overflow-y': "hidden"
                        });
                    });
                }
            });
        
        $(document).ready(function () {
            
            
            
            
            var currentProduct = ProductModels.Product.fromCurrent();

            api.on('sync', function(o) {
                if (o.type === "product") {
                    currentProduct.set(o.data);
                    currentProduct.trigger('sync', o.data);
                }
            });

            $('[data-mz-instock-request]').each(function() {
                var $this = $(this),
                    config = $this.data('mzInstockRequest'),
                    viewConfig = {
                        model: currentProduct,
                        el: $this
                    };
                if (config.template) viewConfig.template = config.template;
                (new InstockReqView(viewConfig)).render();
            });

        });

    });