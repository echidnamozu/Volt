
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
            filechange: function(filelist){
                controller.up('#cardRule').handleUploadFile(filelist,controller.up('#cardRule'));
            }
        }
    },
    
    items: [
                
                {
                    xtype: 'textfield',
                    fieldLabel: 'Heading',
                    name: 'head',
                    width: 500,
                    allowBlank: false
                },
                {
                    xtype: "tacofilefield",
                    itemId: "imageUploadButton",
                    text: "Upload new image",
                    width: 500
                },
                {
                    xtype: 'textfield',
                    itemId: "imagefileid",
                    name: 'img',
                    hidden: true
                },
                {
                    xtype   : 'progressbar',
                    text    : 'Upload status',
                    id      : 'progressbar',
                    itemId  : 'progressbar',
                    width   :  '97%'
                }
    ],
    

    updatePreview: function(){},
    listeners: {
        afterrender: function (cmp) {
            
        }
    },
    handleUploadFile: function(a,cmp) {
            cmp.onUploadFile(a, this.down("#imagefileid"),this, cmp);
    },
 
    onUploadFile: function(a, ImagNameField, meThis, cmp){
            var g = meThis,
                k = /image.*/,
                b = false,
                h = [],
                kkk = 0,
                d = [];
        
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
            }
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



