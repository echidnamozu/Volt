
Ext.widget({
    xtype: 'mz-form-widget',
    itemId: 'dynamicCat',
     id:'dynamicCat',
    defaults: {
        xtype: 'textfield',
        editable: false,
        listeners: {
            controller: '',
            change: function (cmp) {
                controller = cmp;
                cmp.up('#dynamicCat').updatePreview();
            },
            filechange: function(filelist,a,b){
            var trigItem=this.itemId;
            controller.up('#dynamicCat').handleUploadFile(filelist,controller.up('#dynamicCat'),trigItem);
            }
        }
    },
    
    items: [
                {
                    xtype: 'container',
                    width: '100%',
                    padding: '20 0 20 0',
                    itemId: 'preview-container', 
                    items: [
                       {
                            xtype: 'component',
                            itemId: 'preview',
                            autoEl: {
                                        html  :'<div class="accordionwidget" style="width: 97%;box-shadow: 0 -40px 80px -80px rgba(0,0,0,0.5) inset;padding: 10px;border-radius: 12px;border: 1px solid #ccc;position: relative;"><div class="row"><h2 style="text-align:center;">Preview</h2></div>'+
                                                '<div class="row"><div class="rightaccordiondiv description" style="float:right;width:40%;"><h2 class="color1">asfaqwerqwrqwerqwerqwerqwerqwer</h2><h2 class="color2">asfaqwerqwrqwerqwerqwerqwerqwer</h2><h2 class="title1">asfaqwerqwrqwerqwerqwerqwerqwer</h2><h2 class="title2">qwerqwerqwerq</h2></div>'+
                                                    '<div class="lefaccordiondiv" style="float:left;width:40%;"><img src="" alt="image1"  width="133" height="133" border="1"  class="left tile" /><img src="" width="133" height="133" border="1" alt="image2" class="imgSrcValue" /></div></div><div style="clear:both;"></div></div>'
                                    }
                        }
                    ] 
                },
                {
                    xtype: 'textfield',
                    fieldLabel: 'Link Text',
                    name: 'link_text',
                    width: '100%',
                    allowBlank: false
                },
                {
                    xtype: "tacofilefield",
                    fieldLabel: 'Image (base Image)',
                    itemId: "imageUploadButton",
                    text: "Upload image 1",
                    width: '100%'
                },
                 {  
                        xtype: "button",
                        text: "<div style='color: white'>Select Existing</div>", 
                        style: {
                            width: "150px",
                            padding: "10px 5px 3px",
                            background: "blue", 
                            color: "rgb(255,255,1)",
                            "text-decoration": "none"
                        },
                        handler:function(a,b,c,d){
                            var me =this;
                            var fileManagerAssociator = Ext.create("Taco.view.fileManager.Associator", {});
                            console.log(fileManagerAssociator.selected.items);
                            fileManagerAssociator.saveSuccess = function(selected){
                                console.log(selected);
                                for(var i=0; i<selected.length; i++){
                                    var D = selected[i];
                                    console.log(D.data.url);
                                   Ext.getCmp('dynamicCat').down("#imagefileid").setValue(D.data.url);
                                    Ext.getCmp('dynamicCat').updatePreview();  
                                    
                                }
                                fileManagerAssociator.close();
                            };
                        }
                 },
                {
                    xtype: "tacofilefield",
                    fieldLabel: 'Image (On hover Image)',
                    itemId: "UploadButton",
                    text: "Upload image 2",
                    width: '100%'
                },
                {
                        xtype: "button",
                        text: "<div style='color: white'>Select Existing</div>", 
                        style: {
                            width: "150px",
                            padding: "10px 5px 3px",
                            background: "blue", 
                            color: "rgb(255,255,1)",
                            "text-decoration": "none"
                        },
                        handler:function(a,b,c,d){
                            var me =this;
                            var fileManagerAssociator = Ext.create("Taco.view.fileManager.Associator", {});
                            console.log(fileManagerAssociator.selected.items);
                            fileManagerAssociator.saveSuccess = function(selected){
                                console.log(selected);
                                for(var i=0; i<selected.length; i++){
                                    var D = selected[i];
                                    console.log(D.data.url);
                                   Ext.getCmp('dynamicCat').down("#accrodimagefileid").setValue(D.data.url);
                                    Ext.getCmp('dynamicCat').updatePreview();  
                                    
                                }
                                fileManagerAssociator.close();
                            };
                        }
                },
                {
                    xtype: 'textfield',
                    itemId: "imagefileid",
                    name: 'img',
                    width: '100%',
                    hidden: true
                },
                {
                    xtype: 'textfield',
                    itemId: "accrodimagefileid",
                    name: 'accordimg',
                    width: '100%',
                    hidden: true
                },
                {
                    xtype: 'textfield',
                    fieldLabel: 'Link Url',
                    name: 'link_url',
                    width: '100%',
                    allowBlank: false
                },
                {
                    xtype: 'mz-input-color',
                    fieldLabel: 'String text (hover image string with color selection option)',
                    name: 'link_text_color1',
                    width: '725'
                },
                {
                    xtype: 'mz-input-color',
                    width: '725',
                    fieldLabel: 'String text (Base image string with color selection option)',
                    name: 'link_text_color2'
                },
                
    ],
    

    updatePreview: function(){
        var previewEl = this.down('#preview').getEl(),
            formValues = this.getForm().getValues(),
            newStyles = {};
        if (previewEl) {
            previewEl.dom.getElementsByClassName('color1')[0].innerHTML = "Base Text Color: <span style='height:5px;background:"+formValues.link_text_color1+";padding-left:8px;line-height:30px;box-shadow:0px 2px 5px;'>&nbsp;&nbsp;</span>"; 
            previewEl.dom.getElementsByClassName('color2')[0].innerHTML = "Hover Text Color: <span style='height:5px;background:"+formValues.link_text_color2+";padding-left:8px;line-height:30px;box-shadow:0px 2px 5px;'>&nbsp;&nbsp;</span>"; 
            previewEl.dom.getElementsByClassName('title1')[0].innerHTML = "Link Text: "+formValues.link_text; 
            previewEl.dom.getElementsByClassName('title2')[0].innerHTML = "Link Url: "+formValues.link_url; 
            previewEl.dom.getElementsByClassName('tile')[0].setAttribute('src',formValues.accordimg);
            previewEl.dom.getElementsByClassName('imgSrcValue')[0].setAttribute('src',formValues.img);
            previewEl.applyStyles(newStyles); 
        }
    },
    listeners: {
        afterrender: function (cmp) {
            var previewEl = this.down('#preview').getEl(), formValues = this.getForm().getValues();
            previewEl.dom.getElementsByClassName('imgSrcValue')[0].setAttribute('src',formValues.img);
            cmp.updatePreview();
        }
    },
    handleUploadFile: function(a,cmp,filed) {
        var datafieldd="";
        if(filed=="UploadButton"){
            datafieldd="imagefileid";
        }else{
           datafieldd="accrodimagefileid"; 
        }
            cmp.onUploadFile(a, this.down("#"+datafieldd),this.down('#preview').getEl(),this, cmp);
    },
 
    onUploadFile: function(a, ImagNameField,previewEl, meThis, cmp){
            var g = meThis,
                k = /image.*/,
                b = false,
                h = [],
                d = [];
        var Im=ImagNameField;
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
            var x = Taco.core.util.UploadManager.events.complete.listeners[0]
            x.fireFn = function(h){ 
                console.log(h.document.data.thumbnail);
                ImagNameField.setValue(h.document.data.url);
                if(Im=="imagefileid"){
                     previewEl.dom.getElementsByClassName('imgSrcValue')[0].setAttribute('src',h.document.data.thumbnail);     
                }else{
                     previewEl.dom.getElementsByClassName('tile')[0].setAttribute('src',h.document.data.thumbnail);     
                }
               
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
                        n.execute();SS
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
    }


});





















