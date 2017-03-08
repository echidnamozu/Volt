Ext.widget({
    xtype:'mz-form-widget',
    itemId: 'productandextrasproductsslider',
    id: 'productandextrasproductsslider',
    items: [
        {
            fieldLabel:     "Title of the Gallery",
            name:           "galleryTitle",
            xtype:          "textfield",
            width:          500,
            itemId:         "galleryTitleText",
            value:          "GET INSPIRED BY DESIGNS FROM VOLT<sup>&reg;</sup>",
            emptyText:      "Please provide Title of the Gallery"
        },
        {
            fieldLabel:     "Button Text for Gallery",
            name:           "ButtonText",
            xtype:          "textfield",
            width:          500,
            itemId:         "ButtonTextValue",
            value:          "VISIT PROJECT PORTFOLIO",
            emptyText:      "Please provide the Button text"
        },
        {
            fieldLabel:     "Button Link for Gallery",
            name:           "ButtonLink",
            xtype:          "textfield",
            width:          500,
            itemId:         "ButtonLinkValue",
            value:          "/c/8",
            emptyText:      "Please provide the Button link"
        },
        {
            fieldLabel:     "Please Choose a productType to load products assigned in it:",
            name:           "featured-brand-category",
            xtype:          "textfield",
            width:          500,
            itemId:         "selectedCategoryId",
            value:          "3",
            emptyText:      "Please provide the productType having the particular products"
        },
        {
            xtype: "combobox",
            name: "products",
            itemId      : "filteredProducts",
            fieldLabel: "Products to be listed",
            width: 500,
            multiSelect: true,
            displayField:   "name",
            valueField:     "id",
            emptyText: "Select Product",
            hidden      : true

        }
    ],
    
    
    listeners: {
        afterrender: function (cmp) {
            var meThis = this;
            meThis.updateProducts(Ext.getCmp('productandextrasproductsslider').down('#selectedCategoryId').value);
        }
    },
    updateProducts: function (productType) {
        console.log("selectedCategoryId");
        var k = Taco.core.data.StoreManager.getOrCreate({
                type: "Taco.store.Products",
                limit: 100
            }); 
        k.load({
            filters: [{
                property: "productType",
                value: productType
            }],
            callback: function(e) {
                var filteredProducts = Ext.getCmp('productandextrasproductsslider').down('#filteredProducts');
                var storeDataArray = [];
                for(var i =0; i < e.length; i++){
                    var obj = {};
                    obj.name = e[i].data.productName;
                    obj.id = e[i].data.productCode;
                    storeDataArray.push(obj);
                }
                var store = Ext.create('Ext.data.Store', {
                    fields: ['name', 'id'],
                    data : storeDataArray
                });
                filteredProducts.clearValue();
                filteredProducts.bindStore(store);
                filteredProducts.show();  
                filteredProducts.hidden = false;
            }
        });
    }
});





