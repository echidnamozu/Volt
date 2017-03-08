define([
    'modules/jquery-mozu', 
    'modules/backbone-mozu', 
    'modules/models-cart', 
    'modules/models-product'
  ], function($, Backbone, CartModels, ProductModels){
    
  var SoftCartView = Backbone.MozuView.extend({
    templateName: "modules/common/cart-popup",
    render: function() {
        var CartData = this.model.apiModel.data;
        Backbone.MozuView.prototype.render.apply(this);
  }
  });

  var SoftCartInstance = {
    update: function() {
        var self = this,cartOut = this.view.model.apiGet().then(function(res) {
            var cdata = res.data,lineItems = [];
            
        });
        return cartOut;
    }, 
    show: function() {
    var self = this;
      this.view.$el.addClass('active');
      setTimeout(function(){
         self.view.$el.removeClass('active'); 
      }, 3000); 
      
      var clickAway = function(e) {
          if (!$.contains(self.view.el, e.currentTarget)) {
            self.view.$el.removeClass('active');
            $(document.body).off('click', clickAway);
          }
        };
      $(document.body).on('click', clickAway);
    }
  };
 
  $(document).ready(function() {

    var cart      = new CartModels.Cart(),
        target    = $('[data-role="mz-softcart-trigger"]');
        var cartView  = new SoftCartView({ el: target, model: cart }),
        product   = ProductModels.Product.fromCurrent();
    
    SoftCartInstance.view = cartView;
	SoftCartInstance.update();
    cart.apiGet();
   
  });
  return SoftCartInstance;

});




