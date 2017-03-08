Ext.widget({
    xtype:'mz-form-widget',
    itemId: 'catProdT',
    id: 'catProdT',
    items: [  
        {
            fieldLabel:     "Please Choose a product type:",
            name:           "featured-brand-categories",
            xtype:          "combobox",
            width:          500,
            itemId:         "selectedCategoryId",
            displayField:   "name",
            valueField:     "id",
            queryMode:      "local",
            multiSelect:    "false",
            store: [
                [9,'Standard'],
                [2,'CustomizedProducts'] 
            ],
            listeners:{
                beforeselect : function(combo,record,index,opts) {
                    if (combo.getValue().length == 1) {
                        return false;
                    }
                },
                change: function (a,b,c) {
                    if(b !== ""){
                        this.up('#catProdT').updateProducts(b);
                    }else{
                        var filteredProducts = this.up('#catProdT').down('#filteredProducts');
                        filteredProducts.hide();  
                        filteredProducts.hidden = true;
                    }
                }
            }
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
                // meThis.updatePreview();
        }
    },
    updateProducts: function (catId) {
        console.log("selectedCategoryId")
        var k = Taco.core.data.StoreManager.getOrCreate({
                type: "Taco.store.Products",
                limit: 100
            });
        k.load({
            filters: [
                {
                    property: "productType",
                    value: catId[0]
                }
            ],
            advancedSearchs:[
                {
                    property: "productTypeId",
                    value: catId[0]
                }
            ],
            callback: function(e) {
                console.log(e);
                var filteredProducts = Ext.getCmp('catProdT').down('#filteredProducts');
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










