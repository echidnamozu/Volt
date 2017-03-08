Ext.widget({
   xtype:'mz-form-entity' ,
   layout:{
       type:'vbox',
       align:'stretch'
   },
   items:[
       {
           name:'DisplayText',
           xtype:'mz-input-text',
           fieldLabel: 'Display Text'
       }, 
        {
           name:'Code',
           xtype:'mz-input-text',
           fieldLabel: 'code', 
         
       },
       {
           name:'ImageUrl',
           xtype:'mz-input-text',
           fieldLabel: 'Image Url'
       },
       {
           name:'Description',
           xtype:'mz-input-richtext',
           fieldLabel: 'Description' 
       },
       {
           name:'MostPopular',
           xtype:'mz-input-checkbox',
           fieldLabel: 'MostPopular' 
       }
       ]
  
});


