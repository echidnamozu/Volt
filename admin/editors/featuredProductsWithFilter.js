var IS_LOADED = false;
Ext.widget({
    xtype:'mz-form-widget',
    itemId: 'catProd',
    id: 'catProd',
    items: [
        {
            fieldLabel:     "Please Choose a Category to load products assigned in it:",
            name:           "featured-brand-categories",
            xtype:          "boxselect",
            width:          500,
            itemId:         "selectedCategoryId",
            displayField:   "name",
            valueField:     "id",
            queryMode:      "local",
            multiSelect:    "false",
            store:{
                type: "Taco.store.Categories" 
            },
            listeners:{
                beforeselect : function(combo,record,index,opts) {
                    if (combo.getValue().length == 1) {
                        return false;
                    }
                },
                change: function (a,b,c) {
                    if(b !== ""){
                        this.up('#catProd').updateProducts(b);
                    }else{
                        var filteredProducts = this.up('#catProd').down('#filteredProducts');
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
        console.log("selectedCategoryId" + IS_LOADED);
        var filteredProducts = Ext.getCmp('catProd').down('#filteredProducts');
        var meThis = this;
        var formValues = meThis.getForm().getValues();
        console.log(formValues);
        
        console.log("Load Data");
            var k = Taco.core.data.StoreManager.getOrCreate({
                    type: "Taco.store.Products",
                    limit: 100
                });
            k.load({
                filters: [{
                    property: "categoryId",
                    value: catId
                }],
                callback: function(e) {
                    
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
                    
                    console.log(filteredProducts);
                    
                    if(!IS_LOADED){
                        IS_LOADED = true;
                        if(formValues.products.length > 0){
                            for( i = 0; i < formValues.products.length ; i++){
                                
                                var id  = formValues.products[i];
                                var arrDatas = filteredProducts.getValue();
                                for(j=0;j<filteredProducts.store.data.items.length; j++){
                                    
                                    if(id === filteredProducts.store.data.items[j].internalId){
                                        var xxx = store.getAt(j).get(filteredProducts.valueField);
                                        arrDatas.push(xxx);
                                        filteredProducts.setValue(arrDatas);
                                    }
                                }
                            }
                            
                        }
                    }
                }
            });
        
    }
});




