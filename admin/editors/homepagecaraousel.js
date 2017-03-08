
    Ext.widget({
        xtype   : 'mz-form-widget',
        itemId: 'homepagecaraouselform',
        id:'homepagecaraouselform',
        anchor: "100%",
        
        defaults: {
            xtype: 'textfield',
            listeners: {
                controller: '',
                change: function (cmp) { 
                    controller = cmp;
                    cmp.up('#homepagecaraouselform').updatePreview();
                }
            }
        },
        
        
        items: [
            { 
                xtype: "panel",
                layout: 'hbox',
                anchor: '100%',
                items: [
                    {
                        xtype: "tacofilefield",
                        itemId: "imageUploadButton",
                        text: "Upload Image", 
                        listeners: {
                            filechange: function(filelist){
                                this.up('#homepagecaraouselform').handleUploadFile(filelist,this.up('#homepagecaraouselform'));
                            }
                        }
                    },
                   
                      {   
                        xtype: "button",
                        text: "<div style='color: white'>Select Existing</div>", 
                        style: {
                            width: "150px",
                            padding: "10px 5px 3px",
                            background: "rgb(223,48,24)", 
                            color: "rgb(255,255,255)",
                            "text-decoration": "none"
                        },
                        handler:function(a,b,c,d){
                            var fileManagerAssociator = Ext.create("Taco.view.fileManager.Associator", {});
                            console.log(fileManagerAssociator.selected.items);
                            fileManagerAssociator.saveSuccess = function(selected){
                                console.log(selected);
                                for(var i=0; i<selected.length; i++){
                                    var D = selected[i];
                                    console.log(D.data.url);
                                    Ext.getCmp('homepagecaraouselform').addStory(D.data.url); 
                                }
                                fileManagerAssociator.close();
                            };
                        }
                    },
                     {
                        xtype: 'progressbar',
                        text: 'Upload status',
                        id: 'progressbar',
                        itemId: 'progressbar',
                        width: 500,
                        height: 31,
                        hidden: true,
                        style: {
                            padding: '6px 0px 0px 0px' 
                        }
                    },
                ]
            }, 
            
            {
                xtype       : 'container',
                width       : '100%',
                height      : 300,
                autoScroll  : true,
                padding     : '5px',
                itemId      : 'slides-preview-container',
                style: {
                    color: '#484848',
                },
                items: [
                    {
                        xtype: 'component',
                        itemId: 'slide-preview',
                        id: 'slide-preview',
                        autoEl: {
                                    html  : '<p>No slider Images are added yet. Click on'+ 
                    '<span style="margin: 0px 8px;color: #FFF;padding:8px 15px 6px 15px;background:#DF3018;border-radius:2px;display:inline-block;">'+
                    'ADD SLIDER IMAGES</span> button above to upload images from your local system and to give more detailed options like link or video popup.</p>'
                                }
                    }
                ]
            },
            {
                xtype       : "taco-arrayField",
                name        : "data",
                itemId      : "arraydata",
                id          : "arraydata",
                width       : '97%',
                hidden      : true
            }
        ],
        
        handleUploadFile: function(a,cmp) {
            cmp.onUploadFile(a, this, cmp);
        },
        
        listeners: {
            afterrender: function (cmp) {
                this.updatePreview();
            }
        },
        updatePreview: function () {
            var formValues = this.getForm().getValues();
            console.log("Update preview");
            var arr = formValues.data;
            this.createHistoryPreview(arr);
        },
        createHistoryPreview: function(array){
            var meThis = this;
            var data;
            var preview = this.down('#slide-preview');
            var el =  preview.getEl();
            if(el && el.dom){
                el.dom.innerHTML = "";
            }
            for(index =0 ;index < array.length; index++ ){
                data = array[index];
                
                var parent = document.createElement('DIV');
                parent.style.float = 'left';
                parent.style.margin = '5px';
                parent.style.textAlign = 'center';
                parent.style.border = "1px solid #CFC3C3";
                parent.style.padding = "5px";
                parent.style.borderRadius = "4px";
                
                var order = document.createElement('SPAN');
                order.style.color = "#074e7c";
                order.style.cursor = "pointer";
                order.style.display = "block";
                order.style.border = "1px solid #CCC";
                order.style.padding = "3px";
                order.style.margin = "6px 0px";
                console.log(data.order);
                order.innerText  = data.order;
                order.setAttribute("editingItem",data.id);
                order.onclick = function(e){
                    meThis.editValue(e.target.getAttribute("editingItem"),"order",data.order);  
                };
                
                var img = document.createElement('IMG');
                img.src = data.imageUrl;
                img.width = 100;
                img.height = 85;
                
                var link = document.createElement('BUTTON');
                link.innerText  = "Edit Details";
                link.setAttribute("editingItem",data.id);
                link.style.background= "#CA1010";
                link.style.border= "1px solid #EEE";
                link.style.color= "#FFF";
                link.style.width= "100%";
                link.style.display= "block";
                link.style.padding= "5px 8px";
                link.onclick = function(e){
                    meThis.editValue(e.target.getAttribute("editingItem"),"editdetails");
                };
                
                var remove = document.createElement('BUTTON');
                remove.innerText  = "Remove";
                remove.style.width= "100%";
                remove.style.display= "block";
                remove.setAttribute("editingItem",data.id);
                remove.style.background= "rgb(16, 117, 202)";
                remove.style.border= "1px solid #EEE";
                remove.style.color= "#FFF";
                remove.style.padding= "5px 8px";
                remove.onclick = function(e){
                    meThis.editValue(e.target.getAttribute("editingItem"),"remove");
                };
                parent.appendChild(order);
                parent.appendChild(img);
                parent.appendChild(link);
                parent.appendChild(remove);
                
                if(el && el.dom)
                    el.dom.appendChild(parent);
            }
        },
        
        editValue: function(id,property,oldVal){
            var meThis = this;
            var currentValue = meThis.getCurrentItem(id);
            if(property != "remove"){
                    if(property === "editdetails"){
                        meThis.editHistoryDetails(id);
                    }else if(property === "order"){
                        Ext.Msg.prompt('Change order', 'Please enter new order number:', function(btn, newVal){
                            if (btn == 'ok'){
                                meThis.changeOrder(id,property,currentValue[property],newVal);
                            }
                        },this, false,currentValue[property]?currentValue[property]:'');
                    }
            }else{
                meThis.removeItem(id);
            }
        },
        
        onUploadFile: function(a, meThis, cmp){
            var g = meThis,
                k = /image.*/,
                b = false,
                h = [],
                d = [],
                kkk = 0;
            Ext.each(a, function(e) {
                d.push(e)
            });
            Ext.each(d, function(o) {
                var e, p, n;
                e = new FileReader();
                p = Ext.create("Taco.shared.model.File", {
                    name: o.name,
                    fileType: o.type,
                    isUploaded: false,
                    file: o
                });
                //UPLOAD PROGRESS FUNCTION
                var x = Taco.core.util.UploadManager.events.progress.listeners[1];
                x.fireFn = function(h){ 
                    kkk++;
                    if(kkk != d.length && h.percentUploaded < 1){
                        Ext.getCmp('progressbar').show();
                        Ext.getCmp('progressbar').updateProgress( (kkk/d.length) + (h.percentUploaded*100), kkk+'.'+h.percentUploaded*100+' out of 100', true );
                    }else{
                        Ext.getCmp('progressbar').updateProgress( 1, 'Upload Compleated', true );
                        Ext.getCmp('progressbar').hide();
                    }
                }
                //ON UPLOAD COMPLETE
                var y = Taco.core.util.UploadManager.events.complete.listeners[0];
                y.fireFn = function(h){
                    Ext.getCmp('progressbar').hide();
                    cmp.addStory(h.document.data.url);
                }
                //ON UPLOAD ERROR
                var z = Taco.core.util.UploadManager.events.uploaderror.listeners[0];
                z.fireFn = function(h){
                    Ext.Msg.alert('ERROR!!!', 'Error in uploading file, please try again.');
                }
                
                e.onload = function(r) {
                    var q;
                    if (o.type.match(k)) {
                        p.set("fileType", "image");
                        p.set("localthumbnail", r.target.result);
                        q = new Image();
                        q.onload = function() {
                            p.set("width", q.width);
                            p.set("height", q.height);
                            n.execute();
                        };
                        q.src = r.target.result
                    } else {
                        n.execute();
                    }
                };
                e.readAsDataURL(o);
                n = Taco.core.util.UploadManager.requestUpload({
                    document: p,
                    file: o,
                    url: "/admin/app/fileManagement/file/upload/{docid}"
                });
                h.push(p)
            });
        },
        
        addStory : function(imgURL){
            var sliderObject  = {};
            sliderObject.id = "UUID0";
            sliderObject.imageUrl = imgURL;
            sliderObject.order = 0;
            sliderObject.details = {};
            this.updateArrayData(sliderObject);
        },
        
        updateArrayData: function(sliderObject){
            var arrayData = Ext.getCmp('arraydata');
            if(arrayData.getValue().length > 0){
                var arr = arrayData.getValue();
                sliderObject.id = "UUID"+arr.length;
                sliderObject.order = arr.length;
                arr.push(sliderObject);
                arrayData.setValue(arr);
            }else{
                arrayData.setValue(sliderObject);
            }
        },
        
        
        changeOrder: function(id, property, oldVal, newVal){
            var arrayData = Ext.getCmp('arraydata');
            if(arrayData.getValue().length > 0){
                var arr = arrayData.getValue();
                var subVal=parseInt(newVal);
                if(subVal  < arr.length && subVal  > -1 ){
                    arr[oldVal][property] = subVal ;
                    arr[subVal ][property] = oldVal;
                    arr =  arr.sort(function(a,b) {return a.order - b.order});
                }else{
                    Ext.Msg.alert('SORY!', 'Please provide a order number less than the number of recipies added. Please note the order indexing is starting from zero.');
                }
                arr =  arr.sort(function(a,b) {return a.order - b.order});
                arrayData.setValue(arr);
                this.updatePreview();
            }
        },
        
        removeItem: function(id){
            var arrayData = Ext.getCmp('arraydata');
            var removedItem;
            if(arrayData.getValue().length > 0){
                var arr = arrayData.getValue();
                for( var i = 0; i<arr.length;i++){
                    if(arr[i].id === id){
                        removedItem = arr[i];
                        arr.splice(i,1);
                    }
                }
                
                for( i = removedItem.order; i<arr.length ; i++){
                    arr[i].order = i;
                }    
                
                arrayData.setValue(arr);
            }
        },
        
        getCurrentItem: function(id){
            var arrayData = Ext.getCmp('arraydata');
            if(arrayData.getValue().length > 0){
                var arr = arrayData.getValue();
                for( var i = 0; i<arr.length;i++)
                    if(arr[i].id === id){
                        return arr[i];
                    }
                arrayData.setValue(arr);
            }
            return '';
        },
        
        editHistoryDetails: function(id){
            var meThis = this;
            var currentItem = this.getCurrentItem(id);
            var saveFn = function(){
                var lineOne = detailsWindow.down('#firstLine').getValue();
                var lineTwo = detailsWindow.down('#secondLine').getValue();
                var lineThree = detailsWindow.down('#thridLine').getValue();
                var linkText = detailsWindow.down('#linkText').getValue();
                var linkUrl = detailsWindow.down('#linkUrl').getValue();
                var url = detailsWindow.down('#urlValue').getValue();
                var urlType = detailsWindow.down('#sliderLinkType').getValue();
                var color=detailsWindow.down('#textColor').value
                meThis.updateData(lineOne, lineTwo, lineThree, linkText, linkUrl, url, urlType, id,color);
                detailsWindow.close();
            };   
            var cancelFn = function(){
                detailsWindow.close();
            };
            
            if(currentItem !== ''){
                var detailsWindow = meThis.getDetailsReadingWindow(saveFn,cancelFn,currentItem);
                detailsWindow.show();
            }
        },

        getDetailsReadingWindow: function(saveFn,cancelFn,currentItem){
            console.log(currentItem);
            return Ext.create("Ext.Window",{
                title : 'Details',
                closable : true,                    
                modal : true,
                itemId : 'detailWindow',
                id: 'detailWindow',
                layout: "vbox",
                style: {
                    padding: "10px 10px",
                },
                items:[
                    {
                        xtype: 'textfield',
                        width: 500,
                        allowBlank: true,
                        itemId : 'firstLine',
                        id: 'firstLine',
                        emptyText: 'First Line on the slider',
                         maxLength: 42,
                        enforceMaxLength : true,
                        value: currentItem.details? currentItem.details.lineOne ? currentItem.details.lineOne : '': '',
                        name: 'firstLine',
                    },
                    {
                        xtype: 'textfield',
                        width: 500,
                        allowBlank: true,
                        itemId : 'secondLine',
                        id: 'secondLine',
                         maxLength: 42,
                        enforceMaxLength : true,
                        value: currentItem.details? currentItem.details.lineTwo? currentItem.details.lineTwo : '' : '',
                        emptyText: 'Second Line on the slider',
                        name: 'secondLine',
                    },
                    {
                        xtype: 'textfield',
                        width: 500,
                        allowBlank: true,
                        itemId : 'thridLine',
                        id: 'thridLine',
                         maxLength: 42,
                        enforceMaxLength : true,
                        value: currentItem.details? currentItem.details.lineThree? currentItem.details.lineThree : '':'',
                        emptyText: 'Third Line on the slider',
                        name: 'thridLine',
                    },
                    {
                        xtype: 'textfield',
                        width: 500,
                        allowBlank: true,
                        itemId : 'linkText',
                        id: 'linkText',
                         maxLength: 42,
                        enforceMaxLength : true,
                        value: currentItem.details? currentItem.details.linkText? currentItem.details.linkText : '':'',
                        emptyText: 'Link Text Here',
                        name: 'linkText',
                    },
                    {
                        xtype: 'textfield',
                        width: 500,
                        allowBlank: true,
                        itemId : 'linkUrl',
                        id: 'linkUrl',
                         maxLength: 42,
                        enforceMaxLength : true,
                        value: currentItem.details? currentItem.details.linkUrl? currentItem.details.linkUrl : '':'',
                        emptyText: 'Link URL Here',
                        name: 'linkUrl',
                    },
                    {
                        xtype: 'textfield',
                        width: 500,
                        allowBlank: true,
                        itemId : 'urlValue',
                        id: 'urlValue',
                        value: currentItem.details ? currentItem.details.url? currentItem.details.url : '':'',
                        emptyText: 'External link or Video URL',
                        name: 'urlValue',
                    },
                    {
                    xtype: "mz-input-color",
                    name: "textColor",
                    value: currentItem.details? currentItem.details.color ? currentItem.details.color : '': '',
                    itemId : 'textColor',
                        id: 'textColor',
                    fieldLabel: "Text Color"
                }, 
                    {
                        xtype:'checkbox',
                        fieldLabel:'External Link Type is Video',
                        value: currentItem.details ? currentItem.details.urlType? true : false : true,
                        itemId : 'sliderLinkType',
                        id: 'sliderLinkType',
                        name: 'sliderLinkType'  
                    }, 
                    {
                        xtype:'button',
                        text:'Save',
                        style: {
                            width: "250px",
                            padding: "10px 5px 5px",
                            background: "#8BC34A",
                            color: "#FFF",
                            "text-decoration": "none"
                        },
                        handler:function(){
                           saveFn();
                        } 
                    },
                    {
                        xtype:'button',
                        text:'Cancel',
                        style: {
                            width: "250px",
                            padding: "10px 5px 5px",
                            background: "#BDBDBD",
                            color: "#FFF",
                            "text-decoration": "none"
                        },
                        handler:function(){ 
                           cancelFn();
                        }
                    }
                    
                ]
            });
        },
          
        updateData: function(lineOne, lineTwo, lineThree, linkText, linkUrl, url, urlType, id,color){
            var meThis = this;
            var item = meThis.getCurrentItem(id);
            //console.log(item);
            var arrayDataDemo = Ext.getCmp('arraydata');
            var arrDemo = arrayDataDemo.getValue(); 
            for(var i=0;i<arrayDataDemo.getValue().length;i++){
                if(arrayDataDemo.getValue()[i].id==item.id){
                    //console.log(arrayDataDemo.getValue()[i]);
                    //console.log(item.id); 
                    //console.log(item);
                    if(arrayDataDemo.getValue()[i].details===null){
                        item.details = {};     
                    }
                    arrayDataDemo.getValue()[i].details.lineOne=lineOne;
                    arrayDataDemo.getValue()[i].details.lineTwo=lineTwo;
                    arrayDataDemo.getValue()[i].details.lineThree=lineThree;
                    arrayDataDemo.getValue()[i].details.linkText=linkText;
                    arrayDataDemo.getValue()[i].details.linkUrl=linkUrl;
                    arrayDataDemo.getValue()[i].details.url=url;
                    arrayDataDemo.getValue()[i].details.urlType=urlType;
                    arrayDataDemo.getValue()[i].details.color=color;
                } 
            }
            /*if(item !== ''){
                meThis.removeItem(id);
                
                item.details = {};
                item.details.lineOne = lineOne;
                item.details.lineTwo = lineTwo;
                item.details.lineThree = lineThree;
                item.details.url = url;
                item.details.urlType = urlType;
                item.details.color=color;
                
                var arrayData = Ext.getCmp('arraydata');
                var arr = arrayData.getValue();
                item.order = arr.length;
                arr.push(item);
                arr =  arr.sort(function(a,b) {return a.order - b.order});
                arrayData.setValue(arr);
            }*/
        }
        
        
    }); 

















