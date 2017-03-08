define(['jquery', 'underscore'], function($,_) {

  function ModalWindow(html) {
    if (typeof html !== 'undefined') this.loadWrapper(html);
    this.bindClose();
    // bind all methods specified on the prototype
    _.bindAll.apply(_, [this].concat(_.keys(proto)));
  }

  var proto;

  _.extend(ModalWindow.prototype, proto = {
    loadWrapper: function(html) {
      this.$wrapper = $(html);
    },
    open: function() {
      this.$wrapper.fadeIn(); 
      $(document).on('keyup', this.closeOnEscape);
    },
    close: function() {
      this.$wrapper.hide().remove();
      $('body').css({'overflowY': 'auto','-ms-overflow-y': "auto"});
        if(navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
            window.onscroll=function(){
                return true;
            };
        }
    },
    bindClose: function() {
      if (this.$wrapper) this.$wrapper.on('click', '[data-mz-role="modal-close"]', this.close);
    },
    closeOnEscape: function(e) {
      if (e.which === 27) {
        this.close();
        $(document).off('keyup',this.closeOnEscape);
      }
    }
  });


  return ModalWindow;
});



