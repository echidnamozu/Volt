  Ext.widget({
    xtype: 'mz-form-widget',
    itemId: 'upload',
    id: "upload",
     anchor: "100%",
     defaults: {
          xtype: 'radiogroup',
            listeners: {
                controller: '',
                meThis : this,
                
                change: function (cb,checked,a,b) {
                    controller = cb;
                    controller = cb.up('#upload');
                    
                     if (checked.framework ==  "video"){
                        controller.down('#videourl').enable(); 
                        controller.down('#imageUploadButton').disable();
                        controller.down('#imageUploadButton2').enable();
                    } else if( checked.framework ==  "image"){
                        controller.down('#imageUploadButton').enable();
                        controller.down('#videourl').disable();
                        controller.down('#imageUploadButton2').disable();
                    }
                    this.up('#upload').updatePreview();
                } ,
                 filechange: function(filelist){
                  this.up('#upload').handleUploadFile(filelist,this.up('#upload'));
                }
                
            }
            
 },
 items: [
                    {
                        xtype: 'radiogroup',
                        fieldLabel: 'Choose your favorite',
                        //arrange Radio Buttons into 2 columns
                        columns: 2,
                        id: "colorgroup",
                        itemId: 'myFavorite',
                        items: [
                    {
                        xtype: 'radiofield',
                        boxLabel: 'Video',
                        name: 'framework',
                        //checked: true,
                        inputValue: 'video',
                        id:'videoload',
                        
      
                    },
                    {
                        xtype: 'radiofield',
                        boxLabel: 'Image',
                        name: 'framework',
                        inputValue: 'image',
                        id: "image"
                    },
                   
                ]
                        
                    },
                    {
                xtype: "tacofilefield",
                itemId: "imageUploadButton",
                text: "Upload profile picture"
            },
       
                     {
                        xtype: 'textfield',
                        fieldLabel: 'Video Url',
                        name: 'title',
                        itemId:'videourl',
                        hidden: false,
                        id:'video',
                         listeners:{
                            
                            blur: function(){
                                
                                //alert(Ext.getCmp('video').getValue());
                                 var temtdata=Ext.getCmp('video').getValue(); 
                                 Ext.getCmp('hiddenfield2').setValue(temtdata)
                                 Ext.getCmp('videoload').setValue("");
                          }
                            
                        }
              
                   },
                        {
                xtype: "tacofilefield",
                itemId: "imageUploadButton2",
                text: "Upload video picture"
            },
                     {
                        xtype: 'button',
                        text : 'Save',
                        hidden:true,
                        listeners:{
                         click: function(){
                         controller.onimageupload("video",Ext.getCmp('video').getValue());
                         controller.onurlupload("url",Ext.getCmp('video').getValue());
                          }
                            
                        }
                        
                     } ,
                     {
                        xtype       : 'container',
                        width       : '100%',
                        height      : 300,
                        autoScroll  : true,
                        padding     : '20 0 20 0',
                        itemId      : 'preview-container',
                        style: {
                            background: "#EEE",
                            color: "#FFF",
                            "text-decoration": "none"
                        },
                        items: [
                            {
                                xtype: 'component',
                                itemId: 'preview',
                                autoEl: {
                                            html  : ''
                                        }
                            }
                        ]
                    },
                     
                      {
                        xtype: 'textfield',
                        name: 'hidden_field_1',
                        itemId:'hiddenfield_Id',
                        hidden: true,
                        id:'hiddenfield',
                       
                     },
                     {
                    xtype   : 'progressbar',
                    text    : 'Upload status',
                    id      : 'progressbar',
                    itemId  : 'progressbar',
                    width   :  '97%'
                },
                     {
                        xtype: 'textfield',
                        name: 'hidden_field_2',
                        itemId:'hiddenfield2_Id',
                        hidden: true,
                        id:'hiddenfield2',
                       
                     }
                ],
        handleUploadFile: function(a,cmp) {
            //alert('sdf');
            cmp.onUploadFile(a, this.down("#hiddenfield_Id"),this,cmp);
        },
        
         listeners: {
            afterrender: function (cmp) {
                this.updatePreview();
            }
        },
            onUploadFile: function(a, ImagNameField,imgpreview, meThis, cmp){
             //alert('sdf');
            var g = meThis,
                k = /image.*/,
                b = false,
                h = [],
                d = [];
        
            Ext.each(a, function(e) {
                d.push(e)
            });
            Ext.each(d, function(o) {var e, p, n;
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
                        Ext.getCmp('progressbar').updateProgress( (kkk/d.length) + (h.percentUploaded*100), kkk+'.'+h.percentUploaded*100+' out of '+d.length, true );
                    }else{
                        Ext.getCmp('progressbar').updateProgress( 1, 'Upload Compleated', true );
                    }
                }
                var x = Taco.core.util.UploadManager.events.complete.listeners[0]
                x.fireFn = function(h){ 
                     if (Ext.getCmp('videoload').getValue() ==  true){
                    meThis.onimageupload("video",h.document.data.url);
                    Ext.getCmp('video').setValue("");
                     }else{
                         meThis.onimageupload("image",h.document.data.url);
                     }
                    
                }
                e.onload = function(r) {
                    console.log(r);
                    var q;
                    if (o.type.match(k)) {
                       
                      Ext.getCmp('videoload').getValue();
                      if (Ext.getCmp('videoload').getValue() ==  true){
                          alert("video");
                       p.set("fileType", "video");
                       }else{
                           alert("image");
                           p.set("fileType", "image");
                       }
                        
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
        onimageupload: function(type, value){
            //alert(value);
            var obj =new  Object();  
            obj['type'] = type;
            obj['value'] = value;
            if(type="video"){
            obj['imgsrc']=Ext.getCmp('hiddenfield2').getValue();
             Ext.getCmp('hiddenfield2').setValue("");
            }
              
            var hider = Ext.getCmp('hiddenfield').getValue();
              if(hider === ""){
                obj.id = "0";
                Ext.getCmp('hiddenfield').setValue(JSON.stringify(obj));
              }else{
                var existingObj = JSON.parse(hider);
                if(existingObj.length){
                    obj.id = existingObj.length;
                    existingObj.push(obj);
                    Ext.getCmp('hiddenfield').setValue(JSON.stringify(existingObj));
                }else{
                    var arr = new Array();
                    arr.push(existingObj);
                    obj.id = "1";
                    arr.push(obj);
                    Ext.getCmp('hiddenfield').setValue(JSON.stringify(arr));
                }
                
            }
        },
        onurlupload: function(type,value){
          var obj2 = new Object();
          obj2['type'] = type;ale
          obj2['value'] = value;
          var hider2 = Ext.getCmp('hiddenfield2').getValue();
          Ext.getCmp('hiddenfield2').setValue(JSON.stringify(obj2));
          
        },
        updatePreview:function(){
            var formValues = this.getForm().getValues();
            if(formValues.hidden_field_1){
                var arr = JSON.parse(formValues.hidden_field_1);
                console.log("pradeep");
                this.createPreview(arr);
            }
        },
        createPreview : function(arr){
            
            var meThis = this;
            var preview = this.down('#preview');
            var el =  preview.getEl();
            
            if(el && el.dom){
                el.dom.innerHTML = "";
            }
            for(var i =0 ; i< arr.length; i++){
                
                var parent = document.createElement('DIV');
                parent.style.float = 'left';
                parent.style.margin = '5px';
                parent.style.textAlign = 'center';
                parent.style.border = "1px solid #CFC3C3";
                parent.style.padding = "5px";
                parent.style.borderRadius = "4px";
                
                
                
                var img = document.createElement('IMG');
                img.src = arr[i].value;;
                img.width = 100;
                img.height = 85;
                
                var link = document.createElement('BUTTON');
                link.innerText  = "Edit Link";
                link.setAttribute("editingItem",arr[i].id);
                link.style.background= "#CA1010";
                link.style.border= "1px solid #EEE";
                link.style.color= "#FFF";
                link.style.display= "block";
                link.style.width= "100%";
                link.style.padding= "5px 8px";
                link.onclick = function(e){
                    meThis.editValue(e.target.getAttribute("editingItem"),"link");
                };
                
                
                var title = document.createElement('BUTTON');
                title.innerText  = "Edit Title";
                title.setAttribute("editingItem",arr[i].id);
                title.style.background= "#CA1010";
                title.style.border= "1px solid #EEE";
                title.style.color= "#FFF";
                title.style.display= "block";
                title.style.width= "100%";
                title.style.padding= "5px 8px";
                title.onclick = function(e){
                    meThis.editValue(e.target.getAttribute("editingItem"),"title");
                };
                
                
                
                var remove = document.createElement('BUTTON');
                remove.innerText  = "Remove";
                remove.setAttribute("editingItem",arr[i].id);
                remove.style.background= "rgb(16, 117, 202)";
                remove.style.border= "1px solid #EEE";
                remove.style.color= "#FFF";
                remove.style.display= "block";
                remove.style.width= "100%";
                remove.style.padding= "5px 8px";
                remove.onclick = function(e){
                    meThis.editValue(e.target.getAttribute("editingItem"),"remove");
                };
                
                
                parent.appendChild(img);
                console.log("data123")
                console.log(arr[i]);
                if(arr[i].type === "video"){
                    parent.appendChild(link);    
                }
                
                parent.appendChild(title);
                parent.appendChild(remove);
                
                if(el && el.dom)
                    el.dom.appendChild(parent);
            }
        },
        editValue:function(id,type){
            var meThis = this;
            var currentValue = meThis.getCurrentItem(id);
            if(currentValue !== ''){
                if(type=="link"){
                            Ext.Msg.prompt('Edit Data', 'Please enter new position for this recipie mix:', function(btn, newVal){
                                if (btn == 'ok'){
                                   meThis.updateArrayDataWithNewValue(id,"imgsrc",newVal);
                                }
                            },this, false,currentValue?currentValue.imgsrc:'');
                }
                if(type=="title"){
                     
                    var currentValue = meThis.getCurrentItem(id);
                    Ext.Msg.prompt('Title', 'Please enter title for this slide:', function(btn, newVal){
                        if (btn == 'ok'){
                           meThis.updateArrayDataWithNewValue(id,type,newVal);
                        }
                    },this, false,currentValue[type]?currentValue[type]:'');
                }
                if(type=="remove"){
                             meThis.removeItem(id);
                 }
            }
            meThis.updatePreview();
        },
         updateArrayDataWithNewValue: function(id, type, value){ 
            // alert("id : "+id+"    type : "+type+"  value : "+value);
            var arrayData = Ext.getCmp('hiddenfield');
            if(arrayData.getValue().length > 0){
                var arr = JSON.parse(arrayData.getValue());
                for( var i = 0; i<arr.length;i++)
                    if(arr[i].id == id){
                        arr[i][type] = value;
                    }
                arrayData.setValue(JSON.stringify(arr));
            }
            this.updatePreview();
        },
           removeItem: function(id){
            var arrayDataContainer =Ext.getCmp('hiddenfield');
             //var arrayData = JSON.parse(arrayDataContainer);
            if(arrayDataContainer.getValue().length > 0){
                var arr = JSON.parse(arrayDataContainer.getValue());
                console.log(arr);
                for( var i = 0; i<arr.length;i++)
                    if(arr[i].id == id){
                        arr.splice(i,1);
                    }   
                arrayDataContainer.setValue(JSON.stringify(arr));
            }
        },
                getCurrentItem: function(id){
            var arrayData = Ext.getCmp('hiddenfield');
            if(arrayData.getValue().length > 0){
                var arr = JSON.parse(arrayData.getValue());
                for( var i = 0; i<arr.length;i++){
                    if(arr[i].id == id){
                        return arr[i];
                    }
                }
                //arrayData.setValue(arr);
            }
            return '';
        }
        
});




































