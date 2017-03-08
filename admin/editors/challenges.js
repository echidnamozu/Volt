 Ext.widget({
     xtype: 'mz-form-widget',
     itemId: 'hrRuleForms', 
     id: 'hrRuleForms',
     defaults:
         {
         xtype: 'combobox',
         editable: false,
         listeners: {
             change: function(cmp) {
                 cmp.up('#hrRuleForms').updatePreview();
             }

         }
         },

     items: [{
             xtype: 'radiogroup', 
             fieldLabel: 'Challenge Type',
             defaults: {
                 name: 'hrBorderStyle'
             },
             items: [{
                 inputValue: 'single',
                 boxLabel: 'Single Competitor'
             }, {
                 inputValue: 'double',
                 boxLabel: 'Two Competitors'
             }]
         }, 

         {
             xtype: "tabpanel",
             itemId: "hotspoteditingoptions",
             width: 532,
             activeTab: 0,
             hidden:true,
             items: [{
                     xtype: 'container',
                     itemId: 'voltproduct',
                     id: 'voltproduct',
                     title: 'Volt Product',
                     style: {
                         padding: "15px",
                         background: "#FFF"
                     },
                     items: [{
                         xtype: 'textfield',
                         fieldLabel: 'Volt Heading',
                         name: 'voltheading',
                         id: "voltheading",
                         width: 500,
                         allowBlank: true
                     }, {
                         xtype: "htmleditor",
                         width: 500,
                         height: 200,
                         name: "voltdescription",
                         id: "voltdescription",
                         allowBlank: false,
                         fieldLabel: "Description "
                     },{
                          xtype: "htmleditor",
                         width: 500,
                         height: 200,  
                         name: "voltsummary",
                         id: "voltsummary",
                         allowBlank: false,
                         fieldLabel: "summary "
                     },
                     {
                         xtype: "tacofilefield",
                         fieldLabel: 'Image (base Image)',
                         itemId: "imageUploadButton",
                         text: "Upload image 1",
                         width: '100%',
                         listeners: {
                             filechange: function(filelist, a, b) {
                                 //alert(1); 
                                 console.log(1);
                                 var trigItem = this.itemId; 
                                 Ext.getCmp('hrRuleForms').handleUploadFile(filelist,Ext.getCmp('hrRuleForms'),trigItem);
                             }
                         }
                     }, {
                         xtype: "button",
                         text: "<div style='color: white'>Select Existing</div>",
                         style: {
                             width: "150px",
                             padding: "10px 5px 3px",
                             background: "blue",
                             color: "rgb(255,255,1)",
                             "text-decoration": "none"
                         },
                         handler: function(a, b, c, d) {
                             var me = this;
                             var fileManagerAssociator = Ext.create("Taco.view.fileManager.Associator", {});
                             console.log(fileManagerAssociator.selected.items);
                             fileManagerAssociator.saveSuccess = function(selected) {
                                 console.log(selected);
                                 for (var i = 0; i < selected.length; i++) {
                                     var D = selected[i];
                                     console.log(D.data.url);
                                     Ext.getCmp('hrRuleForms').down("#voltimagefileid").setValue(D.data.url);
                                     Ext.getCmp('hrRuleForms').updatePreview();

                                 }
                                 fileManagerAssociator.close();
                             };
                         }
                     }, 
                     {
                         xtype:'button',
                         text:'Save',
                           style: {
                                width: "250px",
                                padding: "10px 5px 5px",
                                background: "#2ecc71",
                                color: "#FFF",
                                "text-decoration": "none"
                            },
                         handler: function(a, b, c, d) {
                             Ext.getCmp('hrRuleForms').updatePreview();
                         }
                        },
                      
                     {
                         xtype: 'textfield',
                         itemId: "voltimagefileid",
                         name: 'voltimg',
                         width: '100%',
                         hidden: true
                     }]
                 }, { 

                     xtype: 'container',
                     itemId: 'competitor1',
                     title: 'competitor1',
                     style: {
                         padding: "15px",
                         background: "#FFF"
                     },
                     items: [

                         {
                             xtype: 'textfield',
                             fieldLabel: 'Competitor1 Heading',
                             name: 'Competitor1heading',
                             id: "Competitor1heading",
                             width: 500,
                             allowBlank: true
                         }, {
                             xtype: "htmleditor",
                             width: 500,
                             height: 200,
                             name: "Competitor1description",
                             id: "Competitor1description",
                             allowBlank: false,
                             fieldLabel: "Description "
                         }, {
                             xtype: "tacofilefield",
                             fieldLabel: 'Image (base Image)',
                             itemId: "Competitor1imageUploadButton",
                             text: "Competitor1 Upload image 1",
                             width: '100%',
                             listeners: {
                                 filechange: function(filelist, a, b) {
                                     //alert(1); 
                                     var trigItem = this.itemId;
                                     Ext.getCmp('hrRuleForms').handleUploadFile(filelist,Ext.getCmp('hrRuleForms'),trigItem);
                                 }
                             }
                         }, {
                             xtype: "button",
                             text: "<div style='color: white'>Select Existing</div>",
                             style: {
                                 width: "150px",
                                 padding: "10px 5px 3px",
                                 background: "blue",
                                 color: "rgb(255,255,1)",
                                 "text-decoration": "none"
                             },
                             handler: function(a, b, c, d) {
                                 var me = this;
                                 var fileManagerAssociator = Ext.create("Taco.view.fileManager.Associator", {});
                                 console.log(fileManagerAssociator.selected.items);
                                 fileManagerAssociator.saveSuccess = function(selected) {
                                     console.log(selected);
                                     for (var i = 0; i < selected.length; i++) {
                                         var D = selected[i];
                                         console.log(D.data.url);
                                         Ext.getCmp('hrRuleForms').down("#Competitor1imagefileid").setValue(D.data.url);
                                         Ext.getCmp('hrRuleForms').updatePreview();

                                     }
                                     fileManagerAssociator.close();
                                 };
                             }
                         }, {
                             xtype: 'textfield',
                             itemId: "Competitor1imagefileid",
                             name: 'Competitor1img',
                             width: '100%',
                             hidden: true
                         }

                     ]

                 }, {


                     xtype: 'container',
                     itemId: 'competitor2',
                     title: 'competitor2',
                     style: {
                         padding: "15px",
                         background: "#FFF"
                     },
                     items: [

                         {
                             xtype: 'textfield',
                             fieldLabel: 'Competitor2 Heading',
                             name: 'Competitor2heading',
                             id: "Competitor2heading",
                             width: 500,
                             allowBlank: true
                         }, {
                             xtype: "htmleditor",
                             width: 500,
                             height: 200,
                             name: "Competitor2description",
                             id: "Competitor2description",
                             allowBlank: false,
                             fieldLabel: "Description "
                         }, {
                             xtype: "tacofilefield",
                             fieldLabel: 'Image (base Image)',
                             itemId: "Competitor2imageUploadButton",
                             text: "Competitor2 Upload image 1",
                             width: '100%',
                             listeners: {
                                 filechange: function(filelist, a, b) {
                                     //alert(1);
                                     var trigItem = this.itemId;
                                  Ext.getCmp('hrRuleForms').handleUploadFile(filelist,Ext.getCmp('hrRuleForms'),trigItem);
                                 }
                             }
                         }, {
                             xtype: "button",
                             text: "<div style='color: white'>Select Existing</div>",
                             style: {
                                 width: "150px",
                                 padding: "10px 5px 3px",
                                 background: "blue",
                                 color: "rgb(255,255,1)",
                                 "text-decoration": "none"
                             },
                             handler: function(a, b, c, d) {
                                 var me = this;
                                 var fileManagerAssociator = Ext.create("Taco.view.fileManager.Associator", {});
                                 console.log(fileManagerAssociator.selected.items);
                                 fileManagerAssociator.saveSuccess = function(selected) {
                                     console.log(selected);
                                     for (var i = 0; i < selected.length; i++) {
                                         var D = selected[i];
                                         console.log(D.data.url);
                                         Ext.getCmp('hrRuleForms').down("#Competitor2imagefileid").setValue(D.data.url);
                                         Ext.getCmp('hrRuleForms').updatePreview();

                                     }
                                     fileManagerAssociator.close();  
                                 };
                             }
                         }, {
                             xtype: 'textfield',
                             itemId: "Competitor2imagefileid",
                             name: 'competitor2img',
                             width: '100%',
                             hidden: true
                         }

                     ]


                 }

             ]

         },
         {
                        xtype: 'progressbar',
                        text: 'Upload status',
                        id: 'voltprogressbar',
                        itemId: 'voltprogressbar',
                        width: 500,
                        height: 31,
                        hidden: true,
                        style: {
                            padding: '6px 0px 0px 0px' 
                        }
                    },
     ],


     listeners: {
         afterrender: function(cmp) {
             //var previewEl = this.down('#preview').getEl(),
               var  formValues = this.getForm().getValues();
             //previewEl.dom.getElementsByClassName('imgSrcValue')[0].setAttribute('src',formValues.img);
             cmp.updatePreview();
         }
     },


     updatePreview: function() {
        // var previewEl = this.down('#preview').getEl(),
             var formValues = this.getForm().getValues(),
             newStyles = {};
         console.log(formValues);
          
         if (formValues.hrBorderStyle == "single") { 
             var el = this.down("#hotspoteditingoptions");
             this.down("#hotspoteditingoptions").setVisible(true);
             el.items.getAt(2).setDisabled(true);
             //   newStyles['border-style'] = formValues.hrBorderStyle;


             // previewEl.applyStyles(newStyles); 
         } else if (formValues.hrBorderStyle == "double") {
             var el = this.down("#hotspoteditingoptions");
             this.down("#hotspoteditingoptions").setVisible(true);
             el.items.getAt(2).setDisabled(false);
             //el.items.getAt(1).setVisible(false);
             //el.items.getAt(0).setVisible(false);
             //el.items.getAt(1).setVisible(false);
             //this.down("#onecompetitor").setVisible(true);
             //Ext.getCmp("onecompetitor").css("display","none");
         }
     },
     handleUploadFile: function(a, cmp, filed) {
         var datafieldd = "";
         if (filed == "imageUploadButton") { 
             datafieldd = "voltimagefileid";
         }else if(filed=='Competitor1imageUploadButton'){
             datafieldd="competitor1imagefileid"; 
         }
         else {
             datafieldd = "competitor2imagefileid";
         }
         cmp.onUploadFile(a, this.down("#" + datafieldd), this, cmp);
     },

     onUploadFile: function(a, ImagNameField, meThis, cmp) {
         var g = meThis,
             k = /image.*/,
             b = false,
             h = [],
             d = [],
              kkk = 0;
         var Im = ImagNameField;
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
                var y = Taco.core.util.UploadManager.events.progress.listeners[1];
                y.fireFn = function(h){ 
                    kkk++;
                    if(kkk != d.length && h.percentUploaded < 1){
                        Ext.getCmp('voltprogressbar').show();
                        Ext.getCmp('voltprogressbar').updateProgress( (kkk/d.length) + (h.percentUploaded*100), kkk+'.'+h.percentUploaded*100+' out of 100', true );
                    }else{
                        Ext.getCmp('voltprogressbar').updateProgress( 1, 'Upload Compleated', true );
                        Ext.getCmp('voltprogressbar').hide();
                    }
                }
             var x = Taco.core.util.UploadManager.events.complete.listeners[0]
             x.fireFn = function(h) {
                 Ext.getCmp('voltprogressbar').hide();
                 ImagNameField.setValue(h.document.data.url);
                 Ext.getCmp('hrRuleForms').updatePreview();
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
     }
 });


