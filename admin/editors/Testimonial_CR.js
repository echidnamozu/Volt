
Ext.widget({
    xtype: 'mz-form-widget',
    itemId: 'cardRule',
    
    defaults: {
        xtype: 'textfield',
        editable: false,
        listeners: {
            controller: '',
            change: function (cmp) {
                controller = cmp;
                cmp.up('#cardRule').updatePreview();
            },
            filechange: function(filelist,a,b){
            var trigItem=this.itemId;
            controller.up('#cardRule').handleUploadFile(filelist,controller.up('#cardRule'),trigItem);
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
                                        html  :'<div class="accordionwidget" style="width: 97%;box-shadow: 0 -40px 80px -80px rgba(0,0,0,0.5) inset;padding:10px 10px 20px 10px;border-radius: 12px;border: 1px solid #ccc;position: relative;"><div class="row"><h2 style="text-align:center;padding:5px 0 20px 0;">Preview</h2>'+
                                        '<div style="clear:both;"></div></div>'+
                                        '<div class="row"><div class="rightaccordiondiv" style="float:right;width:78%;"><div><h3 class="name" style="display:inline-block;padding: 0 0 20px 0;vertical-align: top;">Name</h3></div><div><h3 class="heading" style="display:inline-block;padding: 0 0 10px 0;vertical-align: top;">Heading</h3></div><span class="description">{{model.config.content|safe}}</span></div>'+
                                        '<div class="lefaccordiondiv" style="float:left;width:20%;">'+
                                        '<img src="" width="133" height="133" border="1" alt="product" class="imgSrcValue" /></div></div><div style="clear:both;"></div></div>'
                                    }
                        }
                    ] 
                },
                {
                    xtype: "tacofilefield",
                    itemId: "imageUploadButton",
                    text: "Upload new image",
                    width: 500
                },
                {
                    xtype: 'textfield',
                    fieldLabel: 'Name of the person',
                    name: 'name',
                    width: 500,
                    allowBlank: false
                },

                {
                    xtype: 'textfield',
                    fieldLabel: 'Heading',
                    name: 'head',
                    width: 500,
                    allowBlank: false
                },
                {
                    xtype: 'mz-input-textarea',
                    fieldLabel: 'Description',
                    name: 'content',
                    width: 600,
                    height: 300,
                    allowBlank: false
                }, 
                {
                    xtype: 'textfield',
                    itemId: "imagefileid",
                    name: 'img',
                    hidden: true
                },
                {
                    xtype: 'textfield',
                    itemId: "accrodimagefileid",
                    name: 'accordimg',
                    hidden: true
                },
				{
                    xtype: 'textfield',
                    fieldLabel: 'See More Link',
                    name: 'link',
                    width: 500
                }
    ],
    

    updatePreview: function(){
        var previewEl = this.down('#preview').getEl(),
            formValues = this.getForm().getValues(),
            newStyles = {};
        if (previewEl) {
            previewEl.dom.getElementsByClassName('heading')[0].innerHTML = formValues.head;
            previewEl.dom.getElementsByClassName('heading')[0].style.color = formValues.headColor;
            previewEl.dom.getElementsByClassName('name')[0].innerHTML = formValues.name; 
            //previewEl.dom.getElementsByClassName('title1')[0].innerHTML = formValues.title1; 
            //previewEl.dom.getElementsByClassName('title2')[0].innerHTML = formValues.title2; 
            //previewEl.dom.getElementsByClassName('imiageLInk')[0].setAttribute('href',formValues.link);
           // if(formValues.img == "1079.jpg"){
                previewEl.dom.getElementsByClassName('imgSrcValue')[0].setAttribute('src',formValues.img);
            //}
            previewEl.dom.getElementsByClassName('description')[0].innerHTML = formValues.content;
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
        if(filed=="imageUploadButton"){
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


















