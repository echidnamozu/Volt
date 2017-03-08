
Ext.define('Ext.form.ClosableFieldSet', {
    extend: 'Ext.form.FieldSet',
    alias: 'widget.closablefieldset',
     listeners: {
        beforecollapse : function(p) {
        if (this.ownerCt) {
            //alert(Ext.getCmp("faqWidget").getIndex(this,this.ownerCt));
            if(confirm("Are You Sure do you want to delete this?")){
            if(Ext.getCmp("faqWidget").getIndex(this,this.ownerCt)>=0){
               Ext.getCmp("faqWidget").delItemCategory(Ext.getCmp("faqWidget").getIndex(this,this.ownerCt)); 
               this.ownerCt.remove(this, true);
            }
            }
           }
            return false;
        }
    }
});
Ext.define('Ext.window.faqEdit',{
    extend:'Ext.window.Window',
    alias: 'faqeditwindow',
    width:600,
    height:500,
    modal: true,
    autoScroll: true,
    closable:true
});
Ext.widget({
	xtype   : 'mz-form-widget',
	itemId: 'faqWidget',
	id:"faqWidget",
    listeners:{
        'render':function(){
            console.log("load final");
            console.log("loadadaa "+Ext.getCmp('categoryData').getValue().length);
             for(var i=0;i<Ext.getCmp('categoryData').getValue().length;i++){
                if(Ext.getCmp('categoryData').getValue()[i].Category != undefined){
                    Ext.getCmp('faqWidget').addItemCategory(Ext.getCmp('categoryData').getValue()[i].Category);
                }
             }
            
                },afterlayout:function(){
                 var newStyles = {};
                    newStyles['background']="url('/resources/images/close.png') #f12424";
                    newStyles['background-size']="cover";
                    var citems = Ext.query('.x-fieldset-header');
                    Ext.each(citems, function (item) {
                        item = Ext.get(item);
                        item.applyStyles(newStyles);
                    });
                }
            },
	 defaults: {
            xtype: 'textfield',
            listeners: {
                controller: '',
                change: function (cmp) {
                    controller = cmp;            
                }
            }
        },
	items: [{
			xtype: "button",
			itemId: "addFaqBtn",
			text: "<div style='color: black'>Add New FAQ Category</div>", 
            margin:'20 0 20 0',
			 handler: function() {
			    Ext.Msg.prompt("Add New","Please Enter New Category Name",function(btn,newCat){
    			    if(newCat!=""){
    			    	console.log("New val "+newCat);
    			    	Ext.getCmp('faqWidget').addNewCategory(newCat);
    			    }
                });
			
			}
		},
		{
            xtype: 'form',
            itemId: 'preview',
            id:"preview",
			height: 300,
			autoWidth:true,
			title: 'Avaiable FAQ Section',
			autoScroll: true
		},{
            xtype       : "taco-arrayField",
            name        : "data",
            itemId      : "categoryData",
            id          : "categoryData",
            width       : '1%',
            hidden      : true
        },{
            xtype       : "taco-arrayField",
            name        : "dataConfig",
            itemId      : "contactData",
            id          : "contactData",
            width       : '1%',
            hidden      : true
        }
    ],
    addNewCategory:function(newItem){
    	var arrayData = Ext.getCmp('categoryData');
        if(arrayData.getValue().length > 0){
            var arr = arrayData.getValue();
            arr.push({"Category":newItem,"Questions":[],"head":""});
            arrayData.setValue(arr);
        }else{
            var fir={"Category":newItem,"Questions":[],"head":""};
            arrayData.setValue(fir);
        }
	   Ext.getCmp('faqWidget').addItemCategory(newItem);
    },
    addItemCategory:function(newItem){
            Ext.getCmp('preview').add(Ext.widget('closablefieldset',{
            columnWidth: 0.5,
            title: '',
            collapsible: true,
            defaults: { anchor: '100%'},
            layout: 'anchor',
            items: [
                {
                    xtype: 'textfield',
                    allowBlank: false,
                    value: newItem,
                    maxWidth:'50%',
                    listeners: {
                       'render': function(cmp) { cmp.getEl().on('click', function(){
                       // alert(cmp.getEl().getProp("value"));
                            Ext.Msg.prompt("Edit Value","Update the new value :",function(btn,newtext){
                                if(btn=="ok" && cmp.getValue()!=newtext){
                                    cmp.setValue(newtext);
                                    Ext.getCmp("faqWidget").updateItemCategory((Ext.getCmp("faqWidget").getIndex(cmp.up("closablefieldset"),cmp.up("closablefieldset").ownerCt)),newtext);
                                }
                            },this,false,cmp.getValue());
                       }); 
                   }
                    }
                },{
                    xtype:"button",
                    cls: "btn-fn",
                    margin:"5 0 5 0",
                    text:"<div style='color: black'>Add / Edit / Delete Questions in this section </div>",
                    handler:function(){

                        var cidx=Ext.getCmp("faqWidget").getIndex(this.up("closablefieldset"),this.up("closablefieldset").ownerCt);
                        var arrayData = Ext.getCmp('categoryData');
                        var arr = arrayData.getValue();
                         Ext.getCmp("faqWidget").listAllQuestion(cidx,arr[cidx].Category);
                    }
                }           
            ]
        }));
        Ext.getCmp('preview').doLayout();
    },delItemCategory:function(delIdx){
        var arrayData = Ext.getCmp('categoryData');
        if(arrayData.getValue().length > 0){
            var arr = arrayData.getValue();
            arr.splice(delIdx, 1);
            arrayData.setValue(arr);
        }
        console.log("after del");
        for(var i=0;i<arrayData.getValue().length;i++){
            console.log(arrayData.getValue()[i].Category);
        }
    },
    updateItemCategory:function(index,newVal){
        var arrayData = Ext.getCmp('categoryData');
        var arr = arrayData.getValue();
        arr[index].Category=newVal;
        arrayData.setValue(arr);
    },
    listAllQuestion:function(cidx,ctext){
       // alert(cidx);
        Ext.create('faqeditwindow', {
            title: 'Avaiable Questions in '+ctext+' section',
            id:"faqEditBox",
            modal:true,
            cindex:cidx,
            bodyPadding:10,
            items:[
                    {
                    xtype: 'form',
                    itemId: 'previewlist',
                    id:"previewlist",
                    height: 300,
                    autoWidth:true,
                   // title: 'Avaiable Questions in '+ctext+' section',
                    autoScroll: true,
                    items:[ {
                    xtype:"button",
                    text:"<div style='color:black;'>Add New Questions</div>",
                    maxWidth:140,
                    maxHeight:30,
                    margin:'20 0 20 30',
                    handler:function(){
                       //alert(Ext.getCmp('faqEditBox').cindex);
                       Ext.getCmp('faqWidget').showQuestionAdd();
                        }
                    },{
                        xtype:"button",
                        text:"<div style=color:#000;>Add/Edit Section header </div>",
                        margin:"10",
                        handler:function(){
                            var arrayData = Ext.getCmp('categoryData');
                             var arr = arrayData.getValue();
                            Ext.Msg.prompt("FAQ","Enter the header for this Section",function(btn,newtext){
                                if(btn=="ok"){
                                    arr[Ext.getCmp("faqEditBox").cindex].head=newtext;
                                    arrayData.setValue(arr);
                                   // alert("Done");
                                    //Ext.getCmp('faqEditBox').addQuestionToView(ques);
                                }
                            },this,false,arr[Ext.getCmp("faqEditBox").cindex].head);
                        }
                    },{
                xtype: 'grid',
                    defaults: { anchor: '100%'},
                    layout:"anchor",
                    width:"100%",
                    selrow:0,
                    flag:false,
                    dragpid:1,
                    //autoScroll: true,
                    height:450,
                    id:"gridpan",
                    overflowY: 'auto',
                     store: {
                        fields: ['qus']
                    },
                    columns: [
                        {header:'Questions',dataIndex:'qus',flex:2},{
                            xtype:'actioncolumn',
                            width:60,flex:1,menuDisabled:true,sortable:false,
                            items: [{
                              icon: '/resources/images/edit-btn-icon.png',
                                tooltip: 'Edit/Delete Question',
                                margin:"10",
                                handler: function(grid, rowIndex, colIndex) {
                                    //alert("Edit " +rowIndex);
                                     Ext.getCmp('faqWidget').showEditQuestion(Ext.getCmp("faqEditBox").cindex,rowIndex);
                                }
                            }]
                        }
                    ]
            }
                 ]
                }            
            ],
            addQuestion:function(ques,ans){
                //alert(ans);
                var arrayData = Ext.getCmp('categoryData');
                var arr = arrayData.getValue();
                arr[Ext.getCmp("faqEditBox").cindex].Questions.push({"qus":ques,"ans":ans});
                arrayData.setValue(arr);
                Ext.getCmp('faqEditBox').addQuestionToView(ques);
            },
            addQuestionToView:function(ques){
                Ext.getCmp("gridpan").getStore().add( { 'qus':ques});
                /*Ext.getCmp('previewlist').add(Ext.widget('closablefieldset',{
                columnWidth: 0.5,
                title: '',
                collapsible: false,
            defaults: { anchor: '100%'},
                layout: 'anchor',
                items: [
                    {
                        xtype: 'textfield',
                        allowBlank: false,
                        value: ques,
                        readOnly:true,
                        autoWidth:true,
                        listeners:{
                             'render': function(cmp) { 
                                cmp.getEl().on('click', function(){
                                    //alert(cmp.up("closablefieldset"));
                                    var qidx=Ext.getCmp('faqWidget').getIndex(cmp.up("closablefieldset"),cmp.up('closablefieldset').ownerCt);
                                    Ext.getCmp('faqWidget').showEditQuestion(Ext.getCmp("faqEditBox").cindex,qidx);
                                 });
                         }
                        }
                    }
                    ]}));*/
            },
            listeners:{
                render:function(){
                    var arrayData = Ext.getCmp('categoryData');
                    var arr = arrayData.getValue();
                    for(var i=0;i<arr[Ext.getCmp("faqEditBox").cindex].Questions.length;i++){
                        console.log(" Ques "+arr[Ext.getCmp("faqEditBox").cindex].Questions[i].qus);
                        Ext.getCmp('faqEditBox').addQuestionToView(arr[Ext.getCmp("faqEditBox").cindex].Questions[i].qus);
                    }
                }
            }
        }).show();
    },updateQuestion:function(cidx,qidx,nqus,nans){
        console.log(cidx+" "+qidx+" "+nqus+" "+nans);
                var arrayData = Ext.getCmp('categoryData');
                var arr = arrayData.getValue();
                arr[cidx].Questions[qidx].qus=nqus;
                arr[cidx].Questions[qidx].ans=nans;
                arrayData.setValue(arr);
                var models=Ext.getCmp("gridpan").getStore().getRange();
                models[qidx].set("qus",nqus);
                //Ext.getCmp("previewlist").items.getAt(qidx+1).down("textfield").setValue(nqus);
                console.log("updated..!");
            },
        deleteQuestion:function(cidx,qidx){
            var arrayData = Ext.getCmp('categoryData');
            var arr = arrayData.getValue();
            arr[cidx].Questions.splice(qidx,1);
            arrayData.setValue(arr);
            //this.ownerCt.remove(this, true);
            Ext.getCmp("previewlist").remove(Ext.getCmp("previewlist").items.getAt(qidx),true);
            console.log("del "+qidx);
             Ext.getCmp("gridpan").getStore().removeAt(qidx);
            console.log("deleted..!");
        },showQuestionAdd:function(){
            Ext.create('faqeditwindow', {
                title: 'Add New Question',
                id:"faqAddQuestion",
                columnWidth: 0.5,
                bodyPadding:10,
                collapsible: false,
                defaults: { anchor: '100%'},
                layout: 'anchor',
                modal:true,
                autoWidth:true,
                items:[{
                    xtype:"textfield",
                    id:"EQuestion",
                    autoWidth:true,
                    allowBlank:false,
                    fieldLabel:"Question"
                 },{
                    xtype:"mz-input-textarea",
                    autoWidth:true,
                    id:"EAnswer",
                    allowBlank:false,
                    height:300,
                    fieldLabel:"Answer "
                 },{
                    xtype:"button",
                    text:"<div style='color:black;'>Save</div>",
                    width:100,
                    height:40,
                    handler:function(){
                        if(Ext.getCmp('EQuestion').getValue!="" && Ext.getCmp("EAnswer").getValue()!=""){                        
                            Ext.getCmp('faqEditBox').addQuestion(Ext.getCmp('EQuestion').getValue(),Ext.getCmp('EAnswer').getValue());
                            this.ownerCt.destroy();
                        }else{
                            Ext.Msg.alert("Warning","Please Enter the Question and Answer");
                        }
                    }
                 }
                ]
        }).show();
    },
    showEditQuestion:function(cidx,qidx){
        Ext.create('faqeditwindow', {
                title: 'Edit Box',
                id:"faqEditQuestion",
                modal:true,
                autoWidth:true,
                cindex:cidx,
                qindex:qidx,
                bodyPadding:5,
            defaults: { anchor: '100%'},
            layout: 'anchor',
                listeners:{
                    afterlayout:function(){
                        var arrayData = Ext.getCmp('categoryData');
                        var arr = arrayData.getValue();
                        console.log(" cli "+qidx);
                      //  alert(this.down("textfield").getValue());
                        this.down("textfield").setValue(arr[cidx].Questions[qidx].qus);
                         this.down("mz-input-textarea").setValue(arr[cidx].Questions[qidx].ans);
                        //console.log("done");
                    },
                     'keyup':function(field, event){
                        console.log("eve "+event.getKey());
                     }
                },
                items:[{
                    xtype:"textfield",
                    id:"EdQuestion",
                    autoWidth:true,
                    allowBlank:false,
                    value:'sdq',
                    readOnly:false,
                    fieldLabel:"Question"
                 },{
                    xtype:"mz-input-textarea",
                    autoWidth:true, 
                    id:"EdAnswer",
                    allowBlank:false,
                    height:250,
                    fieldLabel:"Answer " 
                 },{
                    xtype:"button",
                    text:"<div style='color:black;'>Update</div>",
                    width:100,
                    height:40,
                    handler:function(){
                      //  alert(Ext.getCmp('faqEditQuestion').cindex);
                        //Ext.getCmp('faqEditBox').addQuestion(Ext.getCmp('EQuestion').getValue(),Ext.getCmp('EAnswer').getValue());
                        if(Ext.getCmp('EdQuestion').getValue!="" && Ext.getCmp("EdAnswer").getValue()!=""){                        
                            Ext.getCmp('faqWidget').updateQuestion(Ext.getCmp('faqEditQuestion').cindex,Ext.getCmp('faqEditQuestion').qindex,Ext.getCmp('EdQuestion').getValue(),Ext.getCmp('EdAnswer').getValue());
                        this.ownerCt.destroy();
                        }else{
                            Ext.Msg.alert("Warning","Please Enter the Question and Answer");
                        }
                       
                    }
                },{
                        xtype:'button',
                        text:"<div style='color:black;'>Delete</div>",
                        width:100,
                        height:40,
                        margin:'10 0 10 0',
                        handler:function(){
                             Ext.getCmp('faqWidget').deleteQuestion(Ext.getCmp('faqEditQuestion').cindex,Ext.getCmp('faqEditQuestion').qindex);
                             this.ownerCt.destroy();
                        }
                    }
                ]
        }).show();

    },getIndex:function(element,owner){
      if( typeof(element.sourceIndex)!="undefined" )
       return element.sourceIndex;
      for (var i=0; i<owner.items.length; i++)
        if (element == owner.items.getAt(i))
          return i;
      return -1;
    }
});
