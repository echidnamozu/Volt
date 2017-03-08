Ext.widget({
   xtype:'mz-form-entity' ,
   layout:{
       type:'vbox',
       align:'stretch'
   },
   items:[    
       {
           name:'Method',
           xtype:'mz-input-text',
           fieldLabel: 'Shipping Method'
       }, 
        {
           name:'MaxWeight',
           xtype:'mz-input-text',
           fieldLabel: 'Max Weight'
       },
       {
           name:'MinWeight',
           xtype:'mz-input-text',
           fieldLabel: 'Min Weight'
       },
       {
           name:'MarkupDoller',
           xtype:'mz-input-text',
           fieldLabel: 'Dollar'
       }, 
       {
           name:'MarkupPercentage', 
           xtype:'mz-input-text',
           fieldLabel: 'Percentage'
       },
       {
           name:'BackupBaseAmount',
           xtype:'mz-input-text',
           fieldLabel: 'Backup BaseAmount'
       },
       {
           name:'BackupPerPoundAmount',
           xtype:'mz-input-text',
           fieldLabel: 'Backup Per PoundAmount'
       }
       ]
  
});




