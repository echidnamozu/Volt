
/**
 * Watches for changes to the quantity of items in the shopping cart, to update
 * cart count indicators on the storefront.
 */
define(['modules/jquery-mozu','modules/backbone-mozu','modules/models-cart', 'modules/models-product','modules/api'], 
function ($,Backbone, CartModels, ProductModels,api) {
var $cartCount,cart = new CartModels.Cart(),
        user = require.mozuData('user'),
        userId = user.userId,cartData,
        debug = require.mozuData('pagecontext'),  
        $document = $(document),
        CartMonitor = {
            setCount: function(cnt) { 
                var count = cnt, total = 0;
                var me = this;
                api.get('cartsummary').then(function(summary) { 
                    total =  summary.data.total.toFixed(2);
                    count = summary.count();
                    me.$el.text(count);
                    me.$total.text("$"+total);
                    if(savedCounts){
                        savedCounts[userId] = count;
                    }else{
                        savedCounts = {};
                        savedCounts[userId] = count;
                    }

                    $.cookie('mozucartcount', JSON.stringify(savedCounts), { path: '/' });
                });
                
            },
            addToCount: function(count) {
                this.setCount(this.getCount() + count);
            },
            getCount: function() {
                return parseInt(this.$el[0].textContent, 10) || 0;
            },
            update: function() {
                 var me=this;
                api.get('cartsummary').then(function(summary) {
                    $document.ready(function() { 
                        if(debug.isDebugMode) console.log("Cart Summary API res", summary); 
                        CartMonitor.setCount(summary.count());
                        
                    });    
                });
            }
        },  
        savedCounts,
        savedCount,
        total,
        SoftCartView = Backbone.MozuView.extend({
        templateName: "modules/common/cart-popup",
        render: function() {
            Backbone.MozuView.prototype.render.apply(this); 
        },
        getrender: function(options) {
            return this.model.fetch().then(function(res) { 
               if(options !== false) $.brontoJSON(res); //to build cart abandonment JSON value for Bronto
            });
        },  
        show: function() {
            var self = this;
            CartMonitor.update();
            api.get('cartsummary').then(function(summary) {
                self.render(summary);
                return self.getrender(true).then(function() { 
                    
                    $( ".mz-minicart" ).addClass('activeShow');
                    setTimeout(function() {
                        $( ".mz-minicart" ).removeClass('activeShow');
                    },5000);
                });  
            });
        }
     }); 
    
        try {
            
            api.get('cartsummary').then(function(summary) {
                    savedCounts = summary.count();
                    total = summary.data.total;
                    if (!savedCounts) savedCounts = {};
                    savedCount = savedCounts && savedCounts[userId];
                    if (isNaN(savedCount) || savedCount===0) { 
                        CartMonitor.update();  
                    }
            }); 
        } catch(e) {}

    
    $document.ready(function () {
        
        
            var cartView  = new SoftCartView({ el: $('[data-role="mz-softcart-trigger"]'), model: cart });
            window.cartView = cartView;
            cartView.getrender();
            CartMonitor.$el = $('[data-mz-role="cartmonitor"]').text(savedCount || 0);
            
            if(total=== undefined){
                total=0.00;
            }
                CartMonitor.$total=$(".cart-total").text("$"+ total.toFixed(2) ||0.00);    
            
            
            CartMonitor.updateCart = function() { // Function which updates cart count and mini-cart
               return cartView.show();
            };
            CartMonitor.updateBronto = function() { // Function which updates cart count and mini-cart
               return cartView.getrender();
            };
        
    });
    return CartMonitor;

});




